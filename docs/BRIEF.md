# 💡 BRIEF: AI Workforce Platform cho CIC

**Ngày tạo:** 2026-02-05  
**Brainstorm dựa trên:** Tài liệu "Xây dựng AI Workforce trên Antigravity" + Knowledge Items hiện có

---

## 1. VẤN ĐỀ CẦN GIẢI QUYẾT

### Thách thức hiện tại của CIC:
| STT | Pain Point | Mô tả chi tiết | Tần suất | Độ ưu tiên |
|-----|------------|----------------|----------|------------|
| 1 | **Hỗ trợ kỹ thuật lặp lại** | Trả lời câu hỏi phần mềm Revit, Navisworks, AutoCAD cho khách hàng | Hàng ngày | ⭐⭐⭐ |
| 2 | **Lập báo giá phức tạp** | Tính toán license, cấu hình theo nhu cầu khách | Hàng tuần | ⭐⭐⭐ |
| 3 | **Soạn thảo Proposal BIM** | Đề xuất tư vấn triển khai BIM cho dự án | 2-3 lần/tháng | ⭐⭐ |
| 4 | **Theo dõi hợp đồng** | Quản lý tiến độ thanh toán, gia hạn license | Liên tục | ⭐⭐ |
| 5 | **Onboarding nhân viên mới** | Đào tạo sản phẩm, quy trình nội bộ | Không thường xuyên | ⭐ |

### Root Cause Analysis:
- **Kiến thức nằm trong đầu nhân viên** → Khó scale, rủi ro khi nhân viên nghỉ
- **Quy trình không chuẩn hóa** → Mỗi người làm một kiểu, chất lượng không đồng đều
- **Dữ liệu phân tán** → Khó truy xuất nhanh khi cần

---

## 2. GIẢI PHÁP ĐỀ XUẤT: KWSR Framework

### Khung tư duy KWSR (Knowledge → Workflow → Skill → Rule)

```
┌─────────────────────────────────────────────────────────────────┐
│                     AI WORKFORCE EVOLUTION                       │
├─────────────────────────────────────────────────────────────────┤
│                                                                  │
│   📚 KNOWLEDGE        🔄 WORKFLOW        🎯 SKILL        🛡️ RULE │
│   (Khám phá)         (Chuẩn hóa)       (Chuyên sâu)    (Kiểm soát)│
│        │                  │                 │              │     │
│        ▼                  ▼                 ▼              ▼     │
│   Tích lũy          Lặp lại >3 lần    Đòi hỏi chất    Ranh giới │
│   kinh nghiệm       → Thành SOP       lượng cao       an toàn   │
│                                                                  │
└─────────────────────────────────────────────────────────────────┘
```

### Thiết kế KWSR cho CIC:

#### 📚 KNOWLEDGE - Tri thức tích lũy
```text
01_Inputs/
├── San_Pham/
│   ├── Revit_Versions.md       # So sánh tính năng các phiên bản
│   ├── Navisworks_Guide.md     # Hướng dẫn sử dụng
│   └── Bang_Gia_2026.xlsx      # Bảng giá niêm yết (chỉ giá bán)
├── BIM_Standards/
│   ├── ISO_19650_Summary.md    # Tiêu chuẩn quản lý thông tin BIM
│   └── VN_BIM_Guidelines.md    # Quy chuẩn áp dụng tại Việt Nam
├── Case_Studies/
│   ├── Truong_Chinh_Tri.md     # Dự án Trường Chính trị Trần Phú
│   └── Template_BEP.docx       # BIM Execution Plan mẫu
└── Internal/
    └── Chinh_Sach_CIC.md       # Quy định nội bộ
```

#### 🔄 WORKFLOW - Quy trình chuẩn hóa
| Workflow | Mô tả | Các bước |
|----------|-------|----------|
| `/bao-gia` | Lập báo giá phần mềm | 1. Nhận yêu cầu → 2. Tra bảng giá → 3. Tính license → 4. Xuất PDF |
| `/proposal` | Soạn đề xuất tư vấn BIM | 1. Phân tích yêu cầu → 2. Tra case study → 3. Áp template → 4. Review |
| `/ho-tro-ky-thuat` | Trả lời câu hỏi kỹ thuật | 1. Xác định sản phẩm → 2. Tra knowledge base → 3. Trả lời có nguồn |
| `/bao-cao-tuan` | Báo cáo tiến độ hàng tuần | 1. Tổng hợp tasks → 2. Định dạng CIC → 3. Xuất báo cáo |

