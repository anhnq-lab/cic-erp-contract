import { describe, it, expect, vi } from 'vitest';
import { mapContract } from '../../services/contract/contractMapper';

// contractMapper only calls contractFinancials utilities — no DB needed
vi.mock('../../lib/dataClient', () => ({
    dataClient: { from: vi.fn(), rpc: vi.fn() },
}));

const TODAY = new Date().toISOString().split('T')[0];

// A helper to build a minimal DB row
function makeRow(overrides: Record<string, any> = {}) {
    return {
        id: 'c1',
        contract_code: 'C-001',
        title: 'Test Contract',
        contract_type: 'HĐ',
        status: 'Processing',
        stage: 'Signed',
        value: 1000,
        has_vat: true,
        vat_rate: 10,
        unit_id: 'u1',
        employee_id: 'e1',
        party_a: 'Party A',
        party_b: 'CIC',
        signed_date: '2025-01-01',
        start_date: '2025-01-01',
        end_date: '2025-12-31',
        payments: [],
        details: { lineItems: [], executionCosts: [], revenueSchedules: [] },
        milestones: [],
        payment_phases: [],
        contacts: [],
        estimated_cost: 0,
        actual_revenue: 0,
        ...overrides,
    };
}

describe('mapContract', () => {
    describe('null/undefined input', () => {
        it('returns partial fallback for null input', () => {
            const result = mapContract(null);
            expect(result.id).toBe('unknown');
            expect(result.title).toBe('Unknown Contract');
        });
    });

    describe('basic field mapping', () => {
        it('maps id and contractCode', () => {
            const result = mapContract(makeRow());
            expect(result.id).toBe('c1');
            expect(result.contractCode).toBe('C-001');
        });

        it('maps title', () => {
            const result = mapContract(makeRow({ title: 'My Contract' }));
            expect(result.title).toBe('My Contract');
        });

        it('maps unitId', () => {
            const result = mapContract(makeRow({ unit_id: 'unit-B' }));
            expect(result.unitId).toBe('unit-B');
        });

        it('maps salespersonId from employee_id', () => {
            const result = mapContract(makeRow({ employee_id: 'emp-2' }));
            expect(result.salespersonId).toBe('emp-2');
        });

        it('falls back to salesperson_id when employee_id missing (legacy)', () => {
            const result = mapContract(makeRow({ employee_id: undefined, salesperson_id: 'legacy-emp' }));
            expect(result.salespersonId).toBe('legacy-emp');
        });

        it('maps hasVat: defaults to true when not explicitly false', () => {
            expect(mapContract(makeRow({ has_vat: undefined })).hasVat).toBe(true);
            expect(mapContract(makeRow({ has_vat: false })).hasVat).toBe(false);
            expect(mapContract(makeRow({ has_vat: true })).hasVat).toBe(true);
        });

        it('maps vatRate with fallback 10', () => {
            expect(mapContract(makeRow({ vat_rate: undefined })).vatRate).toBe(10);
            expect(mapContract(makeRow({ vat_rate: 8 })).vatRate).toBe(8);
        });

        it('maps status correctly', () => {
            const result = mapContract(makeRow({ status: 'Acceptance' }));
            expect(result.status).toBe('Acceptance');
        });

        it('maps unitAllocations when present', () => {
            const allocs = [{ unitId: 'u2', percent: 50, role: 'lead', employeeId: 'e2' }];
            const result = mapContract(makeRow({ unit_allocations: { allocations: allocs } }));
            expect(result.unitAllocations).toEqual(allocs);
        });

        it('maps lineItems from details.lineItems', () => {
            const lineItems = [{ id: 'li1', name: 'Item', quantity: 1, inputPrice: 100, outputPrice: 200, directCosts: 0, directCostDetails: [], vatRate: 10, supplier: '' }];
            const result = mapContract(makeRow({ details: { lineItems, executionCosts: [], revenueSchedules: [] } }));
            expect(result.lineItems).toEqual(lineItems);
        });

        it('defaults classification to Thông thường for non-dealer sales', () => {
            const result = mapContract(makeRow({ is_dealer_sale: false }));
            expect(result.classification).toBe('Thông thường');
        });

        it('sets classification to Bán qua đại lý for dealer sales', () => {
            const result = mapContract(makeRow({ is_dealer_sale: true, classification: null }));
            expect(result.classification).toBe('Bán qua đại lý');
        });
    });

    describe('revenue/profit calculations', () => {
        it('computes adminProfit = expectedRevenue - estimatedCost', () => {
            const lineItems = [{ id: 'li1', name: 'Item', quantity: 2, inputPrice: 400, outputPrice: 500, directCosts: 0, directCostDetails: [], vatRate: 10, supplier: '' }];
            // expectedRevenue = 500 * 2 = 1000; estimatedCost = 800
            const result = mapContract(makeRow({
                details: { lineItems, executionCosts: [], revenueSchedules: [] },
                estimated_cost: 800,
            }));
            expect(result.adminProfit).toBe(200); // 1000 - 800
        });

        it('computes revProfit for Completed status using actual expense payments', () => {
            const payments = [
                // VAT_INVOICE, no VAT → revenue = 1000
                { status: 'Tiền về', voucher_type: 'VAT_INVOICE', amount: 1000, payment_type: 'REVENUE' },
                // EXPENSE paid → cost = 300
                { status: 'Đã chi', voucher_type: 'EXPENSE', amount: 300, payment_type: 'EXPENSE' },
            ];
            const result = mapContract(makeRow({
                status: 'Completed',
                payments,
                has_vat: false,  // no VAT → amount directly = revenue without division
                vat_rate: 0,
            }));
            // actualRevenue = 1000 (no VAT divisor since has_vat=false)
            // actualCost = 300
            // revProfit = 1000 - 300 = 700
            expect(result.revProfit).toBeCloseTo(700, 0);
        });

        it('computes revProfit for non-Completed status using ratio', () => {
            const lineItems = [{ id: 'li1', name: 'Item', quantity: 1, inputPrice: 0, outputPrice: 1000, directCosts: 0, directCostDetails: [], vatRate: 10, supplier: '' }];
            const result = mapContract(makeRow({
                status: 'Processing',
                details: { lineItems, executionCosts: [], revenueSchedules: [] },
                estimated_cost: 600,
                actual_revenue: 500,
            }));
            // expectedRevenue = 1000; revenueRatio = 500/1000 = 0.5
            // revProfit = 500 - (600 * 0.5) = 500 - 300 = 200
            expect(result.revProfit).toBeCloseTo(200, 0);
        });
    });

    describe('warning flags', () => {
        it('sets isOverdueAdvance when advance payment is overdue with zero cash received', () => {
            const pastDate = '2020-01-01'; // always in the past
            const paymentSchedules = [
                { description: 'Tạm ứng đợt 1', date: pastDate, amount: 500 },
            ];
            const result = mapContract(makeRow({
                payment_schedules: { schedules: paymentSchedules },
                payments: [], // cashReceived = 0
            }));
            expect(result.warnings?.isOverdueAdvance).toBe(true);
        });

        it('does NOT set isOverdueAdvance when cash was received', () => {
            const pastDate = '2020-01-01';
            const paymentSchedules = [
                { description: 'Tạm ứng đợt 1', date: pastDate, amount: 500 },
            ];
            // Add a paid receipt to simulate cashReceived > 0
            const payments = [
                { status: 'Paid', voucher_type: 'RECEIPT', amount: 500, payment_type: 'REVENUE' },
            ];
            const result = mapContract(makeRow({
                payment_schedules: { schedules: paymentSchedules },
                payments,
            }));
            expect(result.warnings?.isOverdueAdvance).toBe(false);
        });

        it('sets isOverduePayment when invoiced amount unpaid and overdue', () => {
            const pastDate = '2020-01-01';
            const payments = [
                {
                    // VAT_INVOICE → calculateInvoicedFromPayments picks this up
                    // payment_type = 'INVOICE' → isOverduePayment logic picks this up
                    status: 'Đã xuất HĐ',
                    payment_type: 'INVOICE',
                    voucher_type: 'VAT_INVOICE',
                    amount: 1000,
                    due_date: pastDate,
                },
            ];
            const result = mapContract(makeRow({ payments }));
            // invoicedAmount = 1000, cashReceived = 0 → overdue
            expect(result.warnings?.isOverduePayment).toBe(true);
        });

        it('sets isAcceptedNoInvoice when status=Acceptance and invoicedAmount=0', () => {
            const result = mapContract(makeRow({
                status: 'Acceptance',
                payments: [],
                invoiced_amount: 0,
            }));
            expect(result.warnings?.isAcceptedNoInvoice).toBe(true);
        });

        it('does NOT set isAcceptedNoInvoice when invoicedAmount > 0', () => {
            const payments = [
                // Must be VAT_INVOICE for calculateInvoicedFromPayments to count it
                { status: 'Đã xuất HĐ', payment_type: 'INVOICE', amount: 500, due_date: '2099-01-01', voucher_type: 'VAT_INVOICE' },
            ];
            const result = mapContract(makeRow({
                status: 'Acceptance',
                payments,
            }));
            // invoicedAmount = 500 > 0 → isAcceptedNoInvoice = false
            expect(result.warnings?.isAcceptedNoInvoice).toBe(false);
        });
    });

    describe('optional/legacy fields', () => {
        it('maps workflow steps', () => {
            const steps = [{ id: 's1', type: 'approval' }];
            const result = mapContract(makeRow({ workflow_steps: steps }));
            expect(result.workflowSteps).toEqual(steps);
        });

        it('maps legal_approved and finance_approved', () => {
            const result = mapContract(makeRow({ legal_approved: true, finance_approved: false }));
            expect(result.legal_approved).toBe(true);
            expect(result.finance_approved).toBe(false);
        });

        it('maps paymentTermDays when numeric', () => {
            const result = mapContract(makeRow({ payment_term_days: 30 }));
            expect(result.paymentTermDays).toBe(30);
        });

        it('sets paymentTermDays to undefined when null', () => {
            const result = mapContract(makeRow({ payment_term_days: null }));
            expect(result.paymentTermDays).toBeUndefined();
        });

        it('maps acceptanceValue when present', () => {
            const result = mapContract(makeRow({ acceptance_value: '5000000' }));
            expect(result.acceptanceValue).toBe(5000000);
        });

        it('sets acceptanceValue to undefined when null', () => {
            const result = mapContract(makeRow({ acceptance_value: null }));
            expect(result.acceptanceValue).toBeUndefined();
        });
    });
});
