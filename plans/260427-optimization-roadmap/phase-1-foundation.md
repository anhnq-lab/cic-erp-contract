# Phase 1 — Dọn Dẹp & Foundation

- **Ưu tiên:** 🟠 P1
- **Thời lượng:** 3-5 ngày
- **Owner:** 1 FE + 1 BE
- **Phụ thuộc:** Phase 0 đã merge
- **Trạng thái:** ⬜ Pending

---

## Mục tiêu

Đặt nền tảng cho mọi phase sau:
- **Repo sạch** — chỉ còn file thuộc về dự án.
- **Type chặt** — generated types từ Supabase, giảm 30%+ `any`.
- **CI tự động** — mọi PR chạy lint + typecheck + test + build.
- **Tài liệu đồng bộ** — convention rõ ràng cho dev mới.
- **Migrations gọn** — reset DB local < 1 phút.

---

## Danh sách công việc

### Task 1.1 — Dọn rác root

**Hiện trạng:** Root có ~30 file rác (script tạm, test cũ, output dump) lẫn với config thật.

**Phân loại file ở root:**

| Loại | File |
|---|---|
| ✅ Giữ nguyên | `package.json`, `package-lock.json`, `tsconfig.json`, `vite.config.ts`, `vitest.config.ts`, `vercel.json`, `index.html`, `index.tsx`, `constants.tsx`, `types.ts`, `metadata.json`, `vite-env.d.ts`, `README.md`, `RULES.md`, `.gitignore`, `.cursorrules` |
| 📦 Move sang `scripts/` | `extract.cjs`, `extract.js`, `_read_docx.js`, `cleanTasks.cjs`, `patch_tools.js`, `setup-env.ts`, `extract_fs_news.py`, `extract_schema.py`, `generate_sql.py`, `map_data.py`, `parse_fs_news.py`, `parse_mysql.py`, `parse_sql.py`, `peek_sql.py`, `scan_tables.py`, `upload_posts.py` |
| 🗑️ Xóa hẳn | `_temp_playbook.txt`, `tmp_test_ai.ts`, `test-update.ts`, `test_query.ts`, `test_e2e_sprint4.ts`, `check_ai_logs.ts`, `coverage_report.txt`, `test_output.txt`, `fs_news_sample.txt`, `fs_news_schema.sql` |
| 📚 Move sang `docs/` | `Trolygiamdoc_tools.md`, `openclaw_tools_guide.md`, `GEMINI.md`, `PHANQUYENHETHONG.md` |

**Cập nhật `.gitignore`:**
```
# Build output
dist/
coverage/

# Logs & dumps
*.log
*_output.txt
coverage_report.txt
_temp_*
tmp_*

# Local env
.env.local
.env.*.local

# IDE
.vscode/
.idea/
```

**Definition of Done:**
- [ ] Root chỉ còn ~16 file thiết yếu (đếm bằng `ls -p | grep -v /`)
- [ ] `git status` clean sau khi move
- [ ] `npm run dev`, `npm run build`, `npm test` vẫn pass

---

### Task 1.2 — Generate Supabase types

**Phương án:**

1. Cài Supabase CLI nếu chưa có:
```bash
npm install -g supabase
supabase login
```

2. Generate types:
```bash
npx supabase gen types typescript \
  --project-id jyohocjsnsyfgfsmjfqx \
  --schema public > types/supabase.ts
```

3. Thêm script vào `package.json`:
```json
{
  "scripts": {
    "gen:types": "supabase gen types typescript --project-id $SUPABASE_PROJECT_ID --schema public > types/supabase.ts"
  }
}
```

4. Tạo helper `lib/supabaseTypes.ts`:
```ts
import type { Database } from '../types/supabase';

export type Tables<T extends keyof Database['public']['Tables']> =
  Database['public']['Tables'][T]['Row'];

export type InsertDto<T extends keyof Database['public']['Tables']> =
  Database['public']['Tables'][T]['Insert'];

export type UpdateDto<T extends keyof Database['public']['Tables']> =
  Database['public']['Tables'][T]['Update'];

// Usage:
// type Contract = Tables<'contracts'>;
// type ContractInsert = InsertDto<'contracts'>;
```