#### 🎯 SKILL - Kỹ năng chuyên sâu
```text
.agent/skills/
├── bao-cao-cic/
│   └── SKILL.md    # Auto format: Times New Roman, logo CIC, căn lề chuẩn
├── viet-proposal-bim/
│   └── SKILL.md    # Ngôn ngữ chuyên ngành, cấu trúc đề xuất chuẩn ISO
└── phan-tich-hop-dong/
    └── SKILL.md    # Trích xuất điều khoản quan trọng từ hợp đồng
```

#### 🛡️ RULE - Ranh giới an toàn
| Rule | Mô tả |
|------|-------|
| **Bảo mật khách hàng** | KHÔNG gửi thông tin dự án/khách ra email ngoài @cic.com.vn |
| **Bảo vệ giá vốn** | KHÔNG tiết lộ giá nhập license, chỉ dùng giá niêm yết |
| **Dữ liệu gốc** | KHÔNG chỉnh sửa file trong 01_Inputs, chỉ làm việc trên bản sao |
| **Xác nhận quan trọng** | Yêu cầu confirm trước khi gửi email đến khách hàng |

---

## 3. ĐỐI TƯỢNG SỬ DỤNG

### Primary Users:
| Vai trò | Cách sử dụng AI Workforce |
|---------|---------------------------|
| **Sales/Account Manager** | Dùng `/bao-gia`, `/proposal` để phản hồi nhanh cho khách |
| **Technical Support** | Dùng `/ho-tro-ky-thuat` để trả lời câu hỏi sản phẩm |
| **Project Manager** | Dùng `/bao-cao-tuan` để báo cáo tiến độ dự án |

### Secondary Users:
| Vai trò | Cách sử dụng |
|---------|--------------|
| **Giám đốc** | Review báo cáo tổng hợp, dashboard |
| **Kế toán** | Tra cứu thông tin hợp đồng, thanh toán |
| **Nhân viên mới** | Onboarding, học sản phẩm |

---

## 4. NGHIÊN CỨU THỊ TRƯỜNG

### Xu hướng AI Workforce 2026:
| Xu hướng | Mô tả | Áp dụng cho CIC |
|----------|-------|-----------------|
| **RAG (Retrieval Augmented Generation)** | AI truy xuất tài liệu nội bộ để trả lời | Knowledge Base |
| **Workflow Automation** | Tự động hóa quy trình lặp lại | Workflows |
| **Multi-Agent Systems** | Nhiều AI chuyên biệt phối hợp | Skill-based agents |

### So sánh giải pháp:
| Giải pháp | Ưu điểm | Nhược điểm | Phù hợp CIC? |
|-----------|---------|------------|--------------|
| **ChatGPT/Claude trực tiếp** | Dễ dùng, linh hoạt | Không nhớ context, không tùy chỉnh sâu | ❌ |
| **Custom LLM App** | Kiểm soát hoàn toàn | Tốn thời gian phát triển | ⚠️ |
| **Antigravity Framework** | KWSR methodology, file-based, dễ maintain | Cần cài đặt ban đầu | ✅ |

### Điểm khác biệt của Antigravity:
1. **File-based Knowledge**: Dữ liệu nằm trong file Markdown/CSV, dễ backup và version control
2. **Progressive Enhancement**: Từ Knowledge → Workflow → Skill → Rule theo thời gian
3. **Two-way Evolution**: Có thể "unlearn" khi quy trình cũ không còn phù hợp

---

## 5. TÍNH NĂNG ĐỀ XUẤT

### 🚀 MVP (Phase 1 - Tuần 1-4):
- [ ] **Thiết lập Workspace chuẩn** - Cấu trúc 01_Inputs, 02_Process, 03_Outputs
- [ ] **Nạp Knowledge cơ bản** - Bảng giá, tài liệu sản phẩm, case studies
- [ ] **Workflow `/bao-gia`** - Tự động tra cứu và xuất báo giá
- [ ] **Cấu hình GEMINI.md** - Persona, tone, phong cách communication

### 🎁 Phase 2 (Tháng 2):
- [ ] **Workflow `/proposal`** - Soạn đề xuất tư vấn BIM
- [ ] **Workflow `/ho-tro-ky-thuat`** - Trả lời FAQ sản phẩm
- [ ] **Skill `bao-cao-cic`** - Auto format báo cáo chuẩn CIC
- [ ] **Rule bảo mật** - Guardrails cho thông tin nhạy cảm

### 💭 Phase 3 (Tháng 3+):
- [ ] **Integration với CIC ERP** - Đọc dữ liệu hợp đồng, khách hàng từ Supabase
- [ ] **n8n Automation** - Tự động hóa notification, reminder
- [ ] **Dashboard AI Analytics** - Thống kê câu hỏi thường gặp, pain points mới

---

## 6. KIẾN TRÚC KỸ THUẬT (High-level)

