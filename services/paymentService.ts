import { supabase } from '../lib/supabase';
import { Payment } from '../types';

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

export const PaymentService = {
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
        // Includes 'Chờ xuất HĐ' or generally Pending
        const { data, error } = await supabase.from('payments').select('*').eq('status', 'Chờ xuất HĐ');
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

        // Client-side aggregation
        const total = data.reduce((sum, p) => sum + (p.amount || 0), 0);

        const paidQuery = data.filter(p => p.status === 'Tiền về' || p.status === 'Paid');
        const paid = paidQuery.reduce((sum, p) => sum + (p.paid_amount || 0), 0);

        // Pending set
        const pendingQuery = data.filter(p => p.status === 'Chờ xuất HĐ' || p.status === 'Pending' || p.status === 'Đã xuất HĐ' || p.status === 'Chờ thu' || p.status === 'Chờ chi');
        const pending = pendingQuery.reduce((sum, p) => sum + (p.amount || 0), 0);

        const overdueQuery = data.filter(p => p.status === 'Quá hạn' || p.status === 'Overdue');
        // Overdue count is remaining amount
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
            id: crypto.randomUUID(),
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
