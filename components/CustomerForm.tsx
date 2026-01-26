import React, { useState, useEffect } from 'react';
import { Save, Loader2 } from 'lucide-react';
import Modal from './ui/Modal';
import { Customer } from '../types';

interface CustomerFormProps {
    isOpen: boolean;
    onClose: () => void;
    onSave: (data: Omit<Customer, 'id'> | Customer) => Promise<void>;
    customer?: Customer;
    defaultType?: 'Customer' | 'Supplier' | 'Both' | 'all';
}

const INDUSTRIES = ['Xây dựng', 'Bất động sản', 'Năng lượng', 'Công nghệ', 'Sản xuất', 'Khác'];

const CustomerForm: React.FC<CustomerFormProps> = ({ isOpen, onClose, onSave, customer, defaultType = 'Customer' }) => {
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [formData, setFormData] = useState({
        name: '',
        shortName: '',
        industry: 'Xây dựng',
        contactPerson: '',
        phone: '',
        email: '',
        address: '',
        taxCode: '',
        website: '',
        notes: '',
        type: (defaultType === 'all' ? 'Customer' : defaultType) as 'Customer' | 'Supplier' | 'Both',
    });

    useEffect(() => {
        if (customer) {
            setFormData({
                name: customer.name,
                shortName: customer.shortName,
                industry: customer.industry,
                contactPerson: customer.contactPerson || '',
                phone: customer.phone || '',
                email: customer.email || '',
                address: customer.address || '',
                taxCode: customer.taxCode || '',
                website: customer.website || '',
                notes: customer.notes || '',
                type: customer.type || 'Customer',
            });
        } else {
            setFormData({
                name: '',
                shortName: '',
                industry: 'Xây dựng',
                contactPerson: '',
                phone: '',
                email: '',
                address: '',
                taxCode: '',
                website: '',
                notes: '',
                type: (defaultType === 'all' ? 'Customer' : defaultType) as 'Customer' | 'Supplier' | 'Both',
            });
        }
    }, [customer, isOpen, defaultType]);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsSubmitting(true);
        try {
            if (customer) {
                await onSave({ ...formData, id: customer.id });
            } else {
                await onSave(formData);
            }
            onClose();
        } catch (error) {
            console.error('Error saving customer:', error);
        } finally {
            setIsSubmitting(false);
        }
    };

    return (
        <Modal isOpen={isOpen} onClose={onClose} title={customer ? 'Chỉnh sửa Khách hàng' : 'Thêm Khách hàng mới'} size="lg">
            <form onSubmit={handleSubmit} className="space-y-5">
                {/* Type Selection */}
                <div className="flex gap-4 p-4 bg-slate-50 dark:bg-slate-800/50 rounded-xl border border-slate-100 dark:border-slate-800">
                    <label className="flex items-center gap-2 cursor-pointer">
                        <input
                            type="radio"
                            name="type"
                            value="Customer"
                            checked={formData.type === 'Customer'}
                            onChange={() => setFormData(prev => ({ ...prev, type: 'Customer' }))}
                            className="w-4 h-4 text-indigo-600"
                        />
                        <span className="text-sm font-bold text-slate-700 dark:text-slate-300">Khách hàng</span>
                    </label>
                    <label className="flex items-center gap-2 cursor-pointer">
                        <input
                            type="radio"
                            name="type"
                            value="Supplier"
                            checked={formData.type === 'Supplier'}
                            onChange={() => setFormData(prev => ({ ...prev, type: 'Supplier' }))}
                            className="w-4 h-4 text-indigo-600"
                        />
                        <span className="text-sm font-bold text-slate-700 dark:text-slate-300">Nhà cung cấp</span>
                    </label>
                    <label className="flex items-center gap-2 cursor-pointer">
                        <input
                            type="radio"
                            name="type"
                            value="Both"
                            checked={formData.type === 'Both'}
                            onChange={() => setFormData(prev => ({ ...prev, type: 'Both' }))}
                            className="w-4 h-4 text-indigo-600"
                        />
                        <span className="text-sm font-bold text-slate-700 dark:text-slate-300">Cả hai</span>
                    </label>
                </div>

                {/* Row 1: Name + Short Name */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                        <label className="block text-xs font-bold text-slate-600 dark:text-slate-400 mb-1.5 uppercase tracking-wide">Tên công ty *</label>
                        <input
                            type="text"
                            required
                            value={formData.name}
                            onChange={e => setFormData(prev => ({ ...prev, name: e.target.value }))}
                            placeholder="VD: FECON Corporation"
                            className="w-full px-4 py-3 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500 text-sm"
                        />
                    </div>
                    <div>
                        <label className="block text-xs font-bold text-slate-600 dark:text-slate-400 mb-1.5 uppercase tracking-wide">Tên viết tắt *</label>
                        <input
                            type="text"
                            required
                            value={formData.shortName}
                            onChange={e => setFormData(prev => ({ ...prev, shortName: e.target.value.toUpperCase() }))}
                            placeholder="VD: FECON"
                            className="w-full px-4 py-3 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500 text-sm"
                        />
                    </div>
                </div>

                {/* Row 2: Industry + Tax Code */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                        <label className="block text-xs font-bold text-slate-600 dark:text-slate-400 mb-1.5 uppercase tracking-wide">Ngành nghề *</label>
                        <select
                            required
                            value={formData.industry}
                            onChange={e => setFormData(prev => ({ ...prev, industry: e.target.value }))}
                            className="w-full px-4 py-3 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500 text-sm"
                        >
                            {INDUSTRIES.map(ind => (
                                <option key={ind} value={ind}>{ind}</option>
                            ))}
                        </select>
                    </div>
                    <div>
                        <label className="block text-xs font-bold text-slate-600 dark:text-slate-400 mb-1.5 uppercase tracking-wide">Mã số thuế</label>
                        <input
                            type="text"
                            value={formData.taxCode}
                            onChange={e => setFormData(prev => ({ ...prev, taxCode: e.target.value }))}
                            placeholder="VD: 0101234567"
                            className="w-full px-4 py-3 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500 text-sm"
                        />
                    </div>
                </div>

                {/* Contact Info Section */}
                <div className="pt-4 border-t border-slate-100 dark:border-slate-800">
                    <h3 className="text-sm font-bold text-slate-900 dark:text-slate-100 mb-4">Thông tin liên hệ</h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                            <label className="block text-xs font-bold text-slate-600 dark:text-slate-400 mb-1.5 uppercase tracking-wide">Người liên hệ</label>
                            <input
                                type="text"
                                value={formData.contactPerson}
                                onChange={e => setFormData(prev => ({ ...prev, contactPerson: e.target.value }))}
                                placeholder="VD: Nguyễn Văn Hùng"
                                className="w-full px-4 py-3 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500 text-sm"
                            />
                        </div>
                        <div>
                            <label className="block text-xs font-bold text-slate-600 dark:text-slate-400 mb-1.5 uppercase tracking-wide">Số điện thoại</label>
                            <input
                                type="text"
                                value={formData.phone}
                                onChange={e => setFormData(prev => ({ ...prev, phone: e.target.value }))}
                                placeholder="VD: 024 3784 5678"
                                className="w-full px-4 py-3 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500 text-sm"
                            />
                        </div>
                        <div>
                            <label className="block text-xs font-bold text-slate-600 dark:text-slate-400 mb-1.5 uppercase tracking-wide">Email</label>
                            <input
                                type="email"
                                value={formData.email}
                                onChange={e => setFormData(prev => ({ ...prev, email: e.target.value }))}
                                placeholder="VD: contact@company.vn"
                                className="w-full px-4 py-3 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500 text-sm"
                            />
                        </div>
                        <div>
                            <label className="block text-xs font-bold text-slate-600 dark:text-slate-400 mb-1.5 uppercase tracking-wide">Website</label>
                            <input
                                type="text"
                                value={formData.website}
                                onChange={e => setFormData(prev => ({ ...prev, website: e.target.value }))}
                                placeholder="VD: www.company.vn"
                                className="w-full px-4 py-3 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500 text-sm"
                            />
                        </div>
                    </div>
                </div>

                {/* Address */}
                <div>
                    <label className="block text-xs font-bold text-slate-600 dark:text-slate-400 mb-1.5 uppercase tracking-wide">Địa chỉ</label>
                    <input
                        type="text"
                        value={formData.address}
                        onChange={e => setFormData(prev => ({ ...prev, address: e.target.value }))}
                        placeholder="VD: Tầng 15, Tòa nhà ABC, Quận Cầu Giấy, Hà Nội"
                        className="w-full px-4 py-3 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500 text-sm"
                    />
                </div>

                {/* Notes */}
                <div>
                    <label className="block text-xs font-bold text-slate-600 dark:text-slate-400 mb-1.5 uppercase tracking-wide">Ghi chú</label>
                    <textarea
                        value={formData.notes}
                        onChange={e => setFormData(prev => ({ ...prev, notes: e.target.value }))}
                        rows={2}
                        placeholder="Ghi chú thêm về khách hàng..."
                        className="w-full px-4 py-3 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500 text-sm resize-none"
                    />
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
                        disabled={isSubmitting}
                        className="flex items-center gap-2 px-5 py-2.5 bg-indigo-600 text-white text-sm font-bold rounded-xl hover:bg-indigo-700 transition-colors disabled:opacity-50"
                    >
                        {isSubmitting ? <Loader2 size={18} className="animate-spin" /> : <Save size={18} />}
                        {customer ? 'Cập nhật' : 'Thêm mới'}
                    </button>
                </div>
            </form>
        </Modal>
    );
};

export default CustomerForm;
