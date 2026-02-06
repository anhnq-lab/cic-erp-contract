import React from 'react';
import { TrendingUp, DollarSign, ArrowDownRight, ArrowUpRight } from 'lucide-react';

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
        <div className="px-10 pt-4 pb-2 shrink-0 z-10 bg-white dark:bg-slate-900 animate-in fade-in slide-in-from-top-4 duration-300">
            <section className="bg-gradient-to-r from-slate-900 via-indigo-950 to-slate-900 rounded-2xl px-6 py-4 text-white shadow-lg relative overflow-hidden">
                {/* Decorative Icon */}
                <div className="absolute top-1/2 right-4 -translate-y-1/2 opacity-5">
                    <TrendingUp size={80} />
                </div>

                <div className="flex items-center justify-between gap-6 relative z-10">
                    {/* Stats - Compact Row */}
                    <div className="flex items-center gap-8 flex-1">
                        {/* Signing Value */}
                        <div className="flex items-center gap-2">
                            <DollarSign size={14} className="text-slate-400" />
                            <div>
                                <p className="text-[9px] font-bold text-slate-500 uppercase tracking-tight">Giá trị Ký kết</p>
                                <p className="text-sm font-black text-white leading-tight" title={formatVND(totals.signingValue)}>
                                    {formatVND(totals.signingValue)} <span className="text-[10px] text-slate-500">đ</span>
                                </p>
                            </div>
                        </div>

                        {/* Revenue */}
                        <div className="flex items-center gap-2">
                            <ArrowUpRight size={14} className="text-slate-400" />
                            <div>
                                <p className="text-[9px] font-bold text-slate-500 uppercase tracking-tight">Doanh thu (−VAT)</p>
                                <p className="text-sm font-black text-slate-200 leading-tight" title={formatVND(totals.estimatedRevenue)}>
                                    {formatVND(totals.estimatedRevenue)}
                                </p>
                            </div>
                        </div>

                        {/* Costs */}
                        <div className="flex items-center gap-2">
                            <ArrowDownRight size={14} className="text-rose-400" />
                            <div>
                                <p className="text-[9px] font-bold text-rose-400/80 uppercase tracking-tight">Chi phí & Giá vốn</p>
                                <p className="text-sm font-black text-rose-400 leading-tight" title={formatVND(totals.totalCosts)}>
                                    {formatVND(totals.totalCosts)}
                                </p>
                            </div>
                        </div>
                    </div>

                    {/* Profit - Highlight */}
                    <div className="flex items-center gap-3 pl-6 border-l border-white/10">
                        <div className="text-right">
                            <p className="text-[9px] font-black text-emerald-400 uppercase tracking-wide">Lợi nhuận gộp</p>
                            <div className="flex items-baseline gap-2">
                                <p className="text-lg font-black text-emerald-400 leading-none" title={formatVND(totals.grossProfit)}>
                                    {formatVND(totals.grossProfit)}
                                </p>
                                <span className="text-xs font-bold text-emerald-600">
                                    ({totals.profitMargin.toFixed(0)}%)
                                </span>
                            </div>
                        </div>
                        {/* Mini Progress */}
                        <div className="w-16 h-1.5 bg-white/10 rounded-full overflow-hidden">
                            <div
                                className="h-full bg-emerald-500 rounded-full transition-all"
                                style={{ width: `${Math.min(100, totals.profitMargin)}%` }}
                            />
                        </div>
                    </div>
                </div>
            </section>
        </div>
    );
};

export default FinancialSummary;
