# Kế Hoạch Tối Ưu & Hoàn Thiện CIC ERP Contract

- **Mã kế hoạch:** `260427-optimization-roadmap`
- **Ngày tạo:** 2026-04-27
- **Trạng thái:** 🟢 Đang thực thi (khởi động 2026-04-28)
- **Người chủ trì:** Claude (AI Agent)
- **Thời lượng dự kiến:** ~7 tuần (thực thi tuần tự)
- **Phụ thuộc:** Đóng `plans/260126-backend-migration` (đã stale)

---

## 1. Bối cảnh

Sau ~15 tháng phát triển, dự án đạt quy mô lớn: ~115.800 LOC, 88 components, 62 services, 120 migrations, 5 Edge Functions, 4 Workers, AI multi-provider. Tuy nhiên rà soát ngày 27/04/2026 phát hiện:

- **3 lỗ hổng bảo mật P0** (master key & service-role có nguy cơ lộ ra client).
- **Nợ kỹ thuật cao**: 813 chỗ `any`, 250 `console.log`, 7 file > 1.000 LOC.
- **Test coverage chỉ ~18%**, các module nghiệp vụ cốt lõi (contract/task/payment) chỉ 2-5%.
- **Schema chưa có generated types**, 120 migrations chưa squash.
- **Tài liệu kế hoạch lệch pha** với thực tế triển khai.

Kế hoạch này chia 6 phase (P0 → P5), mỗi phase có **mục tiêu đo được** và **tiêu chí done** rõ ràng để đảm bảo kết quả thực sự cải thiện chất lượng dự án — không chỉ "làm cho có".

---

## 2. Mục tiêu tổng thể (OKR)

### Objective: Đưa CIC ERP đạt chuẩn production-grade về bảo mật, chất lượng, hiệu năng và bảo trì

| KR | Hiện trạng | Mục tiêu | Đo bằng |
|---|---|---|---|
| KR1 | 3 lỗ hổng P0 | **0 lỗ hổng P0** | Manual audit + `gitleaks` CI |
| KR2 | 813 `any` | **< 200 `any`** | `grep -c ": any"` |
| KR3 | Coverage 18% | **≥ 50% statement (services), ≥ 35% (components)** | `vitest run --coverage` |
| KR4 | 7 file > 1.000 LOC | **0 file > 600 LOC** | `wc -l` |
| KR5 | 250 `console.log` | **0 trong production bundle** | Build + `grep` dist |
| KR6 | Bundle main chunk chưa đo | **< 500KB gzip** | `rollup-plugin-visualizer` |
| KR7 | Lighthouse Perf chưa đo | **≥ 80** ở 3 route chính | Lighthouse CI |
| KR8 | Không CI gate | **CI bắt buộc: lint + typecheck + test + build pass** | GitHub Actions |

---

## 3. Tổng quan các Phase

| Phase | Tên | Ưu tiên | Thời lượng | Mục tiêu chính |
|---|---|---|---|---|
| 0 | Vá bảo mật khẩn cấp | 🔴 P0 | 1-2 ngày | Loại bỏ rủi ro lộ key, RLS bypass |
| 1 | Dọn dẹp & Foundation | 🟠 P1 | 3-5 ngày | Sạch repo, generated types, CI baseline |
| 2 | Refactor file "thần" | 🟠 P1 | 5-7 ngày | Mọi file < 600 LOC, dễ test |
| 3 | Test & Quality Gate | 🟡 P2 | 5-7 ngày | Coverage ≥ 50%, CI gate |
| 4 | Performance & UX | 🟡 P2 | 3-5 ngày | Bundle, virtualize list, dark mode |
| 5 | AI Platform v2 & Observability | 🟢 P3 | 5-7 ngày | Rate-limit, schema validate, dashboard |

Tham chiếu chi tiết: `phase-0-security.md` → `phase-5-ai-v2.md`.

---

## 4. PHASE 0 — Vá bảo mật khẩn cấp (P0)

