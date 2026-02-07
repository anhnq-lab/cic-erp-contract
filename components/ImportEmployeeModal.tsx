import React, { useState, useCallback } from 'react';
import { X, Upload, Download, AlertCircle, CheckCircle, FileSpreadsheet, Loader2 } from 'lucide-react';
import * as XLSX from 'xlsx';
import { Employee, Unit } from '../types';
import { EmployeeService } from '../services';
import { toast } from 'sonner';

interface ImportEmployeeModalProps {
    isOpen: boolean;
    onClose: () => void;
    units: Unit[];
    onSuccess: () => void;
}

interface ImportRow {
    employeeCode: string;
    name: string;
    email: string;
    phone?: string;
    telegram?: string;
    unitId: string;
    position?: string;
    roleCode: string;
    dateOfBirth?: string;
    gender?: string;
    idNumber?: string;
    address?: string;
    education?: string;
    specialization?: string;
    certificates?: string;
    dateJoined?: string;
    contractType?: string;
    bankAccount?: string;
    bankName?: string;
}

interface ParsedRow extends ImportRow {
    rowIndex: number;
    errors: string[];
    isValid: boolean;
}

const VALID_ROLES = ['NVKD', 'UnitLeader', 'Admin', 'Leadership', 'Legal', 'Accountant', 'ChiefAccountant', 'AdminUnit'];

// Map unit names to IDs (case-insensitive)
const UNIT_NAME_MAP: Record<string, string> = {
    // Full names
    'hội đồng quản trị': 'hdqt',
    'ban giám đốc': 'bgd',
    'chi nhánh tp. hồ chí minh': 'hcm',
    'chi nhánh hồ chí minh': 'hcm',
    'chi nhánh hcm': 'hcm',
    'phòng hành chính - nhân sự': 'hcns',
    'phòng hành chính nhân sự': 'hcns',
    'phòng tổng hợp': 'hcns',
    'phòng th': 'hcns',
    'phòng tài chính kế toán': 'tckt',
    'phòng tài chính - kế toán': 'tckt',
    'phòng tckt': 'tckt',
    'trung tâm bim': 'bim',
    'trung tâm tư vấn đấu thầu': 'tvda',
    'trung tâm tư vấn thiết kế': 'tvtk',
    'trung tâm tư vấn đầu tư': 'tvda',
    'trung tâm tư vấn dự án': 'tvda',
    'trung tâm tvda': 'tvda',
    'trung tâm tvtk': 'tvtk',
    'trung tâm css': 'css',
    'trung tâm dcs': 'dcs',
    'trung tâm pmxd': 'pmxd',
    'trung tâm stc': 'stc',
    // ID mappings with Vietnamese diacritics
    'hđqt': 'hdqt',
    'bgđ': 'bgd',
    // ID mappings (without diacritics)
    'hdqt': 'hdqt',
    'bgd': 'bgd',
    'bim': 'bim',
    'css': 'css',
    'dcs': 'dcs',
    'hcm': 'hcm',
    'pmxd': 'pmxd',
    'stc': 'stc',
    'tvda': 'tvda',
    'tvtk': 'tvtk',
    'hcns': 'hcns',
    'tckt': 'tckt',
    'th': 'hcns',
    'all': 'all',
};

const normalizeUnitId = (unitInput: string): string | null => {
    if (!unitInput) return null;
    const normalized = unitInput.toLowerCase().trim();
    return UNIT_NAME_MAP[normalized] || null;
};

