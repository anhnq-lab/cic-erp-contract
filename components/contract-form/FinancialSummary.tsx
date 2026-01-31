import React from 'react';
import { TrendingUp, ShieldCheck } from 'lucide-react';

interface FinancialTotals {
    signingValue: number;
    estimatedRevenue: number;
    totalCosts: number;
    grossProfit: number;
    profitMargin: number;
}

interface FinancialSummaryProps {
    totals: FinancialTotals;
    formatVND: (val: number) => string;
}

const FinancialSummary: React.FC<FinancialSummaryProps> = ({
    totals,
    formatVND,
}) => {
    return (
        <div className="px-10 pt-8 pb-4 shrink-0 z-10 bg-white dark:bg-slate-900 animate-in fade-in slide-in-from-top-4 duration-500">
            <section className="bg-gradient-to-r from-slate-900 via-indigo-950 to-slate-900 rounded-[32px] p-8 text-white shadow-2xl relative overflow-hidden">
                {/* Decorative Icon */}
                <div className="absolute top-0 right-0 p-8 opacity-10">
                    <TrendingUp size={120} />
                </div>

                <div className="flex flex-col md:flex-row items-center justify-between gap-8 relative z-10">
                    {/* Header Vertical */}
                    <div className="flex items-center gap-4 border-r border-white/10 pr-8 min-w-[200px]">
                        <div className="p-3 bg-indigo-500/20 rounded-2xl">
                            <ShieldCheck size={32} className="text-indigo-400" />
                        </div>
                        <div>
                            <h3 className="text-xs font-black text-indigo-400 uppercase tracking-widest mb-1">Báo cáo</h3>
                            <p className="text-lg font-black text-white">Lợi nhuận dự kiến</p>
                        </div>
                    </div>

                    {/* Stats Grid */}
                    <div className="flex-1 grid grid-cols-1 md:grid-cols-4 gap-4">
                        {/* Total Value */}
                        <div>
                            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-tighter mb-1">
                                Giá trị Ký kết (Tổng đầu ra)
                            </p>
                            <p
                                className="text-lg font-black text-white leading-none truncate"
                                title={formatVND(totals.signingValue)}
                            >
                                {formatVND(totals.signingValue)} <span className="text-xs font-medium text-slate-500">đ</span>
                            </p>
                        </div>

                        {/* Revenue */}
                        <div>
                            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-tighter mb-1">
                                Doanh thu dự kiến (Trừ VAT)
                            </p>
                            <p
                                className="text-lg font-black text-slate-200 truncate"
                                title={formatVND(totals.estimatedRevenue)}
                            >
                                {formatVND(totals.estimatedRevenue)}
                            </p>
                        </div>

                        {/* Costs */}
                        <div>
                            <p className="text-[10px] font-bold text-rose-400/80 uppercase tracking-tighter mb-1">
                                Tổng chi phí & Giá vốn
                            </p>
                            <p
                                className="text-lg font-black text-rose-400 truncate"
                                title={formatVND(totals.totalCosts)}
                            >
                                {formatVND(totals.totalCosts)}
                            </p>
                        </div>

                        {/* Profit */}
                        <div className="relative group cursor-help">
                            <p className="text-[10px] font-black text-emerald-400 uppercase tracking-widest mb-1">
                                Lợi nhuận gộp
                            </p>
                            <div className="flex items-end gap-2">
                                <p
                                    className="text-lg font-black text-emerald-400 leading-none truncate"
                                    title={formatVND(totals.grossProfit)}
                                >
                                    {formatVND(totals.grossProfit)}
                                </p>
                                <span className="text-xs font-bold text-emerald-600 mb-0.5">
                                    ({totals.profitMargin.toFixed(0)}%)
                                </span>
                            </div>
                            {/* Progress Bar */}
                            <div className="absolute -bottom-2 left-0 w-full h-1 bg-white/10 rounded-full overflow-hidden mt-2">
                                <div
                                    className="h-full bg-emerald-500 rounded-full"
                                    style={{ width: `${Math.min(100, totals.profitMargin)}%` }}
                                />
                            </div>
                        </div>
                    </div>
                </div>
            </section>
        </div>
    );
};

export default FinancialSummary;
