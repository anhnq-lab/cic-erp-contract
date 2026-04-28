# Phase 3 — Test & Quality Gate

- **Ưu tiên:** 🟡 P2
- **Thời lượng:** 5-7 ngày
- **Owner:** 1 FE + 1 QA
- **Phụ thuộc:** Phase 2 (file đã được tách nhỏ, dễ test)
- **Trạng thái:** ⬜ Pending

---

## Mục tiêu

Đảm bảo mỗi PR vào `main` không làm tụt chất lượng. Đạt mức coverage tối thiểu để **tự tin refactor và deploy**.

| Phạm vi | Coverage hiện tại | Mục tiêu |
|---|---|---|
| `services/*` | 13% | **≥ 50%** statement |
| `lib/*` | 84% | **≥ 90%** |
| `hooks/*` | 95% (chỉ 1 hook) | **≥ 70%** mọi hook |
| `components/*` (logic-heavy) | 27% | **≥ 35%** |
| `utils/*` | 100% | giữ |

**Hard gates:**
- CI block PR giảm coverage > 2% so với main.
- Pre-commit chặn `tsc --noEmit` lỗi.
- 0 `@ts-ignore` không có comment giải thích.

---

## Danh sách công việc

### Task 3.1 — Test services nghiệp vụ

**Hiện trạng:** Đã có 11 test file services. Cần bổ sung cho 9 service quan trọng còn thiếu:

| # | Service | LOC ước | Test case bắt buộc |
|---|---|---|---|
| 3.1.1 | `paymentService` | ? | create, list theo contract, update status, delete, calculate paid_amount, RLS scope, validation amount > 0 |
| 3.1.2 | `workflowService` | 439 | submit for approval, approve, reject, parallel approval, sequential approval, edge case "approver vắng" |
| 3.1.3 | `permissionService` | ? | check resource action, init defaults, update permission, scope by unit |
| 3.1.4 | `aiProcessingService` | ? | extract contract, parse PAKD, fallback model, retry on error |
| 3.1.5 | `aiPermissionService` | ? | check user can use AI, quota check, log denial |
| 3.1.6 | `auditLogService` | ? | log create, log update, log delete, query by entity |
| 3.1.7 | `notificationService` | ? | create, mark read, list unread, batch send |
| 3.1.8 | `taskTemplateService` | ? | create template, instantiate to project, validate fields |
| 3.1.9 | `historicalProductionService` | ? | aggregate by month, by unit, validate format |

**Pattern test mỗi service:**
```ts
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { PaymentService } from '../../services/paymentService';
import { dataClient } from '../../lib/dataClient';

vi.mock('../../lib/dataClient');

describe('PaymentService', () => {
  beforeEach(() => vi.clearAllMocks());

  describe('create', () => {
    it('should validate amount > 0', async () => {
      await expect(PaymentService.create({ amount: -1 } as any))
        .rejects.toThrow('Số tiền phải lớn hơn 0');
    });

    it('should insert with correct payload', async () => {
      // ...
    });
  });

  describe('listByContract', () => {
    it('should return payments sorted by due_date desc', async () => {
      // ...
    });
  });
});
```

**DoD:**
- [ ] 9 service có file test ≥ 10 test case
- [ ] Mỗi service đạt coverage ≥ 60% statement
- [ ] Mocks dùng vi.mock pattern thống nhất

---

### Task 3.2 — Test hooks còn thiếu

| # | Hook | Loại | Test case bắt buộc |
|---|---|---|---|
| 3.2.1 | `useContractForm` | Form | initialize, validate, submit success, submit error, reset |
| 3.2.2 | `useAutoTaskEngine` | Side effect | trigger on create, skip on duplicate |
| 3.2.3 | `useExecutionCosts` | Query | fetch, aggregate, update on change |
| 3.2.4 | `useColumnResize` | UI state | save to localStorage, restore |
| 3.2.5 | `useInfiniteScroll` | UI | trigger fetch on scroll, prevent double fetch |
| 3.2.6 | `usePermissions` | Auth | check action, denial reason |
| 3.2.7 | `useTaskVisibility` | Auth | scope by role, scope by unit |
| 3.2.8 | `useUnitVisibility` | Auth | cross-unit visibility resolution |
| 3.2.9 | `useChatRealtime` | Realtime | subscribe, unsubscribe on unmount, reconnect |
| 3.2.10 | `useChatPresence` | Realtime | join, leave, timeout |
| 3.2.11 | `useDebounce` | Utility | delay, cancel on rapid input |
| 3.2.12 | `useNotifications` | Query | fetch unread, mark read |
| 3.2.13 | `useEmployees` | Query | list, get, create, update, delete |

