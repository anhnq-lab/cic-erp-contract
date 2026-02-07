---
name: erp-dashboard-widget
description: Create dashboard cards, KPI widgets, and charts for CIC ERP using Recharts. Follow the existing Dashboard.tsx patterns.
---

# ERP Dashboard Widget Skill

## When to use
When adding new KPI cards, charts, or data visualization widgets to the CIC ERP dashboard.

## Existing patterns
- Dashboard: `components/Dashboard.tsx`
- Chart library: `recharts` (already installed)
- Animation: `framer-motion` (already installed)
- Icons: `lucide-react`
- UI: `Card` component from `components/ui/Card.tsx`

## Widget types

### 1. KPI Summary Card
```tsx
<Card className="kpi-card">
  <div className="kpi-icon"><TrendingUp /></div>
  <div className="kpi-content">
    <span className="kpi-label">Doanh thu</span>
    <span className="kpi-value">{formatCurrency(value)}</span>
    <span className={`kpi-change ${isPositive ? 'positive' : 'negative'}`}>
      {change > 0 ? '+' : ''}{change}% so với cùng kỳ
    </span>
  </div>
</Card>
```

### 2. Bar/Column Chart
```tsx
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';

<ResponsiveContainer width="100%" height={300}>
  <BarChart data={data}>
    <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" />
    <XAxis dataKey="name" stroke="var(--text-secondary)" />
    <YAxis stroke="var(--text-secondary)" tickFormatter={formatShortCurrency} />
    <Tooltip formatter={formatCurrency} />
    <Bar dataKey="value" fill="var(--primary)" radius={[4, 4, 0, 0]} />
  </BarChart>
</ResponsiveContainer>
```

### 3. Pie/Donut Chart
```tsx
import { PieChart, Pie, Cell, ResponsiveContainer, Legend } from 'recharts';

const COLORS = ['#6366f1', '#8b5cf6', '#a78bfa', '#c4b5fd', '#ddd6fe'];

<ResponsiveContainer width="100%" height={300}>
  <PieChart>
    <Pie data={data} innerRadius={60} outerRadius={100} dataKey="value" nameKey="name">
      {data.map((_, i) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}
    </Pie>
    <Legend />
    <Tooltip formatter={formatCurrency} />
  </PieChart>
</ResponsiveContainer>
```

### 4. Trend Line Chart
```tsx
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';

<ResponsiveContainer width="100%" height={300}>
  <LineChart data={data}>
    <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" />
    <XAxis dataKey="month" />
    <YAxis tickFormatter={formatShortCurrency} />
    <Tooltip formatter={formatCurrency} />
    <Line type="monotone" dataKey="actual" stroke="var(--primary)" strokeWidth={2} dot={false} />
    <Line type="monotone" dataKey="target" stroke="var(--text-tertiary)" strokeDasharray="5 5" dot={false} />
  </LineChart>
</ResponsiveContainer>
```

## Data aggregation
Use Supabase RPC for server-side aggregation:
```sql
CREATE OR REPLACE FUNCTION public.get_<widget>_stats(p_unit_id UUID DEFAULT NULL)
RETURNS JSON LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  RETURN (SELECT json_build_object(
    'total', COUNT(*),
    'value', COALESCE(SUM(value), 0)
  ) FROM contracts WHERE (p_unit_id IS NULL OR unit_id = p_unit_id));
END;
$$;
```

## Number formatting
```typescript
const formatCurrency = (v: number) => new Intl.NumberFormat('vi-VN').format(v) + ' đ';
const formatShortCurrency = (v: number) => {
  if (v >= 1e9) return (v / 1e9).toFixed(1) + ' tỷ';
  if (v >= 1e6) return (v / 1e6).toFixed(0) + ' tr';
  return v.toLocaleString('vi-VN');
};
```

## Dark mode
Always use CSS variables (`var(--primary)`, `var(--bg-card)`, etc.) instead of hardcoded colors. All charts must work in both light and dark themes.

## Animation
Wrap widgets with framer-motion for entrance animations:
```tsx
<motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: index * 0.1 }}>
  {/* widget content */}
</motion.div>
```
