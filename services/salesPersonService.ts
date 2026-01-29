import { supabase } from '../lib/supabase';
import { SalesPerson } from '../types';

// Helper to map DB SalesPerson to Frontend SalesPerson
const mapSalesPerson = (s: any): SalesPerson => ({
    id: s.id,
    name: s.name,
    unitId: s.unit_id,
    employeeCode: s.employee_code,
    email: s.email,
    phone: s.phone,
    position: s.position,
    dateJoined: s.date_joined,
    avatar: s.avatar,
    target: s.target
});

export const SalesPersonService = {
    getAll: async (): Promise<SalesPerson[]> => {
        const { data, error } = await supabase.from('sales_people').select('*');
        if (error) throw error;
        return data.map(mapSalesPerson);
    },

    getById: async (id: string): Promise<SalesPerson | undefined> => {
        const { data, error } = await supabase.from('sales_people').select('*').eq('id', id).single();
        if (error) return undefined;
        return mapSalesPerson(data);
    },

    getByUnitId: async (unitId: string): Promise<SalesPerson[]> => {
        let query = supabase.from('sales_people').select('*');
        if (unitId !== 'all') {
            query = query.eq('unit_id', unitId);
        }
        const { data, error } = await query;
        if (error) throw error;
        return data.map(mapSalesPerson);
    },

    list: async (params: { page?: number; pageSize?: number; search?: string; unitId?: string }): Promise<{ data: SalesPerson[]; total: number }> => {
        let query = supabase.from('sales_people').select('*', { count: 'exact' });

        if (params.unitId && params.unitId !== 'all') {
            query = query.eq('unit_id', params.unitId);
        }
        if (params.search) {
            query = query.ilike('name', `%${params.search}%`);
        }

        if (params.page !== undefined && params.pageSize !== undefined) {
            const from = (params.page - 1) * params.pageSize;
            const to = from + params.pageSize - 1;
            query = query.range(from, to);
        }

        const { data, error, count } = await query;
        if (error) throw error;
        return { data: data.map(mapSalesPerson), total: count || 0 };
    },

    getStats: async (id: string) => {
        // Need to fetch contracts to calc stats
        const { data: contracts, error } = await supabase.from('contracts').select('*').eq('salesperson_id', id);
        const { data: person } = await supabase.from('sales_people').select('*').eq('id', id).single();

        if (error || !contracts) return {
            contractCount: 0, totalSigning: 0, totalRevenue: 0, activeContracts: 0, completedContracts: 0, signingProgress: 0, revenueProgress: 0
        };

        const totalSigning = contracts.reduce((sum, c) => sum + (c.value || 0), 0);
        const totalRevenue = contracts.reduce((sum, c) => sum + (c.actual_revenue || 0), 0);
        const activeContracts = contracts.filter(c => c.status === 'Active').length;
        const completedContracts = contracts.filter(c => c.status === 'Completed').length;

        const personData = person ? mapSalesPerson(person) : null;
        const targetSigning = personData?.target?.signing || 1;
        const targetRevenue = personData?.target?.revenue || 1;

        return {
            contractCount: contracts.length,
            totalSigning,
            totalRevenue,
            activeContracts,
            completedContracts,
            signingProgress: (totalSigning / targetSigning) * 100,
            revenueProgress: (totalRevenue / targetRevenue) * 100,
        };
    },

    create: async (data: Omit<SalesPerson, 'id'>): Promise<SalesPerson> => {
        const payload = {
            name: data.name,
            unit_id: data.unitId,
            employee_code: data.employeeCode || null,
            email: data.email || null,
            phone: data.phone || null,
            position: data.position || null,
            date_joined: data.dateJoined || null,
            avatar: data.avatar || null,
            target: data.target
        };
        const { data: res, error } = await supabase.from('sales_people').insert(payload).select().single();
        if (error) throw error;
        return mapSalesPerson(res);
    },

    update: async (id: string, data: Partial<SalesPerson>): Promise<SalesPerson | undefined> => {
        const payload: any = {};
        if (data.name) payload.name = data.name;
        if (data.unitId) payload.unit_id = data.unitId;
        if (data.employeeCode !== undefined) payload.employee_code = data.employeeCode || null;
        if (data.email !== undefined) payload.email = data.email || null;
        if (data.phone !== undefined) payload.phone = data.phone || null;
        if (data.position !== undefined) payload.position = data.position || null;
        if (data.dateJoined !== undefined) payload.date_joined = data.dateJoined || null;
        if (data.avatar !== undefined) payload.avatar = data.avatar || null;
        if (data.target) payload.target = data.target;

        const { data: res, error } = await supabase.from('sales_people').update(payload).eq('id', id).select().single();
        if (error) throw error;
        return mapSalesPerson(res);
    },

    delete: async (id: string): Promise<boolean> => {
        const { error } = await supabase.from('sales_people').delete().eq('id', id);
        if (error) throw error;
        return true;
    },
};
