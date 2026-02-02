import React, { useState, useMemo, useEffect } from 'react';
import { toast } from 'sonner';
import {
    MoreVertical,
    ChevronLeft,
    ChevronRight,
    Loader2,
    Search,
    CreditCard,
    DollarSign,
    AlertCircle,
    CheckCircle2,
    Clock,
    FileCheck,
    Filter,
    FileText,
    Building2,
    Calendar,
    Plus,
    Pencil,
    Trash2
} from 'lucide-react';
import { Payment, PaymentStatus, Customer } from '../types';
import { PaymentService, ContractService, CustomerService } from '../services';
import PaymentForm from './PaymentForm';

interface PaymentListProps {
    onSelectContract?: (id: string) => void;
}

const PaymentList: React.FC<PaymentListProps> = ({ onSelectContract }) => {
    const [searchQuery, setSearchQuery] = useState('');
    const [statusFilter, setStatusFilter] = useState<string>('all');
    const [typeFilter, setTypeFilter] = useState<'Revenue' | 'Expense'>('Revenue');
    const [payments, setPayments] = useState<Payment[]>([]);
    const [customers, setCustomers] = useState<Customer[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [stats, setStats] = useState<any>(null);

    // Pagination State
    const [page, setPage] = useState(1);
    const [limit, setLimit] = useState(20);
    const [totalCount, setTotalCount] = useState(0);
    const [debouncedSearch, setDebouncedSearch] = useState('');

    // CRUD state
    const [isFormOpen, setIsFormOpen] = useState(false);
    const [editingPayment, setEditingPayment] = useState<Payment | undefined>(undefined);
    const [actionMenuId, setActionMenuId] = useState<string | null>(null);

    // Debounce search
    useEffect(() => {
        const timer = setTimeout(() => {
            setDebouncedSearch(searchQuery);
            setPage(1);
        }, 500);
        return () => clearTimeout(timer);
    }, [searchQuery]);

    // Fetch Data (Paginated)
    const fetchData = async () => {
        setIsLoading(true);
        try {
            const [listRes, statsRes, customersData] = await Promise.all([
                PaymentService.list({
                    page,
                    limit,
                    search: debouncedSearch,
                    type: typeFilter,
                    status: statusFilter
                }),
                PaymentService.getStats({ type: typeFilter }),
                customers.length === 0 ? CustomerService.getAll({ pageSize: 200 }) : Promise.resolve({ data: customers })
                // TODO: Optimize - Backend should populate customer_name directly in payment response
            ]);

            setPayments(listRes.data);
            setTotalCount(listRes.count);
            setStats(statsRes);

            if (customers.length === 0) {
                // customerService.getAll returns { data, total ... }
                // if customersData comes from CustomerService.getAll, it is { data: ... }
                // if it comes from Promise.resolve, it is { data: customers } (coerced above)
                const incoming = (customersData as any).data || customersData;
                setCustomers(incoming as Customer[]);
            }

        } catch (error) {
            console.error("Failed to fetch data:", error);
            toast.error("Không thể tải dữ liệu thanh toán");
        } finally {
            setIsLoading(false);
        }
    };

    useEffect(() => {
        fetchData();
    }, [page, limit, debouncedSearch, typeFilter, statusFilter]);

    // Legacy effect for stats calculation removed (now server-side or separately fetched)

    // Memoized is removed as we depend on API result now
    const totalPages = Math.ceil(totalCount / limit);

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
        const customer = customers.find(c => c.id === customerId);
        return customer ? customer.name : customerId;
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

    const handleDelete = async (id: string) => {
        if (window.confirm('Bạn có chắc muốn xóa khoản thanh toán này?')) {
            try {
                await PaymentService.delete(id);
                setPayments(payments.filter(p => p.id !== id));
                toast.success("Đã xóa khoản thanh toán");
            } catch (error) {
                console.error("Failed to delete payment:", error);
                toast.error("Xóa thất bại");
            }
        }
        setActionMenuId(null);
    };

    const handleSave = async (paymentData: any) => {
        try {
            if (paymentData.id) {
                // Update
                const updated = await PaymentService.update(paymentData.id, paymentData);
                if (updated) {
                    setPayments(payments.map(p => p.id === paymentData.id ? updated : p));
                }
            } else {
                // Create
                const newPaymentData = {
                    ...paymentData,
                    paymentType: typeFilter // Default to current filter
                };
                const created = await PaymentService.create(newPaymentData);
                setPayments([created, ...payments]);
            }
            setIsFormOpen(false);
            setEditingPayment(undefined);
            setIsFormOpen(false);
            setEditingPayment(undefined);
            fetchData(); // Refresh to ensure data consistency
            toast.success("Lưu khoản thanh toán thành công");
        } catch (error) {
            console.error("Failed to save payment:", error);
            toast.error("Lưu thất bại");
        }
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
                        onClick={() => { setTypeFilter('Revenue'); setPage(1); }}
                        className={`px-4 py-2 rounded-lg text-xs font-bold transition-all ${typeFilter === 'Revenue' ? 'bg-white dark:bg-slate-700 text-indigo-600 shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}
                    >
                        Khoản Thu
                    </button>
                    <button
                        onClick={() => { setTypeFilter('Expense'); setPage(1); }}
                        className={`px-4 py-2 rounded-lg text-xs font-bold transition-all ${typeFilter === 'Expense' ? 'bg-white dark:bg-slate-700 text-rose-600 shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}
                    >
                        Khoản Chi
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
                        onChange={(e) => { setStatusFilter(e.target.value); setPage(1); }}
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
                            {isLoading ? (
                                <tr>
                                    <td colSpan={7} className="p-8 text-center text-slate-500">
                                        <Loader2 className="animate-spin inline-block mr-2" /> Đang tải dữ liệu...
                                    </td>
                                </tr>
                            ) : payments.map((payment) => {
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

                <div className="flex items-center justify-between p-4 border-t border-slate-100 dark:border-slate-800">
                    <div className="text-sm font-bold text-slate-500">
                        Hiển thị {payments.length} / {totalCount} kết quả
                    </div>
                    <div className="flex items-center gap-2">
                        <button
                            onClick={() => setPage(p => Math.max(1, p - 1))}
                            disabled={page === 1}
                            className="p-2 rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 hover:bg-slate-200 dark:hover:bg-slate-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                        >
                            <ChevronLeft size={20} />
                        </button>
                        <div className="flex items-center gap-1">
                            {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                                let p = i + 1;
                                if (totalPages > 5 && page > 3) p = page - 2 + i;
                                if (p > totalPages) return null;
                                return (
                                    <button
                                        key={p}
                                        onClick={() => setPage(p)}
                                        className={`w-10 h-10 rounded-xl text-sm font-black transition-all ${page === p
                                            ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-200 dark:shadow-none'
                                            : 'bg-transparent text-slate-500 hover:bg-slate-50 dark:hover:bg-slate-800'
                                            }`}
                                    >
                                        {p}
                                    </button>
                                );
                            })}
                        </div>
                        <button
                            onClick={() => setPage(p => Math.min(totalPages, p + 1))}
                            disabled={page === totalPages || totalPages === 0}
                            className="p-2 rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 hover:bg-slate-200 dark:hover:bg-slate-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                        >
                            <ChevronRight size={20} />
                        </button>
                    </div>
                </div>

                {!isLoading && payments.length === 0 && (
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
                    initialPaymentType={typeFilter}
                    onSave={handleSave}
                    onCancel={() => { setIsFormOpen(false); setEditingPayment(undefined); }}
                />
            )}
        </div>
    );
};

export default PaymentList;
