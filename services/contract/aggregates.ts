/**
 * Contract Aggregates — stats, KPIs, charts, completion logic.
 * Extracted from contractService.ts to enforce SRP.
 */

import { dataClient as supabase } from '../../lib/dataClient';
import { isAll, getUnitSharePct, calculateCashReceived, calculateInvoicedFromPayments } from './contractFinancials';
import type { StatsContract, ContractWithPayments, StatsAcc, EmpAlloc, UnitAlloc } from './contractTypes';

// ─── getStats ────────────────────────────────────────────────────────────────

export async function getStats(params: {
    search?: string;
    status?: string;
    unitId?: string;
    year?: string;
    dateFrom?: string;
    dateTo?: string;
    salespersonId?: string;
    classification?: string;
    matchingCustomerIds?: string[];
}): Promise<{
    totalContracts: number;
    totalValue: number;
    totalRevenue: number;
    totalProfit: number;
    totalSigningProfit: number;
    totalRevenueProfit: number;
    totalCash: number;
    processingCount: number;
    suspendedCount: number;
    handoverCount: number;
    acceptanceCount: number;
    completedCount: number;
    newContractsCount?: number;
    renewalContractsCount?: number;
    maxContract?: { title: string; code: string; value: number; customer: string; unit_id: string } | null;
    minContract?: { title: string; code: string; value: number; customer: string; unit_id: string } | null;
    unitBreakdown?: Record<string, { count: number; value: number }>;
}> {
    const { search, status, unitId, year, dateFrom, dateTo, salespersonId, classification, matchingCustomerIds } = params;

    const quoteId = (id: string): string => /[,/()\s]/.test(id) ? `"${id}"` : id;
    const buildSearchFilter = (searchTerm: string, customerIds?: string[], unaccentIds?: string[]): string => {
        const safeTerm = searchTerm.replace(/\\/g, '\\\\').replace(/,/g, '\\,');
        let filter = `title.ilike.%${safeTerm}%,contract_code.ilike.%${safeTerm}%,party_a.ilike.%${safeTerm}%,customer_contract_number.ilike.%${safeTerm}%,content.ilike.%${safeTerm}%,end_user_name.ilike.%${safeTerm}%,category.ilike.%${safeTerm}%`;
        if (customerIds && customerIds.length > 0) filter += `,customer_id.in.(${customerIds.map(quoteId).join(',')})`;
        if (unaccentIds && unaccentIds.length > 0) filter += `,id.in.(${unaccentIds.map(quoteId).join(',')})`;
        return filter;
    };

    let unaccentMatchIds: string[] | undefined;
    if (search) {
        try {
            const { data: rpcData } = await supabase.rpc('search_contracts_ids_unaccent', { search_term: search });
            if (rpcData && rpcData.length > 0) unaccentMatchIds = rpcData.map((r: { id: string }) => r.id);
        } catch (e) {
            console.warn('[ContractService] unaccent search RPC failed in getStats:', e);
        }
    }

    let query = supabase.from('contracts').select('id, value, actual_revenue, admin_profit, rev_profit, cash_received, status, title, contract_code, party_a, signed_date, unit_id, unit_allocations, employee_id, employee_allocations');
    if (search) query = query.or(buildSearchFilter(search, matchingCustomerIds, unaccentMatchIds));
    if (status && status !== 'All') query = query.eq('status', status);
    if (classification && classification !== 'All') query = query.eq('classification', classification);
    if (dateFrom || dateTo) {
        if (dateFrom) query = query.gte('signed_date', dateFrom);
        if (dateTo) query = query.lte('signed_date', dateTo);
    } else if (year && year !== 'All') {
        query = query.gte('signed_date', `${year}-01-01`).lte('signed_date', `${year}-12-31`);
    }

    const { data, error } = await query;
    if (error) throw error;

    let statusCountQuery = supabase.from('contracts').select('id, status, unit_id, unit_allocations, signed_date, category');
    if (search) statusCountQuery = statusCountQuery.or(buildSearchFilter(search, matchingCustomerIds, unaccentMatchIds));
    if (dateFrom || dateTo) {
        if (dateFrom) statusCountQuery = statusCountQuery.gte('signed_date', dateFrom);
        if (dateTo) statusCountQuery = statusCountQuery.lte('signed_date', dateTo);
    } else if (year && year !== 'All') {
        statusCountQuery = statusCountQuery.gte('signed_date', `${year}-01-01`).lte('signed_date', `${year}-12-31`);
    }
    const { data: statusData } = await statusCountQuery;

    const isFilteringByUnit = !isAll(unitId);
    const unitIds = isFilteringByUnit && unitId!.includes(',')
        ? unitId!.split(',').map(id => id.trim())
        : isFilteringByUnit ? [unitId!] : [];

    const isEmployeeInContract = (c: StatsContract, empId: string): boolean => {
        if (c.employee_id === empId) return true;
        const empAllocs = (c.employee_allocations || []) as EmpAlloc[];
        if (empAllocs.some((a) => a.employeeId === empId)) return true;
        const unitAllocs = (c.unit_allocations?.allocations || []) as UnitAlloc[];
        return unitAllocs.some((a) => a.role === 'support' && a.employeeId === empId);
    };

    const getEmpSharePct = (c: StatsContract, empId: string): number => {
        const empAllocs = (c.employee_allocations || []) as EmpAlloc[];
        if (empAllocs.length > 0) {
            const match = empAllocs.find((a) => a.employeeId === empId);
            if (match) return match.percent || 100;
        }
        const unitAllocs = (c.unit_allocations?.allocations || []) as UnitAlloc[];
        const supportMatch = unitAllocs.find((a) => a.role === 'support' && a.employeeId === empId);
        if (supportMatch) return 100;
        if (c.employee_id === empId) return 100;
        return 0;
    };

    const statusCounts = { processingCount: 0, suspendedCount: 0, handoverCount: 0, acceptanceCount: 0, completedCount: 0, newContractsCount: 0, renewalContractsCount: 0 };
    (statusData as StatsContract[] || []).forEach((c) => {
        if (isFilteringByUnit) {
            let matchedPct = 0;
            for (const targetUnitId of unitIds) matchedPct = Math.max(matchedPct, getUnitSharePct(c, targetUnitId));
            if (matchedPct === 0) return;
        }
        if (salespersonId && !isEmployeeInContract(c, salespersonId)) return;
        const cat = c.category || 'Mới';
        if (cat === 'Mới') statusCounts.newContractsCount++;
        else if (['Gia hạn', 'Bảo trì'].includes(cat)) statusCounts.renewalContractsCount++;
        if (c.status === 'Processing') statusCounts.processingCount++;
        else if (c.status === 'Suspended') statusCounts.suspendedCount++;
        else if (c.status === 'Handover') statusCounts.handoverCount++;
        else if (c.status === 'Acceptance') statusCounts.acceptanceCount++;
        else if (c.status === 'Completed') statusCounts.completedCount++;
    });

    type MinMaxContract = { title: string | null; code: string | null; value: number; customer: string | null; unit_id: string | null };
    let maxContract: MinMaxContract | null = null;
    let minContract: MinMaxContract | null = null;
    const unitBreakdown: Record<string, { count: number; value: number }> = {};

    const financials = (data as StatsContract[] || []).reduce((acc, curr) => {
        const val = curr.value || 0;
        const rev = curr.actual_revenue || 0;
        const adminProfit = curr.admin_profit || 0;
        const revProfit = curr.rev_profit || 0;
        const cash = curr.cash_received || 0;

        let unitSharePct = 100;
        if (isFilteringByUnit) {
            let matchedPct = 0;
            for (const targetUnitId of unitIds) matchedPct = Math.max(matchedPct, getUnitSharePct(curr, targetUnitId));
            unitSharePct = matchedPct;
        }
        if (unitSharePct === 0) return acc;
        if (salespersonId && !isEmployeeInContract(curr, salespersonId)) return acc;

        let fraction = unitSharePct / 100;
        if (salespersonId) fraction = fraction * getEmpSharePct(curr, salespersonId) / 100;

        const trueVal = val * fraction;
        if (trueVal > 0) {
            if (!maxContract || trueVal > maxContract.value) maxContract = { title: curr.title ?? null, code: curr.contract_code ?? null, value: trueVal, customer: curr.party_a ?? null, unit_id: curr.unit_id ?? null };
            if (!minContract || trueVal < minContract.value) minContract = { title: curr.title ?? null, code: curr.contract_code ?? null, value: trueVal, customer: curr.party_a ?? null, unit_id: curr.unit_id ?? null };
        }

        const unit = curr.unit_id || 'UNKNOWN';
        if (!unitBreakdown[unit]) unitBreakdown[unit] = { count: 0, value: 0 };
        unitBreakdown[unit].count += 1;
        unitBreakdown[unit].value += trueVal;

        return {
            totalContracts: acc.totalContracts + 1,
            totalValue: acc.totalValue + val * fraction,
            totalRevenue: acc.totalRevenue + rev * fraction,
            totalProfit: acc.totalProfit + adminProfit * fraction,
            totalSigningProfit: acc.totalSigningProfit + adminProfit * fraction,
            totalRevenueProfit: acc.totalRevenueProfit + revProfit * fraction,
            totalCash: acc.totalCash + cash * fraction,
        };
    }, { totalContracts: 0, totalValue: 0, totalRevenue: 0, totalProfit: 0, totalSigningProfit: 0, totalRevenueProfit: 0, totalCash: 0 });

    return { ...financials, ...statusCounts, maxContract, minContract, unitBreakdown };
}

