# 🤖 Đánh giá Toàn diện Hệ thống AI Agent (OpenClaw) — CIC ERP

> Phiên bản: 2026-05-31 · Phạm vi: `services/ai/**`, 10 agent, 52 tools, gateway đa model, edge functions.
> Tài liệu này **bổ sung** cho `ai_audit_report.md` (thiên về bảo mật) và `walkthrough_AI.md`, tập trung vào **đánh giá kỹ từng tool** và các **bug đã kiểm chứng**.

---

## 1. Tóm tắt điều hành

| Hạng mục | Đánh giá | Ghi chú |
|---|:---:|---|
| Kiến trúc tách lớp (gateway/agent/tools) | 🟢 Tốt | Sạch, dễ mở rộng |
| Phân quyền nhiều tầng (toolAcl + permissionGuard) | 🟡 Khá | Chạy client-side → cần RLS làm biên thật |
| Chất lượng tool (52 tool) | 🟡 Khá | Đồng đều, nhưng có **6 bug đã xác minh** + lộn xộn import |
| Độ tin cậy vòng lặp ReAct | 🟠 Cần sửa | Multi-step bị cắt khi stream; delegate đệ quy không chặn ngân sách |
| Bảo mật key & dữ liệu | 🔴 Rủi ro | Key bundle ở client; vài tool bỏ qua unit-scope |
| Khả năng bảo trì | 🟡 Khá | `@ts-nocheck` toàn bộ tool, prompt lặp, import rác |

**Điểm số tổng thể: 6.5/10** — nền tảng tốt, nhưng có một số bug chức năng thật và rủi ro biên an ninh cần xử lý.

---

## 2. Kiến trúc tổng quan

```
UI (AIAssistant / UnitAgentChat / ChatWidget)
  └─ runReActLoop()  ◄── CHẠY TRONG BROWSER
       ├─ routeUserToAgentFilter()         chọn agent theo role/unit
       ├─ agentConfig.allowedTools         lọc tool theo agent
       ├─ createGuardedTool()              toolAcl → sanitize unitId → AuditLogger
       ├─ callAgentTurn()/streamChat()     gateway: vLLM Qwen → fallback Gemini
       └─ tool.execute()                   Supabase trực tiếp / service layer
```

- **Mặc định model**: `qwen2.5-32b` (vLLM local), fallback `gemini-2.0-flash` bằng **API key cá nhân** của user.
- **Master Router** dùng `delegate_task_to_agent` để chạy ReAct loop con (đệ quy) cho sub-agent.
- **Observability**: `ai_logs` (token/cost/latency) + `ai_tool_audit_logs` (mọi lần gọi tool).

> ⚠️ Điểm kiến trúc quan trọng nhất: **toàn bộ agent + phân quyền + thực thi tool chạy ở client**. `permissionGuard`/`toolAcl` vì thế chỉ là “UX guard” và có thể bị bypass. **Biên an ninh thật BẮT BUỘC là RLS Supabase** — mục C5 của `ai_audit_report.md` ghi nhận RLS chưa bật đầy đủ → đây là rủi ro lớn nhất hệ thống.

---

## 3. 🐞 Các BUG đã kiểm chứng (ưu tiên sửa)

