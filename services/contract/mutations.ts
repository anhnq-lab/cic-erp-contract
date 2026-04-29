/**
 * Contract Service — Mutations
 *
 * Create, update, delete, batchDelete, duplicate.
 * Extracted from contractService.ts (Phase 2 refactor).
 */

import { dataClient as supabase } from '../../lib/dataClient';
import { Contract } from '../../types';
import { TelegramNotificationService } from '../telegramNotificationService';
import { ContractTaskDefinitionService } from '../contractTaskDefinitionService';
import type { MilestoneBaseDateType } from '../contractTaskDefinitionService';

import { mapContract } from './contractMapper';
import {
    withRetry,
    validateContract,
    buildPayload,
    logOperation,
    ERROR_MESSAGES,
} from './contractUtils';
import { getById, exists } from './queries';

// ─────────────────────────────────────────────────────────────────────────────

/**
 * CREATE - Professional implementation with validation, retry, and audit
 */
export async function create(
    data: Contract & {
        workflowSteps?: unknown;
        customTasks?: Array<{ title: string; description?: string; [k: string]: unknown }>;
    }
): Promise<Contract> {
    // 1. Validate input
    const errors = validateContract(data, true);
    if (errors.length > 0) {
        throw new Error(`${ERROR_MESSAGES.VALIDATION_ERROR}\n${errors.join('\n')}`);
    }

    // 2. Build type-safe payload
    const payload = buildPayload(data);
    // Set id = contractCode for new contracts (backward compat with existing FKs)
    payload.id = data.contractCode || data.id;

    // 3. Execute with retry logic
    const result = await withRetry(async () => {
        const { data: res, error } = await supabase
            .from('contracts')
            .insert(payload)
            .select()
            .single();

        if (error) {
            // Handle specific error codes
            if (error.code === '23505') {
                throw new Error(ERROR_MESSAGES.DUPLICATE_ID);
            }
            if (error.code === '42501') {
                throw new Error(ERROR_MESSAGES.PERMISSION_DENIED);
            }
            console.error('ContractService.create:', error.message);
            throw new Error(ERROR_MESSAGES.CREATE_FAILED);
        }

        return res;
    });

    // 4. Auto-create Business Plan (PAKD) for Workflow
    try {
        const financials = {
            revenue: data.value || 0,
            costs: data.estimatedCost || 0,
            grossProfit: (data.value || 0) - (data.estimatedCost || 0),
            margin: data.value ? (((data.value - data.estimatedCost) / data.value) * 100) : 0,
            cashflow: data.paymentPhases || []
        };

        const user = (await supabase.auth.getUser()).data.user;

        await supabase.from('contract_business_plans').insert({
            contract_id: result.id,
            version: 1,
            status: 'Approved', // Auto-approved - PAKD workflow temporarily disabled
            financials: financials,
            is_active: true,
            created_by: user?.id
        });
    } catch (planError) {
        console.warn("[ContractService.create] Failed to auto-create PAKD:", planError);
    }

    // 4.5. Save task definitions from Step 4 (Milestone-Triggered Task System)
    try {
        const user = (await supabase.auth.getUser()).data.user;
        const rawUnitId = data.unitId || result.unit_id;
        const spaceId = (rawUnitId && rawUnitId !== 'all') ? rawUnitId : undefined;

        // A. Workflow-driven tasks (from checkbox system)
        if (data.workflowSteps) {
            await ContractTaskDefinitionService.generateFromWorkflow(
                result.id,
                data.workflowSteps,
                {
                    lineItems: data.lineItems || [],
                    salespersonId: data.salespersonId || result.employee_id || '',
                    unitId: rawUnitId || '',
                    createdBy: user?.id,
                }
            );
        }

        // B. Manual custom tasks (legacy + manual add-ons)
        if (data.customTasks && data.customTasks.length > 0) {
            await ContractTaskDefinitionService.bulkCreate(
                data.customTasks.map((taskDef, idx) => ({
                    contract_id: result.id,
                    title: taskDef.title,
                    description: taskDef.description || '',
                    assignees: taskDef.assignees || [],
                    priority: 'medium',
                    base_date_type: (taskDef.base_date_type || 'signed_date') as MilestoneBaseDateType,
                    duration_days: taskDef.duration_days || 0,
                    origin: 'manual' as const,
                    sort_order: 100 + idx, // manual tasks after workflow tasks
                    created_by: user?.id,
                }))
            );
        }

        // C. Activate tasks whose milestones already exist (signed_date, current_date)
        await ContractTaskDefinitionService.checkAndActivateAll(
            result.id,
            {
                signed_date: data.signedDate || result.signed_date,
                handover_date: result.handover_date,
                acceptance_date: result.acceptance_date,
                completed_date: result.completed_date,
                status: result.status,
            },
            spaceId
        );
    } catch (err) {
        console.warn("[ContractService.create] Failed to save task definitions:", err);
    }

    // 5. Log audit
    await logOperation('CREATE', result.id, payload);

    // 6. Telegram notification (fire-and-forget)
    TelegramNotificationService.notifyContractChange({
        eventType: 'created',
        contractTitle: data.title || data.contractCode || data.id,
        contractId: result.id,
        value: data.value,
        changedBy: (await supabase.auth.getUser()).data.user?.email || undefined,
    }).catch(() => { }); // Silent

    const mapped = mapContract(result);

    // 7. Notify UI components to refresh lists
    if (typeof window !== 'undefined') {
        window.dispatchEvent(new CustomEvent('contract-created', {
            detail: { contractId: result.id, contract: mapped }
        }));
    }

    return mapped;
}