// ─── getStatsRPC / getStatsFallback ──────────────────────────────────────────

export async function getStatsFallback(unitId: string = 'all', year: string = 'all', periodFilter?: string): Promise<{
    totalContracts: number; totalValue: number; totalRevenue: number; totalProfit: number;
    totalSigningProfit: number; totalRevenueProfit: number; totalCash: number;
    activeCount: number; pendingCount: number; completedCount: number; expiredCount: number;
    processingCount: number; acceptanceCount: number; suspendedCount: number; handoverCount: number;
    newContractsCount: number; renewalContractsCount: number;
}> {
    console.log('[ContractService.getStatsFallback] Using direct query with payments');
    const { data, error } = await supabase.from('contracts').select('id, value, estimated_cost, status, unit_id, unit_allocations, end_date, signed_date, vat_rate, has_vat, payments(amount, paid_amount, status, payment_type, voucher_type, payment_date, invoice_date, vat_invoice_items)');

    if (error) {
        console.error('[ContractService.getStatsFallback] Query error:', error);
        return { totalContracts: 0, totalValue: 0, totalRevenue: 0, totalProfit: 0, totalSigningProfit: 0, totalRevenueProfit: 0, totalCash: 0, activeCount: 0, pendingCount: 0, completedCount: 0, expiredCount: 0, processingCount: 0, acceptanceCount: 0, suspendedCount: 0, handoverCount: 0, newContractsCount: 0, renewalContractsCount: 0 };
    }

    console.log('[ContractService.getStatsFallback] Got contracts:', data?.length);

    const isFilteringByUnit = !isAll(unitId);
    const targetYear = year && year !== 'All' && year !== 'all' ? parseInt(year) : null;
    let startPeriodDate: Date | null = null;
    let endPeriodDate: Date | null = null;

    if (targetYear) {
        startPeriodDate = new Date(`${targetYear}-01-01T00:00:00`);
        endPeriodDate = new Date(`${targetYear}-12-31T23:59:59`);
        if (periodFilter) {
            if (periodFilter.startsWith('M')) {
                const month = parseInt(periodFilter.substring(1));
                startPeriodDate = new Date(targetYear, month - 1, 1);
                endPeriodDate = new Date(targetYear, month, 0, 23, 59, 59);
            } else if (periodFilter.startsWith('Q')) {
                const quarter = parseInt(periodFilter.substring(1));
                const startMonth = (quarter - 1) * 3;
                startPeriodDate = new Date(targetYear, startMonth, 1);
                endPeriodDate = new Date(targetYear, quarter * 3, 0, 23, 59, 59);
            }
        }
    } else if (periodFilter) {
        const currentYear = new Date().getFullYear();
        if (periodFilter.startsWith('M')) {
            const month = parseInt(periodFilter.substring(1));
            startPeriodDate = new Date(currentYear, month - 1, 1);
            endPeriodDate = new Date(currentYear, month, 0, 23, 59, 59);
        } else if (periodFilter.startsWith('Q')) {
            const quarter = parseInt(periodFilter.substring(1));
            const startMonth = (quarter - 1) * 3;
            startPeriodDate = new Date(currentYear, startMonth, 1);
            endPeriodDate = new Date(currentYear, quarter * 3, 0, 23, 59, 59);
        }
    }

    const isInPeriod = (dateStr: string | null | undefined): boolean => {
        if (!dateStr) return false;
        if (!startPeriodDate || !endPeriodDate) return true;
        const d = new Date(dateStr);
        return d >= startPeriodDate && d <= endPeriodDate;
    };

    return (data as ContractWithPayments[] || []).reduce((acc: StatsAcc, curr) => {
        let sharePct = 100;
        if (isFilteringByUnit) sharePct = getUnitSharePct(curr, unitId ?? 'all');
        if (sharePct === 0) return acc;

        const fraction = sharePct / 100;
        const isSignedMatch = isInPeriod(curr.signed_date);
        const val = curr.value || 0;
        const estimatedCost = curr.estimated_cost || 0;
        const expectedProfit = val - estimatedCost;

        if (isSignedMatch) {
            acc.totalContracts++;
            acc.totalValue += val * fraction;
            acc.totalProfit += expectedProfit * fraction;
            acc.totalSigningProfit += expectedProfit * fraction;
            const st = curr.status ?? '';
            acc.activeCount += (['Processing', 'Acceptance', 'Handover'].includes(st) ? 1 : 0);
            acc.pendingCount += (st === 'Pending' ? 1 : 0);
            acc.suspendedCount += (st === 'Suspended' ? 1 : 0);
            acc.completedCount += (st === 'Completed' ? 1 : 0);
            acc.acceptanceCount += (st === 'Acceptance' ? 1 : 0);
            acc.processingCount += (st === 'Processing' ? 1 : 0);
            acc.handoverCount += (st === 'Handover' ? 1 : 0);
            acc.expiredCount += (['Processing', 'Acceptance'].includes(st) && curr.end_date && new Date(curr.end_date) < new Date() ? 1 : 0);
        }

        const payments = curr.payments || [];
        const revenuePayments = payments.filter(
            (p) => p.voucher_type === 'VAT_INVOICE' &&
                ['Đã xuất HĐ', 'Đã giao KH', 'Tiền về', 'Paid'].includes(p.status ?? '') &&
                isInPeriod(p.invoice_date || p.payment_date)
        );
        let contractRevInPeriod = 0;
        revenuePayments.forEach((p) => {
            if (p.vat_invoice_items && p.vat_invoice_items.length > 0) {
                contractRevInPeriod += p.vat_invoice_items.reduce((s: number, item) => s + (Number(item.amountBeforeVAT) || 0), 0);
            } else {
                const gross = Number(p.amount) || 0;
                const hasVat = curr.has_vat !== false;
                const vatRate = curr.vat_rate ?? 10;
                const vatDivisor = hasVat && vatRate > 0 ? (1 + vatRate / 100) : 1;
                contractRevInPeriod += Math.round(gross / vatDivisor);
            }
        });

        const cashPayments = payments.filter(
            (p) => p.voucher_type === 'RECEIPT' &&
                ['Tạm ứng', 'Tiền về', 'Paid'].includes(p.status ?? '') &&
                isInPeriod(p.payment_date)
        );
        const contractCashInPeriod = cashPayments.reduce((sum: number, p) => sum + (Number(p.amount) || 0), 0);

        acc.totalRevenue += contractRevInPeriod * fraction;
        acc.totalCash += contractCashInPeriod * fraction;
        if (val > 0) {
            const profitRatio = expectedProfit / val;
            acc.totalRevenueProfit += (contractRevInPeriod * profitRatio) * fraction;
        }
        return acc;
    }, { totalContracts: 0, totalValue: 0, totalRevenue: 0, totalProfit: 0, totalSigningProfit: 0, totalRevenueProfit: 0, totalCash: 0, activeCount: 0, pendingCount: 0, completedCount: 0, expiredCount: 0, processingCount: 0, acceptanceCount: 0, suspendedCount: 0, handoverCount: 0, newContractsCount: 0, renewalContractsCount: 0 });
}