| # | Tool / File | Mô tả | Hậu quả | Mức |
|---|---|---|---|:---:|
| B1 | `get_payroll_summary` — `hrFinance.tools.ts:213` | Check `role === 'Director' \|\| role === 'AccountantChief'`. Hệ thống **không có** 2 role này (chỉ có `Leadership`/`ChiefAccountant`/`Admin`). | `isTopLevel` **luôn false** → tool luôn trả `🔒 không có quyền` kể cả với role hợp lệ trong ACL. Tool **hỏng hoàn toàn**. | 🔴 |
| B2 | `get_salary_insights` — `hrFinance.tools.ts:112` | Cùng lỗi tên role (`Director`/`AccountantChief`). | `Admin/Leadership/ChiefAccountant` bị chặn (`🔒`); chỉ `UnitLeader/AdminUnit` dùng được (phạm vi đơn vị). | 🔴 |
| B3 | `analyze_bottleneck` — `planning.tools.ts:159,184` | Đọc `tasks.assigned_to`, nhưng schema thực dùng mảng `tasks.assignees`. | `workloadMap` **luôn rỗng** → mục “Nhân viên quá tải” không bao giờ hiển thị. | 🟠 |
| B4 | `forecast_next_quarter` — `planning.tools.ts:261-262` | `select('value, revenue')` từ `contracts`, nhưng cột thực là `actual_revenue`/`expected_revenue` (không có `revenue`). | Phần **doanh thu trong dự báo luôn = 0**. | 🟠 |
| B5 | `create_smart_plan` & `analyze_bottleneck` — `planning.tools.ts:40-41,121,160,212` | `select('... name ...')` & dùng `c.name`; cột thực là `title`. | Link & tiêu đề task hiển thị `undefined` (vd: “Đốc thúc HĐ quá hạn: undefined”, `[undefined](/contracts/..)`). | 🟠 |
| B6 | `getEmployeeProfile360` — `hrExtended.tools.ts:278` | `role === 'AccountantChief'` (sai tên). Vô hại vì `canViewAll` đã bao trùm, nhưng là code chết gây nhầm. | Không lộ lương; chỉ là dead-code/nhầm lẫn. | 🟡 |

> Gốc rễ B1/B2/B6: **không dùng hằng số role tập trung**. Khuyến nghị import role từ `lib/permissions.ts` thay vì gõ chuỗi tay; `@ts-nocheck` đã che mất các lỗi này.

---

## 4. Đánh giá kỹ từng tool (52 tool)

Thang điểm: 🟢 tốt · 🟡 khá/cần dọn · 🟠 có vấn đề chức năng/bảo mật · 🔴 hỏng.

### 4.1 Nhóm Hợp đồng (`contract.tools.ts`)

| Tool | Nguồn dữ liệu | Phân quyền tool | Đánh giá |
|---|---|---|---|
| `search_contracts` | `ContractService.list` | `canViewAll`→ép `unitId`; limit≤100 | 🟢 Phân trang tốt, return object gọn |
| `get_contract_detail` | `ContractService.getById` | Check `data.unitId !== context.unitId` | 🟢 Có tính tiến độ, cờ rủi ro; rõ ràng |
| `get_contract_stats` | `ContractService.getStats` | ép `unitId` | 🟢 `fmtMoneyWithRaw` để chống làm tròn — tốt |
| `get_overdue_contracts` | Supabase trực tiếp (`payments`,`contracts`) | `getUnitFilter` | 🟡 Query trực tiếp; hard-code status string; limit 15 |
| `get_contract_expiry_timeline` | Supabase trực tiếp | `getUnitFilter` | 🟢 Markdown + phân nhóm urgency rõ |

### 4.2 Nhóm Tài chính (`finance.tools.ts`)

| Tool | Nguồn | Phân quyền | Đánh giá |
|---|---|---|---|
| `search_payments` | `PaymentService.list` | ép `unitIds` | 🟢 Gọn |
| `get_debt_report` | Supabase trực tiếp | `getUnitFilter` | 🟠 Sort O(n²) bằng `Object.values().find(v=>v.name===...)` (`:109-113`); gộp/so theo **tên KH** dễ trùng; nhánh `age` sort thiếu `return 0` |
| `get_cashflow_summary` | Supabase trực tiếp | `getUnitFilter` | 🟡 EXPENSE không phân biệt theo `contracts.unit_id` chuẩn; status hard-code |
| `get_revenue_forecast` | Supabase trực tiếp | `getUnitFilter` | 🟢 Logic tier rõ; ⚠️ trọng số 90/60/30% hard-code (`:268`) |
| `get_expense_breakdown` | Supabase trực tiếp | `getUnitFilter` | 🟢 Pie chart + bảng; tốt |
| `get_budget_variance_report` | `unit_targets` + `getStatsRPC` | `getUnitFilter` | 🟡 Gọi `getStatsRPC` trong vòng `for` từng đơn vị → N query tuần tự (chậm) |

### 4.3 Nhóm Nhân sự lõi (`hr.tools.ts`)