5. Document trong `CONTRIBUTING.md`: chạy `npm run gen:types` mỗi khi schema thay đổi.

**Definition of Done:**
- [ ] `types/supabase.ts` tồn tại, được commit
- [ ] File chứa ≥ 50 table types
- [ ] `lib/supabaseTypes.ts` helper tồn tại
- [ ] `npm run gen:types` chạy được
- [ ] CONTRIBUTING.md có section hướng dẫn

---

### Task 1.3 — Áp dụng types vào services cốt lõi

**Phương án:** Refactor 5 service quan trọng nhất, thay `any` bằng generated types.

**Danh sách:**

| Service | LOC | `any` hiện tại (ước) | Mục tiêu sau refactor |
|---|---|---|---|
| `services/contractService.ts` | 1.690 | ~80 | < 20 |
| `services/taskService.ts` | 1.416 | ~60 | < 15 |
| `services/paymentService.ts` | ? | ~40 | < 10 |
| `services/customerService.ts` | ? | ~30 | < 10 |
| `services/employeeService.ts` | ? | ~30 | < 10 |

**Pattern thay thế:**

Trước:
```ts
function mapContract(row: any): Contract {
  return { ... };
}

async function getById(id: string): Promise<any> {
  const { data } = await supabase.from('contracts').select('*').eq('id', id).single();
  return data;
}
```

Sau:
```ts
import type { Tables } from '../lib/supabaseTypes';

type ContractRow = Tables<'contracts'>;

function mapContract(row: ContractRow): Contract {
  return { ... };
}

async function getById(id: string): Promise<Contract | null> {
  const { data } = await supabase.from('contracts').select('*').eq('id', id).single();
  return data ? mapContract(data) : null;
}
```

**Definition of Done:**
- [ ] `grep -c ": any" services/contractService.ts services/taskService.ts services/paymentService.ts services/customerService.ts services/employeeService.ts` < 65 (giảm > 60%)
- [ ] `npx tsc --noEmit` không lỗi mới
- [ ] Test hiện tại của 5 service này pass

---

### Task 1.4 — Bật TS check cho `tests/`

**Hiện trạng `tsconfig.json`:**
```json
"exclude": [
  "node_modules", "dist",
  "supabase", "workers", "plugins", "scripts",
  "services/ai/openclaw",
  "tests", "tests/**",          // ❌ tắt TS check cho test
  "test_query.ts"               // ❌ file rác
]
```

**Phương án:**

1. Sửa `tsconfig.json`:
```json
"exclude": [
  "node_modules", "dist",
  "supabase/functions",
  "workers",
  "scripts/auto-train",
  "scripts/ai/litellm",
  "scripts/ai/vllm"
]
```

2. Tạo `tsconfig.scripts.json` (lỏng hơn cho scripts CLI):
```json
{
  "extends": "./tsconfig.json",
  "compilerOptions": {
    "noEmit": true,
    "strict": false,
    "skipLibCheck": true,
    "types": ["node"]
  },
  "include": ["scripts/**/*.ts", "scripts/**/*.cjs"]
}
```

3. Tạo `tsconfig.workers.json` cho Cloudflare Workers:
```json
{
  "extends": "./tsconfig.json",
  "compilerOptions": {
    "types": ["@cloudflare/workers-types"],
    "lib": ["ES2022"]
  },
  "include": ["workers/**/*.ts"]
}
```

4. Chạy `npx tsc --noEmit` → fix lỗi mới phát hiện.

**Definition of Done:**
- [ ] `tsconfig.json` không exclude `tests/`
- [ ] `npx tsc --noEmit` pass cả `tests/`
- [ ] `npx tsc --noEmit -p tsconfig.scripts.json` pass
- [ ] `npx tsc --noEmit -p tsconfig.workers.json` pass

---

### Task 1.5 — Strip console.log production

**Phương án:**

1. Cài plugin:
```bash
npm install -D vite-plugin-remove-console
```

2. Sửa `vite.config.ts`:
```ts
import removeConsole from 'vite-plugin-remove-console';

export default defineConfig(({ mode }) => ({
  plugins: [
    sourceFileGuard(),
    react(),
    geminiExtractProxy(env),
    mode === 'production' && removeConsole({
      includes: ['log', 'debug', 'info'],  // Giữ warn, error
    }),
  ].filter(Boolean),
  // ...
}));
```

