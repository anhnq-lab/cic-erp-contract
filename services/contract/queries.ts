/**
 * Contract Queries — read-only operations.
 * Extracted from contractService.ts to enforce SRP.
 */

import { dataClient as supabase } from '../../lib/dataClient';
import { Contract } from '../../types';
import type { DbPayment } from '../../lib/db';
import { mapContract } from './contractMapper';
import { isAll, getUnitSharePct } from './contractFinancials';
import { ERROR_MESSAGES } from './contractUtils';
import { normalizeTag } from '../contractTagService';
import type { RawContract, EmpAlloc, UnitAlloc } from './contractTypes';

export async function findByTitle(title: string): Promise<Contract | null> {
    if (!title || title.trim().length < 3) return null;
    const { data, error } = await supabase
        .from('contracts')
        .select('*')
        .eq('title', title.trim())
        .limit(1)
        .maybeSingle();
    if (error || !data) return null;
    return mapContract(data);
}

export async function getAll(): Promise<Contract[]> {
    const { data, error } = await supabase
        .from('contracts')
        .select('*')
        .order('created_at', { ascending: false });

    if (error) {
        console.error('ContractService.getAll:', error.message);
        throw new Error(ERROR_MESSAGES.FETCH_FAILED);
    }
    return data.map(mapContract);
}

export async function getById(id: string): Promise<Contract | undefined> {
    if (!id) return undefined;

    const { data: contractData, error: contractError } = await supabase
        .from('contracts')
        .select('*, payments(amount, paid_amount, status, payment_type, voucher_type, vat_invoice_items, phase_id)')
        .eq('id', id)
        .single();

    if (contractError) {
        if (contractError.code === 'PGRST116') return undefined; // Not found
        console.error('ContractService.getById:', contractError.message);
        return undefined;
    }

    const contract = mapContract(contractData);

    // Sync payment phase statuses from actual payments
    const paymentsData = (contractData?.payments || []) as Pick<DbPayment, 'phase_id' | 'status'>[];

    if (paymentsData.length > 0 && contract.paymentPhases) {
        contract.paymentPhases = contract.paymentPhases.map(phase => {
            const linkedPayment = paymentsData.find((p) => p.phase_id === phase.id);
            if (linkedPayment) {
                let newStatus = phase.status;
                if (linkedPayment.status === 'Tiền về' || linkedPayment.status === 'Paid') {
                    newStatus = 'Paid';
                } else if (linkedPayment.status === 'Tạm ứng') {
                    newStatus = 'Advance';
                }
                return { ...phase, status: newStatus as typeof phase.status };
            }
            return phase;
        });
    }

    return contract;
}

