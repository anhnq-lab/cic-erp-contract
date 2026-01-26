/**
 * API Service Layer
 * 
 * This file centralizes all data fetching logic.
 * Currently uses mock data, but can easily be swapped for real API calls.
 * 
 * When ready for backend:
 * 1. Replace MOCK_* imports with actual fetch/axios calls
 * 2. Add error handling and loading states
 * 3. Add authentication headers as needed
 */

import { supabase } from '../lib/supabase';
import { MOCK_CONTRACTS, MOCK_UNITS, MOCK_SALESPEOPLE, MOCK_CUSTOMERS, MOCK_PRODUCTS, MOCK_PAYMENTS } from '../constants';
import { Contract, Unit, SalesPerson, Customer, Product, Payment } from '../types';

// ============================================
// CONTRACTS API
// ============================================
export const ContractsAPI = {
    getAll: async (): Promise<Contract[]> => {
        // TODO: Replace with real API call
        // return fetch('/api/contracts').then(res => res.json());
        return Promise.resolve(MOCK_CONTRACTS);
    },

    getById: async (id: string): Promise<Contract | undefined> => {
        // TODO: Replace with real API call
        // return fetch(`/api/contracts/${id}`).then(res => res.json());
        return Promise.resolve(MOCK_CONTRACTS.find(c => c.id === id));
    },

    getByUnitId: async (unitId: string): Promise<Contract[]> => {
        if (unitId === 'all') return Promise.resolve(MOCK_CONTRACTS);
        return Promise.resolve(MOCK_CONTRACTS.filter(c => c.unitId === unitId));
    },

    getBySalespersonId: async (salespersonId: string): Promise<Contract[]> => {
        return Promise.resolve(MOCK_CONTRACTS.filter(c => c.salespersonId === salespersonId));
    },

    getByCustomer: async (customerShortName: string): Promise<Contract[]> => {
        return Promise.resolve(
            MOCK_CONTRACTS.filter(c =>
                c.partyA.includes(customerShortName) || c.clientInitials === customerShortName
            )
        );
    },

    create: async (data: Omit<Contract, 'id'>): Promise<Contract> => {
        // TODO: Replace with real API call
        // return fetch('/api/contracts', { method: 'POST', body: JSON.stringify(data) }).then(res => res.json());
        const newContract: Contract = {
            ...data,
            id: `HĐ_${Date.now()}`,
        } as Contract;
        return Promise.resolve(newContract);
    },

    update: async (id: string, data: Partial<Contract>): Promise<Contract | undefined> => {
        // TODO: Replace with real API call
        const contract = MOCK_CONTRACTS.find(c => c.id === id);
        if (contract) {
            Object.assign(contract, data);
        }
        return Promise.resolve(contract);
    },

    delete: async (id: string): Promise<boolean> => {
        // TODO: Replace with real API call
        return Promise.resolve(true);
    },
};

// ============================================
// UNITS API
// ============================================
export const UnitsAPI = {
    getAll: async (): Promise<Unit[]> => {
        const { data, error } = await supabase
            .from('units')
            .select('*');

        if (error || !data || data.length === 0) {
            console.warn('UnitsAPI: Fetch failed or empty, falling back to mock.', error);
            return Promise.resolve(MOCK_UNITS);
        }

        return data.map((u: any) => ({
            id: u.id,
            name: u.name,
            type: u.type,
            code: u.code,
            target: u.target,
            lastYearActual: u.last_year_actual
        })) as Unit[];
    },

    getById: async (id: string): Promise<Unit | undefined> => {
        const { data, error } = await supabase
            .from('units')
            .select('*')
            .eq('id', id)
            .single();

        if (error || !data) return Promise.resolve(MOCK_UNITS.find(u => u.id === id));

        return {
            id: data.id,
            name: data.name,
            type: data.type,
            code: data.code,
            target: data.target,
            lastYearActual: data.last_year_actual
        } as Unit;
    },

    getActive: async (): Promise<Unit[]> => {
        // Fetch all except 'all'
        const { data, error } = await supabase
            .from('units')
            .select('*')
            .neq('id', 'all');

        if (error || !data || data.length === 0) {
            return Promise.resolve(MOCK_UNITS.filter(u => u.id !== 'all'));
        }

        return data.map((u: any) => ({
            id: u.id,
            name: u.name,
            type: u.type,
            code: u.code,
            target: u.target,
            lastYearActual: u.last_year_actual
        })) as Unit[];
    },
};

