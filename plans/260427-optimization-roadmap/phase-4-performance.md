# Phase 4 — Performance & UX

- **Ưu tiên:** 🟡 P2
- **Thời lượng:** 3-5 ngày
- **Owner:** 1 FE
- **Phụ thuộc:** Phase 2 (file đã nhỏ, dễ optimize) + Phase 3 (CI gate đã có)
- **Trạng thái:** ⬜ Pending

---

## Mục tiêu

| Chỉ số | Hiện tại | Mục tiêu | Cách đo |
|---|---|---|---|
| Bundle main chunk (gzip) | Chưa đo | **< 500KB** | `rollup-plugin-visualizer` |
| Total bundle (gzip) | Chưa đo | **< 2MB** | Cùng plugin |
| Lighthouse Perf (3 route) | Chưa đo | **≥ 80** | Lighthouse CI |
| Lighthouse A11y (3 route) | Chưa đo | **≥ 90** | Cùng |
| Render danh sách 1.000 dòng | Chưa đo | **< 100ms** | DevTools Profiler |
| Dark mode coverage | Chưa đo | **100%** | Script audit |
| Realtime channel leak | Chưa đo | **0 leak** | Supabase dashboard |

3 route đo Lighthouse: `/`, `/contracts`, `/dashboard`.

---

## Danh sách công việc

### Task 4.1 — Bundle analyzer baseline

**Phương án:**

1. Cài plugin:
```bash
npm install -D rollup-plugin-visualizer
```

2. Sửa `vite.config.ts`:
```ts
import { visualizer } from 'rollup-plugin-visualizer';

build: {
  rollupOptions: {
    plugins: [
      visualizer({
        filename: 'docs/perf/bundle-stats.html',
        open: false,
        gzipSize: true,
        brotliSize: true,
      }),
    ],
    // ... existing manualChunks
  },
}
```

3. Build + commit baseline:
```bash
npm run build
mkdir -p docs/perf
cp docs/perf/bundle-stats.html docs/perf/bundle-baseline-2026-04-27.html
git add docs/perf/bundle-baseline-2026-04-27.html
```

4. Document trong baseline file: top 10 chunk size, treemap screenshot.

**DoD:**
- [ ] Plugin tích hợp
- [ ] File baseline được commit
- [ ] Có document mô tả top 10 chunk

---

### Task 4.2 — Tối ưu chunks

**Phân tích `manualChunks` hiện tại** ([vite.config.ts](../../vite.config.ts)):
- `xlsx`, `recharts`, `pdf`, `ui-vendor`, `ai-vendor`, `supabase`, `react-vendor` — đã chia.

**Đề xuất bổ sung:**

| Chunk mới | Lý do | Lib |
|---|---|---|
| `tiptap` | Heavy editor, chỉ dùng ở vài form | `@tiptap/react`, `@tiptap/pm`, `@tiptap/starter-kit`, `@tiptap/extension-image` |
| `docx-export` | Chỉ dùng khi export | `docx`, `mammoth` |
| `tanstack` | Large query lib | `@tanstack/react-query` |
| `dnd` | Chỉ dùng ở vài UI | `@dnd-kit/*` |
| `markdown` | | `marked`, `react-markdown`, `remark-gfm` |

**Lazy load thêm:**

| Component | Lý do |
|---|---|
| `Analytics` | 1.172 LOC, recharts heavy, chỉ vào khi click menu |
| `DocumentManager` | 931 LOC, mammoth/pdf-parse heavy |
| `AIObservabilityDashboard` | Admin only |
| `WebsiteManager` | Marketing only |
| `HRMPage`, `RecruitmentPage`, `LeavePage` | HR only |
| `ReportViewerPage` | jspdf heavy |

**Code splitting cho settings tab nặng:**
```tsx
const PermissionsTab = lazy(() => import('./settings/PermissionsTab'));
```

**DoD:**
- [ ] Main chunk < 500KB gzip
- [ ] Total bundle < 2MB gzip
- [ ] Trang `/contracts` lần đầu load < 1.5MB gzip
- [ ] Lighthouse Performance route `/` ≥ 80