export async function getStatsRPC(unitId: string = 'all', year: string = 'all', periodFilter?: string) {
    console.log('[ContractService.getStatsRPC] START (Forcing DIRECT QUERY)', { unitId, year, periodFilter });
    return getStatsFallback(unitId, year, periodFilter);
}

// ─── recalculateCompletionDate ────────────────────────────────────────────────

export async function recalculateCompletionDate(contractId: string): Promise<void> {
    try {
        const { data: contract, error } = await supabase
            .from('contracts')
            .select('id, value, status, completed_date, payments(amount, paid_amount, status, payment_type, due_date, voucher_type, vat_invoice_items, payment_date, invoice_date)')
            .eq('id', contractId)
            .single();

        if (error || !contract) return;

        const payments = contract.payments || [];
        const totalCash = calculateCashReceived(payments);
        const totalInvoiced = calculateInvoicedFromPayments(payments);
        const contractValue = contract.value || 0;

        const vatDates = payments
            .filter((p) => p.voucher_type === 'VAT_INVOICE' && ['Đã xuất HĐ', 'Đã giao KH', 'Tiền về'].includes(p.status ?? ''))
            .map((p) => p.invoice_date || p.payment_date || p.due_date)
            .filter(Boolean);
        const receiptDates = payments
            .filter((p) => p.voucher_type === 'RECEIPT' && ['Tạm ứng', 'Tiền về'].includes(p.status ?? ''))
            .map((p) => p.payment_date)
            .filter(Boolean);
        const allDates = [...vatDates, ...receiptDates].sort();
        const newCompletedDate = allDates.length > 0 ? allDates[allDates.length - 1] : null;

        if (contractValue > 0 && totalInvoiced >= contractValue && totalCash >= contractValue && contract.status !== 'Completed') {
            await supabase.from('contracts')
                .update({ status: 'Completed', completed_date: newCompletedDate || new Date().toISOString().split('T')[0] })
                .eq('id', contractId);
        } else if (contract.status === 'Completed' && newCompletedDate && newCompletedDate !== contract.completed_date) {
            await supabase.from('contracts').update({ completed_date: newCompletedDate }).eq('id', contractId);
        }
    } catch (e) {
        console.error('[recalcCompletionDate] Error:', e);
    }
}

