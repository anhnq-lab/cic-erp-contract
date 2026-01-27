import React, { useState, useEffect } from 'react';
import { Save, Loader2, Upload, X } from 'lucide-react';
import Modal from './ui/Modal';
import { SalesPerson, KPIPlan } from '../types';
import { MOCK_UNITS } from '../constants';
import { supabase } from '../lib/supabase';

interface PersonnelFormProps {
    isOpen: boolean;
    onClose: () => void;
    onSave: (data: Omit<SalesPerson, 'id'> | SalesPerson) => Promise<void>;
    person?: SalesPerson;
}

const PersonnelForm: React.FC<PersonnelFormProps> = ({ isOpen, onClose, onSave, person }) => {
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [isUploading, setIsUploading] = useState(false);
    const [avatarFile, setAvatarFile] = useState<File | null>(null);
    const [previewUrl, setPreviewUrl] = useState<string>('');

    const [formData, setFormData] = useState({
        name: '',
        unitId: '',
        avatar_url: '',
        employeeCode: '',
        position: '',
        email: '',
        phone: '',
        dateJoined: '',
        target: {
            signing: 0,
            revenue: 0,
            adminProfit: 0,
            revProfit: 0,
            cash: 0,
        } as KPIPlan,
    });

    useEffect(() => {
        if (person) {
            setFormData({
                name: person.name,
                unitId: person.unitId,
                avatar_url: person.avatar_url || '',
                employeeCode: person.employeeCode || '',
                position: person.position || '',
                email: person.email || '',
                phone: person.phone || '',
                dateJoined: person.dateJoined || '',
                target: { ...person.target },
            });
            setPreviewUrl(person.avatar_url || '');
            setAvatarFile(null);
        } else {
            setFormData({
                name: '',
                unitId: '',
                avatar_url: '',
                employeeCode: '',
                position: '',
                email: '',
                phone: '',
                dateJoined: '',
                target: {
                    signing: 15e9,
                    revenue: 10e9,
                    adminProfit: 4e9,
                    revProfit: 3.5e9,
                    cash: 9e9,
                },
            });
            setPreviewUrl('');
            setAvatarFile(null);
        }
    }, [person, isOpen]);

    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (!e.target.files || e.target.files.length === 0) {
            return;
        }
        const file = e.target.files[0];
        setAvatarFile(file);
        setPreviewUrl(URL.createObjectURL(file));
    };

    const uploadAvatar = async (file: File): Promise<string | null> => {
        try {
            setIsUploading(true);
            const fileExt = file.name.split('.').pop();
            const fileName = `${Math.random()}.${fileExt}`;
            const filePath = `${fileName}`;

            const { error: uploadError } = await supabase.storage
                .from('avatars')
                .upload(filePath, file);

            if (uploadError) {
                throw uploadError;
            }

            const { data } = supabase.storage.from('avatars').getPublicUrl(filePath);
            return data.publicUrl;
        } catch (error) {
            console.error('Error uploading avatar:', error);
            alert('Lỗi khi upload ảnh. Vui lòng thử lại hoặc đảm bảo bucket "avatars" đã được tạo và công khai.');
            return null;
        } finally {
            setIsUploading(false);
        }
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsSubmitting(true);
        try {
            let finalAvatarUrl = formData.avatar_url;

            if (avatarFile) {
                const uploadedUrl = await uploadAvatar(avatarFile);
                if (uploadedUrl) {
                    finalAvatarUrl = uploadedUrl;
                }
            }

            const dataToSave = { ...formData, avatar_url: finalAvatarUrl };

            if (person) {
                await onSave({ ...dataToSave, id: person.id });
            } else {
                await onSave(dataToSave);
            }
            onClose();
        } catch (error) {
            console.error('Error saving personnel:', error);
        } finally {
            setIsSubmitting(false);
        }
    };

    const formatCurrency = (value: number) => value.toLocaleString('vi-VN');
    const parseCurrency = (value: string) => parseInt(value.replace(/[^\d]/g, '')) || 0;

    const updateTarget = (field: keyof KPIPlan, value: number) => {
        setFormData(prev => ({
            ...prev,
            target: { ...prev.target, [field]: value }
        }));
    };

    const units = MOCK_UNITS.filter(u => u.id !== 'all');

    return (
        <Modal isOpen={isOpen} onClose={onClose} title={person ? 'Chỉnh sửa Nhân viên' : 'Thêm Nhân viên mới'} size="lg">
            <form onSubmit={handleSubmit} className="space-y-5">
                {/* Basic Info */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                        <label className="block text-xs font-bold text-slate-600 dark:text-slate-400 mb-1.5 uppercase tracking-wide">Họ và tên *</label>
                        <input
                            type="text"
                            required
                            value={formData.name}
                            onChange={e => setFormData(prev => ({ ...prev, name: e.target.value }))}
                            placeholder="VD: Nguyễn Văn A"
                            className="w-full px-4 py-3 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500 text-sm"
                        />
                    </div>
                    <div>
                        <label className="block text-xs font-bold text-slate-600 dark:text-slate-400 mb-1.5 uppercase tracking-wide">Đơn vị *</label>
                        <select
                            required
                            value={formData.unitId}
                            onChange={e => setFormData(prev => ({ ...prev, unitId: e.target.value }))}
                            className="w-full px-4 py-3 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500 text-sm"
                        >
                            <option value="">-- Chọn đơn vị --</option>
                            {units.map(unit => (
                                <option key={unit.id} value={unit.id}>{unit.name}</option>
                            ))}
                        </select>
                    </div>
                </div>

                {/* Avatar Upload */}
                <div>
                    <label className="block text-xs font-bold text-slate-600 dark:text-slate-400 mb-1.5 uppercase tracking-wide">Ảnh đại diện</label>
                    <div className="flex items-center gap-4">
                        <div className="w-16 h-16 rounded-2xl bg-slate-100 dark:bg-slate-800 border-2 border-dashed border-slate-300 dark:border-slate-700 flex items-center justify-center overflow-hidden shrink-0">
                            {previewUrl ? (
                                <img src={previewUrl} alt="Preview" className="w-full h-full object-cover" />
                            ) : (
                                <Upload size={24} className="text-slate-400" />
                            )}
                        </div>
                        <div className="flex-1">
                            <input
                                type="file"
                                accept="image/*"
                                onChange={handleFileChange}
                                className="block w-full text-sm text-slate-500
                                file:mr-4 file:py-2 file:px-4
                                file:rounded-xl file:border-0
                                file:text-xs file:font-bold
                                file:bg-indigo-50 file:text-indigo-700
                                hover:file:bg-indigo-100 dark:file:bg-indigo-900/30 dark:file:text-indigo-400"
                            />
                            <p className="text-[10px] text-slate-400 mt-1">Hỗ trợ JPG, PNG. Tối đa 5MB.</p>
                            {/* Optional: Text input for URL fallback */}
                            <div className="mt-2 text-xs flex items-center gap-2">
                                <span className="text-slate-400">Hoặc nhập link:</span>
                                <input
                                    type="text"
                                    value={formData.avatar_url}
                                    onChange={e => {
                                        setFormData(prev => ({ ...prev, avatar_url: e.target.value }));
                                        setPreviewUrl(e.target.value);
                                        setAvatarFile(null); // Clear file if manually typing URL
                                    }}
                                    className="flex-1 bg-transparent border-b border-slate-200 dark:border-slate-700 focus:border-indigo-500 outline-none py-1"
                                    placeholder="https://..."
                                />
                            </div>
                        </div>
                    </div>
                </div>

                {/* Contact & Position Info */}
                <div className="pt-4 border-t border-slate-100 dark:border-slate-800">
                    <h3 className="text-sm font-bold text-slate-900 dark:text-slate-100 mb-4">Thông tin chi tiết</h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                            <label className="block text-xs font-bold text-slate-600 dark:text-slate-400 mb-1.5 uppercase tracking-wide">Mã nhân viên</label>
                            <input
                                type="text"
                                value={formData.employeeCode}
                                onChange={e => setFormData(prev => ({ ...prev, employeeCode: e.target.value }))}
                                placeholder="VD: NV001"
                                className="w-full px-4 py-3 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500 text-sm"
                            />
                        </div>
                        <div>
                            <label className="block text-xs font-bold text-slate-600 dark:text-slate-400 mb-1.5 uppercase tracking-wide">Chức vụ</label>
                            <input
                                type="text"
                                value={formData.position}
                                onChange={e => setFormData(prev => ({ ...prev, position: e.target.value }))}
                                placeholder="VD: Trưởng phòng Kinh doanh"
                                className="w-full px-4 py-3 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500 text-sm"
                            />
                        </div>
                        <div>
                            <label className="block text-xs font-bold text-slate-600 dark:text-slate-400 mb-1.5 uppercase tracking-wide">Email</label>
                            <input
                                type="email"
                                value={formData.email}
                                onChange={e => setFormData(prev => ({ ...prev, email: e.target.value }))}
                                placeholder="VD: email@cic.com.vn"
                                className="w-full px-4 py-3 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500 text-sm"
                            />
                        </div>
                        <div>
                            <label className="block text-xs font-bold text-slate-600 dark:text-slate-400 mb-1.5 uppercase tracking-wide">Số điện thoại</label>
                            <input
                                type="text"
                                value={formData.phone}
                                onChange={e => setFormData(prev => ({ ...prev, phone: e.target.value }))}
                                placeholder="VD: 0912 345 678"
                                className="w-full px-4 py-3 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500 text-sm"
                            />
                        </div>
                        <div>
                            <label className="block text-xs font-bold text-slate-600 dark:text-slate-400 mb-1.5 uppercase tracking-wide">Ngày vào công ty</label>
                            <input
                                type="date"
                                value={formData.dateJoined}
                                onChange={e => setFormData(prev => ({ ...prev, dateJoined: e.target.value }))}
                                className="w-full px-4 py-3 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500 text-sm"
                            />
                        </div>
                    </div>
                </div>

                {/* KPI Targets */}
                <div className="pt-4 border-t border-slate-100 dark:border-slate-800">
                    <h3 className="text-sm font-bold text-slate-900 dark:text-slate-100 mb-4">Chỉ tiêu KPI</h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                            <label className="block text-xs font-bold text-slate-600 dark:text-slate-400 mb-1.5 uppercase tracking-wide">KPI Giá trị ký (VNĐ)</label>
                            <input
                                type="text"
                                value={formatCurrency(formData.target.signing)}
                                onChange={e => updateTarget('signing', parseCurrency(e.target.value))}
                                className="w-full px-4 py-3 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500 text-sm"
                            />
                        </div>
                        <div>
                            <label className="block text-xs font-bold text-slate-600 dark:text-slate-400 mb-1.5 uppercase tracking-wide">KPI Doanh thu (VNĐ)</label>
                            <input
                                type="text"
                                value={formatCurrency(formData.target.revenue)}
                                onChange={e => updateTarget('revenue', parseCurrency(e.target.value))}
                                className="w-full px-4 py-3 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500 text-sm"
                            />
                        </div>
                        <div>
                            <label className="block text-xs font-bold text-slate-600 dark:text-slate-400 mb-1.5 uppercase tracking-wide">KPI LN Quản trị (VNĐ)</label>
                            <input
                                type="text"
                                value={formatCurrency(formData.target.adminProfit)}
                                onChange={e => updateTarget('adminProfit', parseCurrency(e.target.value))}
                                className="w-full px-4 py-3 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500 text-sm"
                            />
                        </div>
                        <div>
                            <label className="block text-xs font-bold text-slate-600 dark:text-slate-400 mb-1.5 uppercase tracking-wide">KPI Tiền về (VNĐ)</label>
                            <input
                                type="text"
                                value={formatCurrency(formData.target.cash)}
                                onChange={e => updateTarget('cash', parseCurrency(e.target.value))}
                                className="w-full px-4 py-3 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500 text-sm"
                            />
                        </div>
                    </div>
                </div>

                {/* Actions */}
                <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-100 dark:border-slate-800">
                    <button
                        type="button"
                        onClick={onClose}
                        className="px-5 py-2.5 text-sm font-bold text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-xl transition-colors"
                    >
                        Hủy
                    </button>
                    <button
                        type="submit"
                        disabled={isSubmitting || isUploading}
                        className="flex items-center gap-2 px-5 py-2.5 bg-indigo-600 text-white text-sm font-bold rounded-xl hover:bg-indigo-700 transition-colors disabled:opacity-50"
                    >
                        {isSubmitting || isUploading ? <Loader2 size={18} className="animate-spin" /> : <Save size={18} />}
                        {person ? 'Cập nhật' : 'Thêm mới'}
                    </button>
                </div>
            </form>
        </Modal>
    );
};

export default PersonnelForm;
