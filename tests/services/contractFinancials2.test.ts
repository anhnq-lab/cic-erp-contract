/**
 * Additional tests for contractFinancials.ts covering uncovered branches.
 * (Existing contractFinancials.test.ts already covers getStats/getStatsFallback.)
 */
import { describe, it, expect } from 'vitest';
import {
    isAll,
    getUnitSharePct,
    calculateRevenueFromPayments,
    calculateInvoicedFromPayments,
    calculateCashReceived,
    calculateAdvanceAmount,
    calculateReceivables,
    calculatePayables,
    getEmployeeSharePct,
} from '../../services/contract/contractFinancials';

describe('isAll', () => {
    it('returns true for undefined', () => expect(isAll(undefined)).toBe(true));
    it('returns true for null', () => expect(isAll(null)).toBe(true));
    it('returns true for empty string', () => expect(isAll('')).toBe(true));
    it('returns true for "all" (lowercase)', () => expect(isAll('all')).toBe(true));
    it('returns true for "ALL" (uppercase)', () => expect(isAll('ALL')).toBe(true));
    it('returns true for "All" (mixed case)', () => expect(isAll('All')).toBe(true));
    it('returns false for a unit ID', () => expect(isAll('unit-1')).toBe(false));
});

describe('getUnitSharePct', () => {
    it('returns 100 for lead unit with no allocations', () => {
        const contract = { unit_id: 'u1', unit_allocations: null };
        expect(getUnitSharePct(contract, 'u1')).toBe(100);
    });

    it('returns lead allocation percent when allocations present', () => {
        const contract = {
            unit_id: 'u1',
            unit_allocations: {
                allocations: [
                    { unitId: 'u1', role: 'lead', percent: 70 },
                    { unitId: 'u2', role: 'support', percent: 30 },
                ],
            },
        };
        expect(getUnitSharePct(contract, 'u1')).toBe(70);
    });

    it('defaults to 100 for lead unit when no matching lead alloc found', () => {
        const contract = {
            unit_id: 'u1',
            unit_allocations: {
                allocations: [
                    { unitId: 'u2', role: 'support', percent: 30 },
                ],
            },
        };
        expect(getUnitSharePct(contract, 'u1')).toBe(100);
    });

    it('returns support allocation percent for support unit', () => {
        const contract = {
            unit_id: 'u1',
            unit_allocations: {
                allocations: [
                    { unitId: 'u1', role: 'lead', percent: 60 },
                    { unitId: 'u2', role: 'support', percent: 40 },
                ],
            },
        };
        expect(getUnitSharePct(contract, 'u2')).toBe(40);
    });

    it('returns 0 for unrelated unit', () => {
        const contract = {
            unit_id: 'u1',
            unit_allocations: {
                allocations: [{ unitId: 'u1', role: 'lead', percent: 100 }],
            },
        };
        expect(getUnitSharePct(contract, 'u99')).toBe(0);
    });
});

describe('calculateRevenueFromPayments', () => {
    it('returns fallbackRevenue when payments is empty', () => {
        expect(calculateRevenueFromPayments([], 10, true, 500)).toBe(500);
    });

    it('returns 0 when payments exist but none are VAT_INVOICE', () => {
        const payments = [{ voucher_type: 'RECEIPT', status: 'Tiền về', amount: 1000 }];
        expect(calculateRevenueFromPayments(payments, 10, true, 500)).toBe(0);
    });

    it('uses vat_invoice_items when present (exact pre-VAT amount)', () => {
        const payments = [{
            voucher_type: 'VAT_INVOICE',
            status: 'Đã xuất HĐ',
            amount: 1100,
            vat_invoice_items: [{ amountBeforeVAT: 1000 }],
        }];
        expect(calculateRevenueFromPayments(payments, 10, true, 0)).toBe(1000);
    });

    it('divides by VAT factor when no vat_invoice_items (fallback)', () => {
        const payments = [{
            voucher_type: 'VAT_INVOICE',
            status: 'Tiền về',
            amount: 1100,
            vat_invoice_items: [],
        }];
        // 1100 / 1.1 = 1000
        expect(calculateRevenueFromPayments(payments, 10, true, 0)).toBe(1000);
    });

    it('does NOT divide by VAT when has_vat is false', () => {
        const payments = [{
            voucher_type: 'VAT_INVOICE',
            status: 'Paid',
            amount: 1000,
            vat_invoice_items: [],
        }];
        expect(calculateRevenueFromPayments(payments, 10, false, 0)).toBe(1000);
    });

    it('does NOT divide by VAT when vatRate is 0', () => {
        const payments = [{
            voucher_type: 'VAT_INVOICE',
            status: 'Đã giao KH',
            amount: 500,
            vat_invoice_items: [],
        }];
        expect(calculateRevenueFromPayments(payments, 0, true, 0)).toBe(500);
    });

    it('only counts status: Đã xuất HĐ, Đã giao KH, Tiền về, Paid', () => {
        const payments = [
            { voucher_type: 'VAT_INVOICE', status: 'Chờ xuất', amount: 500, vat_invoice_items: [] },
            { voucher_type: 'VAT_INVOICE', status: 'Đã xuất HĐ', amount: 1000, vat_invoice_items: [] },
        ];
        // Only the second payment counts; 1000 / 1.1 = 909
        expect(calculateRevenueFromPayments(payments, 10, true, 0)).toBe(909);
    });

    it('sums multiple qualifying payments', () => {
        const payments = [
            { voucher_type: 'VAT_INVOICE', status: 'Đã xuất HĐ', amount: 0, vat_invoice_items: [{ amountBeforeVAT: 500 }] },
            { voucher_type: 'VAT_INVOICE', status: 'Tiền về', amount: 0, vat_invoice_items: [{ amountBeforeVAT: 300 }] },
        ];
        expect(calculateRevenueFromPayments(payments, 10, true, 0)).toBe(800);
    });
});

