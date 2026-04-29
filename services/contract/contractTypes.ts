/**
 * Shared internal types for the contract service layer.
 * These are snake_case DB row shapes — NOT the public Contract frontend type.
 */

export type EmpAlloc = { employeeId: string; percent?: number };
export type UnitAlloc = { role: string; employeeId?: string; unitId?: string; percent?: number };

export type PaymentRow = {
    voucher_type?: string | null;
    status?: string | null;
    amount?: number | null;
    invoice_date?: string | null;
    payment_date?: string | null;
    due_date?: string | null;
    vat_invoice_items?: Array<{ amountBeforeVAT?: number }>;
};

// RawContract: snake_case DB row shape returned by queries (not the full DbContract)
// unit_allocations uses any[] to satisfy getUnitSharePct parameter type
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export type RawContract = {
    id: string;
    title?: string | null;
    contract_code?: string | null;
    code?: string | null;
    value?: number | null;
    actual_revenue?: number | null;
    actual_cost?: number | null;
    estimated_cost?: number | null;
    status?: string | null;
    unit_id?: string | null;
    employee_id?: string | null;
    signed_date?: string | null;
    end_date?: string | null;
    party_a?: string | null;
    category?: string | null;
    has_vat?: boolean | null;
    vat_rate?: number | null;
    contract_type?: string | null;
    classification?: string | null;
    unit_allocations?: { allocations?: any[] } | null; // eslint-disable-line @typescript-eslint/no-explicit-any
    employee_allocations?: EmpAlloc[] | null;
    // Pre-computed aggregate columns (used in getStats optimized path)
    admin_profit?: number | null;
    rev_profit?: number | null;
    cash_received?: number | null;
};

export type StatsContract = RawContract;
export type ContractWithPayments = RawContract & { payments?: PaymentRow[] };

export type StatsAcc = {
    totalContracts: number;
    totalValue: number;
    totalRevenue: number;
    totalProfit: number;
    totalSigningProfit: number;
    totalRevenueProfit: number;
    totalCash: number;
    activeCount: number;
    pendingCount: number;
    completedCount: number;
    expiredCount: number;
    processingCount: number;
    acceptanceCount: number;
    suspendedCount: number;
    handoverCount: number;
    newContractsCount: number;
    renewalContractsCount: number;
};
