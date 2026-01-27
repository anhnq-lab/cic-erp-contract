import React, { useState, useMemo, useEffect } from 'react';
import { Search, User, Target, TrendingUp, Building, ChevronRight, Award, ChevronDown, Loader2, Plus, Pencil, Trash2, MoreVertical } from 'lucide-react';
import { PersonnelAPI } from '../services/api';
import { Unit, SalesPerson } from '../types';
import { MOCK_UNITS } from '../constants';
import PersonnelForm from './PersonnelForm';

interface PersonnelListProps {
    selectedUnit: Unit;
    onSelectPersonnel: (id: string) => void;
}

interface PersonnelStats {
    contractCount: number;
    totalSigning: number;
    totalRevenue: number;
    signingProgress: number;
    revenueProgress: number;
}

const PersonnelList: React.FC<PersonnelListProps> = ({ selectedUnit, onSelectPersonnel }) => {
    const [searchQuery, setSearchQuery] = useState('');
    const [unitFilter, setUnitFilter] = useState<string>(selectedUnit.id);
    const [isUnitDropdownOpen, setIsUnitDropdownOpen] = useState(false);

    // Data state
    const [personnel, setPersonnel] = useState<SalesPerson[]>([]);
    const [personnelStats, setPersonnelStats] = useState<Record<string, PersonnelStats>>({});
    const [isLoading, setIsLoading] = useState(true);

    // CRUD state
    const [isFormOpen, setIsFormOpen] = useState(false);
    const [editingPerson, setEditingPerson] = useState<SalesPerson | undefined>(undefined);
    const [actionMenuId, setActionMenuId] = useState<string | null>(null);

    // Filter units
    const filterUnits = useMemo(() => {
        return [{ id: 'all', name: 'Tất cả đơn vị', code: 'ALL' }, ...MOCK_UNITS.filter(u => u.id !== 'all')];
    }, []);

    // Fetch personnel data
    useEffect(() => {
        const fetchData = async () => {
            setIsLoading(true);
            try {
                const data = await PersonnelAPI.getByUnitId(unitFilter);
                setPersonnel(data);

                // Fetch stats for each person
                const statsPromises = data.map(async p => {
                    const stats = await PersonnelAPI.getStats(p.id);
                    return { id: p.id, stats };
                });
                const statsResults = await Promise.all(statsPromises);

                const statsMap: Record<string, PersonnelStats> = {};
                statsResults.forEach(({ id, stats }) => {
                    statsMap[id] = stats;
                });
                setPersonnelStats(statsMap);
            } catch (error) {
                console.error('Error fetching personnel:', error);
            } finally {
                setIsLoading(false);
            }
        };

        fetchData();
    }, [unitFilter]);

    // Filtered by search
    const filteredPersonnel = useMemo(() => {
        if (!searchQuery) return personnel;
        return personnel.filter(p =>
            p.name.toLowerCase().includes(searchQuery.toLowerCase())
        );
    }, [personnel, searchQuery]);

    const getUnitCode = (unitId: string) => {
        return MOCK_UNITS.find(u => u.id === unitId)?.code || 'N/A';
    };

    const formatCurrency = (val: number) => {
        if (val >= 1e9) return `${(val / 1e9).toFixed(1)} tỷ`;
        if (val >= 1e6) return `${(val / 1e6).toFixed(0)} tr`;
        return val.toLocaleString('vi-VN');
    };

    const getProgressColor = (progress: number) => {
        if (progress >= 100) return 'bg-emerald-500';
        if (progress >= 70) return 'bg-indigo-500';
        if (progress >= 40) return 'bg-amber-500';
        return 'bg-rose-500';
    };

    const getProgressTextColor = (progress: number) => {
        if (progress >= 100) return 'text-emerald-600 dark:text-emerald-400';
        if (progress >= 70) return 'text-indigo-600 dark:text-indigo-400';
        if (progress >= 40) return 'text-amber-600 dark:text-amber-400';
        return 'text-rose-600 dark:text-rose-400';
    };

    // Summary stats
    const totalStats = useMemo(() => {
        let totalSigning = 0;
        let totalRevenue = 0;
        let totalTargetSigning = 0;
        let totalTargetRevenue = 0;

        filteredPersonnel.forEach(p => {
            const stats = personnelStats[p.id];
            if (stats) {
                totalSigning += stats.totalSigning;
                totalRevenue += stats.totalRevenue;
            }
            totalTargetSigning += p.target.signing;
            totalTargetRevenue += p.target.revenue;
        });

        return {
            totalSigning,
            totalRevenue,
            totalTargetSigning,
            totalTargetRevenue,
            achievedCount: filteredPersonnel.filter(p => (personnelStats[p.id]?.signingProgress || 0) >= 100).length
        };
    }, [filteredPersonnel, personnelStats]);

    const selectedUnitName = filterUnits.find(u => u.id === unitFilter)?.name || 'Chọn đơn vị';

    // CRUD handlers
    const handleAdd = () => {
        setEditingPerson(undefined);
        setIsFormOpen(true);
    };

    const handleEdit = (person: SalesPerson) => {
        setEditingPerson(person);
        setIsFormOpen(true);
        setActionMenuId(null);
    };

    const handleSave = async (data: Omit<SalesPerson, 'id'> | SalesPerson) => {
        if ('id' in data) {
            await PersonnelAPI.update(data.id, data);
            setPersonnel(prev => prev.map(p => p.id === data.id ? data as SalesPerson : p));
        } else {
            const newPerson = await PersonnelAPI.create(data);
            setPersonnel(prev => [newPerson, ...prev]);
        }
    };

    const handleDelete = async (id: string) => {
        if (confirm('Bạn có chắc chắn muốn xóa nhân viên này?')) {
            await PersonnelAPI.delete(id);
            setPersonnel(prev => prev.filter(p => p.id !== id));
        }
        setActionMenuId(null);
    };

    return (
        <div className="space-y-6 animate-in fade-in duration-500">
            {/* Header */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                    <h1 className="text-2xl md:text-3xl font-black text-slate-900 dark:text-slate-100">
                        Quản lý Nhân sự
                    </h1>
                    <p className="text-slate-500 dark:text-slate-400 text-sm mt-1">
                        {filteredPersonnel.length} nhân viên sales
                    </p>
                </div>

                <div className="flex gap-3">
                    {/* Unit Filter Dropdown */}
                    <div className="relative">
                        <button
                            onClick={() => setIsUnitDropdownOpen(!isUnitDropdownOpen)}
                            className="flex items-center gap-2 px-4 py-3 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl text-sm font-medium text-slate-700 dark:text-slate-300 hover:border-indigo-300 transition-all min-w-[180px]"
                        >
                            <Building size={18} className="text-slate-400" />
                            <span className="flex-1 text-left truncate">{selectedUnitName}</span>
                            <ChevronDown size={16} className={`text-slate-400 transition-transform ${isUnitDropdownOpen ? 'rotate-180' : ''}`} />
                        </button>

                        {isUnitDropdownOpen && (
                            <>
                                <div
                                    className="fixed inset-0 z-10"
                                    onClick={() => setIsUnitDropdownOpen(false)}
                                />
                                <div className="absolute top-full left-0 mt-2 w-64 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl shadow-xl z-20 overflow-hidden">
                                    <div className="max-h-80 overflow-y-auto">
                                        {filterUnits.map(unit => (
                                            <button
                                                key={unit.id}
                                                onClick={() => {
                                                    setUnitFilter(unit.id);
                                                    setIsUnitDropdownOpen(false);
                                                }}
                                                className={`w-full flex items-center gap-3 px-4 py-3 text-sm text-left transition-colors ${unitFilter === unit.id
                                                    ? 'bg-indigo-50 dark:bg-indigo-900/30 text-indigo-700 dark:text-indigo-300'
                                                    : 'hover:bg-slate-50 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-300'
                                                    }`}
                                            >
                                                <div className={`w-8 h-8 rounded-lg flex items-center justify-center text-xs font-bold ${unitFilter === unit.id
                                                    ? 'bg-indigo-600 text-white'
                                                    : 'bg-slate-100 dark:bg-slate-800 text-slate-500'
                                                    }`}>
                                                    {unit.code?.substring(0, 3) || 'ALL'}
                                                </div>
                                                <span className="font-medium">{unit.name}</span>
                                            </button>
                                        ))}
                                    </div>
                                </div>
                            </>
                        )}
                    </div>

                    {/* Search */}
                    <div className="relative flex-1 md:w-64">
                        <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
                        <input
                            type="text"
                            placeholder="Tìm kiếm nhân viên..."
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            className="w-full pl-11 pr-4 py-3 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl focus:outline-none focus:ring-2 focus:ring-indigo-500 text-sm"
                        />
                    </div>

                    {/* Add Button */}
                    <button
                        onClick={handleAdd}
                        className="flex items-center gap-2 px-5 py-3 bg-indigo-600 text-white rounded-2xl font-bold text-sm hover:bg-indigo-700 transition-colors shadow-lg shadow-indigo-200 dark:shadow-none"
                    >
                        <Plus size={18} />
                        <span className="hidden md:inline">Thêm NV</span>
                    </button>
                </div>
            </div>

            {/* Personnel Form Modal */}
            <PersonnelForm
                isOpen={isFormOpen}
                onClose={() => { setIsFormOpen(false); setEditingPerson(undefined); }}
                onSave={handleSave}
                person={editingPerson}
            />

            {/* Stats Summary */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div className="bg-white dark:bg-slate-900 p-5 rounded-2xl border border-slate-200 dark:border-slate-800">
                    <div className="flex items-center gap-3">
                        <div className="p-2.5 bg-indigo-100 dark:bg-indigo-900/30 rounded-xl text-indigo-600 dark:text-indigo-400">
                            <User size={20} />
                        </div>
                        <div>
                            <p className="text-2xl font-black text-slate-900 dark:text-slate-100">{filteredPersonnel.length}</p>
                            <p className="text-xs text-slate-500 dark:text-slate-400 font-medium">Nhân viên</p>
                        </div>
                    </div>
                </div>
                <div className="bg-white dark:bg-slate-900 p-5 rounded-2xl border border-slate-200 dark:border-slate-800">
                    <div className="flex items-center gap-3">
                        <div className="p-2.5 bg-emerald-100 dark:bg-emerald-900/30 rounded-xl text-emerald-600 dark:text-emerald-400">
                            <Target size={20} />
                        </div>
                        <div>
                            <p className="text-2xl font-black text-slate-900 dark:text-slate-100">
                                {formatCurrency(totalStats.totalSigning)}
                            </p>
                            <p className="text-xs text-slate-500 dark:text-slate-400 font-medium">
                                Thực hiện / {formatCurrency(totalStats.totalTargetSigning)}
                            </p>
                        </div>
                    </div>
                </div>
                <div className="bg-white dark:bg-slate-900 p-5 rounded-2xl border border-slate-200 dark:border-slate-800">
                    <div className="flex items-center gap-3">
                        <div className="p-2.5 bg-amber-100 dark:bg-amber-900/30 rounded-xl text-amber-600 dark:text-amber-400">
                            <TrendingUp size={20} />
                        </div>
                        <div>
                            <p className="text-2xl font-black text-slate-900 dark:text-slate-100">
                                {formatCurrency(totalStats.totalRevenue)}
                            </p>
                            <p className="text-xs text-slate-500 dark:text-slate-400 font-medium">Doanh thu thực tế</p>
                        </div>
                    </div>
                </div>
                <div className="bg-white dark:bg-slate-900 p-5 rounded-2xl border border-slate-200 dark:border-slate-800">
                    <div className="flex items-center gap-3">
                        <div className="p-2.5 bg-purple-100 dark:bg-purple-900/30 rounded-xl text-purple-600 dark:text-purple-400">
                            <Award size={20} />
                        </div>
                        <div>
                            <p className="text-2xl font-black text-slate-900 dark:text-slate-100">
                                {totalStats.achievedCount}
                            </p>
                            <p className="text-xs text-slate-500 dark:text-slate-400 font-medium">Đạt KPI</p>
                        </div>
                    </div>
                </div>
            </div>

            {/* Personnel Table */}
            <div className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 overflow-hidden">
                {isLoading ? (
                    <div className="flex items-center justify-center py-16">
                        <Loader2 size={32} className="animate-spin text-indigo-500" />
                    </div>
                ) : (
                    <div className="overflow-x-auto">
                        <table className="w-full">
                            <thead>
                                <tr className="border-b border-slate-100 dark:border-slate-800 bg-slate-50 dark:bg-slate-800/50">
                                    <th className="text-left py-4 px-6 text-xs font-black text-slate-500 dark:text-slate-400 uppercase tracking-wider">Nhân viên</th>
                                    <th className="text-left py-4 px-6 text-xs font-black text-slate-500 dark:text-slate-400 uppercase tracking-wider hidden md:table-cell">Đơn vị</th>
                                    <th className="text-right py-4 px-6 text-xs font-black text-slate-500 dark:text-slate-400 uppercase tracking-wider">HĐ</th>
                                    <th className="text-right py-4 px-6 text-xs font-black text-slate-500 dark:text-slate-400 uppercase tracking-wider hidden sm:table-cell">Giá trị ký</th>
                                    <th className="text-center py-4 px-6 text-xs font-black text-slate-500 dark:text-slate-400 uppercase tracking-wider w-40 hidden lg:table-cell">Tiến độ Ký</th>
                                    <th className="text-right py-4 px-6 text-xs font-black text-slate-500 dark:text-slate-400 uppercase tracking-wider hidden sm:table-cell">Doanh thu</th>
                                    <th className="text-center py-4 px-6 text-xs font-black text-slate-500 dark:text-slate-400 uppercase tracking-wider w-40 hidden lg:table-cell">Tiến độ DT</th>
                                    <th className="py-4 px-6"></th>
                                </tr>
                            </thead>
                            <tbody>
                                {filteredPersonnel.map((person) => {
                                    const stats = personnelStats[person.id] || { contractCount: 0, totalSigning: 0, totalRevenue: 0, signingProgress: 0, revenueProgress: 0 };
                                    return (
                                        <tr
                                            key={person.id}
                                            onClick={() => onSelectPersonnel(person.id)}
                                            className="border-b border-slate-50 dark:border-slate-800/50 hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors group cursor-pointer"
                                        >
                                            {/* Name & Avatar */}
                                            <td className="py-4 px-6">
                                                <div className="flex items-center gap-4">
                                                    <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center text-white font-bold text-sm shadow-lg shadow-indigo-200/50 dark:shadow-none">
                                                        {person.name.split(' ').pop()?.charAt(0) || '?'}
                                                    </div>
                                                    <div>
                                                        <h3 className="font-bold text-slate-900 dark:text-slate-100 text-sm flex items-center gap-2">
                                                            {person.name}
                                                            {stats.signingProgress >= 100 && (
                                                                <span className="px-1.5 py-0.5 bg-emerald-100 dark:bg-emerald-900/30 text-emerald-600 dark:text-emerald-400 text-[9px] font-black rounded uppercase">Đạt KPI</span>
                                                            )}
                                                        </h3>
                                                        <p className="text-xs text-slate-500 dark:text-slate-400 md:hidden">
                                                            {getUnitCode(person.unitId)}
                                                        </p>
                                                    </div>
                                                </div>
                                            </td>

                                            {/* Unit */}
                                            <td className="py-4 px-6 hidden md:table-cell">
                                                <span className="px-3 py-1.5 bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 text-xs font-bold rounded-lg">
                                                    {getUnitCode(person.unitId)}
                                                </span>
                                            </td>

                                            {/* Contract Count */}
                                            <td className="py-4 px-6 text-right">
                                                <span className="font-bold text-slate-900 dark:text-slate-100">{stats.contractCount}</span>
                                            </td>

                                            {/* Signing Value */}
                                            <td className="py-4 px-6 text-right hidden sm:table-cell">
                                                <p className="font-bold text-slate-900 dark:text-slate-100">{formatCurrency(stats.totalSigning)}</p>
                                                <p className="text-[10px] text-slate-400">KPI: {formatCurrency(person.target.signing)}</p>
                                            </td>

                                            {/* Signing Progress */}
                                            <td className="py-4 px-6 hidden lg:table-cell">
                                                <div className="flex items-center gap-2">
                                                    <div className="flex-1 h-2 bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden">
                                                        <div
                                                            className={`h-full rounded-full transition-all ${getProgressColor(stats.signingProgress)}`}
                                                            style={{ width: `${Math.min(stats.signingProgress, 100)}%` }}
                                                        />
                                                    </div>
                                                    <span className={`text-xs font-bold w-12 text-right ${getProgressTextColor(stats.signingProgress)}`}>
                                                        {stats.signingProgress.toFixed(0)}%
                                                    </span>
                                                </div>
                                            </td>

                                            {/* Revenue */}
                                            <td className="py-4 px-6 text-right hidden sm:table-cell">
                                                <p className="font-bold text-slate-900 dark:text-slate-100">{formatCurrency(stats.totalRevenue)}</p>
                                                <p className="text-[10px] text-slate-400">KPI: {formatCurrency(person.target.revenue)}</p>
                                            </td>

                                            {/* Revenue Progress */}
                                            <td className="py-4 px-6 hidden lg:table-cell">
                                                <div className="flex items-center gap-2">
                                                    <div className="flex-1 h-2 bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden">
                                                        <div
                                                            className={`h-full rounded-full transition-all ${getProgressColor(stats.revenueProgress)}`}
                                                            style={{ width: `${Math.min(stats.revenueProgress, 100)}%` }}
                                                        />
                                                    </div>
                                                    <span className={`text-xs font-bold w-12 text-right ${getProgressTextColor(stats.revenueProgress)}`}>
                                                        {stats.revenueProgress.toFixed(0)}%
                                                    </span>
                                                </div>
                                            </td>

                                            {/* Action */}
                                            <td className="py-4 px-6 text-right">
                                                <div className="flex items-center justify-end gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                                                    <button
                                                        onClick={(e) => {
                                                            e.stopPropagation();
                                                            onSelectPersonnel(person.id);
                                                        }}
                                                        className="p-2 text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 dark:hover:bg-indigo-900/30 rounded-xl transition-all"
                                                        title="Xem chi tiết"
                                                    >
                                                        <ChevronRight size={18} />
                                                    </button>
                                                    <button
                                                        onClick={(e) => {
                                                            e.stopPropagation();
                                                            setEditingPerson(person);
                                                            setIsFormOpen(true);
                                                        }}
                                                        className="p-2 text-slate-400 hover:text-blue-600 hover:bg-blue-50 dark:hover:bg-blue-900/30 rounded-xl transition-all"
                                                        title="Chỉnh sửa"
                                                    >
                                                        <Pencil size={16} />
                                                    </button>
                                                    <button
                                                        onClick={async (e) => {
                                                            e.stopPropagation();
                                                            if (window.confirm('Bạn có chắc chắn muốn xóa nhân viên này?')) {
                                                                try {
                                                                    await PersonnelAPI.delete(person.id);
                                                                    setPersonnel(prev => prev.filter(p => p.id !== person.id));
                                                                } catch (error) {
                                                                    console.error('Lỗi khi xóa nhân viên:', error);
                                                                    alert('Không thể xóa nhân viên này (có thể do đang phụ trách hợp đồng).');
                                                                }
                                                            }
                                                        }}
                                                        className="p-2 text-slate-400 hover:text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-900/30 rounded-xl transition-all"
                                                        title="Xóa"
                                                    >
                                                        <Trash2 size={16} />
                                                    </button>
                                                </div>
                                            </td>
                                        </tr>
                                    );
                                })}
                            </tbody>
                        </table>
                    </div>
                )}

                {!isLoading && filteredPersonnel.length === 0 && (
                    <div className="text-center py-16">
                        <div className="w-20 h-20 bg-slate-100 dark:bg-slate-800 rounded-full flex items-center justify-center mx-auto mb-4">
                            <User size={32} className="text-slate-400" />
                        </div>
                        <h3 className="text-lg font-bold text-slate-700 dark:text-slate-300">Không tìm thấy nhân viên</h3>
                        <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">Thử thay đổi bộ lọc hoặc từ khóa tìm kiếm</p>
                    </div>
                )}
            </div>

            <PersonnelForm
                isOpen={isFormOpen}
                onClose={() => {
                    setIsFormOpen(false);
                    setEditingPerson(undefined);
                }}
                onSave={async (data) => {
                    try {
                        if (editingPerson) {
                            // Update
                            await PersonnelAPI.update(editingPerson.id, data);
                            // Refresh logic
                            const updatedList = await PersonnelAPI.getByUnitId(unitFilter);
                            setPersonnel(updatedList);
                        } else {
                            // Create
                            await PersonnelAPI.create(data);
                            // Refresh logic
                            const updatedList = await PersonnelAPI.getByUnitId(unitFilter);
                            setPersonnel(updatedList);
                        }
                        setIsFormOpen(false);
                        setEditingPerson(undefined);
                    } catch (error) {
                        console.error('Failed to save', error);
                        alert('Lỗi lưu dữ liệu');
                    }
                }}
                person={editingPerson}
            />
        </div>
    );
};

export default PersonnelList;
