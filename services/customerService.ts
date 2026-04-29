import { dataClient as supabase } from '../lib/dataClient';
import { Customer, CustomerContact } from '../types';
import type { DbCustomer, UpdateCustomer } from '../lib/db';

export interface DuplicateMatch {
    id: string;
    name: string;
    shortName: string;
    taxCode: string;
    type: string;
    matchReason: 'tax_code' | 'name' | 'short_name';
}

// Normalize industry: DB may store string or JSON array string
const normalizeIndustry = (raw: unknown): string[] => {
    if (!raw) return [];
    if (Array.isArray(raw)) return raw;
    if (typeof raw === 'string') {
        if (raw.startsWith('[')) {
            try { return JSON.parse(raw); } catch { /* fall through */ }
        }
        return raw.trim() ? [raw.trim()] : [];
    }
    return [];
};

// Serialize industry array for DB storage (as JSON string)
const serializeIndustry = (industry: string[] | string | undefined): string => {
    if (!industry) return '[]';
    if (typeof industry === 'string') return JSON.stringify([industry]);
    return JSON.stringify(industry);
};

// RPC get_customers_with_stats returns extra computed columns alongside DbCustomer fields
type DbCustomerWithStats = DbCustomer & {
    contract_count?: number | null;
    total_value?: number | null;
    total_revenue?: number | null;
    active_contracts_count?: number | null;
};

// Helper to map DB Customer to Frontend Customer
const mapCustomer = (c: DbCustomerWithStats): Customer => ({
    id: c.id,
    name: c.name ?? '',
    shortName: c.short_name ?? '',
    industry: normalizeIndustry(c.industry),
    contactPerson: c.contact_person ?? '',
    phone: c.phone ?? '',
    email: c.email ?? '',
    address: c.address ?? '',
    taxCode: c.tax_code ?? undefined,
    website: c.website ?? undefined,
    notes: c.notes ?? undefined,
    bankName: c.bank_name ?? undefined,
    bankBranch: c.bank_branch ?? undefined,
    bankAccount: c.bank_account ?? undefined,
    foundedDate: c.founded_date ?? undefined,
    type: (c.type as Customer['type']) ?? 'Customer',
    // Extended info
    internationalName: c.international_name ?? undefined,
    representative: c.representative ?? undefined,
    businessType: c.business_type ?? undefined,
    businessStatus: c.business_status ?? 'Đang hoạt động',
    // CRM fields
    rating: (c.rating as Customer['rating']) ?? 'Standard',
    source: c.source ?? undefined,
    paymentTerms: c.payment_terms ?? undefined,
    creditLimit: c.credit_limit !== null ? Number(c.credit_limit) : 0,
    // Computed stats from get_customers_with_stats RPC
    ...(c.contract_count != null ? {
        stats: {
            contractCount: Number(c.contract_count),
            totalValue: Number(c.total_value ?? 0),
            totalRevenue: Number(c.total_revenue ?? 0),
            activeContracts: Number(c.active_contracts_count ?? 0),
        },
    } : {}),
});

// Map DB customer_contacts row
const mapContact = (c: Record<string, unknown>): CustomerContact => ({
    id: c.id as string,
    customerId: c.customer_id as string,
    name: c.name as string,
    position: c.position as string | undefined,
    department: c.department as string | undefined,
    phone: c.phone as string | undefined,
    email: c.email as string | undefined,
    isPrimary: (c.is_primary as boolean) ?? false,
    notes: c.notes as string | undefined,
    createdAt: c.created_at as string | undefined,
});

export interface CustomerFilterParams {
    page?: number;
    pageSize?: number;
    search?: string;
    type?: string;
    industry?: string;
    rating?: string;
    year?: string;
    period?: string;
    unitId?: string;
}

const PAGE_SIZE = 20;