3. Tạo logger có level trong `lib/logger.ts`:
```ts
const isDev = import.meta.env.DEV;

export const logger = {
  debug: (...args: unknown[]) => isDev && console.debug('[DEBUG]', ...args),
  info: (...args: unknown[]) => isDev && console.info('[INFO]', ...args),
  warn: (...args: unknown[]) => console.warn('[WARN]', ...args),
  error: (...args: unknown[]) => console.error('[ERROR]', ...args),
};
```

4. Document: dev nên dùng `logger.debug` thay vì `console.log` cho debug code.

**Definition of Done:**
- [ ] `npm run build`
- [ ] `grep -c "console\.log" dist/assets/*.js` = 0
- [ ] `console.warn` và `console.error` còn hiện diện
- [ ] `lib/logger.ts` tồn tại, được tài liệu hóa

---

### Task 1.6 — Tài liệu hóa convention

**Tạo `CLAUDE.md`** (cho AI agents như Claude Code):
```markdown
# CIC ERP Contract — Project Guide

## Stack
- React 19 + Vite + TypeScript
- Supabase (Postgres + Auth + Realtime + Storage + Edge Functions)
- TanStack Query, Tailwind, TipTap, Lucide

## Conventions
- Tiếng Việt cho mọi giao tiếp với người dùng
- Components: PascalCase, 1 component / file
- Services: camelCase, suffix `Service` cho class hoặc bare function
- Hooks: prefix `use`, return object có tên rõ ràng
- Tests: cùng folder structure với source, suffix `.test.ts(x)`

## Cách thêm route mới
1. Tạo component ở `components/` hoặc lazy ở `LazyPages.tsx`
2. Thêm route vào `routes/AppRoutes.tsx`
3. Thêm permission entry vào `routes/routePermissions.ts`
4. Test: chưa khai báo permission → user bị 403

## Cách thêm migration
1. `supabase migration new <descriptive_name>`
2. Viết SQL trong file mới tạo
3. Test local: `supabase db reset`
4. Apply staging: `supabase db push --db-url $STAGING_URL`
5. Sau test, apply production

## Cách thêm service
1. Tạo file ở `services/<name>Service.ts`
2. Import `dataClient` từ `lib/dataClient`
3. Dùng generated types từ `types/supabase.ts`
4. Export bare functions hoặc namespace object
5. Viết test ở `tests/services/<name>Service.test.ts`

## Dark mode
Xem RULES.md mục 4. Mọi component PHẢI có dark variant.

## Bảo mật
- KHÔNG hardcode secret trong client code
- Service role chỉ dùng trong api/, supabase/functions/, scripts/, workers/
- Mọi route nhạy cảm phải có RLS + entry trong routePermissions.ts
```

**Tạo `CONTRIBUTING.md`** (cho dev người):
```markdown
# Contributing

## Setup
1. Node 20+
2. `npm install`
3. `cp .env.example .env.local` và điền giá trị
4. `npm run dev`

## Workflow Git (theo RULES.md)
pull → code → commit → pull → push

## Trước khi commit
- `npm run typecheck`
- `npm test`
- Xem dark mode trên UI mới (RULES.md mục 4)

## Tạo PR
- Title: `<type>: <mô tả>` (feat, fix, refactor, docs, chore)
- Mô tả: vấn đề + giải pháp + cách test
- Tag reviewer ít nhất 1 người

## Commands
- `npm run gen:types` — sinh lại Supabase types khi schema đổi
- `npm run typecheck` — TS check toàn bộ
- `npm test` — chạy test 1 lần
- `npm run test:watch` — watch mode
- `npm run test:coverage` — coverage report
```

**Definition of Done:**
- [ ] `CLAUDE.md` tồn tại ở root
- [ ] `CONTRIBUTING.md` tồn tại ở root
- [ ] README link tới 2 file này
- [ ] `package.json` có script `typecheck`

---

### Task 1.7 — Đóng plan cũ

**Phương án:**

