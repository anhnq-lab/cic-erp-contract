# Phase 2 — Refactor File "Thần"

- **Ưu tiên:** 🟠 P1
- **Thời lượng:** 5-7 ngày
- **Owner:** 2 FE
- **Phụ thuộc:** Phase 1 (cần generated types)
- **Trạng thái:** ⬜ Pending

---

## Mục tiêu

**Mọi file `.ts/.tsx` ≤ 600 LOC. File compose (page-level) ≤ 200 LOC.**

Đạt được 4 lợi ích đo được:

| Lợi ích | Cách đo |
|---|---|
| Dễ test hơn | Coverage mỗi file refactored ≥ 50% sau Phase 3 |
| Render nhanh hơn | React DevTools Profiler: thời gian render trang giảm ≥ 20% |
| Ít merge conflict | Đo bằng số conflict trong 1 tháng sau Phase 2 |
| Onboarding nhanh hơn | Dev mới hiểu 1 file < 30 phút (test bằng survey) |

---

## Vì sao file "thần" có hại

Bằng chứng cụ thể từ codebase:

- `components/tasks/TaskDetailPanel.tsx` — 2.258 LOC, có ~30 useState/useEffect → 1 thay đổi nhỏ trigger re-render toàn bộ.
- `components/AIAssistant.tsx` — 1.908 LOC, trộn UI chat + settings + provider config + key manager → 4 trách nhiệm trong 1 file.
- `services/contractService.ts` — 1.690 LOC, có cả CRUD + aggregation + workflow + validation → vi phạm SRP, khó mock test.
- `components/Analytics.tsx` — 1.172 LOC, có nhiều biểu đồ trong 1 component → khi cần thêm biểu đồ, phải đụng cả file.

---

## Danh sách file cần refactor

### Ưu tiên 1 (đụng nghiệp vụ hàng ngày)

#### 2.1 `TaskDetailPanel.tsx` (2.258 LOC)

**Phân tích trách nhiệm:**
1. Header (title, status, breadcrumb)
2. Tab navigation
3. Subtabs: Comments, Links, Time, Attachment, Subtasks, Dependencies, Approval
4. Action bar (assign, status change, due date)
5. Discussion / mention
6. Approval flow logic

**Đề xuất tách:**
```
components/tasks/task-detail/
├── TaskDetailPanel.tsx           ≤ 200 LOC (chỉ compose)
├── hooks/
│   └── useTaskDetail.ts          state + side effects
├── parts/
│   ├── TaskHeader.tsx
│   ├── TaskTabs.tsx
│   ├── TaskActionBar.tsx
│   └── TaskBreadcrumb.tsx
└── tabs/
    ├── SubtasksTab.tsx
    ├── DependenciesTab.tsx
    ├── ApprovalFlowTab.tsx
    ├── TaskCommentsTab.tsx       ✅ đã có
    ├── TaskLinksTab.tsx          ✅ đã có
    └── TaskTimeTab.tsx           ✅ đã có
```

**State management:**
- Nếu state phức tạp → dùng `useReducer` trong `useTaskDetail`.
- Hoặc tạo `TaskDetailContext` riêng cho panel này.

**DoD:**
- [ ] `TaskDetailPanel.tsx` ≤ 200 LOC
- [ ] Mỗi file trong `parts/` và `tabs/` ≤ 400 LOC
- [ ] Test `TaskDetailPanel.test.tsx` cơ bản pass (render, đổi tab)
- [ ] Không vỡ feature: tạo task, comment, gán người, đổi status

---

#### 2.2 `AIAssistant.tsx` (1.908 LOC)

**Phân tích trách nhiệm:**
1. Chat shell (layout, sidebar conversations)
2. Message list + render markdown
3. Composer (input, attach, send)
4. Settings drawer (~700 LOC) — provider config, model selector, key input
5. Welcome screen
6. Streaming logic
7. History persistence

**Đề xuất tách:**
```
components/ai-assistant/
├── AIAssistantPage.tsx           ≤ 200 LOC (compose)
├── store/
│   └── aiAssistantStore.ts       Zustand hoặc useReducer
├── chat/
│   ├── ChatShell.tsx
│   ├── ConversationList.tsx
│   ├── MessageList.tsx
│   ├── MessageItem.tsx
│   ├── Composer.tsx
│   └── StreamingIndicator.tsx
├── settings/
│   ├── SettingsDrawer.tsx
│   ├── ProviderConfig.tsx        OpenAI / Gemini / DeepSeek / Local
│   ├── KeyManager.tsx
│   └── ModelSelector.tsx
└── welcome/
    └── WelcomeScreen.tsx
```