// ─────────────────────────────────────────────────────────────────────────────

/**
 * UPDATE - Professional implementation with partial update support
 */
export async function update(
    id: string,
    data: Partial<Contract> & {
        workflowSteps?: unknown;
        customTasks?: Array<{ title: string; description?: string; [k: string]: unknown }>;
    }
): Promise<Contract | undefined> {
    // Fetch old data for detailed audit log
    const oldContract = await getById(id);
    const oldPayload = oldContract ? buildPayload(oldContract) : null;

    // 1. Validate
    if (!id) throw new Error(ERROR_MESSAGES.VALIDATION_ERROR);

    const errors = validateContract(data, false);
    if (errors.length > 0) {
        throw new Error(`${ERROR_MESSAGES.VALIDATION_ERROR}\n${errors.join('\n')}`);
    }

    // 2. Build payload (id is never updated — it's the PK used by all FK relationships)
    const payload = buildPayload(data);
    delete payload.id; // Never change the primary key

    if (Object.keys(payload).length === 0) {
        console.warn('[ContractService.update] No fields to update');
        return await getById(id);
    }

    // 3. Execute with retry
    const result = await withRetry(async () => {
        const { data: res, error } = await supabase
            .from('contracts')
            .update(payload)
            .eq('id', id)
            .select()
            .single();

        if (error) {
            if (error.code === 'PGRST116') {
                throw new Error(ERROR_MESSAGES.NOT_FOUND);
            }
            if (error.code === '42501') {
                throw new Error(ERROR_MESSAGES.PERMISSION_DENIED);
            }
            console.error('ContractService.update:', error.message);
            throw new Error(ERROR_MESSAGES.UPDATE_FAILED);
        }

        return res;
    });

    // 4. Log audit
    await logOperation('UPDATE', id, payload, oldPayload || undefined);

    // 4.5. Milestone-Triggered Task System hooks
    try {
        const rawUnitId = data.unitId || result.unit_id;
        const spaceId = (rawUnitId && rawUnitId !== 'all') ? rawUnitId : undefined;
        const user = (await supabase.auth.getUser()).data.user;

        // A. Workflow-driven tasks (from checkbox system)
        if (data.workflowSteps) {
            await ContractTaskDefinitionService.generateFromWorkflow(
                id,
                data.workflowSteps,
                {
                    lineItems: data.lineItems || [],
                    salespersonId: data.salespersonId || result.employee_id || '',
                    unitId: rawUnitId || '',
                    createdBy: user?.id,
                }
            );
        }

        // B. Manual custom tasks (legacy + manual add-ons)
        if (data.customTasks && data.customTasks.length > 0) {
            await ContractTaskDefinitionService.bulkCreate(
                data.customTasks.map((taskDef, idx) => ({
                    contract_id: id,
                    title: taskDef.title,
                    description: taskDef.description || '',
                    assignees: taskDef.assignees || [],
                    priority: 'medium',
                    base_date_type: (taskDef.base_date_type || 'signed_date') as MilestoneBaseDateType,
                    duration_days: taskDef.duration_days || 0,
                    origin: 'manual' as const,
                    sort_order: 100 + idx,
                    created_by: user?.id,
                }))
            );
        }

        // C. Detect contract status change → fire milestone hooks
        const oldStatus = oldContract?.status;
        const newStatus = data.status || result.status;
        if (oldStatus && newStatus && oldStatus !== newStatus) {
            const milestoneDate = (() => {
                switch (newStatus) {
                    case 'Handover': return data.handoverDate || result.handover_date;
                    case 'Acceptance': return data.acceptanceDate || result.acceptance_date;
                    case 'Completed': return data.completedDate || result.completed_date;
                    default: return null;
                }
            })();

            await ContractTaskDefinitionService.onContractStatusChange(
                id,
                newStatus,
                milestoneDate ? new Date(milestoneDate) : new Date(),
                {
                    creatorUserId: user?.id,
                    salespersonId: result.employee_id,
                    unitId: rawUnitId,
                    spaceId,
                }
            );
        }

        // D. Always check & activate any dormant tasks with available milestones
        await ContractTaskDefinitionService.checkAndActivateAll(
            id,
            {
                signed_date: data.signedDate || result.signed_date,
                handover_date: data.handoverDate || result.handover_date,
                acceptance_date: data.acceptanceDate || result.acceptance_date,
                completed_date: data.completedDate || result.completed_date,
                status: newStatus,
            },
            spaceId
        );
    } catch (err) {
        console.warn("[ContractService.update] Failed to process task definitions:", err);
    }

    // 5. Telegram notification (fire-and-forget)
    const mapped = mapContract(result);
    const isStatusChange = data.status && payload.status;
    TelegramNotificationService.notifyContractChange({
        eventType: isStatusChange ? 'status_changed' : 'updated',
        contractTitle: mapped.title || id,
        contractId: id,
        value: mapped.value,
        oldStatus: isStatusChange ? undefined : undefined, // old status not available here
        newStatus: isStatusChange ? data.status : undefined,
        changedFields: Object.keys(payload).filter(k => k !== 'updated_at'),
        changedBy: (await supabase.auth.getUser()).data.user?.email || undefined,
    }).catch(() => { });

    // 6. Notify UI components (ContractDetail) to refresh
    if (typeof window !== 'undefined') {
        window.dispatchEvent(new CustomEvent('contract-updated', {
            detail: { contractId: id, contract: mapped }
        }));
    }

    return mapped;
}

