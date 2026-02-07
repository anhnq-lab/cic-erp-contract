import React, { useState, useEffect } from 'react';
import { Shield, Users, Check, X, Loader2, Search } from 'lucide-react';
import { toast } from 'sonner';
import { PermissionAction, PermissionResource, UserProfile, UserRole, DEFAULT_ROLE_PERMISSIONS } from '../../types';
import { useAllPermissions, useUpdatePermission } from '../../hooks';
import { dataClient } from '../../lib/dataClient';

// Resource labels in Vietnamese
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

const ACTION_LABELS: Record<PermissionAction, string> = {
    view: 'Xem',
    create: 'Thêm',
    update: 'Sửa',
    delete: 'Xóa',
};

const ACTIONS: PermissionAction[] = ['view', 'create', 'update', 'delete'];
const RESOURCES: PermissionResource[] = ['contracts', 'employees', 'units', 'customers', 'products', 'payments', 'settings', 'permissions'];

// Map position to UserRole for permission lookup
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

const PermissionManager: React.FC = () => {
    const [users, setUsers] = useState<EmployeeUser[]>([]);
    const [selectedUserId, setSelectedUserId] = useState<string>('');
    const [userPermissions, setUserPermissions] = useState<Record<PermissionResource, PermissionAction[]>>({} as any);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');

    const { data: allPermissions, isLoading: permLoading } = useAllPermissions();
    const updatePermission = useUpdatePermission();

    // Fetch users from employees table (not profiles)
    useEffect(() => {
        const fetchUsers = async () => {
            setLoading(true);
            try {
                // First fetch employees without join to avoid FK constraint errors
                const { data: employeesData, error: empError } = await dataClient
                    .from('employees')
                    .select('id, email, name, position, unit_id, role_code')
                    .order('name');

                if (empError) {
                    console.error('[PermissionManager] Error fetching employees:', empError);
                    toast.error('Không thể tải danh sách nhân viên');
                    setLoading(false);
                    return;
                }

                // Then fetch units separately
                const { data: unitsData } = await dataClient
                    .from('units')
                    .select('id, name');

                const unitsMap = new Map(unitsData?.map(u => [u.id, u.name]) || []);

                if (employeesData) {
                    console.log('[PermissionManager] Loaded', employeesData.length, 'employees');
                    setUsers(employeesData.map(u => ({
                        id: u.id,
                        email: u.email || '',
                        fullName: u.name,
                        role: (u.role_code as UserRole) || mapPositionToRole(u.position),
                        unitId: u.unit_id,
                        position: u.position,
                        unitName: u.unit_id ? unitsMap.get(u.unit_id) : undefined,
                    })));
                } else {
                    setUsers([]);
                }
            } catch (err) {
                console.error('[PermissionManager] Unexpected error:', err);
                toast.error('Lỗi không xác định khi tải dữ liệu');
            }
            setLoading(false);
        };
        fetchUsers();
    }, []);

    // Update local permissions when user is selected
    useEffect(() => {
        if (!selectedUserId || !allPermissions) {
            setUserPermissions({} as any);
            return;
        }

        const userPerms = allPermissions.filter(p => p.userId === selectedUserId);
        const permMap: Record<PermissionResource, PermissionAction[]> = {} as any;

        RESOURCES.forEach(resource => {
            const found = userPerms.find(p => p.resource === resource);
            if (found) {
                permMap[resource] = found.actions;
            } else {
                // Use default from role
                const user = users.find(u => u.id === selectedUserId);
                if (user?.role) {
                    const defaults = DEFAULT_ROLE_PERMISSIONS[user.role];
                    permMap[resource] = defaults?.[resource] || [];
                } else {
                    permMap[resource] = [];
                }
            }
        });

        setUserPermissions(permMap);
    }, [selectedUserId, allPermissions, users]);

    const selectedUser = users.find(u => u.id === selectedUserId);

    const handleToggle = async (resource: PermissionResource, action: PermissionAction) => {
        if (!selectedUserId) return;

        const currentActions = userPermissions[resource] || [];
        const newActions = currentActions.includes(action)
            ? currentActions.filter(a => a !== action)
            : [...currentActions, action];

        // Optimistic update
        setUserPermissions(prev => ({ ...prev, [resource]: newActions }));

        try {
            await updatePermission.mutateAsync({
                userId: selectedUserId,
                resource,
                actions: newActions,
            });
            toast.success('Đã cập nhật quyền');
        } catch {
            // Rollback
            setUserPermissions(prev => ({ ...prev, [resource]: currentActions }));
            toast.error('Lỗi khi cập nhật quyền');
        }
    };

    const filteredUsers = users.filter(user =>
        user.fullName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        user.email?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        user.position?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        user.unitName?.toLowerCase().includes(searchTerm.toLowerCase())
    );

    if (loading || permLoading) {
        return (
            <div className="flex items-center justify-center py-8">
                <Loader2 className="animate-spin text-indigo-500" size={24} />
            </div>
        );
    }

    return (
        <div className="space-y-6">
            {/* User Selection */}
            <div className="flex flex-col md:flex-row gap-4">
                <div className="flex-1">
                    <label className="block text-xs text-slate-500 mb-1">Tìm kiếm nhân viên</label>
                    <div className="relative">
                        <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                        <input
                            type="text"
                            value={searchTerm}
                            onChange={e => setSearchTerm(e.target.value)}
                            placeholder="Tên, chức vụ hoặc đơn vị..."
                            className="w-full pl-9 pr-3 py-2 border rounded-lg dark:bg-slate-800 dark:border-slate-800"
                        />
                    </div>
                </div>
                <div className="flex-1">
                    <label className="block text-xs text-slate-500 mb-1">Chọn nhân viên để phân quyền</label>
                    <select
                        value={selectedUserId}
                        onChange={e => setSelectedUserId(e.target.value)}
                        className="w-full px-3 py-2 border rounded-lg dark:bg-slate-800 dark:border-slate-800"
                    >
                        <option value="">-- Chọn nhân viên --</option>
                        {filteredUsers.map(user => (
                            <option key={user.id} value={user.id}>
                                {user.fullName} ({user.position || 'Nhân viên'}) - {user.unitName || 'Chưa phân đơn vị'}
                            </option>
                        ))}
                    </select>
                </div>
            </div>

            {/* Selected User Info with Role Selector */}
            {selectedUser && (
                <div className="p-4 bg-indigo-50 dark:bg-indigo-900/20 rounded-lg">
                    <div className="flex items-center gap-3 mb-4">
                        <div className="w-10 h-10 rounded-full bg-indigo-500 flex items-center justify-center text-white font-bold">
                            {selectedUser.fullName?.charAt(0) || 'U'}
                        </div>
                        <div className="flex-1">
                            <p className="font-semibold text-slate-800 dark:text-slate-200">{selectedUser.fullName}</p>
                            <p className="text-xs text-slate-500">{selectedUser.position || 'Nhân viên'} • {selectedUser.unitName || selectedUser.email}</p>
                        </div>
                    </div>

                    {/* Role Selector */}
                    <div className="flex items-center gap-3 pt-3 border-t border-indigo-200 dark:border-indigo-800">
                        <label className="text-sm font-medium text-slate-700 dark:text-slate-300 whitespace-nowrap">
                            Role hệ thống:
                        </label>
                        <select
                            value={selectedUser.role || ''}
                            onChange={async (e) => {
                                const newRole = e.target.value as UserRole;
                                try {
                                    const { error } = await dataClient
                                        .from('employees')
                                        .update({ role_code: newRole || null })
                                        .eq('id', selectedUserId);

                                    if (error) throw error;

                                    // Update local state
                                    setUsers(prev => prev.map(u =>
                                        u.id === selectedUserId
                                            ? { ...u, role: newRole }
                                            : u
                                    ));

                                    toast.success(`Đã cập nhật role thành ${newRole || 'Chưa phân quyền'}`);
                                } catch (err) {
                                    console.error('Error updating role:', err);
                                    toast.error('Không thể cập nhật role');
                                }
                            }}
                            className="flex-1 px-3 py-2 text-sm border rounded-lg bg-white dark:bg-slate-800 dark:border-slate-800 focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                        >
                            <option value="">-- Chưa phân quyền --</option>
                            <option value="NVKD">Nhân viên kinh doanh</option>
                            <option value="UnitLeader">Trưởng đơn vị</option>
                            <option value="Admin">Quản trị viên</option>
                            <option value="Leadership">Ban lãnh đạo</option>
                            <option value="Legal">Pháp chế</option>
                            <option value="Accountant">Kế toán viên</option>
                            <option value="ChiefAccountant">Kế toán trưởng</option>
                            <option value="AdminUnit">Admin đơn vị</option>
                        </select>
                    </div>
                </div>
            )}

            {/* Permission Matrix */}
            {selectedUserId && (
                <div className="overflow-x-auto">
                    <table className="w-full text-sm">
                        <thead>
                            <tr className="border-b dark:border-slate-800">
                                <th className="text-left py-3 px-2 font-semibold text-slate-700 dark:text-slate-300">
                                    Module
                                </th>
                                {ACTIONS.map(action => (
                                    <th key={action} className="text-center py-3 px-2 font-semibold text-slate-700 dark:text-slate-300">
                                        {ACTION_LABELS[action]}
                                    </th>
                                ))}
                            </tr>
                        </thead>
                        <tbody>
                            {RESOURCES.map(resource => (
                                <tr key={resource} className="border-b dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-700">
                                    <td className="py-3 px-2 font-medium text-slate-800 dark:text-slate-200">
                                        {RESOURCE_LABELS[resource]}
                                    </td>
                                    {ACTIONS.map(action => {
                                        const hasAction = userPermissions[resource]?.includes(action);
                                        return (
                                            <td key={action} className="text-center py-3 px-2">
                                                <button
                                                    onClick={() => handleToggle(resource, action)}
                                                    disabled={updatePermission.isPending}
                                                    className={`w-8 h-8 rounded-lg flex items-center justify-center transition-all ${hasAction
                                                        ? 'bg-emerald-100 text-emerald-600 dark:bg-emerald-900/30 dark:text-emerald-400'
                                                        : 'bg-slate-100 text-slate-400 dark:bg-slate-800 dark:text-slate-600'
                                                        } hover:scale-110`}
                                                >
                                                    {hasAction ? <Check size={16} /> : <X size={16} />}
                                                </button>
                                            </td>
                                        );
                                    })}
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            )}

            {!selectedUserId && users.length > 0 && (
                <div className="text-center py-12 text-slate-400">
                    <Users size={48} className="mx-auto mb-4 opacity-50" />
                    <p>Chọn một nhân viên để xem và chỉnh sửa quyền</p>
                </div>
            )}

            {users.length === 0 && (
                <div className="text-center py-12 text-slate-400">
                    <Users size={48} className="mx-auto mb-4 opacity-50" />
                    <p className="font-medium text-slate-600 dark:text-slate-300">Chưa có nhân viên nào</p>
                    <p className="text-sm mt-2">Vui lòng thêm nhân viên trước khi phân quyền</p>
                </div>
            )}
        </div>
    );
};

export default PermissionManager;
