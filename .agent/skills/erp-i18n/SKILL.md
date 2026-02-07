---
name: erp-i18n
description: Manage internationalization for CIC ERP. Detect hardcoded Vietnamese strings, create translation keys, and generate locale files.
---

# ERP Internationalization (i18n) Skill

## When to use
When preparing CIC ERP for multi-language support or standardizing string management.

## Workflow
```
- [ ] Step 1: Scan codebase for hardcoded Vietnamese strings
- [ ] Step 2: Define translation key structure
- [ ] Step 3: Create locale files (vi.json, en.json)
- [ ] Step 4: Create useTranslation hook
- [ ] Step 5: Replace hardcoded strings with translation calls
- [ ] Step 6: Verify all pages render correctly
```

## Step 1: Detection patterns
Search for hardcoded Vietnamese in `.tsx` files:
- Text inside JSX: `>Văn bản<`
- Labels: `label="Tiếng Việt"`
- Placeholders: `placeholder="Nhập..."`
- Titles: `title="..."` with Vietnamese chars
- Alert/toast messages: `toast.success('Thành công')`
- Confirm dialogs: text with Vietnamese diacritics

Regex to find Vietnamese strings:
```
[àáạảãâầấậẩẫăằắặẳẵèéẹẻẽêềếệểễìíịỉĩòóọỏõôồốộổỗơờớợởỡùúụủũưừứựửữỳýỹỷỵđÀÁẠẢÃÂẦẤẬẨẪĂẰẮẶẲẴÈÉẸẺẼÊỀẾỆỂỄÌÍỊỈĨÒÓỌỎÕÔỒỐỘỔỖƠỜỚỢỞỠÙÚỤỦŨƯỪỨỰỬỮỲÝỸỶỴĐ]
```

## Step 2: Key structure
```
module.section.key

Examples:
contract.list.title        → "Danh sách hợp đồng"
contract.form.save         → "Lưu hợp đồng"
contract.status.active     → "Đang thực hiện"
common.actions.save        → "Lưu"
common.actions.cancel      → "Hủy"
common.actions.delete      → "Xóa"
common.actions.edit        → "Sửa"
common.confirm.delete      → "Bạn có chắc muốn xóa?"
dashboard.kpi.revenue      → "Doanh thu"
nav.contracts              → "Hợp đồng"
nav.customers              → "Khách hàng"
```

## Step 3: Locale file format
`lib/i18n/vi.json`:
```json
{
  "common": {
    "actions": {
      "save": "Lưu",
      "cancel": "Hủy",
      "delete": "Xóa",
      "edit": "Chỉnh sửa",
      "search": "Tìm kiếm",
      "filter": "Lọc",
      "export": "Xuất",
      "import": "Nhập",
      "back": "Quay lại",
      "confirm": "Xác nhận"
    },
    "status": {
      "active": "Hoạt động",
      "inactive": "Ngừng",
      "pending": "Chờ duyệt"
    }
  },
  "contract": { ... },
  "customer": { ... },
  "payment": { ... }
}
```

## Step 4: Hook
```typescript
// lib/i18n/useTranslation.ts
import vi from './vi.json';
import en from './en.json';

const locales = { vi, en } as const;
type Locale = keyof typeof locales;

export function useTranslation(locale: Locale = 'vi') {
  const t = (key: string): string => {
    const keys = key.split('.');
    let value: any = locales[locale];
    for (const k of keys) {
      value = value?.[k];
      if (value === undefined) return key; // fallback to key
    }
    return typeof value === 'string' ? value : key;
  };
  return { t, locale };
}
```

## Step 5: Usage
```tsx
// Before
<h1>Danh sách hợp đồng</h1>
<Button>Lưu</Button>

// After
const { t } = useTranslation();
<h1>{t('contract.list.title')}</h1>
<Button>{t('common.actions.save')}</Button>
```

## Priority modules for i18n
1. Navigation/Sidebar (most visible)
2. Common actions (Lưu, Hủy, Xóa, etc.)
3. Status labels and badges
4. Form labels
5. Dashboard titles
6. Error/success messages
