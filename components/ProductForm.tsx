import React, { useState, useEffect } from 'react';
import { toast } from 'sonner';
import { Save, X, Loader2 } from 'lucide-react';
import Modal from './ui/Modal';
import NumberInput from './ui/NumberInput';
import { Product, ProductCategory, Unit } from '../types';
import { UnitService } from '../services';

interface ProductFormProps {
    isOpen: boolean;
    onClose: () => void;
    onSave: (data: Omit<Product, 'id'> | Product) => Promise<void>;
    product?: Product; // If provided, we're editing
}

const CATEGORIES: ProductCategory[] = ['Phần mềm', 'Tư vấn', 'Thiết kế', 'Thi công', 'Bảo trì', 'Đào tạo', 'Khác'];

const ProductForm: React.FC<ProductFormProps> = ({ isOpen, onClose, onSave, product }) => {
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [formData, setFormData] = useState({
        code: '',
        name: '',
        category: 'Phần mềm' as ProductCategory,
        description: '',
        unit: 'Gói',
        basePrice: 0,
        costPrice: 0,
        isActive: true,
        unitId: '',
    });

    // Reset form when product changes
    useEffect(() => {
        if (product) {
            setFormData({
                code: product.code,
                name: product.name,
                category: product.category,
                description: product.description,
                unit: product.unit,
                basePrice: product.basePrice,
                costPrice: product.costPrice || 0,
                isActive: product.isActive,
                unitId: product.unitId || '',
            });
        } else {
            setFormData({
                code: '',
                name: '',
                category: 'Phần mềm',
                description: '',
                unit: 'Gói',
                basePrice: 0,
                costPrice: 0,
                isActive: true,
                unitId: '',
            });
        }
    }, [product, isOpen]);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsSubmitting(true);
        try {
            if (product) {
                await onSave({ ...formData, id: product.id });
            } else {
                await onSave(formData);
            }
            onClose();
        } catch (error) {
            console.error('Error saving product:', error);
            toast.error('Lỗi khi lưu sản phẩm');
        } finally {
            setIsSubmitting(false);
        }
    };



    const [units, setUnits] = useState<Unit[]>([]);
    useEffect(() => {
        UnitService.getActive().then(setUnits).catch(console.error);
    }, []);

    return (
        <Modal isOpen={isOpen} onClose={onClose} title={product ? 'Chỉnh sửa Sản phẩm' : 'Thêm Sản phẩm mới'} size="lg">
            <form onSubmit={handleSubmit} className="space-y-5">
                {/* Row 1: Code + Name */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                        <label className="block text-xs font-bold text-slate-600 dark:text-slate-400 mb-1.5 uppercase tracking-wide">Mã sản phẩm *</label>
                        <input
                            type="text"
                            required
                            value={formData.code}
                            onChange={e => setFormData(prev => ({ ...prev, code: e.target.value }))}
                            placeholder="VD: PM-DCS-01"
                            className="w-full px-4 py-3 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500 text-sm"
                        />
                    </div>
                    <div>
                        <label className="block text-xs font-bold text-slate-600 dark:text-slate-400 mb-1.5 uppercase tracking-wide">Tên sản phẩm *</label>
                        <input
                            type="text"
                            required
                            value={formData.name}
                            onChange={e => setFormData(prev => ({ ...prev, name: e.target.value }))}
                            placeholder="VD: Hệ thống quản lý dữ liệu"
                            className="w-full px-4 py-3 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500 text-sm"
                        />
                    </div>
                </div>

                {/* Row 2: Category + Unit */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                        <label className="block text-xs font-bold text-slate-600 dark:text-slate-400 mb-1.5 uppercase tracking-wide">Danh mục *</label>
                        <select
                            required
                            value={formData.category}
                            onChange={e => setFormData(prev => ({ ...prev, category: e.target.value as ProductCategory }))}
                            className="w-full px-4 py-3 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500 text-sm"
                        >
                            {CATEGORIES.map(cat => (
                                <option key={cat} value={cat}>{cat}</option>
                            ))}
                        </select>
                    </div>
                    <div>
                        <label className="block text-xs font-bold text-slate-600 dark:text-slate-400 mb-1.5 uppercase tracking-wide">Đơn vị tính *</label>
                        <input
                            type="text"
                            required
                            value={formData.unit}
                            onChange={e => setFormData(prev => ({ ...prev, unit: e.target.value }))}
                            placeholder="VD: Gói, m2, Tháng"
                            className="w-full px-4 py-3 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500 text-sm"
                        />
                    </div>
                </div>

                {/* Row 3: Business Unit */}
                <div>
                    <label className="block text-xs font-bold text-slate-600 dark:text-slate-400 mb-1.5 uppercase tracking-wide">Đơn vị phụ trách</label>
                    <select
                        value={formData.unitId}
                        onChange={e => setFormData(prev => ({ ...prev, unitId: e.target.value }))}
                        className="w-full px-4 py-3 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500 text-sm"
                    >
                        <option value="">-- Không chỉ định --</option>
                        {units.map(unit => (
                            <option key={unit.id} value={unit.id}>{unit.name}</option>
                        ))}
                    </select>
                </div>

                {/* Row 4: Description */}
                <div>
                    <label className="block text-xs font-bold text-slate-600 dark:text-slate-400 mb-1.5 uppercase tracking-wide">Mô tả</label>
                    <textarea
                        value={formData.description}
                        onChange={e => setFormData(prev => ({ ...prev, description: e.target.value }))}
                        rows={3}
                        placeholder="Mô tả chi tiết về sản phẩm/dịch vụ..."
                        className="w-full px-4 py-3 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500 text-sm resize-none"
                    />
                </div>

                {/* Row 5: Prices */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                        <label className="block text-xs font-bold text-slate-600 dark:text-slate-400 mb-1.5 uppercase tracking-wide">Đơn giá bán (VNĐ) *</label>
                        <NumberInput
                            value={formData.basePrice}
                            onChange={(value) => setFormData(prev => ({ ...prev, basePrice: value }))}
                            placeholder="VD: 500.000.000"
                            className="w-full px-4 py-3 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500 text-sm"
                            required
                        />
                    </div>
                    <div>
                        <label className="block text-xs font-bold text-slate-600 dark:text-slate-400 mb-1.5 uppercase tracking-wide">Giá vốn (VNĐ)</label>
                        <NumberInput
                            value={formData.costPrice}
                            onChange={(value) => setFormData(prev => ({ ...prev, costPrice: value }))}
                            placeholder="VD: 150.000.000"
                            className="w-full px-4 py-3 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500 text-sm"
                        />
                    </div>
                </div>

                {/* Row 6: Active Toggle */}
                <div className="flex items-center gap-3 py-2">
                    <button
                        type="button"
                        onClick={() => setFormData(prev => ({ ...prev, isActive: !prev.isActive }))}
                        className={`relative w-12 h-7 rounded-full transition-colors ${formData.isActive ? 'bg-emerald-500' : 'bg-slate-300 dark:bg-slate-700'}`}
                    >
                        <div className={`absolute top-1 w-5 h-5 bg-white rounded-full shadow transition-transform ${formData.isActive ? 'left-6' : 'left-1'}`} />
                    </button>
                    <span className="text-sm text-slate-700 dark:text-slate-300">
                        {formData.isActive ? 'Đang bán' : 'Ngừng bán'}
                    </span>
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
                        {product ? 'Cập nhật' : 'Thêm mới'}
                    </button>
                </div>
            </form>
        </Modal>
    );
};

export default ProductForm;
