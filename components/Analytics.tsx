import React, { useState, useEffect, useMemo, useRef } from 'react';
import {
    PieChart, Pie, Cell, Tooltip, ResponsiveContainer,
    BarChart, Bar, XAxis, YAxis, CartesianGrid, Legend,
    AreaChart, Area, ComposedChart, Line
} from 'recharts';
import {
    PieChartIcon, Calendar, Download, Building2, ChevronDown,
    TrendingUp, CreditCard, FileText, Target,
    ArrowUpRight, ArrowDownRight, BarChart3, Activity, Wallet,
    Inbox, Users, Package, X
} from 'lucide-react';
import { Link } from 'react-router-dom';
import {
    ContractService, UnitService, EmployeeService,
    PaymentService, HistoricalProductionService,
    CustomerService, BrandService, ProductService
} from '../services';
import {
    Unit, Contract, Employee, Payment, HistoricalProduction,
    Customer, Brand, Product
} from '../types';
import { toast } from 'sonner';
import { getChartColors, getAccentColor, getTooltipStyle, getGridStroke, getCursorFill, getMutedBarFill, isDarkTheme } from '../lib/themeColors';
import { useCurrentUserVisibleUnits } from '../hooks';
import { Skeleton } from './ui/Skeleton';
import { motion } from 'framer-motion';
import { useLayoutContext } from './layout/MainLayout';
import {
    AnalyticsSkeleton, EmptyState, KPICard, ChartCard,
    formatCurrencyGlobal, formatCurrency,
} from './analytics/analyticsHelpers';
import { useAnalyticsData } from './analytics/useAnalyticsData';

interface AnalyticsProps {
    selectedUnit: Unit;
    onSelectUnit: (unit: Unit) => void;
}


/* ═══════════════════════════════════════ MAIN COMPONENT ═══════════════════════════════════════ */