### 4.1 Tại sao P0

3 vấn đề có thể gây thiệt hại trực tiếp về tài chính / dữ liệu nếu khai thác:

1. **`sk-cic-2026` hardcoded** trong client → ai cũng dùng key gọi LiteLLM/vLLM.
2. **`VITE_DEV_BYPASS_AUTH` + service_role key** có thể vào client bundle → bypass RLS toàn DB.
3. **Anon URL/key hardcode** trong source → lộ project URL, gắn liền vĩnh viễn trong git history.

### 4.2 Công việc

| # | Task | File / Vị trí | Owner | Definition of Done |
|---|---|---|---|---|
| 0.1 | Bỏ hoàn toàn `Bearer sk-cic-2026` ở client. Mọi call LiteLLM/vLLM phải đi qua `supabase.functions.invoke('ai-proxy')` hoặc API route Vercel có verify session. | [services/ai/gateway.ts:30](../../services/ai/gateway.ts), [services/ai/gateway.ts:719](../../services/ai/gateway.ts), [components/AIAssistant.tsx:635](../../components/AIAssistant.tsx), [components/AIAssistant.tsx:649](../../components/AIAssistant.tsx) | BE | `grep -r "sk-cic-2026" .` chỉ còn trong workers (server-side OK) |
| 0.2 | Xóa nhánh `VITE_SUPABASE_SERVICE_ROLE_KEY` khỏi `dataClient`. Service role chỉ được phép xuất hiện ở `api/*.ts` (Vercel functions, server-side) hoặc Edge Functions. | [lib/dataClient.ts:37-39](../../lib/dataClient.ts) | BE | `grep -rn "SERVICE_ROLE" --include="*.ts*"` không có kết quả ở `lib/`, `components/`, `services/`, `hooks/`, `contexts/` |
| 0.3 | Đưa `DEFAULT_SUPABASE_URL`/`DEFAULT_SUPABASE_ANON_KEY` ra `.env.example` + fail-fast nếu thiếu env trong production build. Giữ default chỉ cho `npm run dev` (in cảnh báo console). | [lib/supabaseDefaults.ts](../../lib/supabaseDefaults.ts), [lib/supabase.ts](../../lib/supabase.ts), [lib/dataClient.ts](../../lib/dataClient.ts) | FE | Build production fail nếu không set env. Dev vẫn chạy được. |
| 0.4 | Audit RLS production. So sánh `select * from pg_policies` với migrations, đặc biệt tác động của `20260130000600_disable_rbac_dev.sql`. Viết migration `re_enable_rls_production.sql` nếu cần. | Supabase production | BE | Mọi bảng nhạy cảm (`contracts`, `payments`, `customers`, `employees`, `tasks`, `ai_logs`) có RLS enabled + ít nhất 1 policy. |
| 0.5 | Thêm GitHub Action `gitleaks` chạy ở mỗi PR. Cấu hình allowlist cho test fixtures. | `.github/workflows/security.yml` | DevOps | PR có chứa secret bị block tự động. |
| 0.6 | Rotate tất cả key đã từng commit: anon key Supabase, LiteLLM master, Gemini, OpenAI, DeepSeek nếu có dấu vết trong git history. | Supabase + provider dashboards | Tech Lead | Key cũ revoke, key mới chỉ ở env Vercel/Supabase secrets. |

### 4.3 Tiêu chí done của Phase 0

- ✅ Chạy `gitleaks detect` không phát hiện secret.
- ✅ Build production thành công với env mới (không default cứng).
- ✅ Pen-test thủ công: mở `view-source` ở production không tìm thấy `sk-cic-2026` hoặc service_role.
- ✅ User NVKD đăng nhập production không xem được contract khác đơn vị (verify RLS).
- ✅ PR `security/critical-secrets-cleanup` merge vào `main`.

---

## 5. PHASE 1 — Dọn dẹp & Foundation (P1)

