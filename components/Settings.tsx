import React from 'react';
import { Moon, Sun, Shield } from 'lucide-react';
import DataSeeder from './admin/DataSeeder';
import PilotRunner from './admin/PilotRunner';
import PermissionManager from './settings/PermissionManager';
import { useLayoutContext } from './layout/MainLayout';
import { useAuth } from '../contexts/AuthContext';

const Settings: React.FC = () => {
    const { theme, setTheme } = useLayoutContext();
    const { profile } = useAuth();

    // Only Admin can see Permission Manager
    const isAdmin = profile?.role === 'Admin';

    return (
        <div className="max-w-4xl mx-auto space-y-6">
            {/* Theme Settings */}
            <div className="bg-white dark:bg-slate-900 p-6 md:p-8 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-sm">
                <div className="flex items-center justify-between mb-6">
                    <h2 className="text-xl font-bold text-slate-900 dark:text-slate-100">Cài đặt hệ thống</h2>
                    <span className="text-[10px] font-bold bg-slate-100 dark:bg-slate-800 px-3 py-1 rounded-full text-slate-500">v2.5.0</span>
                </div>

                <div className="space-y-6">
                    {/* Theme */}
                    <div className="pb-6 border-b border-slate-100 dark:border-slate-800">
                        <p className="font-bold text-slate-800 dark:text-slate-200 text-sm mb-4">Giao diện hệ thống</p>
                        <div className="grid grid-cols-2 gap-4">
                            <button
                                onClick={() => setTheme('light')}
                                className={`flex items-center justify-center gap-3 p-4 rounded-2xl border-2 transition-all ${theme === 'light'
                                    ? 'bg-indigo-50 border-indigo-600 text-indigo-700'
                                    : 'bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700 text-slate-500'
                                    }`}
                            >
                                <Sun size={20} />
                                <span className="font-bold text-sm">Chế độ Sáng</span>
                            </button>
                            <button
                                onClick={() => setTheme('dark')}
                                className={`flex items-center justify-center gap-3 p-4 rounded-2xl border-2 transition-all ${theme === 'dark'
                                    ? 'bg-indigo-900/40 border-indigo-500 text-indigo-400'
                                    : 'bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700 text-slate-500'
                                    }`}
                            >
                                <Moon size={20} />
                                <span className="font-bold text-sm">Chế độ Tối</span>
                            </button>
                        </div>
                    </div>

                    {/* Data Seeder */}
                    <div className="pb-6 border-b border-slate-100 dark:border-slate-800">
                        <p className="font-bold text-slate-800 dark:text-slate-200 text-sm mb-4">Dữ liệu & Hệ thống</p>
                        <DataSeeder />
                    </div>

                    {/* Pilot Runner */}
                    <div>
                        <p className="font-bold text-slate-800 dark:text-slate-200 text-sm mb-4">Kiểm thử Hệ thống (Testing)</p>
                        <PilotRunner />
                    </div>
                </div>
            </div>

            {/* Permission Manager - Admin Only */}
            {isAdmin && (
                <div className="bg-white dark:bg-slate-900 p-6 md:p-8 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-sm">
                    <div className="flex items-center gap-3 mb-6">
                        <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-purple-500 to-indigo-600 flex items-center justify-center">
                            <Shield size={20} className="text-white" />
                        </div>
                        <div>
                            <h2 className="text-xl font-bold text-slate-900 dark:text-slate-100">Phân quyền người dùng</h2>
                            <p className="text-xs text-slate-500">Quản lý quyền truy cập cho từng nhân viên</p>
                        </div>
                    </div>
                    <PermissionManager />
                </div>
            )}
        </div>
    );
};

export default Settings;