const ImportEmployeeModal: React.FC<ImportEmployeeModalProps> = ({ isOpen, onClose, units, onSuccess }) => {
    const [step, setStep] = useState<'upload' | 'preview' | 'importing' | 'done'>('upload');
    const [parsedData, setParsedData] = useState<ParsedRow[]>([]);
    const [importResult, setImportResult] = useState<{ success: number; failed: number }>({ success: 0, failed: 0 });
    const [dragOver, setDragOver] = useState(false);

    const resetModal = () => {
        setStep('upload');
        setParsedData([]);
        setImportResult({ success: 0, failed: 0 });
    };

    const handleClose = () => {
        resetModal();
        onClose();
    };

    const parseDate = (value: any): string | undefined => {
        if (!value) return undefined;

        // If it's already a date string
        if (typeof value === 'string') {
            // Try DD/MM/YYYY format
            const ddmmyyyy = value.match(/^(\d{1,2})\/(\d{1,2})\/(\d{4})$/);
            if (ddmmyyyy) {
                return `${ddmmyyyy[3]}-${ddmmyyyy[2].padStart(2, '0')}-${ddmmyyyy[1].padStart(2, '0')}`;
            }

            // Try MM/YYYY format (common for join date) - assume day 01
            const mmyyyy = value.match(/^(\d{1,2})\/(\d{4})$/);
            if (mmyyyy) {
                return `${mmyyyy[2]}-${mmyyyy[1].padStart(2, '0')}-01`;
            }

            // Try YYYY-MM-DD format (ISO)
            const iso = value.match(/^(\d{4})-(\d{2})-(\d{2})$/);
            if (iso) {
                return value;
            }

            return value;
        }

        // If it's an Excel date number
        if (typeof value === 'number') {
            const date = XLSX.SSF.parse_date_code(value);
            if (date) {
                return `${date.y}-${String(date.m).padStart(2, '0')}-${String(date.d).padStart(2, '0')}`;
            }
        }

        return undefined;
    };

    const parseGender = (value: string | undefined): string | undefined => {
        if (!value) return undefined;
        const lower = value.toLowerCase().trim();
        if (lower === 'nam' || lower === 'male') return 'male';
        if (lower === 'nữ' || lower === 'female') return 'female';
        if (lower === 'khác' || lower === 'other') return 'other';
        return undefined;
    };

    const validateRow = (row: ImportRow, rowIndex: number, existingEmails: Set<string>): ParsedRow => {
        const errors: string[] = [];

        // Required fields (only code, name, email are required now)
        if (!row.employeeCode?.trim()) errors.push('Thiếu mã nhân viên');
        if (!row.name?.trim()) errors.push('Thiếu họ tên');
        if (!row.email?.trim()) errors.push('Thiếu email');

        // Email validation
        if (row.email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(row.email)) {
            errors.push('Email không hợp lệ');
        }

        // Check duplicate email in file
        if (row.email && existingEmails.has(row.email.toLowerCase())) {
            errors.push('Email trùng lặp trong file');
        }

        // Normalize and validate unit (optional - will use default if missing)
        let normalizedUnitId = row.unitId ? normalizeUnitId(row.unitId) : null;
        if (row.unitId && !normalizedUnitId) {
            // Warning only, not error - we'll use a default
            errors.push(`Đơn vị chưa được nhận dạng: "${row.unitId}" (sẽ dùng mặc định)`);
        }

        // Role is optional - can be set later in employee edit form
        // Only validate if role is provided and non-empty
        const roleValue = row.roleCode?.trim();
        let validRole: string | undefined = undefined;
        if (roleValue && VALID_ROLES.includes(roleValue)) {
            validRole = roleValue;
        } else if (roleValue) {
            // Role provided but not valid - just log, will be null
            console.log(`Role không hợp lệ: ${roleValue}, sẽ để trống (có thể chỉnh sửa sau)`);
        }

        // Update row with normalized values
        const updatedRow = {
            ...row,
            unitId: normalizedUnitId || 'default', // Will be handled in import
            roleCode: validRole || '', // Allow empty/null role
        };

        // Only block if critical errors (missing code, name, email, or invalid email)
        const criticalErrors = errors.filter(e =>
            e.includes('Thiếu mã') ||
            e.includes('Thiếu họ') ||
            e.includes('Thiếu email') ||
            e.includes('Email không hợp lệ') ||
            e.includes('Email trùng lặp')
        );

        return {
            ...updatedRow,
            rowIndex,
            errors,
            isValid: criticalErrors.length === 0
        };
    };

    const parseExcelFile = useCallback((file: File) => {
        const reader = new FileReader();

        reader.onload = (e) => {
            try {
                const data = new Uint8Array(e.target?.result as ArrayBuffer);
                const workbook = XLSX.read(data, { type: 'array' });
                const sheetName = workbook.SheetNames[0];
                const worksheet = workbook.Sheets[sheetName];
                const jsonData = XLSX.utils.sheet_to_json(worksheet, { header: 1 }) as any[][];

                // Skip header row
                const rows = jsonData.slice(1).filter(row => row.some(cell => cell !== undefined && cell !== ''));

                const existingEmails = new Set<string>();
                const parsed: ParsedRow[] = [];

                rows.forEach((row, index) => {
                    // Debug: log raw row data
                    if (index < 3) {
                        console.log(`[Import Debug] Row ${index + 2}:`, {
                            raw: row,
                            col5_unitId: row[5],
                            col6_position: row[6],
                        });
                    }

                    // Column mapping based on user's actual Excel:
                    // 0: Mã NV, 1: Họ tên, 2: Email, 3: SĐT, 4: Telegram, 5: Mã đơn vị
                    // 6: Chức vụ, 7: Role, 8: Ngày sinh, 9: Giới tính, 10: CCCD
                    // 11: Địa chỉ, 12: Học vấn, 13: Chuyên ngành, 14: Chứng chỉ
                    // 15: Ngày vào làm, 16: Loại HĐ, 17: STK, 18: Ngân hàng
                    const importRow: ImportRow = {
                        employeeCode: String(row[0] || '').trim(),
                        name: String(row[1] || '').trim(),
                        email: String(row[2] || '').trim().toLowerCase(),
                        phone: row[3] ? String(row[3]).trim() : undefined,
                        telegram: row[4] ? String(row[4]).trim() : undefined, // Index 4
                        unitId: String(row[5] || '').trim().toLowerCase(), // Index 5
                        position: row[6] ? String(row[6]).trim() : undefined, // Index 6
                        roleCode: String(row[7] || '').trim(), // Index 7
                        dateOfBirth: parseDate(row[8]), // Index 8
                        gender: parseGender(row[9] ? String(row[9]) : undefined), // Index 9
                        idNumber: row[10] ? String(row[10]).trim() : undefined, // Index 10
                        address: row[11] ? String(row[11]).trim() : undefined, // Index 11
                        education: row[12] ? String(row[12]).trim() : undefined, // Index 12
                        specialization: row[13] ? String(row[13]).trim() : undefined, // Index 13
                        certificates: row[14] ? String(row[14]).trim() : undefined, // Index 14
                        dateJoined: parseDate(row[15]), // Index 15
                        contractType: row[16] ? String(row[16]).trim() : undefined, // Index 16
                        bankAccount: row[17] ? String(row[17]).trim() : undefined, // Index 17
                        bankName: row[18] ? String(row[18]).trim() : undefined, // Index 18
                    };

                    const validatedRow = validateRow(importRow, index + 2, existingEmails);

                    // Debug: log validated row
                    if (index < 3) {
                        console.log(`[Import Debug] Validated Row ${index + 2}:`, {
                            unitId: validatedRow.unitId,
                            position: validatedRow.position,
                        });
                    }

                    if (importRow.email) {
                        existingEmails.add(importRow.email.toLowerCase());
                    }
                    parsed.push(validatedRow);
                });

                setParsedData(parsed);
                setStep('preview');
            } catch (error) {
                console.error('Parse error:', error);
                toast.error('Không thể đọc file Excel. Vui lòng kiểm tra định dạng.');
            }
        };

        reader.readAsArrayBuffer(file);
    }, []);

    const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (file) {
            parseExcelFile(file);
        }
    };

    const handleDrop = (e: React.DragEvent) => {
        e.preventDefault();
        setDragOver(false);
        const file = e.dataTransfer.files[0];
        if (file && (file.name.endsWith('.xlsx') || file.name.endsWith('.xls'))) {
            parseExcelFile(file);
        } else {
            toast.error('Vui lòng chọn file Excel (.xlsx hoặc .xls)');
        }
    };

    const handleImport = async () => {
        const validRows = parsedData.filter(row => row.isValid);
        if (validRows.length === 0) {
            toast.error('Không có dữ liệu hợp lệ để import');
            return;
        }

        setStep('importing');
        let success = 0;
        let failed = 0;

        for (const row of validRows) {
            try {
                // Use camelCase properties that EmployeeService.create expects
                const importData = {
                    employeeCode: row.employeeCode,
                    name: row.name,
                    email: row.email,
                    phone: row.phone,
                    telegram: row.telegram,
                    unitId: row.unitId === 'default' ? null : row.unitId,
                    position: row.position,
                    roleCode: row.roleCode || null, // Allow null role
                    dateOfBirth: row.dateOfBirth,
                    gender: row.gender,
                    idNumber: row.idNumber,
                    address: row.address,
                    education: row.education,
                    specialization: row.specialization,
                    certificates: row.certificates,
                    dateJoined: row.dateJoined,
                    contractType: row.contractType,
                    bankAccount: row.bankAccount,
                    bankName: row.bankName,
                    target: { signing: 0, revenue: 0, adminProfit: 0, revProfit: 0, cash: 0 },
                };

                // Debug: log first 3 rows being imported
                if (success + failed < 3) {
                    console.log(`[Import] Sending to DB row ${success + failed + 1}:`, {
                        name: importData.name,
                        unitId: importData.unitId,
                        dateOfBirth: importData.dateOfBirth,
                        dateJoined: importData.dateJoined,
                    });
                }

                await EmployeeService.create(importData as any);
                success++;
            } catch (error) {
                console.error('Import error for row:', row, error);
                failed++;
            }
        }

        setImportResult({ success, failed });
        setStep('done');

        if (success > 0) {
            onSuccess();
        }
    };

    if (!isOpen) return null;

    const validCount = parsedData.filter(r => r.isValid).length;
    const invalidCount = parsedData.filter(r => !r.isValid).length;

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
            <div className="bg-white dark:bg-slate-900 rounded-xl shadow-2xl w-full max-w-4xl max-h-[90vh] overflow-hidden animate-in zoom-in-95 duration-200">
                {/* Header */}
                <div className="flex items-center justify-between px-6 py-4 border-b border-slate-200 dark:border-slate-700">
                    <div className="flex items-center gap-3">
                        <div className="p-2 bg-indigo-100 dark:bg-indigo-900/30 rounded-xl">
                            <FileSpreadsheet className="text-indigo-600 dark:text-indigo-400" size={24} />
                        </div>
                        <div>
                            <h2 className="text-lg font-bold text-slate-800 dark:text-white">Import Nhân Sự từ Excel</h2>
                            <p className="text-sm text-slate-500 dark:text-slate-400">
                                {step === 'upload' && 'Tải lên file Excel để import'}
                                {step === 'preview' && `${validCount} hợp lệ, ${invalidCount} lỗi`}
                                {step === 'importing' && 'Đang import...'}
                                {step === 'done' && 'Hoàn thành'}
                            </p>
                        </div>
                    </div>
                    <button onClick={handleClose} className="p-2 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg">
                        <X size={20} />
                    </button>
                </div>

                {/* Content */}
                <div className="p-6 overflow-y-auto max-h-[calc(90vh-180px)]">
                    {/* Step: Upload */}
                    {step === 'upload' && (
                        <div className="space-y-6">
                            {/* Download Template */}
                            <div className="bg-indigo-50 dark:bg-indigo-900/20 border border-indigo-200 dark:border-indigo-800 rounded-xl p-4">
                                <div className="flex items-center justify-between">
                                    <div>
                                        <h3 className="font-medium text-indigo-800 dark:text-indigo-200">Tải Template Excel</h3>
                                        <p className="text-sm text-indigo-600 dark:text-indigo-400 mt-1">
                                            Sử dụng template để đảm bảo định dạng đúng
                                        </p>
                                    </div>
                                    <a
                                        href="/templates/employeeImportTemplate.xlsx"
                                        download
                                        className="flex items-center gap-2 px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors"
                                    >
                                        <Download size={16} />
                                        Tải Template
                                    </a>
                                </div>
                            </div>

                            {/* Upload Area */}
                            <div
                                onDragOver={(e) => { e.preventDefault(); setDragOver(true); }}
                                onDragLeave={() => setDragOver(false)}
                                onDrop={handleDrop}
                                className={`border-2 border-dashed rounded-xl p-12 text-center transition-colors ${dragOver
                                    ? 'border-indigo-500 bg-indigo-50 dark:bg-indigo-900/20'
                                    : 'border-slate-300 dark:border-slate-600 hover:border-indigo-400'
                                    }`}
                            >
                                <Upload className="mx-auto text-slate-400 mb-4" size={48} />
                                <p className="text-lg font-medium text-slate-700 dark:text-slate-200 mb-2">
                                    Kéo thả file Excel vào đây
                                </p>
                                <p className="text-sm text-slate-500 dark:text-slate-400 mb-4">
                                    hoặc click để chọn file (.xlsx, .xls)
                                </p>
                                <input
                                    type="file"
                                    accept=".xlsx,.xls"
                                    onChange={handleFileSelect}
                                    className="hidden"
                                    id="excel-upload"
                                />
                                <label
                                    htmlFor="excel-upload"
                                    className="inline-flex items-center gap-2 px-6 py-3 bg-indigo-600 text-white rounded-xl hover:bg-indigo-700 transition-colors cursor-pointer"
                                >
                                    <Upload size={18} />
                                    Chọn file
                                </label>
                            </div>
                        </div>
                    )}

                    {/* Step: Preview */}
                    {step === 'preview' && (
                        <div className="space-y-4">
                            {/* Summary */}
                            <div className="flex gap-4">
                                <div className="flex-1 bg-emerald-50 dark:bg-emerald-900/20 border border-emerald-200 dark:border-emerald-800 rounded-xl p-4">
                                    <div className="flex items-center gap-2">
                                        <CheckCircle className="text-emerald-600" size={20} />
                                        <span className="font-medium text-emerald-800 dark:text-emerald-200">{validCount} hợp lệ</span>
                                    </div>
                                </div>
                                {invalidCount > 0 && (
                                    <div className="flex-1 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-xl p-4">
                                        <div className="flex items-center gap-2">
                                            <AlertCircle className="text-red-600" size={20} />
                                            <span className="font-medium text-red-800 dark:text-red-200">{invalidCount} lỗi</span>
                                        </div>
                                    </div>
                                )}
                            </div>

                            {/* Preview Table */}
                            <div className="border border-slate-200 dark:border-slate-700 rounded-xl overflow-hidden">
                                <div className="overflow-x-auto max-h-[400px]">
                                    <table className="w-full text-sm">
                                        <thead className="bg-slate-50 dark:bg-slate-800 sticky top-0">
                                            <tr>
                                                <th className="px-3 py-2 text-left font-medium text-slate-600 dark:text-slate-300">Dòng</th>
                                                <th className="px-3 py-2 text-left font-medium text-slate-600 dark:text-slate-300">Mã NV</th>
                                                <th className="px-3 py-2 text-left font-medium text-slate-600 dark:text-slate-300">Họ tên</th>
                                                <th className="px-3 py-2 text-left font-medium text-slate-600 dark:text-slate-300">Email</th>
                                                <th className="px-3 py-2 text-left font-medium text-slate-600 dark:text-slate-300">Đơn vị</th>
                                                <th className="px-3 py-2 text-left font-medium text-slate-600 dark:text-slate-300">Role</th>
                                                <th className="px-3 py-2 text-left font-medium text-slate-600 dark:text-slate-300">Trạng thái</th>
                                            </tr>
                                        </thead>
                                        <tbody className="divide-y divide-slate-200 dark:divide-slate-700">
                                            {parsedData.map((row) => (
                                                <tr key={row.rowIndex} className={row.isValid ? '' : 'bg-red-50 dark:bg-red-900/10'}>
                                                    <td className="px-3 py-2 text-slate-600 dark:text-slate-300">{row.rowIndex}</td>
                                                    <td className="px-3 py-2 text-slate-800 dark:text-slate-200">{row.employeeCode}</td>
                                                    <td className="px-3 py-2 text-slate-800 dark:text-slate-200">{row.name}</td>
                                                    <td className="px-3 py-2 text-slate-600 dark:text-slate-400">{row.email}</td>
                                                    <td className="px-3 py-2 text-slate-600 dark:text-slate-400">{row.unitId}</td>
                                                    <td className="px-3 py-2 text-slate-600 dark:text-slate-400">{row.roleCode}</td>
                                                    <td className="px-3 py-2">
                                                        {row.isValid ? (
                                                            <span className="inline-flex items-center gap-1 px-2 py-0.5 bg-emerald-100 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-300 rounded text-xs">
                                                                <CheckCircle size={12} /> OK
                                                            </span>
                                                        ) : (
                                                            <span className="text-xs text-red-600 dark:text-red-400">{row.errors.join(', ')}</span>
                                                        )}
                                                    </td>
                                                </tr>
                                            ))}
                                        </tbody>
                                    </table>
                                </div>
                            </div>
                        </div>
                    )}

                    {/* Step: Importing */}
                    {step === 'importing' && (
                        <div className="flex flex-col items-center justify-center py-12">
                            <Loader2 className="animate-spin text-indigo-600 mb-4" size={48} />
                            <p className="text-lg font-medium text-slate-800 dark:text-slate-200">Đang import dữ liệu...</p>
                            <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">Vui lòng không đóng cửa sổ này</p>
                        </div>
                    )}

                    {/* Step: Done */}
                    {step === 'done' && (
                        <div className="flex flex-col items-center justify-center py-12">
                            <div className="w-16 h-16 rounded-full bg-emerald-100 dark:bg-emerald-900/30 flex items-center justify-center mb-4">
                                <CheckCircle className="text-emerald-600" size={32} />
                            </div>
                            <p className="text-lg font-medium text-slate-800 dark:text-slate-200 mb-2">Import hoàn tất!</p>
                            <div className="flex gap-4 text-sm">
                                <span className="text-emerald-600">✓ {importResult.success} thành công</span>
                                {importResult.failed > 0 && (
                                    <span className="text-red-600">✗ {importResult.failed} thất bại</span>
                                )}
                            </div>
                        </div>
                    )}
                </div>

                {/* Footer */}
                <div className="flex justify-between items-center px-6 py-4 border-t border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800">
                    <button
                        onClick={step === 'done' ? handleClose : () => setStep('upload')}
                        className="px-4 py-2 text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700 rounded-lg transition-colors"
                    >
                        {step === 'done' ? 'Đóng' : 'Quay lại'}
                    </button>
                    {step === 'preview' && (
                        <button
                            onClick={handleImport}
                            disabled={validCount === 0}
                            className="flex items-center gap-2 px-6 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                        >
                            <Upload size={16} />
                            Import {validCount} nhân viên
                        </button>
                    )}
                </div>
            </div>
        </div>
    );
};

export default ImportEmployeeModal;