// ============================================
// PERSONNEL/SALESPEOPLE API
// ============================================
export const PersonnelAPI = {
    getAll: async (): Promise<SalesPerson[]> => {
        return Promise.resolve(MOCK_SALESPEOPLE);
    },

    getById: async (id: string): Promise<SalesPerson | undefined> => {
        return Promise.resolve(MOCK_SALESPEOPLE.find(p => p.id === id));
    },

    getByUnitId: async (unitId: string): Promise<SalesPerson[]> => {
        if (unitId === 'all') return Promise.resolve(MOCK_SALESPEOPLE);
        return Promise.resolve(MOCK_SALESPEOPLE.filter(p => p.unitId === unitId));
    },

    getStats: async (id: string) => {
        const person = MOCK_SALESPEOPLE.find(p => p.id === id);
        const contracts = MOCK_CONTRACTS.filter(c => c.salespersonId === id);

        const totalSigning = contracts.reduce((sum, c) => sum + c.value, 0);
        const totalRevenue = contracts.reduce((sum, c) => sum + c.actualRevenue, 0);
        const activeContracts = contracts.filter(c => c.status === 'Active').length;
        const completedContracts = contracts.filter(c => c.status === 'Completed').length;

        return Promise.resolve({
            contractCount: contracts.length,
            totalSigning,
            totalRevenue,
            activeContracts,
            completedContracts,
            signingProgress: person ? (totalSigning / person.target.signing) * 100 : 0,
            revenueProgress: person ? (totalRevenue / person.target.revenue) * 100 : 0,
        });
    },

    create: async (data: Omit<SalesPerson, 'id'>): Promise<SalesPerson> => {
        const newPerson: SalesPerson = {
            ...data,
            id: `s${Date.now()}`,
        };
        return Promise.resolve(newPerson);
    },

    update: async (id: string, data: Partial<SalesPerson>): Promise<SalesPerson | undefined> => {
        const person = MOCK_SALESPEOPLE.find(p => p.id === id);
        if (person) {
            Object.assign(person, data);
        }
        return Promise.resolve(person);
    },

    delete: async (id: string): Promise<boolean> => {
        return Promise.resolve(true);
    },
};

// ============================================
// CUSTOMERS API
// ============================================
export const CustomersAPI = {
    getAll: async (): Promise<Customer[]> => {
        return Promise.resolve(MOCK_CUSTOMERS);
    },

    getById: async (id: string): Promise<Customer | undefined> => {
        return Promise.resolve(MOCK_CUSTOMERS.find(c => c.id === id));
    },

    getByIndustry: async (industry: string): Promise<Customer[]> => {
        if (industry === 'all') return Promise.resolve(MOCK_CUSTOMERS);
        return Promise.resolve(MOCK_CUSTOMERS.filter(c => c.industry === industry));
    },

    getStats: async (id: string) => {
        const customer = MOCK_CUSTOMERS.find(c => c.id === id);
        if (!customer) return Promise.resolve(null);

        const contracts = MOCK_CONTRACTS.filter(c =>
            c.partyA.includes(customer.shortName) || c.clientInitials === customer.shortName
        );

        return Promise.resolve({
            contractCount: contracts.length,
            totalValue: contracts.reduce((sum, c) => sum + c.value, 0),
            totalRevenue: contracts.reduce((sum, c) => sum + c.actualRevenue, 0),
            activeContracts: contracts.filter(c => c.status === 'Active').length,
        });
    },

    create: async (data: Omit<Customer, 'id'>): Promise<Customer> => {
        const newCustomer: Customer = {
            ...data,
            id: `c${Date.now()}`,
        };
        return Promise.resolve(newCustomer);
    },

    update: async (id: string, data: Partial<Customer>): Promise<Customer | undefined> => {
        const customer = MOCK_CUSTOMERS.find(c => c.id === id);
        if (customer) {
            Object.assign(customer, data);
        }
        return Promise.resolve(customer);
    },

    delete: async (id: string): Promise<boolean> => {
        return Promise.resolve(true);
    },
};