**Lưu ý:**
- Tách store ra giúp test settings độc lập với chat.
- KeyManager phải đọc/ghi qua hàm an toàn (không log key ra console).

**DoD:**
- [ ] `AIAssistantPage.tsx` ≤ 200 LOC
- [ ] Mỗi file con ≤ 400 LOC
- [ ] Test settings save/load
- [ ] Stream message vẫn smooth, không lag

---

#### 2.3 `services/contractService.ts` (1.690 LOC)

**Hiện trạng:** Folder `services/contract/` đã có sẵn (`contractFinancials.ts`, `contractMapper.ts`, `contractRelations.ts`, `contractUtils.ts`, `index.ts`). Cần tiếp tục tách.

**Đề xuất:**
```
services/contract/
├── index.ts                       barrel re-export
├── queries.ts                     getById, list, search
├── mutations.ts                   create, update, delete
├── aggregates.ts                  stats, totals, kpi
├── workflow.ts                    approval, status transitions
├── validators.ts                  business rules validation
├── contractMapper.ts              ✅ đã có
├── contractRelations.ts           ✅ đã có
├── contractFinancials.ts          ✅ đã có
└── contractUtils.ts               ✅ đã có
```

**Quy tắc:**
- Public API qua `index.ts` (re-export). Consumer import từ `services/contract`.
- Không file nào > 400 LOC.

**DoD:**
- [ ] `services/contractService.ts` xóa hoặc còn ≤ 100 LOC (chỉ legacy re-export)
- [ ] Mỗi file trong `services/contract/` ≤ 400 LOC
- [ ] Mọi consumer import qua `services/contract` (không import trực tiếp file con)
- [ ] Test contract service pass

---

#### 2.4 `services/taskService.ts` (1.416 LOC)

**Đề xuất:**
```
services/task/
├── index.ts
├── queries.ts                     getById, list by entity
├── mutations.ts                   create, update, delete
├── visibility.ts                  hierarchical scope logic
├── links.ts                       task-entity links
├── hierarchy.ts                   parent/subtask logic
└── taskMapper.ts
```

**DoD:** Như 2.3.

---

### Ưu tiên 2 (đụng UI nhiều)

#### 2.5 `components/Analytics.tsx` (1.172 LOC)

**Đề xuất:**
```
components/analytics/
├── AnalyticsPage.tsx              ≤ 200 LOC
├── filters/
│   └── DateRangeFilter.tsx
├── widgets/
│   ├── KpiCards.tsx
│   ├── RevenueChart.tsx
│   ├── ContractsChart.tsx
│   ├── UnitMatrix.tsx
│   └── TopCustomersTable.tsx
└── drilldown/
    └── DrillDownModal.tsx
```

#### 2.6 `components/PaymentForm.tsx` (1.042 LOC)

**Đề xuất:**
```
components/payment-form/
├── PaymentForm.tsx                ≤ 200 LOC
├── hooks/
│   └── usePaymentForm.ts          validation + submit logic
└── sections/
    ├── BasicInfoSection.tsx
    ├── ScheduleSection.tsx
    ├── TaxSection.tsx
    ├── AttachmentSection.tsx
    └── HistorySection.tsx
```

#### 2.7 `components/contract-detail/ContractOverviewTab.tsx` (1.188 LOC)

**Đề xuất:**
```
components/contract-detail/overview/
├── OverviewTab.tsx                ≤ 200 LOC
├── HeaderCard.tsx
├── FinancialsCard.tsx
├── PartiesCard.tsx
├── TimelineCard.tsx
└── NotesCard.tsx
```

#### 2.8 `components/ContractDetail.tsx` (1.080 LOC)

Đa phần đã có `components/contract-detail/`. Tiếp tục di chuyển tabs còn lại vào folder.

#### 2.9 `components/ContractList.tsx` (1.048 LOC)

**Đề xuất:**
```
components/contract-list/
├── ContractListPage.tsx           ≤ 200 LOC
├── Toolbar.tsx
├── Filters.tsx
├── ContractTable.tsx              wrap virtualized
├── BulkActions.tsx
└── ImportExportMenu.tsx
```