---

### Task 4.3 — Virtualize danh sách dài

**Cài:**
```bash
npm install @tanstack/react-virtual
```

**Áp dụng cho:**

| Component | Dòng tối đa hiện tại | Note |
|---|---|---|
| `ContractList` | Có thể vài nghìn | Bắt buộc |
| `CustomerList` | Vài trăm-nghìn | Bắt buộc |
| `PaymentList` | Vài trăm | Bắt buộc |
| `TasksPage` (table view) | Có thể nhiều | Bắt buộc |
| `PersonnelList` | Vài trăm | Nên |
| `ProductList` | Vài trăm | Nên |

**Pattern:**
```tsx
import { useVirtualizer } from '@tanstack/react-virtual';

function ContractTable({ rows }: { rows: Contract[] }) {
  const parentRef = useRef<HTMLDivElement>(null);
  const virtualizer = useVirtualizer({
    count: rows.length,
    getScrollElement: () => parentRef.current,
    estimateSize: () => 56,
    overscan: 10,
  });

  return (
    <div ref={parentRef} className="h-[600px] overflow-auto">
      <div style={{ height: virtualizer.getTotalSize(), position: 'relative' }}>
        {virtualizer.getVirtualItems().map(virtualRow => (
          <div
            key={virtualRow.key}
            style={{
              position: 'absolute',
              top: virtualRow.start,
              height: virtualRow.size,
              width: '100%',
            }}
          >
            <ContractRow contract={rows[virtualRow.index]} />
          </div>
        ))}
      </div>
    </div>
  );
}
```

**Cần đảm bảo:**
- Sticky header vẫn hoạt động.
- Selection state lưu theo id, không theo index.
- Scroll position khôi phục khi navigate quay lại.

**DoD:**
- [ ] 6 component dùng virtualizer
- [ ] Test render 1.000 dòng < 100ms
- [ ] Sticky header hoạt động
- [ ] Selection bulk hoạt động

---

### Task 4.4 — Audit React Query

**Phương án:**

1. Tạo `lib/queryDefaults.ts`:
```ts
export const QUERY_TIMES = {
  // Master data ít thay đổi → cache lâu
  units:     { staleTime: 10 * 60_000, gcTime: 30 * 60_000 },
  employees: { staleTime: 5 * 60_000,  gcTime: 30 * 60_000 },
  products:  { staleTime: 5 * 60_000,  gcTime: 30 * 60_000 },
  customers: { staleTime: 2 * 60_000,  gcTime: 10 * 60_000 },

  // Transactional data
  contracts: { staleTime: 30_000, gcTime: 5 * 60_000 },
  tasks:     { staleTime: 30_000, gcTime: 5 * 60_000 },
  payments:  { staleTime: 30_000, gcTime: 5 * 60_000 },

  // Realtime data
  notifications: { staleTime: 0, gcTime: 60_000 },
  chat:          { staleTime: 0, gcTime: 60_000 },
};
```

2. Áp dụng vào hook:
```ts
export function useUnits() {
  return useQuery({
    queryKey: ['units'],
    queryFn: UnitService.list,
    ...QUERY_TIMES.units,
  });
}
```

3. Áp dụng `placeholderData: keepPreviousData` cho list page có pagination/filter:
```ts
useQuery({
  queryKey: ['contracts', filters, page],
  queryFn: () => ContractService.list(filters, page),
  placeholderData: keepPreviousData,
});
```

4. Thiết lập default trong `lib/queryClient.ts`:
```ts
export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: 1,
      refetchOnWindowFocus: false,
      staleTime: 30_000,
    },
  },
});
```

**DoD:**
- [ ] `lib/queryDefaults.ts` tồn tại
- [ ] Mọi hook query áp dụng staleTime phù hợp
- [ ] Pagination không refetch toàn bộ (verify Network tab)
- [ ] Master data cache hoạt động (verify thời gian load lần 2 < 50ms)

