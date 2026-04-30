/**
 * AI Assistant — DynamicChart + MARKDOWN_COMPONENTS.
 * Extracted from AIAssistant.tsx (Phase 2 refactor).
 *
 * DynamicChart renders AI-generated chart configs (bar / line / pie).
 * MARKDOWN_COMPONENTS wires custom renderers into ReactMarkdown.
 */

import React from 'react';
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid,
  Tooltip as RechartsTooltip, Legend, ResponsiveContainer,
  PieChart, Pie, Cell, LineChart, Line,
} from 'recharts';

// ─── Chart helpers ──────────────────────────────────────────────────────────

const formatValue = (value: any) =>
  new Intl.NumberFormat('vi-VN', { notation: 'compact', compactDisplay: 'short' }).format(value);

const formatTooltip = (value: any) =>
  new Intl.NumberFormat('vi-VN').format(Number(value));

const PIE_COLORS = ['#4f46e5', '#3b82f6', '#ec4899', '#f59e0b', '#10b981', '#6366f1'];
const CHART_CURSOR = { fill: 'rgba(0,0,0,0.05)' };
const LEGEND_STYLE = { fontSize: '12px', marginTop: '10px' };

// ─── DynamicChart ───────────────────────────────────────────────────────────

export const DynamicChart = React.memo(({ configStr }: { configStr: string }) => {
  const chartConfig = React.useMemo(() => {
    try {
      // LLMs often leave trailing commas or add backticks inside the block
      let cleanStr = configStr.replace(/,\s*([\]}])/g, '$1').trim();
      if (cleanStr.startsWith('```json')) cleanStr = cleanStr.substring(7);
      if (cleanStr.startsWith('`')) cleanStr = cleanStr.replace(/^`+|`+$/g, '');
      cleanStr = cleanStr.trim();

      const config = JSON.parse(cleanStr);
      if (!config.data || !Array.isArray(config.data) || config.data.length === 0) {
        return { error: 'Dữ liệu mảng data: [] rỗng hoặc không tồn tại', raw: configStr };
      }

      // ═══ AUTO-NORMALIZE ═══

      // 1) Tìm xAxisKey
      if (!config.xAxisKey) {
        const firstItem = config.data[0];
        if (firstItem.name !== undefined) config.xAxisKey = 'name';
        else if (firstItem.label !== undefined) config.xAxisKey = 'label';
        else config.xAxisKey = Object.keys(firstItem)[0];
      }

      // 2) Tìm lines
      if (!config.lines || !Array.isArray(config.lines) || config.lines.length === 0) {
        const chartColors = config.colors || ['#6366f1', '#94a3b8', '#ec4899', '#10b981', '#f59e0b', '#3b82f6'];
        if (config.keys && Array.isArray(config.keys)) {
          config.lines = config.keys.map((key: string, i: number) => ({
            dataKey: key,
            color: chartColors[i % chartColors.length],
            name: key,
          }));
        } else {
          const firstItem = config.data[0];
          const numericKeys = Object.keys(firstItem).filter(k =>
            k !== config.xAxisKey && typeof firstItem[k] === 'number'
          );
          config.lines = numericKeys.map((key: string, i: number) => ({
            dataKey: key,
            color: chartColors[i % chartColors.length],
            name: key,
          }));
        }
      }

      return { config };
    } catch (e: any) {
      return { error: e.message, raw: configStr };
    }
  }, [configStr]);

  if (chartConfig.error) {
    return (
      <div className="text-sm text-amber-600 border border-amber-200 p-3 rounded-lg bg-amber-50 dark:bg-amber-900/20 my-2">
        <p className="font-bold mb-2">⚠️ Dữ liệu biểu đồ từ AI chưa chuẩn định dạng JSON ({chartConfig.error}):</p>
        <pre className="text-[10px] overflow-auto whitespace-pre-wrap">{chartConfig.raw}</pre>
      </div>
    );
  }

  const { type, data, xAxisKey, lines, title, unit } = chartConfig.config;

  const renderChart = () => {
    switch (type) {
      case 'bar':
        return (
          <BarChart data={data}>
            <CartesianGrid strokeDasharray="3 3" opacity={0.2} vertical={false} />
            <XAxis dataKey={xAxisKey} fontSize={11} tickLine={false} axisLine={false} />
            <YAxis fontSize={11} tickFormatter={formatValue} tickLine={false} axisLine={false} />
            <RechartsTooltip cursor={CHART_CURSOR} formatter={formatTooltip} />
            <Legend wrapperStyle={LEGEND_STYLE} />
            {lines?.map((line: any, i: number) => (
              <Bar key={line.dataKey || i} dataKey={line.dataKey} fill={line.color || '#4f46e5'} radius={[4, 4, 0, 0]} name={line.name || line.dataKey} />
            ))}
          </BarChart>
        );
      case 'line':
        return (
          <LineChart data={data}>
            <CartesianGrid strokeDasharray="3 3" opacity={0.2} vertical={false} />
            <XAxis dataKey={xAxisKey} fontSize={11} tickLine={false} axisLine={false} />
            <YAxis fontSize={11} tickFormatter={formatValue} tickLine={false} axisLine={false} />
            <RechartsTooltip formatter={formatTooltip} />
            <Legend wrapperStyle={LEGEND_STYLE} />
            {lines?.map((line: any, i: number) => (
              <Line key={line.dataKey || i} type="monotone" dataKey={line.dataKey} stroke={line.color || '#4f46e5'} strokeWidth={2} name={line.name || line.dataKey} />
            ))}
          </LineChart>
        );
      case 'pie':
        return (
          <PieChart>
            <Pie data={data} dataKey={lines?.[0]?.dataKey || 'value'} nameKey={xAxisKey} cx="50%" cy="50%" outerRadius={80} label>
              {data.map((_entry: any, index: number) => (
                <Cell key={'cell-' + index} fill={PIE_COLORS[index % PIE_COLORS.length]} />
              ))}
            </Pie>
            <RechartsTooltip formatter={formatTooltip} />
            <Legend wrapperStyle={LEGEND_STYLE} />
          </PieChart>
        );
      default:
        return <div className="text-sm text-slate-500">Loại biểu đồ không được hỗ trợ</div>;
    }
  };

  return (
    <div className="w-full my-4 p-4 border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 rounded-xl shadow-sm overflow-hidden">
      {title && <p className="text-sm font-bold text-slate-700 dark:text-slate-200 mb-2 text-center">{title}</p>}
      <div className="h-72">
        <ResponsiveContainer width="99%" height="100%">
          {renderChart()}
        </ResponsiveContainer>
      </div>
      {unit && <p className="text-[10px] text-slate-400 text-right mt-1">Đơn vị: {unit}</p>}
    </div>
  );
});

