// Script to generate Excel template for employee import
// Run with: node generateTemplate.js

import * as XLSX from 'xlsx';

const headers = [
    'Mã nhân viên *',
    'Họ và tên *',
    'Email *',
    'Số điện thoại',
    'Mã đơn vị *',
    'Chức vụ',
    'Role *',
    'Ngày sinh (DD/MM/YYYY)',
    'Giới tính (Nam/Nữ/Khác)',
    'Số CCCD',
    'Địa chỉ',
    'Trình độ học vấn',
    'Ngày vào làm (DD/MM/YYYY)',
    'Loại hợp đồng',
    'Số tài khoản NH',
    'Tên ngân hàng'
];

const sampleData = [
    ['NV001', 'Nguyễn Văn A', 'nguyenvana@company.com', '0901234567', 'bim', 'Chuyên viên', 'NVKD', '15/03/1990', 'Nam', '001234567890', 'Hà Nội', 'Đại học', '01/01/2024', 'Chính thức', '1234567890', 'Vietcombank'],
    ['NV002', 'Trần Thị B', 'tranthib@company.com', '0909876543', 'css', 'Trưởng nhóm', 'UnitLeader', '20/07/1985', 'Nữ', '001234567891', 'TP.HCM', 'Thạc sĩ', '15/06/2023', 'Chính thức', '0987654321', 'Techcombank']
];

// Create workbook
const wb = XLSX.utils.book_new();

// Create worksheet with headers and sample data
const wsData = [headers, ...sampleData];
const ws = XLSX.utils.aoa_to_sheet(wsData);

// Set column widths
ws['!cols'] = [
    { wch: 15 }, // Mã NV
    { wch: 25 }, // Họ tên
    { wch: 30 }, // Email
    { wch: 15 }, // SĐT
    { wch: 12 }, // Mã đơn vị
    { wch: 20 }, // Chức vụ
    { wch: 15 }, // Role
    { wch: 20 }, // Ngày sinh
    { wch: 18 }, // Giới tính
    { wch: 15 }, // CCCD
    { wch: 30 }, // Địa chỉ
    { wch: 18 }, // Học vấn
    { wch: 22 }, // Ngày vào làm
    { wch: 15 }, // Loại HĐ
    { wch: 18 }, // STK
    { wch: 18 }, // Ngân hàng
];

// Add sheet to workbook
XLSX.utils.book_append_sheet(wb, ws, 'Nhân sự');

// Create instruction sheet
const instructionData = [
    ['HƯỚNG DẪN IMPORT NHÂN SỰ'],
    [''],
    ['Các trường bắt buộc đánh dấu *'],
    [''],
    ['MÃ ĐƠN VỊ HỢP LỆ:'],
    ['bim - Trung tâm BIM'],
    ['css - Trung tâm CSS'],
    ['dcs - Trung tâm DCS'],
    ['hcm - Chi nhánh TP.HCM'],
    ['pmxd - Trung tâm PMXD'],
    ['stc - Trung tâm STC'],
    ['tvda - Trung tâm TVDA'],
    ['tvtk - Trung tâm TVTK'],
    ['hcns - Phòng Tổng hợp'],
    ['tckt - Phòng Tài chính Kế toán'],
    [''],
    ['ROLE HỢP LỆ:'],
    ['NVKD - Nhân viên kinh doanh'],
    ['UnitLeader - Trưởng đơn vị'],
    ['Admin - Quản trị viên'],
    ['Leadership - Ban lãnh đạo'],
    ['Legal - Pháp chế'],
    ['Accountant - Kế toán viên'],
    ['ChiefAccountant - Kế toán trưởng'],
    ['AdminUnit - Admin đơn vị'],
    [''],
    ['ĐỊNH DẠNG NGÀY: DD/MM/YYYY (ví dụ: 15/03/1990)'],
    ['GIỚI TÍNH: Nam, Nữ, hoặc Khác']
];

const wsInstructions = XLSX.utils.aoa_to_sheet(instructionData);
wsInstructions['!cols'] = [{ wch: 50 }];
XLSX.utils.book_append_sheet(wb, wsInstructions, 'Hướng dẫn');

// Write file
XLSX.writeFile(wb, 'public/templates/employeeImportTemplate.xlsx');

console.log('Template created: public/templates/employeeImportTemplate.xlsx');
