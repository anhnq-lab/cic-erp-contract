import React, { useState, useEffect } from 'react';
import {
    X,
    Save,
    CreditCard,
    Calendar,
    DollarSign,
    FileText,
    Building2,
    Hash
} from 'lucide-react';
import { Payment, PaymentStatus, PaymentMethod } from '../types';
import { MOCK_CONTRACTS, MOCK_CUSTOMERS } from '../constants';

interface PaymentFormProps {
    payment?: Payment;
    onSave: (payment: Omit<Payment, 'id'> | Payment) => void;
    onCancel: () => void;
}

const PaymentForm: React.FC<PaymentFormProps> = ({ payment, onSave, onCancel }) => {
    const [contractId, setContractId] = useState(payment?.contractId || '');
    const [customerId, setCustomerId] = useState(payment?.customerId || '');
    const [dueDate, setDueDate] = useState(payment?.dueDate || '');
    const [paymentDate, setPaymentDate] = useState(payment?.paymentDate || '');
    const [amount, setAmount] = useState(payment?.amount || 0);
    const [paidAmount, setPaidAmount] = useState(payment?.paidAmount || 0);
    const [status, setStatus] = useState<PaymentStatus>(payment?.status || 'Chờ xuất HĐ');
    const [method, setMethod] = useState<PaymentMethod>(payment?.method || 'Chuyển khoản');
    const [invoiceNumber, setInvoiceNumber] = useState(payment?.invoiceNumber || '');
    const [reference, setReference] = useState(payment?.reference || '');
    const [notes, setNotes] = useState(payment?.notes || '');

    // Update customerId when contractId changes
    useEffect(() => {
        if (contractId) {
            const contract = MOCK_CONTRACTS.find(c => c.id === contractId);
            if (contract) {
                setCustomerId(contract.customerId);
            }
        }
    }, [contractId]);

    const handleSubmit = () => {
        const paymentData = {
            ...(payment?.id && { id: payment.id }),
            contractId,
            customerId,
            dueDate,
            paymentDate,
            amount,
            paidAmount,
            status,
            method,
            invoiceNumber,
            reference,
            notes,
        };
        onSave(paymentData as any);
    };

    const formatCurrency = (val: number) => new Intl.NumberFormat('vi-VN').format(val);

    const statuses: PaymentStatus[] = ['Chờ xuất HĐ', 'Đã xuất HĐ', 'Tiền về', 'Quá hạn'];
    const methods: PaymentMethod[] = ['Chuyển khoản', 'Tiền mặt', 'LC', 'Khác'];

    return (
        <div className="fixed inset-0 z-50 bg-slate-900/50 backdrop-blur-sm flex items-center justify-center p-4">
            <div className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-2xl w-full max-w-2xl max-h-[90vh] overflow-hidden animate-in zoom-in-95 duration-300">
                {/* Header */}
                <div className="px-6 py-5 border-b border-slate-100 dark:border-slate-800 flex justify-between items-center">
                    <div className="flex items-center gap-4">
                        <div className="w-12 h-12 bg-indigo-600 rounded-2xl flex items-center justify-center text-white shadow-lg">
                            <CreditCard size={24} />
                        </div>
                        <div>
                            <h2 className="text-xl font-black text-slate-900 dark:text-slate-100">
                                {payment ? 'Sửa thanh toán' : 'Thêm thanh toán'}
                            </h2>
                            <p className="text-xs text-slate-500">Quản lý khoản thanh toán hợp đồng</p>
                        </div>
                    </div>
                    <button onClick={onCancel} className="p-2 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-xl transition-colors">
                        <X size={20} className="text-slate-500" />
                    </button>
                </div>

                {/* Form */}
                <div className="p-6 space-y-6 overflow-y-auto max-h-[calc(90vh-180px)]">
                    {/* Contract & Customer */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div className="space-y-2">
                            <label className="text-xs font-bold text-slate-500 uppercase flex items-center gap-1">
                                <FileText size={12} /> Hợp đồng *
                            </label>
                            <select
                                value={contractId}
                                onChange={(e) => setContractId(e.target.value)}
                                className="w-full px-4 py-3 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-sm font-medium focus:outline-none focus:ring-2 focus:ring-indigo-500"
                            >
                                <option value="">-- Chọn hợp đồng --</option>
                                {MOCK_CONTRACTS.slice(0, 50).map(c => (
                                    <option key={c.id} value={c.id}>{c.id} - {c.title.substring(0, 40)}...</option>
                                ))}
                            </select>
                        </div>
                        <div className="space-y-2">
                            <label className="text-xs font-bold text-slate-500 uppercase flex items-center gap-1">
                                <Building2 size={12} /> Khách hàng
                            </label>
                            <select
                                value={customerId}
                                onChange={(e) => setCustomerId(e.target.value)}
                                className="w-full px-4 py-3 bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-sm font-medium text-slate-500"
                                disabled
                            >
                                <option value="">Tự động theo HĐ</option>
                                {MOCK_CUSTOMERS.map(c => (
                                    <option key={c.id} value={c.id}>{c.shortName} - {c.name}</option>
                                ))}
                            </select>
                        </div>
                    </div>

                    {/* Invoice & Dates */}
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        <div className="space-y-2">
                            <label className="text-xs font-bold text-slate-500 uppercase flex items-center gap-1">
                                <Hash size={12} /> Số hóa đơn
                            </label>
                            <input
                                type="text"
                                value={invoiceNumber}
                                onChange={(e) => setInvoiceNumber(e.target.value)}
                                placeholder="VD: HĐ001-1"
                                className="w-full px-4 py-3 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-sm font-medium focus:outline-none focus:ring-2 focus:ring-indigo-500"
                            />
                        </div>
                        <div className="space-y-2">
                            <label className="text-xs font-bold text-slate-500 uppercase flex items-center gap-1">
                                <Calendar size={12} /> Hạn thanh toán *
                            </label>
                            <input
                                type="date"
                                value={dueDate}
                                onChange={(e) => setDueDate(e.target.value)}
                                className="w-full px-4 py-3 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-sm font-medium focus:outline-none focus:ring-2 focus:ring-indigo-500"
                            />
                        </div>
                        <div className="space-y-2">
                            <label className="text-xs font-bold text-slate-500 uppercase flex items-center gap-1">
                                <Calendar size={12} /> Ngày thanh toán
                            </label>
                            <input
                                type="date"
                                value={paymentDate}
                                onChange={(e) => setPaymentDate(e.target.value)}
                                className="w-full px-4 py-3 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-sm font-medium focus:outline-none focus:ring-2 focus:ring-indigo-500"
                            />
                        </div>
                    </div>

                    {/* Amount & Status */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div className="space-y-2">
                            <label className="text-xs font-bold text-slate-500 uppercase flex items-center gap-1">
                                <DollarSign size={12} /> Số tiền *
                            </label>
                            <input
                                type="number"
                                value={amount}
                                onChange={(e) => setAmount(Number(e.target.value))}
                                placeholder="0"
                                className="w-full px-4 py-3 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-sm font-bold focus:outline-none focus:ring-2 focus:ring-indigo-500"
                            />
                            {amount > 0 && (
                                <p className="text-xs text-slate-400">{formatCurrency(amount)} VND</p>
                            )}
                        </div>
                        <div className="space-y-2">
                            <label className="text-xs font-bold text-slate-500 uppercase flex items-center gap-1">
                                <DollarSign size={12} /> Đã thu
                            </label>
                            <input
                                type="number"
                                value={paidAmount}
                                onChange={(e) => setPaidAmount(Number(e.target.value))}
                                placeholder="0"
                                className="w-full px-4 py-3 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-sm font-bold focus:outline-none focus:ring-2 focus:ring-emerald-500"
                            />
                        </div>
                    </div>

                    {/* Status & Method */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div className="space-y-2">
                            <label className="text-xs font-bold text-slate-500 uppercase">Trạng thái *</label>
                            <div className="grid grid-cols-2 gap-2">
                                {statuses.map(s => (
                                    <button
                                        key={s}
                                        type="button"
                                        onClick={() => setStatus(s)}
                                        className={`px-3 py-2 rounded-xl text-xs font-bold transition-all ${status === s
                                                ? s === 'Tiền về' ? 'bg-emerald-600 text-white'
                                                    : s === 'Đã xuất HĐ' ? 'bg-blue-600 text-white'
                                                        : s === 'Quá hạn' ? 'bg-rose-600 text-white'
                                                            : 'bg-amber-600 text-white'
                                                : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400'
                                            }`}
                                    >
                                        {s}
                                    </button>
                                ))}
                            </div>
                        </div>
                        <div className="space-y-2">
                            <label className="text-xs font-bold text-slate-500 uppercase">Phương thức</label>
                            <div className="grid grid-cols-2 gap-2">
                                {methods.map(m => (
                                    <button
                                        key={m}
                                        type="button"
                                        onClick={() => setMethod(m)}
                                        className={`px-3 py-2 rounded-xl text-xs font-bold transition-all ${method === m
                                                ? 'bg-indigo-600 text-white'
                                                : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400'
                                            }`}
                                    >
                                        {m}
                                    </button>
                                ))}
                            </div>
                        </div>
                    </div>

                    {/* Reference & Notes */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div className="space-y-2">
                            <label className="text-xs font-bold text-slate-500 uppercase">Số UNC/Chứng từ</label>
                            <input
                                type="text"
                                value={reference}
                                onChange={(e) => setReference(e.target.value)}
                                placeholder="Số UNC..."
                                className="w-full px-4 py-3 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-sm font-medium focus:outline-none focus:ring-2 focus:ring-indigo-500"
                            />
                        </div>
                        <div className="space-y-2">
                            <label className="text-xs font-bold text-slate-500 uppercase">Ghi chú</label>
                            <input
                                type="text"
                                value={notes}
                                onChange={(e) => setNotes(e.target.value)}
                                placeholder="Ghi chú..."
                                className="w-full px-4 py-3 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-sm font-medium focus:outline-none focus:ring-2 focus:ring-indigo-500"
                            />
                        </div>
                    </div>
                </div>

                {/* Footer */}
                <div className="px-6 py-4 border-t border-slate-100 dark:border-slate-800 flex justify-end gap-3">
                    <button
                        onClick={onCancel}
                        className="px-6 py-2.5 text-slate-600 dark:text-slate-400 font-bold text-sm hover:bg-slate-100 dark:hover:bg-slate-800 rounded-xl transition-colors"
                    >
                        Hủy
                    </button>
                    <button
                        onClick={handleSubmit}
                        disabled={!contractId || !dueDate || !amount}
                        className="px-8 py-2.5 bg-indigo-600 text-white font-bold text-sm rounded-xl hover:bg-indigo-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
                    >
                        <Save size={16} />
                        {payment ? 'Cập nhật' : 'Thêm mới'}
                    </button>
                </div>
            </div>
        </div>
    );
};

export default PaymentForm;