export async function list(params: {
    page: number;
    limit: number;
    search?: string;
    status?: string;
    unitId?: string;
    year?: string;
    dateFrom?: string;
    dateTo?: string;
    salespersonId?: string;
    classification?: string;
    sortBy?: string;
    sortDir?: 'asc' | 'desc';
    matchingCustomerIds?: string[];
    filterByIds?: string[];
}): Promise<{ data: Contract[]; count: number }> {
    const { page, limit, search, status, unitId, year, dateFrom, dateTo, salespersonId, classification, sortBy, sortDir, matchingCustomerIds, filterByIds } = params;

    const quoteId = (id: string): string => /[,/()\s]/.test(id) ? `"${id}"` : id;
    const buildSearchFilter = (searchTerm: string, customerIds?: string[], unaccentIds?: string[]): string => {
        const safeTerm = searchTerm.replace(/\\/g, '\\\\').replace(/,/g, '\\,');
        let filter = `title.ilike.%${safeTerm}%,contract_code.ilike.%${safeTerm}%,party_a.ilike.%${safeTerm}%,customer_contract_number.ilike.%${safeTerm}%,content.ilike.%${safeTerm}%,end_user_name.ilike.%${safeTerm}%,category.ilike.%${safeTerm}%`;
        if (customerIds && customerIds.length > 0) {
            filter += `,customer_id.in.(${customerIds.map(quoteId).join(',')})`;
        }
        if (unaccentIds && unaccentIds.length > 0) {
            filter += `,id.in.(${unaccentIds.map(quoteId).join(',')})`;
        }
        return filter;
    };

    let unaccentMatchIds: string[] | undefined;
    if (search) {
        try {
            const { data: rpcData } = await supabase.rpc('search_contracts_ids_unaccent', { search_term: search });
            if (rpcData && rpcData.length > 0) {
                unaccentMatchIds = rpcData.map((r: { id: string }) => r.id);
            }
        } catch (e) {
            console.warn('[ContractService] unaccent search RPC failed, falling back to ilike:', e);
        }
    }

    const isSingleUnitFilter = !isAll(unitId) && !unitId!.includes(',');

    const SORT_MAP: Record<string, string> = {
        id: 'id', signedDate: 'signed_date', value: 'value',
        actualRevenue: 'actual_revenue', estimatedCost: 'estimated_cost',
        status: 'status', title: 'title', partyA: 'party_a',
        adminProfit: 'admin_profit', revProfit: 'rev_profit',
    };

    if (isSingleUnitFilter) {
        // === ALLOCATION-AWARE MODE ===
        let query = supabase
            .from('contracts')
            .select('*, payments(amount, paid_amount, status, payment_type, voucher_type, vat_invoice_items)');

        if (filterByIds && filterByIds.length > 0) query = query.in('id', filterByIds);
        if (search) query = query.or(buildSearchFilter(search, matchingCustomerIds, unaccentMatchIds));
        if (status && status !== 'All') query = query.eq('status', status);
        if (classification && classification !== 'All') query = query.eq('classification', classification);
        if (dateFrom || dateTo) {
            if (dateFrom) query = query.gte('signed_date', dateFrom);
            if (dateTo) query = query.lte('signed_date', dateTo);
        } else if (year && year !== 'All') {
            query = query.gte('signed_date', `${year}-01-01`).lte('signed_date', `${year}-12-31`);
        }

        const dbSortColumn = sortBy ? SORT_MAP[sortBy] : null;
        query = dbSortColumn
            ? query.order(dbSortColumn, { ascending: sortDir === 'asc' })
            : query.order('created_at', { ascending: false });

        const { data, error } = await query;
        if (error) throw error;

        const getEmployeePct = (c: RawContract, targetEmployeeId: string): number => {
            const empAllocs = (c.employee_allocations || []) as EmpAlloc[];
            if (empAllocs.length === 0) return c.employee_id === targetEmployeeId ? 100 : 0;
            const match = empAllocs.find((a) => a.employeeId === targetEmployeeId);
            if (match) return match.percent || 100;
            const unitAllocations = (c.unit_allocations?.allocations || []) as UnitAlloc[];
            const supportMatch = unitAllocations.find((a) => a.role === 'support' && a.employeeId === targetEmployeeId);
            if (supportMatch) return 100;
            return 0;
        };

        const filteredContracts: Contract[] = [];
        (data as RawContract[] || []).forEach((c) => {
            const allocationPct = getUnitSharePct(c, unitId!);
            if (allocationPct === 0) return;
            if (salespersonId && getEmployeePct(c, salespersonId) === 0) return;

            const isLeadUnit = c.unit_id === unitId;
            const mapped = mapContract(c) as Contract & { _allocationRole?: string; _allocationPct?: number; _employeePct?: number };
            mapped._allocationRole = isLeadUnit ? 'lead' : 'support';
            mapped._allocationPct = allocationPct;
            if (salespersonId) mapped._employeePct = getEmployeePct(c, salespersonId);
            filteredContracts.push(mapped);
        });

        const totalCount = filteredContracts.length;
        const from = (page - 1) * limit;
        return { data: filteredContracts.slice(from, from + limit), count: totalCount };

    } else {
        // === STANDARD MODE ===
        const from = (page - 1) * limit;
        const to = from + limit - 1;

        let query = supabase
            .from('contracts')
            .select('*, payments(amount, paid_amount, status, payment_type, voucher_type, vat_invoice_items)', { count: 'exact' });

        if (filterByIds && filterByIds.length > 0) query = query.in('id', filterByIds);
        if (search) query = query.or(buildSearchFilter(search, matchingCustomerIds, unaccentMatchIds));
        if (status && status !== 'All') query = query.eq('status', status);
        if (classification && classification !== 'All') query = query.eq('classification', classification);
        if (unitId && unitId !== 'All' && unitId !== 'all') {
            if (unitId.includes(',')) {
                query = query.in('unit_id', unitId.split(',').map(id => id.trim()));
            } else {
                query = query.eq('unit_id', unitId);
            }
        }
        if (dateFrom || dateTo) {
            if (dateFrom) query = query.gte('signed_date', dateFrom);
            if (dateTo) query = query.lte('signed_date', dateTo);
        } else if (year && year !== 'All') {
            query = query.gte('signed_date', `${year}-01-01`).lte('signed_date', `${year}-12-31`);
        }
        if (salespersonId) query = query.eq('employee_id', salespersonId);

        const dbSortColumn = sortBy ? SORT_MAP[sortBy] : null;
        query = dbSortColumn
            ? query.order(dbSortColumn, { ascending: sortDir === 'asc' })
            : query.order('created_at', { ascending: false });

        query = query.range(from, to);

        const { data, error, count } = await query;
        if (error) throw error;
        return { data: data.map(mapContract), count: count || 0 };
    }
}