### 5.1 Mục tiêu

Đặt nền móng cho tất cả phase sau: repo sạch, type chặt, CI tự động chạy, tài liệu đồng bộ.

### 5.2 Công việc

| # | Task | Chi tiết | Definition of Done |
|---|---|---|---|
| 1.1 | **Dọn rác root** | Di chuyển hoặc xóa: `_temp_playbook.txt`, `tmp_test_ai.ts`, `test-update.ts`, `test_query.ts`, `test_e2e_sprint4.ts`, `check_ai_logs.ts`, `extract.cjs`, `extract.js`, `_read_docx.js`, `cleanTasks.cjs`, `patch_tools.js`, `setup-env.ts`, `coverage_report.txt`, `test_output.txt`, mọi `*.py` (extract/parse/scan/peek/generate/map/upload). Cập nhật `.gitignore`. | Root chỉ còn config files (`vite.config.ts`, `tsconfig.json`, `package.json`, `vercel.json`, `vitest.config.ts`, `index.html`, `index.tsx`, `constants.tsx`, `types.ts`, `metadata.json`, `README.md`, `RULES.md`). |
| 1.2 | **Generated Supabase types** | `npx supabase gen types typescript --project-id <id> --schema public > types/supabase.ts`. Thêm script `npm run gen:types`. | File `types/supabase.ts` tồn tại, được commit, có > 50 table types. |
| 1.3 | **Áp dụng types vào services cốt lõi** | Thay `any` bằng `Database['public']['Tables']['contracts']['Row']` ở: `contractService`, `taskService`, `paymentService`, `customerService`, `employeeService`. | `grep -c ": any" services/contractService.ts services/taskService.ts services/paymentService.ts services/customerService.ts services/employeeService.ts` < 50 (trước đó trung bình ~80/file). |
| 1.4 | **Bật TS check cho `tests/`** | Bỏ `"tests"`, `"tests/**"`, `"test_query.ts"` khỏi `tsconfig.json` exclude. Tạo `tsconfig.scripts.json` cho `scripts/` và `workers/` (lỏng hơn). | `npx tsc --noEmit` pass cho cả `tests/`. |
| 1.5 | **Strip console.log production** | Thêm `vite-plugin-remove-console` (hoặc `terser drop_console: true`) chỉ trong build production. Giữ `console.warn`/`console.error`. Logger có level riêng cho debug. | Build prod, `grep -c "console.log" dist/assets/*.js` = 0. |
| 1.6 | **Tài liệu hóa convention** | Tạo `CLAUDE.md` (cho AI agents) + `CONTRIBUTING.md` (cho dev): convention đặt tên, dark mode rules (link RULES.md), git workflow, cách add migration, cách add service, cách thêm route + permission. | 2 file tồn tại, được link từ README. |
| 1.7 | **Đóng plan cũ** | Đánh dấu `plans/260126-backend-migration/plan.md` status = ✅ Done (đã hoàn thành thực tế). Cross-reference đến plan này. | File có dòng `Status: ✅ Done — superseded by 260427-optimization-roadmap`. |
| 1.8 | **Squash migrations baseline** | Dump schema hiện tại thành `supabase/migrations/00000000000000_baseline.sql`. Archive 120 migration cũ vào `supabase/migrations/_archive/`. Migrations mới từ 2026-05 trở đi nối tiếp. | `supabase db reset` chạy trên máy mới < 60 giây. |
| 1.9 | **CI baseline** | GitHub Actions `ci.yml`: install → lint → `tsc --noEmit` → `vitest run` → `vite build`. Trigger ở PR + push main. | Mọi PR có badge xanh hoặc bị block. |

### 5.3 Tiêu chí done của Phase 1

- ✅ Root chỉ còn ~15 file thiết yếu.
- ✅ `types/supabase.ts` được sinh và áp dụng cho 5 service core.
- ✅ Số lượng `any` giảm tối thiểu 30% (từ 813 → < 570).
- ✅ Build prod không còn `console.log`.
- ✅ CI chạy ở mọi PR.
- ✅ Reset DB từ `supabase/migrations` < 1 phút.

