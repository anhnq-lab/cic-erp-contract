# TÀI LIỆU HƯỚNG DẪN SỬ DỤNG
## HỆ THỐNG QUẢN LÝ TÀI LIỆU SỐ (DOCUMENT MANAGER)

**Phiên bản:** 1.0  
**Ngày phát hành:** 12/02/2026  
**Đơn vị áp dụng:** Toàn thể CBNV Công ty CIC

---

## MỤC LỤC
1.  [Tổng quan hệ thống](#1-tổng-quan-hệ-thống)
2.  [Cấu trúc lưu trữ dữ liệu](#2-cấu-trúc-lưu-trữ-dữ-liệu)
3.  [Quy định phân quyền](#3-quy-định-phân-quyền)
4.  [Hướng dẫn thao tác trên phần mềm](#4-hướng-dẫn-thao-tác-trên-phần-mềm)
5.  [Câu hỏi thường gặp & Xử lý sự cố](#5-câu-hỏi-thường-gặp--xử-lý-sự-cố)

---

## 1. TỔNG QUAN HỆ THỐNG

### 1.1. Giới thiệu
**Document Manager** là module trung tâm của hệ thống CIC ERP, được thiết kế để số hóa toàn bộ quy trình lưu trữ và quản lý hồ sơ dự án. Hệ thống tích hợp trực tiếp với Google Drive Enterprise, đảm bảo tính bảo mật, đồng bộ và khả năng truy cập linh hoạt.

### 1.2. Lợi ích chính
*   ✅ **Tập trung hóa:** Loại bỏ tình trạng lưu file rải rác trên máy tính cá nhân.
*   ✅ **Truy xuất nhanh:** Tìm kiếm hợp đồng, báo cáo chỉ trong vài giây.
*   ✅ **Bảo mật cao:** Phân quyền chi tiết theo chức vụ và đơn vị công tác.
*   ✅ **Đồng bộ:** Dữ liệu được cập nhật tức thời giữa ERP và Google Drive.

---

### 2. Cấu trúc LƯU TRỮ DỮ LIỆU

Hệ thống tuân thủ cấu trúc thư mục chuẩn hóa (Standardized Folder Structure) để đảm bảo sự ngăn nắp và dễ dàng tra cứu.

### Sơ đồ tổ chức thư mục

**1. Thư mục Gốc (Root):** `CIC-Document`

**2. Thư mục Tài nguyên Chung:**
*   📂 `_Templates`: Chứa các biểu mẫu, quy trình, hướng dẫn sử dụng chung.
*   📂 `_BaoCaoTongHop`: Nơi lưu trữ các báo cáo tổng hợp định kỳ của công ty.

**3. Thư mục Đơn vị (Business Units):**
Mỗi Trung tâm/Chi nhánh sẽ có một không gian lưu trữ riêng biệt với cấu trúc con:

```
CIC-Document/
├── [Tên Đơn Vị] (Ví dụ: TT-BIM, TT-TVTK...)
│   ├── 📁 Hợp đồng (Chứa hồ sơ theo từng hợp đồng)
│   │   └── [Năm]
│   │       └── [Mã Hợp Đồng]_[Tên Dự Án]
│   │           ├── 📁 PAKD (Phương án kinh doanh)
│   │           ├── 📁 HoaDon (Hóa đơn, chứng từ)
│   │           └── 📄 Các file hợp đồng, phụ lục...
│   ├── 📁 Báo cáo (Báo cáo định kỳ của đơn vị)
│   └── 📁 Templates (Biểu mẫu dùng chung của đơn vị)
```

| Tên Thư mục | Mô tả nội dung | Ví dụ |
| :--- | :--- | :--- |
| **HopDong** | Hồ sơ Hợp đồng (Gốc) | `.../HopDong/2026/HD_001_VinGroup` |
| ↳ **PAKD** | Hồ sơ PAKD (nằm trong Hợp đồng) | `.../HD_001.../PAKD` |
| ↳ **HoaDon** | Hóa đơn (nằm trong Hợp đồng) | `.../HD_001.../HoaDon` |
| **BaoCao** | Báo cáo nội bộ của đơn vị | `.../BaoCao/Tuan_01` |
| **Templates** | Biểu mẫu đặc thù của đơn vị | `.../Templates/Mau_Bao_Gia` |

**4. Thư mục Hành chính (Admin Units):**
Dành cho các phòng ban quản lý (HĐQT, BGĐ, HCNS, TCKT):
*   📂 `VanBan`: Văn bản đi/đến, Quyết định, Tờ trình.
*   📂 `BaoCao`: Báo cáo quản trị.
*   📂 `Templates`: Biểu mẫu hành chính.

---

## 3. QUY ĐỊNH PHÂN QUYỀN

Quyền truy cập được cấp dựa trên vai trò (Role-based Access Control):

*   👑 **Ban Lãnh đạo:** Quyền **Toàn quyền** (Xem/Sửa/Xóa) trên toàn bộ hệ thống.
*   👤 **Trưởng Đơn vị:** Quyền **Quản lý** (Xem/Sửa/Tải lên) trong thư mục Đơn vị mình và thư mục Chung.
*   👥 **Nhân viên:** Quyền **Tác nghiệp** (Xem/Tải lên) trong các dự án được phân công.
*   🔒 **IT/Admin:** Quyền cấu hình hệ thống, không can thiệp vào nội dung nghiệp vụ.

---

## 4. HƯỚNG DẪN THAO TÁC TRÊN PHẦN MỀM

### 4.1. Truy cập Module Tài liệu
1.  Đăng nhập vào hệ thống ERP tại địa chỉ nội bộ.
2.  Trên thanh Menu bên trái, chọn mục **Tài liệu** (Biểu tượng: 📂).

### 4.2. Giao diện Dashboard Quản lý
Giao diện được thiết kế hiện đại với 3 khu vực chính:

#### A. Khu vực Truy cập Nhanh (Quick Access)
Nằm ở phía trên cùng, chứa các lối tắt đến tài liệu thường dùng:
*   **Biểu mẫu chung:** Truy cập nhanh kho biểu mẫu công ty.
*   **Báo cáo tổng hợp:** Xem các báo cáo mới nhất.

#### B. Khu vực Hồ sơ Đơn vị (Unit Grid)
Hiển thị danh sách các Đơn vị dưới dạng thẻ (Card):
*   Dễ dàng nhận diện đơn vị qua Tên và Mã màu.
*   **Thao tác nhanh:**
    *   Click vào **PAKD** để mở hồ sơ Phương án.
    *   Click vào **Hợp đồng** để mở kho Hợp đồng.
    *   Click vào icon ↗ để mở thư mục gốc của đơn vị trên giao diện Google Drive Web.

#### C. Thanh Tìm kiếm & Lọc
*   Nhập từ khóa (Tên đơn vị, Mã phòng ban) vào ô tìm kiếm để lọc ngay lập tức.

### 4.3. Tải lên Tài liệu vào Hợp đồng
Quy trình upload file chuẩn:

1.  Vào module **Quan lý Hợp đồng**.
2.  Mở chi tiết Hợp đồng cần bổ sung hồ sơ.
3.  Tìm đến phần **Tài liệu đính kèm**.
4.  Nhấn nút **Tải lên Drive** (Upload to Drive).
5.  Chọn file từ máy tính (Hỗ trợ PDF, Word, Excel, Ảnh).
    *   *Hệ thống sẽ tự động đặt tên file và đưa vào đúng thư mục Năm/Hợp đồng tương ứng.*

---

## 5. CÂU HỎI THƯỜNG GẶP & XỬ LÝ SỰ CỐ

**Q: Tại sao tôi không thấy nút "Tài liệu" trên menu?**
A: Vui lòng kiểm tra lại quyền hạn tài khoản. Liên hệ IT nếu bạn cho rằng đây là lỗi.

**Q: Tôi nhận được thông báo "Bạn cần quyền truy cập" (You need permission)?**
A: Email Google của bạn chưa được share vào folder này. Hãy gửi yêu cầu cấp quyền cho Trưởng bộ phận.

**Q: Làm sao để tạo folder cho đơn vị mới?**
A: Vào mục **Cài đặt (Settings)** -> **Google Drive** -> Nhấn nút **"Khởi tạo cấu trúc"**. Hệ thống sẽ tự động tạo đầy đủ các folder còn thiếu.

---
**Bộ phận Hỗ trợ Kỹ thuật CIC ERP**
Hotline: 09x.xxx.xxxx | Email: it-support@cic.com.vn