---

### Task 4.5 — Realtime subscription cleanup

**Audit:**
- `useChatRealtime`
- `useChatPresence`
- `useRealtimeSync`
- Bất kỳ `supabase.channel(...)` trong component

**Pattern đúng:**
```ts
useEffect(() => {
  const channel = supabase
    .channel('contracts-changes')
    .on('postgres_changes', { event: '*', schema: 'public', table: 'contracts' }, handler)
    .subscribe();

  return () => {
    supabase.removeChannel(channel);
  };
}, [/* dependencies */]);
```

**Anti-pattern cần tìm và sửa:**
- `subscribe()` không có cleanup.
- Dependencies thay đổi liên tục → channel re-create vô hạn.
- Channel name động → tạo mới mỗi render.

**Verify:**
1. Mở DevTools Network → WS tab.
2. Navigate giữa các trang 10 lần.
3. Số WS connection phải ổn định (không tăng dần).
4. Supabase dashboard: số realtime connection trên project ổn định.

**DoD:**
- [ ] Mọi `supabase.channel` có cleanup tương ứng
- [ ] Test navigate 50 lần không tăng channel count
- [ ] AbortController cho fetch trong useEffect

---

### Task 4.6 — Lighthouse CI

**Setup:**

```bash
npm install -D @lhci/cli
```

**`.lighthouserc.json`:**
```json
{
  "ci": {
    "collect": {
      "url": [
        "http://localhost:3000/",
        "http://localhost:3000/contracts",
        "http://localhost:3000/dashboard"
      ],
      "numberOfRuns": 3,
      "startServerCommand": "npm run preview",
      "startServerReadyPattern": "Local:",
      "startServerReadyTimeout": 30000
    },
    "assert": {
      "assertions": {
        "categories:performance": ["error", { "minScore": 0.8 }],
        "categories:accessibility": ["error", { "minScore": 0.9 }],
        "categories:best-practices": ["warn", { "minScore": 0.9 }],
        "categories:seo": ["warn", { "minScore": 0.8 }]
      }
    },
    "upload": { "target": "temporary-public-storage" }
  }
}
```

**`.github/workflows/lighthouse.yml`:**
```yaml
name: Lighthouse CI
on: [pull_request]
jobs:
  lhci:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with: { node-version: 20, cache: 'npm' }
      - run: npm ci
      - run: npm run build
        env:
          VITE_SUPABASE_URL: ${{ secrets.VITE_SUPABASE_URL }}
          VITE_SUPABASE_ANON_KEY: ${{ secrets.VITE_SUPABASE_ANON_KEY }}
      - run: npx lhci autorun
```

**Lưu ý:**
- Lighthouse cần đăng nhập để xem `/contracts`, `/dashboard`. Có thể setup test user + cookie/localStorage prefill.
- Hoặc tạo route variant không yêu cầu auth (chỉ cho LHCI).

**DoD:**
- [ ] LHCI chạy ở mọi PR
- [ ] 3 route đạt Performance ≥ 80, A11y ≥ 90
- [ ] README có badge LHCI

---

### Task 4.7 — Dark mode audit

**Phương án:**

Tạo script `scripts/audit-dark-mode.sh`:
```bash
#!/bin/bash
echo "=== Audit Dark Mode (theo RULES.md mục 4) ==="
echo ""

echo "1. text-{color}-600/700 thiếu dark variant:"
grep -rn "text-\(slate\|gray\|zinc\|red\|orange\|amber\|yellow\|lime\|green\|emerald\|teal\|cyan\|sky\|blue\|indigo\|violet\|purple\|fuchsia\|pink\|rose\)-\(600\|700\)" \
  --include="*.tsx" --include="*.ts" components/ \
  | grep -v "dark:text-" \
  | head -20

echo ""
echo "2. bg-white thiếu dark:bg-slate-900:"
grep -rn "bg-white" --include="*.tsx" components/ \
  | grep -v "dark:bg-" \
  | head -20

echo ""
echo "3. dark:bg-slate-*/{50,30} (opacity thấp lộ nền):"
grep -rn "dark:bg-slate-[0-9]\+/" --include="*.tsx" components/ \
  | grep -E "/(30|50)" \
  | head -20

echo ""
echo "4. border-slate-200 thiếu dark variant:"
grep -rn "border-slate-200" --include="*.tsx" components/ \
  | grep -v "dark:border-" \
  | head -20
```