export const CustomerService = {
    getAll: async (params?: CustomerFilterParams): Promise<{ data: Customer[], total: number }> => {
        let p_search = params?.search ? params.search : null;
        let p_type = params?.type && params.type !== 'all' ? params.type : null;
        let p_industry = params?.industry && params.industry !== 'all' ? params.industry : null;

        let p_limit = params?.pageSize || PAGE_SIZE;
        let p_offset = params?.page ? (params.page - 1) * p_limit : 0;

        let p_unit_id = params?.unitId || 'all';
        let p_year = params?.year || 'All';
        let p_period = params?.period || 'Toàn thời gian';

        // Fix null values for RPC
        if (p_search === '') p_search = null;

        const [listRes, countRes] = await Promise.all([
            // 1. Get paginated list with stats
            supabase.rpc('get_customers_with_stats', {
                p_search,
                p_type,
                p_industry,
                p_limit,
                p_offset,
                p_unit_id,
                p_year,
                p_period
            }),
            // 2. Get total count
            supabase.rpc('get_customers_with_stats', {
                p_search,
                p_type,
                p_industry,
                p_unit_id,
                p_year,
                p_period
            }, { count: 'exact', head: true })
        ]);

        if (listRes.error) throw listRes.error;
        if (countRes.error) throw countRes.error;

        let results = (listRes.data || []).map(mapCustomer);

        // Client-side rating filter (until RPC is updated)
        if (params?.rating && params.rating !== 'all') {
            results = results.filter(c => c.rating === params.rating);
        }

        let totalCount = countRes.count || 0;

        // Fallback: if 'head: true' returns data as array instead of count (some Supabase versions)
        if (!totalCount && Array.isArray(countRes.data)) {
            totalCount = countRes.data.length;
        } else if (!totalCount && results.length > 0 && !p_search && p_limit === PAGE_SIZE) {
            totalCount = results.length;
        }

        return {
            data: results,
            total: totalCount
        };
    },

    getById: async (id: string): Promise<Customer | undefined> => {
        const { data, error } = await supabase.from('customers').select('*').eq('id', id).single();
        if (error) return undefined;
        return mapCustomer(data);
    },

    create: async (data: Omit<Customer, 'id'>): Promise<Customer> => {
        const payload = {
            name: data.name,
            short_name: data.shortName,
            industry: serializeIndustry(data.industry),
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
            type: data.type || 'Customer',
            // CRM fields
            rating: data.rating || 'Standard',
            source: data.source || null,
            payment_terms: data.paymentTerms || null,
            credit_limit: data.creditLimit || 0,
            // Extended info
            international_name: data.internationalName || null,
            representative: data.representative || null,
            business_type: data.businessType || null,
            business_status: data.businessStatus || null,
        };
        const { data: res, error } = await supabase.from('customers').insert(payload).select().single();
        if (error) throw error;
        return mapCustomer(res);
    },

    update: async (id: string, data: Partial<Customer>): Promise<Customer | undefined> => {
        const payload: UpdateCustomer = {};
        if (data.name) payload.name = data.name;
        if (data.shortName) payload.short_name = data.shortName;
        if (data.industry) payload.industry = serializeIndustry(data.industry);
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
        // CRM fields
        if (data.rating !== undefined) payload.rating = data.rating;
        if (data.source !== undefined) payload.source = data.source || null;
        if (data.paymentTerms !== undefined) payload.payment_terms = data.paymentTerms || null;
        if (data.creditLimit !== undefined) payload.credit_limit = data.creditLimit;
        // Extended info
        if (data.internationalName !== undefined) payload.international_name = data.internationalName || null;
        if (data.representative !== undefined) payload.representative = data.representative || null;
        if (data.businessType !== undefined) payload.business_type = data.businessType || null;
        if (data.businessStatus !== undefined) payload.business_status = data.businessStatus || null;
        payload.updated_at = new Date().toISOString();

        const { data: res, error } = await supabase.from('customers').update(payload).eq('id', id).select().single();
        if (error) throw error;
        return mapCustomer(res);
    },

    delete: async (id: string): Promise<boolean> => {
        const { error } = await supabase.from('customers').delete().eq('id', id);
        if (error) throw error;
        return true;
    },

    /**
     * Find customer by tax code — for upsert logic
     */
    findByTaxCode: async (taxCode: string): Promise<Customer | null> => {
        if (!taxCode || taxCode.trim().length < 5) return null;
        const { data, error } = await supabase
            .from('customers')
            .select('*')
            .eq('tax_code', taxCode.trim())
            .limit(1)
            .maybeSingle();
        if (error || !data) return null;
        return mapCustomer(data);
    },

    /**
     * Check for duplicate customers by tax_code, name, or short_name.
     * Uses DB RPC with unaccent + case-insensitive matching.
     * Returns list of matching records with the reason they match.
     */
    checkDuplicate: async (params: {
        taxCode?: string;
        name?: string;
        shortName?: string;
        excludeId?: string;
    }): Promise<DuplicateMatch[]> => {
        try {
            const { data, error } = await supabase.rpc('check_customer_duplicate', {
                p_tax_code: params.taxCode?.trim() || null,
                p_name: params.name?.trim() || null,
                p_short_name: params.shortName?.trim() || null,
                p_exclude_id: params.excludeId || null,
            });
            if (error) {
                console.error('[CustomerService.checkDuplicate] RPC error:', error);
                return [];
            }
            return (data || []).map((r: Record<string, unknown>) => ({
                id: r.id,
                name: r.name,
                shortName: r.short_name,
                taxCode: r.tax_code,
                type: r.type,
                matchReason: r.match_reason as 'tax_code' | 'name' | 'short_name',
            }));
        } catch (err) {
            console.error('[CustomerService.checkDuplicate] Error:', err);
            return [];
        }
    },

    /**
     * Lightweight search for dropdowns - returns max 20 results
     */
    search: async (query: string, limit: number = 20): Promise<Customer[]> => {
        if (!query || query.length < 2) return [];

        // Vietnamese diacritics-insensitive search via RPC
        let matchedIds: string[] | undefined;
        try {
            const { data: rpcData } = await supabase.rpc('search_customers_unaccent', { search_term: query });
            if (rpcData && rpcData.length > 0) {
                matchedIds = rpcData.map((r: { id: string }) => r.id);
            } else if (rpcData) {
                matchedIds = [];
            }
        } catch (e) {
            // RPC not available — fall back to ilike
        }

        let dbQuery = supabase
            .from('customers')
            .select('id, name, short_name, industry, type, rating');

        if (matchedIds && matchedIds.length > 0) {
            dbQuery = dbQuery.in('id', matchedIds);
        } else if (matchedIds && matchedIds.length === 0) {
            return [];
        } else {
            dbQuery = dbQuery.or(`name.ilike.%${query}%,short_name.ilike.%${query}%`);
        }

        dbQuery = dbQuery.limit(limit);

        const { data, error } = await dbQuery;
        if (error) {
            console.error('[CustomerService.search] Error:', error);
            return [];
        }
        return (data || []).map(c => mapCustomer(c as unknown as DbCustomerWithStats));
    },

    /**
     * Search suppliers only
     */
    searchSuppliers: async (query: string, limit: number = 20): Promise<Customer[]> => {
        if (!query || query.length < 2) return [];

        const { data, error } = await supabase
            .from('customers')
            .select('id, name, short_name, industry, type, rating')
            .in('type', ['Supplier', 'Both'])
            .or(`name.ilike.%${query}%,short_name.ilike.%${query}%`)
            .limit(limit);

        if (error) {
            console.error('[CustomerService.searchSuppliers] Error:', error);
            return [];
        }
        return (data || []).map(c => mapCustomer(c as unknown as DbCustomerWithStats));
    },

    /**
     * Find supplier by name or create new one
     * Used for PAKD Excel import
     */
    findOrCreateSupplier: async (name: string): Promise<Customer> => {
        if (!name || name.trim() === '') {
            throw new Error('Supplier name is required');
        }

        const { data: existing, error: searchError } = await supabase
            .from('customers')
            .select('*')
            .ilike('name', name.trim())
            .in('type', ['Supplier', 'Both'])
            .limit(1);

        if (searchError) throw searchError;

        if (existing && existing.length > 0) {
            return mapCustomer(existing[0]);
        }

        const newSupplier = {
            name: name.trim(),
            short_name: name.trim().substring(0, 20),
            industry: '["Công nghệ"]',
            type: 'Supplier',
            contact_person: '',
            phone: '',
            email: '',
            address: '',
            rating: 'Standard',
        };

        const { data: created, error: createError } = await supabase
            .from('customers')
            .insert(newSupplier)
            .select()
            .single();

        if (createError) throw createError;
        console.log('[CustomerService] Created new supplier:', created.name);
        return mapCustomer(created);
    },

    /**
     * Get product-based contract stats for a supplier
     * Finds brands matching this supplier → products → contracts via lineItems
     */
    getSupplierProductStats: async (customerId: string, unitId: string = 'all', year: string = 'All', period: string = 'Toàn thời gian'): Promise<{
        productCount: number;
        contractCount: number;
        totalContractValue: number;
        totalRevenue: number;
        activeContracts: number;
    } | null> => {
        try {
            const { data, error } = await supabase.rpc('get_supplier_product_stats', {
                p_customer_id: customerId,
                p_unit_id: unitId,
                p_year: year,
                p_period: period
            });
            if (error) throw error;
            if (!data || data.length === 0) return null;
            const row = data[0];
            return {
                productCount: Number(row.product_count) || 0,
                contractCount: Number(row.contract_count) || 0,
                totalContractValue: Number(row.total_contract_value) || 0,
                totalRevenue: Number(row.total_revenue) || 0,
                activeContracts: Number(row.active_contracts) || 0,
            };
        } catch (err) {
            console.error('[CustomerService.getSupplierProductStats] Error:', err);
            return null;
        }
    },

    // =============================================
    // Customer Contacts sub-CRUD
    // =============================================

    getContacts: async (customerId: string): Promise<CustomerContact[]> => {
        const { data, error } = await supabase
            .from('customer_contacts')
            .select('*')
            .eq('customer_id', customerId)
            .order('is_primary', { ascending: false })
            .order('name');
        if (error) throw error;
        return (data || []).map(mapContact);
    },

    createContact: async (contact: Omit<CustomerContact, 'id'>): Promise<CustomerContact> => {
        const payload = {
            customer_id: contact.customerId,
            name: contact.name,
            position: contact.position || null,
            department: contact.department || null,
            phone: contact.phone || null,
            email: contact.email || null,
            is_primary: contact.isPrimary ?? false,
            notes: contact.notes || null,
        };
        const { data, error } = await supabase
            .from('customer_contacts')
            .insert(payload)
            .select()
            .single();
        if (error) throw error;
        return mapContact(data);
    },

    updateContact: async (id: string, contact: Partial<CustomerContact>): Promise<CustomerContact> => {
        const payload: Record<string, unknown> = {};
        if (contact.name !== undefined) payload.name = contact.name;
        if (contact.position !== undefined) payload.position = contact.position || null;
        if (contact.department !== undefined) payload.department = contact.department || null;
        if (contact.phone !== undefined) payload.phone = contact.phone || null;
        if (contact.email !== undefined) payload.email = contact.email || null;
        if (contact.isPrimary !== undefined) payload.is_primary = contact.isPrimary;
        if (contact.notes !== undefined) payload.notes = contact.notes || null;

        const { data, error } = await supabase
            .from('customer_contacts')
            .update(payload)
            .eq('id', id)
            .select()
            .single();
        if (error) throw error;
        return mapContact(data);
    },

    deleteContact: async (id: string): Promise<boolean> => {
        const { error } = await supabase.from('customer_contacts').delete().eq('id', id);
        if (error) throw error;
        return true;
    },

    mergePartners: async (sourceId: string, targetId: string): Promise<void> => {
        if (sourceId === targetId) throw new Error('Cannot merge a partner with itself');

        // 1. Reassign Contracts (customer_id)
        await supabase.from('contracts').update({ customer_id: targetId }).eq('customer_id', sourceId);

        // 2. Reassign Contracts (supplier_id if applicable)
        await supabase.from('contracts').update({ supplier_id: targetId }).eq('supplier_id', sourceId);

        // 3. Reassign Contacts
        await supabase.from('customer_contacts').update({ customer_id: targetId }).eq('customer_id', sourceId);

        // 4. Delete Source Partner
        const { error } = await supabase.from('customers').delete().eq('id', sourceId);
        if (error) throw error;
    }
};
