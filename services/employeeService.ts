import { supabase } from '../lib/supabase';
import { Employee } from '../types';

// Helper to map DB Employee to Frontend Employee
const mapEmployee = (s: any): Employee => ({
    id: s.id,
    name: s.name,
    unitId: s.unit_id,
    employeeCode: s.employee_code,
    email: s.email,
    phone: s.phone,
    position: s.position,
    department: s.department,
    roleCode: s.role_code,
    dateJoined: s.date_joined,
    avatar: s.avatar,
    target: s.target || { signing: 0, revenue: 0, adminProfit: 0, revProfit: 0, cash: 0 }
});

export const EmployeeService = {
    getAll: async (): Promise<Employee[]> => {
        const { data, error } = await supabase.from('employees').select('*');
        if (error) throw error;
        return data.map(mapEmployee);
    },

    getById: async (id: string): Promise<Employee | undefined> => {
        const { data, error } = await supabase.from('employees').select('*').eq('id', id).single();
        if (error) return undefined;
        return mapEmployee(data);
    },

    getByUnitId: async (unitId: string): Promise<Employee[]> => {
        let query = supabase.from('employees').select('*');
        if (unitId !== 'all') {
            query = query.eq('unit_id', unitId);
        }
        const { data, error } = await query;
        if (error) throw error;
        return data.map(mapEmployee);
    },

    list: async (params: { page?: number; pageSize?: number; search?: string; unitId?: string }): Promise<{ data: Employee[]; total: number }> => {
        let query = supabase.from('employees').select('*', { count: 'exact' });

        if (params.unitId && params.unitId !== 'all') {
            query = query.eq('unit_id', params.unitId);
        }
        if (params.search) {
            query = query.ilike('name', `%${params.search}%`);
        }

        const page = params.page || 1;
        const limit = params.pageSize || 10;
        const from = (page - 1) * limit;
        const to = from + limit - 1;

        query = query.range(from, to).order('name', { ascending: true });

        const { data, error, count } = await query;
        if (error) throw error;

        return {
            data: data.map(mapEmployee),
            total: count || 0
        };
    },

    create: async (payload: Omit<Employee, 'id'>): Promise<Employee> => {
        // Map frontend back to DB
        const dbPayload = {
            name: payload.name,
            unit_id: payload.unitId,
            email: payload.email,
            phone: payload.phone,
            position: payload.position,
            department: payload.department,
            role_code: payload.roleCode,
            date_joined: payload.dateJoined,
            target: payload.target
        };

        const { data, error } = await supabase.from('employees').insert(dbPayload).select().single();
        if (error) throw error;
        return mapEmployee(data);
    },

    update: async (id: string, payload: Partial<Employee>): Promise<Employee> => {
        const dbPayload: any = { ...payload };
        // Map keys if necessary, simplistic mapping for now
        if (payload.unitId) dbPayload.unit_id = payload.unitId;
        if (payload.roleCode) dbPayload.role_code = payload.roleCode;
        if (payload.dateJoined) dbPayload.date_joined = payload.dateJoined;

        const { data, error } = await supabase.from('employees').update(dbPayload).eq('id', id).select().single();
        if (error) throw error;
        return mapEmployee(data);
    },

    delete: async (id: string): Promise<boolean> => {
        const { error } = await supabase.from('employees').delete().eq('id', id);
        if (error) throw error;
        return true;
    },

    getStats: async (id: string): Promise<any> => {
        // Mock stats matching PersonnelStats interface
        // REAL IMPLEMENTATION: Fetch calc from contracts
        return {
            contractCount: 0,
            totalSigning: 0,
            totalRevenue: 0,
            signingProgress: 0,
            revenueProgress: 0
        };
    }
};
