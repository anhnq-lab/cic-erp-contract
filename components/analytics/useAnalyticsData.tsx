/**
 * Analytics — useAnalyticsData hook.
 * Extracted from Analytics.tsx (Phase 2 refactor).
 *
 * Handles all data fetching, memos, and chart data computations for Analytics.
 */

import React, { useState, useEffect, useMemo } from 'react';
import { Link } from 'react-router-dom';
import { toast } from 'sonner';
import {
  ContractService, UnitService, EmployeeService,
  PaymentService, HistoricalProductionService,
  CustomerService, BrandService, ProductService,
} from '../../services';
import type {
  Unit, Contract, Employee, Payment, HistoricalProduction,
  Customer, Brand, Product,
} from '../../types';
import { getTooltipStyle } from '../../lib/themeColors';
import { formatCurrencyCompact, formatCurrency } from './analyticsHelpers';

// ─── Hook params ─────────────────────────────────────────────────────────────

interface UseAnalyticsDataParams {
  selectedUnit: Unit;
  yearFilter: string;
  periodFilter?: string | null;
  visibleUnits: string[] | 'all';
}

// ─── Hook ────────────────────────────────────────────────────────────────────

export function useAnalyticsData({
  selectedUnit,
  yearFilter,
  periodFilter,
  visibleUnits,
}: UseAnalyticsDataParams) {

  const [isLoading, setIsLoading] = useState(true);

  // ─── Raw data state ───────────────────────────────────────────────────────

  const [contracts, setContracts] = useState<Contract[]>([]);
  const [units, setUnits] = useState<Unit[]>([]);
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [payments, setPayments] = useState<Payment[]>([]);
  const [historicalData, setHistoricalData] = useState<HistoricalProduction[]>([]);
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [brands, setBrands] = useState<Brand[]>([]);
  const [products, setProducts] = useState<Product[]>([]);

  const [statsData, setStatsData] = useState<{
    totalRevenue: number; totalProfit: number; totalSigningProfit: number;
    totalRevenueProfit: number; totalCash: number; totalValue: number; totalContracts: number;
  } | null>(null);

  // ─── Fetch base data (once) ───────────────────────────────────────────────

  useEffect(() => {
    const fetchBaseData = async () => {
      try {
        const [u, e, hRes, cust, br, prd] = await Promise.all([
          UnitService.getAll(),
          EmployeeService.getAll(),
          HistoricalProductionService.getAll(),
          CustomerService.getAll(),
          BrandService.getAll(),
          ProductService.getAll(),
        ]);
        setUnits(u);
        setEmployees(e);
        setHistoricalData(hRes);
        setCustomers(Array.isArray(cust) ? cust : cust.data || []);
        setBrands(Array.isArray(br) ? br : (br as any).data || []);
        setProducts(Array.isArray(prd) ? prd : (prd as any).data || []);
      } catch {
        toast.error('Lỗi tải dữ liệu cơ sở');
      }
    };
    fetchBaseData();
  }, []);

  // ─── Fetch filtered data (when unit/year changes) ─────────────────────────

  useEffect(() => {
    let cancelled = false;
    const fetchFilteredData = async () => {
      setIsLoading(true);
      try {
        const unitId = selectedUnit?.id === 'all' ? 'all' : selectedUnit?.id;

        let dateFrom: string | undefined = undefined;
        let dateTo: string | undefined = undefined;

        if (yearFilter && yearFilter !== 'All' && yearFilter !== 'all') {
          dateFrom = `${yearFilter}-01-01`;
          dateTo = `${yearFilter}-12-31`;
          if (periodFilter) {
            if (periodFilter.startsWith('M')) {
              const month = parseInt(periodFilter.substring(1));
              dateFrom = `${yearFilter}-${month.toString().padStart(2, '0')}-01`;
              dateTo = new Date(parseInt(yearFilter), month, 0).toISOString().split('T')[0];
            } else if (periodFilter.startsWith('Q')) {
              const quarter = parseInt(periodFilter.substring(1));
              const startMonth = (quarter - 1) * 3 + 1;
              const endMonth = quarter * 3;
              dateFrom = `${yearFilter}-${startMonth.toString().padStart(2, '0')}-01`;
              dateTo = new Date(parseInt(yearFilter), endMonth, 0).toISOString().split('T')[0];
            }
          }
        }

        const [stats, contractsRes, payRes] = await Promise.all([
          ContractService.getStats({ unitId, dateFrom, dateTo }),
          ContractService.list({ page: 1, limit: 10000, unitId, dateFrom, dateTo }),
          PaymentService.list({ page: 1, limit: 10000 }),
        ]);

        if (!cancelled) {
          setStatsData(stats as any);
          setContracts(contractsRes.data);
          setPayments(payRes.data);
        }
      } catch {
        toast.error('Lỗi tải dữ liệu thống kê');
      } finally {
        if (!cancelled) setIsLoading(false);
      }
    };
    fetchFilteredData();
    return () => { cancelled = true; };
  }, [selectedUnit, yearFilter, periodFilter]);

  // ─── Derived data ─────────────────────────────────────────────────────────

  const filteredContracts = contracts;

  const activeContracts = useMemo(
    () => filteredContracts.filter(c =>
      ['Processing', 'Handover', 'Acceptance', 'Completed'].includes(c.status)
    ),
    [filteredContracts]
  );

  const availableYears = useMemo(() => {
    const years = new Set(contracts.map(c =>
      c.signedDate ? c.signedDate.split('-')[0] : new Date().getFullYear().toString()
    ));
    return Array.from(years).sort().reverse();
  }, [contracts]);

  // ─── KPI data ─────────────────────────────────────────────────────────────

  const kpiData = useMemo(() => {
    if (!statsData) return { totalRevenue: 0, totalProfit: 0, contractCount: 0, completionRate: 0 };

    const totalRevenue = statsData.totalRevenue || 0;
    const totalProfit = statsData.totalSigningProfit || 0;
    const contractCount = statsData.totalContracts || 0;

    let targetRevenue = 0;
    const safeUnitForKpi = units.find(u => u.id === selectedUnit.id) || selectedUnit;
    if (selectedUnit.id === 'all') {
      const businessUnits = units.filter(u => u.id !== 'all' && (u.type === 'Center' || u.type === 'Branch'));
      targetRevenue = businessUnits.reduce((sum, u) => sum + (u.target?.revenue || 0), 0);
    } else {
      targetRevenue = safeUnitForKpi.target?.revenue || 0;
    }
    const completionRate = targetRevenue > 0 ? Math.min(100, (totalRevenue / targetRevenue) * 100) : 0;

    return { totalRevenue, totalProfit, contractCount, completionRate };
  }, [statsData, selectedUnit, units]);

  // ─── Chart computations ───────────────────────────────────────────────────

  // 1. Revenue Structure Pie
  const structureData = useMemo(() => {
    const allowedUnits = units.filter(u => {
      if (u.id === 'all') return false;
      if (visibleUnits === 'all') return true;
      return visibleUnits.includes(u.id);
    });

    if (selectedUnit.id === 'all') {
      return allowedUnits.map(u => ({
        name: u.name,
        value: contracts
          .filter(c => c.unitId === u.id && (yearFilter === 'All' || c.signedDate?.startsWith(yearFilter)))
          .reduce((sum, c) => sum + (c.actualRevenue || 0), 0),
      })).filter(d => d.value > 0);
    } else {
      return employees
        .filter(e => e.unitId === selectedUnit.id)
        .map(e => ({
          name: e.name,
          value: filteredContracts
            .filter(c => c.salespersonId === e.id)
            .reduce((sum, c) => sum + (c.actualRevenue || 0), 0),
        }))
        .filter(d => d.value > 0)
        .sort((a, b) => b.value - a.value);
    }
  }, [units, contracts, selectedUnit, yearFilter, employees, filteredContracts, visibleUnits]);

  // 2. Plan vs Actual
  const planVsActualData = useMemo(() => {
    const allowedUnits = units.filter(u => {
      if (u.id === 'all') return false;
      if (visibleUnits === 'all') return true;
      return visibleUnits.includes(u.id);
    });

    return allowedUnits
      .filter(u => selectedUnit.id === 'all' || u.id === selectedUnit.id)
      .map(u => {
        const unitContracts = contracts.filter(c =>
          c.unitId === u.id && (yearFilter === 'All' || c.signedDate?.startsWith(yearFilter))
        );
        return {
          name: u.name,
          Target: u.target?.revenue || 0,
          Actual: unitContracts.reduce((sum, c) => sum + (c.actualRevenue || 0), 0),
        };
      });
  }, [units, contracts, selectedUnit, yearFilter, visibleUnits]);

  // 3. Monthly Trend
  const monthlyTrendData = useMemo(() => {
    const months = Array.from({ length: 12 }, (_, i) => `Th.${i + 1}`);
    return months.map((m, i) => {
      const monthStr = (i + 1).toString().padStart(2, '0');
      const monthContracts = filteredContracts.filter(c =>
        c.signedDate && c.signedDate.split('-')[1] === monthStr
      );
      return {
        name: m,
        DoanhThu: monthContracts.reduce((sum, c) => sum + (c.actualRevenue || 0), 0),
        LoiNhuan: monthContracts.reduce((sum, c) => sum + ((c.value || 0) - (c.estimatedCost || 0)), 0),
      };
    });
  }, [filteredContracts]);

  // 4. Cashflow (In vs Out)
  const cashflowData = useMemo(() => {
    const months = Array.from({ length: 12 }, (_, i) => `Th.${i + 1}`);
    const filteredContractIds = new Set(filteredContracts.map(c => c.id));
    const effectiveYear = yearFilter === 'All' ? new Date().getFullYear().toString() : yearFilter;

    return months.map((m, i) => {
      const monthStr = (i + 1).toString().padStart(2, '0');
      const relevantPayments = payments.filter(p => {
        if (!p.paymentDate) return false;
        const matchContract = filteredContractIds.has(p.contractId);
        if (yearFilter === 'All') {
          return p.paymentDate.split('-')[1] === monthStr && matchContract;
        }
        return p.paymentDate.startsWith(`${effectiveYear}-${monthStr}`) && matchContract;
      });

      const inFlow = relevantPayments
        .filter(p => (p.paymentType === 'Revenue' || !p.paymentType) && (p.status === 'Tiền về' || p.status === 'Tạm ứng'))
        .reduce((sum, p) => sum + p.paidAmount, 0);
      const outFlow = relevantPayments
        .filter(p => p.paymentType === 'Expense' && p.status === 'Đã chi')
        .reduce((sum, p) => sum + p.paidAmount, 0);

      return { name: m, Thu: inFlow, Chi: outFlow, Rong: inFlow - outFlow };
    });
  }, [payments, filteredContracts, yearFilter]);

  // 5. Historical Comparison (YoY)
  const historicalComparisonData = useMemo(() => {
    const relevantHist = historicalData.filter(h =>
      selectedUnit.id === 'all' ? true : h.unitId === selectedUnit.id
    );
    const yearMap = new Map<number, any>();
    relevantHist.forEach(h => {
      if (!yearMap.has(h.year)) {
        yearMap.set(h.year, { name: h.year.toString(), 'Ký kết': 0, 'Doanh thu': 0, 'LNG QT': 0, 'LNG DT': 0 });
      }
      const entry = yearMap.get(h.year);
      entry['Ký kết'] += h.signing * 1000000;
      entry['Doanh thu'] += h.revenue * 1000000;
      entry['LNG QT'] += h.adminProfit * 1000000;
      entry['LNG DT'] += h.revProfit * 1000000;
    });
    return Array.from(yearMap.values()).sort((a, b) => parseInt(a.name) - parseInt(b.name));
  }, [historicalData, selectedUnit]);

  // 6. Top Customers
  const topCustomersData = useMemo(() => {
    const customerMap = new Map<string, number>();
    filteredContracts.forEach(c => {
      if (c.customerId) {
        customerMap.set(c.customerId, (customerMap.get(c.customerId) || 0) + (c.actualRevenue || 0));
      }
    });
    return Array.from(customerMap.entries())
      .map(([id, rev]) => ({
        id,
        type: 'CUSTOMER',
        name: customers.find(cus => cus.id === id)?.shortName
          || customers.find(cus => cus.id === id)?.name
          || 'Khách hàng ẩn',
        value: rev,
      }))
      .filter(d => d.value > 0)
      .sort((a, b) => b.value - a.value)
      .slice(0, 5);
  }, [filteredContracts, customers]);

  // 7. Top Brands
  const topBrandsData = useMemo(() => {
    const brandMap = new Map<string, number>();
    activeContracts.forEach(c => {
      if (c.lineItems && Array.isArray(c.lineItems)) {
        c.lineItems.forEach((li: any) => {
          const product = products.find(p => p.id === li.productId);
          if (product && product.brandId) {
            const lineRevenue = (li.outputPrice || 0) * (li.quantity || 1);
            brandMap.set(product.brandId, (brandMap.get(product.brandId) || 0) + lineRevenue);
          }
        });
      }
    });
    return Array.from(brandMap.entries())
      .map(([id, rev]) => ({
        id,
        type: 'BRAND',
        name: brands.find(b => b.id === id)?.name || 'Hãng khác',
        value: rev,
      }))
      .filter(d => d.value > 0)
      .sort((a, b) => b.value - a.value)
      .slice(0, 5);
  }, [activeContracts, products, brands]);

  // 8. Product Category Distribution
  const productCategoryData = useMemo(() => {
    const catMap = new Map<string, number>();
    activeContracts.forEach(c => {
      if (c.lineItems && Array.isArray(c.lineItems)) {
        c.lineItems.forEach((li: any) => {
          const product = products.find(p => p.id === li.productId);
          const cat = product?.category || 'Chưa phân loại';
          const lineRevenue = (li.outputPrice || 0) * (li.quantity || 1);
          catMap.set(cat, (catMap.get(cat) || 0) + lineRevenue);
        });
      }
    });
    return Array.from(catMap.entries())
      .map(([name, value]) => ({ id: name, type: 'CATEGORY', name, value }))
      .filter(d => d.value > 0)
      .sort((a, b) => b.value - a.value);
  }, [activeContracts, products]);

  // 9. Payment Status / Debt
  const paymentStatusData = useMemo(() => {
    let paid = 0, invoiceIssuedNotPaid = 0, notInvoiced = 0;
    filteredContracts.forEach(c => {
      const actualRev = c.actualRevenue || 0;
      const cashed = c.cashReceived || 0;
      const invoiced = c.invoicedAmount || 0;
      paid += cashed;
      invoiceIssuedNotPaid += Math.max(0, invoiced - cashed);
      notInvoiced += Math.max(0, actualRev - Math.max(cashed, invoiced));
    });
    return [
      { name: 'Đã thanh toán', value: paid, color: '#10b981' },
      { name: 'Đã X.HĐ (Chờ thu)', value: invoiceIssuedNotPaid, color: '#f59e0b' },
      { name: 'Chưa X.HĐ', value: notInvoiced, color: '#ef4444' },
    ].filter(d => d.value > 0);
  }, [filteredContracts]);

  // 10. Top Employees
  const topEmployeesData = useMemo(() => {
    const empMap = new Map<string, number>();
    filteredContracts.forEach(c => {
      const rev = c.actualRevenue || 0;
      if (rev > 0 && c.salespersonId) {
        empMap.set(c.salespersonId, (empMap.get(c.salespersonId) || 0) + rev);
      }
    });
    return Array.from(empMap.entries())
      .map(([id, rev]) => ({
        id,
        type: 'EMPLOYEE',
        name: employees.find(e => e.id === id)?.name || 'Không xác định',
        value: rev,
      }))
      .sort((a, b) => b.value - a.value)
      .slice(0, 5);
  }, [filteredContracts, employees]);

  // 11. Brand Profitability Margin
  const brandProfitabilityData = useMemo(() => {
    const brandMap = new Map<string, { rev: number; profit: number }>();
    activeContracts.forEach(c => {
      if (c.lineItems && Array.isArray(c.lineItems)) {
        c.lineItems.forEach((li: any) => {
          const product = products.find(p => p.id === li.productId);
          if (product && product.brandId) {
            const lineRevenue = (li.outputPrice || 0) * (li.quantity || 1);
            const proportion = c.value > 0 ? lineRevenue / c.value : 0;
            const allocatedProfit = ((c.adminProfit || 0) + (c.revProfit || 0)) * proportion;
            const current = brandMap.get(product.brandId) || { rev: 0, profit: 0 };
            brandMap.set(product.brandId, {
              rev: current.rev + lineRevenue,
              profit: current.profit + allocatedProfit,
            });
          }
        });
      }
    });
    return Array.from(brandMap.entries())
      .map(([id, data]) => ({
        id,
        type: 'BRAND',
        name: brands.find(b => b.id === id)?.name || 'Hãng khác',
        value: data.rev > 0 ? (data.profit / data.rev) * 100 : 0,
        revenue: data.rev,
      }))
      .filter(d => d.revenue > 0)
      .sort((a, b) => b.value - a.value)
      .slice(0, 5);
  }, [activeContracts, products, brands]);

  // ─── Hover table renderer ─────────────────────────────────────────────────

  const renderHoverTable = (data: any): React.ReactNode | null => {
    let matches: { contract: Contract; displayValue: number }[] = [];

    if (data.type === 'CUSTOMER') {
      matches = activeContracts
        .filter(c => c.customerId === data.id)
        .map(c => ({ contract: c, displayValue: c.actualRevenue || 0 }));
    } else if (data.type === 'BRAND') {
      activeContracts.forEach(c => {
        const brandRevenue = (c.lineItems || []).reduce((sum: number, li: any) => {
          const product = products.find(p => p.id === li.productId);
          if (product?.brandId === data.id) {
            return sum + (li.outputPrice || 0) * (li.quantity || 1);
          }
          return sum;
        }, 0);
        if (brandRevenue > 0) matches.push({ contract: c, displayValue: brandRevenue });
      });
      matches.sort((a, b) => b.displayValue - a.displayValue);
    } else if (data.type === 'EMPLOYEE') {
      matches = activeContracts
        .filter(c => c.salespersonId === data.id)
        .map(c => ({ contract: c, displayValue: c.actualRevenue || 0 }));
    } else if (data.type === 'CATEGORY') {
      activeContracts.forEach(c => {
        const catRevenue = (c.lineItems || []).reduce((sum: number, li: any) => {
          const product = products.find(p => p.id === li.productId);
          if ((product?.category || 'Chưa phân loại') === data.name) {
            return sum + (li.outputPrice || 0) * (li.quantity || 1);
          }
          return sum;
        }, 0);
        if (catRevenue > 0) matches.push({ contract: c, displayValue: catRevenue });
      });
      matches.sort((a, b) => b.displayValue - a.displayValue);
    }

    if (matches.length === 0) return null;

    return (
      <div className="mt-3 pt-3 border-t border-slate-200 dark:border-slate-700">
        <p className="text-sm font-semibold text-slate-500 dark:text-slate-400 mb-2">
          Chi tiết Hợp đồng ({matches.length}):
        </p>
        <div className="space-y-1.5 min-w-[440px] max-h-[200px] overflow-y-auto pr-2 select-text pointer-events-auto styled-scrollbar">
          {matches.map(({ contract: c, displayValue }) => (
            <Link
              key={c.id}
              to={`/?contractId=${c.id}`}
              className="flex justify-between items-center text-[13px] gap-4 hover:bg-slate-100 dark:hover:bg-slate-800 rounded px-2 -mx-2 py-1.5 transition-all text-slate-700 dark:text-slate-300 hover:text-indigo-600 dark:hover:text-indigo-400 group"
            >
              <span className="truncate max-w-[320px] font-medium" title={c.title}>
                {c.contractCode} - {c.title}
              </span>
              <span className="font-bold text-slate-900 group-hover:text-indigo-600 dark:text-slate-100 dark:group-hover:text-indigo-400 shrink-0">
                {formatCurrencyCompact(displayValue)}
              </span>
            </Link>
          ))}
        </div>
      </div>
    );
  };

  // ─── Return ───────────────────────────────────────────────────────────────

  return {
    isLoading,
    units,
    contracts,
    availableYears,
    // chart data
    kpiData,
    structureData,
    planVsActualData,
    monthlyTrendData,
    cashflowData,
    historicalComparisonData,
    topCustomersData,
    topBrandsData,
    productCategoryData,
    paymentStatusData,
    topEmployeesData,
    brandProfitabilityData,
    // render helper
    renderHoverTable,
  };
}
