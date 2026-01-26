import React, { useState, useMemo, useEffect } from 'react';
import {
    Search,
    CreditCard,
    DollarSign,
    AlertCircle,
    CheckCircle2,
    Clock,
    FileCheck,
    Filter,
    ChevronRight,
    FileText,
    Building2,
    Calendar,
    Plus,
    Pencil,
    Trash2,
    MoreVertical
} from 'lucide-react';
import { MOCK_PAYMENTS, MOCK_CONTRACTS, MOCK_CUSTOMERS } from '../constants';
import { Payment, PaymentStatus } from '../types';
import { PaymentsAPI } from '../services/api';
import PaymentForm from './PaymentForm';

interface PaymentListProps {
    onSelectContract?: (id: string) => void;
}

const PaymentList: React.FC<PaymentListProps> = ({ onSelectContract }) => {
    const [searchQuery, setSearchQuery] = useState('');
    const [statusFilter, setStatusFilter] = useState<string>('all');
    const [typeFilter, setTypeFilter] = useState<'Revenue' | 'Expense'>('Revenue');
    const [payments, setPayments] = useState<Payment[]>(MOCK_PAYMENTS);
    const [stats, setStats] = useState<any>(null);

    // CRUD state
    const [isFormOpen, setIsFormOpen] = useState(false);
    const [editingPayment, setEditingPayment] = useState<Payment | undefined>(undefined);
    const [actionMenuId, setActionMenuId] = useState<string | null>(null);

    useEffect(() => {
        // Calculate stats based on current type filter
        const currentPayments = payments.filter(p => (p.paymentType || 'Revenue') === typeFilter);
        const total = currentPayments.reduce((sum, p) => sum + p.amount, 0);
        const paid = currentPayments.filter(p => p.status === 'Paid' || p.status === 'Tiền về').reduce((sum, p) => sum + p.paidAmount, 0);
        const pending = currentPayments.filter(p => p.status === 'Pending' || p.status === 'Chờ xuất HĐ').reduce((sum, p) => sum + p.amount, 0);
        const overdue = currentPayments.filter(p => p.status === 'Overdue' || p.status === 'Quá hạn').reduce((sum, p) => sum + (p.amount - p.paidAmount), 0);

        setStats({
            totalAmount: total,
            paidAmount: paid,
            pendingAmount: pending,
            overdueAmount: overdue,
            paidCount: currentPayments.filter(p => p.status === 'Paid' || p.status === 'Tiền về').length,
            pendingCount: currentPayments.filter(p => p.status === 'Pending' || p.status === 'Chờ xuất HĐ').length,
            overdueCount: currentPayments.filter(p => p.status === 'Overdue' || p.status === 'Quá hạn').length,
        });
    }, [payments, typeFilter]);

    const filteredPayments = useMemo(() => {
        return payments.filter(p => {
            const isTypeMatch = (p.paymentType || 'Revenue') === typeFilter;
            if (!isTypeMatch) return false;

            const contract = MOCK_CONTRACTS.find(c => c.id === p.contractId);
            const customer = MOCK_CUSTOMERS.find(c => c.id === p.customerId);

            const matchSearch = searchQuery === '' ||
                p.id.toLowerCase().includes(searchQuery.toLowerCase()) ||
                p.contractId.toLowerCase().includes(searchQuery.toLowerCase()) ||
                p.invoiceNumber?.toLowerCase().includes(searchQuery.toLowerCase()) ||
                customer?.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                contract?.title.toLowerCase().includes(searchQuery.toLowerCase());

            const matchStatus = statusFilter === 'all' || p.status === statusFilter;

            return matchSearch && matchStatus;
        });
    }, [payments, searchQuery, statusFilter, typeFilter]);

    const formatCurrency = (val: number) => {
        if (val >= 1e9) return `${(val / 1e9).toFixed(2)} tỷ`;
        if (val >= 1e6) return `${(val / 1e6).toFixed(0)} triệu`;
        return val.toLocaleString('vi-VN') + ' đ';
    };

    const getStatusConfig = (status: PaymentStatus) => {
        switch (status) {
            case 'Tiền về':
            case 'Paid':
                return { color: 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400', icon: CheckCircle2, label: typeFilter === 'Revenue' ? 'Tiền về' : 'Đã chi' };
            case 'Đã xuất HĐ':
                return { color: 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400', icon: FileCheck, label: 'Đã xuất HĐ' };
            case 'Chờ xuất HĐ':
            case 'Pending':
                return { color: 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400', icon: Clock, label: typeFilter === 'Revenue' ? 'Chờ thu' : 'Chờ chi' };
            case 'Quá hạn':
            case 'Overdue':
                return { color: 'bg-rose-100 text-rose-700 dark:bg-rose-900/30 dark:text-rose-400', icon: AlertCircle, label: 'Quá hạn' };
            default:
                return { color: 'bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-400', icon: Clock, label: status };
        }
    };

    const getCustomerName = (customerId: string) => {
        return MOCK_CUSTOMERS.find(c => c.id === customerId)?.shortName || 'N/A';
    };

    // CRUD handlers
    const handleAdd = () => {
        setEditingPayment(undefined);
        setIsFormOpen(true);
    };

    const handleEdit = (payment: Payment) => {
        setEditingPayment(payment);
        setIsFormOpen(true);
        setActionMenuId(null);
    };

    const handleDelete = (id: string) => {
        if (window.confirm('Bạn có chắc muốn xóa khoản thanh toán này?')) {
            setPayments(payments.filter(p => p.id !== id));
        }
        setActionMenuId(null);
    };

    const handleSave = (paymentData: any) => {
        if (paymentData.id) {
            // Update
            setPayments(payments.map(p => p.id === paymentData.id ? { ...p, ...paymentData } : p));
        } else {
            // Create
            const newPayment: Payment = {
                id: `PAY_${Date.now()}`,
                ...paymentData,
                paymentType: typeFilter // Default to current filter
            };
            setPayments([newPayment, ...payments]);
        }
        setIsFormOpen(false);
        setEditingPayment(undefined);
    };

    return (
        <div className="space-y-6 animate-in fade-in duration-500">
            {/* Header */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                    <h1 className="text-2xl md:text-3xl font-black text-slate-900 dark:text-slate-100">
                        Quản lý Tài chính
                    </h1>
                    <p className="text-slate-500 dark:text-slate-400 text-sm mt-1">
                        Theo dõi dòng tiền Thu & Chi
                    </p>
                </div>
                <div className="flex bg-slate-100 dark:bg-slate-800 p-1 rounded-xl">
                    <button
                        onClick={() => setTypeFilter('Revenue')}
                        className={`px-4 py-2 rounded-lg text-xs font-bold transition-all ${typeFilter === 'Revenue' ? 'bg-white dark:bg-slate-700 text-indigo-600 shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}
                    >
                        Khoản Thu (Revenue)
                    </button>
                    <button
                        onClick={() => setTypeFilter('Expense')}
                        className={`px-4 py-2 rounded-lg text-xs font-bold transition-all ${typeFilter === 'Expense' ? 'bg-white dark:bg-slate-700 text-rose-600 shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}
                    >
                        Khoản Chi (Expense)
                    </button>
                </div>
                <button
                    onClick={handleAdd}
                    className={`px-5 py-2.5 text-white rounded-xl font-bold text-sm flex items-center gap-2 transition-colors shadow-lg ${typeFilter === 'Revenue' ? 'bg-indigo-600 hover:bg-indigo-700 shadow-indigo-200' : 'bg-rose-600 hover:bg-rose-700 shadow-rose-200'}`}
                >
                    <Plus size={18} />
                    Thêm {typeFilter === 'Revenue' ? 'khoản thu' : 'khoản chi'}
                </button>
            </div>

            {/* Stats Cards */}
            {stats && (
                <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                    <div className="bg-white dark:bg-slate-900 p-4 rounded-2xl border border-slate-200 dark:border-slate-800">
                        <div className="flex items-center gap-3">
                            <div className="p-2 bg-emerald-100 dark:bg-emerald-900/30 rounded-xl">
                                <CheckCircle2 size={20} className="text-emerald-600 dark:text-emerald-400" />
                            </div>
                            <div>
                                <p className="text-2xl font-black text-emerald-600">{formatCurrency(stats.paidAmount)}</p>
                                <p className="text-[11px] text-slate-500 dark:text-slate-400">{typeFilter === 'Revenue' ? 'Tiền về' : 'Đã chi'} ({stats.paidCount})</p>
                            </div>
                        </div>
                    </div>
                    {typeFilter === 'Revenue' && (
                        <div className="bg-white dark:bg-slate-900 p-4 rounded-2xl border border-slate-200 dark:border-slate-800">
                            <div className="flex items-center gap-3">
                                <div className="p-2 bg-blue-100 dark:bg-blue-900/30 rounded-xl">
                                    <FileCheck size={20} className="text-blue-600 dark:text-blue-400" />
                                </div>
                                <div>
                                    <p className="text-2xl font-black text-blue-600">{formatCurrency(stats.invoicedAmount || 0)}</p>
                                    <p className="text-[11px] text-slate-500 dark:text-slate-400">Đã xuất HĐ</p>
                                </div>
                            </div>
                        </div>
                    )}
                    <div className="bg-white dark:bg-slate-900 p-4 rounded-2xl border border-slate-200 dark:border-slate-800">
                        <div className="flex items-center gap-3">
                            <div className="p-2 bg-amber-100 dark:bg-amber-900/30 rounded-xl">
                                <Clock size={20} className="text-amber-600 dark:text-amber-400" />
                            </div>
                            <div>
                                <p className="text-2xl font-black text-amber-600">{formatCurrency(stats.pendingAmount)}</p>
                                <p className="text-[11px] text-slate-500 dark:text-slate-400">{typeFilter === 'Revenue' ? 'Chờ thu' : 'Chờ chi'} ({stats.pendingCount})</p>
                            </div>
                        </div>
                    </div>
                    <div className="bg-white dark:bg-slate-900 p-4 rounded-2xl border border-slate-200 dark:border-slate-800">
                        <div className="flex items-center gap-3">
                            <div className="p-2 bg-rose-100 dark:bg-rose-900/30 rounded-xl">
                                <AlertCircle size={20} className="text-rose-600 dark:text-rose-400" />
                            </div>
                            <div>
                                <p className="text-2xl font-black text-rose-600">{formatCurrency(stats.overdueAmount)}</p>
                                <p className="text-[11px] text-slate-500 dark:text-slate-400">Quá hạn ({stats.overdueCount})</p>
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {/* Filters */}
            <div className="flex flex-col sm:flex-row gap-3">
                <div className="flex-1 relative">
                    <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
                    <input
                        type="text"
                        placeholder="Tìm kiếm theo mã, hợp đồng, hóa đơn..."
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        className="w-full pl-11 pr-4 py-3 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 transition-all"
                    />
                </div>
                <div className="flex items-center gap-2 px-4 py-2 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl">
                    <Filter size={16} className="text-slate-400" />
                    <select
                        value={statusFilter}
                        onChange={(e) => setStatusFilter(e.target.value)}
                        className="bg-transparent text-sm font-medium text-slate-700 dark:text-slate-300 focus:outline-none"
                    >
                        <option value="all">Tất cả trạng thái</option>
                        <option value="Tiền về">Tiền về</option>
                        <option value="Đã xuất HĐ">Đã xuất HĐ</option>
                        <option value="Chờ xuất HĐ">Chờ xuất HĐ</option>
                        <option value="Quá hạn">Quá hạn</option>
                    </select>
                </div>
            </div>

            {/* Table */}
            <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 overflow-hidden">
                <div className="overflow-x-auto">
                    <table className="w-full">
                        <thead>
                            <tr className="border-b border-slate-100 dark:border-slate-800 bg-slate-50 dark:bg-slate-800/50">
                                <th className="text-left py-4 px-5 text-xs font-black text-slate-500 dark:text-slate-400 uppercase tracking-wider">Mã / Hóa đơn</th>
                                <th className="text-left py-4 px-5 text-xs font-black text-slate-500 dark:text-slate-400 uppercase tracking-wider hidden lg:table-cell">Khách hàng</th>
                                <th className="text-left py-4 px-5 text-xs font-black text-slate-500 dark:text-slate-400 uppercase tracking-wider hidden md:table-cell">Hợp đồng</th>
                                <th className="text-left py-4 px-5 text-xs font-black text-slate-500 dark:text-slate-400 uppercase tracking-wider hidden sm:table-cell">Hạn</th>
                                <th className="text-right py-4 px-5 text-xs font-black text-slate-500 dark:text-slate-400 uppercase tracking-wider">Số tiền</th>
                                <th className="text-center py-4 px-5 text-xs font-black text-slate-500 dark:text-slate-400 uppercase tracking-wider">Trạng thái</th>
                                <th className="py-4 px-5 w-12"></th>
                            </tr>
                        </thead>
                        <tbody>
                            {filteredPayments.slice(0, 50).map((payment) => {
                                const statusConfig = getStatusConfig(payment.status);
                                const StatusIcon = statusConfig.icon;

                                return (
                                    <tr
                                        key={payment.id}
                                        className="border-b border-slate-50 dark:border-slate-800/50 hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors group"
                                    >
                                        <td className="py-4 px-5">
                                            <div className="flex items-center gap-3">
                                                <div className="p-2 bg-slate-100 dark:bg-slate-800 rounded-xl">
                                                    <CreditCard size={16} className="text-slate-500" />
                                                </div>
                                                <div>
                                                    <p className="font-bold text-slate-900 dark:text-slate-100 text-sm">{payment.id}</p>
                                                    <p className="text-xs text-slate-500 dark:text-slate-400">{payment.invoiceNumber}</p>
                                                </div>
                                            </div>
                                        </td>
                                        <td className="py-4 px-5 hidden lg:table-cell">
                                            <div className="flex items-center gap-2">
                                                <Building2 size={14} className="text-slate-400" />
                                                <span className="text-sm text-slate-700 dark:text-slate-300 font-medium">
                                                    {getCustomerName(payment.customerId)}
                                                </span>
                                            </div>
                                        </td>
                                        <td className="py-4 px-5 hidden md:table-cell">
                                            <button
                                                onClick={() => onSelectContract?.(payment.contractId)}
                                                className="flex items-center gap-2 text-indigo-600 hover:text-indigo-700"
                                            >
                                                <FileText size={14} />
                                                <span className="text-sm font-medium">{payment.contractId}</span>
                                            </button>
                                        </td>
                                        <td className="py-4 px-5 hidden sm:table-cell">
                                            <div className="flex items-center gap-2">
                                                <Calendar size={14} className="text-slate-400" />
                                                <span className="text-sm text-slate-600 dark:text-slate-400">
                                                    {new Date(payment.dueDate).toLocaleDateString('vi-VN')}
                                                </span>
                                            </div>
                                        </td>
                                        <td className="py-4 px-5 text-right">
                                            <p className="font-black text-slate-900 dark:text-slate-100">{formatCurrency(payment.amount)}</p>
                                            {payment.paidAmount > 0 && payment.paidAmount < payment.amount && (
                                                <p className="text-[10px] text-emerald-600">Đã thu: {formatCurrency(payment.paidAmount)}</p>
                                            )}
                                        </td>
                                        <td className="py-4 px-5 text-center">
                                            <span className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-[10px] font-bold uppercase ${statusConfig.color}`}>
                                                <StatusIcon size={12} />
                                                {statusConfig.label}
                                            </span>
                                        </td>
                                        <td className="py-4 px-5 relative">
                                            <button
                                                onClick={() => setActionMenuId(actionMenuId === payment.id ? null : payment.id)}
                                                className="p-1.5 text-slate-400 hover:text-slate-600 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg transition-all"
                                            >
                                                <MoreVertical size={16} />
                                            </button>
                                            {actionMenuId === payment.id && (
                                                <div className="absolute right-0 top-full mt-1 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl shadow-xl z-20 py-1 min-w-[140px]">
                                                    <button
                                                        onClick={() => handleEdit(payment)}
                                                        className="w-full px-4 py-2 text-left text-sm font-medium text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800 flex items-center gap-2"
                                                    >
                                                        <Pencil size={14} /> Sửa
                                                    </button>
                                                    <button
                                                        onClick={() => handleDelete(payment.id)}
                                                        className="w-full px-4 py-2 text-left text-sm font-medium text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-900/20 flex items-center gap-2"
                                                    >
                                                        <Trash2 size={14} /> Xóa
                                                    </button>
                                                </div>
                                            )}
                                        </td>
                                    </tr>
                                );
                            })}
                        </tbody>
                    </table>
                </div>

                {filteredPayments.length > 50 && (
                    <div className="px-5 py-3 border-t border-slate-100 dark:border-slate-800 text-center">
                        <p className="text-xs text-slate-500 dark:text-slate-400">
                            Hiển thị 50 / {filteredPayments.length} khoản thanh toán
                        </p>
                    </div>
                )}

                {filteredPayments.length === 0 && (
                    <div className="text-center py-12">
                        <div className="w-14 h-14 bg-slate-100 dark:bg-slate-800 rounded-full flex items-center justify-center mx-auto mb-3">
                            <CreditCard size={24} className="text-slate-400" />
                        </div>
                        <h3 className="text-base font-bold text-slate-700 dark:text-slate-300">Không tìm thấy</h3>
                        <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">Thử thay đổi bộ lọc</p>
                    </div>
                )}
            </div>

            {/* Payment Form Modal */}
            {isFormOpen && (
                <PaymentForm
                    payment={editingPayment}
                    onSave={handleSave}
                    onCancel={() => { setIsFormOpen(false); setEditingPayment(undefined); }}
                />
            )}
        </div>
    );
};

export default PaymentList;
