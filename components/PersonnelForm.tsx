import React, { useState, useEffect } from 'react';
import { toast } from 'sonner';
import { Save, Loader2, Upload, X, User, Building, Calendar, Mail, Phone, MapPin, GraduationCap, CreditCard, Users, Heart, Send } from 'lucide-react';
import { EmployeeService, UnitService } from '../services';
import { Employee, Unit } from '../types';
import { supabase } from '../lib/supabase';

interface PersonnelFormProps {
    isOpen: boolean;
    onClose: () => void;
    initialData?: Employee;
    onSubmit: (data: Omit<Employee, 'id'> | Employee) => Promise<void>;
}

const PersonnelForm: React.FC<PersonnelFormProps> = ({ isOpen, onClose, initialData, onSubmit }) => {
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [isUploading, setIsUploading] = useState(false);
    const [avatarFile, setAvatarFile] = useState<File | null>(null);
    const [previewUrl, setPreviewUrl] = useState<string>('');

    const [formData, setFormData] = useState({
        name: '',
        unitId: '',
        employeeCode: '',
        position: '',
        email: '',
        phone: '',
        telegram: '',
        dateJoined: '',
        avatar_url: '',
        // HR fields
        dateOfBirth: '',
        gender: '' as 'male' | 'female' | 'other' | '',
        address: '',
        education: '',
        specialization: '',
        certificates: '',
        idNumber: '',
        bankAccount: '',
        bankName: '',
        maritalStatus: '' as 'single' | 'married' | 'divorced' | 'widowed' | '',
        emergencyContact: '',
        emergencyPhone: '',
        contractType: '',
        contractEndDate: '',
        // Keep target for backward compatibility but hide from UI
        target: { signing: 0, revenue: 0, adminProfit: 0, revProfit: 0, cash: 0 }
    });

    const [units, setUnits] = useState<Unit[]>([]);

    useEffect(() => {
        const fetchUnits = async () => {
            try {
                const data = await UnitService.getAll();
                setUnits(data);
            } catch (e) {
                console.error(e);
            }
        };
        if (isOpen) {
            fetchUnits();
        }
    }, [isOpen]);

    useEffect(() => {
        if (initialData) {
            setFormData({
                name: initialData.name,
                unitId: initialData.unitId,
                avatar_url: initialData.avatar || '',
                employeeCode: initialData.employeeCode || '',
                position: initialData.position || '',
                email: initialData.email || '',
                phone: initialData.phone || '',
                telegram: initialData.telegram || '',
                dateJoined: initialData.dateJoined || '',
                dateOfBirth: initialData.dateOfBirth || '',
                gender: (initialData.gender as any) || '',
                address: initialData.address || '',
                education: initialData.education || '',
                specialization: initialData.specialization || '',
                certificates: initialData.certificates || '',
                idNumber: initialData.idNumber || '',
                bankAccount: initialData.bankAccount || '',
                bankName: initialData.bankName || '',
                maritalStatus: (initialData.maritalStatus as any) || '',
                emergencyContact: initialData.emergencyContact || '',
                emergencyPhone: initialData.emergencyPhone || '',
                contractType: initialData.contractType || '',
                contractEndDate: initialData.contractEndDate || '',
                target: initialData.target || { signing: 0, revenue: 0, adminProfit: 0, revProfit: 0, cash: 0 },
            });
            setPreviewUrl(initialData.avatar || '');
            setAvatarFile(null);
        } else {
            setFormData({
                name: '',
                unitId: '',
                employeeCode: '',
                position: '',
                email: '',
                phone: '',
                telegram: '',
                dateJoined: new Date().toISOString().split('T')[0],
                avatar_url: '',
                dateOfBirth: '',
                gender: '',
                address: '',
                education: '',
                specialization: '',
                certificates: '',
                idNumber: '',
                bankAccount: '',
                bankName: '',
                maritalStatus: '',
                emergencyContact: '',
                emergencyPhone: '',
                contractType: 'Full-time',
                contractEndDate: '',
                target: { signing: 0, revenue: 0, adminProfit: 0, revProfit: 0, cash: 0 }
            });
            setPreviewUrl('');
            setAvatarFile(null);
        }
    }, [initialData, isOpen]);

    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (!e.target.files || e.target.files.length === 0) {
            setAvatarFile(null);
            return;
        }
        const file = e.target.files[0];
        setAvatarFile(file);
        setPreviewUrl(URL.createObjectURL(file));
    };

    const uploadAvatar = async (file: File): Promise<string | null> => {
        try {
            const fileExt = file.name.split('.').pop();
            const fileName = `${Math.random()}.${fileExt}`;
            const filePath = `avatars/${fileName}`;

            const { error: uploadError } = await supabase.storage
                .from('avatars')
                .upload(filePath, file);

            if (uploadError) throw uploadError;

            const { data } = supabase.storage.from('avatars').getPublicUrl(filePath);
            return data.publicUrl;
        } catch (error) {
            console.error('Error uploading avatar:', error);
            return null;
        }
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsSubmitting(true);
        try {
            let avatarUrl = formData.avatar_url;

            if (avatarFile) {
                setIsUploading(true);
                const uploadedUrl = await uploadAvatar(avatarFile);
                if (uploadedUrl) {
                    avatarUrl = uploadedUrl;
                }
                setIsUploading(false);
            }

            // Build submit data with correct field names
            const submitData: any = {
                name: formData.name,
                unitId: formData.unitId,
                employeeCode: formData.employeeCode,
                position: formData.position,
                email: formData.email,
                phone: formData.phone,
                dateJoined: formData.dateJoined,
                avatar: avatarUrl, // Note: 'avatar' not 'avatar_url'
                target: formData.target,
                // HR fields
                dateOfBirth: formData.dateOfBirth || null,
                gender: formData.gender || null,
                address: formData.address,
                education: formData.education,
                idNumber: formData.idNumber,
                bankAccount: formData.bankAccount,
                bankName: formData.bankName,
                maritalStatus: formData.maritalStatus || null,
                emergencyContact: formData.emergencyContact,
                emergencyPhone: formData.emergencyPhone,
                contractType: formData.contractType,
                contractEndDate: formData.contractEndDate || null
            };

            if (initialData && initialData.id) {
                submitData.id = initialData.id;
            }

            await onSubmit(submitData);
            onClose();
            toast.success("Lưu Nhân sự thành công!");
        } catch (error) {
            console.error(error);
            toast.error("Có lỗi xảy ra khi lưu.");
        } finally {
            setIsSubmitting(false);
        }
    };

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4 overflow-y-auto">
            <div className="bg-white dark:bg-slate-900 rounded-lg shadow-xl w-full max-w-4xl max-h-[90vh] overflow-y-auto">
                <div className="flex items-center justify-between p-4 border-b dark:border-slate-700 sticky top-0 bg-white dark:bg-slate-900 z-10">
                    <h3 className="text-lg font-semibold text-slate-900 dark:text-white">
                        {initialData ? 'Cập nhật Nhân sự' : 'Thêm mới Nhân sự'}
                    </h3>
                    <button onClick={onClose} className="p-1 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-full">
                        <X size={20} />
                    </button>
                </div>

                <form onSubmit={handleSubmit} className="p-6 space-y-6">
                    {/* Avatar & Basic Info */}
                    <div className="flex gap-6">
                        {/* Avatar */}
                        <div className="w-1/4 flex flex-col items-center gap-4">
                            <div className="w-32 h-32 rounded-full border-2 border-dashed border-slate-300 flex items-center justify-center overflow-hidden bg-slate-50 relative group">
                                {previewUrl ? (
                                    <img src={previewUrl} alt="Avatar" className="w-full h-full object-cover" />
                                ) : (
                                    <User size={48} className="text-slate-400" />
                                )}
                                <div className="absolute inset-0 bg-black/40 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity cursor-pointer">
                                    <label htmlFor="avatar-upload" className="cursor-pointer text-white text-xs flex flex-col items-center">
                                        <Upload size={16} className="mb-1" />
                                        <span>Tải ảnh</span>
                                    </label>
                                </div>
                                <input
                                    id="avatar-upload"
                                    type="file"
                                    accept="image/*"
                                    className="hidden"
                                    onChange={handleFileChange}
                                />
                            </div>
                            <p className="text-xs text-slate-500 text-center">Ảnh định dạng .jpg, .png</p>
                        </div>

                        {/* Basic Info */}
                        <div className="w-3/4 grid grid-cols-2 gap-4">
                            <div className="col-span-2">
                                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Họ và tên *</label>
                                <input
                                    required
                                    type="text"
                                    value={formData.name}
                                    onChange={e => setFormData({ ...formData, name: e.target.value })}
                                    className="w-full px-3 py-2 border rounded-lg dark:bg-slate-800 dark:border-slate-700 focus:ring-2 focus:ring-indigo-500"
                                    placeholder="Nhập tên nhân viên"
                                />
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Mã nhân viên</label>
                                <input
                                    type="text"
                                    value={formData.employeeCode}
                                    onChange={e => setFormData({ ...formData, employeeCode: e.target.value })}
                                    className="w-full px-3 py-2 border rounded-lg dark:bg-slate-800 dark:border-slate-700 focus:ring-2 focus:ring-indigo-500"
                                    placeholder="NV001"
                                />
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Chức vụ</label>
                                <input
                                    type="text"
                                    value={formData.position}
                                    onChange={e => setFormData({ ...formData, position: e.target.value })}
                                    className="w-full px-3 py-2 border rounded-lg dark:bg-slate-800 dark:border-slate-700 focus:ring-2 focus:ring-indigo-500"
                                    placeholder="Chuyên viên KD"
                                />
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Đơn vị *</label>
                                <select
                                    required
                                    value={formData.unitId}
                                    onChange={e => setFormData({ ...formData, unitId: e.target.value })}
                                    className="w-full px-3 py-2 border rounded-lg dark:bg-slate-800 dark:border-slate-700 focus:ring-2 focus:ring-indigo-500"
                                >
                                    <option value="">-- Chọn Đơn vị --</option>
                                    {units.filter(u => u.id !== 'all').map(u => (
                                        <option key={u.id} value={u.id}>{u.name}</option>
                                    ))}
                                </select>
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Ngày vào làm</label>
                                <input
                                    type="date"
                                    value={formData.dateJoined}
                                    onChange={e => setFormData({ ...formData, dateJoined: e.target.value })}
                                    className="w-full px-3 py-2 border rounded-lg dark:bg-slate-800 dark:border-slate-700 focus:ring-2 focus:ring-indigo-500"
                                />
                            </div>
                        </div>
                    </div>

                    {/* Personal Info Section */}
                    <div className="border-t pt-4 dark:border-slate-700">
                        <h4 className="font-medium mb-3 flex items-center gap-2 text-slate-800 dark:text-slate-200">
                            <User size={18} className="text-indigo-500" />
                            Thông tin cá nhân
                        </h4>
                        <div className="grid grid-cols-3 gap-4">
                            <div>
                                <label className="block text-xs text-slate-500 mb-1">Ngày sinh</label>
                                <input
                                    type="date"
                                    value={formData.dateOfBirth}
                                    onChange={e => setFormData({ ...formData, dateOfBirth: e.target.value })}
                                    className="w-full px-3 py-2 border rounded-lg dark:bg-slate-800 dark:border-slate-700"
                                />
                            </div>
                            <div>
                                <label className="block text-xs text-slate-500 mb-1">Giới tính</label>
                                <select
                                    value={formData.gender}
                                    onChange={e => setFormData({ ...formData, gender: e.target.value as any })}
                                    className="w-full px-3 py-2 border rounded-lg dark:bg-slate-800 dark:border-slate-700"
                                >
                                    <option value="">-- Chọn --</option>
                                    <option value="male">Nam</option>
                                    <option value="female">Nữ</option>
                                    <option value="other">Khác</option>
                                </select>
                            </div>
                            <div>
                                <label className="block text-xs text-slate-500 mb-1">Tình trạng hôn nhân</label>
                                <select
                                    value={formData.maritalStatus}
                                    onChange={e => setFormData({ ...formData, maritalStatus: e.target.value as any })}
                                    className="w-full px-3 py-2 border rounded-lg dark:bg-slate-800 dark:border-slate-700"
                                >
                                    <option value="">-- Chọn --</option>
                                    <option value="single">Độc thân</option>
                                    <option value="married">Đã kết hôn</option>
                                    <option value="divorced">Ly hôn</option>
                                    <option value="widowed">Góa</option>
                                </select>
                            </div>
                            <div>
                                <label className="block text-xs text-slate-500 mb-1">Số CCCD/CMND</label>
                                <input
                                    type="text"
                                    value={formData.idNumber}
                                    onChange={e => setFormData({ ...formData, idNumber: e.target.value })}
                                    className="w-full px-3 py-2 border rounded-lg dark:bg-slate-800 dark:border-slate-700"
                                    placeholder="001234567890"
                                />
                            </div>
                            <div className="col-span-2">
                                <label className="block text-xs text-slate-500 mb-1">Địa chỉ</label>
                                <input
                                    type="text"
                                    value={formData.address}
                                    onChange={e => setFormData({ ...formData, address: e.target.value })}
                                    className="w-full px-3 py-2 border rounded-lg dark:bg-slate-800 dark:border-slate-700"
                                    placeholder="Số nhà, đường, quận/huyện, tỉnh/thành"
                                />
                            </div>
                        </div>
                    </div>

                    {/* Contact Info Section */}
                    <div className="border-t pt-4 dark:border-slate-700">
                        <h4 className="font-medium mb-3 flex items-center gap-2 text-slate-800 dark:text-slate-200">
                            <Phone size={18} className="text-emerald-500" />
                            Thông tin liên hệ
                        </h4>
                        <div className="grid grid-cols-2 gap-4">
                            <div>
                                <label className="block text-xs text-slate-500 mb-1">Email</label>
                                <input
                                    type="email"
                                    value={formData.email}
                                    onChange={e => setFormData({ ...formData, email: e.target.value })}
                                    className="w-full px-3 py-2 border rounded-lg dark:bg-slate-800 dark:border-slate-700"
                                    placeholder="email@company.com"
                                />
                            </div>
                            <div>
                                <label className="block text-xs text-slate-500 mb-1">Số điện thoại</label>
                                <input
                                    type="tel"
                                    value={formData.phone}
                                    onChange={e => setFormData({ ...formData, phone: e.target.value })}
                                    className="w-full px-3 py-2 border rounded-lg dark:bg-slate-800 dark:border-slate-700"
                                    placeholder="0912345678"
                                />
                            </div>
                            <div>
                                <label className="block text-xs text-slate-500 mb-1">Telegram</label>
                                <div className="relative">
                                    <Send size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                                    <input
                                        type="text"
                                        value={formData.telegram}
                                        onChange={e => setFormData({ ...formData, telegram: e.target.value })}
                                        className="w-full pl-9 pr-3 py-2 border rounded-lg dark:bg-slate-800 dark:border-slate-700"
                                        placeholder="@username"
                                    />
                                </div>
                            </div>
                            <div>
                                <label className="block text-xs text-slate-500 mb-1">Người liên hệ khẩn cấp</label>
                                <input
                                    type="text"
                                    value={formData.emergencyContact}
                                    onChange={e => setFormData({ ...formData, emergencyContact: e.target.value })}
                                    className="w-full px-3 py-2 border rounded-lg dark:bg-slate-800 dark:border-slate-700"
                                    placeholder="Tên người thân"
                                />
                            </div>
                            <div>
                                <label className="block text-xs text-slate-500 mb-1">SĐT khẩn cấp</label>
                                <input
                                    type="tel"
                                    value={formData.emergencyPhone}
                                    onChange={e => setFormData({ ...formData, emergencyPhone: e.target.value })}
                                    className="w-full px-3 py-2 border rounded-lg dark:bg-slate-800 dark:border-slate-700"
                                    placeholder="0912345678"
                                />
                            </div>
                        </div>
                    </div>

                    {/* Education Section */}
                    <div className="border-t pt-4 dark:border-slate-700">
                        <h4 className="font-medium mb-3 flex items-center gap-2 text-slate-800 dark:text-slate-200">
                            <GraduationCap size={18} className="text-amber-500" />
                            Học vấn & Chuyên môn
                        </h4>
                        <div className="grid grid-cols-3 gap-4">
                            <div>
                                <label className="block text-xs text-slate-500 mb-1">Trình độ học vấn</label>
                                <input
                                    type="text"
                                    value={formData.education}
                                    onChange={e => setFormData({ ...formData, education: e.target.value })}
                                    className="w-full px-3 py-2 border rounded-lg dark:bg-slate-800 dark:border-slate-700"
                                    placeholder="Đại học, Thạc sĩ..."
                                />
                            </div>
                            <div>
                                <label className="block text-xs text-slate-500 mb-1">Chuyên ngành</label>
                                <input
                                    type="text"
                                    value={formData.specialization}
                                    onChange={e => setFormData({ ...formData, specialization: e.target.value })}
                                    className="w-full px-3 py-2 border rounded-lg dark:bg-slate-800 dark:border-slate-700"
                                    placeholder="CNTT, Xây dựng..."
                                />
                            </div>
                            <div>
                                <label className="block text-xs text-slate-500 mb-1">Chứng chỉ</label>
                                <input
                                    type="text"
                                    value={formData.certificates}
                                    onChange={e => setFormData({ ...formData, certificates: e.target.value })}
                                    className="w-full px-3 py-2 border rounded-lg dark:bg-slate-800 dark:border-slate-700"
                                    placeholder="PMP, AWS, IELTS..."
                                />
                            </div>
                        </div>
                    </div>

                    {/* Contract Info Section */}
                    <div className="border-t pt-4 dark:border-slate-700">
                        <h4 className="font-medium mb-3 flex items-center gap-2 text-slate-800 dark:text-slate-200">
                            <Building size={18} className="text-purple-500" />
                            Hợp đồng lao động
                        </h4>
                        <div className="grid grid-cols-2 gap-4">
                            <div>
                                <label className="block text-xs text-slate-500 mb-1">Loại hợp đồng</label>
                                <select
                                    value={formData.contractType}
                                    onChange={e => setFormData({ ...formData, contractType: e.target.value })}
                                    className="w-full px-3 py-2 border rounded-lg dark:bg-slate-800 dark:border-slate-700"
                                >
                                    <option value="">-- Chọn --</option>
                                    <option value="Full-time">Toàn thời gian</option>
                                    <option value="Part-time">Bán thời gian</option>
                                    <option value="Contract">Hợp đồng</option>
                                    <option value="Intern">Thực tập</option>
                                    <option value="Freelance">Tự do</option>
                                </select>
                            </div>
                            <div>
                                <label className="block text-xs text-slate-500 mb-1">Ngày hết hạn HĐ</label>
                                <input
                                    type="date"
                                    value={formData.contractEndDate}
                                    onChange={e => setFormData({ ...formData, contractEndDate: e.target.value })}
                                    className="w-full px-3 py-2 border rounded-lg dark:bg-slate-800 dark:border-slate-700"
                                />
                            </div>
                            <div>
                                <label className="block text-xs text-slate-500 mb-1">Số tài khoản ngân hàng</label>
                                <input
                                    type="text"
                                    value={formData.bankAccount}
                                    onChange={e => setFormData({ ...formData, bankAccount: e.target.value })}
                                    className="w-full px-3 py-2 border rounded-lg dark:bg-slate-800 dark:border-slate-700"
                                    placeholder="1234567890"
                                />
                            </div>
                            <div>
                                <label className="block text-xs text-slate-500 mb-1">Ngân hàng</label>
                                <input
                                    type="text"
                                    value={formData.bankName}
                                    onChange={e => setFormData({ ...formData, bankName: e.target.value })}
                                    className="w-full px-3 py-2 border rounded-lg dark:bg-slate-800 dark:border-slate-700"
                                    placeholder="Vietcombank, BIDV..."
                                />
                            </div>
                        </div>
                    </div>

                    {/* Actions */}
                    <div className="flex justify-end gap-3 pt-4 border-t dark:border-slate-700">
                        <button
                            type="button"
                            onClick={onClose}
                            className="px-4 py-2 text-slate-700 hover:bg-slate-100 rounded-lg dark:text-slate-300 dark:hover:bg-slate-800"
                        >
                            Hủy
                        </button>
                        <button
                            type="submit"
                            disabled={isSubmitting || isUploading}
                            className="px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 flex items-center gap-2 disabled:opacity-50"
                        >
                            {isSubmitting ? <Loader2 size={18} className="animate-spin" /> : <Save size={18} />}
                            {initialData ? 'Cập nhật' : 'Thêm mới'}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
};

export default PersonnelForm;
