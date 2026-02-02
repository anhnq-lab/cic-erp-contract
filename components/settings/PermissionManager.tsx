import React, { useState, useEffect } from 'react';
import { Shield, Users, Check, X, Loader2, Search } from 'lucide-react';
import { toast } from 'sonner';
import { PermissionAction, PermissionResource, UserProfile, DEFAULT_ROLE_PERMISSIONS } from '../../types';
import { useAllPermissions, useUpdatePermission } from '../../hooks';
import { supabase } from '../../lib/supabase';

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

const PermissionManager: React.FC = () => {
    const [users, setUsers] = useState<UserProfile[]>([]);
    const [selectedUserId, setSelectedUserId] = useState<string>('');
    const [userPermissions, setUserPermissions] = useState<Record<PermissionResource, PermissionAction[]>>({} as any);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');

    const { data: allPermissions, isLoading: permLoading } = useAllPermissions();
    const updatePermission = useUpdatePermission();

    // Fetch users
    useEffect(() => {
        const fetchUsers = async () => {
            setLoading(true);
            const { data, error } = await supabase
                .from('profiles')
                .select('id, email, full_name, role, unit_id')
                .order('full_name');

            if (!error && data) {
                setUsers(data.map(u => ({
                    id: u.id,
                    email: u.email,
                    fullName: u.full_name,
                    role: u.role,
                    unitId: u.unit_id,
                })));
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
        user.role?.toLowerCase().includes(searchTerm.toLowerCase())
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
                            placeholder="Tên, email hoặc role..."
                            className="w-full pl-9 pr-3 py-2 border rounded-lg dark:bg-slate-800 dark:border-slate-700"
                        />
                    </div>
                </div>
                <div className="flex-1">
                    <label className="block text-xs text-slate-500 mb-1">Chọn nhân viên để phân quyền</label>
                    <select
                        value={selectedUserId}
                        onChange={e => setSelectedUserId(e.target.value)}
                        className="w-full px-3 py-2 border rounded-lg dark:bg-slate-800 dark:border-slate-700"
                    >
                        <option value="">-- Chọn nhân viên --</option>
                        {filteredUsers.map(user => (
                            <option key={user.id} value={user.id}>
                                {user.fullName} ({user.role}) - {user.email}
                            </option>
                        ))}
                    </select>
                </div>
            </div>

            {/* Selected User Info */}
            {selectedUser && (
                <div className="p-4 bg-indigo-50 dark:bg-indigo-900/20 rounded-xl flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full bg-indigo-500 flex items-center justify-center text-white font-bold">
                        {selectedUser.fullName?.charAt(0) || 'U'}
                    </div>
                    <div>
                        <p className="font-semibold text-slate-800 dark:text-slate-200">{selectedUser.fullName}</p>
                        <p className="text-xs text-slate-500">{selectedUser.email} • {selectedUser.role}</p>
                    </div>
                </div>
            )}

            {/* Permission Matrix */}
            {selectedUserId && (
                <div className="overflow-x-auto">
                    <table className="w-full text-sm">
                        <thead>
                            <tr className="border-b dark:border-slate-700">
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
                                <tr key={resource} className="border-b dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-800/50">
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

            {!selectedUserId && (
                <div className="text-center py-12 text-slate-400">
                    <Users size={48} className="mx-auto mb-4 opacity-50" />
                    <p>Chọn một nhân viên để xem và chỉnh sửa quyền</p>
                </div>
            )}
        </div>
    );
};

export default PermissionManager;
