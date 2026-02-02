import React, { useState, useEffect } from 'react';
import { Users, UserCheck, X, Search, Shield } from 'lucide-react';
import { supabase } from '../../lib/supabase';
import { UserProfile, UserRole, DEFAULT_ROLE_PERMISSIONS, PermissionResource, PermissionAction } from '../../types';
import { useImpersonation } from '../../contexts/ImpersonationContext';
import { ROLE_LABELS } from '../../constants';

const RESOURCES: PermissionResource[] = ['contracts', 'employees', 'units', 'customers', 'products', 'payments', 'settings', 'permissions'];
const RESOURCE_LABELS: Record<PermissionResource, string> = {
    contracts: 'Hợp đồng',
    employees: 'Nhân sự',
    units: 'Đơn vị',
    customers: 'Khách hàng',
    products: 'Sản phẩm',
    payments: 'Thanh toán',
    settings: 'Cài đặt',
    permissions: 'Phân quyền',
};

// Map position/title to UserRole for permission lookup
function mapPositionToRole(position: string | null): UserRole {
    if (!position) return 'NVKD';
    const pos = position.toLowerCase();
    if (pos.includes('tổng giám đốc')) return 'Leadership';
    if (pos.includes('phó tổng giám đốc')) return 'Leadership';
    if (pos.includes('giám đốc')) return 'UnitLeader';
    if (pos.includes('trưởng phòng') || pos.includes('trưởng tt')) return 'UnitLeader';
    if (pos.includes('kế toán trưởng')) return 'ChiefAccountant';
    if (pos.includes('kế toán')) return 'Accountant';
    if (pos.includes('ban lãnh đạo')) return 'Leadership';
    if (pos.includes('pháp lý') || pos.includes('pháp chế')) return 'Legal';
    if (pos.includes('admin')) return 'Admin';
    return 'NVKD';
}

// Extended user profile with employee info
interface EmployeeUser extends UserProfile {
    position?: string;
    unitName?: string;
}