```
┌───────────────────────────────────────────────────────────────────┐
│                        User Interface                              │
│    ┌─────────────┐  ┌─────────────┐  ┌─────────────────────────┐  │
│    │  CLI/Chat   │  │ CIC ERP UI  │  │  Slack/Teams Bot (v2)   │  │
│    └──────┬──────┘  └──────┬──────┘  └────────────┬────────────┘  │
└───────────┼────────────────┼──────────────────────┼───────────────┘
            │                │                      │
            ▼                ▼                      ▼
┌───────────────────────────────────────────────────────────────────┐
│                    Antigravity Agent Layer                         │
│  ┌───────────────────────────────────────────────────────────┐    │
│  │  KWSR Engine                                               │    │
│  │  ┌──────────┐ ┌──────────┐ ┌──────────┐ ┌──────────┐      │    │
│  │  │Knowledge │ │ Workflow │ │  Skill   │ │   Rule   │      │    │
│  │  │ Manager  │ │ Executor │ │ Matcher  │ │  Guard   │      │    │
│  │  └──────────┘ └──────────┘ └──────────┘ └──────────┘      │    │
│  └───────────────────────────────────────────────────────────┘    │
└───────────────────────────────────────────────────────────────────┘
            │                │                      │
            ▼                ▼                      ▼
┌───────────────────────────────────────────────────────────────────┐
│                      Data Layer                                    │
│   ┌─────────────┐  ┌─────────────┐  ┌─────────────────────────┐   │
│   │ File System │  │  Supabase   │  │   External APIs         │   │
│   │ (Markdown)  │  │ (CIC ERP)   │  │ (LLM, n8n, Email)       │   │
│   └─────────────┘  └─────────────┘  └─────────────────────────┘   │
└───────────────────────────────────────────────────────────────────┘
```

---

## 7. ƯỚC TÍNH SƠ BỘ

### Độ phức tạp theo Phase:
| Phase | Thời gian | Độ phức tạp | Deliverables |
|-------|-----------|-------------|--------------|
| Phase 1 | 2 tuần | 🟢 Đơn giản | Workspace + Knowledge + 1 Workflow |
| Phase 2 | 2 tuần | 🟡 Trung bình | 2 Workflows + 1 Skill + Rules |
| Phase 3 | 4+ tuần | 🔴 Phức tạp | Integration + Automation |

### Chi phí vận hành (ước tính):
| Hạng mục | Chi phí/tháng | Ghi chú |
|----------|---------------|---------|
| LLM API (Claude/GPT) | $50-100 | Tùy khối lượng sử dụng |
| Supabase (đã có) | $0 | Đã có sẵn từ CIC ERP |
| n8n (self-hosted) | $0 | Đã có sẵn |

---

## 8. RỦI RO VÀ GIẢI PHÁP

| Rủi ro | Tác động | Giải pháp |
|--------|----------|-----------|
| **Dữ liệu không đầy đủ** | AI trả lời sai/thiếu | Bắt đầu với scope nhỏ, mở rộng dần |
| **Người dùng không adopt** | Đầu tư lãng phí | Training, demo benefits rõ ràng |
| **Hallucination** | Mất uy tín với khách | RAG + Citation + Human review |
| **Bảo mật dữ liệu** | Rò rỉ thông tin | Rule guardrails + Audit log |

---

## 9. BƯỚC TIẾP THEO

```
┌─────────────────────────────────────────────────────────────┐
│                    NEXT ACTIONS                              │
├─────────────────────────────────────────────────────────────┤
│                                                              │
│  1️⃣  /plan  → Lên thiết kế chi tiết Phase 1                  │
│                                                              │
│  2️⃣  Sửa BRIEF → Anh cần điều chỉnh [phần nào]              │
│                                                              │
│  3️⃣  Lưu lại → Cần thêm thời gian suy nghĩ                  │
│                                                              │
└─────────────────────────────────────────────────────────────┘
```

---

## 📎 Tài liệu tham khảo
- [KWSR Framework](file:///C:/Users/Personal/.gemini/antigravity/knowledge/antigravity_workflow_framework/artifacts/ai_workforce/kwsr_framework.md)
- [Technical Implementation](file:///C:/Users/Personal/.gemini/antigravity/knowledge/antigravity_workflow_framework/artifacts/ai_workforce/technical_implementation.md)
- [CIC Implementation Plan](file:///C:/Users/Personal/.gemini/antigravity/knowledge/cic_platform_master_guide/artifacts/strategy/ai_workforce_implementation.md)
- [Industry Use Cases](file:///C:/Users/Personal/.gemini/antigravity/knowledge/antigravity_workflow_framework/artifacts/ai_workforce/industry_use_cases.md)