// ─── checkAutoStatusTransitions ───────────────────────────────────────────────

export async function checkAutoStatusTransitions(): Promise<{ updated: number; details: string[] }> {
    const logPrefix = '[AutoStatus]';
    console.log(`${logPrefix} Checking auto status transitions...`);
    const details: string[] = [];
    let updated = 0;

    try {
        const { data: contracts, error } = await supabase
            .from('contracts')
            .select('id, value, status, payments(amount, paid_amount, status, payment_type, due_date, voucher_type, vat_invoice_items, payment_date, invoice_date)')
            .in('status', ['Processing', 'Handover', 'Acceptance']);

        if (error || !contracts) {
            console.error(`${logPrefix} Query error:`, error);
            return { updated: 0, details: ['Query error'] };
        }

        for (const contract of contracts) {
            const contractValue = contract.value || 0;
            if (contractValue <= 0) continue;
            const payments = contract.payments || [];
            const totalCash = calculateCashReceived(payments);
            const totalInvoiced = calculateInvoicedFromPayments(payments);

            if (totalInvoiced >= contractValue && totalCash >= contractValue) {
                const vatDates = payments.filter((p) => p.voucher_type === 'VAT_INVOICE' && ['Đã xuất HĐ', 'Đã giao KH', 'Tiền về'].includes(p.status ?? '')).map((p) => p.invoice_date || p.payment_date || p.due_date).filter(Boolean);
                const receiptDates = payments.filter((p) => p.voucher_type === 'RECEIPT' && ['Tạm ứng', 'Tiền về'].includes(p.status ?? '')).map((p) => p.payment_date).filter(Boolean);
                const completedDate = [...vatDates, ...receiptDates].sort().pop() || new Date().toISOString().split('T')[0];
                const { error: updateError } = await supabase.from('contracts').update({ status: 'Completed', completed_date: completedDate }).eq('id', contract.id);
                if (!updateError) {
                    updated++;
                    details.push(`${contract.id}: → Hoàn thành (VAT ${totalInvoiced} ≥ ${contractValue}, tiền về ${totalCash} ≥ ${contractValue}, ngày ${completedDate})`);
                }
            }
        }

        // Backfill: Fix Completed contracts missing completed_date
        const { data: missingDateContracts, error: missingError } = await supabase
            .from('contracts')
            .select('id, value, status, completed_date, payments(amount, paid_amount, status, payment_type, due_date, voucher_type, vat_invoice_items, payment_date, invoice_date)')
            .eq('status', 'Completed');

        if (!missingError && missingDateContracts) {
            for (const contract of missingDateContracts) {
                const payments = contract.payments || [];
                const vatDates = payments.filter((p) => p.voucher_type === 'VAT_INVOICE' && ['Đã xuất HĐ', 'Đã giao KH', 'Tiền về'].includes(p.status ?? '')).map((p) => p.invoice_date || p.payment_date || p.due_date).filter(Boolean);
                const receiptDates = payments.filter((p) => p.voucher_type === 'RECEIPT' && ['Tạm ứng', 'Tiền về'].includes(p.status ?? '')).map((p) => p.payment_date).filter(Boolean);
                const completedDate = [...vatDates, ...receiptDates].sort().pop() || new Date().toISOString().split('T')[0];
                if (completedDate !== contract.completed_date) {
                    const { error: updateErr } = await supabase.from('contracts').update({ completed_date: completedDate }).eq('id', contract.id);
                    if (!updateErr) {
                        updated++;
                        details.push(`${contract.id}: Fix completed_date ${contract.completed_date} → ${completedDate}`);
                    }
                }
            }
        }

        console.log(`${logPrefix} Done. Updated ${updated} contracts.`);
        return { updated, details };
    } catch (err) {
        console.error(`${logPrefix} Error:`, err);
        return { updated: 0, details: ['Error occurred'] };
    }
}