export async function search(term: string, limit = 20): Promise<Contract[]> {
    const safeTerm = term.replace(/[%_\\]/g, '\\$&');
    const { data, error } = await supabase
        .from('contracts')
        .select('*')
        .or(`title.ilike.%${safeTerm}%,contract_code.ilike.%${safeTerm}%,party_a.ilike.%${safeTerm}%,customer_contract_number.ilike.%${safeTerm}%,content.ilike.%${safeTerm}%,end_user_name.ilike.%${safeTerm}%,category.ilike.%${safeTerm}%`)
        .order('signed_date', { ascending: false })
        .limit(limit);

    if (error) throw error;
    return data.map(mapContract);
}

export async function searchAuthorized(
    query: string,
    profile: { id: string; role?: string; role_code?: string; unit_id?: string },
    limit = 20
): Promise<Contract[]> {
    if (!query || query.length < 2) return [];

    let tagMatchIds: string[] = [];
    try {
        const safeTagQuery = normalizeTag(query);
        if (safeTagQuery.length > 0) {
            const { data: tagData } = await supabase
                .from('contract_tags')
                .select('contract_id')
                .eq('user_id', profile.id)
                .ilike('tag', `%${safeTagQuery}%`);
            if (tagData) tagMatchIds = tagData.map((r: { contract_id: string }) => r.contract_id);
        }
    } catch (e) {
        console.warn('[ContractService] searchAuthorized tag search failed:', e);
    }

    let unaccentMatchIds: string[] = [];
    try {
        const { data: rpcData } = await supabase.rpc('search_contracts_ids_unaccent', { search_term: query });
        if (rpcData && rpcData.length > 0) {
            unaccentMatchIds = rpcData.map((r: { id: string }) => r.id);
        }
    } catch (e) {
        console.warn('[ContractService] searchAuthorized unaccent RPC failed:', e);
    }

    const safeTerm = query.replace(/\\/g, '\\\\').replace(/,/g, '\\,').replace(/[%_]/g, '\\$&');
    const quoteId = (id: string) => /[,/()\s]/.test(id) ? `"${id}"` : id;
    const combinedIds = [...new Set([...tagMatchIds, ...unaccentMatchIds])];

    let orFilter = `title.ilike.%${safeTerm}%,contract_code.ilike.%${safeTerm}%,party_a.ilike.%${safeTerm}%,customer_contract_number.ilike.%${safeTerm}%,content.ilike.%${safeTerm}%,end_user_name.ilike.%${safeTerm}%,category.ilike.%${safeTerm}%`;
    if (combinedIds.length > 0) orFilter += `,id.in.(${combinedIds.map(quoteId).join(',')})`;

    const { data, error } = await supabase
        .from('contracts')
        .select('*, payments(amount, paid_amount, status, payment_type, voucher_type, vat_invoice_items)')
        .or(orFilter)
        .order('signed_date', { ascending: false });

    if (error) {
        console.error('[ContractService] searchAuthorized Error:', error);
        return [];
    }

    const isAdmin = profile?.role === 'Admin' || profile?.role === 'BOD';
    const userUnitId = profile?.unit_id;
    const userId = profile?.id;

    const getEmployeePct = (c: RawContract, targetEmployeeId: string): number => {
        const empAllocs = (c.employee_allocations || []) as EmpAlloc[];
        if (empAllocs.length === 0) return c.employee_id === targetEmployeeId ? 100 : 0;
        const match = empAllocs.find((a) => a.employeeId === targetEmployeeId);
        if (match) return match.percent || 100;
        const unitAllocations = (c.unit_allocations?.allocations || []) as UnitAlloc[];
        const supportMatch = unitAllocations.find((a) => a.role === 'support' && a.employeeId === targetEmployeeId);
        if (supportMatch) return 100;
        return 0;
    };

    const filteredContracts: Contract[] = [];
    for (const c of (data || [])) {
        const hasAccess = isAdmin
            || getUnitSharePct(c, userUnitId ?? 'all') > 0
            || getEmployeePct(c, userId) > 0;

        if (hasAccess) {
            filteredContracts.push(mapContract(c));
            if (filteredContracts.length >= limit) break;
        }
    }
    return filteredContracts;
}