| Tool | Nguồn | Phân quyền | Đánh giá |
|---|---|---|---|
| `search_employees` | Supabase (`employees`→fallback `profiles`) | `getUnitFilter` | 🟡 Nội suy `term` thẳng vào `.or(name.ilike.%term%,...)` → rủi ro chèn cú pháp PostgREST nếu term có `,()` |
| `get_employee_ranking` | `EmployeeService.getWithStats` | ép `unitId` | 🟢 Có try/catch, lọc >0, sort theo tiêu chí |
| `get_employee_workload` | Supabase (`tasks.assignees`) | Lọc `allowedEmployeeIds` theo unit | 🟢 Dùng đúng `assignees` (mảng) — chuẩn |
| `get_hr_headcount_stats` | Supabase (`employees`,`job_openings`,`applications`) | `getUnitFilter` | 🟢 Báo cáo rất đầy đủ; xử lý linh hoạt thiếu cột `status`/`join_date` — tốt; dài 180 dòng |

### 4.4 Nhóm Nhân sự mở rộng (`hrExtended.tools.ts`)

| Tool | Nguồn | Phân quyền | Đánh giá |
|---|---|---|---|
| `get_leave_summary` | `LeaveService.getAllRequests` | `getUnitFilter` | 🟢 Gọn, rõ |
| `get_attendance_report` | Supabase (`attendance_records`,`overtime_requests`) | Lọc theo `employee.unit_id` | 🟢 Lọc unit sau truy vấn — ổn |
| `get_contract_labor_expiry` | Supabase (`employees`) | `getUnitFilter` | 🟢 Cảnh báo HĐLĐ rõ |
| `get_employee_profile_360` | Supabase + `EmployeeService` | Check `emp.unit_id` | 🟡 Tốt; có B6 (role string chết) ở phần lương |

### 4.5 Nhóm Nhân sự tài chính (`hrFinance.tools.ts`)

| Tool | Nguồn | Phân quyền | Đánh giá |
|---|---|---|---|
| `get_recruitment_pipeline` | Supabase (`job_openings`,`applications`) | (chỉ HR_ROLES qua ACL) | 🟢 Phễu + conversion + time-to-hire tốt |
| `get_salary_insights` | Supabase (`employees`,`employee_salary_history`) | Role check nội bộ | 🔴 **B2** — sai tên role chặn nhầm |
| `get_payroll_summary` | Supabase (`payroll_records`) | Role check nội bộ | 🔴 **B1** — sai tên role, hỏng hoàn toàn |
| `get_onboarding_status` | Supabase (`onboarding_sessions`) | (ACL) | 🟡 Không lọc theo unit (toàn công ty) |

### 4.6 Nhóm Khách hàng (`customer.tools.ts`)

| Tool | Nguồn | Phân quyền | Đánh giá |
|---|---|---|---|
| `search_customers` | `CustomerService.getAll` + Supabase | Lọc KH theo HĐ của unit | 🟡 Logic phân quyền tốt nhưng **map kết quả bị lặp code** 2 nhánh; file có **import trùng/rác** |
| `get_customer_360` | Supabase (nhiều bảng) | `getUnitFilter` cho HĐ | 🟢 Hồ sơ 360 đầy đủ, có đề xuất |

### 4.7 Nhóm Sản phẩm (`product.tools.ts`)

| Tool | Nguồn | Phân quyền | Đánh giá |
|---|---|---|---|
| `search_products` | `ProductService.list` | ACL `'*'` (public) | 🟢 Gọn |
| `get_brands_report` | `BrandService.getAllWithStats` | ACL gồm `UnitLeader` | 🟡 Báo cáo **toàn công ty**, không scope theo unit → UnitLeader thấy doanh thu hãng toàn cty (có thể ngoài ý muốn) |

### 4.8 Nhóm Dashboard (`dashboard.tools.ts`)

