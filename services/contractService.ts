import { supabase } from '../lib/supabase';
import { Contract } from '../types';

// Helper to map DB Contract to Frontend Contract
const mapContract = (c: any): Contract => {
    if (!c) return {
        id: 'unknown',
        title: 'Unknown Contract',
        contractType: 'HĐ',
        status: 'Pending',
        stage: 'Signed',
        value: 0
    } as any; // Partial fallback

    return {
        id: c.id || 'unknown',
        title: c.title || 'Untitled',
        contractType: c.contract_type || 'HĐ',
        partyA: c.party_a || '',
        partyB: c.party_b || '',
        clientInitials: c.client_initials || '',
        customerId: c.customer_id || '',
        unitId: c.unit_id || '',
        coordinatingUnitId: c.coordinating_unit_id || undefined,
        salespersonId: c.salesperson_id || undefined,
        value: c.value || 0,
        estimatedCost: c.estimated_cost || 0,
        actualRevenue: c.actual_revenue || 0,
        invoicedAmount: c.invoiced_amount || 0,
        actualCost: c.actual_cost || 0,
        status: c.status || 'Pending',
        stage: c.stage || 'Signed',
        category: c.category || 'Mới',
        signedDate: c.signed_date || '',
        startDate: c.start_date || '',
        endDate: c.end_date || '',
        content: c.content || '',
        contacts: c.contacts || [],
        milestones: c.milestones || [],
        paymentPhases: c.payment_phases || [],
        // Map details from JSONB
        lineItems: c.details?.lineItems || [],
        adminCosts: c.details?.adminCosts || undefined,
        documents: c.documents || []
    };
};

