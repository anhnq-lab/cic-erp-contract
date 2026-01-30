import { supabase } from '../lib/supabase';
import { Unit } from '../types';

// Helper to map DB Unit to Frontend Unit
const mapUnit = (u: any): Unit => {
    if (!u) return {
        id: 'unknown',
        name: 'Unknown',
        type: 'Center',
        code: 'UNK',
        target: { signing: 0, revenue: 0, adminProfit: 0, revProfit: 0, cash: 0 },
        lastYearActual: { signing: 0, revenue: 0, adminProfit: 0, revProfit: 0, cash: 0 }
    } as Unit;

    return {
        id: u.id || 'unknown',
        name: u.name || 'Unknown Unit',
        type: u.type || 'Center',
        code: u.code || 'UNK',
        target: u.target || { signing: 0, revenue: 0, adminProfit: 0, revProfit: 0, cash: 0 },
        lastYearActual: u.last_year_actual || { signing: 0, revenue: 0, adminProfit: 0, revProfit: 0, cash: 0 },
        functions: u.functions || ''
    };
};

export const UnitService = {
    getAll: async (): Promise<Unit[]> => {
        console.log('[UnitService.getAll] Fetching...');
        const { data, error } = await supabase.from('units').select('*');
        console.log('[UnitService.getAll] Result:', { count: data?.length, error });
        if (error) throw error;
        return data.map(mapUnit);
    },

    getById: async (id: string): Promise<Unit | undefined> => {
        const { data, error } = await supabase.from('units').select('*').eq('id', id).single();
        if (error) return undefined;
        return mapUnit(data);
    },

    getActive: async (): Promise<Unit[]> => {
        const { data, error } = await supabase.from('units').select('*').neq('id', 'all');
        if (error) throw error;
        return data.map(mapUnit);
    },

    create: async (data: Omit<Unit, 'id'>): Promise<Unit> => {
        const payload = {
            name: data.name,
            type: data.type,
            code: data.code,
            target: data.target
        };
        const { data: res, error } = await supabase.from('units').insert(payload).select().single();
        if (error) throw error;
        return mapUnit(res);
    },

    update: async (id: string, data: Partial<Unit>): Promise<Unit | undefined> => {
        const payload: any = {};
        if (data.name) payload.name = data.name;
        if (data.type) payload.type = data.type;
        if (data.code) payload.code = data.code;
        if (data.target) payload.target = data.target;
        if (data.functions !== undefined) payload.functions = data.functions;

        const { data: res, error } = await supabase.from('units').update(payload).eq('id', id).select().single();
        if (error) throw error;
        return mapUnit(res);
    },

    delete: async (id: string): Promise<boolean> => {
        const { error } = await supabase.from('units').delete().eq('id', id);
        if (error) throw error;
        return true;
    },

    getStats: async (id: string): Promise<any> => {
        try {
            const { data, error } = await supabase.rpc('get_kpi_stats', {
                p_entity_id: id,
                p_type: 'unit',
                p_year: new Date().getFullYear()
            });

            if (error) {
                console.error('Error fetching unit KPI:', error);
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
                // Progress handled by UI or calculated here if we fetch target too. 
                // For consistency with EmployeeService, we return raw values.
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

    getWithStats: async (year?: number): Promise<Unit[]> => {
        console.log('[UnitService.getWithStats] Fetching with RPC...');
        try {
            const { data, error } = await supabase.rpc('get_units_with_stats', {
                p_year: year || new Date().getFullYear()
            });

            console.log('[UnitService.getWithStats] RPC Result:', { count: data?.length, error });

            if (error) {
                console.error('[UnitService.getWithStats] RPC failed, falling back to getAll:', error);
                // Fallback to regular getAll
                const allUnits = await UnitService.getAll();
                return allUnits.map(u => ({
                    ...u,
                    stats: { contractCount: 0, totalSigning: 0, totalRevenue: 0, totalProfit: 0 }
                }));
            }

            return data.map((u: any) => ({
                ...mapUnit(u),
                stats: {
                    contractCount: u.contract_count,
                    totalSigning: u.total_signing,
                    totalRevenue: u.total_revenue,
                    totalProfit: u.total_profit
                }
            }));
        } catch (error) {
            console.error('[UnitService.getWithStats] Exception, falling back to getAll:', error);
            // Fallback
            const allUnits = await UnitService.getAll();
            return allUnits.map(u => ({
                ...u,
                stats: { contractCount: 0, totalSigning: 0, totalRevenue: 0, totalProfit: 0 }
            }));
        }
    }
};