| Tool | Nguồn | Phân quyền | Đánh giá |
|---|---|---|---|
| `get_dashboard_kpi` | Supabase + `UnitService.getWithStats` | `args.unitId` (đã được guard sanitize) | 🟢 Hỗ trợ period Q/M; lọc `isBusinessUnit` |
| `get_comparative_report` | `ContractService.getStats` ×2 song song | `getUnitFilter` | 🟢 Trả 1 khối markdown + chart; rất tiện cho LLM |
| `get_unit_ranking` | `UnitService.getWithStats` | Chặn cứng nếu unit-scoped | 🟢 Đúng tinh thần “chỉ BLĐ” |
| `get_daily_briefing` | `dailyBriefingService` | — | 🟠 **Bỏ qua unit-scope hoàn toàn** (gọi `generateDailyBriefing()` không truyền context) → UnitLeader nhận briefing toàn công ty (rò rỉ) |
| `get_comprehensive_report` | `UnitService.getWithStats` + chart RPC | `getUnitFilter` | 🟢 Báo cáo tổng kết đầy đủ |
| `get_smart_insights` | Supabase song song | `getUnitFilter` (trừ tasks) | 🟡 Query `tasks` **không** lọc unit (tự nhận trong comment) → đếm task quá hạn lộ toàn cty |

### 4.9 Nhóm Hệ thống/Write (`system.tools.ts`)

| Tool | Nguồn | Phân quyền | Đánh giá |
|---|---|---|---|
| `create_task_ai` | `TaskService.create` | ACL ghi | 🟢 Có chống thiếu assignee |
| `approve_task` | `TaskService` | Check assignee/creator/role | 🟢 Kiểm tra quyền duyệt tốt |
| `export_document` | `marked` + Supabase Storage | ACL ghi | 🟠 Upload lên bucket **public** + chèn `<script src=cdn chart.js>` vào HTML; URL public ai có link đều đọc được → rủi ro rò rỉ báo cáo |
| `send_notification_email` | `NotificationService.createBulk` | ACL ghi | 🟡 Không xác thực `targetUserId` thuộc phạm vi quản lý của người gửi |

### 4.10 Nhóm Kế hoạch (`planning.tools.ts`)

| Tool | Nguồn | Phân quyền | Đánh giá |
|---|---|---|---|
| `create_smart_plan` | Supabase + `TaskService` | Role gate + `getUnitFilter` | 🟠 **B5** (`c.name` undefined); chống tạo trùng tốt; **tự tạo task không hỏi xác nhận** (rủi ro side-effect) |
| `analyze_bottleneck` | Supabase + `EmployeeService` | `getUnitFilter` | 🔴 **B3** (`assigned_to`) + **B5** (`c.name`) |
| `forecast_next_quarter` | Supabase | `getUnitFilter` | 🟠 **B4** (`revenue` không tồn tại) |

### 4.11 Nhóm Kiến thức (`knowledge.tools.ts`)

| Tool | Nguồn | Phân quyền | Đánh giá |
|---|---|---|---|
| `search_knowledge_base` | `ragService` | ACL `'*'` | 🟡 File có **import trùng/rác**; ⚠️ gọi `searchKnowledgeBase(query, 5)` (số) trong khi tool khác gọi với object `{limit,...}` → API không nhất quán |
| `search_document_registry` | `DocumentRegistryService` / RAG | ACL `'*'` | 🟢 Hỗ trợ cả text & vector search |

### 4.12 Nhóm Master (`master.tools.ts`)

| Tool | Nguồn | Phân quyền | Đánh giá |
|---|---|---|---|
| `delegate_task_to_agent` | ReAct loop con (đệ quy) | Check `allowedRoles` của agent đích | 🟠 Sub-agent **không có `allowedRoles`** (Master/BGD/Planning) → bỏ qua check; không giới hạn ngân sách token tổng; mỗi delegate = 1 loop ≤5 bước |

### 4.13 Nhóm Marketing (`marketingTools.ts`)

| Tool | Nguồn | Phân quyền | Đánh giá |
|---|---|---|---|
| `draft_social_post` | Supabase (`mkt_pipeline`,`mkt_social_posts`) | ACL `[Admin,Marketing]` | 🟢 |
| `schedule_social_post` | Supabase update | ACL | 🟢 |
| `analyze_seo_content` | Tính client (density) | ACL public | 🟢 Trả metric + instruction cho LLM |
| `generate_newsletter` | Supabase (`mkt_campaigns`) | ACL | 🟢 |
| `schedule_email_campaign` | Supabase update | ACL | 🟢 |
| `read_web_url` | Jina `r.jina.ai` | ACL | 🟠 Dùng `VITE_JINA_API_KEY` (lộ key client) |
| `web_search` | Jina `s.jina.ai` | ACL | 🟠 Lộ key client như trên |
| `save_lead` | Supabase (`mkt_leads`) | ACL | 🟢 |
| `get_leads` | Supabase (`mkt_leads`) | ACL | 🟡 Không scope `created_by`/owner → mọi MKT thấy mọi lead |

