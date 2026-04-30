/**
 * Analytics — Shared UI helper components and utilities.
 * Extracted from Analytics.tsx (Phase 2 refactor).
 */

import React from 'react';
import { ArrowUpRight, ArrowDownRight, Inbox } from 'lucide-react';
import { motion } from 'framer-motion';
import { Skeleton } from '../ui/Skeleton';

// ─── Loading Skeleton ───────────────────────────────────────────────────────

export const AnalyticsSkeleton = () => (
  <div className="space-y-8 animate-pulse p-2">
    {/* KPI Cards */}
    <div className="grid grid-cols-2 lg:grid-cols-4 gap-6">
      {[1, 2, 3, 4].map(i => <Skeleton key={i} className="h-36 rounded-xl" />)}
    </div>
    {/* Charts */}
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
      {[1, 2].map(i => <Skeleton key={i} className="h-[380px] rounded-xl" />)}
    </div>
    <Skeleton className="h-[400px] rounded-xl" />
    <Skeleton className="h-[400px] rounded-xl" />
  </div>
);

// ─── Empty State ────────────────────────────────────────────────────────────

export const EmptyState = ({ message }: { message: string }) => (
  <div className="flex flex-col items-center justify-center py-16 text-center">
    <div className="w-16 h-16 rounded-2xl bg-slate-100 dark:bg-slate-800 flex items-center justify-center mb-4">
      <Inbox size={28} className="text-slate-300 dark:text-slate-600" />
    </div>
    <p className="text-sm font-bold text-slate-400 dark:text-slate-500">{message}</p>
    <p className="text-xs text-slate-400 dark:text-slate-500 mt-1">Hãy thử chọn đơn vị hoặc năm khác</p>
  </div>
);

// ─── KPI Card ───────────────────────────────────────────────────────────────

export const KPICard = ({ title, value, icon, color, change, index }: {
  title: string;
  value: number;
  icon: React.ReactNode;
  color: string;
  change?: { value: string; isUp: boolean };
  index: number;
}) => {
  const formatValue = (val: number) => {
    const abs = Math.abs(val);
    const sign = val < 0 ? '-' : '';
    if (abs >= 1e9) return `${sign}${(abs / 1e9).toFixed(2)} tỷ`;
    if (abs >= 1e6) return `${sign}${Math.round(abs / 1e6)} triệu`;
    if (abs >= 1e3) return `${sign}${Math.round(abs / 1e3)}K`;
    return Math.round(val).toString();
  };

  const colorMap: Record<string, string> = {
    indigo: 'text-indigo-600 dark:text-indigo-400 bg-indigo-50 dark:bg-indigo-900/20 border-indigo-100 dark:border-indigo-900/30',
    emerald: 'text-emerald-600 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-900/20 border-emerald-100 dark:border-emerald-900/30',
    purple: 'text-purple-600 dark:text-purple-400 bg-purple-50 dark:bg-purple-900/20 border-purple-100 dark:border-purple-900/30',
    amber: 'text-amber-600 dark:text-amber-400 bg-amber-50 dark:bg-amber-900/20 border-amber-100 dark:border-amber-900/30',
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.1, duration: 0.4, ease: 'easeOut' }}
      className="bg-white dark:bg-slate-900 p-6 rounded-xl border border-slate-200 dark:border-slate-800 shadow-sm hover:shadow-lg transition-all group relative overflow-hidden"
    >
      <div className="flex justify-between items-start mb-5">
        <div className={`p-3 rounded-xl ${colorMap[color]} transition-transform group-hover:rotate-6`}>
          {icon}
        </div>
        {change && (
          <div className={`flex items-center gap-1 text-[11px] font-black ${change.isUp ? 'text-emerald-500' : 'text-rose-500'}`}>
            {change.isUp ? <ArrowUpRight size={14} /> : <ArrowDownRight size={14} />}
            {change.value}%
          </div>
        )}
      </div>
      <p className="text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest mb-1.5">{title}</p>
      <h4 className="text-2xl font-black text-slate-900 dark:text-slate-100 tracking-tight">{formatValue(value)}</h4>
    </motion.div>
  );
};

// ─── Chart Card Wrapper ─────────────────────────────────────────────────────

export const ChartCard = ({ title, subtitle, children, index, className = '' }: {
  title: string;
  subtitle?: string;
  children: React.ReactNode;
  index: number;
  className?: string;
}) => (
  <motion.div
    initial={{ opacity: 0, y: 24 }}
    animate={{ opacity: 1, y: 0 }}
    transition={{ delay: 0.3 + index * 0.12, duration: 0.5, ease: 'easeOut' }}
    className={`bg-white dark:bg-slate-900 p-8 rounded-xl border border-slate-200 dark:border-slate-800 shadow-sm hover:shadow-lg transition-all ${className}`}
  >
    <div className="mb-8">
      <h3 className="text-lg font-black text-slate-900 dark:text-slate-100 uppercase tracking-tight">{title}</h3>
      {subtitle && <p className="text-sm font-medium text-slate-500 dark:text-slate-400 mt-1">{subtitle}</p>}
    </div>
    {children}
  </motion.div>
);

// ─── Currency Formatters ────────────────────────────────────────────────────

export const formatCurrencyGlobal = (val: number) => {
  const abs = Math.abs(val);
  const sign = val < 0 ? '-' : '';
  if (abs >= 1e9) return `${sign}${(abs / 1e9).toFixed(2)} tỷ`;
  if (abs >= 1e6) return `${sign}${(abs / 1e6).toFixed(0)} tr`;
  if (abs >= 1e3) return `${sign}${Math.round(abs / 1e3)}K`;
  return `${Math.round(val)}`;
};

export const formatCurrency = (val: number) => {
  const abs = Math.abs(val);
  const sign = val < 0 ? '-' : '';
  if (abs >= 1e9) return `${sign}${(abs / 1e9).toFixed(1)} tỷ`;
  if (abs >= 1e6) return `${sign}${(abs / 1e6).toFixed(0)} triệu`;
  return `${val}`;
};

export const formatCurrencyCompact = (val: number) => {
  if (val >= 1000000000) return (val / 1000000000).toFixed(1) + ' tỷ';
  if (val >= 1000000) return (val / 1000000).toFixed(1) + ' tr';
  return new Intl.NumberFormat('vi-VN').format(val);
};
