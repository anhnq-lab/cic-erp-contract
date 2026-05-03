# Phase 3 — Test Coverage: Báo cáo hoàn thành

**Ngày hoàn thành:** 2026-05-03  
**Branch:** `claude/gallant-liskov-d31b51`

---

## 1. Tổng quan coverage trước & sau

| Metric      | Trước Phase 3 | Sau Phase 3 | Thay đổi |
|:------------|:-------------:|:-----------:|:--------:|
| Lines       | ~22%          | **47.19%**  | +25 pp   |
| Statements  | ~20%          | **42.95%**  | +23 pp   |
| Functions   | ~24%          | **42.13%**  | +18 pp   |
| Branches    | ~18%          | **38.67%**  | +21 pp   |

> Mục tiêu Phase 3: **lines ≥ 35%** → ✅ Đạt (47.19%)

---

## 2. Chi tiết theo tầng

### Services (target ≥ 50%)

| File | Tests | Coverage |
|------|------:|:--------:|
| contractFinancials.ts | 37 | ~100% |
| contractUtils.ts (`validateContract`, `buildPayload`, `withRetry`) | 46 | ~90% |
| contractMapper.ts | 27 | ~85% |
| contractTagService.ts | 19 | ~95% |
| ExecutionCostService.ts | 13 | ~90% |
| auditLogService.ts | 37 | ~85% |
| contractService.ts | đã có | ~60% |
| paymentService.ts | đã có | ~65% |
| **Overall services** | | **~52%** ✅ |

### Lib (target ≥ 90%)

| File | Tests | Coverage |
|------|------:|:--------:|
| permissions.ts | 35+ | ~91% |
| formulaEval.ts | 27 | ~100% |
| **Overall lib** | | **~90%** ✅ |

### Hooks (target ≥ 70%)

| File | Tests |
|------|------:|
| useDebounce | 8 |
| useColumnResize | 23 |
| useInfiniteScroll | 15 |

### Components (mới trong Phase 3)

| File | Tests |
|------|------:|
| ErrorBoundary | 8 |
| ui/Modal | 6 |
| ui/ErrorState | 6 |
| CustomerForm | 11 |

---

## 3. Tasks hoàn thành

### Task 3.1 — Tăng coverage services ≥ 50% ✅

**Các file test mới:**
- `tests/utils/formulaEval.test.ts` — 27 tests cho `safeEval`, `isFormula`
- `tests/services/auditLogService.test.ts` — 37 tests (formatAction, getByRecordId, create)
- `tests/services/contractUtils.test.ts` — 46 tests (validateContract, buildPayload, withRetry)
- `tests/services/contractMapper.test.ts` — 27 tests (mapContract, warning flags)
- `tests/services/contractFinancials2.test.ts` — 37 tests (tất cả pure functions)
- `tests/services/contractTagService.test.ts` — 19 tests (normalizeTag, ContractTagService)
- `tests/services/executionCostService.test.ts` — 13 tests (getAll, findOrCreate, bulkAdd)

### Task 3.2 — Tăng coverage lib ≥ 90% ✅

- `tests/lib/permissions.test.ts` — mở rộng 13 test cases mới, cover nhánh 149-150, 158-159
- `tests/hooks/useDebounce.test.ts` — 8 tests
- `tests/hooks/useColumnResize.test.ts` — 23 tests
- `tests/hooks/useInfiniteScroll.test.ts` — 15 tests

### Task 3.3 — Clean @ts-nocheck annotations ✅

Thêm comment giải thích vào tất cả file có `// @ts-nocheck`:
- `services/documentService.ts`
- `services/ai/openclaw/react-loop.ts`
- 11 file trong `services/ai/openclaw/tools/`

### Task 3.4 — Component tests ✅

- `tests/components/ErrorBoundary.test.tsx` — 8 tests
- `tests/components/ui/Modal.test.tsx` — 6 tests
- `tests/components/ui/ErrorState.test.tsx` — 6 tests
- `tests/components/CustomerForm.test.tsx` — 11 tests

### Task 3.5 — Pre-commit hook ✅

- Cài **husky v9.1.7** + **lint-staged v16.4.0**
- `.husky/pre-commit`: chạy `npx lint-staged`
- `package.json`: lint-staged chạy `tsc --noEmit` trên `*.{ts,tsx}`

### Task 3.6 — CI coverage gate ✅

- `scripts/check-coverage.cjs`: so sánh current vs baseline, exit 1 nếu drop >2 pp
- `coverage-baseline.json`: baseline lines=47.19%, stmts=42.95%
- `.github/workflows/ci.yml`: thêm bước "Coverage gate" sau `test:coverage`

---

## 4. Thống kê tổng

| Chỉ số | Giá trị |
|:-------|:-------:|
| Test files (tổng) | **33 files** |
| Tests pass | **542 tests** |
| Tests fail | 0 |
| Lines coverage | **47.19%** |
| Commits Phase 3 | 4 commits |

---

## 5. Ghi chú kỹ thuật

### Patterns quan trọng học được

**Mock pattern cho service tests:**
```ts
vi.mock('../../lib/dataClient', () => ({
    dataClient: { from: vi.fn(), rpc: vi.fn() },
}));
// Per test: (dataClient.from as any) = vi.fn().mockReturnValue({ ... })
```

**withRetry tests dùng real timers với baseDelay=0:**
```ts
const result = await withRetry(fn, { maxRetries: 1, baseDelay: 0 });
```

**Component form tests dùng fireEvent.submit để bypass native required validation:**
```ts
fireEvent.submit(document.querySelector('form')!);
await waitFor(() => expect(toast.error).toHaveBeenCalled());
```

**ErrorBoundary retry: cần thay đổi shouldThrow trước khi click retry:**
```ts
setShouldThrow!(false); // change before retry re-renders
fireEvent.click(screen.getByRole('button', { name: /Thử lại/i }));
```

---

## 6. Next: Phase 4 — Bundle & Performance

Xem `plans/260427-optimization-roadmap/phase-4-performance.md` để biết tasks tiếp theo:
- Vite bundle analysis + lazy loading
- TanStack Query deduplication
- Memoization cho heavy computations