---

## 6. PHASE 2 — Refactor file "thần" (P1)

### 6.1 Tại sao cần refactor

7 file > 1.000 LOC vi phạm SRP, gây 4 vấn đề thực tế:

- Khó test (component có 30+ state, không thể mock đủ).
- Render chậm (mọi update local state re-render toàn bộ cây con).
- Merge conflict thường xuyên (nhiều dev cùng đụng 1 file).
- Onboarding đau đớn (dev mới mất 1 ngày để hiểu 1 file).

### 6.2 Mục tiêu cụ thể

**Mọi file `.ts/.tsx` ≤ 600 LOC.** File compose (page-level) ≤ 200 LOC.

### 6.3 Lộ trình tách (theo độ ưu tiên va đập nghiệp vụ)

| File hiện tại | LOC | Tách thành | Ghi chú |
|---|---|---|---|
| [components/tasks/TaskDetailPanel.tsx](../../components/tasks/TaskDetailPanel.tsx) | 2.258 | `task-detail/{TaskHeader, TaskTabs, TaskActionBar, SubtasksTab, DependenciesTab, ApprovalFlow}.tsx` + hook `useTaskDetail.ts` | State quản lý bằng `useReducer` hoặc context riêng |
| [components/AIAssistant.tsx](../../components/AIAssistant.tsx) | 1.908 | `chat/{ChatShell, MessageList, Composer, SettingsDrawer, ProviderConfig, KeyManager}.tsx` + Zustand store `aiAssistantStore.ts` | Tách phần "settings" 700+ LOC ra drawer riêng |
| [services/contractService.ts](../../services/contractService.ts) | 1.690 | `contract/{queries, mutations, aggregates, workflow, validators, mapper}.ts` (folder đã có) | Re-export qua `contract/index.ts` để không vỡ import |
| [services/taskService.ts](../../services/taskService.ts) | 1.416 | `task/{queries, mutations, visibility, links, hierarchy}.ts` | Tương tự |
| [components/contract-detail/ContractOverviewTab.tsx](../../components/contract-detail/ContractOverviewTab.tsx) | 1.188 | `contract-detail/overview/{Header, Financials, Parties, Timeline, Notes}.tsx` | |
| [components/Analytics.tsx](../../components/Analytics.tsx) | 1.172 | `analytics/{KpiCards, RevenueChart, UnitMatrix, DrillDown, Filters}.tsx` | |
| [components/PaymentForm.tsx](../../components/PaymentForm.tsx) | 1.042 | `payment-form/{BasicInfo, ScheduleSection, TaxSection, AttachmentSection}.tsx` + hook `usePaymentForm.ts` | |
| [components/LazyPages.tsx](../../components/LazyPages.tsx) | 1.011 | Giữ nguyên (chỉ là index lazy import, không phải logic) | Ngoại lệ |
| [components/ContractList.tsx](../../components/ContractList.tsx) | 1.048 | `contract-list/{Toolbar, Filters, Table, BulkActions}.tsx` (mở rộng folder hiện có) | |
| [components/ContractDetail.tsx](../../components/ContractDetail.tsx) | 1.080 | Tách tabs ra `contract-detail/tabs/*.tsx` | |
| [components/Dashboard.tsx](../../components/Dashboard.tsx) | 956 | `dashboard/{Widgets, KpiRow, RecentActivity, QuickActions}.tsx` | |
| [components/DocumentManager.tsx](../../components/DocumentManager.tsx) | 931 | `document-manager/{TreeView, FilePane, UploadZone, Permissions}.tsx` | |
| [services/contractTaskDefinitionService.ts](../../services/contractTaskDefinitionService.ts) | 947 | `contract-task-definition/{queries, builders, validators}.ts` | |
| [services/ai/gateway.ts](../../services/ai/gateway.ts) | 953 | `ai/{gateway/{streamChat, embedding, fallback, logging, rateLimiter}}.ts` | |

