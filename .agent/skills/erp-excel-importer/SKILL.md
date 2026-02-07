---
name: erp-excel-importer
description: Import data from Excel/CSV files into CIC ERP. Parse, validate, map columns, and upsert into Supabase. Follow the PAKD parser pattern.
---

# ERP Excel Importer Skill

## When to use
When importing data from Excel (.xlsx, .xls) or CSV files into any ERP entity.

## Existing patterns to follow
- PAKD parser: `services/pakdExcelParser.ts` (complex multi-sheet parser)
- Import modals: `components/ImportContractModal.tsx`, `ImportCustomerModal.tsx`, `ImportEmployeeModal.tsx`, `ImportProductModal.tsx`
- Library: `xlsx` (SheetJS) — already installed

## Workflow
```
- [ ] Step 1: Analyze source Excel structure
- [ ] Step 2: Create parser function
- [ ] Step 3: Create/update import modal component
- [ ] Step 4: Add validation logic
- [ ] Step 5: Implement upsert to Supabase
- [ ] Step 6: Test with sample file
```

## Parser template
```typescript
import * as XLSX from 'xlsx';

interface ParseResult<T> {
  data: T[];
  errors: string[];
  warnings: string[];
}

export function parse<Entity>Excel(file: File): Promise<ParseResult<Entity>> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const workbook = XLSX.read(e.target?.result, { type: 'binary' });
        const sheet = workbook.Sheets[workbook.SheetNames[0]];
        const rawData = XLSX.utils.sheet_to_json<Record<string, any>>(sheet);

        const data: Entity[] = [];
        const errors: string[] = [];
        const warnings: string[] = [];

        rawData.forEach((row, idx) => {
          try {
            const mapped = mapRow(row, idx);
            if (mapped) data.push(mapped);
          } catch (err) {
            errors.push(`Row ${idx + 2}: ${err.message}`);
          }
        });

        resolve({ data, errors, warnings });
      } catch (err) {
        reject(err);
      }
    };
    reader.readAsBinaryString(file);
  });
}

function mapRow(row: Record<string, any>, index: number): Entity | null {
  // Map Vietnamese column headers to entity fields
  // Example: 'Tên khách hàng' → name, 'Mã số thuế' → taxCode
  return { /* mapped fields */ } as Entity;
}
```

## Import modal template
Follow `ImportCustomerModal.tsx` pattern:
1. File upload area with drag & drop
2. Preview table showing parsed data
3. Error/warning display
4. Column mapping verification
5. Import button with progress indicator
6. Success/failure summary

## Column mapping conventions
Vietnamese headers commonly seen in CIC ERP:

| Vietnamese Header | English Field | Type |
|---|---|---|
| Tên | name | string |
| Mã | code | string |
| Số điện thoại | phone | string |
| Email | email | string |
| Địa chỉ | address | string |
| Mã số thuế | taxCode | string |
| Giá trị | value | number |
| Ngày ký | signedDate | date |
| Trạng thái | status | enum |

## Validation rules
- Required fields must not be empty
- Numeric fields: strip formatting (commas, dots), parse as number
- Date fields: handle multiple formats (DD/MM/YYYY, YYYY-MM-DD, Excel serial)
- Email: basic regex validation
- Duplicates: check by code or taxCode before insert

## Important rules
- Always show preview before importing
- Handle Vietnamese encoding (UTF-8)
- Support both .xlsx and .xls formats
- Log import results for audit
- Use upsert (ON CONFLICT) when possible to avoid duplicates