1. Mở `plans/260126-backend-migration/plan.md`.
2. Sửa header:
```markdown
# Plan: Backend Migration to Supabase
Created: 2026-01-26
Closed: 2026-04-27
Status: ✅ Done — Migration đã hoàn thành 100% trên thực tế

## Superseded by
plans/260427-optimization-roadmap/plan.md
```
3. Cập nhật progress 100% cho mọi phase.

**Definition of Done:**
- [ ] File plan cũ có status Done
- [ ] Cross-reference đến plan mới

---

### Task 1.8 — Squash migrations (chỉ dev/staging)

**⚠️ Lưu ý:** Phase 1 chỉ áp dụng cho dev + staging. Production giữ nguyên 120 migrations cho đến khi staging chạy 1 tháng ổn định.

**Phương án:**

1. Backup DB hiện tại:
```bash
supabase db dump --db-url $STAGING_URL > backups/staging-pre-squash-2026-04-27.sql
```

2. Tạo baseline migration:
```bash
mkdir -p supabase/migrations/_archive
mv supabase/migrations/2026*.sql supabase/migrations/_archive/
mv supabase/migrations/0[1-3]_*.sql supabase/migrations/_archive/

# Generate baseline từ staging schema
supabase db dump --db-url $STAGING_URL --schema-only \
  > supabase/migrations/00000000000000_baseline.sql
```

3. Tạo seed file cho local:
```bash
supabase db dump --db-url $STAGING_URL --data-only \
  --table=units --table=role_permission_defaults \
  > supabase/seed.sql
```

4. Test reset:
```bash
supabase db reset
# Phải xong < 60 giây
```

5. Document trong `CONTRIBUTING.md`: cách reset DB local.

**Definition of Done:**
- [ ] `supabase/migrations/00000000000000_baseline.sql` tồn tại
- [ ] `supabase/migrations/_archive/` chứa 120 migration cũ
- [ ] `supabase/seed.sql` có data master
- [ ] `supabase db reset` chạy < 60 giây trên máy mới
- [ ] Production migrations CHƯA bị squash (giữ nguyên)

---

### Task 1.9 — CI baseline

**Tạo `.github/workflows/ci.yml`:**
```yaml
name: CI
on:
  pull_request:
  push:
    branches: [main]

jobs:
  quality:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4

      - uses: actions/setup-node@v4
        with:
          node-version: 20
          cache: 'npm'

      - name: Install
        run: npm ci

      - name: Typecheck
        run: npm run typecheck

      - name: Test
        run: npm test

      - name: Build
        run: npm run build
        env:
          VITE_SUPABASE_URL: ${{ secrets.VITE_SUPABASE_URL }}
          VITE_SUPABASE_ANON_KEY: ${{ secrets.VITE_SUPABASE_ANON_KEY }}

      - name: Upload coverage
        if: always()
        uses: actions/upload-artifact@v4
        with:
          name: coverage
          path: coverage/
```

**Cập nhật `package.json` scripts:**
```json
{
  "scripts": {
    "typecheck": "tsc --noEmit",
    "lint": "eslint . --ext ts,tsx",
    "test": "vitest run",
    "test:coverage": "vitest run --coverage"
  }
}
```

**Definition of Done:**
- [ ] `.github/workflows/ci.yml` tồn tại
- [ ] PR test có badge xanh khi mọi step pass
- [ ] PR fail nếu typecheck/test/build fail
- [ ] README có badge CI

---

## Tiêu chí done của Phase 1 (Exit Criteria)

- ✅ Root chỉ còn ~16 file thiết yếu
- ✅ `types/supabase.ts` được sinh và áp dụng cho 5 service core
- ✅ Tổng số `any` giảm tối thiểu **30%** (813 → < 570)
- ✅ Build production: `dist/` không còn `console.log`
- ✅ Mọi PR chạy CI tự động (typecheck + test + build)
- ✅ `supabase db reset` (dev) chạy < 60 giây
- ✅ `CLAUDE.md` + `CONTRIBUTING.md` được Tech Lead approve
- ✅ Plan cũ đóng, plan mới active

---

## Tham chiếu

- [tsconfig.json](../../tsconfig.json)
- [vite.config.ts](../../vite.config.ts)
- [vitest.config.ts](../../vitest.config.ts)
- [supabase/migrations/](../../supabase/migrations/)
- [RULES.md](../../RULES.md)