### 6.4 Quy trình refactor an toàn (mỗi file)

1. **Snapshot test trước**: viết 1-2 integration test cho hành vi quan trọng (đảm bảo không vỡ).
2. **Tách bằng phương pháp move-only** (không đổi logic) → commit.
3. **Re-export qua barrel `index.ts`** giữ public API.
4. **Tối ưu render** sau (memo, useMemo, split context) → commit riêng.
5. **Xóa code chết** sau cùng → commit riêng.

### 6.5 Tiêu chí done của Phase 2

- ✅ Không file `.ts/.tsx` nào > 600 LOC (kiểm bằng `find ... -exec wc -l {} \; | awk '$1 > 600'`).
- ✅ Test trước refactor vẫn xanh sau refactor.
- ✅ Bundle main chunk không tăng (đo bằng visualizer trước/sau).
- ✅ Không vỡ import ở consumer (build prod pass).

---

## 7. PHASE 3 — Test & Quality Gate (P2)

### 7.1 Mục tiêu

| Phạm vi | Coverage hiện tại | Mục tiêu |
|---|---|---|
| `services/*` (logic nghiệp vụ) | 13% | **≥ 50%** |
| `lib/*` (data, permissions, utils) | 84% | **≥ 90%** |
| `hooks/*` | 95% (1 hook) | **≥ 70% (mọi hook)** |
| `components/*` (logic-heavy) | 27% | **≥ 35%** |
| `utils/*` | 100% | giữ nguyên |

### 7.2 Công việc

| # | Task | Chi tiết | Definition of Done |
|---|---|---|---|
| 3.1 | **Test services nghiệp vụ** | Bổ sung test cho: `paymentService`, `workflowService`, `permissionService`, `aiProcessingService`, `aiPermissionService`, `auditLogService`, `notificationService`, `taskTemplateService`, `historicalProductionService`. | Mỗi service có file `tests/services/<name>.test.ts` ≥ 10 test case, coverage ≥ 60%. |
| 3.2 | **Test hooks còn thiếu** | `useContractForm`, `useAutoTaskEngine`, `useExecutionCosts`, `useColumnResize`, `useInfiniteScroll`, `usePermissions`, `useTaskVisibility`, `useUnitVisibility`, `useChatRealtime`, `useChatPresence`. | Mỗi hook có file test, coverage ≥ 70%. |
| 3.3 | **Integration test RLS** | Setup Supabase test container (hoặc mock với fixtures). Test scenarios: NVKD đơn vị A không xem được contract đơn vị B; AdminUnit chỉ thấy nhân sự đơn vị mình; Leadership thấy toàn công ty. | File `tests/integration/rls.test.ts` chạy thực tế trên DB test, ≥ 8 scenario pass. |
| 3.4 | **Component test cho form quan trọng** | `ContractForm`, `PaymentForm`, `CustomerForm`, `ServiceForm`, `ProjectForm`, `PersonnelForm`. Test: render, validate, submit happy path, submit lỗi. | Mỗi form có file test ≥ 5 test case. |
| 3.5 | **Pre-commit hook** | Cài `husky` + `lint-staged`: chạy `tsc --noEmit` cho file đổi + format Prettier + ESLint --fix. | Commit có file TS lỗi → bị block. |
| 3.6 | **CI quality gate** | Mở rộng `ci.yml`: chặn merge nếu coverage giảm > 2% so với main. Dùng `vitest run --coverage --reporter=json`. | PR giảm coverage > 2% bị label `coverage-drop` và block. |
| 3.7 | **Dọn `@ts-ignore`** | Tìm và fix root cause cho 16 chỗ `@ts-ignore` / `@ts-nocheck`. | `grep -c "@ts-ignore\|@ts-nocheck" --include="*.ts*" -r .` = 0 (trừ `vitest.config.ts` nếu thực sự cần). |

