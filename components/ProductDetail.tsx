import React, { useState, useEffect, useMemo } from 'react';
import {
    ArrowLeft,
    Package,
    Tag,
    FileText,
    TrendingUp,
    CheckCircle,
    XCircle,
    Hash,
    Loader2,
    Edit3,
    Trash2
} from 'lucide-react';
import { Product, Unit, Contract, Customer } from '../types';
import { UnitsAPI, ContractsAPI, CustomersAPI, ProductsAPI } from '../services/api';

interface ProductDetailProps {
    productId: string;
    onBack: () => void;
    onEdit: () => void;
    onViewContract?: (id: string) => void;
}

const ProductDetail: React.FC<ProductDetailProps> = ({ productId, onBack, onEdit, onViewContract }) => {
    const [product, setProduct] = useState<Product | null>(null);
    const [unit, setUnit] = useState<Unit | null>(null);
    const [relatedContracts, setRelatedContracts] = useState<Contract[]>([]);
    const [customers, setCustomers] = useState<Customer[]>([]);
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
        const fetchData = async () => {
            setIsLoading(true);
            try {
                // Fetch Product
                const productData = await ProductsAPI.getById(productId);
                if (!productData) {
                    setIsLoading(false);
                    return;
                }
                setProduct(productData);

                // Fetch Unit
                if (productData.unitId) {
                    const unitData = await UnitsAPI.getById(productData.unitId);
                    setUnit(unitData || null);
                }

                // Fetch Contracts and Customers
                const [allContracts, allCustomers] = await Promise.all([
                    ContractsAPI.getAll(),
                    CustomersAPI.getAll()
                ]);

                setCustomers(allCustomers);

                // Filter related contracts
                const related = allContracts.filter(c =>
                    (c.category && c.category === productData.category) ||
                    (c.lineItems?.some(item => item.name === productData.name)) ||
                    c.title.toLowerCase().includes(productData.name.toLowerCase()) ||
                    c.title.toLowerCase().includes(productData.name.split(' ')[0].toLowerCase())
                );

                setRelatedContracts(related.sort((a, b) =>
                    new Date(b.signedDate).getTime() - new Date(a.signedDate).getTime()
                ).slice(0, 20));

            } catch (error) {
                console.error("Error fetching product details:", error);
            } finally {
                setIsLoading(false);
            }
        };

        fetchData();
    }, [productId]);

    const formatCurrency = (val: number) => {
        if (val >= 1e9) return `${(val / 1e9).toFixed(2)} tỷ`;
        if (val >= 1e6) return `${(val / 1e6).toFixed(0)} triệu`;
        return new Intl.NumberFormat('vi-VN').format(val) + ' đ';
    };

    if (isLoading) {
        return (
            <div className="flex items-center justify-center h-full min-h-[400px]">
                <Loader2 size={32} className="animate-spin text-indigo-500" />
            </div>
        );
    }

    if (!product) {
        return (
            <div className="flex flex-col items-center justify-center h-full py-12">
                <p className="text-slate-500 mb-4">Không tìm thấy sản phẩm</p>
                <button onClick={onBack} className="text-indigo-600 font-bold hover:underline">Quay lại</button>
            </div>
        );
    }

    const margin = product.basePrice && product.costPrice
        ? ((product.basePrice - product.costPrice) / product.basePrice * 100).toFixed(0)
        : 0;

    const stats = {
        contractCount: relatedContracts.length,
        totalValue: relatedContracts.reduce((sum, c) => sum + c.value, 0),
        totalRevenue: relatedContracts.reduce((sum, c) => sum + c.actualRevenue, 0),
        activeContracts: relatedContracts.filter(c => c.status === 'Active').length
    };

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
                <div className="flex gap-2">
                    <button
                        onClick={onEdit}
                        className="flex items-center justify-center gap-2 px-4 py-2 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-sm font-semibold text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-700 transition-all"
                    >
                        <Edit3 size={16} />
                        Chỉnh sửa
                    </button>
                    <button
                        onClick={async () => {
                            if (confirm('Bạn có chắc chắn muốn xóa sản phẩm này? hành động này không thể hoàn tác.')) {
                                try {
                                    await ProductsAPI.delete(productId);
                                    onBack();
                                } catch (error) {
                                    console.error('Failed to delete product', error);
                                    alert('Có lỗi xảy ra khi xóa sản phẩm');
                                }
                            }
                        }}
                        className="flex items-center justify-center gap-2 px-4 py-2 bg-white dark:bg-slate-800 border border-rose-200 dark:border-rose-900/30 rounded-xl text-sm font-semibold text-rose-600 dark:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-900/20 transition-all"
                    >
                        <Trash2 size={16} />
                        Xóa
                    </button>
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {/* Main Info */}
                <div className="lg:col-span-2 space-y-6">
                    {/* Financial Summary */}
                    <div className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-sm p-6 md:p-8">
                        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
                            <div className="space-y-1">
                                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Giá bán (Dự kiến)</p>
                                <p className="text-2xl font-black text-slate-900 dark:text-slate-100">
                                    {formatCurrency(product.basePrice)}
                                </p>
                                <p className="text-[10px] text-slate-400">/{product.unit}</p>
                            </div>
                            <div className="space-y-1">
                                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Giá vốn (Ước tính)</p>
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
                            {product.description || 'Chưa có mô tả.'}
                        </p>
                    </div>

                    {/* Related Contracts */}
                    <div className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-sm overflow-hidden">
                        <div className="p-6 border-b border-slate-100 dark:border-slate-800">
                            <h3 className="text-lg font-bold text-slate-800 dark:text-slate-100 flex items-center gap-2">
                                <TrendingUp size={20} className="text-indigo-600 dark:text-indigo-400" />
                                Hợp đồng liên quan ({stats.contractCount})
                            </h3>
                        </div>
                        {relatedContracts.length > 0 ? (
                            <div className="divide-y divide-slate-100 dark:divide-slate-800">
                                {relatedContracts.map(contract => {
                                    const customer = customers.find(c => c.id === contract.customerId);
                                    return (
                                        <div
                                            key={contract.id}
                                            onClick={() => onViewContract?.(contract.id)}
                                            className="p-4 hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors cursor-pointer"
                                        >
                                            <div className="flex justify-between items-start">
                                                <div className="min-w-0 pr-4">
                                                    <div className="flex items-center gap-2 mb-1">
                                                        <span className="text-xs font-bold text-indigo-600 dark:text-indigo-400">{contract.id.slice(0, 8)}...</span>
                                                        <span className={`text-[9px] font-bold px-2 py-0.5 rounded uppercase ${contract.status === 'Active'
                                                            ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400'
                                                            : 'bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-400'
                                                            }`}>
                                                            {contract.status}
                                                        </span>
                                                    </div>
                                                    <p className="text-sm font-medium text-slate-700 dark:text-slate-300 truncate">{contract.title}</p>
                                                    <p className="text-xs text-slate-400 mt-0.5">{customer?.shortName || contract.partyA}</p>
                                                </div>
                                                <div className="text-right shrink-0">
                                                    <p className="text-xs text-slate-400 mb-0.5">{contract.signedDate}</p>
                                                    <p className="text-sm font-black text-slate-900 dark:text-slate-100">{formatCurrency(contract.value)}</p>
                                                </div>
                                            </div>
                                        </div>
                                    );
                                })}
                            </div>
                        ) : (
                            <div className="p-8 text-center text-sm text-slate-500 dark:text-slate-400">
                                Chưa tìm thấy hợp đồng nào liên quan đến sản phẩm này.
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
                            Thống kê (từ HĐ liên quan)
                        </h4>
                        <div className="space-y-4">
                            <div className="flex justify-between items-center">
                                <span className="text-xs text-slate-500">Số hợp đồng</span>
                                <span className="text-sm font-black text-slate-900 dark:text-slate-100">{stats.contractCount}</span>
                            </div>
                            <div className="flex justify-between items-center">
                                <span className="text-xs text-slate-500">Tổng giá trị HĐ</span>
                                <span className="text-sm font-black text-indigo-600">
                                    {formatCurrency(stats.totalValue)}
                                </span>
                            </div>
                            <div className="flex justify-between items-center">
                                <span className="text-xs text-slate-500">Doanh thu thực tế</span>
                                <span className="text-sm font-black text-emerald-600">
                                    {formatCurrency(stats.totalRevenue)}
                                </span>
                            </div>
                            <div className="flex justify-between items-center">
                                <span className="text-xs text-slate-500">HĐ đang thực hiện</span>
                                <span className="text-sm font-black text-indigo-600">
                                    {stats.activeContracts}
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
