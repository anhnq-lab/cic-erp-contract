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
        lastYearActual: u.last_year_actual || { signing: 0, revenue: 0, adminProfit: 0, revProfit: 0, cash: 0 }
    };
};

export const UnitService = {
    getAll: async (): Promise<Unit[]> => {
        const { data, error } = await supabase.from('units').select('*');
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

        const { data: res, error } = await supabase.from('units').update(payload).eq('id', id).select().single();
        if (error) throw error;
        return mapUnit(res);
    },

    delete: async (id: string): Promise<boolean> => {
        const { error } = await supabase.from('units').delete().eq('id', id);
        if (error) throw error;
        return true;
    },
};