export const ContractService = {
    getAll: async (): Promise<Contract[]> => {
        const { data, error } = await supabase.from('contracts').select('*').order('created_at', { ascending: false });
        if (error) throw error;
        return data.map(mapContract);
    },

    getById: async (id: string): Promise<Contract | undefined> => {
        // 1. Fetch Contract
        const { data: contractData, error: contractError } = await supabase.from('contracts').select('*').eq('id', id).single();
        if (contractError) {
            console.error("API: getById error", contractError);
            return undefined;
        }

        const contract = mapContract(contractData);

        // 2. Fetch Payments to sync status (Optimization: Could be a Join or separate service call logic)
        // Keeping logic from original api.ts for consistency
        const { data: paymentsData } = await supabase.from('payments').select('phase_id, status, paid_amount').eq('contract_id', id);

        if (paymentsData && paymentsData.length > 0 && contract.paymentPhases) {
            contract.paymentPhases = contract.paymentPhases.map(phase => {
                const linkedPayment = paymentsData.find((p: any) => p.phase_id === phase.id);
                if (linkedPayment) {
                    let newStatus = phase.status;
                    if (linkedPayment.status === 'Tiền về' || linkedPayment.status === 'Paid') {
                        newStatus = 'Paid';
                    } else if (linkedPayment.status === 'Quá hạn' || linkedPayment.status === 'Overdue') {
                        newStatus = 'Overdue';
                    }
                    return { ...phase, status: newStatus as any };
                }
                return phase;
            });
        }

        return contract;
    },

    list: async (params: {
        page: number;
        limit: number;
        search?: string;
        status?: string;
        unitId?: string;
        year?: string;
    }): Promise<{ data: Contract[]; count: number }> => {
        const { page, limit, search, status, unitId, year } = params;
        const from = (page - 1) * limit;
        const to = from + limit - 1;

        let query = supabase
            .from('contracts')
            .select('*', { count: 'exact' });

        // Apply filters
        if (search) {
            query = query.or(`title.ilike.%${search}%,id.ilike.%${search}%,party_a.ilike.%${search}%`);
        }
        if (status && status !== 'All') {
            query = query.eq('status', status);
        }
        if (unitId && unitId !== 'All' && unitId !== 'all') {
            query = query.eq('unit_id', unitId);
        }
        if (year && year !== 'All') {
            const startDate = `${year}-01-01`;
            const endDate = `${year}-12-31`;
            query = query.gte('signed_date', startDate).lte('signed_date', endDate);
        }

        // Apply pagination
        query = query.order('created_at', { ascending: false }).range(from, to);

        const { data, error, count } = await query;

        if (error) throw error;

        return {
            data: data.map(mapContract),
            count: count || 0
        };
    },

    // Optimized Search for Performance
    search: async (term: string, limit = 20): Promise<Contract[]> => {
        const { data, error } = await supabase
            .from('contracts')
            .select('*')
            .or(`title.ilike.%${term}%,id.ilike.%${term}%,party_a.ilike.%${term}%`)
            .order('signed_date', { ascending: false })
            .limit(limit);

        if (error) throw error;
        return data.map(mapContract);
    },

    // New method for Server-Side Filtering (Replaces getAll().filter())
    getRelated: async (category: string, productName: string, limit = 20): Promise<Contract[]> => {
        let query = supabase.from('contracts').select('*').order('signed_date', { ascending: false }).limit(limit);

        // Simple heuristic: match category OR title contains product Name
        query = query.or(`category.eq.${category},title.ilike.%${productName}%`);

        const { data, error } = await query;
        if (error) throw error;
        return data.map(mapContract);
    },

    getStats: async (params: {
        search?: string;
        status?: string;
        unitId?: string;
        year?: string;
    }): Promise<{ totalContracts: number, totalValue: number, totalRevenue: number, totalProfit: number }> => {
        const { search, status, unitId, year } = params;
        let query = supabase.from('contracts').select('id, value, actual_revenue, estimated_cost, actual_cost, status, title, party_a, signed_date, unit_id');

        if (search) {
            query = query.or(`title.ilike.%${search}%,id.ilike.%${search}%,party_a.ilike.%${search}%`);
        }
        if (status && status !== 'All') {
            query = query.eq('status', status);
        }
        if (unitId && unitId !== 'All' && unitId !== 'all') {
            query = query.eq('unit_id', unitId);
        }
        if (year && year !== 'All') {
            const startDate = `${year}-01-01`;
            const endDate = `${year}-12-31`;
            query = query.gte('signed_date', startDate).lte('signed_date', endDate);
        }

        const { data, error } = await query;
        if (error) throw error;

        // Calculate aggregates in JS
        return data.reduce((acc, curr: any) => {
            const val = curr.value || 0;
            const rev = curr.actual_revenue || 0;
            const cost = curr.estimated_cost || 0;
            return {
                totalContracts: acc.totalContracts + 1,
                totalValue: acc.totalValue + val,
                totalRevenue: acc.totalRevenue + rev,
                totalProfit: acc.totalProfit + (val - cost)
            };
        }, { totalContracts: 0, totalValue: 0, totalRevenue: 0, totalProfit: 0 });
    },

    getByUnitId: async (unitId: string): Promise<Contract[]> => {
        let query = supabase.from('contracts').select('*');
        if (unitId !== 'all') {
            query = query.eq('unit_id', unitId);
        }
        const { data, error } = await query;
        if (error) throw error;
        return data.map(mapContract);
    },

    getByCustomerId: async (customerId: string): Promise<Contract[]> => {
        const { data, error } = await supabase.from('contracts').select('*').eq('customer_id', customerId);
        if (error) throw error;
        return data.map(mapContract);
    },

    getBySalespersonId: async (salespersonId: string): Promise<Contract[]> => {
        const { data, error } = await supabase.from('contracts').select('*').eq('salesperson_id', salespersonId);
        if (error) throw error;
        return data.map(mapContract);
    },

    create: async (data: Contract): Promise<Contract> => {
        const payload = {
            id: data.id,
            title: data.title,
            contract_type: data.contractType,
            party_a: data.partyA,
            party_b: data.partyB,
            client_initials: data.clientInitials,
            customer_id: data.customerId,
            unit_id: data.unitId,
            coordinating_unit_id: data.coordinatingUnitId,
            salesperson_id: data.salespersonId,
            value: data.value,
            estimated_cost: data.estimatedCost,
            actual_revenue: data.actualRevenue,
            actual_cost: data.actualCost,
            status: data.status,
            stage: data.stage,
            category: data.category,
            signed_date: data.signedDate,
            start_date: data.startDate,
            end_date: data.endDate,
            content: data.content,
            contacts: data.contacts,
            milestones: data.milestones,
            payment_phases: data.paymentPhases,
            details: {
                lineItems: data.lineItems,
                adminCosts: data.adminCosts
            }
        };
        const { data: res, error } = await supabase.from('contracts').insert(payload).select().single();
        if (error) throw error;
        return mapContract(res);
    },

    update: async (id: string, data: Partial<Contract>): Promise<Contract | undefined> => {
        const payload: any = {};
        if (data.title !== undefined) payload.title = data.title;
        if (data.contractType !== undefined) payload.contract_type = data.contractType;
        if (data.partyA !== undefined) payload.party_a = data.partyA;
        if (data.partyB !== undefined) payload.party_b = data.partyB;
        if (data.clientInitials !== undefined) payload.client_initials = data.clientInitials;
        if (data.customerId !== undefined) payload.customer_id = data.customerId;
        if (data.unitId !== undefined) payload.unit_id = data.unitId;
        if (data.coordinatingUnitId !== undefined) payload.coordinating_unit_id = data.coordinatingUnitId;
        if (data.salespersonId !== undefined) payload.salesperson_id = data.salespersonId;
        if (data.value !== undefined) payload.value = data.value;
        if (data.estimatedCost !== undefined) payload.estimated_cost = data.estimatedCost;
        if (data.actualRevenue !== undefined) payload.actual_revenue = data.actualRevenue;
        if (data.actualCost !== undefined) payload.actual_cost = data.actualCost;
        if (data.status !== undefined) payload.status = data.status;
        if (data.stage !== undefined) payload.stage = data.stage;
        if (data.category !== undefined) payload.category = data.category;
        if (data.signedDate !== undefined) payload.signed_date = data.signedDate;
        if (data.startDate !== undefined) payload.start_date = data.startDate;
        if (data.endDate !== undefined) payload.end_date = data.endDate;
        if (data.content !== undefined) payload.content = data.content;
        if (data.contacts !== undefined) payload.contacts = data.contacts;
        if (data.milestones !== undefined) payload.milestones = data.milestones;
        if (data.paymentPhases !== undefined) payload.payment_phases = data.paymentPhases;

        if (data.lineItems !== undefined || data.adminCosts !== undefined) {
            payload.details = {
                lineItems: data.lineItems,
                adminCosts: data.adminCosts
            };
        }

        const { data: res, error } = await supabase.from('contracts').update(payload).eq('id', id).select().single();
        if (error) throw error;
        return mapContract(res);
    },

    delete: async (id: string): Promise<boolean> => {
        const { error } = await supabase.from('contracts').delete().eq('id', id);
        if (error) throw error;
        return true;
    },

    getNextContractNumber: async (unitId: string, year: number): Promise<number> => {
        const startDate = `${year}-01-01`;
        const endDate = `${year}-12-31`;

        const { count, error } = await supabase
            .from('contracts')
            .select('*', { count: 'exact', head: true })
            .eq('unit_id', unitId)
            .gte('signed_date', startDate)
            .lte('signed_date', endDate);

        if (error) {
            console.error("Error getting contract count:", error);
            return 1;
        }
        return (count || 0) + 1;
    }
};
