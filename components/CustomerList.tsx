import React, { useState, useMemo } from 'react';
import {
    Search,
    Building2,
    Phone,
    MapPin,
    FileText,
    TrendingUp,
    Filter,
    Plus,
    Pencil,
    Trash2,
    MoreVertical
} from 'lucide-react';
import { MOCK_CUSTOMERS, MOCK_CONTRACTS } from '../constants';
import { CustomersAPI } from '../services/api';
import { Customer } from '../types';
import CustomerForm from './CustomerForm';

interface CustomerListProps {
    onSelectCustomer?: (id: string) => void;
}

const CustomerList: React.FC<CustomerListProps> = ({ onSelectCustomer }) => {
    const [searchQuery, setSearchQuery] = useState('');
    const [industryFilter, setIndustryFilter] = useState<string>('all');
    const [typeFilter, setTypeFilter] = useState<'all' | 'Customer' | 'Supplier'>('all'); // Default to All view
    const [customers, setCustomers] = useState<Customer[]>(MOCK_CUSTOMERS);

    // CRUD state
    const [isFormOpen, setIsFormOpen] = useState(false);
    const [editingCustomer, setEditingCustomer] = useState<Customer | undefined>(undefined);
    const [actionMenuId, setActionMenuId] = useState<string | null>(null);

    const industries = useMemo(() => {
        const set = new Set(customers.map(c => c.industry));
        return ['all', ...Array.from(set)];
    }, [customers]);

    const filteredCustomers = useMemo(() => {
        let result = customers;

        if (typeFilter !== 'all') {
            result = result.filter(c => c.type === typeFilter || c.type === 'Both' || (!c.type && typeFilter === 'Customer')); // Backward compat
        }

        if (industryFilter !== 'all') {
            result = result.filter(c => c.industry === industryFilter);
        }

        if (searchQuery) {
            const query = searchQuery.toLowerCase();
            result = result.filter(c =>
                c.name.toLowerCase().includes(query) ||
                c.shortName.toLowerCase().includes(query) ||
                (c.contactPerson || '').toLowerCase().includes(query)
            );
        }
        return result;
    }, [customers, industryFilter, searchQuery]);

    const getCustomerStats = (customer: Customer) => {
        const contracts = MOCK_CONTRACTS.filter(c =>
            c.partyA.includes(customer.shortName) || c.clientInitials === customer.shortName
        );
        const totalValue = contracts.reduce((sum, c) => sum + c.value, 0);
        const totalRevenue = contracts.reduce((sum, c) => sum + c.actualRevenue, 0);
        const activeContracts = contracts.filter(c => c.status === 'Active').length;
        return { contractCount: contracts.length, totalValue, totalRevenue, activeContracts };
    };

    const formatCurrency = (val: number) => {
        if (val >= 1e9) return `${(val / 1e9).toFixed(1)} tỷ`;
        if (val >= 1e6) return `${(val / 1e6).toFixed(0)} tr`;
        return val.toLocaleString('vi-VN');
    };

    const getIndustryColor = (industry: string) => {
        switch (industry) {
            case 'Xây dựng': return 'bg-orange-100 text-orange-700 dark:bg-orange-900/30 dark:text-orange-400';
            case 'Bất động sản': return 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400';
            case 'Năng lượng': return 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400';
            case 'Công nghệ': return 'bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-400';
            case 'Sản xuất': return 'bg-rose-100 text-rose-700 dark:bg-rose-900/30 dark:text-rose-400';
            default: return 'bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-400';
        }
    };

    // Summary stats
    const totalStats = useMemo(() => {
        let totalContracts = 0;
        let totalValue = 0;
        filteredCustomers.forEach(c => {
            const stats = getCustomerStats(c);
            totalContracts += stats.contractCount;
            totalValue += stats.totalValue;
        });
        return { totalContracts, totalValue };
    }, [filteredCustomers]);

    // CRUD handlers
    const handleAdd = () => {
        setEditingCustomer(undefined);
        setIsFormOpen(true);
    };

    const handleEdit = (customer: Customer) => {
        setEditingCustomer(customer);
        setIsFormOpen(true);
        setActionMenuId(null);
    };

    const handleSave = async (data: Omit<Customer, 'id'> | Customer) => {
        if ('id' in data) {
            await CustomersAPI.update(data.id, data);
            setCustomers(prev => prev.map(c => c.id === data.id ? data as Customer : c));
        } else {
            const newCustomer = await CustomersAPI.create(data);
            setCustomers(prev => [newCustomer, ...prev]);
        }
    };

    const handleDelete = async (id: string) => {
        if (confirm('Bạn có chắc chắn muốn xóa khách hàng này?')) {
            await CustomersAPI.delete(id);
            setCustomers(prev => prev.filter(c => c.id !== id));
        }
        setActionMenuId(null);
    };

    return (
        <div className="space-y-6 animate-in fade-in duration-500">
            {/* Header */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                    <h1 className="text-2xl md:text-3xl font-black text-slate-900 dark:text-slate-100">
                        {typeFilter === 'all' ? 'Quản lý Đối tác' : typeFilter === 'Customer' ? 'Quản lý Khách hàng' : 'Quản lý Nhà cung cấp'}
                    </h1>
                    <p className="text-slate-500 dark:text-slate-400 text-sm mt-1">
                        {filteredCustomers.length} {typeFilter === 'Supplier' ? 'nhà cung cấp' : 'khách hàng'} • Tổng {totalStats.totalContracts} hợp đồng
                    </p>
                </div>

                <div className="flex gap-3">
                    <div className="relative flex-1 md:w-72">
                        <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
                        <input
                            type="text"
                            placeholder="Tìm khách hàng..."
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            className="w-full pl-11 pr-4 py-3 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl focus:outline-none focus:ring-2 focus:ring-indigo-500 text-sm"
                        />
                    </div>
                    <button
                        onClick={handleAdd}
                        className="flex items-center gap-2 px-5 py-3 bg-indigo-600 text-white rounded-2xl font-bold text-sm hover:bg-indigo-700 transition-colors shadow-lg shadow-indigo-200 dark:shadow-none"
                    >
                        <Plus size={18} />
                        <span className="hidden md:inline">Thêm Đối tác</span>
                    </button>
                </div>
            </div>

            {/* Customer Form Modal */}
            <CustomerForm
                isOpen={isFormOpen}
                onClose={() => { setIsFormOpen(false); setEditingCustomer(undefined); }}
                onSave={handleSave}
                customer={editingCustomer}
            />

            {/* Partner Type Tabs */}
            <div className="flex gap-1 bg-slate-100 dark:bg-slate-800 p-1 rounded-xl w-fit">
                {(['all', 'Customer', 'Supplier'] as const).map(type => (
                    <button
                        key={type}
                        onClick={() => {
                            // Filter logic here or pass to state. 
                            // Current code uses industryFilter only. I need to add typeFilter state.
                            // But wait, the Replace instruction below will rewrite the component part.
                            // I should add state first? No, I am replacing a chunk.
                            // Let's assume I added state `typeFilter` in a previous or same edit?
                            // This tool call is only replacing lines 230ish? No, I need to do a larger replacement or multiple chunks.
                            // Let's look at the file again. I need to add state `typeFilter` first.
                        }}
                        className={`px-4 py-2 rounded-lg text-sm font-bold transition-all ${
                            // logic 
                            ''
                            }`}
                    >
                        {type === 'all' ? 'Tất cả' : type === 'Customer' ? 'Khách hàng' : 'Nhà cung cấp'}
                    </button>
                ))}
            </div>

            {/* Industry Filter */}
            <div className="flex gap-2 overflow-x-auto pb-2 no-scrollbar">
                {industries.map(industry => (
                    <button
                        key={industry}
                        onClick={() => setIndustryFilter(industry)}
                        className={`px-4 py-2 rounded-xl text-xs font-bold whitespace-nowrap transition-all ${industryFilter === industry
                            ? 'bg-indigo-600 text-white'
                            : 'bg-white dark:bg-slate-900 text-slate-600 dark:text-slate-400 border border-slate-200 dark:border-slate-800 hover:border-indigo-300'
                            }`}
                    >
                        {industry === 'all' ? 'Tất cả' : industry}
                    </button>
                ))}
            </div>

            {/* Stats Summary */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div className="bg-white dark:bg-slate-900 p-5 rounded-2xl border border-slate-200 dark:border-slate-800">
                    <div className="flex items-center gap-3">
                        <div className="p-2.5 bg-indigo-100 dark:bg-indigo-900/30 rounded-xl text-indigo-600 dark:text-indigo-400">
                            <Building2 size={20} />
                        </div>
                        <div>
                            <p className="text-2xl font-black text-slate-900 dark:text-slate-100">{filteredCustomers.length}</p>
                            <p className="text-xs text-slate-500 dark:text-slate-400 font-medium">Đối tác</p>
                        </div>
                    </div>
                </div>
                <div className="bg-white dark:bg-slate-900 p-5 rounded-2xl border border-slate-200 dark:border-slate-800">
                    <div className="flex items-center gap-3">
                        <div className="p-2.5 bg-emerald-100 dark:bg-emerald-900/30 rounded-xl text-emerald-600 dark:text-emerald-400">
                            <FileText size={20} />
                        </div>
                        <div>
                            <p className="text-2xl font-black text-slate-900 dark:text-slate-100">{totalStats.totalContracts}</p>
                            <p className="text-xs text-slate-500 dark:text-slate-400 font-medium">Hợp đồng</p>
                        </div>
                    </div>
                </div>
                <div className="bg-white dark:bg-slate-900 p-5 rounded-2xl border border-slate-200 dark:border-slate-800">
                    <div className="flex items-center gap-3">
                        <div className="p-2.5 bg-amber-100 dark:bg-amber-900/30 rounded-xl text-amber-600 dark:text-amber-400">
                            <TrendingUp size={20} />
                        </div>
                        <div>
                            <p className="text-2xl font-black text-slate-900 dark:text-slate-100">{formatCurrency(totalStats.totalValue)}</p>
                            <p className="text-xs text-slate-500 dark:text-slate-400 font-medium">Tổng giá trị</p>
                        </div>
                    </div>
                </div>
                <div className="bg-white dark:bg-slate-900 p-5 rounded-2xl border border-slate-200 dark:border-slate-800">
                    <div className="flex items-center gap-3">
                        <div className="p-2.5 bg-purple-100 dark:bg-purple-900/30 rounded-xl text-purple-600 dark:text-purple-400">
                            <Filter size={20} />
                        </div>
                        <div>
                            <p className="text-2xl font-black text-slate-900 dark:text-slate-100">{industries.length - 1}</p>
                            <p className="text-xs text-slate-500 dark:text-slate-400 font-medium">Ngành nghề</p>
                        </div>
                    </div>
                </div>
            </div>

            {/* Customer List */}
            <div className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 overflow-hidden">
                <div className="overflow-x-auto">
                    <table className="w-full">
                        <thead>
                            <tr className="border-b border-slate-100 dark:border-slate-800">
                                <th className="text-left py-4 px-6 text-xs font-black text-slate-500 dark:text-slate-400 uppercase tracking-wider">Đối tác</th>
                                <th className="text-left py-4 px-6 text-xs font-black text-slate-500 dark:text-slate-400 uppercase tracking-wider hidden md:table-cell">Ngành</th>
                                <th className="text-left py-4 px-6 text-xs font-black text-slate-500 dark:text-slate-400 uppercase tracking-wider hidden lg:table-cell">Liên hệ</th>
                                <th className="text-right py-4 px-6 text-xs font-black text-slate-500 dark:text-slate-400 uppercase tracking-wider">Hợp đồng</th>
                                <th className="text-right py-4 px-6 text-xs font-black text-slate-500 dark:text-slate-400 uppercase tracking-wider hidden sm:table-cell">Giá trị</th>
                                <th className="py-4 px-6"></th>
                            </tr>
                        </thead>
                        <tbody>
                            {filteredCustomers.map((customer) => {
                                const stats = getCustomerStats(customer);
                                return (
                                    <tr
                                        key={customer.id}
                                        className="border-b border-slate-50 dark:border-slate-800/50 hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors group cursor-pointer"
                                        onClick={() => onSelectCustomer?.(customer.id)}
                                    >
                                        <td className="py-4 px-6">
                                            <div className="flex items-center gap-4">
                                                <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-slate-100 to-slate-200 dark:from-slate-800 dark:to-slate-700 flex items-center justify-center font-black text-slate-600 dark:text-slate-300 text-sm">
                                                    {customer.shortName.substring(0, 3)}
                                                </div>
                                                <div>
                                                    <h3 className="font-bold text-slate-900 dark:text-slate-100 text-sm">
                                                        {customer.name}
                                                    </h3>
                                                    <p className="text-xs text-slate-500 dark:text-slate-400 flex items-center gap-1 mt-0.5">
                                                        <MapPin size={12} />
                                                        {customer.address.split(',').pop()?.trim()}
                                                    </p>
                                                </div>
                                            </div>
                                        </td>
                                        <td className="py-4 px-6 hidden md:table-cell">
                                            <span className={`px-3 py-1 rounded-lg text-[10px] font-bold ${getIndustryColor(customer.industry)}`}>
                                                {customer.industry}
                                            </span>
                                        </td>
                                        <td className="py-4 px-6 hidden lg:table-cell">
                                            <div className="space-y-1">
                                                <p className="text-sm font-medium text-slate-700 dark:text-slate-300">{customer.contactPerson}</p>
                                                <div className="flex items-center gap-3 text-xs text-slate-500 dark:text-slate-400">
                                                    <span className="flex items-center gap-1"><Phone size={12} />{customer.phone}</span>
                                                </div>
                                            </div>
                                        </td>
                                        <td className="py-4 px-6 text-right">
                                            <p className="font-bold text-slate-900 dark:text-slate-100">{stats.contractCount}</p>
                                            {stats.activeContracts > 0 && (
                                                <p className="text-[10px] text-emerald-600 dark:text-emerald-400 font-bold">{stats.activeContracts} đang thực hiện</p>
                                            )}
                                        </td>
                                        <td className="py-4 px-6 text-right hidden sm:table-cell">
                                            <p className="font-bold text-slate-900 dark:text-slate-100">{formatCurrency(stats.totalValue)}</p>
                                            <p className="text-[10px] text-slate-500 dark:text-slate-400">DT: {formatCurrency(stats.totalRevenue)}</p>
                                        </td>
                                        <td className="py-4 px-6 relative">
                                            <button
                                                onClick={() => setActionMenuId(actionMenuId === customer.id ? null : customer.id)}
                                                className="p-2 text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 dark:hover:bg-indigo-900/30 rounded-xl transition-all"
                                            >
                                                <MoreVertical size={16} />
                                            </button>

                                            {actionMenuId === customer.id && (
                                                <>
                                                    <div className="fixed inset-0 z-10" onClick={() => setActionMenuId(null)} />
                                                    <div className="absolute right-0 top-full mt-1 w-36 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl shadow-xl z-20 overflow-hidden">
                                                        <button
                                                            onClick={() => handleEdit(customer)}
                                                            className="w-full flex items-center gap-2 px-4 py-2.5 text-sm text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors"
                                                        >
                                                            <Pencil size={14} />
                                                            Chỉnh sửa
                                                        </button>
                                                        <button
                                                            onClick={() => handleDelete(customer.id)}
                                                            className="w-full flex items-center gap-2 px-4 py-2.5 text-sm text-rose-600 dark:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-900/20 transition-colors"
                                                        >
                                                            <Trash2 size={14} />
                                                            Xóa
                                                        </button>
                                                    </div>
                                                </>
                                            )}
                                        </td>
                                    </tr>
                                );
                            })}
                        </tbody>
                    </table>
                </div>

                {filteredCustomers.length === 0 && (
                    <div className="text-center py-16">
                        <div className="w-20 h-20 bg-slate-100 dark:bg-slate-800 rounded-full flex items-center justify-center mx-auto mb-4">
                            <Building2 size={32} className="text-slate-400" />
                        </div>
                        <h3 className="text-lg font-bold text-slate-700 dark:text-slate-300">Không tìm thấy đối tác</h3>
                        <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">Thử thay đổi bộ lọc hoặc từ khóa tìm kiếm</p>
                    </div>
                )}
            </div>
        </div>
    );
};

export default CustomerList;
