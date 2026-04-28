# Phase 0 — Vá Bảo Mật Khẩn Cấp

- **Ưu tiên:** 🔴 P0
- **Thời lượng:** 1-2 ngày
- **Owner:** Tech Lead + 1 BE
- **Trạng thái:** ⬜ Pending

---

## Mục tiêu

Loại bỏ **3 lỗ hổng nghiêm trọng** đang tồn tại trên codebase, có thể dẫn tới:
- Lộ key AI gây thiệt hại tài chính (LiteLLM/vLLM bị lạm dụng).
- Bypass RLS toàn bộ database nếu một file env config sai.
- Lộ project URL / anon key vĩnh viễn trong git history.

Sau Phase 0, dự án phải đạt: **0 secret hardcoded ở client code, 0 đường dẫn nào để service_role rò rỉ ra browser bundle.**

---

## Bối cảnh chi tiết từng lỗ hổng

### Lỗ hổng 1: Hardcoded LiteLLM master key

**Vị trí:**
- `services/ai/gateway.ts:30` — `localApiKey: 'sk-cic-2026'`
- `services/ai/gateway.ts:719` — `authKey = 'sk-cic-2026'`
- `components/AIAssistant.tsx:635` — `Authorization: Bearer sk-cic-2026`
- `components/AIAssistant.tsx:649` — tương tự

**Tác động:** Bất kỳ user nào mở DevTools đều copy được key, gọi LiteLLM/vLLM với quyền master → có thể đốt budget AI, truy cập mọi model, log toàn bộ traffic.

**Bằng chứng dễ khai thác:** Network tab Chrome → request có header `Authorization: Bearer sk-cic-2026` → copy → curl với key đó → success.

### Lỗ hổng 2: Service-role key có thể vào client bundle

**Vị trí:** `lib/dataClient.ts:37-39`

```ts
const isDevBypass = getEnv('VITE_DEV_BYPASS_AUTH') === 'true';
const supabaseKey = (isDevBypass && getEnv('VITE_SUPABASE_SERVICE_ROLE_KEY'))
    ? getEnv('VITE_SUPABASE_SERVICE_ROLE_KEY')
    : (getEnv('VITE_SUPABASE_ANON_KEY', DEFAULT_SUPABASE_ANON_KEY));
```

**Tác động:** Vite tự động bundle mọi env có prefix `VITE_` vào client. Nếu Vercel production set nhầm `VITE_SUPABASE_SERVICE_ROLE_KEY=...` → key đi thẳng vào bundle JS → bypass RLS toàn bộ DB.

**Mặc dù có cờ `VITE_DEV_BYPASS_AUTH`, key vẫn bị Vite đọc và inline vào bundle** — kể cả khi nhánh `if` không chạy, đó là cơ chế tĩnh của Vite.

### Lỗ hổng 3: Anon URL/key hardcode trong source

**Vị trí:** `lib/supabaseDefaults.ts`

```ts
export const DEFAULT_SUPABASE_URL = 'https://jyohocjsnsyfgfsmjfqx.supabase.co';
export const DEFAULT_SUPABASE_ANON_KEY = 'eyJhbG...';
```

**Tác động:**
- Anon key bản thân ít rủi ro nếu RLS đầy đủ, nhưng URL bị index lên git public sẽ lộ project ra ngoài.
- Migration `20260130000600_disable_rbac_dev.sql` cho thấy RLS từng bị disable cho dev → nếu production chưa re-enable, lộ URL = lộ DB.

---

## Danh sách công việc

### Task 0.1 — Bỏ hoàn toàn `sk-cic-2026` ở client

**Phương án giải quyết:**

1. Tạo Edge Function `ai-llm-call` (hoặc mở rộng `ai-proxy` hiện có) làm proxy đến LiteLLM:
   - Nhận body từ client.
   - Verify session người dùng qua `supabase.auth.getUser()`.
   - Gắn `Authorization: Bearer ${LITELLM_MASTER_KEY}` từ env Supabase secrets.
   - Forward đến LiteLLM endpoint.
   - Stream response về client (SSE).

2. Sửa `services/ai/gateway.ts`:
   - Bỏ `localApiKey: 'sk-cic-2026'` khỏi config.
   - Hàm `streamChat` / `chat` đổi sang `supabase.functions.invoke('ai-llm-call', { body, responseType: 'stream' })`.

3. Sửa `components/AIAssistant.tsx`:
   - Hai chỗ fetch trực tiếp với `Bearer sk-cic-2026` (line 635, 649) — đổi sang gọi qua gateway hoặc Edge Function.

**File cần đụng:**
- `services/ai/gateway.ts`
- `components/AIAssistant.tsx`
- `supabase/functions/ai-llm-call/index.ts` (mới)
- `supabase/functions/ai-proxy/index.ts` (cập nhật nếu mở rộng)

**Definition of Done:**
- [ ] `grep -rn "sk-cic-2026" services/ components/ lib/ hooks/ contexts/` → 0 kết quả
- [ ] LiteLLM master key chỉ tồn tại ở Supabase secrets (`supabase secrets list`)
- [ ] Test thủ công: đăng nhập → mở AI Assistant → gửi message → response stream về thành công
- [ ] Test thủ công: chưa đăng nhập → gọi Edge Function trực tiếp → 401 Unauthorized