**Pattern test hook:**
```ts
import { renderHook, act } from '@testing-library/react';
import { useDebounce } from '../../hooks/useDebounce';
import { describe, it, expect, vi } from 'vitest';

describe('useDebounce', () => {
  it('should debounce value changes', async () => {
    vi.useFakeTimers();
    const { result, rerender } = renderHook(
      ({ value }) => useDebounce(value, 300),
      { initialProps: { value: 'a' } }
    );

    expect(result.current).toBe('a');

    rerender({ value: 'b' });
    expect(result.current).toBe('a');

    act(() => { vi.advanceTimersByTime(300); });
    expect(result.current).toBe('b');

    vi.useRealTimers();
  });
});
```

**DoD:**
- [ ] 13 hook có file test
- [ ] Coverage ≥ 70% mỗi hook
- [ ] Realtime hooks có test cleanup không leak channel

---

### Task 3.3 — Integration test RLS

**Mục tiêu:** Verify RLS policies hoạt động đúng với 4 vai trò.

**Setup:**

1. Tạo `tests/integration/setup.ts`: khởi tạo Supabase test client với 4 user khác đơn vị/role.
2. Seed test data: 2 đơn vị, mỗi đơn vị 3 user, mỗi user tạo vài contract.
3. Cleanup sau mỗi test.

**Scenarios bắt buộc:**

| # | Scenario | Mong đợi |
|---|---|---|
| 1 | NVKD đơn vị A query `contracts` | Chỉ thấy contract của đơn vị A |
| 2 | NVKD đơn vị A update contract đơn vị B | RLS reject |
| 3 | UnitLeader đơn vị A query `employees` | Chỉ thấy employee đơn vị A |
| 4 | Leadership query `contracts` | Thấy mọi contract |
| 5 | Admin query `audit_logs` | Thấy toàn bộ |
| 6 | NVKD update contract của chính mình | OK |
| 7 | NVKD soft delete contract | RLS reject (chỉ Leadership được) |
| 8 | Cross-unit visibility: user X được grant unit Y | Query `contracts` thấy cả unit X và Y |

**File:** `tests/integration/rls.test.ts`

**DoD:**
- [ ] 8 scenario pass thực tế trên Supabase test instance
- [ ] CI có job riêng `integration-test` chạy nightly hoặc on-demand
- [ ] Có script cleanup data test sau khi xong

---

### Task 3.4 — Component test cho form quan trọng

| # | Component | Test case bắt buộc |
|---|---|---|
| 3.4.1 | `ContractForm` | Render, validate required, validate amount, submit success, submit error, autosave draft |
| 3.4.2 | `PaymentForm` | Render, validate, submit, link to contract |
| 3.4.3 | `CustomerForm` | Render, validate tax code, validate phone, submit |
| 3.4.4 | `ServiceForm` | Render, validate, submit |
| 3.4.5 | `ProjectForm` | Render, validate dates, validate members, submit |
| 3.4.6 | `PersonnelForm` | Render, validate, submit, change role |

**Pattern test form:**
```tsx
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { CustomerForm } from '../../components/CustomerForm';
import { describe, it, expect, vi } from 'vitest';

describe('CustomerForm', () => {
  it('should validate tax code format', async () => {
    const user = userEvent.setup();
    const onSubmit = vi.fn();

    render(<CustomerForm onSubmit={onSubmit} />);

    await user.type(screen.getByLabelText(/Mã số thuế/i), '123');
    await user.click(screen.getByRole('button', { name: /Lưu/i }));

    expect(await screen.findByText(/Mã số thuế không hợp lệ/i)).toBeInTheDocument();
    expect(onSubmit).not.toHaveBeenCalled();
  });
});
```

**DoD:**
- [ ] 6 form có file test ≥ 5 test case
- [ ] Coverage form ≥ 40%

---

### Task 3.5 — Pre-commit hook

**Cài đặt:**
```bash
npm install -D husky lint-staged
npx husky init
```

**`.husky/pre-commit`:**
```bash
#!/usr/bin/env sh
. "$(dirname -- "$0")/_/husky.sh"
npx lint-staged
```