DynamicChart.displayName = 'DynamicChart';

// ─── Markdown custom renderers ───────────────────────────────────────────────

export const MARKDOWN_COMPONENTS: any = {
  table: ({ node: _node, ...props }: any) => (
    <div className="overflow-x-auto my-4">
      <table className="min-w-full divide-y divide-slate-200 dark:divide-slate-700 border border-slate-200 dark:border-slate-700 rounded-lg" {...props} />
    </div>
  ),
  th: ({ node: _node, ...props }: any) => (
    <th className="px-4 py-2 bg-slate-50 dark:bg-slate-800 text-left text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400" {...props} />
  ),
  td: ({ node: _node, ...props }: any) => (
    <td className="px-4 py-2 border-t border-slate-100 dark:border-slate-700 text-sm" {...props} />
  ),
  ul: ({ node: _node, ...props }: any) => <ul className="list-disc pl-5 space-y-1" {...props} />,
  ol: ({ node: _node, ...props }: any) => <ol className="list-decimal pl-5 space-y-1" {...props} />,
  code: ({ node: _node, className, children, ...props }: any) => {
    const match = /language-(\w+)/.exec(className || '');
    if (match && match[1] === 'chart') {
      return <DynamicChart configStr={String(children).replace(/\n$/, '')} />;
    }
    return className ? (
      <pre className="p-4 rounded-lg bg-slate-900 text-slate-50 overflow-x-auto my-4 text-sm font-mono">
        <code className={className} {...props}>{children}</code>
      </pre>
    ) : (
      <code className="bg-slate-100 dark:bg-slate-700 px-1.5 py-0.5 rounded text-xs font-mono text-rose-500 dark:text-rose-400" {...props}>
        {children}
      </code>
    );
  },
  a: ({ node: _node, ...props }: any) => {
    const isExport = (props.href as string)?.startsWith('data:') || (props.href as string)?.startsWith('blob:');
    return (
      <a
        className="text-indigo-600 dark:text-indigo-400 hover:underline font-bold"
        target="_blank"
        rel="noopener noreferrer"
        download={isExport ? 'BaoCao_Export.md' : undefined}
        {...props}
      />
    );
  },
};
