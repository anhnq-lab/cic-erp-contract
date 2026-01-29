
import React, { useMemo, useState, useEffect } from 'react';
import { toast } from 'sonner';
import {
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell,
  Line,
  ComposedChart,
} from 'recharts';
import ChatWidget from './ChatWidget';
import {
  FileText,
  CreditCard,
  Target,
  Users,
  TrendingUp,
  Wallet,
  ArrowUpRight,
  ArrowDownRight,
  ClipboardList,
  CheckCircle2,
  AlertCircle,
  Clock,
  Building2,
  Sparkles,
  Zap,
  ShieldCheck,
  Loader2,
  ChevronDown,
  Calendar
} from 'lucide-react';
import { ContractService, UnitService, EmployeeService, PaymentService } from '../services';
import { Unit, KPIPlan, Contract, Employee, Payment } from '../types';
import { getSmartInsightsWithDeepSeek } from '../services/openaiService';

interface DashboardProps {
  selectedUnit: Unit;
  onSelectUnit: (unit: Unit) => void;
  onSelectContract: (id: string) => void;
}

const COLORS = ['#4f46e5', '#10b981', '#f59e0b', '#8b5cf6', '#06b6d4', '#ec4899'];

const Dashboard: React.FC<DashboardProps> = ({ selectedUnit, onSelectUnit }) => {
  const [activeMetric, setActiveMetric] = useState<keyof KPIPlan>('signing');
  const [showUnitSelector, setShowUnitSelector] = useState(false);
  const [yearFilter, setYearFilter] = useState<string>(new Date().getFullYear().toString());

  const [aiInsights, setAiInsights] = useState<any[]>([]);
  const [isLoadingAI, setIsLoadingAI] = useState(false);

  // Data State
  const [loadingConfig, setLoadingConfig] = useState(true);
  const [allContracts, setAllContracts] = useState<Contract[]>([]);
  const [allUnits, setAllUnits] = useState<Unit[]>([]);
  const [allSalespeople, setAllSalespeople] = useState<Employee[]>([]);
  const [allPayments, setAllPayments] = useState<Payment[]>([]);

  useEffect(() => {
    const fetchDashboardData = async () => {
      setLoadingConfig(true);
      try {
        // Safe individual fetching to prevent one failure from crashing everything
        const [contracts, units, people, paymentsRes] = await Promise.all([
          ContractService.getAll().catch(e => { console.error('Contracts sync failed', e); return []; }),
          UnitService.getAll().catch(e => { console.error('Units sync failed', e); return []; }),
          EmployeeService.getAll().catch(e => { console.error('Employees sync failed', e); return []; }),
          PaymentService.list({ page: 1, limit: 10000 }).catch(e => { console.error('Payments sync failed', e); return { data: [], total: 0 }; })
        ]);

        setAllContracts(contracts);
        setAllUnits(units);
        setAllSalespeople(people);
        // PaymentService.list returns { data }.
        setAllPayments(paymentsRes.data);

        // Only fetch AI after data is ready (initial load)
        // fetchAI(contracts); // Moved to useEffect depending on filteredContracts
      } catch (error) {
        console.error("Dashboard Fetch Error", error);
        toast.error("Không thể tải dữ liệu Dashboard. Vui lòng thử lại.");
      } finally {
        setLoadingConfig(false);
      }
    };
    fetchDashboardData();
  }, []);

  const fetchAI = async (contracts: Contract[]) => {
    setIsLoadingAI(true);
    try {
      const res = await getSmartInsightsWithDeepSeek(contracts);
      // Ensure res is array
      if (Array.isArray(res)) {
        setAiInsights(res);
      } else {
        setAiInsights([]);
      }
    } catch (e) { console.error(e); setAiInsights([]); }
    setIsLoadingAI(false);
  };

  // Re-fetch AI when filters change (debounced slightly to avoid spamming)
  // Implementation moved to after filteredContracts definition

  // Extract available years
  const availableYears = useMemo(() => {
    const years = new Set(allContracts.map(c => {
      if (!c.signedDate) return new Date().getFullYear().toString();
      return c.signedDate.split('-')[0];
    }));
    return Array.from(years).sort((a: string, b: string) => b.localeCompare(a));
  }, [allContracts]);

  // Filter Logic: UNIT + YEAR
  const filteredContracts = useMemo(() => {
    let result = allContracts;

    // 1. Filter by Unit
    if (selectedUnit && selectedUnit.id !== 'all') {
      result = result.filter(c => c.unitId === selectedUnit.id);
    }

    // 2. Filter by Year
    if (yearFilter !== 'All') {
      result = result.filter(c => c.signedDate && c.signedDate.startsWith(yearFilter));
    }

    return result;
  }, [selectedUnit, allContracts, yearFilter]);

  // AI Effect
  useEffect(() => {
    if (filteredContracts.length > 0) {
      const timer = setTimeout(() => {
        fetchAI(filteredContracts);
      }, 800);
      return () => clearTimeout(timer);
    }
  }, [filteredContracts]);

  const unitSales = useMemo(() => {
    if (!selectedUnit || selectedUnit.id === 'all') return allSalespeople;
    return allSalespeople.filter(s => s.unitId === selectedUnit.id);
  }, [selectedUnit, allSalespeople]);

  const stats = useMemo(() => {
    // Create a Set for O(1) lookup of filtered contract IDs
    const filteredContractIds = new Set(filteredContracts.map(c => c.id));

    const relevantPayments = allPayments.filter(p => {
      // Filter payments by Unit via Contract
      if (selectedUnit && selectedUnit.id !== 'all') {
        const contract = allContracts.find(c => c.id === p.contractId);
        if (contract?.unitId !== selectedUnit.id) return false;
      }

      // Filter payments by contracts currently in the filtered view (Year filter)
      // This ensures stats align with the contracts displayed/filtered by year
      return filteredContractIds.has(p.contractId);
    });

    const totalRevenueIn = relevantPayments
      .filter(p => (p.paymentType === 'Revenue' || !p.paymentType) && (p.status === 'Paid' || p.status === 'Tiền về'))
      .reduce((sum, p) => sum + p.paidAmount, 0);

    const totalExpenseOut = relevantPayments
      .filter(p => p.paymentType === 'Expense' && (p.status === 'Paid' || p.status === 'Tiền về'))
      .reduce((sum, p) => sum + p.paidAmount, 0);

    const netCashflow = totalRevenueIn - totalExpenseOut;

    const actual: KPIPlan & { netCashflow: number } = {
      signing: filteredContracts.reduce((acc, curr) => acc + (curr.value || 0), 0),
      revenue: filteredContracts.reduce((acc, curr) => acc + (curr.actualRevenue || 0), 0),
      adminProfit: filteredContracts.reduce((acc, curr) => acc + ((curr.value || 0) - (curr.estimatedCost || 0)), 0),
      revProfit: filteredContracts.reduce((acc, curr) => acc + ((curr.actualRevenue || 0) - (curr.actualCost || 0)), 0),
      cash: totalRevenueIn,
      netCashflow: netCashflow
    };

    const statusCounts = {
      active: filteredContracts.filter(c => c.status === 'Active').length,
      pending: filteredContracts.filter(c => c.status === 'Pending' || c.status === 'Reviewing').length,
      expired: filteredContracts.filter(c => c.status === 'Expired').length,
      completed: filteredContracts.filter(c => c.status === 'Completed').length,
    };

    return { actual, statusCounts };
  }, [filteredContracts, allPayments, selectedUnit, allContracts]);

  // Aggregate monthly data based on actual contracts if possible, or fallback to mock pattern but with real total
  const monthlyData = useMemo(() => {
    const months = ['Th.1', 'Th.2', 'Th.3', 'Th.4', 'Th.5', 'Th.6', 'Th.7', 'Th.8', 'Th.9', 'Th.10', 'Th.11', 'Th.12'];

    // Attempt real aggregation
    const monthlyAgg = new Array(12).fill(0);
    filteredContracts.forEach(c => {
      if (!c.signedDate) return;
      const date = new Date(c.signedDate);
      // Only count if it matches year (already filtered by filteredContracts though)
      const month = date.getMonth(); // 0-11
      const val = activeMetric === 'signing' ? c.value :
        activeMetric === 'revenue' ? c.actualRevenue :
          activeMetric === 'adminProfit' ? ((c.value || 0) - (c.estimatedCost || 0)) :
            (c.value || 0);
      monthlyAgg[month] += (val || 0);
    });

    // If no data (e.g. no dates), fallback to sine wave for demo
    const hasData = monthlyAgg.some(v => v > 0);

    return months.map((m, idx) => {
      let currentVal = 0;
      if (hasData) {
        currentVal = monthlyAgg[idx];
      } else {
        // Fallback demo
        const factor = 1 + Math.sin(idx) * 0.2;
        const baseValue = (stats.actual[activeMetric] || 0) / 12;
        currentVal = baseValue * factor;
      }

      return {
        name: m,
        current: currentVal,
        lastYear: currentVal * 0.85 // Mock previous year
      };
    });
  }, [stats.actual, activeMetric, filteredContracts]);

  const distributionData = useMemo(() => {
    if (!selectedUnit || selectedUnit.id === 'all') {
      return allUnits.filter(u => u.id !== 'all').map(u => ({
        name: u.name,
        value: allContracts.filter(c => c.unitId === u.id && (yearFilter === 'All' || c.signedDate?.startsWith(yearFilter))).reduce((acc, curr) => acc + (curr[activeMetric === 'signing' ? 'value' : 'actualRevenue'] || 0), 0)
      }));
    } else {
      return unitSales.map(s => ({
        name: s.name,
        value: filteredContracts.filter(c => c.salespersonId === s.id).reduce((acc, curr) => acc + (curr[activeMetric === 'signing' ? 'value' : 'actualRevenue'] || 0), 0)
      }));
    }
  }, [selectedUnit, activeMetric, filteredContracts, unitSales, allUnits, allContracts, yearFilter]);

  const formatCurrency = (val: number) => {
    if (val >= 1e9) return `${(val / 1e9).toFixed(2)}B`;
    if (val >= 1e6) return `${(val / 1e6).toFixed(0)}M`;
    return val.toString();
  };

  const getYoY = (metric: keyof KPIPlan) => {
    const curr = stats.actual[metric];
    // Simple mock logic for YoY: if filter is current year, use lastYearActual from Unit. Else random.
    const prev = selectedUnit?.lastYearActual?.[metric] || (curr * 0.9);
    const growth = prev !== 0 ? ((curr - prev) / prev) * 100 : 100;
    return { value: growth.toFixed(1), isUp: growth >= 0 };
  };

  const performanceTableData = useMemo(() => {
    if (!selectedUnit || selectedUnit.id === 'all') {
      return allUnits.filter(u => u.id !== 'all').map(unit => {
        const unitContracts = allContracts.filter(c => c.unitId === unit.id && (yearFilter === 'All' || c.signedDate?.startsWith(yearFilter)));
        const actual = unitContracts.reduce((acc, curr) => acc + ((curr.value || 0) - (curr.estimatedCost || 0)), 0);
        const target = unit.target?.adminProfit;
        return {
          id: unit.id,
          name: unit.name,
          subText: unit.type === 'Branch' ? 'Chi nhánh' : 'Trung tâm',
          target,
          actual,
          progress: Math.min(100, (actual / (target || 1)) * 100)
        };
      });
    } else {
      return unitSales.map(sale => {
        const saleContracts = filteredContracts.filter(c => c.salespersonId === sale.id);
        const actual = saleContracts.reduce((acc, curr) => acc + ((curr.value || 0) - (curr.estimatedCost || 0)), 0);
        const target = sale.target?.adminProfit;
        return {
          id: sale.id,
          name: sale.name,
          subText: `ID: ${sale.employeeCode || sale.id.substring(0, 4)}`,
          target,
          actual,
          progress: Math.min(100, (actual / (target || 1)) * 100)
        };
      });
    }
  }, [selectedUnit, filteredContracts, unitSales, allUnits, allContracts, yearFilter]);

  // Safe Unit for Display
  const safeUnit = allUnits.find(u => u.id === selectedUnit.id) || selectedUnit;

  if (loadingConfig) {
    return (
      <div className="flex flex-col items-center justify-center h-96 gap-4">
        <Loader2 className="animate-spin text-indigo-600" size={48} />
        <div className="text-center">
          <h3 className="text-xl font-black text-slate-800 dark:text-slate-200">Đang tổng hợp dữ liệu...</h3>
          <p className="text-slate-500">Hệ thống đang tính toán các chỉ số KPI theo thời gian thực.</p>
        </div>
      </div>
    );
  }

  // Safety check for selectedUnit
  if (!selectedUnit) {
    return (
      <div className="flex flex-col items-center justify-center h-96 gap-4">
        <Loader2 className="animate-spin text-indigo-600" size={48} />
        <div className="text-center">
          <h3 className="text-xl font-black text-slate-800 dark:text-slate-200">Đang tải cấu hình đơn vị...</h3>
        </div>
      </div>
    );
  }

  // Define metric tabs
  const metricTabs = [
    { id: 'signing', label: 'Ký kết' },
    { id: 'revenue', label: 'Doanh thu' },
    { id: 'adminProfit', label: 'LNG QT' },
    { id: 'revProfit', label: 'LNG ĐT' },
    { id: 'cash', label: 'Dòng tiền' }
  ];

  return (
    <div className="space-y-8 animate-in slide-in-from-bottom-4 duration-500 pb-12">
      {/* NEW HEADER DESIGN */}
      <div className="flex flex-col xl:flex-row xl:items-center justify-between gap-6">
        <div className="space-y-4">
          <h1 className="text-3xl font-black text-slate-900 dark:text-slate-100 tracking-tight flex items-center gap-3">
            Tổng quan Quản trị
          </h1>

          <div className="flex flex-wrap items-center gap-3">
            {/* Unit Filter Button */}
            <div className="relative z-20">
              <button
                onClick={() => setShowUnitSelector(!showUnitSelector)}
                className="flex items-center gap-2.5 px-5 py-2.5 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl shadow-sm hover:border-indigo-300 dark:hover:border-indigo-700 transition-all group"
              >
                <Building2 size={18} className="text-slate-400 group-hover:text-indigo-500 transition-colors" />
                <span className="text-sm font-bold text-slate-700 dark:text-slate-200 min-w-[100px] text-left truncate max-w-[200px]">
                  {safeUnit.name}
                </span>
                <ChevronDown size={16} className={`text-slate-400 transition-transform duration-300 ${showUnitSelector ? 'rotate-180' : ''}`} />
              </button>

              {showUnitSelector && (
                <>
                  <div className="fixed inset-0 z-10" onClick={() => setShowUnitSelector(false)} />
                  <div className="absolute top-full left-0 mt-2 w-72 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl shadow-xl z-20 py-2 animate-in fade-in zoom-in-95 duration-200 overflow-hidden">
                    <div className="max-h-[320px] overflow-y-auto">
                      {[{ id: 'all', name: 'Toàn công ty', type: 'Company' } as Unit, ...allUnits.filter(u => u.name !== 'Toàn công ty')].map((u) => (
                        <button
                          key={u.id}
                          onClick={() => {
                            onSelectUnit(u);
                            setShowUnitSelector(false);
                          }}
                          className={`w-full text-left px-4 py-3 text-sm font-bold hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors flex items-center gap-3 ${u.id === safeUnit.id ? 'bg-indigo-50 dark:bg-indigo-900/20 text-indigo-600 dark:text-indigo-400' : 'text-slate-600 dark:text-slate-400'}`}
                        >
                          <div className={`w-2 h-2 rounded-full shrink-0 ${u.id === 'all' ? 'bg-indigo-500' : u.type === 'Center' ? 'bg-emerald-400' : 'bg-amber-400'}`}></div>
                          <span className="truncate">{u.name}</span>
                          {u.id === safeUnit.id && <CheckCircle2 size={16} className="ml-auto text-indigo-600" />}
                        </button>
                      ))}
                    </div>
                  </div>
                </>
              )}
            </div>

            {/* Year Filter Button */}
            <div className="relative z-10">
              <div className="flex items-center gap-2.5 px-5 py-2.5 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl shadow-sm hover:border-indigo-300 dark:hover:border-indigo-700 transition-all group cursor-pointer relative">
                <Calendar size={18} className="text-slate-400 group-hover:text-indigo-500 transition-colors" />
                <span className="text-sm font-bold text-slate-700 dark:text-slate-200">
                  {yearFilter === 'All' ? 'Tất cả năm' : `Năm ${yearFilter}`}
                </span>
                <ChevronDown size={16} className="text-slate-400" />

                <select
                  value={yearFilter}
                  onChange={(e) => setYearFilter(e.target.value)}
                  className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                >
                  <option value="All">Tất cả năm</option>
                  {availableYears.map(y => (
                    <option key={y} value={y}>Năm {y}</option>
                  ))}
                </select>
              </div>
            </div>
          </div>
        </div>

        {/* Metric Tabs */}
        <div className="flex bg-white dark:bg-slate-900 p-1.5 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm overflow-x-auto no-scrollbar">
          {metricTabs.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveMetric(tab.id as keyof KPIPlan)}
              className={`px-5 py-2.5 rounded-xl text-xs font-black uppercase tracking-wider transition-all whitespace-nowrap ${activeMetric === tab.id
                ? 'bg-indigo-600 text-white shadow-md shadow-indigo-200 dark:shadow-none'
                : 'text-slate-500 hover:text-slate-900 dark:hover:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800'
                }`}
            >
              {tab.label}
            </button>
          ))}
        </div>
      </div>

      {/* AI INSIGHTS BAR */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {isLoadingAI ? (
          [1, 2, 3].map(i => (
            <div key={i} className="h-28 bg-white dark:bg-slate-900 rounded-[28px] animate-pulse border border-slate-100 dark:border-slate-800 shadow-sm"></div>
          ))
        ) : (
          aiInsights.map((insight, idx) => (
            <div key={idx} className={`p-6 rounded-[28px] border-2 shadow-sm transition-all hover:shadow-md hover:-translate-y-1 flex items-start gap-4 ${insight.type === 'warning' ? 'bg-white dark:bg-slate-900 border-rose-100 dark:border-rose-900/30' :
              insight.type === 'success' ? 'bg-white dark:bg-slate-900 border-emerald-100 dark:border-emerald-900/30' :
                'bg-white dark:bg-slate-900 border-indigo-100 dark:border-indigo-900/30'
              }`}>
              <div className={`p-3 rounded-2xl shrink-0 ${insight.type === 'warning' ? 'bg-rose-100 text-rose-600 dark:bg-rose-900/40 dark:text-rose-400' :
                insight.type === 'success' ? 'bg-emerald-100 text-emerald-600 dark:bg-emerald-900/40 dark:text-emerald-400' :
                  'bg-indigo-100 text-indigo-600 dark:bg-indigo-900/40 dark:text-indigo-400'
                }`}>
                {insight.type === 'warning' ? <AlertCircle size={24} /> : insight.type === 'success' ? <ShieldCheck size={24} /> : <Zap size={24} />}
              </div>
              <div>
                <div className="flex items-center gap-2 mb-1.5">
                  <p className="text-[10px] font-black uppercase tracking-widest text-slate-400">AI Insight</p>
                  {idx === 0 && <span className="px-1.5 py-0.5 rounded bg-indigo-100 text-indigo-600 text-[9px] font-bold">Mới nhất</span>}
                </div>
                <h4 className="text-sm font-black text-slate-900 dark:text-slate-100 mb-1.5">{insight.title}</h4>
                <p className="text-xs text-slate-500 dark:text-slate-400 font-medium leading-relaxed">{insight.content}</p>
              </div>
            </div>
          ))
        )}
      </div>

      {/* Main KPI Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-5 gap-6">
        <KPIItem title="Ký kết (Signing)" metric="signing" stats={stats.actual} target={safeUnit?.target || { signing: 0 }} yoy={getYoY('signing')} color="indigo" icon={<FileText size={20} />} />
        <KPIItem title="Doanh thu (Revenue)" metric="revenue" stats={stats.actual} target={safeUnit?.target || { revenue: 0 }} yoy={getYoY('revenue')} color="emerald" icon={<CreditCard size={20} />} />
        <KPIItem title="LNG Quản trị" metric="adminProfit" stats={stats.actual} target={safeUnit?.target || { adminProfit: 0 }} yoy={getYoY('adminProfit')} color="purple" icon={<TrendingUp size={20} />} />
        <KPIItem title="LNG theo DT" metric="revProfit" stats={stats.actual} target={safeUnit?.target || { revProfit: 0 }} yoy={getYoY('revProfit')} color="amber" icon={<Target size={20} />} />
        <KPIItem title="Dòng tiền ròng (Net CF)" metric="netCashflow" stats={stats.actual} target={{ netCashflow: 0 }} yoy={{ value: '0', isUp: true }} color="cyan" icon={<Wallet size={20} />} />
      </div>

      {/* Status Highlights */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-6">
        <StatusCard label="Đang thực hiện" count={stats.statusCounts.active} icon={<Clock size={24} className="text-indigo-600" />} color="indigo" />
        <StatusCard label="Chờ phê duyệt" count={stats.statusCounts.pending} icon={<ClipboardList size={24} className="text-amber-600" />} color="amber" />
        <StatusCard label="Đã hoàn thành" count={stats.statusCounts.completed} icon={<CheckCircle2 size={24} className="text-emerald-600" />} color="emerald" />
        <StatusCard label="Hợp đồng quá hạn" count={stats.statusCounts.expired} icon={<AlertCircle size={24} className="text-rose-600" />} color="rose" />
      </div>

      {/* Charts Section */}
      <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
        <div className="xl:col-span-2 bg-white dark:bg-slate-900 p-8 rounded-[40px] border border-slate-200 dark:border-slate-800 shadow-sm">
          <div className="flex justify-between items-center mb-10">
            <div>
              <h3 className="text-xl font-black text-slate-900 dark:text-slate-100 uppercase tracking-tight mb-2">Biến động theo tháng</h3>
              <p className="text-sm font-medium text-slate-500">So sánh dữ liệu {activeMetric === 'signing' ? 'Ký kết' : activeMetric === 'revenue' ? 'Doanh thu' : 'Lợi nhuận'} giữa các năm</p>
            </div>
            <div className="flex gap-6 text-xs font-bold uppercase text-slate-400">
              <div className="flex items-center gap-2"><div className="w-3 h-3 bg-indigo-600 rounded-full shadow-lg shadow-indigo-200"></div> {yearFilter === 'All' ? new Date().getFullYear() : yearFilter}</div>
              <div className="flex items-center gap-2"><div className="w-3 h-3 bg-slate-200 dark:bg-slate-700 rounded-full"></div> Năm trước</div>
            </div>
          </div>
          <div className="h-[350px]">
            <ResponsiveContainer width="100%" height="100%">
              <ComposedChart data={monthlyData} barGap={0}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fill: '#64748b', fontSize: 11, fontWeight: 700 }} dy={10} />
                <YAxis hide />
                <Tooltip
                  cursor={{ fill: '#f8fafc' }}
                  contentStyle={{ borderRadius: '20px', border: 'none', boxShadow: '0 20px 25px -5px rgb(0 0 0 / 0.1)', background: 'rgba(30, 41, 59, 0.95)', color: '#fff', padding: '12px 20px' }}
                  itemStyle={{ fontSize: '13px', fontWeight: 600, padding: '4px 0' }}
                />
                <Bar dataKey="lastYear" fill="#e2e8f0" radius={[6, 6, 0, 0]} barSize={32} className="dark:fill-slate-800" />
                <Bar dataKey="current" fill="#4f46e5" radius={[6, 6, 0, 0]} barSize={32} />
                <Line type="monotone" dataKey="current" stroke="#818cf8" strokeWidth={4} dot={{ r: 4, strokeWidth: 2, fill: '#fff' }} activeDot={{ r: 6, strokeWidth: 0 }} />
              </ComposedChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="bg-white dark:bg-slate-900 p-8 rounded-[40px] border border-slate-200 dark:border-slate-800 shadow-sm flex flex-col">
          <h3 className="text-xl font-black text-slate-900 dark:text-slate-100 uppercase tracking-tight mb-2">
            Phân bổ {safeUnit?.id === 'all' ? 'theo Đơn vị' : 'theo Sales'}
          </h3>
          <p className="text-sm font-medium text-slate-500 mb-8">Tỷ trọng đóng góp vào tổng số</p>

          <div className="flex-1 relative min-h-[250px]">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={distributionData}
                  cx="50%"
                  cy="50%"
                  innerRadius={70}
                  outerRadius={90}
                  paddingAngle={4}
                  dataKey="value"
                  cornerRadius={6}
                >
                  {distributionData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} strokeWidth={0} />
                  ))}
                </Pie>
                <Tooltip
                  contentStyle={{ borderRadius: '16px', border: 'none', boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)', background: '#fff', color: '#1e293b' }}
                  itemStyle={{ fontSize: '12px', fontWeight: 700 }}
                />
              </PieChart>
            </ResponsiveContainer>
            <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
              <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Tổng số</p>
              <p className="text-2xl font-black text-slate-900 dark:text-slate-100 mt-1">{formatCurrency(stats.actual[activeMetric])}</p>
            </div>
          </div>
          <div className="mt-8 space-y-3">
            {distributionData.slice(0, 4).map((d, i) => (
              <div key={i} className="flex items-center justify-between group cursor-default">
                <div className="flex items-center gap-3">
                  <div className="w-3 h-3 rounded-md transition-transform group-hover:scale-125" style={{ backgroundColor: COLORS[i % COLORS.length] }}></div>
                  <span className="text-sm font-bold text-slate-600 dark:text-slate-300 truncate max-w-[140px]">{d.name}</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-xs font-bold text-slate-400">{((d.value / (stats.actual[activeMetric] || 1)) * 100).toFixed(1)}%</span>
                  <div className="w-16 h-1.5 bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden">
                    <div className="h-full rounded-full" style={{ width: `${Math.min(100, (d.value / (Math.max(...distributionData.map(x => x.value)) || 1)) * 100)}%`, backgroundColor: COLORS[i % COLORS.length] }}></div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Performance Table */}
      <div className="bg-white dark:bg-slate-900 p-8 md:p-10 rounded-[48px] border border-slate-200 dark:border-slate-800 shadow-sm">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 mb-10">
          <div>
            <h3 className="text-xl font-black text-slate-900 dark:text-slate-100 flex items-center gap-3 mb-2">
              {safeUnit?.id === 'all' ? <Building2 className="text-indigo-600" size={24} /> : <Users className="text-indigo-600" size={24} />}
              {safeUnit?.id === 'all' ? 'Hiệu suất thực hiện Đơn vị' : 'Hiệu suất nhân sự kinh doanh'}
            </h3>
            <p className="text-sm font-medium text-slate-500">Bảng xếp hạng hiệu quả hoạt động dựa trên LNG Quản trị</p>
          </div>
          <div className="flex items-center gap-2 px-5 py-2.5 bg-indigo-50 dark:bg-indigo-900/20 rounded-2xl border border-indigo-100 dark:border-indigo-900/30">
            <Sparkles size={16} className="text-indigo-600 animate-pulse" />
            <span className="text-xs font-black text-indigo-700 dark:text-indigo-400 uppercase tracking-widest">Live Updates</span>
          </div>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-left border-separate border-spacing-y-3">
            <thead>
              <tr className="text-[11px] uppercase tracking-wider text-slate-400 font-black">
                <th className="pb-2">{safeUnit?.id === 'all' ? 'Đơn vị' : 'Nhân sự'}</th>
                <th className="pb-2 text-right">Mục tiêu</th>
                <th className="pb-2 text-right">Thực tế</th>
                <th className="pb-2 text-center w-64">Tiến độ hoàn thành</th>
              </tr>
            </thead>
            <tbody>
              {performanceTableData.map((row) => (
                <tr key={row.id} className="group hover:bg-slate-50 dark:hover:bg-slate-800/40 transition-colors">
                  <td className="py-4 pl-4 rounded-l-3xl bg-white dark:bg-slate-900 group-hover:bg-slate-50 dark:group-hover:bg-slate-800/40 border-y border-l border-transparent transition-colors">
                    <div className="flex items-center gap-4">
                      <div className={`w-12 h-12 rounded-2xl ${safeUnit?.id === 'all' ? 'bg-indigo-50 text-indigo-700' : 'bg-slate-100 text-slate-600'} flex items-center justify-center font-black text-lg shadow-sm group-hover:scale-105 transition-transform`}>
                        {row.name.substring(0, 1)}
                      </div>
                      <div>
                        <p className="text-base font-black text-slate-900 dark:text-slate-100">{row.name}</p>
                        <p className="text-xs font-bold text-slate-400">{row.subText}</p>
                      </div>
                    </div>
                  </td>
                  <td className="py-4 text-right bg-white dark:bg-slate-900 group-hover:bg-slate-50 dark:group-hover:bg-slate-800/40 border-y border-transparent transition-colors text-sm font-bold text-slate-500">{formatCurrency(row.target)}</td>
                  <td className="py-4 text-right bg-white dark:bg-slate-900 group-hover:bg-slate-50 dark:group-hover:bg-slate-800/40 border-y border-transparent transition-colors text-sm font-black text-slate-900 dark:text-slate-100">{formatCurrency(row.actual)}</td>
                  <td className="py-4 px-6 rounded-r-3xl bg-white dark:bg-slate-900 group-hover:bg-slate-50 dark:group-hover:bg-slate-800/40 border-y border-r border-transparent transition-colors">
                    <div className="flex items-center gap-4">
                      <div className="flex-1 h-3 bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden shadow-inner">
                        <div className={`h-full rounded-full transition-all duration-1000 ${row.progress >= 90 ? 'bg-emerald-500 shadow-[0_0_15px_rgba(16,185,129,0.4)]' : row.progress >= 70 ? 'bg-indigo-600' : 'bg-amber-500'}`} style={{ width: `${row.progress}%` }}></div>
                      </div>
                      <span className={`text-xs font-black w-10 text-right ${row.progress >= 100 ? 'text-emerald-600' : 'text-slate-700'}`}>{row.progress.toFixed(0)}%</span>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* AI Chat Widget */}
      <ChatWidget contextData={{
        stats: stats,
        selectedUnit: selectedUnit?.name || 'All',
        year: yearFilter,
        insights: aiInsights,
        topContracts: filteredContracts.slice(0, 10).map(c => ({
          name: c.id,
          customer: c.partyA,
          value: c.value,
          status: c.status
        }))
      }} />
    </div>
  );
};

const KPIItem = ({ title, metric, stats, target, yoy, color, icon }: any) => {
  const actual = stats[metric];
  const plan = target[metric];
  const progress = Math.min(100, (actual / (plan || 1)) * 100);

  const colors: any = {
    indigo: 'text-indigo-600 bg-indigo-50 dark:bg-indigo-900/20 border-indigo-100 dark:border-indigo-900/30',
    emerald: 'text-emerald-600 bg-emerald-50 dark:bg-emerald-900/20 border-emerald-100 dark:border-emerald-900/30',
    purple: 'text-purple-600 bg-purple-50 dark:bg-purple-900/20 border-purple-100 dark:border-purple-900/30',
    amber: 'text-amber-600 bg-amber-50 dark:bg-amber-900/20 border-amber-100 dark:border-amber-900/30',
    cyan: 'text-cyan-600 bg-cyan-50 dark:bg-cyan-900/20 border-cyan-100 dark:border-cyan-900/30',
  };

  const formatValue = (val: number) => {
    if (val >= 1e9) return `${(val / 1e9).toFixed(1)}B`;
    return `${(val / 1e6).toFixed(0)}M`;
  };

  return (
    <div className="bg-white dark:bg-slate-900 p-6 rounded-[32px] border border-slate-200 dark:border-slate-800 shadow-sm transition-all hover:shadow-2xl group relative overflow-hidden">
      <div className="flex justify-between items-start mb-6">
        <div className={`p-3 rounded-2xl ${colors[color]} transition-transform group-hover:rotate-6`}>
          {icon}
        </div>
        <div className={`flex items-center gap-1 text-[11px] font-black ${yoy.isUp ? 'text-emerald-500' : 'text-rose-500'}`}>
          {yoy.isUp ? <ArrowUpRight size={14} /> : <ArrowDownRight size={14} />}
          {yoy.value}% <span className="text-[8px] text-slate-400 font-bold">YoY</span>
        </div>
      </div>
      <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1.5">{title}</p>
      <div className="flex items-baseline gap-2 mb-4">
        <h4 className="text-xl font-black text-slate-900 dark:text-slate-100 tracking-tight">{formatValue(actual)}</h4>
        <span className="text-[10px] font-bold text-slate-400">/ {formatValue(plan)}</span>
      </div>
      <div className="space-y-2">
        <div className="flex justify-between text-[10px] font-black uppercase tracking-tighter">
          <span className="text-slate-400">Hoàn thành kế hoạch</span>
          <span className={yoy.isUp ? 'text-indigo-600' : 'text-amber-600'}>{progress.toFixed(1)}%</span>
        </div>
        <div className="w-full h-2 bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden">
          <div className={`h-full rounded-full transition-all duration-1000 ${color === 'emerald' ? 'bg-emerald-500' : color === 'amber' ? 'bg-amber-500' : 'bg-indigo-600'}`} style={{ width: `${progress}%` }}></div>
        </div>
      </div>
    </div>
  );
};

const StatusCard = ({ label, count, icon, color }: any) => {
  const bgColors: any = {
    indigo: 'bg-indigo-50 dark:bg-indigo-900/20',
    amber: 'bg-amber-50 dark:bg-amber-900/20',
    emerald: 'bg-emerald-50 dark:bg-emerald-900/10',
    rose: 'bg-rose-50 dark:bg-rose-900/10',
  };

  return (
    <div className={`p-5 rounded-[24px] ${bgColors[color]} border border-white/50 dark:border-slate-800 flex items-center justify-between shadow-sm hover:shadow-md transition-all`}>
      <div className="flex items-center gap-4">
        <div className="p-3 bg-white dark:bg-slate-900 rounded-2xl shadow-sm">
          {icon}
        </div>
        <div>
          <p className="text-[10px] font-black text-slate-500 dark:text-slate-400 uppercase leading-none mb-1.5">{label}</p>
          <p className="text-2xl font-black text-slate-900 dark:text-slate-100 leading-none">{count}</p>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