export async function getLineItemSuggestions(unitId?: string): Promise<string[]> {
    try {
        let query = supabase
            .from('contracts')
            .select('details')
            .order('created_at', { ascending: false })
            .limit(200);

        if (unitId) query = query.eq('unit_id', unitId);

        const { data, error } = await query;
        if (error) throw error;

        const nameSet = new Set<string>();
        (data || []).forEach((c: { details: unknown }) => {
            const details = c.details as { lineItems?: Array<{ name?: string }> } | null;
            (details?.lineItems || []).forEach((li) => {
                if (li.name?.trim()) nameSet.add(li.name.trim());
            });
        });
        return Array.from(nameSet).sort();
    } catch (err) {
        console.warn('[ContractService] getLineItemSuggestions failed:', err);
        return [];
    }
}

export async function getRelated(category: string, productName: string, limit = 20): Promise<Contract[]> {
    const { data, error } = await supabase
        .from('contracts')
        .select('*')
        .or(`category.eq.${category},title.ilike.%${productName}%`)
        .order('signed_date', { ascending: false })
        .limit(limit);
    if (error) throw error;
    return data.map(mapContract);
}

export async function getByProductId(productId: string, limit = 50): Promise<Contract[]> {
    const { data, error } = await supabase.rpc('get_contracts_by_product_id', {
        p_product_id: productId,
        p_limit: limit
    });
    if (error) throw error;
    return (data || []).map(mapContract);
}

export async function getByUnitId(unitId: string): Promise<Contract[]> {
    let query = supabase.from('contracts').select('*');
    if (unitId !== 'all') query = query.eq('unit_id', unitId);
    const { data, error } = await query.order('created_at', { ascending: false }).limit(500);
    if (error) throw error;
    return data.map(mapContract);
}

export async function getByCustomerId(customerId: string): Promise<Contract[]> {
    const { data, error } = await supabase.from('contracts').select('*')
        .eq('customer_id', customerId)
        .order('created_at', { ascending: false })
        .limit(200);
    if (error) throw error;
    return data.map(mapContract);
}

export async function getBySalespersonId(salespersonId: string): Promise<Contract[]> {
    const { data, error } = await supabase.from('contracts').select('*')
        .eq('employee_id', salespersonId)
        .order('created_at', { ascending: false })
        .limit(200);
    if (error) throw error;
    return data.map(mapContract);
}

export async function getByEmployeeId(employeeId: string): Promise<Contract[]> {
    const { data, error } = await supabase.from('contracts').select('*')
        .eq('employee_id', employeeId)
        .order('created_at', { ascending: false })
        .limit(200);
    if (error) throw error;
    return data.map(mapContract);
}

export async function exists(contractCode: string): Promise<boolean> {
    const { count, error } = await supabase
        .from('contracts')
        .select('*', { count: 'exact', head: true })
        .or(`contract_code.eq.${contractCode},id.eq.${contractCode}`);

    if (error) {
        console.error('ContractService.exists:', error.message);
        return false;
    }
    return (count || 0) > 0;
}

export async function getNextContractNumber(unitId: string, year: number, isPreview: boolean = false): Promise<number> {
    const rpcName = isPreview ? 'preview_next_contract_number' : 'get_next_contract_number';
    // eslint-disable-next-line @typescript-eslint/no-explicit-any -- dynamic RPC name not in generated types yet
    const { data, error } = await supabase.rpc(rpcName as any, { p_unit_id: unitId, p_year: year });

    if (error) {
        console.error("Error getting next contract number via RPC, using fallback:", error);
        const { count, error: fallbackError } = await supabase
            .from('contracts')
            .select('*', { count: 'exact', head: true })
            .eq('unit_id', unitId)
            .gte('signed_date', `${year}-01-01`)
            .lte('signed_date', `${year}-12-31`);

        if (fallbackError) {
            console.error("Fallback error getting contract count:", fallbackError);
            return 1;
        }
        return (count || 0) + 1;
    }
    return data as number;
}