---

### Task 0.2 — Loại service-role khỏi client bundle

**Phương án:**

1. Sửa `lib/dataClient.ts`:
```ts
// XÓA hoàn toàn nhánh dev bypass với service_role
const supabaseKey = getEnv('VITE_SUPABASE_ANON_KEY', DEFAULT_SUPABASE_ANON_KEY);
```

2. Nếu cần dev bypass auth (cho local test), implement bằng cách khác **không bundle service key**:
   - Dùng test user cố định trong DB seed.
   - Hoặc cấp Supabase magic link cho dev account.

3. Audit toàn bộ codebase để đảm bảo không có nơi nào khác đọc `VITE_SUPABASE_SERVICE_ROLE_KEY`:
```bash
grep -rn "SERVICE_ROLE" --include="*.ts" --include="*.tsx" \
  services/ components/ lib/ hooks/ contexts/ routes/
```

4. Service role chỉ được phép xuất hiện ở:
   - `api/*.ts` (Vercel serverless, server-side)
   - `supabase/functions/**/*.ts` (Edge Functions)
   - `scripts/**/*.ts` (CLI scripts, chạy bằng node)
   - `workers/**/*.ts` (Cloudflare Workers, server-side)

**Definition of Done:**
- [ ] Không còn nhánh `isDevBypass` trong `lib/dataClient.ts`
- [ ] Build production: `grep -c "service_role" dist/assets/*.js` = 0
- [ ] Build production: `grep -c "SUPABASE_SERVICE_ROLE_KEY" dist/assets/*.js` = 0
- [ ] Vercel env: kiểm tra rằng `VITE_SUPABASE_SERVICE_ROLE_KEY` không tồn tại trong project settings

---

### Task 0.3 — Loại bỏ hardcoded defaults Supabase

**Phương án:**

1. Tạo `.env.example` ở root:
```
# Supabase (bắt buộc cho production)
VITE_SUPABASE_URL=https://your-project.supabase.co
VITE_SUPABASE_ANON_KEY=your-anon-key

# AI providers (optional, có thể configure qua UI)
VITE_GEMINI_API_KEY=
VITE_OPENAI_API_KEY=
VITE_DEEPSEEK_API_KEY=

# Local AI (optional, cho on-prem)
VITE_VLLM_URL=
VITE_VLLM_GEMMA_URL=
```

2. Sửa `lib/supabase.ts` và `lib/dataClient.ts`:
```ts
const url = import.meta.env.VITE_SUPABASE_URL;
const key = import.meta.env.VITE_SUPABASE_ANON_KEY;

if (import.meta.env.PROD && (!url || !key)) {
    throw new Error('VITE_SUPABASE_URL và VITE_SUPABASE_ANON_KEY là bắt buộc trong production');
}

// Dev mode: cảnh báo nếu thiếu, fallback default chỉ cho dev
const finalUrl = url || (import.meta.env.DEV ? DEFAULT_SUPABASE_URL : '');
const finalKey = key || (import.meta.env.DEV ? DEFAULT_SUPABASE_ANON_KEY : '');

if (import.meta.env.DEV && (!url || !key)) {
    console.warn('[Supabase] Đang dùng default dev. Tạo .env.local để override.');
}
```

3. Cập nhật `README.md`: hướng dẫn copy `.env.example` → `.env.local`.

**Definition of Done:**
- [ ] File `.env.example` tồn tại
- [ ] Build production fail khi thiếu env (test bằng cách unset rồi build)
- [ ] Dev mode vẫn chạy được mà không cần `.env.local`
- [ ] README cập nhật

---

### Task 0.4 — Audit RLS production

**Phương án:**

1. Kết nối Supabase production qua psql / Supabase Studio.

2. Chạy query audit:
```sql
-- Liệt kê bảng có RLS enabled hay chưa
SELECT schemaname, tablename, rowsecurity
FROM pg_tables
WHERE schemaname = 'public'
ORDER BY tablename;

-- Liệt kê policies hiện có
SELECT schemaname, tablename, policyname, permissive, roles, cmd, qual
FROM pg_policies
WHERE schemaname = 'public'
ORDER BY tablename, policyname;
```

3. Đối chiếu với danh sách bảng nhạy cảm. Mọi bảng sau **bắt buộc** có RLS enabled + ít nhất 1 policy:
   - `contracts`, `contract_relations`, `contract_documents`, `contract_personal_tags`
   - `payments`
   - `customers`, `customer_contacts`
   - `employees`, `employee_targets`, `employee_documents`, `employee_allocations`
   - `units`, `unit_targets`
   - `tasks`, `task_links`, `task_comments`, `task_time_entries`
   - `projects`, `project_members`
   - `ai_logs`, `ai_chat_history`
   - `audit_logs`
   - `user_permissions`, `cross_unit_visibility`

4. Nếu phát hiện thiếu, tạo migration `supabase/migrations/<date>_re_enable_rls_audit_fix.sql`.

