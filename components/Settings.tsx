import React from 'react';
import { Moon, Sun } from 'lucide-react';
import DataSeeder from './admin/DataSeeder';
import PilotRunner from './admin/PilotRunner';
import { useLayoutContext } from './layout/MainLayout';

const Settings: React.FC = () => {
    const { theme, setTheme } = useLayoutContext();

    return (
        <div className="max-w-2xl mx-auto bg-white dark:bg-slate-900 p-6 md:p-8 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-sm transition-all">
            <div className="flex items-center justify-between mb-8">
                <h2 className="text-xl font-bold text-slate-900 dark:text-slate-100">Cài đặt hệ thống</h2>
                <span className="text-[10px] font-bold bg-slate-100 dark:bg-slate-800 px-3 py-1 rounded-full text-slate-500">v2.4.0</span>
            </div>
            <div className="space-y-6">
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

                <div className="pb-6 border-b border-slate-100 dark:border-slate-800">
                    <p className="font-bold text-slate-800 dark:text-slate-200 text-sm mb-4">Dữ liệu & Hệ thống</p>
                    <DataSeeder />
                </div>

                <div className="pb-6 border-b border-slate-100 dark:border-slate-800">
                    <p className="font-bold text-slate-800 dark:text-slate-200 text-sm mb-4">Kiểm thử Hệ thống (Testing)</p>
                    <PilotRunner />
                </div>
            </div>
        </div>
    );
};

export default Settings;
