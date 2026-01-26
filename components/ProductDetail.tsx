import React, { useMemo } from 'react';
import {
    ArrowLeft,
    Package,
    DollarSign,
    Tag,
    FileText,
    Building2,
    Edit3,
    TrendingUp,
    CheckCircle,
    XCircle,
    Calendar,
    Hash
} from 'lucide-react';
import { Product } from '../types';
import { MOCK_UNITS, MOCK_CONTRACTS, MOCK_CUSTOMERS } from '../constants';

interface ProductDetailProps {
    product: Product;
    onBack: () => void;
    onEdit: () => void;
    onViewContract?: (id: string) => void;
}

const ProductDetail: React.FC<ProductDetailProps> = ({ product, onBack, onEdit, onViewContract }) => {
    const unit = MOCK_UNITS.find(u => u.id === product.unitId);

    // Find contracts using this product (by name/category match for demo)
    const relatedContracts = useMemo(() => {
        return MOCK_CONTRACTS.filter(c =>
            c.title.toLowerCase().includes(product.category.toLowerCase()) ||
            c.title.toLowerCase().includes(product.name.toLowerCase().split(' ')[0])
        ).slice(0, 10);
    }, [product]);

    const formatCurrency = (val: number) => {
        if (val >= 1e9) return `${(val / 1e9).toFixed(2)} tỷ`;
        if (val >= 1e6) return `${(val / 1e6).toFixed(0)} triệu`;
        return new Intl.NumberFormat('vi-VN').format(val) + ' đ';
    };

    const margin = product.basePrice && product.costPrice
        ? ((product.basePrice - product.costPrice) / product.basePrice * 100).toFixed(0)
        : 0;

    return (
        <div className="space-y-6 animate-in slide-in-from-right-4 duration-500 pb-12">
            {/* Header */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div className="flex items-center gap-4">
                    <button
                        onClick={onBack}
                        className="p-2 hover:bg-white dark:hover:bg-slate-800 rounded-xl border border-transparent hover:border-slate-200 dark:hover:border-slate-700 transition-all text-slate-500"
                    >
                        <ArrowLeft size={20} />
                    </button>
                    <div>
                        <div className="flex items-center gap-2 mb-1">
                            <span className="text-xs font-bold text-indigo-600 dark:text-indigo-400 bg-indigo-50 dark:bg-indigo-900/30 px-2 py-0.5 rounded uppercase tracking-wider">
                                {product.code}
                            </span>
                            <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full border uppercase ${product.isActive
                                    ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400 border-emerald-200'
                                    : 'bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-400 border-slate-200'
                                }`}>
                                {product.isActive ? 'Đang kinh doanh' : 'Ngừng kinh doanh'}
                            </span>
                        </div>
                        <h1 className="text-xl md:text-2xl font-bold text-slate-900 dark:text-slate-100 leading-tight">{product.name}</h1>
                    </div>
                </div>
                <button
                    onClick={onEdit}
                    className="flex items-center justify-center gap-2 px-4 py-2 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-sm font-semibold text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-700 transition-all"
                >
                    <Edit3 size={16} />
                    Chỉnh sửa
                </button>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {/* Main Info */}
                <div className="lg:col-span-2 space-y-6">
                    {/* Financial Summary */}
                    <div className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-sm p-6 md:p-8">
                        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
                            <div className="space-y-1">
                                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Giá bán</p>
                                <p className="text-2xl font-black text-slate-900 dark:text-slate-100">
                                    {formatCurrency(product.basePrice)}
                                </p>
                                <p className="text-[10px] text-slate-400">/{product.unit}</p>
                            </div>
                            <div className="space-y-1">
                                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Giá vốn</p>
                                <p className="text-2xl font-black text-slate-600 dark:text-slate-300">
                                    {formatCurrency(product.costPrice || 0)}
                                </p>
                                <p className="text-[10px] text-slate-400">/{product.unit}</p>
                            </div>
                            <div className="space-y-1">
                                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Biên lợi nhuận</p>
                                <p className="text-2xl font-black text-emerald-600 dark:text-emerald-400">
                                    {margin}%
                                </p>
                            </div>
                            <div className="space-y-1">
                                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Đơn vị phụ trách</p>
                                <p className="text-lg font-bold text-indigo-600 dark:text-indigo-400">
                                    {unit?.name || 'Chưa phân công'}
                                </p>
                            </div>
                        </div>
                    </div>

                    {/* Description */}
                    <div className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-sm p-6 md:p-8">
                        <h3 className="text-lg font-bold text-slate-800 dark:text-slate-100 mb-4 flex items-center gap-2">
                            <FileText size={20} className="text-indigo-600 dark:text-indigo-400" />
                            Mô tả sản phẩm/dịch vụ
                        </h3>
                        <p className="text-sm text-slate-600 dark:text-slate-400 leading-relaxed">
                            {product.description}
                        </p>
                    </div>

                    {/* Related Contracts */}
                    <div className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-sm overflow-hidden">
                        <div className="p-6 border-b border-slate-100 dark:border-slate-800">
                            <h3 className="text-lg font-bold text-slate-800 dark:text-slate-100 flex items-center gap-2">
                                <TrendingUp size={20} className="text-indigo-600 dark:text-indigo-400" />
                                Hợp đồng liên quan ({relatedContracts.length})
                            </h3>
                        </div>
                        {relatedContracts.length > 0 ? (
                            <div className="divide-y divide-slate-100 dark:divide-slate-800">
                                {relatedContracts.map(contract => {
                                    const customer = MOCK_CUSTOMERS.find(c => c.id === contract.customerId);
                                    return (
                                        <div
                                            key={contract.id}
                                            onClick={() => onViewContract?.(contract.id)}
                                            className="p-4 hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors cursor-pointer"
                                        >
                                            <div className="flex justify-between items-start">
                                                <div>
                                                    <div className="flex items-center gap-2 mb-1">
                                                        <span className="text-xs font-bold text-indigo-600 dark:text-indigo-400">{contract.id}</span>
                                                        <span className={`text-[9px] font-bold px-2 py-0.5 rounded uppercase ${contract.status === 'Active'
                                                                ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400'
                                                                : 'bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-400'
                                                            }`}>
                                                            {contract.status}
                                                        </span>
                                                    </div>
                                                    <p className="text-sm font-medium text-slate-700 dark:text-slate-300 truncate max-w-md">{contract.title}</p>
                                                    <p className="text-xs text-slate-400">{customer?.shortName || contract.partyA}</p>
                                                </div>
                                                <p className="text-sm font-black text-slate-900 dark:text-slate-100">{formatCurrency(contract.value)}</p>
                                            </div>
                                        </div>
                                    );
                                })}
                            </div>
                        ) : (
                            <div className="p-8 text-center text-sm text-slate-500 dark:text-slate-400">
                                Chưa có hợp đồng nào sử dụng sản phẩm này
                            </div>
                        )}
                    </div>
                </div>

                {/* Side Info */}
                <div className="space-y-6">
                    {/* Product Card */}
                    <div className="bg-gradient-to-br from-indigo-600 to-purple-700 rounded-3xl p-6 text-white shadow-xl shadow-indigo-200 dark:shadow-none">
                        <div className="w-14 h-14 bg-white/20 rounded-2xl flex items-center justify-center mb-4">
                            <Package size={28} />
                        </div>
                        <h4 className="text-lg font-bold mb-2">{product.name}</h4>
                        <div className="space-y-2 text-sm text-indigo-100">
                            <div className="flex items-center gap-2">
                                <Tag size={14} />
                                <span>{product.category}</span>
                            </div>
                            <div className="flex items-center gap-2">
                                <Hash size={14} />
                                <span>Đơn vị: {product.unit}</span>
                            </div>
                            <div className="flex items-center gap-2">
                                {product.isActive ? <CheckCircle size={14} /> : <XCircle size={14} />}
                                <span>{product.isActive ? 'Đang kinh doanh' : 'Ngừng'}</span>
                            </div>
                        </div>
                    </div>

                    {/* Quick Stats */}
                    <div className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-sm p-6">
                        <h4 className="font-bold text-slate-800 dark:text-slate-200 mb-4 flex items-center gap-2">
                            <TrendingUp size={18} className="text-slate-400" />
                            Thống kê nhanh
                        </h4>
                        <div className="space-y-4">
                            <div className="flex justify-between items-center">
                                <span className="text-xs text-slate-500">Số hợp đồng</span>
                                <span className="text-sm font-black text-slate-900 dark:text-slate-100">{relatedContracts.length}</span>
                            </div>
                            <div className="flex justify-between items-center">
                                <span className="text-xs text-slate-500">Tổng doanh thu</span>
                                <span className="text-sm font-black text-emerald-600">
                                    {formatCurrency(relatedContracts.reduce((sum, c) => sum + c.value, 0))}
                                </span>
                            </div>
                            <div className="flex justify-between items-center">
                                <span className="text-xs text-slate-500">HĐ đang thực hiện</span>
                                <span className="text-sm font-black text-indigo-600">
                                    {relatedContracts.filter(c => c.status === 'Active').length}
                                </span>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default ProductDetail;