Chạy:
```bash
chmod +x scripts/audit-dark-mode.sh
./scripts/audit-dark-mode.sh > docs/perf/dark-mode-violations.txt
```

Fix mọi vi phạm theo bảng trong `RULES.md` mục 4.

**DoD:**
- [ ] Script audit tồn tại
- [ ] Chạy script → 0 violation
- [ ] Test thủ công: toggle dark mode trên 10 trang chính, không thấy nền sáng lộ ra

---

### Task 4.8 — Image optimization

**Audit:**
```bash
ls -lah public/ | sort -k5 -h
```

**Phương án:**

1. SVG hóa logo, icon (đã có Lucide cho icon, kiểm tra logo CIC).
2. Nén PNG/JPG bằng `sharp`:
```ts
// scripts/optimize-images.ts
import sharp from 'sharp';
import fs from 'fs';
import path from 'path';

const PUBLIC_DIR = 'public';
const files = fs.readdirSync(PUBLIC_DIR).filter(f => /\.(png|jpg|jpeg)$/i.test(f));

for (const file of files) {
  const input = path.join(PUBLIC_DIR, file);
  const output = path.join(PUBLIC_DIR, file.replace(/\.\w+$/, '.webp'));

  await sharp(input)
    .resize({ width: 1200, withoutEnlargement: true })
    .webp({ quality: 85 })
    .toFile(output);

  console.log(`${file} → ${path.basename(output)}`);
}
```

3. Đặt `<img loading="lazy" decoding="async">` cho mọi ảnh không above-fold.

4. Sử dụng `picture` element cho hero image:
```tsx
<picture>
  <source srcSet="/banner.webp" type="image/webp" />
  <img src="/banner.png" alt="..." loading="lazy" />
</picture>
```

**DoD:**
- [ ] Tổng size `public/` giảm ≥ 30%
- [ ] Mọi ảnh non-hero có `loading="lazy"`
- [ ] Banner/logo có WebP fallback

---

## Tiêu chí done của Phase 4 (Exit Criteria)

- ✅ Bundle main chunk < 500KB gzip
- ✅ Total bundle < 2MB gzip
- ✅ Lighthouse Perf ≥ 80, A11y ≥ 90 ở 3 route
- ✅ Render 1.000 dòng < 100ms (test thủ công + Profiler)
- ✅ Script audit dark mode pass 100%
- ✅ Realtime: navigate 50 lần không leak channel
- ✅ React Query cache hoạt động (master data load lần 2 < 50ms)
- ✅ Image size giảm ≥ 30%
- ✅ Báo cáo `reports/phase-4-completion.md` so sánh trước/sau

---

## Rủi ro & Mitigation

| Rủi ro | Mitigation |
|---|---|
| Virtualize làm vỡ sticky header | Test kỹ với 5 dataset khác nhau, có fallback non-virtual |
| LHCI flaky do auth | Dùng test user dedicated, prefill session |
| Cache React Query quá lâu gây stale UI | Cấu hình `refetchOnReconnect: true`, có nút refresh thủ công |
| WebP không support Safari cũ | Có fallback PNG/JPG |
| Lazy load chậm hơn cho user low-bandwidth | Preload prefetch route khi hover menu |

---

## Tham chiếu

- [vite.config.ts](../../vite.config.ts) — manualChunks
- [lib/queryClient.ts](../../lib/queryClient.ts)
- [RULES.md](../../RULES.md) — dark mode rules
- [hooks/useChatRealtime.ts](../../hooks/useChatRealtime.ts)
- [hooks/useRealtimeSync.ts](../../hooks/useRealtimeSync.ts)
