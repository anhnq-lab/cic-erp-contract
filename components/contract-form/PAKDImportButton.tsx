/**
 * PAKD Import Button Component - Compact Version
 * Allows importing pre-approved PAKD from Excel file with minimal UI
 */
import React, { useRef, useState } from 'react';
import { Upload, FileSpreadsheet, Download, X, CheckCircle, Loader2 } from 'lucide-react';
import { parsePAKDExcel, generatePAKDTemplate, ParsedPAKD } from '../../services/pakdExcelParser';
import { toast } from 'sonner';

interface PAKDImportButtonProps {
    onImport: (data: ParsedPAKD) => void;
    disabled?: boolean;
    isImporting?: boolean;
}

export function PAKDImportButton({ onImport, disabled }: PAKDImportButtonProps) {
    const fileInputRef = useRef<HTMLInputElement>(null);
    const [isProcessing, setIsProcessing] = useState(false);
    const [previewData, setPreviewData] = useState<ParsedPAKD | null>(null);

    const handleFileSelect = async (file: File) => {
        if (!file) return;

        if (!file.name.match(/\.(xlsx|xls)$/i)) {
            toast.error('Vui lòng chọn file Excel (.xlsx hoặc .xls)');
            return;
        }

        setIsProcessing(true);
        try {
            const parsed = await parsePAKDExcel(file);
            setPreviewData(parsed);
            toast.success(`Đã đọc ${parsed.lineItems.length} hạng mục từ file Excel`);
        } catch (error: any) {
            toast.error(error.message || 'Lỗi đọc file Excel');
            console.error('[PAKDImport] Error:', error);
        } finally {
            setIsProcessing(false);
        }
    };

    const handleConfirmImport = () => {
        if (!previewData) return;
        onImport(previewData);
        setPreviewData(null);
    };

    const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (file) handleFileSelect(file);
        e.target.value = '';
    };

    const formatVND = (amount: number) => {
        return new Intl.NumberFormat('vi-VN').format(amount);
    };

    return (
        <>
            {/* Compact Import Button - Icon Only */}
            <div className="flex items-center gap-2">
                <button
                    onClick={() => !disabled && !isProcessing && fileInputRef.current?.click()}
                    disabled={disabled || isProcessing}
                    className={`
                        flex items-center gap-2 px-3 py-2 rounded-xl text-xs font-semibold transition-all
                        ${disabled || isProcessing
                            ? 'bg-slate-100 text-slate-400 cursor-not-allowed'
                            : 'bg-indigo-50 text-indigo-600 hover:bg-indigo-100 dark:bg-indigo-900/30 dark:text-indigo-400 dark:hover:bg-indigo-900/50'
                        }
                    `}
                    title="Import từ file PAKD Excel"
                >
                    {isProcessing ? (
                        <Loader2 size={14} className="animate-spin" />
                    ) : (
                        <Upload size={14} />
                    )}
                    <span className="hidden sm:inline">Import PAKD</span>
                </button>

                <button
                    onClick={(e) => {
                        e.stopPropagation();
                        generatePAKDTemplate();
                        toast.success('Đã tải template PAKD_Template.xlsx');
                    }}
                    className="p-2 text-slate-400 hover:text-indigo-600 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg transition-colors"
                    title="Tải template Excel mẫu"
                >
                    <Download size={14} />
                </button>
            </div>

            <input
                ref={fileInputRef}
                type="file"
                accept=".xlsx,.xls"
                onChange={handleInputChange}
                className="hidden"
                disabled={disabled || isProcessing}
            />

            {/* Preview Modal */}
            {previewData && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm">
                    <div className="bg-white dark:bg-slate-900 rounded-3xl shadow-2xl w-full max-w-3xl max-h-[80vh] overflow-hidden m-4">
                        {/* Header */}
                        <div className="flex items-center justify-between p-6 border-b border-slate-100 dark:border-slate-800">
                            <div className="flex items-center gap-3">
                                <div className="p-2 bg-emerald-100 dark:bg-emerald-900/30 rounded-xl">
                                    <FileSpreadsheet className="w-5 h-5 text-emerald-600" />
                                </div>
                                <div>
                                    <h3 className="font-bold text-slate-900 dark:text-white">Xem trước PAKD</h3>
                                    <p className="text-xs text-slate-500">{previewData.lineItems.length} hạng mục</p>
                                </div>
                            </div>
                            <button
                                onClick={() => setPreviewData(null)}
                                className="p-2 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-xl transition-colors"
                            >
                                <X size={20} className="text-slate-500" />
                            </button>
                        </div>

                        {/* Content */}
                        <div className="p-6 overflow-y-auto max-h-[50vh]">
                            {/* Financial Summary */}
                            <div className="grid grid-cols-4 gap-4 mb-6">
                                <div className="bg-slate-50 dark:bg-slate-800 p-4 rounded-xl">
                                    <p className="text-[10px] text-slate-500 uppercase font-bold">Doanh thu</p>
                                    <p className="text-lg font-black text-emerald-600">{formatVND(previewData.financials.revenue)} đ</p>
                                </div>
                                <div className="bg-slate-50 dark:bg-slate-800 p-4 rounded-xl">
                                    <p className="text-[10px] text-slate-500 uppercase font-bold">Chi phí</p>
                                    <p className="text-lg font-black text-rose-500">{formatVND(previewData.financials.costs)} đ</p>
                                </div>
                                <div className="bg-slate-50 dark:bg-slate-800 p-4 rounded-xl">
                                    <p className="text-[10px] text-slate-500 uppercase font-bold">Lợi nhuận</p>
                                    <p className="text-lg font-black text-indigo-600">{formatVND(previewData.financials.profit)} đ</p>
                                </div>
                                <div className="bg-slate-50 dark:bg-slate-800 p-4 rounded-xl">
                                    <p className="text-[10px] text-slate-500 uppercase font-bold">Tỷ lệ LN</p>
                                    <p className="text-lg font-black text-amber-600">{previewData.financials.margin}%</p>
                                </div>
                            </div>

                            {/* Line Items Table */}
                            <div className="overflow-x-auto">
                                <table className="w-full text-xs">
                                    <thead>
                                        <tr className="border-b border-slate-200 dark:border-slate-700">
                                            <th className="py-2 px-3 text-left font-bold text-slate-600 dark:text-slate-300">STT</th>
                                            <th className="py-2 px-3 text-left font-bold text-slate-600 dark:text-slate-300">Tên SP/DV</th>
                                            <th className="py-2 px-3 text-left font-bold text-slate-600 dark:text-slate-300">NCC</th>
                                            <th className="py-2 px-3 text-right font-bold text-slate-600 dark:text-slate-300">SL</th>
                                            <th className="py-2 px-3 text-right font-bold text-slate-600 dark:text-slate-300">Đầu vào</th>
                                            <th className="py-2 px-3 text-right font-bold text-slate-600 dark:text-slate-300">Đầu ra</th>
                                            <th className="py-2 px-3 text-right font-bold text-slate-600 dark:text-slate-300">Chênh lệch</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {previewData.lineItems.map((item, idx) => (
                                            <tr key={idx} className="border-b border-slate-100 dark:border-slate-800">
                                                <td className="py-2 px-3 text-slate-600 dark:text-slate-300">{item.stt}</td>
                                                <td className="py-2 px-3 font-medium text-slate-900 dark:text-white">{item.name}</td>
                                                <td className="py-2 px-3 text-slate-500">{item.supplier}</td>
                                                <td className="py-2 px-3 text-right text-slate-600 dark:text-slate-300">{item.quantity}</td>
                                                <td className="py-2 px-3 text-right text-rose-500 font-medium">{formatVND(item.totalCost)}</td>
                                                <td className="py-2 px-3 text-right text-emerald-600 font-medium">{formatVND(item.totalPrice)}</td>
                                                <td className="py-2 px-3 text-right text-indigo-600 font-bold">{formatVND(item.margin)}</td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        </div>

                        {/* Footer */}
                        <div className="flex items-center justify-end gap-3 p-6 border-t border-slate-100 dark:border-slate-800">
                            <button
                                onClick={() => setPreviewData(null)}
                                className="px-4 py-2 text-sm font-medium text-slate-600 hover:text-slate-800 dark:text-slate-400 dark:hover:text-white transition-colors"
                            >
                                Hủy
                            </button>
                            <button
                                onClick={handleConfirmImport}
                                className="flex items-center gap-2 px-6 py-2.5 bg-gradient-to-r from-emerald-500 to-green-600 text-white rounded-xl font-bold text-sm hover:from-emerald-600 hover:to-green-700 transition-all shadow-lg shadow-emerald-500/25"
                            >
                                <CheckCircle size={16} />
                                Xác nhận Import
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </>
    );
}
