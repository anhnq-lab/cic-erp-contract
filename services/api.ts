/**
 * API Service Layer
 * 
 * This file centralizes all data fetching logic.
 * Now connected to Supabase Database.
 */

import { supabase } from '../lib/supabase';
import { Contract, Unit, SalesPerson, Customer, Product, Payment } from '../types';

// ============================================
// HELPERS
// ============================================

// Helper to map DB Unit to Frontend Unit
const mapUnit = (u: any): Unit => ({
    id: u.id,
    name: u.name,
    type: u.type,
    code: u.code,
    target: u.target,
    lastYearActual: u.last_year_actual
});

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

// Helper to map DB Contract to Frontend Contract
const mapContract = (c: any): Contract => ({
    id: c.id,
    title: c.title,
    contractType: c.contract_type,
    partyA: c.party_a,
    partyB: c.party_b,
    clientInitials: c.client_initials,
    customerId: c.customer_id,
    unitId: c.unit_id,
    coordinatingUnitId: c.coordinating_unit_id,
    salespersonId: c.salesperson_id,
    value: c.value,
    estimatedCost: c.estimated_cost,
    actualRevenue: c.actual_revenue,
    actualCost: c.actual_cost,
    status: c.status,
    stage: c.stage,
    category: c.category,
    signedDate: c.signed_date,
    startDate: c.start_date,
    endDate: c.end_date,
    content: c.content,
    contacts: c.contacts || [],
    milestones: c.milestones || [],
    paymentPhases: c.payment_phases || [],
    // Map details from JSONB
    lineItems: c.details?.lineItems || [],
    adminCosts: c.details?.adminCosts || undefined
});

// Helper to map DB Payment to Frontend Payment
const mapPayment = (p: any): Payment => ({
    id: p.id,
    contractId: p.contract_id,
    customerId: p.customer_id,
    phaseId: p.phase_id,
    amount: p.amount,
    paidAmount: p.paid_amount,
    status: p.status,
    method: p.method,
    dueDate: p.due_date,
    paymentDate: p.payment_date,
    bankAccount: p.bank_account,
    reference: p.reference,
    invoiceNumber: p.invoice_number,
    notes: p.notes,
    paymentType: p.payment_type || 'Revenue'
});