5. Test thực tế: đăng nhập với 3 user khác nhau (NVKD đơn vị A, NVKD đơn vị B, Leadership) — verify scope dữ liệu trả về.

**Definition of Done:**
- [ ] File audit `docs/security/rls-audit-2026-04-27.md` được commit, liệt kê mọi bảng + RLS status
- [ ] Mọi bảng nhạy cảm có RLS = ON + ≥ 1 policy
- [ ] Test 3 user 3 vai trò khác nhau pass

---

### Task 0.5 — Thêm gitleaks vào CI

**Phương án:**

1. Tạo `.github/workflows/security.yml`:
```yaml
name: Security Scan
on: [pull_request, push]
jobs:
  gitleaks:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
        with: { fetch-depth: 0 }
      - uses: gitleaks/gitleaks-action@v2
        env:
          GITHUB_TOKEN: ${{ secrets.GITHUB_TOKEN }}
```

2. Tạo `.gitleaks.toml` allowlist cho test fixtures (nếu có):
```toml
[allowlist]
paths = [
  '''tests/fixtures/.*''',
  '''.env.example''',
]
```

3. Test: thử commit 1 file có `OPENAI_API_KEY=sk-test...` → CI block.

**Definition of Done:**
- [ ] Workflow `security.yml` tồn tại
- [ ] Test PR có chứa fake secret bị block

---

### Task 0.6 — Rotate keys

**Phương án:**

| Key | Hành động | Cách rotate |
|---|---|---|
| Supabase anon key (cũ trong `supabaseDefaults.ts`) | Rotate hoặc giữ | Supabase Studio → Settings → API → reset anon key. Cập nhật env Vercel. |
| LiteLLM master `sk-cic-2026` | **Rotate bắt buộc** | Generate key mới ngẫu nhiên (32+ chars). Update LiteLLM config. Update Supabase secrets cho Edge Function. Revoke key cũ sau 24h dual-window. |
| Gemini API key | Check git history, rotate nếu lộ | Google AI Studio → API Keys → revoke + create new. |
| OpenAI API key | Check git history, rotate nếu lộ | platform.openai.com → API keys → revoke + create new. |
| DeepSeek API key | Check git history, rotate nếu lộ | DeepSeek dashboard. |
| Telegram bot token | Check git history, rotate nếu lộ | BotFather → /revoke. |

**Phương pháp dual-key window** (cho LiteLLM):
1. Thêm key mới vào LiteLLM config (key cũ vẫn valid).
2. Deploy code dùng key mới.
3. Monitor 24h: log truy cập với key cũ.
4. Sau 24h, revoke key cũ.

**Definition of Done:**
- [ ] Mọi key đã commit vào git history đều đã rotate
- [ ] Key mới chỉ tồn tại ở env (Vercel/Supabase secrets)
- [ ] Có file `docs/security/key-rotation-2026-04-27.md` log lại hành động (không log key)

---

## Tiêu chí done của Phase 0 (Exit Criteria)

Phase 0 chỉ được đóng khi **TẤT CẢ** các tiêu chí sau pass:

- ✅ `gitleaks detect --source . --no-git` không phát hiện secret nào.
- ✅ Build production: `npm run build` thành công với env mới (không có default cứng cho production).
- ✅ Pen-test thủ công: mở `view-source` trên production, search `sk-cic-2026`, `service_role`, `eyJhbG...` (anon key cũ) — không tìm thấy.
- ✅ Test scope: user NVKD đơn vị A đăng nhập production, gọi `/contracts` — chỉ thấy contract đơn vị mình.
- ✅ PR `security/critical-secrets-cleanup` được Tech Lead + 1 reviewer approve và merge `main`.
- ✅ Tag release `v-security-p0-2026-04-27`.
- ✅ Báo cáo cuối Phase 0 ở `plans/260427-optimization-roadmap/reports/phase-0-completion.md`.

---

## Rủi ro & Mitigation

| Rủi ro | Tác động | Mitigation |
|---|---|---|
| Edge Function `ai-llm-call` chưa kịp deploy → AI Assistant down | Cao | Deploy Edge Function trước, đợi 1h verify, mới merge code FE bỏ key |
| Rotate LiteLLM master key gây gián đoạn | Trung | Dual-key 24h, monitor, revoke |
| Migration RLS gây regression cho admin user | Cao | Test trên staging trước, có rollback script |
| Gitleaks false positive làm chậm dev | Thấp | Thiết lập allowlist hợp lý, document cách thêm |

---

## Tham chiếu

- [services/ai/gateway.ts](../../services/ai/gateway.ts)
- [components/AIAssistant.tsx](../../components/AIAssistant.tsx)
- [lib/dataClient.ts](../../lib/dataClient.ts)
- [lib/supabaseDefaults.ts](../../lib/supabaseDefaults.ts)
- [supabase/migrations/20260130000600_disable_rbac_dev.sql](../../supabase/migrations/20260130000600_disable_rbac_dev.sql)
- [supabase/functions/ai-proxy/index.ts](../../supabase/functions/ai-proxy/index.ts)