### 7.3 Tiêu chí done của Phase 3

- ✅ Coverage tổng đạt mục tiêu ở bảng 7.1.
- ✅ Pre-commit hook chặn được lỗi cơ bản.
- ✅ CI block PR giảm coverage.
- ✅ 0 `@ts-ignore` không có lý do chính đáng.

---

## 8. PHASE 4 — Performance & UX (P2)

### 8.1 Mục tiêu

| Chỉ số | Hiện tại | Mục tiêu |
|---|---|---|
| Bundle main chunk (gzip) | Chưa đo | < 500KB |
| Total bundle size (gzip) | Chưa đo | < 2MB |
| Lighthouse Performance (`/`, `/contracts`, `/dashboard`) | Chưa đo | ≥ 80 |
| Render danh sách 1.000 dòng | Chưa đo | < 100ms (virtualize) |
| Dark mode coverage | Chưa đo | 100% (không lộ nền sáng) |

### 8.2 Công việc

| # | Task | Chi tiết | Definition of Done |
|---|---|---|---|
| 4.1 | **Bundle analyzer** | Cài `rollup-plugin-visualizer`. Chạy `npm run build` → mở `stats.html`. Document size baseline. | File `docs/perf/bundle-baseline-2026-04.html` được commit. |
| 4.2 | **Tối ưu chunks** | Rà soát `manualChunks` trong [vite.config.ts](../../vite.config.ts) — tách thêm `tiptap`, `mammoth`, `docx` nếu được. Lazy load heavy components (`Analytics`, `DocumentManager`). | Main chunk < 500KB gzip. |
| 4.3 | **Virtualize danh sách dài** | Cài `@tanstack/react-virtual`. Áp dụng cho: `ContractList`, `CustomerList`, `PaymentList`, `TasksPage` (table view), `PersonnelList`, `ProductList`. | Render 1.000 dòng < 100ms (đo bằng Performance tab). |
| 4.4 | **Audit React Query** | Đặt `staleTime` hợp lý cho master data (units: 10ph, employees: 5ph, products: 5ph). Bật `placeholderData: keepPreviousData` cho list page. | Network tab: pagination không refetch toàn bộ. |
| 4.5 | **Realtime subscription cleanup** | Audit `useChatRealtime`, `useRealtimeSync`, `useChatPresence`. Đảm bảo `removeChannel` ở cleanup. Dùng `AbortController` cho async. | Không tăng channel count khi navigate liên tục (đo qua Supabase dashboard). |
| 4.6 | **Lighthouse CI** | GitHub Action `lighthouse-ci.yml` chạy ở PR, route: `/`, `/contracts`, `/dashboard`. Budget: Perf ≥ 80, A11y ≥ 90. | Badge Lighthouse trong README. |
| 4.7 | **Dark mode audit** | Script `scripts/audit-dark-mode.sh`: grep `bg-white` thiếu `dark:bg-`, `text-slate-900` thiếu `dark:text-slate-100`. Fix tất cả. | Script chạy không phát hiện vi phạm. |
| 4.8 | **Image optimization** | Audit ảnh trong `public/`: nén bằng `sharp`, dùng `<img loading="lazy">`. Logo SVG hóa nếu được. | Tổng size `public/` giảm ≥ 30%. |

### 8.3 Tiêu chí done của Phase 4

- ✅ Mọi chỉ số ở bảng 8.1 đạt mục tiêu.
- ✅ Lighthouse CI chạy ở mọi PR và pass budget.
- ✅ Script audit dark mode pass 100%.

---

## 9. PHASE 5 — AI Platform v2 & Observability (P3)

### 9.1 Mục tiêu

Hoàn thiện AI platform thành sản phẩm thực sự production-grade: bảo vệ chi phí, validate input/output, dashboard rõ ràng.

### 9.2 Công việc

