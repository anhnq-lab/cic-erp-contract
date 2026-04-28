# CLAUDE.md — CIC ERP Contract

Hướng dẫn cho **Claude Code** (và mọi AI agent) khi làm việc với repo này.
Đọc file này **trước khi** chỉnh sửa bất kỳ file nào.

---

## 1. Kiến trúc tổng quan

```
cic-erp-contract/
├── api/                    # Vercel Serverless Functions (Node.js)
│   └── gemini-extract.ts   # Proxy Gemini API — key ở server, không lộ client
├── components/             # React components (feature-based, không flat)
│   ├── tasks/
│   ├── contracts/
│   └── ui/                 # Shared UI primitives
├── hooks/                  # Custom React hooks
├── lib/                    # Thư viện nội bộ (dataClient, permissions, utils)
├── services/               # Lớp truy cập dữ liệu (Supabase calls)
├── scripts/                # Utility scripts (KHÔNG import vào app)
├── supabase/
│   └── migrations/         # SQL migrations — đặt tên YYYYMMDD_<slug>.sql
├── tests/                  # Vitest tests (mirror cấu trúc src)
│   ├── components/
│   ├── hooks/
│   └── utils/
└── plans/                  # Roadmap / ADR — không ảnh hưởng runtime
```

**Stack:**
- Frontend: React 19, Vite 6, TypeScript 5.8, TailwindCSS
- State/Data: TanStack Query v5, Supabase Realtime
- Backend: Supabase (PostgreSQL + Auth + Storage + Edge Functions)
- AI: Multi-provider gateway (`services/ai/gateway.ts`) — Gemini, OpenAI, DeepSeek, vLLM
- Deploy: Vercel (frontend + serverless functions)

---

## 2. Quy tắc bắt buộc (MUST)

### 2.1 Bảo mật — KHÔNG BAO GIỜ vi phạm

| ❌ Không được | ✅ Thay bằng |
|---|---|
| `VITE_SUPABASE_SERVICE_ROLE_KEY` trong client | Chỉ dùng `VITE_SUPABASE_ANON_KEY` |
| API key AI hardcode trong `.ts` / `.tsx` | Đặt vào `.env.local`, dùng `import.meta.env` |
| `auth.uid() = user_id` khi `user_id` là TEXT | `auth.uid()::text = user_id` |
| RLS tắt trên bảng chứa dữ liệu user | Luôn bật RLS + có policy authenticated |
| Commit `.env.local`, `.env` thật | Chỉ commit `.env.example` |

### 2.2 TypeScript

- **Không dùng `any`** nếu có type cụ thể — dùng `unknown` + type guard.
- Types từ Supabase nằm ở `lib/database.types.ts` (generated). Dùng:
  ```ts
  import type { Database } from '@/lib/database.types';
  type Contract = Database['public']['Tables']['contracts']['Row'];
  ```
- Tránh `// @ts-ignore` — nếu bắt buộc, giải thích lý do trong comment.

### 2.3 Services (lớp data)

- **Không gọi Supabase trực tiếp từ component** — luôn qua `services/`.
- Mỗi service file xử lý **một bảng / một domain**.
- Trả về `{ data, error }` hoặc throw — nhất quán trong cùng một file.

### 2.4 Tests

- File test đặt tại `tests/<mirror-path>/<ComponentName>.test.tsx`.
- Mock Supabase bằng `vi.mock('@/lib/dataClient')` — không gọi DB thật.
- Mục tiêu coverage hiện tại: **35% lines** (Phase 3), **50%** sau Phase 5.
- Chạy test: `npm test` | Coverage: `npm run test:coverage`

### 2.5 Console logs

- **Không thêm `console.log`** trong code production (bị strip tự động bởi esbuild).
- Dùng `console.warn` / `console.error` cho cảnh báo quan trọng (giữ nguyên).
- Debug tạm: dùng `console.debug` — esbuild cũng drop trong production.

---

## 3. Quy trình thêm tính năng

```
1. Tạo migration SQL → supabase/migrations/YYYYMMDDHHMMSS_<slug>.sql
2. Thêm types vào lib/database.types.ts (hoặc chạy npm run gen:types)
3. Tạo/cập nhật service trong services/
4. Tạo hook trong hooks/ nếu cần TanStack Query
5. Tạo component trong components/<feature>/
6. Viết test trong tests/<mirror-path>/
7. Commit: conventional commits (feat/fix/chore/refactor/test/docs/security)
```

---

## 4. Migration SQL

- Tên file: `supabase/migrations/YYYYMMDDHHMMSS_<slug>.sql`
- Luôn kiểm tra type trước khi viết RLS:
  ```sql
  SELECT column_name, data_type
  FROM information_schema.columns
  WHERE table_name = '<table>' AND column_name IN ('user_id', 'created_by');
  ```
- Nếu cột là `TEXT` → dùng `auth.uid()::text`, không phải `auth.uid()` (UUID).
- Luôn bật RLS: `ALTER TABLE <table> ENABLE ROW LEVEL SECURITY;`

---

## 5. Commit convention

```
feat(scope): thêm tính năng X
fix(scope): sửa bug Y
security(scope): vá lỗ hổng Z
chore(scope): dọn dẹp / config
refactor(scope): tái cấu trúc không đổi behavior
test(scope): thêm/sửa tests
docs(scope): cập nhật tài liệu
```

Scope thường gặp: `auth`, `contracts`, `tasks`, `ai`, `rls`, `ci`, `build`.

---

## 6. Biến môi trường

| Biến | Nơi dùng | Bắt buộc production |
|---|---|---|
| `VITE_SUPABASE_URL` | Client | ✅ |
| `VITE_SUPABASE_ANON_KEY` | Client | ✅ |
| `GEMINI_API_KEY` | Server only (api/) | ✅ nếu dùng Gemini extract |
| `VITE_GOOGLE_API_KEY` | Client AI gateway | ⚠️ Hạn chế theo domain |
| `VITE_OPENAI_API_KEY` | Client AI gateway | ⚠️ Tránh expose |
| `VITE_VLLM_URL` | Client proxy | ❌ Internal only |

Xem `.env.example` để biết đầy đủ danh sách.

---

## 7. Lệnh hay dùng

```bash
npm run dev              # Start dev server (port 3000)
npm test                 # Chạy tests
npm run test:coverage    # Tests + coverage report
npm run build            # Production build (console.log bị strip)
npx tsc --noEmit         # Type check
npm run gen:types        # Generate Supabase TS types (cần SUPABASE_ACCESS_TOKEN)
```

---

## 8. Optimization roadmap

Xem `plans/260427-optimization-roadmap/` để biết toàn bộ kế hoạch tối ưu:
- `README.md` — index và OKR tổng quan
- `plan.md` — master plan 6 phases
- `phase-0-security.md` — **ĐÃ HOÀN THÀNH** (RLS, service-role, gitleaks)
- `phase-1-foundation.md` — Foundation (đang thực hiện)
- `phase-2-refactor.md` — Tái cấu trúc god files
- `phase-3-test.md` — Test coverage
- `phase-4-performance.md` — Bundle + query optimization
- `phase-5-ai-v2.md` — AI infrastructure v2

---

## 9. Những việc KHÔNG làm

- ❌ Xóa hoặc sửa file trong `plans/` khi không liên quan đến task hiện tại
- ❌ Chạy `git push --force` lên `main`
- ❌ Tắt RLS của bảng đã bật
- ❌ Thêm `continue-on-error: true` vào CI mà không có comment giải thích
- ❌ Import từ `scripts/` vào app code
- ❌ Dùng `service_role` key ở bất kỳ đâu trong client bundle
