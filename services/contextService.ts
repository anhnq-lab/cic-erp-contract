import { ContractsAPI, UnitsAPI, PaymentsAPI } from './api';

export const getBusinessContext = async (): Promise<string> => {
    try {
        // Parallel fetch for speed
        const [stats, units, paymentsStats] = await Promise.all([
            ContractsAPI.getStats({}),
            UnitsAPI.getAll(),
            PaymentsAPI.getStats({})
        ]);

        const unitNames = units.map(u => `- ${u.name} (Code: ${u.code})`).join('\n');

        // Format large numbers
        const formatCurrency = (val: number) => new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(val);

        return `
=== DỮ LIỆU HỆ THỐNG THỜI GIAN THỰC (Cập nhật: ${new Date().toLocaleString('vi-VN')}) ===

1. TỔNG QUAN HỢP ĐỒNG:
- Tổng số lượng: ${stats.totalContracts}
- Tổng giá trị ký kết: ${formatCurrency(stats.totalValue)}
- Tổng doanh thu thực tế ghi nhận: ${formatCurrency(stats.totalRevenue)}
- Lợi nhuận tạm tính: ${formatCurrency(stats.totalProfit)}

2. TÌNH HÌNH THANH TOÁN (CASHFLOW):
- Tổng tiền đã về (Paid): ${formatCurrency(paymentsStats.paidAmount)}
- Công nợ/Chờ thanh toán (Pending): ${formatCurrency(paymentsStats.pendingAmount)}
- Nợ quá hạn (Overdue): ${formatCurrency(paymentsStats.overdueAmount)}

3. DANH SÁCH ĐƠN VỊ TRỰC THUỘC:
${unitNames}

LƯU Ý QUAN TRỌNG:
- Đây là dữ liệu tổng hợp toàn công ty.
- Nếu người dùng hỏi về đơn vị cụ thể, hãy giả định dựa trên tên đơn vị trong danh sách trên.
- Nếu cần số liệu chi tiết của từng đơn vị (VD: Doanh thu của Xưởng 1), hãy trả lời dựa trên các báo cáo chi tiết mà người dùng cung cấp hoặc hướng dẫn họ vào Dashboard lọc theo đơn vị đó.
==================================================
`;
    } catch (error) {
        console.error("Context Fetch Error", error);
        return "⚠️ (Không thể tải dữ liệu hệ thống lúc này)";
    }
};
