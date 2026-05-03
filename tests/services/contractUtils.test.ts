import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import {
    ERROR_MESSAGES,
    withRetry,
    validateContract,
    buildPayload,
} from '../../services/contract/contractUtils';
import type { Contract } from '../../types';

vi.mock('../../lib/dataClient', () => ({
    dataClient: { from: vi.fn(), rpc: vi.fn(), auth: { getUser: vi.fn().mockResolvedValue({ data: { user: null } }) } },
}));
vi.mock('../../services/auditLogService', () => ({
    AuditLogService: { create: vi.fn().mockResolvedValue(null) },
}));

// ─── ERROR_MESSAGES ─────────────────────────────────────────────────────────
describe('ERROR_MESSAGES', () => {
    it('has all required error keys', () => {
        expect(ERROR_MESSAGES.FETCH_FAILED).toBeTruthy();
        expect(ERROR_MESSAGES.NOT_FOUND).toBeTruthy();
        expect(ERROR_MESSAGES.CREATE_FAILED).toBeTruthy();
        expect(ERROR_MESSAGES.UPDATE_FAILED).toBeTruthy();
        expect(ERROR_MESSAGES.DELETE_FAILED).toBeTruthy();
        expect(ERROR_MESSAGES.VALIDATION_ERROR).toBeTruthy();
        expect(ERROR_MESSAGES.NETWORK_ERROR).toBeTruthy();
        expect(ERROR_MESSAGES.DUPLICATE_ID).toBeTruthy();
        expect(ERROR_MESSAGES.PERMISSION_DENIED).toBeTruthy();
    });
});

// ─── validateContract ────────────────────────────────────────────────────────
describe('validateContract', () => {
    describe('when isCreate = true', () => {
        it('requires contractCode', () => {
            const errors = validateContract({ title: 'Test', unitId: 'u1' }, true);
            expect(errors).toContain('Mã hợp đồng là bắt buộc');
        });

        it('requires title', () => {
            const errors = validateContract({ contractCode: 'C-001', unitId: 'u1' }, true);
            expect(errors).toContain('Tiêu đề hợp đồng là bắt buộc');
        });

        it('requires unitId', () => {
            const errors = validateContract({ contractCode: 'C-001', title: 'Test' }, true);
            expect(errors).toContain('Đơn vị là bắt buộc');
        });

        it('returns empty array for valid create data', () => {
            const errors = validateContract({
                contractCode: 'C-001',
                title: 'Hợp đồng test',
                unitId: 'unit-1',
            }, true);
            expect(errors).toEqual([]);
        });

        it('rejects empty string contractCode (whitespace only)', () => {
            const errors = validateContract({ contractCode: '   ', title: 'Test', unitId: 'u1' }, true);
            expect(errors).toContain('Mã hợp đồng là bắt buộc');
        });

        it('rejects empty string title (whitespace only)', () => {
            const errors = validateContract({ contractCode: 'C-001', title: '  ', unitId: 'u1' }, true);
            expect(errors).toContain('Tiêu đề hợp đồng là bắt buộc');
        });
    });

    describe('when isCreate = false (default)', () => {
        it('does not require contractCode for updates', () => {
            const errors = validateContract({ title: 'Updated' });
            expect(errors).not.toContain('Mã hợp đồng là bắt buộc');
        });

        it('does not require title for updates', () => {
            const errors = validateContract({ contractCode: 'C-001' });
            expect(errors).not.toContain('Tiêu đề hợp đồng là bắt buộc');
        });
    });

    describe('value validation', () => {
        it('rejects negative value', () => {
            const errors = validateContract({ value: -1 });
            expect(errors).toContain('Giá trị hợp đồng không được âm');
        });

        it('accepts zero value', () => {
            const errors = validateContract({ value: 0 });
            expect(errors).not.toContain('Giá trị hợp đồng không được âm');
        });

        it('accepts positive value', () => {
            const errors = validateContract({ value: 1000000 });
            expect(errors).not.toContain('Giá trị hợp đồng không được âm');
        });
    });

    describe('date validation', () => {
        it('rejects signedDate after endDate', () => {
            const errors = validateContract({
                signedDate: '2025-12-31',
                endDate: '2025-01-01',
            });
            expect(errors).toContain('Ngày ký không được sau ngày kết thúc');
        });

        it('accepts signedDate before endDate', () => {
            const errors = validateContract({
                signedDate: '2025-01-01',
                endDate: '2025-12-31',
            });
            expect(errors).not.toContain('Ngày ký không được sau ngày kết thúc');
        });

        it('accepts equal signedDate and endDate', () => {
            const errors = validateContract({
                signedDate: '2025-06-15',
                endDate: '2025-06-15',
            });
            expect(errors).not.toContain('Ngày ký không được sau ngày kết thúc');
        });

        it('skips date validation when only one date is provided', () => {
            const errors1 = validateContract({ signedDate: '2025-01-01' });
            expect(errors1).not.toContain('Ngày ký không được sau ngày kết thúc');

            const errors2 = validateContract({ endDate: '2025-12-31' });
            expect(errors2).not.toContain('Ngày ký không được sau ngày kết thúc');
        });
    });

    describe('multiple errors', () => {
        it('collects multiple validation errors', () => {
            const errors = validateContract({ value: -1, signedDate: '2025-12-31', endDate: '2025-01-01' }, true);
            expect(errors.length).toBeGreaterThanOrEqual(3); // contractCode, title, unitId, value, date
        });
    });
});

