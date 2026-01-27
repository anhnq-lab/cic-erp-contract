
import React, { useState, useMemo, useEffect } from 'react';
import { toast } from 'sonner';
import { Search, Building, Plus, Pencil, Trash2, Target, TrendingUp, Users, Eye } from 'lucide-react';
import { UnitsAPI } from '../services/api';
import { Unit } from '../types';
import UnitForm from './UnitForm';

interface UnitListProps {
    onSelectUnit?: (id: string) => void;
}

const UnitList: React.FC<UnitListProps> = ({ onSelectUnit }) => {
    const [units, setUnits] = useState<Unit[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [searchQuery, setSearchQuery] = useState('');

    // CRUD State
    const [isFormOpen, setIsFormOpen] = useState(false);
    const [editingUnit, setEditingUnit] = useState<Unit | undefined>(undefined);

    // Fetch data
    useEffect(() => {
        fetchUnits();
    }, []);

    const fetchUnits = async () => {
        setIsLoading(true);
        try {
            const data = await UnitsAPI.getAll();
            // Filter out the "All" mock unit if present, or handle it as needed
            setUnits(data.filter(u => u.id !== 'all'));
        } catch (error) {
            console.error('Error fetching units:', error);
        } finally {
            setIsLoading(false);
        }
    };

    const filteredUnits = useMemo(() => {
        if (!searchQuery) return units;
        return units.filter(u =>
            u.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
            u.code.toLowerCase().includes(searchQuery.toLowerCase())
        );
    }, [units, searchQuery]);

    const formatCurrency = (val: number) => {
        if (val >= 1e9) return `${(val / 1e9).toFixed(1)} tỷ`;
        if (val >= 1e6) return `${(val / 1e6).toFixed(0)} tr`;
        return val.toLocaleString('vi-VN');
    };

    const handleAdd = () => {
        setEditingUnit(undefined);
        setIsFormOpen(true);
    };

    const handleEdit = (unit: Unit) => {
        setEditingUnit(unit);
        setIsFormOpen(true);
    };

    const handleSave = async (data: Omit<Unit, 'id'> | Unit) => {
        try {
            if ('id' in data) {
                await UnitsAPI.update(data.id, data);
            } else {
                await UnitsAPI.create(data);
            }
            await fetchUnits();
            setIsFormOpen(false);
            toast.success("Lưu đơn vị thành công!");
        } catch (error) {
            console.error("Failed to save unit", error);
            toast.error("Có lỗi xảy ra khi lưu đơn vị.");
        }
    };

    const handleDelete = async (id: string) => {
        if (confirm('Bạn có chắc chắn muốn xóa đơn vị này? Hành động này không thể hoàn tác.')) {
            try {
                await UnitsAPI.delete(id);
                // Refresh list
                await fetchUnits();
                toast.success("Đã xóa đơn vị thành công.");
            } catch (error) {
                console.error("Failed to delete unit", error);
                toast.error("Không thể xóa đơn vị. Có thể đơn vị đang có dữ liệu liên kết.");
            }
        }
    };

    return (
        <div className="space-y-6 animate-in slide-in-from-bottom-4 duration-500 pb-12">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                    <h1 className="text-3xl font-black text-slate-900 dark:text-slate-100 tracking-tight">Quản lý Đơn vị</h1>
                    <p className="text-slate-500 dark:text-slate-400 text-sm font-bold mt-1">
                        Danh sách các Trung tâm và Chi nhánh trực thuộc
                    </p>
                </div>
                <button
                    onClick={handleAdd}
                    className="flex items-center justify-center gap-2 bg-indigo-600 text-white px-5 py-3 rounded-2xl font-bold hover:bg-indigo-700 transition-all shadow-lg shadow-indigo-100 dark:shadow-none"
                >
                    <Plus size={20} /> Thêm Đơn vị
                </button>
            </div>

            {/* Search Bar */}
            <div className="bg-white dark:bg-slate-900 p-4 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-sm">
                <div className="relative">
                    <Search size={20} className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" />
                    <input
                        type="text"
                        placeholder="Tìm kiếm tên đơn vị hoặc mã đơn vị..."
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        className="w-full pl-12 pr-4 py-3 bg-slate-50 dark:bg-slate-800 border-none rounded-2xl focus:ring-2 focus:ring-indigo-500 outline-none text-slate-900 dark:text-slate-100 font-medium transition-all"
                    />
                </div>
            </div>

            {/* Units Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
                {filteredUnits.length === 0 ? (
                    <div className="col-span-full py-12 text-center text-slate-400">
                        Không tìm thấy đơn vị nào phù hợp.
                    </div>
                ) : (
                    filteredUnits.map(unit => (
                        <div key={unit.id} className="bg-white dark:bg-slate-900 p-6 rounded-[32px] border border-slate-200 dark:border-slate-800 shadow-sm hover:shadow-md transition-all group relative">
                            <div className="flex justify-between items-start mb-6">
                                <div className="flex items-center gap-4">
                                    <div className="w-14 h-14 rounded-2xl bg-indigo-50 dark:bg-indigo-900/20 text-indigo-600 flex items-center justify-center">
                                        <Building size={28} />
                                    </div>
                                    <div>
                                        <h3 className="text-lg font-black text-slate-900 dark:text-slate-100">{unit.name}</h3>
                                        <span className="inline-block px-2 py-1 rounded-lg bg-slate-100 dark:bg-slate-800 text-[10px] font-bold uppercase text-slate-500 tracking-wider">
                                            {unit.code}
                                        </span>
                                    </div>
                                </div>
                                <div className="flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                                    <button
                                        onClick={() => handleEdit(unit)}
                                        className="p-2 text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 dark:hover:bg-indigo-900/20 rounded-xl transition-colors"
                                    >
                                        <Pencil size={18} />
                                    </button>
                                    <button
                                        onClick={() => handleDelete(unit.id)}
                                        className="p-2 text-slate-400 hover:text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-900/20 rounded-xl transition-colors"
                                    >
                                        <Trash2 size={18} />
                                    </button>
                                    {onSelectUnit && (
                                        <button
                                            onClick={() => onSelectUnit(unit.id)}
                                            className="p-2 text-slate-400 hover:text-emerald-600 hover:bg-emerald-50 dark:hover:bg-emerald-900/20 rounded-xl transition-colors"
                                            title="Xem chi tiết"
                                        >
                                            <Eye size={18} />
                                        </button>
                                    )}
                                </div>
                            </div>

                            <div className="space-y-4">
                                <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/50 space-y-3">
                                    <div className="flex items-center justify-between">
                                        <div className="flex items-center gap-2 text-xs font-bold text-slate-500">
                                            <Target size={14} /> Chỉ tiêu Ký kết
                                        </div>
                                        <span className="text-sm font-black text-slate-900 dark:text-slate-100">
                                            {formatCurrency(unit.target.signing)}
                                        </span>
                                    </div>
                                    <div className="flex items-center justify-between">
                                        <div className="flex items-center gap-2 text-xs font-bold text-slate-500">
                                            <TrendingUp size={14} /> Chỉ tiêu Doanh thu
                                        </div>
                                        <span className="text-sm font-black text-slate-900 dark:text-slate-100">
                                            {formatCurrency(unit.target.revenue)}
                                        </span>
                                    </div>
                                    <div className="flex items-center justify-between">
                                        <div className="flex items-center gap-2 text-xs font-bold text-slate-500">
                                            <Users size={14} /> Chỉ tiêu LNG Quản trị
                                        </div>
                                        <span className="text-sm font-black text-slate-900 dark:text-slate-100">
                                            {formatCurrency(unit.target.adminProfit)}
                                        </span>
                                    </div>
                                </div>
                            </div>
                        </div>
                    ))
                )}
            </div>

            <UnitForm
                isOpen={isFormOpen}
                onClose={() => setIsFormOpen(false)}
                onSave={handleSave}
                unit={editingUnit}
            />
        </div>
    );
};

export default UnitList;
