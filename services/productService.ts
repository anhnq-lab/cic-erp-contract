import { supabase } from '../lib/supabase';
import { Product } from '../types';

// Helper to map DB Product to Frontend Product
const mapProduct = (p: any): Product => ({
    id: p.id,
    code: p.code,
    name: p.name,
    category: p.category,
    description: p.description,
    unit: p.unit,
    basePrice: p.base_price,
    costPrice: p.cost_price,
    isActive: p.is_active,
    unitId: p.unit_id
});

export const ProductService = {
    getAll: async (): Promise<Product[]> => {
        const { data, error } = await supabase.from('products').select('*');
        if (error) throw error;
        return data.map(mapProduct);
    },

    getById: async (id: string): Promise<Product | undefined> => {
        const { data, error } = await supabase.from('products').select('*').eq('id', id).single();
        if (error) return undefined;
        return mapProduct(data);
    },

    getByCategory: async (category: string): Promise<Product[]> => {
        let query = supabase.from('products').select('*');
        if (category !== 'all') {
            query = query.eq('category', category);
        }
        const { data, error } = await query;
        if (error) throw error;
        return data.map(mapProduct);
    },

    getByUnitId: async (unitId: string): Promise<Product[]> => {
        let query = supabase.from('products').select('*');
        if (unitId !== 'all') {
            query = query.eq('unit_id', unitId);
        }
        const { data, error } = await query;
        if (error) throw error;
        return data.map(mapProduct);
    },

    getActive: async (): Promise<Product[]> => {
        const { data, error } = await supabase.from('products').select('*').eq('is_active', true);
        if (error) throw error;
        return data.map(mapProduct);
    },

    create: async (data: Omit<Product, 'id'>): Promise<Product> => {
        const payload = {
            code: data.code,
            name: data.name,
            category: data.category,
            description: data.description,
            unit: data.unit,
            base_price: data.basePrice,
            cost_price: data.costPrice,
            is_active: data.isActive,
            unit_id: data.unitId
        };
        const { data: res, error } = await supabase.from('products').insert(payload).select().single();
        if (error) throw error;
        return mapProduct(res);
    },

    update: async (id: string, data: Partial<Product>): Promise<Product | undefined> => {
        const payload: any = {};
        if (data.code) payload.code = data.code;
        if (data.name) payload.name = data.name;
        if (data.category) payload.category = data.category;
        if (data.description) payload.description = data.description;
        if (data.unit) payload.unit = data.unit;
        if (data.basePrice) payload.base_price = data.basePrice;
        if (data.costPrice) payload.cost_price = data.costPrice;
        if (data.isActive !== undefined) payload.is_active = data.isActive;
        if (data.unitId) payload.unit_id = data.unitId;

        const { data: res, error } = await supabase.from('products').update(payload).eq('id', id).select().single();
        if (error) throw error;
        return mapProduct(res);
    },

    list: async (params: { page?: number; pageSize?: number; search?: string; category?: string }): Promise<{ data: Product[]; total: number }> => {
        let query = supabase.from('products').select('*', { count: 'exact' });

        if (params.category && params.category !== 'all') {
            query = query.eq('category', params.category);
        }
        if (params.search) {
            query = query.or(`name.ilike.%${params.search}%,code.ilike.%${params.search}%`);
        }

        if (params.page !== undefined && params.pageSize !== undefined) {
            const from = (params.page - 1) * params.pageSize;
            const to = from + params.pageSize - 1;
            query = query.range(from, to);
        }

        query = query.order('created_at', { ascending: false });

        const { data, error, count } = await query;
        if (error) throw error;
        return { data: data.map(mapProduct), total: count || 0 };
    },

    delete: async (id: string): Promise<boolean> => {
        const { error } = await supabase.from('products').delete().eq('id', id);
        if (error) throw error;
        return true;
    },
};