const UserImpersonator: React.FC = () => {
    const [users, setUsers] = useState<EmployeeUser[]>([]);
    const [searchTerm, setSearchTerm] = useState('');
    const [loading, setLoading] = useState(true);
    const { impersonatedUser, isImpersonating, startImpersonation, stopImpersonation } = useImpersonation();

    useEffect(() => {
        const fetchUsers = async () => {
            setLoading(true);
            // Lấy từ employees table (danh sách nhân sự đầy đủ)
            // Dùng left join với units (không dùng !inner để bao gồm cả employees không có unit)
            const { data, error } = await supabase
                .from('employees')
                .select('id, email, full_name, position, unit_id, units(name)')
                .order('full_name');

            if (error) {
                console.error('[UserImpersonator] Error fetching employees:', error);
                setLoading(false);
                return;
            }

            if (data) {
                console.log('[UserImpersonator] Loaded', data.length, 'employees');
                setUsers(data.map(u => ({
                    id: u.id,
                    email: u.email || '',
                    fullName: u.full_name,
                    // Map position to role for permission lookup
                    role: mapPositionToRole(u.position),
                    unitId: u.unit_id,
                    position: u.position,
                    unitName: (u.units as any)?.name,
                })));
            }
            setLoading(false);
        };
        fetchUsers();
    }, []);

    const filteredUsers = users.filter(user =>
        user.fullName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        user.email?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        user.position?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        user.unitName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        user.role?.toLowerCase().includes(searchTerm.toLowerCase())
    );

    // Get permissions for impersonated user
    const getPermissionsPreview = () => {
        if (!impersonatedUser?.role) return null;
        return DEFAULT_ROLE_PERMISSIONS[impersonatedUser.role] || {};
    };

    const permissions = getPermissionsPreview();

    return (
        <div className="space-y-6">
            {/* Active Impersonation Banner */}
            {isImpersonating && impersonatedUser && (
                <div className="bg-amber-50 dark:bg-amber-900/20 border-2 border-amber-400 rounded-2xl p-4">
                    <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                            <div className="w-12 h-12 rounded-full bg-amber-500 flex items-center justify-center text-white font-bold text-lg">
                                {impersonatedUser.fullName?.charAt(0) || 'U'}
                            </div>
                            <div>
                                <div className="flex items-center gap-2">
                                    <UserCheck size={16} className="text-amber-600" />
                                    <span className="text-sm font-bold text-amber-700 dark:text-amber-400">
                                        Đang giả làm
                                    </span>
                                </div>
                                <p className="font-bold text-slate-800 dark:text-slate-200">{impersonatedUser.fullName}</p>
                                <p className="text-xs text-slate-500">{ROLE_LABELS[impersonatedUser.role] || impersonatedUser.role}</p>
                            </div>
                        </div>
                        <button
                            onClick={stopImpersonation}
                            className="flex items-center gap-2 px-4 py-2 bg-amber-500 text-white rounded-xl font-semibold hover:bg-amber-600 transition-all"
                        >
                            <X size={16} />
                            Dừng giả làm
                        </button>
                    </div>

                    {/* Permissions Preview */}
                    {permissions && (
                        <div className="mt-4 pt-4 border-t border-amber-200 dark:border-amber-800">
                            <p className="text-xs font-semibold text-amber-600 dark:text-amber-400 mb-2 flex items-center gap-1">
                                <Shield size={12} />
                                Quyền của {impersonatedUser.fullName}:
                            </p>
                            <div className="grid grid-cols-2 md:grid-cols-4 gap-2 text-xs">
                                {RESOURCES.map(resource => {
                                    const actions = permissions[resource] || [];
                                    if (actions.length === 0) return null;
                                    return (
                                        <div key={resource} className="bg-white dark:bg-slate-800 rounded-lg p-2">
                                            <span className="font-semibold text-slate-700 dark:text-slate-300">
                                                {RESOURCE_LABELS[resource]}:
                                            </span>
                                            <span className="ml-1 text-slate-500">
                                                {actions.map(a => a.charAt(0).toUpperCase()).join('')}
                                            </span>
                                        </div>
                                    );
                                })}
                            </div>
                        </div>
                    )}
                </div>
            )}

            {/* User Selection */}
            <div>
                <label className="block text-xs text-slate-500 mb-2">Tìm và chọn nhân viên để giả làm</label>
                <div className="relative mb-4">
                    <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                    <input
                        type="text"
                        value={searchTerm}
                        onChange={e => setSearchTerm(e.target.value)}
                        placeholder="Tìm theo tên, email hoặc role..."
                        className="w-full pl-9 pr-3 py-2 border rounded-lg dark:bg-slate-800 dark:border-slate-700"
                    />
                </div>

                {loading ? (
                    <div className="text-center py-8 text-slate-400">Đang tải...</div>
                ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3 max-h-80 overflow-y-auto">
                        {filteredUsers.map(user => (
                            <button
                                key={user.id}
                                onClick={() => startImpersonation(user)}
                                disabled={impersonatedUser?.id === user.id}
                                className={`flex items-center gap-3 p-3 rounded-xl border text-left transition-all ${impersonatedUser?.id === user.id
                                    ? 'bg-amber-50 border-amber-400 dark:bg-amber-900/20'
                                    : 'bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700 hover:border-indigo-400 hover:bg-indigo-50 dark:hover:bg-indigo-900/20'
                                    }`}
                            >
                                <div className="w-10 h-10 rounded-full bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center text-white font-bold">
                                    {user.fullName?.charAt(0) || 'U'}
                                </div>
                                <div className="flex-1 min-w-0">
                                    <p className="font-semibold text-slate-800 dark:text-slate-200 truncate">{user.fullName}</p>
                                    <p className="text-xs text-slate-500 truncate">{user.position || ROLE_LABELS[user.role] || user.role}</p>
                                    {user.unitName && <p className="text-xs text-indigo-500 truncate">{user.unitName}</p>}
                                </div>
                                {impersonatedUser?.id === user.id && (
                                    <UserCheck size={18} className="text-amber-500" />
                                )}
                            </button>
                        ))}
                    </div>
                )}
            </div>

            {/* Instructions */}
            <div className="bg-blue-50 dark:bg-blue-900/20 rounded-xl p-4 text-sm">
                <p className="font-semibold text-blue-700 dark:text-blue-400 mb-1">💡 Cách sử dụng:</p>
                <ul className="text-blue-600 dark:text-blue-300 space-y-1 text-xs">
                    <li>• Chọn một nhân viên để giả làm</li>
                    <li>• Điều hướng qua các trang để xem họ có quyền gì</li>
                    <li>• Click "Dừng giả làm" để quay về tài khoản Admin</li>
                </ul>
            </div>
        </div>
    );
};

export default UserImpersonator;