// ============================================
// CONTRACTS API
// ============================================
export const ContractsAPI = {
    getAll: async (): Promise<Contract[]> => {
        const { data, error } = await supabase.from('contracts').select('*').order('created_at', { ascending: false });
        if (error) throw error;
        return data.map(mapContract);
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

    getById: async (id: string): Promise<Contract | undefined> => {
        console.log("API: getById called for", id);
        const { data, error } = await supabase.from('contracts').select('*').eq('id', id).single();
        if (error) {
            console.error("API: getById error", error);
            return undefined;
        }
        return mapContract(data);
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

    getStats: async (params: {
        search?: string;
        status?: string;
        unitId?: string;
        year?: string;
    }): Promise<{ totalContracts: number, totalValue: number, totalRevenue: number, totalProfit: number }> => {
        const { search, status, unitId, year } = params;
        let query = supabase.from('contracts').select('id, value, actual_revenue, estimated_cost, actual_cost, status, title, party_a, signed_date, unit_id');

        // Apply filters (Duplicated logic for now, ideally refactor to shared helper)
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

        // Calculate aggregates in JS (Still fetching all columns for filtered set, but much lighter than full join)
        // Optimization: In real prod, use .rpc() for server-side sum. 
        // For < 10k records, JS reduce is fine and simpler than SQL RPC migration right now.
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
            // Pack details into JSONB
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
        if (data.milestones !== undefined) payload.milestones = data.milestones;
        if (data.paymentPhases !== undefined) payload.payment_phases = data.paymentPhases;

        // Update details JSONB if lineItems or adminCosts changed
        if (data.lineItems !== undefined || data.adminCosts !== undefined) {
            // optimized: we should merge with existing details if possible, but for now we might overwrite or need a way to get existing. 
            // Since this is a simple update, we assume we pass the full object or we might lose other details.
            // A safer way is to rely on the fact that if we update form, we have the full state.
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
};

// ============================================
// UNITS API
// ============================================
export const UnitsAPI = {
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

// ============================================
// PERSONNEL/SALESPEOPLE API
// ============================================
export const PersonnelAPI = {
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

// ============================================
// CUSTOMERS API
// ============================================
export const CustomersAPI = {
    getAll: async (): Promise<Customer[]> => {
        const { data, error } = await supabase.from('customers').select('*');
        if (error) throw error;
        return data.map(mapCustomer);
    },

    getById: async (id: string): Promise<Customer | undefined> => {
        const { data, error } = await supabase.from('customers').select('*').eq('id', id).single();
        if (error) return undefined;
        return mapCustomer(data);
    },

    getStats: async (id: string) => {
        // This logic was previously doing text matching on partyA.
        // Now better to use customerId relationship
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

// ============================================
// PRODUCTS API
// ============================================
export const ProductsAPI = {
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

    delete: async (id: string): Promise<boolean> => {
        const { error } = await supabase.from('products').delete().eq('id', id);
        if (error) throw error;
        return true;
    },
};

// ============================================
// PAYMENTS API
// ============================================
export const PaymentsAPI = {
    getAll: async (): Promise<Payment[]> => {
        const { data, error } = await supabase.from('payments').select('*').order('due_date', { ascending: true });
        if (error) throw error;
        return data.map(mapPayment);
    },

    list: async (params: {
        page: number;
        limit: number;
        search?: string;
        type?: string;
        status?: string;
    }): Promise<{ data: Payment[]; count: number }> => {
        const { page, limit, search, type, status } = params;
        const from = (page - 1) * limit;
        const to = from + limit - 1;

        let query = supabase
            .from('payments')
            .select('*', { count: 'exact' });

        // Filters
        if (search) {
            // Search by Invoice or Reference (avoiding UUID fields to prevent crash)
            // Search by Invoice Number (safest)
            query = query.ilike('invoice_number', `%${search}%`);
        }
        if (type) {
            query = query.eq('payment_type', type);
        }
        if (status && status !== 'all') {
            query = query.eq('status', status);
        }

        // Pagination & Sort
        query = query.order('due_date', { ascending: false }).range(from, to);

        const { data, error, count } = await query;
        if (error) throw error;

        return {
            data: data.map(mapPayment),
            count: count || 0
        };
    },

    getById: async (id: string): Promise<Payment | undefined> => {
        const { data, error } = await supabase.from('payments').select('*').eq('id', id).single();
        if (error) return undefined;
        return mapPayment(data);
    },

    getByContractId: async (contractId: string): Promise<Payment[]> => {
        const { data, error } = await supabase.from('payments').select('*').eq('contract_id', contractId);
        if (error) throw error;
        return data.map(mapPayment);
    },

    getByCustomerId: async (customerId: string): Promise<Payment[]> => {
        const { data, error } = await supabase.from('payments').select('*').eq('customer_id', customerId);
        if (error) throw error;
        return data.map(mapPayment);
    },

    getByStatus: async (status: string): Promise<Payment[]> => {
        const { data, error } = await supabase.from('payments').select('*').eq('status', status);
        if (error) throw error;
        return data.map(mapPayment);
    },

    getOverdue: async (): Promise<Payment[]> => {
        const { data, error } = await supabase.from('payments').select('*').eq('status', 'Quá hạn');
        if (error) throw error;
        return data.map(mapPayment);
    },

    getPending: async (): Promise<Payment[]> => {
        const { data, error } = await supabase.from('payments').select('*').eq('status', 'Chờ xuất HĐ'); // Or Pending
        if (error) throw error;
        return data.map(mapPayment);
    },

    getStats: async (params: { type?: string }) => {
        const { type } = params;
        let query = supabase.from('payments').select('*');

        if (type) {
            query = query.eq('payment_type', type);
        }

        const { data, error } = await query;
        if (error || !data) return { totalAmount: 0, paidAmount: 0, pendingAmount: 0, overdueAmount: 0, paidCount: 0, pendingCount: 0, overdueCount: 0 };

        // TODO: Optimize with server-side aggregation later
        const total = data.reduce((sum, p) => sum + (p.amount || 0), 0);

        const paidQuery = data.filter(p => p.status === 'Tiền về' || p.status === 'Paid');
        const paid = paidQuery.reduce((sum, p) => sum + (p.paid_amount || 0), 0);

        const pendingQuery = data.filter(p => p.status === 'Chờ xuất HĐ' || p.status === 'Pending' || p.status === 'Đã xuất HĐ' || p.status === 'Chờ thu' || p.status === 'Chờ chi');
        const pending = pendingQuery.reduce((sum, p) => sum + (p.amount || 0), 0);

        const overdueQuery = data.filter(p => p.status === 'Quá hạn' || p.status === 'Overdue');
        const overdue = overdueQuery.reduce((sum, p) => sum + ((p.amount || 0) - (p.paid_amount || 0)), 0);

        return {
            totalAmount: total,
            paidAmount: paid,
            pendingAmount: pending,
            overdueAmount: overdue,
            paidCount: paidQuery.length,
            pendingCount: pendingQuery.length,
            overdueCount: overdueQuery.length,
        };
    },

    create: async (data: Omit<Payment, 'id'>): Promise<Payment> => {
        const payload = {
            contract_id: data.contractId,
            customer_id: data.customerId,
            phase_id: data.phaseId,
            amount: data.amount,
            paid_amount: data.paidAmount,
            status: data.status,
            method: data.method,
            due_date: data.dueDate,
            payment_date: data.paymentDate,
            bank_account: data.bankAccount,
            reference: data.reference,
            invoice_number: data.invoiceNumber,
            notes: data.notes,
            payment_type: data.paymentType || 'Revenue'
        };
        const { data: res, error } = await supabase.from('payments').insert(payload).select().single();
        if (error) throw error;
        return mapPayment(res);
    },

    update: async (id: string, data: Partial<Payment>): Promise<Payment | undefined> => {
        const payload: any = {};
        if (data.contractId) payload.contract_id = data.contractId;
        if (data.customerId) payload.customer_id = data.customerId;
        if (data.phaseId) payload.phase_id = data.phaseId;
        if (data.amount !== undefined) payload.amount = data.amount;
        if (data.paidAmount !== undefined) payload.paid_amount = data.paidAmount;
        if (data.status) payload.status = data.status;
        if (data.method) payload.method = data.method;
        if (data.dueDate) payload.due_date = data.dueDate;
        if (data.paymentDate) payload.payment_date = data.paymentDate;
        if (data.bankAccount) payload.bank_account = data.bankAccount;
        if (data.reference) payload.reference = data.reference;
        if (data.invoiceNumber) payload.invoice_number = data.invoiceNumber;
        if (data.notes) payload.notes = data.notes;
        if (data.dueDate) payload.due_date = data.dueDate;

        const { data: res, error } = await supabase.from('payments').update(payload).eq('id', id).select().single();
        if (error) throw error;
        return mapPayment(res);
    },

    delete: async (id: string): Promise<boolean> => {
        const { error } = await supabase.from('payments').delete().eq('id', id);
        if (error) throw error;
        return true;
    },
};

// ============================================
// DOCUMENTS API
// ============================================
// Helper to sanitize filename for S3 storage
const sanitizeFileName = (fileName: string): string => {
    // 1. Separate extension
    const parts = fileName.split('.');
    const ext = parts.length > 1 ? parts.pop() : '';
    const name = parts.join('.');

    // 2. Transliterate Vietnamese & Remove special chars
    const safeName = name
        .normalize('NFD')
        .replace(/[\u0300-\u036f]/g, '') // Remove accents
        .replace(/đ/g, 'd').replace(/Đ/g, 'D')
        .replace(/[^a-zA-Z0-9_-]/g, '_'); // Replace non-alphanumeric with underscore

    // 3. Truncate to avoid "Invalid Key" (max 100 chars for name, plenty safely)
    const truncatedName = safeName.slice(0, 100);

    return ext ? `${truncatedName}.${ext}` : truncatedName;
};

export const DocumentsAPI = {
    getByContractId: async (contractId: string) => {
        const { data, error } = await supabase.from('contract_documents').select('*').eq('contract_id', contractId);
        if (error) throw error;
        return data.map((d: any) => ({
            id: d.id,
            contractId: d.contract_id,
            name: d.name,
            url: d.url,
            filePath: d.file_path,
            type: d.type,
            size: d.size,
            uploadedAt: d.uploaded_at
        }));
    },

    upload: async (contractId: string, file: File) => {
        // 1. Upload to Storage
        const safeName = sanitizeFileName(file.name);
        // Ensure unique path with timestamp
        const filePath = `${contractId}/${Date.now()}_${safeName}`;
        const { data: storageData, error: storageError } = await supabase.storage
            .from('contract_docs')
            .upload(filePath, file);

        if (storageError) throw storageError;

        // 2. Get Public URL (or Signed URL)
        // Since bucket is private, we should use createSignedUrl for sensitive docs,
        // but for now, if we want persistent links in DB, we might want to just store path
        // and generate URL on fetch. OR, if we allowed "public" read in policy (even if bucket is private-ish),
        // we can use public URL.
        // Wait, I set bucket strict privaty in SQL. So public URL won't work unless I change policy or use signed URL.
        // actually I set "Allow authenticated read access" for storage.objects.
        // So authenticated users can download.
        // We will store the Path, and when listing, we can generate a signed URL or just use the download method.
        // But for "url" field in DB, let's store the path for now or a pseudo-url.

        // Actually, to make it viewable in UI easily (<img> or <frame>), signed URL is best.
        // User wants "upload ... scan ...".

        // Let's insert into DB with the filePath.
        const { data: dbData, error: dbError } = await supabase.from('contract_documents').insert({
            contract_id: contractId,
            name: file.name,
            file_path: filePath,
            url: filePath, // We can store path here too, or leave it.
            type: file.type,
            size: file.size
        }).select().single();

        if (dbError) throw dbError;

        return {
            id: dbData.id,
            contractId: dbData.contract_id,
            name: dbData.name,
            url: dbData.url,
            filePath: dbData.file_path,
            type: dbData.type,
            size: dbData.size,
            uploadedAt: dbData.uploaded_at
        };
    },

    delete: async (id: string, filePath: string) => {
        // 1. Delete from Storage
        const { error: storageError } = await supabase.storage
            .from('contract_docs')
            .remove([filePath]);

        if (storageError) console.error("Storage delete error", storageError);

        // 2. Delete from DB
        const { error: dbError } = await supabase.from('contract_documents').delete().eq('id', id);
        if (dbError) throw dbError;
        return true;
    },

    download: async (filePath: string) => {
        const { data, error } = await supabase.storage.from('contract_docs').download(filePath);
        if (error) throw error;
        return data;
    }
};
