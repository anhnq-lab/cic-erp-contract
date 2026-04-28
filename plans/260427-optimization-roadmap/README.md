# Kế Hoạch Tối Ưu & Hoàn Thiện CIC ERP Contract

> **Mã kế hoạch:** `260427-optimization-roadmap`
> **Ngày tạo:** 2026-04-27
> **Người chủ trì:** Tech Lead
> **Trạng thái tổng:** 🟡 Draft (chờ phê duyệt khởi động Phase 0)

---

## Tóm tắt 1 phút

Sau ~15 tháng phát triển, dự án đạt quy mô lớn (~115K LOC, 88 components, 62 services, 120 migrations) nhưng phát sinh:

- **3 lỗ hổng bảo mật P0** — key/service-role có nguy cơ lộ ra client.
- **Coverage chỉ ~18%** ở module nghiệp vụ cốt lõi (contract/task/payment chỉ 2-5%).
- **7 file > 1.000 LOC** (lớn nhất 2.258) — vi phạm SRP, khó maintain.
- **813 chỗ `any`, 250 `console.log`, 16 `@ts-ignore`** trong code production.
- **120 migrations chưa squash**, schema chưa có generated types.

Kế hoạch chia **6 phase** (P0 → P5) trong **~7 tuần** với mục tiêu đo được rõ ràng.

---

## Cấu trúc tài liệu

| File | Nội dung |
|---|---|
| **[plan.md](plan.md)** | Kế hoạch tổng thể, OKR, lịch trình, rủi ro, KR đo lường |
| [phase-0-security.md](phase-0-security.md) | 🔴 Vá bảo mật khẩn cấp (1-2 ngày) |
| [phase-1-foundation.md](phase-1-foundation.md) | 🟠 Dọn dẹp + generated types + CI (3-5 ngày) |
| [phase-2-refactor.md](phase-2-refactor.md) | 🟠 Refactor file "thần" (5-7 ngày) |
| [phase-3-test.md](phase-3-test.md) | 🟡 Test coverage + Quality Gate (5-7 ngày) |
| [phase-4-performance.md](phase-4-performance.md) | 🟡 Performance + UX + Lighthouse (3-5 ngày) |
| [phase-5-ai-v2.md](phase-5-ai-v2.md) | 🟢 AI Platform v2 + Observability (5-7 ngày) |
| `reports/` | Báo cáo cuối mỗi tuần / mỗi phase (sẽ tạo khi triển khai) |

---

## OKR — Mục tiêu đo được

> Sau khi hoàn thành kế hoạch (cuối tuần 7), dự án phải đạt **TẤT CẢ** các KR sau:

| # | KR | Hiện tại | Mục tiêu |
|---|---|---|---|
| KR1 | Lỗ hổng bảo mật P0 | 3 | **0** |
| KR2 | Số lượng `: any` trong source | 813 | **< 200** |
| KR3 | Coverage statement (services) | 13% | **≥ 50%** |
| KR4 | File `.ts/.tsx` > 600 LOC | 7 | **0** |
| KR5 | `console.log` trong production bundle | 250 | **0** |
| KR6 | Bundle main chunk gzip | Chưa đo | **< 500KB** |
| KR7 | Lighthouse Performance (3 route chính) | Chưa đo | **≥ 80** |
| KR8 | CI gate (typecheck + test + build) | Không có | **Bắt buộc mọi PR** |

---

## Lịch trình tổng

```
Tuần 1  │ ▓▓▓ P0 Bảo mật            ▓▓▓▓▓▓ P1 Foundation
Tuần 2  │                           ▓▓▓ P1 ▓▓▓▓▓▓▓▓▓▓ P2 Refactor
Tuần 3  │                                  ▓▓▓▓▓▓▓▓▓▓▓ P2 Refactor
Tuần 4  │ ▓▓▓▓▓▓▓▓▓▓▓ P3 Test
Tuần 5  │ ▓▓▓▓▓ P3 ▓▓▓▓▓▓▓ P4 Performance
Tuần 6  │           ▓▓▓ P4 ▓▓▓▓▓▓▓▓▓▓▓ P5 AI v2
Tuần 7  │                  ▓▓▓▓▓▓▓▓▓▓▓▓▓▓ P5 AI v2
```

**Phụ thuộc cứng:**
- P0 → P1 (P1 sẽ đụng file P0 đang sửa).
- P1.2 (gen types) → P2 (refactor sẽ áp type mới).
- P2 → P3 (file nhỏ dễ test hơn).
- P3 (CI gate) → P4 + P5 (để PR sau không tụt coverage).

---

## Quyết định cần xác nhận trước khi khởi động

| # | Câu hỏi | Đề xuất |
|---|---|---|
| Q1 | Có rotate anon Supabase URL/key (đã hardcode trong git)? | **Có** — siết RLS triệt để hoặc đổi project |
| Q2 | Có chấp nhận downtime 5-10 phút khi rotate LiteLLM master key? | **Có** — làm ngoài giờ hành chính |
| Q3 | Squash migrations áp dụng cho production hay chỉ dev? | **Chỉ dev/staging** ở phase này, production sau khi staging chạy 1 tháng ổn |
| Q4 | Coverage 50% có quá tham vọng cho 1 sprint? | Có thể chia: P3 đạt 35% trước, P5.5 đẩy lên 50% |
| Q5 | Owner cho từng phase | **Cần phân công cụ thể** trước khi start |

---

## Tham chiếu nhanh

- Quy tắc dự án: [`RULES.md`](../../RULES.md)
- Phân quyền hệ thống: [`PHANQUYENHETHONG.md`](../../PHANQUYENHETHONG.md)
- Plan tiền nhiệm (đã đóng): [`plans/260126-backend-migration/plan.md`](../260126-backend-migration/plan.md)
- Source chính: [`services/`](../../services/), [`components/`](../../components/), [`lib/`](../../lib/)

---

**Ghi chú:** Đây là "living document". Mọi thay đổi phạm vi phải tạo PR sửa file `plan.md`, không sửa silently. Cuối mỗi tuần có 1 báo cáo trong `reports/wXX.md`.