// ─── buildPayload ─────────────────────────────────────────────────────────────
describe('buildPayload', () => {
    describe('field mapping', () => {
        it('maps contractCode → contract_code', () => {
            const payload = buildPayload({ contractCode: 'C-001' });
            expect(payload.contract_code).toBe('C-001');
        });

        it('maps title → title', () => {
            const payload = buildPayload({ title: 'My Contract' });
            expect(payload.title).toBe('My Contract');
        });

        it('maps unitId → unit_id', () => {
            const payload = buildPayload({ unitId: 'unit-1' });
            expect(payload.unit_id).toBe('unit-1');
        });

        it('maps salespersonId → employee_id', () => {
            const payload = buildPayload({ salespersonId: 'emp-1' });
            expect(payload.employee_id).toBe('emp-1');
        });

        it('maps status → status', () => {
            const payload = buildPayload({ status: 'Processing' } as any);
            expect(payload.status).toBe('Processing');
        });

        it('maps signedDate → signed_date', () => {
            const payload = buildPayload({ signedDate: '2025-01-01' });
            expect(payload.signed_date).toBe('2025-01-01');
        });

        it('maps startDate → start_date', () => {
            const payload = buildPayload({ startDate: '2025-02-01' });
            expect(payload.start_date).toBe('2025-02-01');
        });

        it('maps endDate → end_date', () => {
            const payload = buildPayload({ endDate: '2025-12-31' });
            expect(payload.end_date).toBe('2025-12-31');
        });

        it('maps value → value', () => {
            const payload = buildPayload({ value: 1000000 });
            expect(payload.value).toBe(1000000);
        });

        it('maps hasVat → has_vat', () => {
            const payload = buildPayload({ hasVat: true });
            expect(payload.has_vat).toBe(true);
        });

        it('maps vatRate → vat_rate', () => {
            const payload = buildPayload({ vatRate: 10 });
            expect(payload.vat_rate).toBe(10);
        });

        it('does NOT include fields with undefined values', () => {
            const payload = buildPayload({ contractCode: 'C-001' });
            expect(Object.keys(payload)).not.toContain('title');
        });
    });

    describe('JSONB details field', () => {
        it('builds details when lineItems is provided', () => {
            const lineItems = [{ id: 'li1', name: 'Item', quantity: 1, inputPrice: 100, outputPrice: 200, directCosts: 0, directCostDetails: [], vatRate: 10, supplier: '' }];
            const payload = buildPayload({ lineItems });
            expect(payload.details).toBeDefined();
            expect((payload.details as any).lineItems).toEqual(lineItems);
        });

        it('builds details when executionCosts is provided and computes estimated_cost', () => {
            const lineItems = [{ id: 'li1', name: 'Item', quantity: 2, inputPrice: 500, outputPrice: 1000, directCosts: 50, directCostDetails: [], vatRate: 10, supplier: '' }];
            const executionCosts = [{ id: 'ec1', name: 'Travel', amount: 200 }];
            const payload = buildPayload({ lineItems, executionCosts } as any);
            // inputSum = 500*2 + 50 = 1050; execSum = 200; total = 1250
            expect(payload.estimated_cost).toBe(1250);
        });

        it('uses empty arrays when details fields are missing', () => {
            const payload = buildPayload({ lineItems: [] } as any);
            expect((payload.details as any).executionCosts).toEqual([]);
        });

        it('does NOT include details when no JSONB fields present', () => {
            const payload = buildPayload({ contractCode: 'C-001', title: 'Test' });
            expect(payload.details).toBeUndefined();
        });
    });

    describe('unitAllocations', () => {
        it('maps unitAllocations to unit_allocations wrapped in { allocations }', () => {
            const allocs = [{ unitId: 'u1', percent: 100, role: 'lead', employeeId: 'e1' }];
            const payload = buildPayload({ unitAllocations: allocs } as any);
            expect(payload.unit_allocations).toEqual({ allocations: allocs });
        });

        it('sets unit_allocations to null when empty', () => {
            const payload = buildPayload({ unitAllocations: null } as any);
            expect(payload.unit_allocations).toBeNull();
        });
    });

    describe('employeeAllocations', () => {
        it('maps employeeAllocations to employee_allocations', () => {
            const allocs = [{ employeeId: 'e1', percent: 100, role: 'lead' }];
            const payload = buildPayload({ employeeAllocations: allocs } as any);
            expect(payload.employee_allocations).toEqual(allocs);
        });

        it('sets employee_allocations to null when falsy', () => {
            const payload = buildPayload({ employeeAllocations: null } as any);
            expect(payload.employee_allocations).toBeNull();
        });
    });

    describe('workflowSteps', () => {
        it('maps workflowSteps to workflow_steps', () => {
            const steps = [{ id: 'ws1', type: 'approval' }];
            const payload = buildPayload({ workflowSteps: steps } as any);
            expect(payload.workflow_steps).toEqual(steps);
        });

        it('sets workflow_steps to null when falsy', () => {
            const payload = buildPayload({ workflowSteps: null } as any);
            expect(payload.workflow_steps).toBeNull();
        });
    });
});