| # | Task | Chi tiết | Definition of Done |
|---|---|---|---|
| 5.1 | **Rate limit per user** | Tạo RPC `check_and_increment_ai_quota(user_id, action)` với bucket theo phút/ngày. Gateway gọi trước mỗi request, reject nếu vượt. | User vượt quota nhận lỗi rõ ràng "Đã vượt giới hạn 100 request/giờ". |
| 5.2 | **Cải thiện edge function availability check** | `isEdgeFunctionAvailable` trong [services/ai/gateway.ts](../../services/ai/gateway.ts) đang cache vĩnh viễn — đổi sang TTL 5 phút (Map với timestamp). | Edge function down rồi lên lại được phát hiện trong 5 phút. |
| 5.3 | **Schema validate AI tools** | Mỗi tool trong [services/ai/openclaw/tools/](../../services/ai/openclaw/tools/) có Zod schema cho input + output. Reject sớm nếu LLM trả output sai schema. | Mọi tool có `inputSchema` + `outputSchema`, có test schema validation. |
| 5.4 | **Test cho openclaw tools** | Bổ sung test cho tất cả tool: `contract.tools.ts`, `customer.tools.ts`, `dashboard.tools.ts`, `finance.tools.ts`, `hr.tools.ts`, `knowledge.tools.ts`, `marketing.tools.ts`, `master.tools.ts`, `planning.tools.ts`, `product.tools.ts`, `system.tools.ts`. | Mỗi tool có ≥ 3 test case. |
| 5.5 | **Mở rộng Observability Dashboard** | [components/AIObservabilityDashboard.tsx](../../components/AIObservabilityDashboard.tsx): thêm filter theo agent, biểu đồ cost theo ngày, top 10 error, top 10 user. | UI có 4 widget mới, có thể export CSV. |
| 5.6 | **Tài liệu kiến trúc AI** | Viết `docs/AI_ARCHITECTURE.md`: sơ đồ Gateway → Router → Tools → Memory → Logs. Bao gồm flow khi local AI down → fallback Gemini → fallback OpenAI. | File tồn tại, có Mermaid diagram, ≥ 500 từ. |
| 5.7 | **MCP Server hóa production** | [workers/cic-mcp-server/](../../workers/cic-mcp-server/): viết test e2e cơ bản, document MCP tools. Deploy script lên Cloudflare Workers. | Server có README, test pass, deploy thành công. |
| 5.8 | **Chống prompt injection** | Sanitize input người dùng trước khi đưa vào prompt. Định nghĩa "system prompt protection" cho mỗi agent. Test với 10 case prompt injection phổ biến. | 10/10 case bị reject. |

### 9.3 Tiêu chí done của Phase 5

- ✅ User vượt quota bị reject đúng.
- ✅ Mọi tool có Zod schema và test.
- ✅ Dashboard AI có đầy đủ filter + cost chart.
- ✅ `docs/AI_ARCHITECTURE.md` được Tech Lead review approve.
- ✅ Pen-test prompt injection không thành công.

---

## 10. Lịch trình & Phụ thuộc

```
Tuần 1:  [P0 Bảo mật     ] [P1 Foundation        ]
Tuần 2:                    [P1 Foundation tiếp   ] [P2 Refactor    ]
Tuần 3:                                            [P2 Refactor    ]
Tuần 4:  [P3 Test                                                  ]
Tuần 5:  [P3 Test tiếp   ] [P4 Performance       ]
Tuần 6:                    [P4 Perf tiếp ] [P5 AI v2               ]
Tuần 7:                                    [P5 AI v2 tiếp          ]
```

**Phụ thuộc cứng:**
- P0 phải xong trước P1 (vì P1 dọn rác có thể đụng tới file P0 đang sửa).
- P1.2 (gen types) phải xong trước P2 (refactor sẽ áp type mới).
- P2 phải xong trước P3 (test file nhỏ dễ hơn file 2.000 LOC).
- P3 phải có CI gate trước P4 + P5 (để PR sau không làm tụt coverage).

