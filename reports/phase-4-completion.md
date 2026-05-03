# Phase 4 — Performance & UX: Báo cáo hoàn thành

**Ngày hoàn thành:** 2026-05-03  
**Branch:** `claude/gallant-liskov-d31b51`

---

## 1. Bundle Stats (sau optimize)

| Chunk | Raw | Gzip |
|:------|----:|-----:|
| `index.js` (main) | 609 KB | 175 KB |
| `pdf.js` | 856 KB | 273 KB |
| `docx-export.js` | 488 KB | 130 KB |
| `xlsx.js` | 418 KB | 142 KB |
| `recharts.js` | 389 KB | 115 KB |
| `tiptap.js` | 369 KB | 119 KB |
| `ui-vendor.js` | 234 KB | 65 KB |
| `markdown.js` | 194 KB | 60 KB |
| `supabase.js` | 169 KB | 43 KB |
| `ai-vendor.js` | 133 KB | 34 KB |
| **Total JS** | **6.30 MB** | **~1.5 MB gzip** |

> ✅ Main chunk 175 KB gzip (target < 500 KB) — **PASS**  
> ✅ Total gzip ~1.5 MB (target < 2 MB) — **PASS**  
> ✅ Bundle stats HTML: `docs/perf/bundle-stats.html`

---

## 2. Tasks hoàn thành

### Task 4.1 — Bundle analyzer baseline ✅

- Cài `rollup-plugin-visualizer` v7
- Tích hợp vào `vite.config.ts` → `docs/perf/bundle-stats.html` (gzip + brotli sizes)
- Template: treemap (dễ thấy tỷ lệ từng chunk)

### Task 4.2 — Tối ưu chunks ✅

**Thêm manualChunks mới:**

| Chunk | Libs | Gzip |
|:------|:-----|-----:|
| `tanstack` | `@tanstack/react-query` | 12 KB |
| `dnd` | `@dnd-kit/core`, `@dnd-kit/utilities` | (in ui-vendor) |
| `tiptap` | `@tiptap/react`, `@tiptap/starter-kit`, `@tiptap/extension-image` | 119 KB |
| `docx-export` | `docx`, `mammoth` | 130 KB |
| `markdown` | `marked`, `react-markdown`, `remark-gfm` | 60 KB |
| `date` | `date-fns` | 7 KB |

**Kết quả:**
- Tách `tanstack` ra khỏi main chunk → main giảm ~12 KB gzip
- Tiptap (119 KB) và docx-export (130 KB) chỉ tải khi user mở form có rich text editor hoặc export DOCX
- Markdown chunk (60 KB) chỉ tải khi render nội dung markdown

**Lazy loading:** Đã có sẵn qua `LazyPages.tsx` — tất cả route pages đều lazy-loaded.

### Task 4.4 — Audit React Query ✅

**`lib/queryDefaults.ts`** — tiered staleTime/gcTime:

| Tier | staleTime | gcTime | Dùng cho |
|:-----|----------:|-------:|:---------|
| STATIC | Infinity | 30 min | units, permissions, roles |
| MASTER | 10 min | 30 min | employees, products, brands |
| STANDARD | 2 min | 10 min | customers, contracts, projects |
| LIVE | 30 s | 5 min | payments, tasks, documents |
| REALTIME | 0 | 1 min | notifications, chat, presence |

**`lib/queryClient.ts`** — default cập nhật:
- `staleTime`: 5 min → **30 s** (tighter default, per-domain overrides via QUERY_TIMES)
- `gcTime`: 30 min → **5 min** (giảm memory footprint)
- Thêm `refetchOnReconnect: true`
- Export `keepPreviousData` để list-page hooks dùng

**Hooks cập nhật:**
- `useEmployees`: áp dụng `QUERY_TIMES.employees` (10 min stale)
- `useUnits`: áp dụng `QUERY_TIMES.units` (Infinity stale)

### Task 4.5 — Realtime subscription cleanup ✅

**Vấn đề:** `hooks/useNotifications.ts` dùng `channel.unsubscribe()` thay vì `supabase.removeChannel(channel)`. `unsubscribe()` chỉ dừng subscription nhưng channel vẫn còn trong internal registry của Supabase client → memory leak khi navigate giữa các trang.

**Fix:** Thay `channel.unsubscribe()` → `supabase.removeChannel(channel)`.

**Đã kiểm tra:** `useChatPresence`, `useChatRealtime`, `useRealtimeSync` — tất cả đã dùng `removeChannel` đúng.

---

## 3. Tasks còn lại (cho Phase 4 tương lai)

| Task | Mức độ | Ghi chú |
|:-----|:------:|:--------|
| 4.3 Virtualize danh sách dài | P2 | Cần `@tanstack/react-virtual`, test kỹ |
| 4.6 Lighthouse CI | P3 | Cần auth setup cho test user |
| 4.7 Dark mode audit | P2 | Script đã có trong plan, cần run + fix |
| 4.8 Image optimization | P3 | Kiểm tra `public/` trước |

---

## 4. Tổng kết

| Chỉ số | Trước | Sau |
|:-------|:-----:|:---:|
| Bundle stats | Chưa có | `docs/perf/bundle-stats.html` |
| manualChunks | 7 | 13 |
| Query staleTime default | 5 min | 30 s |
| Realtime leak | useNotifications leak | Fixed |
| Tests pass | 542 | 542 |
