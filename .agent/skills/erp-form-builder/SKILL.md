---
name: erp-form-builder
description: Build complex ERP forms with multi-section layouts, dynamic fields, validation, and searchable selects using CIC ERP's UI component library.
---

# ERP Form Builder Skill

## When to use
When creating or modifying complex forms for CIC ERP entities (contracts, payments, employees, etc.).

## Available UI components
Import from `components/ui/`:
- `Input` — Text input with label, error, icon support
- `NumberInput` — Formatted number input (Vietnamese locale)
- `SearchableSelect` — Dropdown with search, supports async data loading
- `Button` — Primary, secondary, outline, danger variants
- `Card` — Container with header and body
- `Modal` — Dialog overlay
- `ConfirmDialog` — Confirmation with destructive action support
- `QuickAddCustomerDialog` — Inline entity creation pattern

## Form layout patterns

### Single-section form
```tsx
<form onSubmit={handleSubmit} className="form-container">
  <Card>
    <h3>Thông tin cơ bản</h3>
    <div className="form-grid">
      <Input label="Tên" value={form.name} onChange={e => setField('name', e.target.value)} error={errors.name} required />
      <Input label="Email" type="email" value={form.email} onChange={e => setField('email', e.target.value)} />
    </div>
  </Card>
  <div className="form-actions">
    <Button type="button" variant="outline" onClick={onCancel}>Hủy</Button>
    <Button type="submit" loading={saving}>Lưu</Button>
  </div>
</form>
```

### Multi-section tabbed form
```tsx
const [activeTab, setActiveTab] = useState(0);
const tabs = ['Thông tin chung', 'Chi tiết', 'Tài chính', 'Phụ lục'];

<div className="form-tabs">
  {tabs.map((tab, i) => (
    <button key={i} className={`tab ${activeTab === i ? 'active' : ''}`} onClick={() => setActiveTab(i)}>
      {tab}
    </button>
  ))}
</div>
{activeTab === 0 && <GeneralInfoSection />}
{activeTab === 1 && <DetailSection />}
```

### Dynamic list fields (like LineItems)
```tsx
const [items, setItems] = useState<LineItem[]>([]);
const addItem = () => setItems([...items, { id: crypto.randomUUID(), name: '', quantity: 1, ... }]);
const removeItem = (id: string) => setItems(items.filter(i => i.id !== id));
const updateItem = (id: string, field: string, value: any) =>
  setItems(items.map(i => i.id === id ? { ...i, [field]: value } : i));
```

## Validation pattern
```typescript
interface FormErrors { [key: string]: string; }

const validate = (form: Partial<Entity>): FormErrors => {
  const errors: FormErrors = {};
  if (!form.name?.trim()) errors.name = 'Tên không được để trống';
  if (form.value && form.value < 0) errors.value = 'Giá trị phải >= 0';
  if (form.email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email)) errors.email = 'Email không hợp lệ';
  return errors;
};
```

## SearchableSelect with async data
```tsx
<SearchableSelect
  label="Khách hàng"
  value={form.customerId}
  onChange={(v) => setField('customerId', v)}
  options={customers.map(c => ({ value: c.id, label: c.name, sublabel: c.shortName }))}
  onSearch={(q) => customerService.search(q)}
  placeholder="Tìm khách hàng..."
  error={errors.customerId}
  onAddNew={() => setShowQuickAdd(true)}
/>
```

## CSS classes
```css
.form-container { max-width: 900px; margin: 0 auto; }
.form-grid { display: grid; grid-template-columns: repeat(auto-fit, minmax(280px, 1fr)); gap: 1rem; }
.form-actions { display: flex; justify-content: flex-end; gap: 0.75rem; margin-top: 1.5rem; }
```

## Important rules
- Always support both create and edit modes (check `id` param)
- Pre-fill form data when editing (fetch by ID on mount)
- Show loading skeleton while fetching edit data
- Use `sonner` for success/error toast notifications
- Navigate back after successful save
- Debounce search inputs (300ms)
