---
name: erp-crud-generator
description: Generate a complete CRUD module (types, service, list, form, detail components) for a new ERP entity following CIC ERP patterns.
---

# ERP CRUD Generator Skill

## When to use
When creating a new entity/module in CIC ERP (e.g., a new resource like invoices, vendors, projects).

## Workflow checklist
```
- [ ] Step 1: Define entity type in types.ts
- [ ] Step 2: Create service in services/
- [ ] Step 3: Create List component
- [ ] Step 4: Create Form component
- [ ] Step 5: Create Detail component
- [ ] Step 6: Add route in App.tsx
- [ ] Step 7: Add sidebar navigation
- [ ] Step 8: Create Supabase migration
```

## File structure to generate

```
types.ts                    → Add interface
services/<entity>Service.ts → CRUD service
components/<Entity>List.tsx → DataTable list view
components/<Entity>Form.tsx → Create/Edit form
components/<Entity>Detail.tsx → Detail view
```

## Step 1: Type definition (types.ts)
Follow existing patterns. Always include:
```typescript
export interface <Entity> {
  id: string;
  // entity-specific fields
  createdAt?: string;
  updatedAt?: string;
}
```

## Step 2: Service (services/<entity>Service.ts)
Follow `customerService.ts` pattern:
```typescript
import { supabase } from '../lib/supabase';
import type { <Entity> } from '../types';

export const <entity>Service = {
  async getAll(): Promise<Entity[]> {
    const { data, error } = await supabase.from('<entities>').select('*').order('created_at', { ascending: false });
    if (error) throw error;
    return data || [];
  },
  async getById(id: string): Promise<Entity | null> {
    const { data, error } = await supabase.from('<entities>').select('*').eq('id', id).single();
    if (error) throw error;
    return data;
  },
  async create(entity: Omit<Entity, 'id'>): Promise<Entity> {
    const { data, error } = await supabase.from('<entities>').insert(entity).select().single();
    if (error) throw error;
    return data;
  },
  async update(id: string, entity: Partial<Entity>): Promise<Entity> {
    const { data, error } = await supabase.from('<entities>').update(entity).eq('id', id).select().single();
    if (error) throw error;
    return data;
  },
  async delete(id: string): Promise<void> {
    const { error } = await supabase.from('<entities>').delete().eq('id', id);
    if (error) throw error;
  },
};
```

## Step 3: List component
Follow `CustomerList.tsx` pattern. Use `DataTable` from `components/ui/DataTable.tsx`:
- Search bar with filtering
- Column definitions with sortable headers
- Action buttons (view, edit, delete)
- Badge status indicators
- Empty state using `EmptyState` component
- Responsive card view for mobile

## Step 4: Form component
Follow `CustomerForm.tsx` pattern. Use existing UI components:
- `Input`, `NumberInput`, `SearchableSelect` from `components/ui/`
- Form validation with error messages
- Handle both create and edit modes via `id` parameter
- Loading states with `Skeleton`
- Toast notifications via `sonner`

## Step 5: Detail component
Follow `CustomerDetail.tsx` pattern:
- Card-based layout with sections
- Breadcrumb navigation
- Edit/Delete action buttons
- Related data sections
- Back navigation

## Step 6: Routes (App.tsx)
Add routes following existing pattern:
```typescript
<Route path="/<entities>" element={<EntityList />} />
<Route path="/<entities>/new" element={<EntityForm />} />
<Route path="/<entities>/:id" element={<EntityDetail />} />
<Route path="/<entities>/:id/edit" element={<EntityForm />} />
```

## Step 7: Sidebar (components/Sidebar.tsx)
Add navigation item with appropriate Lucide icon.

## UI components available
Badge, Breadcrumb, Button, Card, ConfirmDialog, DataTable, EmptyState, ErrorState, Input, Modal, NumberInput, SearchableSelect, Skeleton, Tooltip