// ─── getPaymentStatsRPC ───────────────────────────────────────────────────────

export async function getPaymentStatsRPC(contractId: string): Promise<{
    totalAmount: number; paidAmount: number; remainingAmount: number; overdueAmount: number;
}> {
    const { data, error } = await supabase.rpc('get_payment_stats', { p_contract_id: contractId });
    if (error) {
        console.error('get_payment_stats RPC error:', error);
        return { totalAmount: 0, paidAmount: 0, remainingAmount: 0, overdueAmount: 0 };
    }
    if (data && data.length > 0) {
        return {
            totalAmount: Number(data[0].total_amount),
            paidAmount: Number(data[0].paid_amount),
            remainingAmount: Number(data[0].remaining_amount),
            overdueAmount: Number(data[0].overdue_amount),
        };
    }
    return { totalAmount: 0, paidAmount: 0, remainingAmount: 0, overdueAmount: 0 };
}

// ─── getChartDataFallback / getChartDataRPC ───────────────────────────────────

export async function getChartDataFallback(unitId: string = 'all', year: string = 'all'): Promise<Array<{ month: number; revenue: number; profit: number; revProfit: number; signing: number }>> {
    console.log('[ContractService.getChartDataFallback] Using direct query with payments');
    const { data, error } = await supabase.from('contracts').select('signed_date, value, estimated_cost, unit_id, unit_allocations, vat_rate, has_vat, payments(amount, paid_amount, status, payment_type, voucher_type, payment_date, invoice_date, vat_invoice_items)');

    if (error) {
        console.error('[ContractService.getChartDataFallback] Query error:', error);
        return [];
    }

    const isFilteringByUnit = !isAll(unitId);
    const targetYear = year && year !== 'All' && year !== 'all' ? parseInt(year) : null;
    const monthlyData: Record<number, { revenue: number; profit: number; revProfit: number; signing: number }> = {};
    for (let m = 1; m <= 12; m++) monthlyData[m] = { revenue: 0, profit: 0, revProfit: 0, signing: 0 };

    (data as unknown as ContractWithPayments[] || []).forEach((c) => {
        let sharePct = 100;
        if (isFilteringByUnit) sharePct = getUnitSharePct(c, unitId ?? 'all');
        if (sharePct === 0) return;
        const fraction = sharePct / 100;
        const val = c.value || 0;
        const expectedProfit = val - (c.estimated_cost || 0);

        if (c.signed_date) {
            const sDate = new Date(c.signed_date);
            if (!targetYear || sDate.getFullYear() === targetYear) {
                const month = sDate.getMonth() + 1;
                monthlyData[month].signing += val * fraction;
                monthlyData[month].profit += expectedProfit * fraction;
            }
        }

        const payments = c.payments || [];
        payments.filter(
            (p) => p.voucher_type === 'VAT_INVOICE' && ['Đã xuất HĐ', 'Đã giao KH', 'Tiền về', 'Paid'].includes(p.status ?? '')
        ).forEach((p) => {
            const pDateStr = p.invoice_date || p.payment_date;
            if (!pDateStr) return;
            const pDate = new Date(pDateStr);
            if (!targetYear || pDate.getFullYear() === targetYear) {
                const month = pDate.getMonth() + 1;
                let preVatAmount = 0;
                if (p.vat_invoice_items && p.vat_invoice_items.length > 0) {
                    preVatAmount = p.vat_invoice_items.reduce((s: number, item) => s + (Number(item.amountBeforeVAT) || 0), 0);
                } else {
                    const gross = Number(p.amount) || 0;
                    const hasVat = c.has_vat !== false;
                    const vatRate = c.vat_rate ?? 10;
                    const vatDivisor = hasVat && vatRate > 0 ? (1 + vatRate / 100) : 1;
                    preVatAmount = Math.round(gross / vatDivisor);
                }
                monthlyData[month].revenue += preVatAmount * fraction;
                if (val > 0) monthlyData[month].revProfit += (preVatAmount * expectedProfit / val) * fraction;
            }
        });
    });

    return Object.entries(monthlyData).map(([month, vals]) => ({ month: Number(month), ...vals }));
}

export async function getChartDataRPC(unitId: string = 'all', year: string = 'all') {
    console.log('[ContractService.getChartDataRPC] START (Forcing DIRECT QUERY)', { unitId, year });
    return getChartDataFallback(unitId, year);
}