// ============================================
// PRODUCTS API
// ============================================
export const ProductsAPI = {
    getAll: async (): Promise<Product[]> => {
        return Promise.resolve(MOCK_PRODUCTS);
    },

    getById: async (id: string): Promise<Product | undefined> => {
        return Promise.resolve(MOCK_PRODUCTS.find(p => p.id === id));
    },

    getByCategory: async (category: string): Promise<Product[]> => {
        if (category === 'all') return Promise.resolve(MOCK_PRODUCTS);
        return Promise.resolve(MOCK_PRODUCTS.filter(p => p.category === category));
    },

    getByUnitId: async (unitId: string): Promise<Product[]> => {
        if (unitId === 'all') return Promise.resolve(MOCK_PRODUCTS);
        return Promise.resolve(MOCK_PRODUCTS.filter(p => p.unitId === unitId));
    },

    getActive: async (): Promise<Product[]> => {
        return Promise.resolve(MOCK_PRODUCTS.filter(p => p.isActive));
    },

    create: async (data: Omit<Product, 'id'>): Promise<Product> => {
        const newProduct: Product = {
            ...data,
            id: `p${Date.now()}`,
        };
        return Promise.resolve(newProduct);
    },

    update: async (id: string, data: Partial<Product>): Promise<Product | undefined> => {
        const product = MOCK_PRODUCTS.find(p => p.id === id);
        if (product) {
            Object.assign(product, data);
        }
        return Promise.resolve(product);
    },

    delete: async (id: string): Promise<boolean> => {
        return Promise.resolve(true);
    },
};

// ============================================
// PAYMENTS API
// ============================================
export const PaymentsAPI = {
    getAll: async (): Promise<Payment[]> => {
        return Promise.resolve(MOCK_PAYMENTS);
    },

    getById: async (id: string): Promise<Payment | undefined> => {
        return Promise.resolve(MOCK_PAYMENTS.find(p => p.id === id));
    },

    getByContractId: async (contractId: string): Promise<Payment[]> => {
        return Promise.resolve(MOCK_PAYMENTS.filter(p => p.contractId === contractId));
    },

    getByCustomerId: async (customerId: string): Promise<Payment[]> => {
        return Promise.resolve(MOCK_PAYMENTS.filter(p => p.customerId === customerId));
    },

    getByStatus: async (status: string): Promise<Payment[]> => {
        return Promise.resolve(MOCK_PAYMENTS.filter(p => p.status === status));
    },

    getOverdue: async (): Promise<Payment[]> => {
        return Promise.resolve(MOCK_PAYMENTS.filter(p => p.status === 'Overdue'));
    },

    getPending: async (): Promise<Payment[]> => {
        return Promise.resolve(MOCK_PAYMENTS.filter(p => p.status === 'Pending'));
    },

    getStats: async () => {
        const total = MOCK_PAYMENTS.reduce((sum, p) => sum + p.amount, 0);
        const paid = MOCK_PAYMENTS.filter(p => p.status === 'Paid').reduce((sum, p) => sum + p.paidAmount, 0);
        const pending = MOCK_PAYMENTS.filter(p => p.status === 'Pending').reduce((sum, p) => sum + p.amount, 0);
        const overdue = MOCK_PAYMENTS.filter(p => p.status === 'Overdue').reduce((sum, p) => sum + p.amount - p.paidAmount, 0);

        return Promise.resolve({
            totalAmount: total,
            paidAmount: paid,
            pendingAmount: pending,
            overdueAmount: overdue,
            paidCount: MOCK_PAYMENTS.filter(p => p.status === 'Paid').length,
            pendingCount: MOCK_PAYMENTS.filter(p => p.status === 'Pending').length,
            overdueCount: MOCK_PAYMENTS.filter(p => p.status === 'Overdue').length,
        });
    },

    create: async (data: Omit<Payment, 'id'>): Promise<Payment> => {
        const newPayment: Payment = {
            id: `PAY_${Date.now()}`,
            ...data
        };
        MOCK_PAYMENTS.push(newPayment);
        return Promise.resolve(newPayment);
    },

    update: async (id: string, data: Partial<Payment>): Promise<Payment | undefined> => {
        const payment = MOCK_PAYMENTS.find(p => p.id === id);
        if (payment) {
            Object.assign(payment, data);
        }
        return Promise.resolve(payment);
    },

    delete: async (id: string): Promise<boolean> => {
        return Promise.resolve(true);
    },
};
// ============================================
// HELPER: Fetch wrapper for future use
// ============================================
export const fetchAPI = async <T>(
    endpoint: string,
    options?: RequestInit
): Promise<T> => {
    // TODO: Add base URL from environment
    // const baseUrl = process.env.NEXT_PUBLIC_API_URL || '';
    const baseUrl = '';

    const response = await fetch(`${baseUrl}${endpoint}`, {
        headers: {
            'Content-Type': 'application/json',
            // TODO: Add auth token
            // 'Authorization': `Bearer ${getToken()}`,
        },
        ...options,
    });

    if (!response.ok) {
        throw new Error(`API Error: ${response.status}`);
    }

    return response.json();
};
