
import React, { useState, useEffect, useMemo } from 'react';
import { toast } from 'sonner';
import {
    ArrowLeft,
    Building,
    Target,
    TrendingUp,
    Users,
    FileText,
    Pencil,
    Loader2,
    ChevronRight,
    MapPin,
    Hash
} from 'lucide-react';
import { UnitService, EmployeeService, ContractService } from '../services';
import { Unit, KPIPlan, Employee, Contract } from '../types';
import UnitForm from './UnitForm';

interface UnitDetailProps {
    unitId: string;
    onBack: () => void;
    onViewContract: (id: string) => void;
    onViewPersonnel: (id: string) => void;
}

const UnitDetail: React.FC<UnitDetailProps> = ({ unitId, onBack, onViewContract, onViewPersonnel }) => {
    const [unit, setUnit] = useState<Unit | null>(null);
    const [contracts, setContracts] = useState<Contract[]>([]);
    const [staff, setStaff] = useState<Employee[]>([]);
    // Define exact shape for stats state
    const [stats, setStats] = useState<{
        actualSigning: number;
        actualRevenue: number;
        adminProfit: number;
        signingProgress: number;
        revenueProgress: number;
        adminProfitProgress: number;
    } | null>(null);

    const [isLoading, setIsLoading] = useState(true);
    const [isEditing, setIsEditing] = useState(false);

    const fetchData = async () => {
        setIsLoading(true);
        try {
            // Fetch Unit
            const unitData = await UnitService.getById(unitId);
            setUnit(unitData || null);

            if (unitData) {
                // Optimized: Parallel fetch with focused data
                // 1. Stats from RPC (Fast & Accurate)
                // 2. Recent 5 contracts for list
                // 3. Personnel list
                // Optimized: Parallel fetch with focused data - resilient using Promise.allSettled
                const results = await Promise.allSettled([
                    UnitService.getStats(unitId),
                    ContractService.list({ unitId: unitId, limit: 10, page: 1 }),
                    EmployeeService.list({ unitId: unitId })
                ]);

                const statsData = results[0].status === 'fulfilled' ? results[0].value : { totalSigning: 0, totalRevenue: 0, totalProfit: 0 };
                const contractsData = results[1].status === 'fulfilled' ? results[1].value : { data: [], count: 0 };
                const staffData = results[2].status === 'fulfilled' ? results[2].value : [];

                if (results[0].status === 'rejected') console.error("Unit Stats Error:", results[0].reason);

                // Calculate progress percentages based on RPC data + Targets
                const calculatedStats = {
                    actualSigning: statsData.totalSigning || 0,
                    actualRevenue: statsData.totalRevenue || 0,
                    adminProfit: statsData.totalProfit || 0,
                    signingProgress: unitData.target.signing ? (statsData.totalSigning / unitData.target.signing) * 100 : 0,
                    revenueProgress: unitData.target.revenue ? (statsData.totalRevenue / unitData.target.revenue) * 100 : 0,
                    adminProfitProgress: unitData.target.adminProfit ? ((statsData.totalProfit || 0) / unitData.target.adminProfit) * 100 : 0
                };

                setStats(calculatedStats);
                setContracts(contractsData.data || []);

                const people = Array.isArray(staffData) ? staffData : (staffData as any).data || [];
                setStaff(people);
            }
        } catch (error) {
            console.error('Error fetching unit details:', error);
        } finally {
            setIsLoading(false);
        }
    };

    useEffect(() => {
        fetchData();
    }, [unitId]);

    const handleEditSave = async (data: Omit<Unit, 'id'> | Unit) => {
        try {
            if (unit) {
                await UnitService.update(unit.id, data);
            }
            setIsEditing(false);
            fetchData();
            toast.success("Cập nhật đơn vị thành công");
        } catch (error) {
            console.error('Error updating unit:', error);
            toast.error('Có lỗi xảy ra khi cập nhật đơn vị.');
        }
    };

    const formatCurrency = (val: number) => {
        if (val >= 1e9) return `${(val / 1e9).toFixed(2)} tỷ`;
        if (val >= 1e6) return `${(val / 1e6).toFixed(0)} tr`;
        return val.toLocaleString('vi-VN');
    };

    // Memoized stats calculation removed in favor of Server-Side RPC
    // const stats = useMemo(() => { ... }, [contracts, unit]);

    // Alias for UI compatibility
    const personnel = staff;

    if (isLoading) {
        return (
            <div className="flex items-center justify-center h-[60vh]">
                <Loader2 size={40} className="animate-spin text-indigo-500" />
            </div>
        );
    }

    if (!unit) {
        return (
            <div className="text-center py-12">
                <p>Không tìm thấy đơn vị.</p>
                <button onClick={onBack} className="text-indigo-600 font-bold mt-2">Quay lại</button>
            </div>
        );
    }

    return (
        <div className="space-y-6 animate-in fade-in duration-500 pb-12">
            {/* Header */}
            <div className="flex items-center gap-4">
                <button
                    onClick={onBack}
                    className="p-3 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors"
                >
                    <ArrowLeft size={20} className="text-slate-600 dark:text-slate-400" />
                </button>
                <div>
                    <h1 className="text-2xl md:text-3xl font-black text-slate-900 dark:text-slate-100">{unit.name}</h1>
                    <div className="flex items-center gap-2 mt-1">
                        <span className="text-sm font-bold text-slate-500 bg-slate-100 dark:bg-slate-800 px-2 py-0.5 rounded text-xs uppercase">
                            {unit.code}
                        </span>
                        <span className={`text-xs font-bold px-2 py-0.5 rounded uppercase ${unit.type === 'Center' ? 'bg-emerald-100 text-emerald-700' : 'bg-amber-100 text-amber-700'}`}>
                            {unit.type === 'Center' ? 'Trung tâm' : unit.type === 'Branch' ? 'Chi nhánh' : 'Công ty'}
                        </span>
                    </div>
                </div>
                <button
                    onClick={() => setIsEditing(true)}
                    className="ml-auto p-2 bg-indigo-50 text-indigo-600 rounded-xl hover:bg-indigo-100 transition-colors"
                >
                    <Pencil size={20} />
                </button>
            </div>

            {/* Stats Overview */}
            {stats && (
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    <div className="bg-white dark:bg-slate-900 p-6 rounded-[24px] border border-slate-200 dark:border-slate-800 shadow-sm relative overflow-hidden group">
                        <div className="flex justify-between items-start mb-4 relative z-10">
                            <div className="p-3 bg-indigo-50 dark:bg-indigo-900/20 rounded-2xl text-indigo-600">
                                <FileText size={24} />
                            </div>
                            <span className={`text-lg font-black ${stats.signingProgress >= 100 ? 'text-emerald-600' : 'text-indigo-600'}`}>
                                {stats.signingProgress.toFixed(1)}%
                            </span>
                        </div>
                        <p className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-1">Doanh số Ký kết</p>
                        <p className="text-2xl font-black text-slate-900 dark:text-slate-100 mb-2">
                            {formatCurrency(stats.actualSigning)}
                        </p>
                        <div className="w-full bg-slate-100 dark:bg-slate-800 h-2 rounded-full overflow-hidden">
                            <div className="h-full bg-indigo-500 rounded-full" style={{ width: `${Math.min(stats.signingProgress, 100)}%` }}></div>
                        </div>
                        <p className="text-xs text-slate-500 mt-2 text-right">Mục tiêu: {formatCurrency(unit.target.signing)}</p>
                    </div>

                    <div className="bg-white dark:bg-slate-900 p-6 rounded-[24px] border border-slate-200 dark:border-slate-800 shadow-sm relative overflow-hidden group">
                        <div className="flex justify-between items-start mb-4 relative z-10">
                            <div className="p-3 bg-emerald-50 dark:bg-emerald-900/20 rounded-2xl text-emerald-600">
                                <TrendingUp size={24} />
                            </div>
                            <span className={`text-lg font-black ${stats.revenueProgress >= 100 ? 'text-emerald-600' : 'text-emerald-600'}`}>
                                {stats.revenueProgress.toFixed(1)}%
                            </span>
                        </div>
                        <p className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-1">Doanh thu Thực tế</p>
                        <p className="text-2xl font-black text-slate-900 dark:text-slate-100 mb-2">
                            {formatCurrency(stats.actualRevenue)}
                        </p>
                        <div className="w-full bg-slate-100 dark:bg-slate-800 h-2 rounded-full overflow-hidden">
                            <div className="h-full bg-emerald-500 rounded-full" style={{ width: `${Math.min(stats.revenueProgress, 100)}%` }}></div>
                        </div>
                        <p className="text-xs text-slate-500 mt-2 text-right">Mục tiêu: {formatCurrency(unit.target.revenue)}</p>
                    </div>

                    <div className="bg-white dark:bg-slate-900 p-6 rounded-[24px] border border-slate-200 dark:border-slate-800 shadow-sm relative overflow-hidden group">
                        <div className="flex justify-between items-start mb-4 relative z-10">
                            <div className="p-3 bg-purple-50 dark:bg-purple-900/20 rounded-2xl text-purple-600">
                                <Target size={24} />
                            </div>
                            <span className={`text-lg font-black ${stats.adminProfitProgress >= 100 ? 'text-emerald-600' : 'text-purple-600'}`}>
                                {stats.adminProfitProgress.toFixed(1)}%
                            </span>
                        </div>
                        <p className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-1">LNG Quản trị</p>
                        <p className="text-2xl font-black text-slate-900 dark:text-slate-100 mb-2">
                            {formatCurrency(stats.adminProfit)}
                        </p>
                        <div className="w-full bg-slate-100 dark:bg-slate-800 h-2 rounded-full overflow-hidden">
                            <div className="h-full bg-purple-500 rounded-full" style={{ width: `${Math.min(stats.adminProfitProgress, 100)}%` }}></div>
                        </div>
                        <p className="text-xs text-slate-500 mt-2 text-right">Mục tiêu: {formatCurrency(unit.target.adminProfit)}</p>
                    </div>
                </div>
            )}

            <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
                {/* Personnel List */}
                <div className="bg-white dark:bg-slate-900 rounded-[24px] border border-slate-200 dark:border-slate-800 p-6">
                    <div className="flex items-center justify-between mb-6">
                        <h3 className="text-lg font-black text-slate-900 dark:text-slate-100 flex items-center gap-2">
                            <Users size={20} className="text-indigo-500" /> Nhân sự ({personnel.length})
                        </h3>
                    </div>
                    <div className="space-y-3">
                        {personnel.length === 0 ? (
                            <p className="text-slate-500 text-center py-4">Chưa có nhân sự nào thuộc đơn vị này.</p>
                        ) : (
                            personnel.map(p => (
                                <div key={p.id} onClick={() => onViewPersonnel(p.id)} className="flex items-center justify-between p-3 rounded-xl hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors cursor-pointer group">
                                    <div className="flex items-center gap-3">
                                        <div className="w-10 h-10 rounded-full bg-slate-100 dark:bg-slate-800 overflow-hidden flex items-center justify-center font-bold text-slate-500">
                                            {p.avatar ? <img src={p.avatar} alt={p.name} className="w-full h-full object-cover" /> : p.name.charAt(0)}
                                        </div>
                                        <div>
                                            <p className="font-bold text-slate-900 dark:text-slate-100">{p.name}</p>
                                            <p className="text-xs text-slate-500">{p.position || 'N/A'}</p>
                                        </div>
                                    </div>
                                    <ChevronRight size={16} className="text-slate-300 group-hover:text-indigo-500 transition-colors" />
                                </div>
                            ))
                        )}
                    </div>
                </div>

                {/* Recent Contracts */}
                <div className="bg-white dark:bg-slate-900 rounded-[24px] border border-slate-200 dark:border-slate-800 p-6">
                    <div className="flex items-center justify-between mb-6">
                        <h3 className="text-lg font-black text-slate-900 dark:text-slate-100 flex items-center gap-2">
                            <FileText size={20} className="text-emerald-500" /> Hợp đồng gần đây ({contracts.length})
                        </h3>
                    </div>
                    <div className="space-y-3">
                        {contracts.length === 0 ? (
                            <p className="text-slate-500 text-center py-4">Chưa có hợp đồng nào.</p>
                        ) : (
                            contracts.slice(0, 5).map(c => (
                                <div key={c.id} onClick={() => onViewContract(c.id)} className="flex items-center justify-between p-3 rounded-xl hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors cursor-pointer group">
                                    <div className="min-w-0">
                                        <p className="font-bold text-slate-900 dark:text-slate-100 truncate">{c.partyA}</p>
                                        <p className="text-xs text-slate-500">Giá trị: {formatCurrency(c.value)}</p>
                                    </div>
                                    <div className="text-right shrink-0">
                                        <span className={`text-[10px] font-bold px-2 py-1 rounded-full uppercase ${c.status === 'Active' ? 'bg-emerald-100 text-emerald-700' :
                                            c.status === 'Completed' ? 'bg-blue-100 text-blue-700' :
                                                'bg-slate-100 text-slate-700'
                                            }`}>
                                            {c.status}
                                        </span>
                                    </div>
                                </div>
                            ))
                        )}
                        {contracts.length > 5 && (
                            <button className="w-full py-2 text-sm font-bold text-indigo-600 hover:bg-indigo-50 rounded-lg transition-colors">
                                Xem tất cả hợp đồng
                            </button>
                        )}
                    </div>
                </div>
            </div>

            <UnitForm
                isOpen={isEditing}
                onClose={() => setIsEditing(false)}
                onSave={handleEditSave}
                unit={unit}
            />
        </div>
    );
};

export default UnitDetail;