---

## 11. Quản trị rủi ro

| Rủi ro | Mức | Mitigation |
|---|---|---|
| Refactor Phase 2 vỡ feature production | Cao | Snapshot test trước; release từng file một; canary deploy 1-2 ngày trước khi rollout đại trà. |
| Generated types lệch với code hiện tại | Trung | Mỗi service refactor làm 1 PR riêng nhỏ; reviewer check kỹ. |
| Squash migrations làm vỡ Supabase production | Cao | Chỉ áp dụng cho local + staging trước; production giữ nguyên 120 migrations cho đến khi staging test 1 tháng ổn định. |
| Rotate key làm gián đoạn dịch vụ | Trung | Dùng dual-key window 24h: key cũ vẫn valid, deploy key mới, monitor, sau đó revoke. |
| Lighthouse CI fail liên tục do flaky | Thấp | Cho phép retry 2 lần; báo cáo trung bình 3 lần thay vì 1. |

---

## 12. Theo dõi tiến độ

| Tuần | Báo cáo | KR cập nhật |
|---|---|---|
| Cuối tuần 1 | Standup tổng kết Phase 0 + tiến độ P1 | KR1 |
| Cuối tuần 2 | Tổng kết P1 + bắt đầu P2 | KR2, KR5, KR8 |
| Cuối tuần 3 | Tổng kết P2 | KR4 |
| Cuối tuần 4 | Tiến độ P3 | KR3 |
| Cuối tuần 5 | Tổng kết P3 + tiến độ P4 | KR3, KR6 |
| Cuối tuần 6 | Tổng kết P4 + tiến độ P5 | KR6, KR7 |
| Cuối tuần 7 | Tổng kết P5 + retro | Toàn bộ KR |

Format báo cáo: 1 file markdown trong `plans/260427-optimization-roadmap/reports/wXX.md` mỗi tuần.

---

## 13. Quyết định đã xác nhận (2026-04-28)

| # | Câu hỏi | Quyết định | Ghi chú |
|---|---|---|---|
| Q1 | Có rotate anon key Supabase + URL không? | ✅ **A — Giữ project, audit RLS triệt để** | Anon key được thiết kế để lộ. Tập trung vá RLS. |
| Q2 | Rotate LiteLLM master key `sk-cic-2026`? | ⏸️ **Hoãn — làm sau** | Xử lý ở sprint riêng, không block Phase 0 còn lại. |
| Q3 | Squash migrations áp dụng production hay chỉ dev? | ✅ **A — Chỉ dev/staging** | Production giữ nguyên cho đến khi staging stable 1 tháng. |
| Q4 | Mục tiêu coverage bao nhiêu? | ✅ **B — 35% ở Phase 3, 50% sau Phase 5** | Chất lượng test > số liệu. Đợi sau Phase 2 refactor. |
| Q5 | Owner cho từng phase? | ✅ **Claude (AI Agent) thực thi toàn bộ** | Không có dev người, Claude làm chính. |

---

## 14. Tham chiếu

- Mã nguồn chính: [services/](../../services/), [components/](../../components/), [lib/](../../lib/), [hooks/](../../hooks/)
- Migrations: [supabase/migrations/](../../supabase/migrations/)
- Edge Functions: [supabase/functions/](../../supabase/functions/)
- Workers: [workers/](../../workers/)
- Quy tắc dự án: [RULES.md](../../RULES.md)
- Phân quyền hệ thống: [PHANQUYENHETHONG.md](../../PHANQUYENHETHONG.md)
- Plan tiền nhiệm: [plans/260126-backend-migration/plan.md](../260126-backend-migration/plan.md)

---

**Ghi chú cuối:** Kế hoạch này là "living document" — cập nhật mỗi cuối tuần theo báo cáo thực tế. Mọi thay đổi phạm vi phải tạo PR sửa file này, không sửa silently.