---

## 5. Vấn đề xuyên suốt (cross-cutting)

1. **`// @ts-nocheck` ở 15/15 file tool** → tắt kiểm tra type ngay tầng quan trọng nhất; chính nó che B1–B6.
2. **Import trùng & rác**: `customer.tools.ts`, `product.tools.ts`, `knowledge.tools.ts` lặp nguyên block import (kể cả `import type` 2 lần, import `marketingToolsRegistry`, `EmployeeService`… không dùng).
3. **Định dạng trả về không thống nhất**: chỗ trả `string` (markdown), chỗ `{ error }`, chỗ object dữ liệu → client/LLM khó xử lý đồng nhất.
4. **Hard-code rải rác**: status (`'Chưa thanh toán'/'Pending'/'Chờ thanh toán'`), trọng số forecast (90/60/30%), ngưỡng budget (30/80/100%), danh sách đơn vị loại trừ → nên gom `constants`/enum.
5. **~25-30% tool query Supabase trực tiếp** thay vì service → trùng logic “overdue/debt/group-by” và dễ vỡ khi đổi schema (B3/B4/B5 chính là hệ quả).
6. **Một số tool bỏ qua unit-scope** (`get_daily_briefing`, `get_smart_insights`-tasks, `get_onboarding_status`, `get_leads`) → rò rỉ phạm vi cho user unit-scoped.
7. **Không validate `args`** (chỉ dựa type hint + LLM) → nên thêm Zod ở `permissionGuard`.
8. **Prompt zero-hallucination ~30 dòng lặp gần nguyên văn trong 8 agent** → sửa 1 chỗ phải sửa 8 chỗ.

---

## 6. Khuyến nghị ưu tiên

| Mức | Hành động |
|:---:|---|
| 🔴 P0 | Sửa **B1/B2** (dùng hằng số role từ `lib/permissions.ts`): `Admin/Leadership/ChiefAccountant` cho payroll/salary. Hai tool này đang hỏng. |
| 🔴 P0 | **Bật RLS đầy đủ** trên `contracts/payments/employees/payroll_records/employee_salary_history/ai_*` — coi RLS là biên an ninh chính (vì agent chạy client-side). |
| 🔴 P0 | Đưa **key công ty ra khỏi client** (vLLM/Jina/OpenAI/DeepSeek qua proxy server), bỏ tiền tố `VITE_` cho secret. |
| 🟠 P1 | Sửa **B3/B4/B5** (đúng tên cột `assignees`/`title`/`actual_revenue`); thêm test schema cho planning tools. |
| 🟠 P1 | Vá unit-scope cho `get_daily_briefing`, `get_smart_insights` (tasks), `get_onboarding_status`, `get_leads`. |
| 🟠 P1 | Sửa cắt-ngắn multi-step khi streaming trong `react-loop.ts`; thêm **giới hạn ngân sách token tổng** cho cây `delegate_task_to_agent`. |
| 🟡 P2 | Bỏ `@ts-nocheck`, dọn import rác; gom constants/status/threshold; chuẩn hóa format trả về tool; khử trùng prompt. |
| 🟡 P2 | Cân nhắc storage **private + signed URL** cho `export_document` thay vì public bucket. |

---

## 7. Kết luận

Hệ thống AI Agent OpenClaw có **nền tảng kiến trúc tốt**, độ phủ nghiệp vụ rộng (52 tool trên 13 lĩnh vực), phân quyền/audit có chủ đích và chính sách chống ảo giác nghiêm. Tuy nhiên đợt rà soát phát hiện **6 bug chức năng đã kiểm chứng** (2 trong đó khiến tool lương/payroll hỏng hoàn toàn), một số **rò rỉ phạm vi đơn vị**, và rủi ro **biên an ninh client-side**. Ưu tiên xử lý nhóm P0 (bug role + RLS + key) sẽ nâng hệ thống từ mức “demo mạnh” lên “vận hành an toàn”.