describe('calculateInvoicedFromPayments', () => {
    it('returns 0 for empty payments', () => {
        expect(calculateInvoicedFromPayments([])).toBe(0);
    });

    it('sums VAT_INVOICE payments with qualifying statuses', () => {
        const payments = [
            { voucher_type: 'VAT_INVOICE', status: 'Đã xuất HĐ', amount: 1000 },
            { voucher_type: 'VAT_INVOICE', status: 'Tiền về', amount: 500 },
            { voucher_type: 'RECEIPT', status: 'Tiền về', amount: 200 }, // excluded
        ];
        expect(calculateInvoicedFromPayments(payments)).toBe(1500);
    });

    it('excludes invoices with non-qualifying status', () => {
        const payments = [
            { voucher_type: 'VAT_INVOICE', status: 'Chờ xuất', amount: 999 },
        ];
        expect(calculateInvoicedFromPayments(payments)).toBe(0);
    });
});

describe('calculateCashReceived', () => {
    it('returns 0 for empty payments', () => {
        expect(calculateCashReceived([])).toBe(0);
    });

    it('sums RECEIPT vouchers with status Tạm ứng, Tiền về, Paid', () => {
        const payments = [
            { voucher_type: 'RECEIPT', status: 'Tiền về', amount: 800 },
            { voucher_type: 'RECEIPT', status: 'Tạm ứng', amount: 200 },
            { voucher_type: 'RECEIPT', status: 'Pending', amount: 500 }, // excluded
            { voucher_type: 'VAT_INVOICE', status: 'Tiền về', amount: 300 }, // excluded
        ];
        expect(calculateCashReceived(payments)).toBe(1000);
    });
});

describe('calculateAdvanceAmount', () => {
    it('returns 0 when no advance payments', () => {
        expect(calculateAdvanceAmount([])).toBe(0);
    });

    it('sums only RECEIPT with status Tạm ứng', () => {
        const payments = [
            { voucher_type: 'RECEIPT', status: 'Tạm ứng', amount: 300 },
            { voucher_type: 'RECEIPT', status: 'Tiền về', amount: 200 }, // not advance
        ];
        expect(calculateAdvanceAmount(payments)).toBe(300);
    });
});

describe('calculateReceivables', () => {
    it('returns invoiced minus cash received', () => {
        const payments = [
            { voucher_type: 'VAT_INVOICE', status: 'Đã xuất HĐ', amount: 1000 },
            { voucher_type: 'RECEIPT', status: 'Tiền về', amount: 400 },
        ];
        expect(calculateReceivables(payments)).toBe(600);
    });

    it('returns 0 when fully paid', () => {
        const payments = [
            { voucher_type: 'VAT_INVOICE', status: 'Tiền về', amount: 500 },
            { voucher_type: 'RECEIPT', status: 'Tiền về', amount: 500 },
        ];
        expect(calculateReceivables(payments)).toBe(0);
    });
});

describe('calculatePayables', () => {
    it('returns totalInputCost minus paid expenses', () => {
        const payments = [
            { voucher_type: 'EXPENSE', status: 'Đã chi', amount: 200 },
            { voucher_type: 'EXPENSE', status: 'Chờ chi', amount: 100 }, // excluded
        ];
        expect(calculatePayables(payments, 800)).toBe(600);
    });

    it('returns full totalInputCost when no expenses paid', () => {
        expect(calculatePayables([], 1000)).toBe(1000);
    });
});

describe('getEmployeeSharePct', () => {
    it('returns 100 when employee is the contract employee_id (legacy, no allocations)', () => {
        const contract = { employee_id: 'e1', employee_allocations: [], unit_allocations: null };
        expect(getEmployeeSharePct(contract, 'e1')).toBe(100);
    });

    it('returns 0 for unrelated employee with no allocations', () => {
        const contract = { employee_id: 'e1', employee_allocations: [], unit_allocations: null };
        expect(getEmployeeSharePct(contract, 'e99')).toBe(0);
    });

    it('returns allocation percent from employee_allocations', () => {
        const contract = {
            employee_id: 'e1',
            employee_allocations: [
                { employeeId: 'e1', percent: 60, role: 'lead' },
                { employeeId: 'e2', percent: 40, role: 'support' },
            ],
            unit_allocations: null,
        };
        expect(getEmployeeSharePct(contract, 'e2')).toBe(40);
    });

    it('defaults to 100 percent when found in allocations but no percent set', () => {
        const contract = {
            employee_id: 'e1',
            employee_allocations: [{ employeeId: 'e1', role: 'lead' }],
            unit_allocations: null,
        };
        expect(getEmployeeSharePct(contract, 'e1')).toBe(100);
    });

    it('returns 100 for employee matching a support unit allocation', () => {
        const contract = {
            employee_id: 'e1',
            employee_allocations: [{ employeeId: 'e1', percent: 60, role: 'lead' }],
            unit_allocations: {
                allocations: [
                    { unitId: 'u2', role: 'support', employeeId: 'e2', percent: 40 },
                ],
            },
        };
        expect(getEmployeeSharePct(contract, 'e2')).toBe(100);
    });

    it('returns 0 for unrelated employee even with allocations set', () => {
        const contract = {
            employee_id: 'e1',
            employee_allocations: [{ employeeId: 'e1', percent: 100, role: 'lead' }],
            unit_allocations: { allocations: [] },
        };
        expect(getEmployeeSharePct(contract, 'e99')).toBe(0);
    });
});
