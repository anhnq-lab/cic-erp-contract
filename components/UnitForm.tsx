
import React, { useState, useEffect } from 'react';
import { toast } from 'sonner';
import { Save, Loader2, X } from 'lucide-react';
import Modal from './ui/Modal';
import { Unit, KPIPlan } from '../types';


interface UnitFormProps {
    isOpen: boolean;
    onClose: () => void;
    onSave: (data: Omit<Unit, 'id'> | Unit) => Promise<void>;
    unit?: Unit;
}

const UnitForm: React.FC<UnitFormProps> = ({ isOpen, onClose, onSave, unit }) => {
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [formData, setFormData] = useState({
        name: '',
        type: 'Center' as 'Company' | 'Branch' | 'Center',
        code: '',
        target: {
            signing: 0,
            revenue: 0,
            adminProfit: 0,
            revProfit: 0,
            cash: 0,
        } as KPIPlan,
        functions: '',
    });

    useEffect(() => {
        if (unit) {
            setFormData({
                name: unit.name,
                type: unit.type,
                code: unit.code,
                target: { ...unit.target },
                functions: unit.functions || '',
            });
        } else {
            setFormData({
                name: '',
                type: 'Center',
                code: '',
                target: {
                    signing: 0,
                    revenue: 0,
                    adminProfit: 0,
                    revProfit: 0,
                    cash: 0,
                },
                functions: '',
            });
        }
    }, [unit, isOpen]);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsSubmitting(true);
        try {
            const payload = unit ? { ...formData, id: unit.id } : formData;
            await onSave(payload);
            onClose();
        } catch (error) {
            console.error('Lỗi khi lưu đơn vị:', error);
            toast.error('Có lỗi xảy ra khi lưu dữ liệu. Vui lòng thử lại.');
        } finally {
            setIsSubmitting(false);
        }
    };

    const handleChange = (field: string, value: any) => {
        setFormData(prev => ({ ...prev, [field]: value }));
    };

    const handleTargetChange = (field: keyof KPIPlan, value: string) => {
        const numValue = parseFloat(value) || 0;
        setFormData(prev => ({
            ...prev,
            target: {
                ...prev.target,
                [field]: numValue
            }
        }));
    };

    return (
        <Modal isOpen={isOpen} onClose={onClose} title={unit ? "Chỉnh sửa Đơn vị" : "Thêm Đơn vị mới"}>
            <form onSubmit={handleSubmit} className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {/* Basic Info */}
                    <div className="space-y-4">
                        <h3 className="font-bold text-slate-800 dark:text-slate-200 border-b pb-2">Thông tin chung</h3>

                        <div>
                            <label className="block text-sm font-bold text-slate-700 dark:text-slate-300 mb-1">Tên Đơn vị <span className="text-red-500">*</span></label>
                            <input
                                type="text"
                                required
                                value={formData.name}
                                onChange={(e) => handleChange('name', e.target.value)}
                                className="w-full px-4 py-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 focus:ring-2 focus:ring-indigo-500 outline-none transition-all"
                                placeholder="Ví dụ: Trung tâm Kinh doanh số 1"
                            />
                        </div>

                        <div>
                            <label className="block text-sm font-bold text-slate-700 dark:text-slate-300 mb-1">Mã Đơn vị <span className="text-red-500">*</span></label>
                            <input
                                type="text"
                                required
                                value={formData.code}
                                onChange={(e) => handleChange('code', e.target.value)}
                                className="w-full px-4 py-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 focus:ring-2 focus:ring-indigo-500 outline-none transition-all"
                                placeholder="Ví dụ: CENTER_01"
                            />
                        </div>

                        <div>
                            <label className="block text-sm font-bold text-slate-700 dark:text-slate-300 mb-1">Loại hình</label>
                            <select
                                value={formData.type}
                                onChange={(e) => handleChange('type', e.target.value)}
                                className="w-full px-4 py-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 focus:ring-2 focus:ring-indigo-500 outline-none transition-all"
                            >
                                <option value="Company">Công ty</option>
                                <option value="Branch">Chi nhánh</option>
                                <option value="Center">Trung tâm</option>
                            </select>
                        </select>
                    </div>
                </div>

                <div className="md:col-span-2">
                    <label className="block text-sm font-bold text-slate-700 dark:text-slate-300 mb-1">Chức năng - Nhiệm vụ</label>
                    <textarea
                        value={(formData as any).functions || ''}
                        onChange={(e) => handleChange('functions', e.target.value)}
                        className="w-full px-4 py-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 focus:ring-2 focus:ring-indigo-500 outline-none transition-all min-h-[100px]"
                        placeholder="Mô tả chức năng, nhiệm vụ của đơn vị..."
                    />
                </div>
            </div>

            {/* KPI Targets */}
            <div className="space-y-4">
                <h3 className="font-bold text-slate-800 dark:text-slate-200 border-b pb-2">Chỉ tiêu KPI (Năm)</h3>

                <div>
                    <label className="block text-sm font-bold text-slate-700 dark:text-slate-300 mb-1">Chỉ tiêu Ký kết</label>
                    <input
                        type="number"
                        value={formData.target.signing}
                        onChange={(e) => handleTargetChange('signing', e.target.value)}
                        className="w-full px-4 py-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 focus:ring-2 focus:ring-indigo-500 outline-none transition-all"
                    />
                </div>

                <div>
                    <label className="block text-sm font-bold text-slate-700 dark:text-slate-300 mb-1">Chỉ tiêu Doanh thu</label>
                    <input
                        type="number"
                        value={formData.target.revenue}
                        onChange={(e) => handleTargetChange('revenue', e.target.value)}
                        className="w-full px-4 py-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 focus:ring-2 focus:ring-indigo-500 outline-none transition-all"
                    />
                </div>

                <div>
                    <label className="block text-sm font-bold text-slate-700 dark:text-slate-300 mb-1">Chỉ tiêu LNG Quản trị</label>
                    <input
                        type="number"
                        value={formData.target.adminProfit}
                        onChange={(e) => handleTargetChange('adminProfit', e.target.value)}
                        className="w-full px-4 py-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 focus:ring-2 focus:ring-indigo-500 outline-none transition-all"
                    />
                </div>



                <div className="flex justify-end gap-3 pt-4 border-t border-slate-100 dark:border-slate-800">
                    <button
                        type="button"
                        onClick={onClose}
                        className="px-6 py-2.5 rounded-xl font-bold text-slate-600 hover:bg-slate-100 dark:text-slate-300 dark:hover:bg-slate-800 transition-all"
                    >
                        Hủy bỏ
                    </button>
                    <button
                        type="submit"
                        disabled={isSubmitting}
                        className="px-6 py-2.5 rounded-xl font-bold bg-indigo-600 hover:bg-indigo-700 text-white shadow-lg shadow-indigo-200 dark:shadow-none transition-all flex items-center gap-2"
                    >
                        {isSubmitting ? <Loader2 className="animate-spin" size={20} /> : <Save size={20} />}
                        {unit ? 'Cập nhật' : 'Thêm mới'}
                    </button>
                </div>
            </form>
        </Modal >
    );
};

export default UnitForm;