---

### Ưu tiên 3 (đụng ít nhưng vẫn cần làm)

| File | LOC | Folder đích |
|---|---|---|
| `components/Dashboard.tsx` | 956 | `components/dashboard/` |
| `components/DocumentManager.tsx` | 931 | `components/document-manager/` (đã có) |
| `services/contractTaskDefinitionService.ts` | 947 | `services/contract-task-definition/` |
| `services/ai/gateway.ts` | 953 | `services/ai/gateway/` |
| `components/tasks/TasksPage.tsx` | 994 | `components/tasks/page/` |
| `components/ProductList.tsx` | 908 | `components/product-list/` |
| `components/ContractForm.tsx` | 916 | `components/contract-form/` (đã có) |

---

### Ngoại lệ (giữ nguyên)

- `components/LazyPages.tsx` (1.011 LOC) — chỉ là index lazy import, không phải logic. **Giữ nguyên.**
- `services/pakdExcelParser.ts` (1.081 LOC) — parser Excel có nhiều rule nghiệp vụ, có thể tách nhưng độ phức tạp cao. **Cân nhắc tách phase sau.**

---

## Quy trình refactor an toàn cho mỗi file

Tuân thủ **5 bước** để không vỡ production:

### Bước 1: Snapshot test trước
- Viết 1-2 integration test cho hành vi quan trọng nhất.
- Ví dụ TaskDetailPanel: test "render task có 3 subtasks", "đổi status từ Draft → InProgress".
- Test phải pass trước khi bắt đầu refactor.

### Bước 2: Move-only refactor (không đổi logic)
- Cắt code thành file mới.
- Giữ nguyên function signature, props, state.
- Re-export qua barrel `index.ts`.
- Build + test sau mỗi cắt — pass thì commit.
- **Mỗi commit là 1 cắt có thể rollback độc lập.**

### Bước 3: Re-export public API
- Consumer code không phải đổi import.
- Ví dụ: `services/contractService.ts` chỉ còn 1 dòng `export * from './contract';`

### Bước 4: Tối ưu render (commit riêng)
- `React.memo` cho component được tách ra.
- `useMemo` / `useCallback` cho prop function.
- Split context nếu state cũ có nhiều consumer.

### Bước 5: Xóa code chết (commit cuối)
- Sau khi consumer dùng API mới ổn định, xóa re-export tạm.
- Xóa file gốc nếu rỗng.

---

## Tiêu chí done của Phase 2 (Exit Criteria)

- ✅ Không file `.ts/.tsx` nào > 600 LOC. Verify:
  ```bash
  find . -path ./node_modules -prune -o \( -name "*.ts" -o -name "*.tsx" \) -print | \
    xargs wc -l | awk '$1 > 600 && $2 != "total"'
  ```
  Output rỗng (trừ `LazyPages.tsx` ngoại lệ).
- ✅ Mọi test trước refactor vẫn xanh sau refactor.
- ✅ Bundle main chunk không tăng > 5% (đo bằng visualizer trước/sau).
- ✅ Build production pass.
- ✅ Manual smoke test: contract list, contract detail, payment form, task panel, AI assistant — mọi hành vi cũ hoạt động.
- ✅ React DevTools Profiler: render time của 3 trang (`/contracts`, `/tasks`, `/ai-assistant`) giảm ≥ 15% so với trước refactor.

---

## Rủi ro & Mitigation

| Rủi ro | Mitigation |
|---|---|
| Vỡ feature production sau khi merge | Mỗi file refactor 1 PR riêng, deploy canary 1-2 ngày trước rollout đại trà |
| Re-export tạm lâu không xóa → lộn xộn | Đặt deadline xóa re-export ở Phase 3 cuối |
| Conflict với feature branch khác đang phát triển | Communicate trước, hoãn merge feature lớn trong tuần refactor |
| Performance giảm do thêm React.memo sai chỗ | Đo trước/sau bằng Profiler, rollback nếu giảm |

---

## Tham chiếu

- [components/tasks/TaskDetailPanel.tsx](../../components/tasks/TaskDetailPanel.tsx)
- [components/AIAssistant.tsx](../../components/AIAssistant.tsx)
- [services/contractService.ts](../../services/contractService.ts)
- [services/taskService.ts](../../services/taskService.ts)
- [services/contract/](../../services/contract/)
