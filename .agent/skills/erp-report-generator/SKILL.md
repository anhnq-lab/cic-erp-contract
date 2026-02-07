---
name: erp-report-generator
description: Generate report modules for CIC ERP with filters, data tables, charts, PDF/Excel export, and print-friendly layouts.
---

# ERP Report Generator Skill

## When to use
When creating report pages that display aggregated data with filters, exportable tables, and print layouts.

## Workflow
```
- [ ] Step 1: Define report data source (Supabase query or RPC)
- [ ] Step 2: Create filter UI (date range, unit, status)
- [ ] Step 3: Build data table with sorting
- [ ] Step 4: Add summary/totals row
- [ ] Step 5: Add chart visualization
- [ ] Step 6: Implement Excel export
- [ ] Step 7: Add print-friendly CSS
```

## Report component template
```tsx
import { useState, useEffect } from 'react';
import { Card } from './ui/Card';
import { Button } from './ui/Button';
import { DataTable } from './ui/DataTable';
import { Download, Printer, Filter } from 'lucide-react';
import * as XLSX from 'xlsx';

export function <Report>Report() {
  const [filters, setFilters] = useState({ dateFrom: '', dateTo: '', unitId: '', status: '' });
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(false);

  const fetchReport = async () => {
    setLoading(true);
    // Use Supabase RPC or query with filters
    setLoading(false);
  };

  const exportExcel = () => {
    const ws = XLSX.utils.json_to_sheet(data);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'Báo cáo');
    XLSX.writeFile(wb, `bao-cao-${Date.now()}.xlsx`);
  };

  const handlePrint = () => window.print();

  return (
    <div className="report-page">
      {/* Filters */}
      <Card className="report-filters no-print">
        <div className="filter-row">
          <input type="date" value={filters.dateFrom} onChange={...} />
          <input type="date" value={filters.dateTo} onChange={...} />
          <select value={filters.unitId} onChange={...}>...</select>
          <Button onClick={fetchReport}><Filter size={16} /> Lọc</Button>
        </div>
        <div className="report-actions">
          <Button variant="outline" onClick={exportExcel}><Download size={16} /> Xuất Excel</Button>
          <Button variant="outline" onClick={handlePrint}><Printer size={16} /> In</Button>
        </div>
      </Card>

      {/* Summary cards */}
      <div className="report-summary">
        <Card><span className="label">Tổng giá trị</span><span className="value">{formatCurrency(total)}</span></Card>
        <Card><span className="label">Số lượng</span><span className="value">{count}</span></Card>
      </div>

      {/* Data table */}
      <Card>
        <DataTable columns={columns} data={data} loading={loading} />
      </Card>
    </div>
  );
}
```

## Supabase RPC for report aggregation
```sql
CREATE OR REPLACE FUNCTION public.report_<name>(
  p_date_from DATE DEFAULT NULL,
  p_date_to DATE DEFAULT NULL,
  p_unit_id UUID DEFAULT NULL
)
RETURNS JSON LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  RETURN (
    SELECT json_agg(row_to_json(t))
    FROM (
      SELECT c.title, c.value, c.status, u.name as unit_name, e.name as salesperson
      FROM contracts c
      LEFT JOIN units u ON c.unit_id = u.id
      LEFT JOIN employees e ON c.salesperson_id = e.id
      WHERE (p_date_from IS NULL OR c.signed_date >= p_date_from)
        AND (p_date_to IS NULL OR c.signed_date <= p_date_to)
        AND (p_unit_id IS NULL OR c.unit_id = p_unit_id)
      ORDER BY c.signed_date DESC
    ) t
  );
END;
$$;
```

## Print CSS
```css
@media print {
  .no-print { display: none !important; }
  .report-page { padding: 0; background: white; color: black; }
  .report-page table { border-collapse: collapse; width: 100%; }
  .report-page th, .report-page td { border: 1px solid #333; padding: 4px 8px; font-size: 11px; }
}
```

## Number formatting
```typescript
const formatCurrency = (v: number) => new Intl.NumberFormat('vi-VN').format(Math.round(v)) + ' đ';
const formatPercent = (v: number) => v.toFixed(1) + '%';
```

## Common ERP report types
- Báo cáo doanh thu theo đơn vị / theo tháng
- Báo cáo công nợ (overdue payments)
- Báo cáo KPI nhân viên
- Báo cáo hợp đồng theo trạng thái
- Báo cáo lợi nhuận gộp