const Analytics: React.FC<AnalyticsProps> = ({ selectedUnit: propSelectedUnit, onSelectUnit: propOnSelectUnit }) => {
    const { yearFilter, periodFilter, setYearFilter, selectedUnit: ctxSelectedUnit, setSelectedUnit: ctxSetSelectedUnit } = useLayoutContext();
    const selectedUnit = propSelectedUnit || ctxSelectedUnit;
    const onSelectUnit = propOnSelectUnit || ctxSetSelectedUnit;

    const [showUnitSelector, setShowUnitSelector] = useState(false);

    const [drillDown, setDrillDown] = useState<{
        isOpen: boolean;
        title: string;
        contracts: Contract[];
    } | null>(null);

    const { visibleUnits } = useCurrentUserVisibleUnits();


    // ─── Data hook ─────────────────────────────────────────────
    const {
        isLoading,
        units,
        availableYears,
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
        renderHoverTable,
    } = useAnalyticsData({ selectedUnit, yearFilter: yearFilter || 'All', periodFilter, visibleUnits });

    const safeUnit = units.find(u => u.id === selectedUnit.id) || selectedUnit;


    const CustomTooltip = ({ active, payload, label }: any) => {
        if (active && payload && payload.length) {
            const data = payload[0].payload;
            return (
                <div
                    style={getTooltipStyle()}
                    className="rounded-xl shadow-xl p-5 border max-w-xl w-[500px] z-50 pointer-events-auto"
                >
                    <p className="text-sm font-bold text-slate-800 dark:text-slate-200 mb-2">{label || data.name}</p>
                    {payload.map((entry: any, index: number) => (
                        <p key={index} className="text-sm font-black flex justify-between gap-4" style={{ color: entry.color }}>
                            <span>{entry.name}:</span>
                            <span>{formatCurrency(entry.value)}</span>
                        </p>
                    ))}
                    {data.type && renderHoverTable(data)}
                </div>
            );
        }
        return null;
    };


    const pieTotal = useMemo(() => structureData.reduce((s, d) => s + d.value, 0), [structureData]);

    if (isLoading) return <AnalyticsSkeleton />;

    return (
        <div className="p-4 md:p-6 lg:p-8 max-w-7xl mx-auto space-y-6">
            {/* Header */}
            <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
                <div>
                    <h1 className="text-2xl font-black text-slate-800 dark:text-gray-100 flex items-center gap-2">
                        <Activity className="text-indigo-600 dark:text-indigo-400" />
                        Báo cáo Quản trị (BI)
                    </h1>
                    <p className="text-sm font-medium text-slate-500 dark:text-slate-400 mt-1">
                        Trung tâm theo dõi và phân tích hiệu quả kinh doanh
                    </p>
                </div>

                <div className="flex flex-wrap gap-3">
                    {/* Unit Selector */}
                    <div className="relative">
                        <button
                            onClick={() => setShowUnitSelector(!showUnitSelector)}
                            className="flex items-center gap-2 px-4 py-2.5 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl shadow-sm hover:border-orange-500 dark:hover:border-orange-500 transition-colors cursor-pointer"
                        >
                            <Building2 size={18} className="text-slate-400 dark:text-slate-500" />
                            <span className="font-bold text-sm text-slate-700 dark:text-slate-200">{safeUnit.name}</span>
                            <ChevronDown size={16} className="text-slate-400 dark:text-slate-500" />
                        </button>
                        {showUnitSelector && (
                            <>
                                <div className="fixed inset-0 z-10" onClick={() => setShowUnitSelector(false)} />
                                <div className="absolute top-full right-0 mt-2 w-64 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 shadow-xl rounded-xl z-20 overflow-hidden">
                                    {(visibleUnits === 'all' || visibleUnits.length > 1) && (
                                        <button onClick={() => { onSelectUnit({ id: 'all', name: 'Toàn công ty', type: 'Company' } as Unit); setShowUnitSelector(false); }} className="w-full text-left px-4 py-3 hover:bg-slate-50 dark:hover:bg-slate-800 font-bold text-sm text-slate-700 dark:text-slate-200 transition-colors">Toàn công ty</button>
                                    )}
                                    {units.filter(u => u.name !== 'Toàn công ty' &&
                                        (u.type === 'Center' || u.type === 'Branch') &&
                                        (visibleUnits === 'all' || visibleUnits.includes(u.id))
                                    ).sort((a, b) => a.name.localeCompare(b.name, 'vi')).map(u => (
                                        <button key={u.id} onClick={() => { onSelectUnit(u); setShowUnitSelector(false); }} className="w-full text-left px-4 py-3 hover:bg-slate-50 dark:hover:bg-slate-800 font-bold text-sm text-slate-700 dark:text-slate-200 transition-colors">{u.name}</button>
                                    ))}
                                </div>
                            </>
                        )}
                    </div>

                    {/* Year Selector */}
                    <div className="flex items-center gap-2 px-4 py-2.5 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl shadow-sm">
                        <Calendar size={18} className="text-slate-400 dark:text-slate-500" />
                        <select
                            value={yearFilter}
                            onChange={(e) => setYearFilter(e.target.value)}
                            className="bg-transparent font-bold text-sm text-slate-700 dark:text-slate-200 focus:outline-none cursor-pointer appearance-none pr-4"
                        >
                            <option value="All">Tất cả</option>
                            {availableYears.map(y => <option key={y} value={y}>Năm {y}</option>)}
                        </select>
                    </div>

                    <button className="flex items-center gap-2 px-4 py-2.5 bg-orange-50 dark:bg-orange-900/20 text-orange-600 dark:text-orange-400 rounded-xl hover:bg-orange-100 dark:hover:bg-orange-900/30 transition-colors cursor-pointer border border-orange-100 dark:border-orange-900/30">
                        <Download size={18} />
                        <span className="text-sm font-bold hidden sm:inline">Xuất báo cáo</span>
                    </button>
                </div>
            </div>

            {/* ═══ KPI Summary Cards ═══ */}
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-6">
                <KPICard
                    title="Tổng Doanh thu"
                    value={kpiData.totalRevenue}
                    icon={<CreditCard size={20} />}
                    color="emerald"
                    index={0}
                />
                <KPICard
                    title="Lợi nhuận QT"
                    value={kpiData.totalProfit}
                    icon={<TrendingUp size={20} />}
                    color="purple"
                    index={1}
                />
                <KPICard
                    title="Số Hợp đồng"
                    value={kpiData.contractCount}
                    icon={<FileText size={20} />}
                    color="indigo"
                    index={2}
                />
                <KPICard
                    title="Hoàn thành KH"
                    value={kpiData.completionRate}
                    icon={<Target size={20} />}
                    color="amber"
                    change={{ value: kpiData.completionRate.toFixed(1), isUp: kpiData.completionRate >= 50 }}
                    index={3}
                />
            </div>

            {/* ═══ Top Charts Row ═══ */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* 1. Revenue Structure — Donut */}
                <ChartCard
                    title={`Cơ cấu Doanh thu ${selectedUnit.id === 'all' ? '(Theo Đơn vị)' : '(Theo Nhân sự)'}`}
                    subtitle="Tỷ trọng đóng góp vào tổng doanh thu"
                    index={0}
                >
                    {structureData.length === 0 ? (
                        <EmptyState message="Chưa có dữ liệu doanh thu" />
                    ) : (
                        <>
                            <div className="h-[280px] relative">
                                <ResponsiveContainer width="100%" height="100%">
                                    <PieChart>
                                        <Pie
                                            data={structureData}
                                            cx="50%"
                                            cy="50%"
                                            innerRadius={70}
                                            outerRadius={95}
                                            paddingAngle={4}
                                            dataKey="value"
                                            cornerRadius={6}
                                        >
                                            {structureData.map((_, index) => (
                                                <Cell key={`cell-${index}`} fill={getChartColors()[index % getChartColors().length]} strokeWidth={0} />
                                            ))}
                                        </Pie>
                                        <Tooltip content={<CustomTooltip />} wrapperStyle={{ pointerEvents: 'auto', zIndex: 100 }} />
                                    </PieChart>
                                </ResponsiveContainer>
                                {/* Center label */}
                                <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
                                    <p className="text-[10px] font-black text-slate-300 dark:text-slate-500 uppercase tracking-widest">Tổng</p>
                                    <p className="text-xl font-black text-slate-900 dark:text-white mt-1">{formatCurrencyGlobal(pieTotal)}</p>
                                </div>
                            </div>
                            {/* Custom Legend */}
                            <div className="mt-4 space-y-2.5">
                                {structureData.slice(0, 5).map((d, i) => (
                                    <div key={i} className="flex items-center justify-between group cursor-default">
                                        <div className="flex items-center gap-3">
                                            <div className="w-3 h-3 rounded-md transition-transform group-hover:scale-125" style={{ backgroundColor: getChartColors()[i % getChartColors().length] }} />
                                            <span className="text-sm font-bold text-slate-600 dark:text-slate-300 truncate max-w-[160px]">{d.name}</span>
                                        </div>
                                        <div className="flex items-center gap-2">
                                            <span className="text-xs font-bold text-slate-400 dark:text-slate-500">{pieTotal > 0 ? ((d.value / pieTotal) * 100).toFixed(1) : '0'}%</span>
                                            <div className="w-16 h-1.5 bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden">
                                                <div className="h-full rounded-full" style={{ width: `${Math.min(100, (d.value / (Math.max(...structureData.map(x => x.value)) || 1)) * 100)}%`, backgroundColor: getChartColors()[i % getChartColors().length] }} />
                                            </div>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </>
                    )}
                </ChartCard>

                {/* 2. Plan vs Actual */}
                <ChartCard
                    title="Kế hoạch vs Thực tế"
                    subtitle="So sánh doanh thu thực tế với mục tiêu đặt ra"
                    index={1}
                >
                    {planVsActualData.length === 0 ? (
                        <EmptyState message="Chưa có dữ liệu kế hoạch" />
                    ) : (
                        <div className="h-[340px]">
                            <ResponsiveContainer width="100%" height="100%">
                                <BarChart data={planVsActualData} barCategoryGap={20}>
                                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke={getGridStroke()} />
                                    <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fill: '#64748b', fontSize: 11, fontWeight: 600 }} dy={10} />
                                    <YAxis axisLine={false} tickLine={false} tickFormatter={formatCurrency} tick={{ fill: '#64748b', fontSize: 11 }} />
                                    <Tooltip content={<CustomTooltip />} cursor={{ fill: getCursorFill() }} wrapperStyle={{ pointerEvents: 'auto', zIndex: 100 }} />
                                    <Legend wrapperStyle={{ paddingTop: '16px', fontWeight: 700, fontSize: '12px' }} />
                                    <Bar dataKey="Actual" name="Thực tế" fill={getAccentColor()} radius={[6, 6, 0, 0]} barSize={32} />
                                    <Bar dataKey="Target" name="Kế hoạch" fill={getMutedBarFill()} radius={[6, 6, 0, 0]} barSize={32} />
                                </BarChart>
                            </ResponsiveContainer>
                        </div>
                    )}
                </ChartCard>
            </div>

            {/* ═══ 3. Monthly Trend ═══ */}
            <ChartCard
                title="Xu hướng theo tháng"
                subtitle="Biến động Doanh thu & Lợi nhuận hàng tháng"
                index={2}
            >
                <div className="h-[360px]">
                    <ResponsiveContainer width="100%" height="100%">
                        <AreaChart data={monthlyTrendData}>
                            <defs>
                                <linearGradient id="colorRevAnalytics" x1="0" y1="0" x2="0" y2="1">
                                    <stop offset="5%" stopColor={getAccentColor()} stopOpacity={0.2} />
                                    <stop offset="95%" stopColor={getAccentColor()} stopOpacity={0} />
                                </linearGradient>
                                <linearGradient id="colorProfitAnalytics" x1="0" y1="0" x2="0" y2="1">
                                    <stop offset="5%" stopColor="#10b981" stopOpacity={0.2} />
                                    <stop offset="95%" stopColor="#10b981" stopOpacity={0} />
                                </linearGradient>
                            </defs>
                            <CartesianGrid strokeDasharray="3 3" vertical={false} stroke={getGridStroke()} />
                            <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fill: '#64748b', fontSize: 11, fontWeight: 600 }} dy={10} />
                            <YAxis axisLine={false} tickLine={false} tickFormatter={formatCurrency} tick={{ fill: '#64748b', fontSize: 11 }} />
                            <Tooltip content={<CustomTooltip />} wrapperStyle={{ pointerEvents: 'auto', zIndex: 100 }} />
                            <Legend wrapperStyle={{ paddingTop: '16px', fontWeight: 700, fontSize: '12px' }} />
                            <Area type="monotone" dataKey="DoanhThu" name="Doanh thu" stroke={getAccentColor()} strokeWidth={3} fillOpacity={1} fill="url(#colorRevAnalytics)" activeDot={{ r: 5, strokeWidth: 2 }} />
                            <Area type="monotone" dataKey="LoiNhuan" name="Lợi nhuận" stroke="#10b981" strokeWidth={3} fillOpacity={1} fill="url(#colorProfitAnalytics)" activeDot={{ r: 5, strokeWidth: 2 }} />
                        </AreaChart>
                    </ResponsiveContainer>
                </div>
            </ChartCard>

            {/* ═══ 4. Cashflow ═══ */}
            <ChartCard
                title="Dòng tiền Thu – Chi"
                subtitle="Phân tích luồng tiền vào/ra hàng tháng"
                index={3}
            >
                <div className="h-[360px]">
                    <ResponsiveContainer width="100%" height="100%">
                        <ComposedChart data={cashflowData}>
                            <CartesianGrid strokeDasharray="3 3" vertical={false} stroke={getGridStroke()} />
                            <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fill: '#64748b', fontSize: 11, fontWeight: 600 }} dy={10} />
                            <YAxis axisLine={false} tickLine={false} tickFormatter={formatCurrency} tick={{ fill: '#64748b', fontSize: 11 }} />
                            <Tooltip content={<CustomTooltip />} wrapperStyle={{ pointerEvents: 'auto', zIndex: 100 }} />
                            <Legend wrapperStyle={{ paddingTop: '16px', fontWeight: 700, fontSize: '12px' }} />
                            <Bar dataKey="Thu" name="Dòng tiền vào" fill="#10b981" radius={[6, 6, 0, 0]} barSize={28} />
                            <Bar dataKey="Chi" name="Dòng tiền ra" fill="#f43f5e" radius={[6, 6, 0, 0]} barSize={28} />
                            <Line type="monotone" dataKey="Rong" name="Dòng tiền ròng" stroke="#0ea5e9" strokeWidth={3} dot={false} activeDot={{ r: 6, strokeWidth: 2, fill: '#0ea5e9' }} />
                        </ComposedChart>
                    </ResponsiveContainer>
                </div>
            </ChartCard>

            {/* ═══ Customer & Product Insights ═══ */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {/* Top Customers */}
                <ChartCard title="Top Khách hàng" subtitle="Hàng đầu theo Danh thu" index={4}>
                    {topCustomersData.length === 0 ? <EmptyState message="Chưa có dữ liệu khách hàng" /> : (
                        <div className="h-[300px]">
                            <ResponsiveContainer width="100%" height="100%">
                                <BarChart data={topCustomersData} layout="vertical" margin={{ left: -10, top: 10, bottom: 0, right: 10 }}>
                                    <CartesianGrid strokeDasharray="3 3" horizontal={true} vertical={false} stroke={getGridStroke()} />
                                    <XAxis type="number" axisLine={false} tickLine={false} tickFormatter={formatCurrency} tick={{ fill: '#64748b', fontSize: 10 }} />
                                    <YAxis type="category" dataKey="name" axisLine={false} tickLine={false} width={100} tick={{ fill: '#475569', fontSize: 11, fontWeight: 600 }} />
                                    <Tooltip content={<CustomTooltip />} cursor={{ fill: getCursorFill() }} wrapperStyle={{ pointerEvents: 'auto', zIndex: 100 }} />
                                    <Bar
                                        dataKey="value"
                                        name="Doanh thu"
                                        fill="#f97316"
                                        radius={[0, 4, 4, 0]}
                                        barSize={16}
                                        style={{ cursor: 'pointer' }}
                                    >
                                        {topCustomersData.map((_, index) => (
                                            <Cell key={`cell-${index}`} fill={['#ea580c', '#f97316', '#fb923c', '#fdba74', '#fed7aa'][index]} />
                                        ))}
                                    </Bar>
                                </BarChart>
                            </ResponsiveContainer>
                        </div>
                    )}
                </ChartCard>

                {/* Top Brands */}
                <ChartCard title="Top Hãng / Đối tác" subtitle="Đóng góp nhiều doanh thu nhất" index={5}>
                    {topBrandsData.length === 0 ? <EmptyState message="Chưa có dữ liệu hãng" /> : (
                        <div className="h-[300px]">
                            <ResponsiveContainer width="100%" height="100%">
                                <BarChart data={topBrandsData} layout="vertical" margin={{ left: -10, top: 10, bottom: 0, right: 10 }}>
                                    <CartesianGrid strokeDasharray="3 3" horizontal={true} vertical={false} stroke={getGridStroke()} />
                                    <XAxis type="number" axisLine={false} tickLine={false} tickFormatter={formatCurrency} tick={{ fill: '#64748b', fontSize: 10 }} />
                                    <YAxis type="category" dataKey="name" axisLine={false} tickLine={false} width={80} tick={{ fill: '#475569', fontSize: 11, fontWeight: 600 }} />
                                    <Tooltip content={<CustomTooltip />} cursor={{ fill: getCursorFill() }} wrapperStyle={{ pointerEvents: 'auto', zIndex: 100 }} />
                                    <Bar
                                        dataKey="value"
                                        name="Doanh thu"
                                        fill="#0ea5e9"
                                        radius={[0, 4, 4, 0]}
                                        barSize={16}
                                        style={{ cursor: 'pointer' }}
                                    >
                                        {topBrandsData.map((_, index) => (
                                            <Cell key={`cell-${index}`} fill={['#0284c7', '#0ea5e9', '#38bdf8', '#7dd3fc', '#bae6fd'][index]} />
                                        ))}
                                    </Bar>
                                </BarChart>
                            </ResponsiveContainer>
                        </div>
                    )}
                </ChartCard>

                {/* Categories */}
                <ChartCard title="Nhóm Sản Phẩm" subtitle="Tỷ trọng doanh thu theo nhóm" index={6}>
                    {productCategoryData.length === 0 ? <EmptyState message="Chưa có dữ liệu sản phẩm" /> : (
                        <div className="h-[300px] relative">
                            <ResponsiveContainer width="100%" height="100%">
                                <PieChart margin={{ top: 0, bottom: 0, left: 0, right: 0 }}>
                                    <Pie
                                        data={productCategoryData}
                                        cx="50%"
                                        cy="50%"
                                        innerRadius={50}
                                        outerRadius={80}
                                        paddingAngle={4}
                                        dataKey="value"
                                        cornerRadius={4}
                                    >
                                        {productCategoryData.map((_, index) => (
                                            <Cell key={`cell-${index}`} fill={['#6366f1', '#ec4899', '#f59e0b', '#10b981', '#8b5cf6', '#06b6d4', '#f43f5e'][index % 7]} strokeWidth={0} />
                                        ))}
                                    </Pie>
                                    <Tooltip content={<CustomTooltip />} wrapperStyle={{ pointerEvents: 'auto', zIndex: 100 }} />
                                    <Legend
                                        verticalAlign="bottom"
                                        height={60}
                                        content={(props) => {
                                            return (
                                                <div className="flex flex-wrap justify-center gap-x-4 gap-y-2 mt-4 px-2">
                                                    {props.payload?.map((entry, index) => (
                                                        <div key={`item-${index}`} className="flex items-center gap-1.5 min-w-fit">
                                                            <div className="w-2.5 h-2.5 rounded-full shrink-0" style={{ backgroundColor: entry.color }} />
                                                            <span className="text-[11px] font-bold text-slate-600 dark:text-slate-400 capitalize whitespace-nowrap">{entry.value}</span>
                                                        </div>
                                                    ))}
                                                </div>
                                            );
                                        }}
                                    />
                                </PieChart>
                            </ResponsiveContainer>
                        </div>
                    )}
                </ChartCard>
            </div>

            {/* ═══ Advanced Insights Row (Payment, Sales, Profitability) ═══ */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {/* Payment Status / Cash Risk */}
                <ChartCard title="Tiến độ Thanh toán" subtitle="Tình trạng thu hồi doanh thu thực tế" index={7}>
                    {paymentStatusData.length === 0 ? <EmptyState message="Chưa có dữ liệu thanh toán" /> : (
                        <div className="h-[250px] relative">
                            <ResponsiveContainer width="100%" height="100%">
                                <PieChart margin={{ top: 0, bottom: 0, left: 0, right: 0 }}>
                                    <Pie
                                        data={paymentStatusData}
                                        cx="50%"
                                        cy="50%"
                                        innerRadius={45}
                                        outerRadius={75}
                                        paddingAngle={2}
                                        dataKey="value"
                                    >
                                        {paymentStatusData.map((entry, index) => (
                                            <Cell key={`cell-${index}`} fill={entry.color} strokeWidth={0} />
                                        ))}
                                    </Pie>
                                    <Tooltip content={<CustomTooltip />} wrapperStyle={{ pointerEvents: 'auto', zIndex: 100 }} />
                                    <Legend
                                        verticalAlign="bottom"
                                        height={40}
                                        content={(props) => (
                                            <div className="flex flex-wrap justify-center gap-4 mt-2">
                                                {props.payload?.map((entry, index) => (
                                                    <div key={`item-${index}`} className="flex items-center gap-1.5 focus:outline-none">
                                                        <div className="w-2.5 h-2.5 shrink-0" style={{ backgroundColor: entry.color, borderRadius: '4px' }} />
                                                        <span className="text-[11px] font-bold text-slate-600 dark:text-slate-400">{entry.value}</span>
                                                    </div>
                                                ))}
                                            </div>
                                        )}
                                    />
                                </PieChart>
                            </ResponsiveContainer>
                        </div>
                    )}
                </ChartCard>

                {/* Top Sales Employees */}
                <ChartCard title="Hiệu suất Nhân sự" subtitle="Top Doanh số theo Nhân viên" index={8}>
                    {topEmployeesData.length === 0 ? <EmptyState message="Chưa có dữ liệu sales" /> : (
                        <div className="h-[250px]">
                            <ResponsiveContainer width="100%" height="100%">
                                <BarChart data={topEmployeesData} layout="vertical" margin={{ left: -10, top: 10, bottom: 0, right: 10 }}>
                                    <CartesianGrid strokeDasharray="3 3" horizontal={true} vertical={false} stroke={getGridStroke()} />
                                    <XAxis type="number" axisLine={false} tickLine={false} tickFormatter={formatCurrency} tick={{ fill: '#64748b', fontSize: 10 }} />
                                    <YAxis type="category" dataKey="name" axisLine={false} tickLine={false} width={90} tick={{ fill: '#475569', fontSize: 11, fontWeight: 600 }} />
                                    <Tooltip content={<CustomTooltip />} cursor={{ fill: getCursorFill() }} wrapperStyle={{ pointerEvents: 'auto', zIndex: 100 }} />
                                    <Bar
                                        dataKey="value"
                                        name="Doanh số"
                                        fill="#3b82f6"
                                        radius={[0, 4, 4, 0]}
                                        barSize={16}
                                        style={{ cursor: 'pointer' }}
                                    >
                                        {topEmployeesData.map((_, index) => (
                                            <Cell key={`cell-${index}`} fill={['#2563eb', '#3b82f6', '#60a5fa', '#93c5fd', '#bfdbfe'][index]} />
                                        ))}
                                    </Bar>
                                </BarChart>
                            </ResponsiveContainer>
                        </div>
                    )}
                </ChartCard>

                {/* Profitability Margin by Brand */}
                <ChartCard title="Tỷ suất Lợi nhuận" subtitle="Top biên lợi nhuận (%) theo Hãng" index={9}>
                    {brandProfitabilityData.length === 0 ? <EmptyState message="Chưa có dữ liệu lợi nhuận" /> : (
                        <div className="h-[250px]">
                            <ResponsiveContainer width="100%" height="100%">
                                <BarChart data={brandProfitabilityData} margin={{ left: -20, top: 10, bottom: 0, right: 0 }}>
                                    <CartesianGrid strokeDasharray="3 3" vertical={false} horizontal={true} stroke={getGridStroke()} />
                                    <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fill: '#475569', fontSize: 10, fontWeight: 600 }} />
                                    <YAxis type="number" domain={[0, 'dataMax + 10']} axisLine={false} tickLine={false} tickFormatter={(val) => `${val}%`} tick={{ fill: '#64748b', fontSize: 10 }} />
                                    <Tooltip
                                        cursor={{ fill: getCursorFill() }}
                                        wrapperStyle={{ zIndex: 100, pointerEvents: 'auto' }}
                                        content={({ active, payload }) => {
                                            if (active && payload && payload.length) {
                                                const data = payload[0].payload;
                                                return (
                                                    <div style={getTooltipStyle()} className="rounded-lg shadow-xl p-3 border">
                                                        <p className="text-xs font-bold text-slate-500 mb-1">{data.name}</p>
                                                        <p className="text-sm font-black text-emerald-600 dark:text-emerald-400">
                                                            Biên lợi nhuận: {data.value.toFixed(1)}%
                                                        </p>
                                                        <p className="text-xs text-slate-500 mt-1">
                                                            (Doanh thu DT: {formatCurrency(data.revenue)})
                                                        </p>
                                                    </div>
                                                );
                                            }
                                            return null;
                                        }}
                                    />
                                    <Bar
                                        dataKey="value"
                                        name="Biên LN (%)"
                                        fill="#10b981"
                                        radius={[4, 4, 0, 0]}
                                        barSize={36}
                                        style={{ cursor: 'pointer' }}
                                    />
                                </BarChart>
                            </ResponsiveContainer>
                        </div>
                    )}
                </ChartCard>
            </div>

            {/* ═══ 5. Historical Comparison YoY ═══ */}
            {historicalComparisonData.length > 0 && (
                <ChartCard
                    title="So sánh Cùng kỳ (Lịch sử)"
                    subtitle="Theo dõi sự tăng trưởng qua các năm"
                    index={4}
                >
                    <div className="h-[400px]">
                        <ResponsiveContainer width="100%" height="100%">
                            <BarChart data={historicalComparisonData} barCategoryGap={25}>
                                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke={getGridStroke()} />
                                <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fill: '#64748b', fontSize: 13, fontWeight: 700 }} dy={10} />
                                <YAxis axisLine={false} tickLine={false} tickFormatter={formatCurrency} tick={{ fill: '#64748b', fontSize: 11 }} />
                                <Tooltip content={<CustomTooltip />} cursor={{ fill: getCursorFill() }} wrapperStyle={{ pointerEvents: 'auto', zIndex: 100 }} />
                                <Legend wrapperStyle={{ paddingTop: '20px', fontWeight: 700, fontSize: '12px' }} />
                                <Bar dataKey="Ký kết" fill="#4f46e5" radius={[6, 6, 0, 0]} barSize={24} />
                                <Bar dataKey="Doanh thu" fill="#10b981" radius={[6, 6, 0, 0]} barSize={24} />
                                <Bar dataKey="LNG QT" fill="#a855f7" radius={[6, 6, 0, 0]} barSize={24} />
                                <Bar dataKey="LNG DT" fill="#f59e0b" radius={[6, 6, 0, 0]} barSize={24} />
                            </BarChart>
                        </ResponsiveContainer>
                    </div>
                </ChartCard>
            )}
        </div>
    );
};

export default Analytics;
