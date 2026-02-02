import React from 'react';
import { Building } from 'lucide-react';
import { FormSectionProps } from './types';

const ContractSection: React.FC<FormSectionProps> = ({ formData, setFormData }) => {
    return (
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
    );
};

export default ContractSection;
