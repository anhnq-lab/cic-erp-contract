import { supabase } from '../lib/supabase';
import { Employee } from '../types';

// Helper to map DB Employee to Frontend Employee
const mapEmployee = (s: any): Employee => {
    if (!s) return {
        id: 'unknown',
        name: 'Unknown',
        unitId: '',
        target: { signing: 0, revenue: 0, adminProfit: 0, revProfit: 0, cash: 0 }
    } as Employee;

    return {
        id: s.id || 'unknown',
        name: s.name || 'Unknown',
        unitId: s.unit_id || '',
        employeeCode: s.employee_code || '',
        email: s.email || '',
        phone: s.phone || '',
        position: s.position || '',
        department: s.department || '',
        roleCode: s.role_code || '',
        dateJoined: s.date_joined || '',
        avatar: s.avatar || '',
        target: s.target || { signing: 0, revenue: 0, adminProfit: 0, revProfit: 0, cash: 0 }
    };
};

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
            unit_id: payload.unitId || null,
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
        // Map frontend camelCase to DB snake_case
        const dbPayload: any = {};

        if (payload.name !== undefined) dbPayload.name = payload.name;
        if (payload.unitId !== undefined) dbPayload.unit_id = payload.unitId || null;
        if (payload.employeeCode !== undefined) dbPayload.employee_code = payload.employeeCode;
        if (payload.email !== undefined) dbPayload.email = payload.email;
        if (payload.phone !== undefined) dbPayload.phone = payload.phone;
        if (payload.position !== undefined) dbPayload.position = payload.position;
        if (payload.department !== undefined) dbPayload.department = payload.department;
        if (payload.roleCode !== undefined) dbPayload.role_code = payload.roleCode;
        if (payload.dateJoined !== undefined) dbPayload.date_joined = payload.dateJoined;
        if (payload.avatar !== undefined) dbPayload.avatar = payload.avatar;
        if (payload.target !== undefined) dbPayload.target = payload.target;

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
        try {
            const { data, error } = await supabase.rpc('get_kpi_stats', {
                p_entity_id: id,
                p_type: 'employee',
                p_year: new Date().getFullYear()
            });

            if (error) {
                console.error('Error fetching employee KPI:', error);
                return {
                    contractCount: 0,
                    totalSigning: 0,
                    totalRevenue: 0,
                    signingProgress: 0,
                    revenueProgress: 0
                };
            }

            return {
                contractCount: data.contractCount || 0,
                totalSigning: data.totalSigning || 0,
                totalRevenue: data.totalRevenue || 0,
                totalProfit: data.totalProfit || 0,
                // Progress handled by UI since target is on Employee object, not returned by RPC
                signingProgress: 0,
                revenueProgress: 0
            };
        } catch (error) {
            console.error('Error in getStats:', error);
            return {
                contractCount: 0,
                totalSigning: 0,
                totalRevenue: 0,
                signingProgress: 0,
                revenueProgress: 0
            };
        }
    },

    getWithStats: async (unitId?: string, search?: string): Promise<Employee[]> => {
        const { data, error } = await supabase.rpc('get_employees_with_stats', {
            p_unit_id: unitId === 'all' ? null : unitId,
            p_year: new Date().getFullYear(),
            p_search: search || null
        });

        if (error) throw error;

        return data.map((e: any) => ({
            ...mapEmployee(e),
            // Inject stats
            stats: {
                contractCount: e.contract_count,
                totalSigning: e.total_signing,
                totalRevenue: e.total_revenue
            }
        }));
    }
};