**`package.json`:**
```json
{
  "lint-staged": {
    "*.{ts,tsx}": [
      "tsc --noEmit",
      "eslint --fix",
      "prettier --write"
    ],
    "*.{md,json}": ["prettier --write"]
  }
}
```

**Test:**
- Tạo file có lỗi TS → commit → bị block.
- File hợp lệ → commit → format auto.

**DoD:**
- [ ] Husky setup xong
- [ ] Lint-staged chạy ở mọi commit
- [ ] CI cũng chạy lint check (double layer)

---

### Task 3.6 — CI quality gate

**Mở rộng `.github/workflows/ci.yml`:**

```yaml
- name: Run tests with coverage
  run: npm run test:coverage

- name: Coverage gate
  run: |
    npx vitest run --coverage --reporter=json --outputFile=coverage.json
    node scripts/check-coverage.js
```

**`scripts/check-coverage.js`:**
```js
const fs = require('fs');
const main = JSON.parse(fs.readFileSync('coverage-baseline.json', 'utf8'));
const current = JSON.parse(fs.readFileSync('coverage/coverage-summary.json', 'utf8'));

const diff = current.total.statements.pct - main.total.statements.pct;
console.log(`Coverage diff: ${diff.toFixed(2)}%`);

if (diff < -2) {
  console.error('❌ Coverage giảm quá 2%, block PR.');
  process.exit(1);
}
console.log('✅ Coverage gate pass.');
```

**Setup baseline:**
- Sau mỗi merge `main`, lưu `coverage-summary.json` vào artifact.
- PR mới so với baseline `main`.

**DoD:**
- [ ] CI có job coverage gate
- [ ] PR thử nghiệm giảm coverage > 2% bị block
- [ ] Có Slack/Telegram notification khi coverage giảm

---

### Task 3.7 — Dọn `@ts-ignore`

**Hiện trạng:** 16 chỗ `@ts-ignore` / `@ts-nocheck`.

**Quy trình:**

1. List chỗ:
```bash
grep -rn "@ts-ignore\|@ts-nocheck" --include="*.ts" --include="*.tsx" .
```

2. Với mỗi chỗ, phân loại:
   - **Có lý do (legacy lib không có types)** → giữ, thêm comment giải thích.
   - **Lười không type** → fix root cause.
   - **Bug TS lib** → ghi link issue + thêm comment.

3. Pattern cuối:
```ts
// @ts-expect-error -- lib X chưa có types, đã mở issue github.com/x/y/123
const result = oldLib.foo();
```

**DoD:**
- [ ] Mọi `@ts-ignore` còn lại có comment lý do
- [ ] Đổi `@ts-ignore` → `@ts-expect-error` (chính xác hơn)
- [ ] `@ts-nocheck` chỉ còn ở `vitest.config.ts` nếu thực sự cần

---

## Tiêu chí done của Phase 3 (Exit Criteria)

- ✅ Coverage tổng đạt mục tiêu:
  - Services ≥ 50%
  - Lib ≥ 90%
  - Hooks ≥ 70%
  - Components logic-heavy ≥ 35%
- ✅ Pre-commit hook hoạt động (test bằng commit cố tình lỗi)
- ✅ CI block PR giảm coverage > 2%
- ✅ 0 `@ts-ignore` không có comment lý do
- ✅ 8 scenario integration RLS pass
- ✅ Báo cáo `reports/phase-3-completion.md` có biểu đồ coverage trước/sau

---

## Rủi ro & Mitigation

| Rủi ro | Mitigation |
|---|---|
| Test flaky vì mock không nhất quán | Tạo helper `tests/helpers/mockSupabase.ts` chuẩn hóa |
| Integration test chậm (> 5 phút) | Tách job riêng, chạy nightly thay vì mọi PR |
| Coverage gate quá strict gây frustration | Cho phép override bằng label `coverage-exempt` (Tech Lead approve) |
| Pre-commit chậm | `lint-staged` chỉ chạy file đổi, không phải toàn dự án |

---

## Tham chiếu

- [vitest.config.ts](../../vitest.config.ts)
- [tests/setup.ts](../../tests/setup.ts)
- [tests/services/](../../tests/services/)
- [tests/hooks/](../../tests/hooks/)
- [tests/components/](../../tests/components/)
