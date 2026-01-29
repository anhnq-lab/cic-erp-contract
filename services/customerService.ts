import { supabase } from '../lib/supabase';
import { Customer } from '../types';

// Helper to map DB Customer to Frontend Customer
const mapCustomer = (c: any): Customer => ({
    id: c.id,
    name: c.name,
    shortName: c.short_name,
    industry: c.industry,
    contactPerson: c.contact_person,
    phone: c.phone,
    email: c.email,
    address: c.address,
    taxCode: c.tax_code,
    website: c.website,
    notes: c.notes,
    bankName: c.bank_name,
    bankBranch: c.bank_branch,
    bankAccount: c.bank_account,
    foundedDate: c.founded_date,
    type: c.type || 'Customer'
});

export const CustomerService = {
    getAll: async (params?: { page?: number; pageSize?: number; search?: string; type?: string; industry?: string }): Promise<{ data: Customer[]; total: number }> => {
        let query = supabase.from('customers').select('*', { count: 'exact' });

        if (params?.search) {
            query = query.or(`name.ilike.%${params.search}%,short_name.ilike.%${params.search}%,contact_person.ilike.%${params.search}%`);
        }

        if (params?.type && params.type !== 'all') {
            // Logic: type='Customer' matches 'Customer' or 'Both'. type='Supplier' matches 'Supplier' or 'Both'.
            if (params.type === 'Customer') {
                query = query.in('type', ['Customer', 'Both', 'Customer,Supplier']);
            } else if (params.type === 'Supplier') {
                query = query.in('type', ['Supplier', 'Both', 'Customer,Supplier']);
            } else {
                query = query.eq('type', params.type);
            }
        }

        if (params?.industry && params.industry !== 'all') {
            query = query.eq('industry', params.industry);
        }

        query = query.order('created_at', { ascending: false });

        if (params?.page !== undefined && params?.pageSize !== undefined) {
            const from = (params.page - 1) * params.pageSize;
            const to = from + params.pageSize - 1;
            query = query.range(from, to);
        }

        const { data, error, count } = await query;
        if (error) throw error;
        return { data: data.map(mapCustomer), total: count || 0 };
    },

    getById: async (id: string): Promise<Customer | undefined> => {
        const { data, error } = await supabase.from('customers').select('*').eq('id', id).single();
        if (error) return undefined;
        return mapCustomer(data);
    },

    getStats: async (id: string) => {
        const { data: contracts, error } = await supabase.from('contracts').select('*').eq('customer_id', id);

        if (error || !contracts) return null;

        return {
            contractCount: contracts.length,
            totalValue: contracts.reduce((sum, c) => sum + (c.value || 0), 0),
            totalRevenue: contracts.reduce((sum, c) => sum + (c.actual_revenue || 0), 0),
            activeContracts: contracts.filter(c => c.status === 'Active').length,
        };
    },

    create: async (data: Omit<Customer, 'id'>): Promise<Customer> => {
        const payload = {
            name: data.name,
            short_name: data.shortName,
            industry: data.industry,
            contact_person: data.contactPerson,
            phone: data.phone,
            email: data.email,
            address: data.address,
            tax_code: data.taxCode || null,
            website: data.website || null,
            notes: data.notes || null,
            bank_name: data.bankName || null,
            bank_branch: data.bankBranch || null,
            bank_account: data.bankAccount || null,
            founded_date: data.foundedDate || null,
            type: data.type || 'Customer'
        };
        const { data: res, error } = await supabase.from('customers').insert(payload).select().single();
        if (error) throw error;
        return mapCustomer(res);
    },

    update: async (id: string, data: Partial<Customer>): Promise<Customer | undefined> => {
        const payload: any = {};
        if (data.name) payload.name = data.name;
        if (data.shortName) payload.short_name = data.shortName;
        if (data.industry) payload.industry = data.industry;
        if (data.contactPerson) payload.contact_person = data.contactPerson;
        if (data.phone) payload.phone = data.phone;
        if (data.email) payload.email = data.email;
        if (data.address) payload.address = data.address;
        if (data.taxCode !== undefined) payload.tax_code = data.taxCode || null;
        if (data.website !== undefined) payload.website = data.website || null;
        if (data.notes !== undefined) payload.notes = data.notes || null;
        if (data.bankName !== undefined) payload.bank_name = data.bankName || null;
        if (data.bankBranch !== undefined) payload.bank_branch = data.bankBranch || null;
        if (data.bankAccount !== undefined) payload.bank_account = data.bankAccount || null;
        if (data.foundedDate !== undefined) payload.founded_date = data.foundedDate || null;
        if (data.type) payload.type = data.type;

        const { data: res, error } = await supabase.from('customers').update(payload).eq('id', id).select().single();
        if (error) throw error;
        return mapCustomer(res);
    },

    delete: async (id: string): Promise<boolean> => {
        const { error } = await supabase.from('customers').delete().eq('id', id);
        if (error) throw error;
        return true;
    },
};
