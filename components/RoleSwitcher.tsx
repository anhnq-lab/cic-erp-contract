import React, { useState } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { supabase } from '../lib/supabase';
import { UserRole } from '../types';
import { toast } from 'sonner';
import { Shield, RefreshCw } from 'lucide-react';

const ROLES: { value: UserRole; label: string }[] = [
    { value: 'Leadership', label: 'Lãnh đạo' },
    { value: 'NVKD', label: 'NVKD' },
    { value: 'UnitLeader', label: 'Lãnh đạo Đơn vị' },
    { value: 'AdminUnit', label: 'Admin Đơn vị' },
    { value: 'Accountant', label: 'Kế toán' },
    { value: 'ChiefAccountant', label: 'Kế toán trưởng' },
    { value: 'Legal', label: 'Pháp chế' },
];

export const RoleSwitcher: React.FC = () => {
    const { user, profile, refreshProfile } = useAuth();
    const [isUpdating, setIsUpdating] = useState(false);

    // Only show for specific admin email
    if (user?.email !== 'anhnq@cic.com.vn') return null;

    const handleRoleChange = async (newRole: UserRole) => {
        if (!user || isUpdating) return;
        setIsUpdating(true);
        try {
            const { error } = await supabase
                .from('profiles')
                .update({ role: newRole })
                .eq('id', user.id);

            if (error) throw error;

            toast.success(`Đã chuyển sang vai trò: ${newRole}`);
            await refreshProfile(); // Ensure context updates

            // Reload window to ensure all RLS subscriptions reset
            window.location.reload();

        } catch (error: any) {
            toast.error("Lỗi chuyển vai trò: " + error.message);
        } finally {
            setIsUpdating(false);
        }
    };

    return (
        <div className="fixed bottom-4 right-4 z-50 bg-slate-900 text-white p-2 rounded-lg shadow-xl border border-slate-700 flex items-center gap-2 text-xs opacity-50 hover:opacity-100 transition-opacity">
            <Shield size={14} className="text-amber-400" />
            <span className="font-bold text-slate-300">TEST ROLE:</span>
            <select
                value={profile?.role}
                onChange={(e) => handleRoleChange(e.target.value as UserRole)}
                className="bg-slate-800 border border-slate-600 rounded px-2 py-1 outline-none focus:border-indigo-500"
                disabled={isUpdating}
            >
                {ROLES.map((r) => (
                    <option key={r.value} value={r.value}>
                        {r.label} ({r.value})
                    </option>
                ))}
            </select>
            {isUpdating && <RefreshCw size={12} className="animate-spin text-slate-400" />}
        </div>
    );
};