// ─── withRetry ───────────────────────────────────────────────────────────────
describe('withRetry', () => {
    // Use real timers for withRetry — delays are 0ms in tests via maxRetries=1

    it('returns result on first successful attempt', async () => {
        const op = vi.fn().mockResolvedValue('success');
        const result = await withRetry(op, 3, 0);
        expect(result).toBe('success');
        expect(op).toHaveBeenCalledTimes(1);
    });

    it('retries on failure and succeeds on second attempt', async () => {
        const op = vi.fn()
            .mockRejectedValueOnce(new Error('transient error'))
            .mockResolvedValue('ok');

        const result = await withRetry(op, 3, 0);
        expect(result).toBe('ok');
        expect(op).toHaveBeenCalledTimes(2);
    });

    it('does NOT retry on VALIDATION error', async () => {
        const err = new Error('VALIDATION_ERROR: Mã hợp đồng là bắt buộc');
        const op = vi.fn().mockRejectedValue(err);

        await expect(withRetry(op, 3, 0)).rejects.toThrow('VALIDATION_ERROR');
        expect(op).toHaveBeenCalledTimes(1);
    });

    it('does NOT retry on permission error', async () => {
        const err = new Error('permission denied');
        const op = vi.fn().mockRejectedValue(err);

        await expect(withRetry(op, 3, 0)).rejects.toThrow('permission denied');
        expect(op).toHaveBeenCalledTimes(1);
    });

    it('does NOT retry on duplicate key error (code 23505)', async () => {
        const err = Object.assign(new Error('duplicate key'), { code: '23505' });
        const op = vi.fn().mockRejectedValue(err);

        await expect(withRetry(op, 3, 0)).rejects.toThrow('duplicate key');
        expect(op).toHaveBeenCalledTimes(1);
    });

    it('throws after exhausting maxRetries=1 (no retries, immediate throw)', async () => {
        const err = new Error('immediate failure');
        const op = vi.fn().mockRejectedValue(err);

        // maxRetries=1 → only 1 attempt, no delay
        await expect(withRetry(op, 1, 0)).rejects.toThrow('immediate failure');
        expect(op).toHaveBeenCalledTimes(1);
    });

    it('throws NETWORK_ERROR message when lastError is null (edge case)', async () => {
        // This shouldn't happen in practice, but tests the fallback throw
        // Simulate by running withRetry with maxRetries=0 → loop body never runs → lastError = null
        // Actually maxRetries=0 means no attempts → throws fallback
        await expect(withRetry(vi.fn(), 0, 0)).rejects.toThrow(
            'Lỗi kết nối mạng'
        );
    });
});
