import React, { useMemo, useState, useEffect } from 'react';
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
  Info,
  Loader2
} from 'lucide-react';
import { ContractsAPI, UnitsAPI, PersonnelAPI } from '../services/api';
import { Unit, KPIPlan, Contract, SalesPerson } from '../types';
import { getSmartInsights } from '../services/geminiService';

interface DashboardProps {
  selectedUnit: Unit;
  onSelectContract: (id: string) => void;
}

const COLORS = ['#4f46e5', '#10b981', '#f59e0b', '#8b5cf6', '#06b6d4', '#ec4899'];

const Dashboard: React.FC<DashboardProps> = ({ selectedUnit }) => {
  const [activeMetric, setActiveMetric] = useState<keyof KPIPlan>('signing');
  const [aiInsights, setAiInsights] = useState<any[]>([]);
  const [isLoadingAI, setIsLoadingAI] = useState(false);

  // Data State
  const [loadingConfig, setLoadingConfig] = useState(true);
  const [allContracts, setAllContracts] = useState<Contract[]>([]);
  const [allUnits, setAllUnits] = useState<Unit[]>([]);
  const [allSalespeople, setAllSalespeople] = useState<SalesPerson[]>([]);

  useEffect(() => {
    const fetchDashboardData = async () => {
      setLoadingConfig(true);
      try {
        const [contracts, units, people] = await Promise.all([
          ContractsAPI.getAll(),
          UnitsAPI.getAll(),
          PersonnelAPI.getAll()
        ]);
        setAllContracts(contracts);
        setAllUnits(units);
        setAllSalespeople(people);

        // Only fetch AI after data is ready
        fetchAI(contracts);
      } catch (error) {
        console.error("Dashboard Fetch Error", error);
      } finally {
        setLoadingConfig(false);
      }
    };
    fetchDashboardData();
  }, []);

  const fetchAI = async (contracts: Contract[]) => {
    setIsLoadingAI(true);
    try {
      const res = await getSmartInsights(contracts);
      setAiInsights(res);
    } catch (e) { console.error(e) }
    setIsLoadingAI(false);
  };

  const filteredContracts = useMemo(() => {
    if (!selectedUnit || selectedUnit.id === 'all') return allContracts;
    return allContracts.filter(c => c.unitId === selectedUnit.id);
  }, [selectedUnit, allContracts]);

  const unitSales = useMemo(() => {
    if (!selectedUnit || selectedUnit.id === 'all') return allSalespeople;
    return allSalespeople.filter(s => s.unitId === selectedUnit.id);
  }, [selectedUnit, allSalespeople]);

  const stats = useMemo(() => {
    const actual: KPIPlan = {
      signing: filteredContracts.reduce((acc, curr) => acc + (curr.value || 0), 0),
      revenue: filteredContracts.reduce((acc, curr) => acc + (curr.actualRevenue || 0), 0),
      adminProfit: filteredContracts.reduce((acc, curr) => acc + ((curr.value || 0) - (curr.estimatedCost || 0)), 0),
      revProfit: filteredContracts.reduce((acc, curr) => acc + ((curr.actualRevenue || 0) - (curr.actualCost || 0)), 0),
      cash: filteredContracts.reduce((acc, curr) => acc + (curr.actualRevenue || 0), 0),
    };

    const statusCounts = {
      active: filteredContracts.filter(c => c.status === 'Active').length,
      pending: filteredContracts.filter(c => c.status === 'Pending' || c.status === 'Reviewing').length,
      expired: filteredContracts.filter(c => c.status === 'Expired').length,
      completed: filteredContracts.filter(c => c.status === 'Completed').length,
    };

    return { actual, statusCounts };
  }, [filteredContracts]);

  const monthlyData = useMemo(() => {
    const months = ['Th.1', 'Th.2', 'Th.3', 'Th.4', 'Th.5', 'Th.6', 'Th.7', 'Th.8', 'Th.9', 'Th.10', 'Th.11', 'Th.12'];
    return months.map((m, idx) => {
      const factor = 1 + Math.sin(idx) * 0.2;
      const baseValue = (stats.actual[activeMetric] || 0) / 12;
      return {
        name: m,
        current: baseValue * factor,
        lastYear: baseValue * factor * 0.85
      };
    });
  }, [stats.actual, activeMetric]);

  const distributionData = useMemo(() => {
    if (!selectedUnit || selectedUnit.id === 'all') {
      return allUnits.filter(u => u.id !== 'all').map(u => ({
        name: u.name,
        value: allContracts.filter(c => c.unitId === u.id).reduce((acc, curr) => acc + (curr[activeMetric === 'signing' ? 'value' : 'actualRevenue'] || 0), 0)
      }));
    } else {
      return unitSales.map(s => ({
        name: s.name,
        value: filteredContracts.filter(c => c.salespersonId === s.id).reduce((acc, curr) => acc + (curr[activeMetric === 'signing' ? 'value' : 'actualRevenue'] || 0), 0)
      }));
    }
  }, [selectedUnit, activeMetric, filteredContracts, unitSales, allUnits, allContracts]);

  const formatCurrency = (val: number) => {
    if (val >= 1e9) return `${(val / 1e9).toFixed(2)}B`;
    if (val >= 1e6) return `${(val / 1e6).toFixed(0)}M`;
    return val.toString();
  };

  const getYoY = (metric: keyof KPIPlan) => {
    const curr = stats.actual[metric];
    const prev = selectedUnit?.lastYearActual?.[metric] || (curr * 0.9);
    const growth = prev !== 0 ? ((curr - prev) / prev) * 100 : 100;
    return { value: growth.toFixed(1), isUp: growth >= 0 };
  };

  const performanceTableData = useMemo(() => {
    if (!selectedUnit || selectedUnit.id === 'all') {
      return allUnits.filter(u => u.id !== 'all').map(unit => {
        const unitContracts = allContracts.filter(c => c.unitId === unit.id);
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
  }, [selectedUnit, filteredContracts, unitSales, allUnits, allContracts]);

  if (loadingConfig) {
    return (
      <div className="flex flex-col items-center justify-center h-96 gap-4">
        <Loader2 className="animate-spin text-indigo-600" size={48} />
        <div className="text-center">
          <h3 className="text-xl font-black text-slate-800 dark:text-slate-200">Đang tổng hợp dữ liệu...</h3>
          <p className="text-slate-500">Hệ thống đang tính toán các chỉ số KPI theo thời gian thực.</p>
        </div>
      </div>
    )
  }
  return (
    <div className="space-y-8 animate-in fade-in duration-500 pb-16">
      {/* Header Section */}
      <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4">
        <div>
          <h1 className="text-3xl font-black text-slate-900 dark:text-slate-100 tracking-tight">Tổng quan Quản trị</h1>
          <p className="text-slate-500 dark:text-slate-400 text-sm font-bold mt-1">
            Đơn vị: <span className="text-indigo-600 dark:text-indigo-400 uppercase font-black">{selectedUnit.name}</span>
          </p>
        </div>
        <div className="bg-white dark:bg-slate-900 p-1.5 rounded-2xl border border-slate-200 dark:border-slate-800 flex shadow-sm overflow-x-auto no-scrollbar">
          {['signing', 'revenue', 'adminProfit', 'revProfit', 'cash'].map((m) => (
            <button
              key={m}
              onClick={() => setActiveMetric(m as any)}
              className={`px-4 py-2 rounded-xl text-[10px] font-black uppercase transition-all whitespace-nowrap ${activeMetric === m ? 'bg-indigo-600 text-white shadow-lg' : 'text-slate-500 hover:bg-slate-50 dark:hover:bg-slate-800'}`}
            >
              {m === 'signing' ? 'Ký kết' : m === 'revenue' ? 'Doanh thu' : m === 'adminProfit' ? 'LNG QT' : m === 'revProfit' ? 'LNG DT' : 'Tiền về'}
            </button>
          ))}
        </div>
      </div>

      {/* AI INSIGHTS BAR */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {isLoadingAI ? (
          [1, 2, 3].map(i => (
            <div key={i} className="h-24 bg-white dark:bg-slate-900 rounded-[28px] animate-pulse border border-slate-100 dark:border-slate-800"></div>
          ))
        ) : (
          aiInsights.map((insight, idx) => (
            <div key={idx} className={`p-6 rounded-[28px] border-2 shadow-sm transition-all hover:scale-[1.02] flex items-start gap-4 ${insight.type === 'warning' ? 'bg-rose-50/50 dark:bg-rose-900/10 border-rose-100 dark:border-rose-900/20' :
                insight.type === 'success' ? 'bg-emerald-50/50 dark:bg-emerald-900/10 border-emerald-100 dark:border-emerald-900/20' :
                  'bg-indigo-50/50 dark:bg-indigo-900/10 border-indigo-100 dark:border-indigo-900/20'
              }`}>
              <div className={`p-2.5 rounded-2xl ${insight.type === 'warning' ? 'bg-rose-500 text-white' :
                  insight.type === 'success' ? 'bg-emerald-500 text-white' :
                    'bg-indigo-600 text-white'
                }`}>
                {insight.type === 'warning' ? <AlertCircle size={20} /> : insight.type === 'success' ? <ShieldCheck size={20} /> : <Zap size={20} />}
              </div>
              <div>
                <p className="text-[10px] font-black uppercase tracking-widest opacity-60 mb-1">AI Smart Insight</p>
                <h4 className="text-sm font-black text-slate-900 dark:text-slate-100 mb-1">{insight.title}</h4>
                <p className="text-xs text-slate-500 dark:text-slate-400 font-medium line-clamp-2">{insight.content}</p>
              </div>
            </div>
          ))
        )}
      </div>

      {/* Main KPI Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-5 gap-4">
        <KPIItem title="Ký kết (Signing)" metric="signing" stats={stats.actual} target={selectedUnit.target} yoy={getYoY('signing')} color="indigo" icon={<FileText size={18} />} />
        <KPIItem title="Doanh thu (Revenue)" metric="revenue" stats={stats.actual} target={selectedUnit.target} yoy={getYoY('revenue')} color="emerald" icon={<CreditCard size={18} />} />
        <KPIItem title="LNG Quản trị" metric="adminProfit" stats={stats.actual} target={selectedUnit.target} yoy={getYoY('adminProfit')} color="purple" icon={<TrendingUp size={18} />} />
        <KPIItem title="LNG theo DT" metric="revProfit" stats={stats.actual} target={selectedUnit.target} yoy={getYoY('revProfit')} color="amber" icon={<Target size={18} />} />
        <KPIItem title="Tiền về (Cash)" metric="cash" stats={stats.actual} target={selectedUnit.target} yoy={getYoY('cash')} color="cyan" icon={<Wallet size={18} />} />
      </div>

      {/* Status Highlights */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <StatusCard label="Đang thực hiện" count={stats.statusCounts.active} icon={<Clock className="text-indigo-500" />} color="indigo" />
        <StatusCard label="Chờ phê duyệt" count={stats.statusCounts.pending} icon={<ClipboardList className="text-amber-500" />} color="amber" />
        <StatusCard label="Đã hoàn thành" count={stats.statusCounts.completed} icon={<CheckCircle2 className="text-emerald-500" />} color="emerald" />
        <StatusCard label="Hợp đồng quá hạn" count={stats.statusCounts.expired} icon={<AlertCircle className="text-rose-500" />} color="rose" />
      </div>

      {/* Charts Section */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 bg-white dark:bg-slate-900 p-8 rounded-[40px] border border-slate-200 dark:border-slate-800 shadow-sm transition-all hover:shadow-xl">
          <div className="flex justify-between items-center mb-8">
            <h3 className="text-lg font-black text-slate-900 dark:text-slate-100 uppercase tracking-tight">So sánh cùng kỳ theo tháng</h3>
            <div className="flex gap-4 text-[10px] font-bold uppercase text-slate-400">
              <div className="flex items-center gap-2"><div className="w-3 h-3 bg-indigo-600 rounded-sm"></div> Năm nay</div>
              <div className="flex items-center gap-2"><div className="w-3 h-3 bg-slate-200 dark:bg-slate-700 rounded-sm"></div> Năm trước</div>
            </div>
          </div>
          <div className="h-[320px]">
            <ResponsiveContainer width="100%" height="100%">
              <ComposedChart data={monthlyData}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" />
                <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fill: '#94a3b8', fontSize: 10, fontWeight: 700 }} dy={10} />
                <YAxis hide />
                <Tooltip
                  contentStyle={{ borderRadius: '16px', border: 'none', boxShadow: '0 20px 25px -5px rgb(0 0 0 / 0.1)', background: '#1e293b', color: '#fff' }}
                  itemStyle={{ fontSize: '12px', fontWeight: 700 }}
                />
                <Bar dataKey="lastYear" fill="#e2e8f0" radius={[4, 4, 0, 0]} barSize={20} className="dark:fill-slate-800" />
                <Bar dataKey="current" fill="#4f46e5" radius={[4, 4, 0, 0]} barSize={20} />
                <Line type="monotone" dataKey="current" stroke="#4f46e5" strokeWidth={3} dot={false} />
              </ComposedChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="bg-white dark:bg-slate-900 p-8 rounded-[40px] border border-slate-200 dark:border-slate-800 shadow-sm">
          <h3 className="text-lg font-black text-slate-900 dark:text-slate-100 uppercase tracking-tight mb-8">
            Tỷ trọng {selectedUnit.id === 'all' ? 'giữa các Đơn vị' : 'giữa các Sales'}
          </h3>
          <div className="h-[250px] relative">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={distributionData}
                  cx="50%"
                  cy="50%"
                  innerRadius={60}
                  outerRadius={80}
                  paddingAngle={5}
                  dataKey="value"
                >
                  {distributionData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
            <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
              <p className="text-[10px] font-black text-slate-400 uppercase">Tổng cộng</p>
              <p className="text-xl font-black text-slate-900 dark:text-slate-100">{formatCurrency(stats.actual[activeMetric])}</p>
            </div>
          </div>
          <div className="mt-6 space-y-2">
            {distributionData.slice(0, 4).map((d, i) => (
              <div key={i} className="flex items-center justify-between text-xs font-bold">
                <div className="flex items-center gap-2">
                  <div className="w-2 h-2 rounded-full" style={{ backgroundColor: COLORS[i % COLORS.length] }}></div>
                  <span className="text-slate-600 dark:text-slate-400 truncate max-w-[120px]">{d.name}</span>
                </div>
                <span className="text-slate-900 dark:text-slate-100">{((d.value / (stats.actual[activeMetric] || 1)) * 100).toFixed(1)}%</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Performance Table */}
      <div className="bg-white dark:bg-slate-900 p-10 rounded-[48px] border border-slate-200 dark:border-slate-800 shadow-md">
        <div className="flex items-center justify-between mb-8">
          <h3 className="text-xl font-black text-slate-900 dark:text-slate-100 flex items-center gap-3">
            {selectedUnit.id === 'all' ? <Building2 className="text-indigo-600" /> : <Users className="text-indigo-600" />}
            {selectedUnit.id === 'all' ? 'Hiệu suất thực hiện Đơn vị' : 'Hiệu suất nhân sự kinh doanh'}
          </h3>
          <div className="flex items-center gap-2 px-4 py-2 bg-indigo-50 dark:bg-indigo-900/30 rounded-full">
            <Sparkles size={14} className="text-indigo-600 animate-pulse" />
            <span className="text-[10px] font-black text-indigo-700 dark:text-indigo-400 uppercase tracking-widest">Dữ liệu thời gian thực</span>
          </div>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead>
              <tr className="border-b border-slate-100 dark:border-slate-800">
                <th className="pb-4 text-[10px] font-black text-slate-400 uppercase">{selectedUnit.id === 'all' ? 'Đơn vị thực hiện' : 'Nhân viên Sale'}</th>
                <th className="pb-4 text-[10px] font-black text-slate-400 uppercase text-right">Chỉ tiêu LNG được giao</th>
                <th className="pb-4 text-[10px] font-black text-slate-400 uppercase text-right">Thực tế hoàn thành</th>
                <th className="pb-4 text-[10px] font-black text-slate-400 uppercase text-center w-48">Tỷ lệ hoàn thành</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-50 dark:divide-slate-800">
              {performanceTableData.map((row) => (
                <tr key={row.id} className="group hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors">
                  <td className="py-5">
                    <div className="flex items-center gap-4">
                      <div className={`w-12 h-12 rounded-2xl ${selectedUnit.id === 'all' ? 'bg-indigo-100 dark:bg-indigo-900/40 text-indigo-700' : 'bg-slate-50 dark:bg-slate-900 text-indigo-600'} flex items-center justify-center font-black text-base shadow-sm group-hover:scale-110 transition-transform`}>
                        {row.name.split(' ').pop()?.[0]}
                      </div>
                      <div>
                        <p className="text-base font-black text-slate-900 dark:text-slate-100">{row.name}</p>
                        <p className="text-[11px] font-bold text-slate-400">{row.subText}</p>
                      </div>
                    </div>
                  </td>
                  <td className="py-5 text-right text-sm font-bold text-slate-500">{formatCurrency(row.target)}</td>
                  <td className="py-5 text-right text-sm font-black text-slate-900 dark:text-slate-100">{formatCurrency(row.actual)}</td>
                  <td className="py-5 px-6">
                    <div className="flex items-center gap-4">
                      <div className="flex-1 h-2.5 bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden">
                        <div className={`h-full rounded-full transition-all duration-1000 ${row.progress >= 90 ? 'bg-emerald-500 shadow-[0_0_10px_rgba(16,185,129,0.3)]' : row.progress >= 70 ? 'bg-indigo-600' : 'bg-amber-500'}`} style={{ width: `${row.progress}%` }}></div>
                      </div>
                      <span className="text-[11px] font-black text-slate-700 dark:text-slate-300 w-10 text-right">{row.progress.toFixed(0)}%</span>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
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