// ─────────────────────────────────────────────────────────────────────────────

/**
 * DELETE - Professional implementation with confirmation
 */
export async function deleteContract(id: string): Promise<boolean> {
    if (!id?.trim()) {
        throw new Error(ERROR_MESSAGES.VALIDATION_ERROR);
    }

    // Execute with retry
    await withRetry(async () => {
        const { error } = await supabase
            .from('contracts')
            .delete()
            .eq('id', id);

        if (error) {
            if (error.code === 'PGRST116') {
                throw new Error(ERROR_MESSAGES.NOT_FOUND);
            }
            if (error.code === '42501') {
                throw new Error(ERROR_MESSAGES.PERMISSION_DENIED);
            }
            console.error('ContractService.delete:', error.message);
            throw new Error(ERROR_MESSAGES.DELETE_FAILED);
        }
    });

    // Log audit
    await logOperation('DELETE', id);

    // Telegram notification (fire-and-forget)
    TelegramNotificationService.notifyContractChange({
        eventType: 'deleted',
        contractTitle: id,
        contractId: id,
        changedBy: (await supabase.auth.getUser()).data.user?.email || undefined,
    }).catch(() => { });

    // Notify UI components to refresh lists
    if (typeof window !== 'undefined') {
        window.dispatchEvent(new CustomEvent('contract-deleted', {
            detail: { contractId: id }
        }));
    }

    return true;
}

// ─────────────────────────────────────────────────────────────────────────────

/**
 * BATCH DELETE - Delete multiple contracts at once
 */
export async function batchDelete(ids: string[]): Promise<{ success: string[]; failed: string[] }> {
    const results = { success: [] as string[], failed: [] as string[] };

    if (!ids || ids.length === 0) return results;

    try {
        await withRetry(async () => {
            const { error } = await supabase
                .from('contracts')
                .delete()
                .in('id', ids);

            if (error) {
                console.error('ContractService.batchDelete:', error.message);
                throw new Error(ERROR_MESSAGES.DELETE_FAILED);
            }
        });

        results.success = [...ids];

        // Log audit asynchronously for all
        Promise.all(ids.map(id => logOperation('DELETE', id))).catch(console.error);

    } catch (error) {
        console.error('Batch delete failed:', error);
        results.failed = [...ids];
    }

    return results;
}

// ─────────────────────────────────────────────────────────────────────────────

/**
 * DUPLICATE - Clone an existing contract with new ID
 */
export async function duplicate(sourceId: string, newContractCode: string): Promise<Contract> {
    // 1. Fetch source contract
    const source = await getById(sourceId);
    if (!source) {
        throw new Error(ERROR_MESSAGES.NOT_FOUND);
    }

    // 2. Check if new contract code exists
    if (await exists(newContractCode)) {
        throw new Error(ERROR_MESSAGES.DUPLICATE_ID);
    }

    // 3. Create clone with new contract code and reset status
    const clone: Contract = {
        ...source,
        id: '', // Will be set by create method
        contractCode: newContractCode,
        status: 'Processing',
        stage: 'Signed',
        actualRevenue: 0,
        actualCost: 0,
        invoicedAmount: 0,
    };

    return await create(clone);
}
