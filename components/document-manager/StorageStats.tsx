
import React from 'react';
import { Database, HardDrive, Cloud } from 'lucide-react';

const StorageStats: React.FC = () => {
    // Mock data - in real app would fetch from API
    const used = 45.5; // GB
    const total = 100; // GB
    const percentage = (used / total) * 100;

    return (
        <div className="p-4 bg-gradient-to-br from-indigo-50 to-purple-50 dark:from-indigo-900/20 dark:to-purple-900/20 rounded-xl border border-indigo-100 dark:border-indigo-800/40">
            <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-2 text-slate-700 dark:text-slate-200 font-black text-xs uppercase tracking-wider">
                    <div className="p-1.5 bg-white dark:bg-slate-800 rounded-lg shadow-sm">
                        <Cloud size={14} className="text-indigo-600 dark:text-indigo-400" />
                    </div>
                    <span>Google Drive</span>
                </div>
                <span className="text-[10px] font-bold text-indigo-600 dark:text-indigo-400 bg-indigo-100 dark:bg-indigo-900/40 px-2 py-0.5 rounded-full">
                    {percentage.toFixed(0)}%
                </span>
            </div>

            <div className="w-full h-2.5 bg-white dark:bg-slate-800 rounded-full overflow-hidden shadow-inner mb-2.5">
                <div
                    className="h-full bg-gradient-to-r from-indigo-500 to-purple-500 rounded-full transition-all duration-1000"
                    style={{ width: `${percentage}%` }}
                />
            </div>

            <div className="flex justify-between text-[10px] font-bold text-slate-500 dark:text-slate-400">
                <span className="flex items-center gap-1">
                    <HardDrive size={10} /> {used} GB đã dùng
                </span>
                <span>{total} GB tổng</span>
            </div>
        </div>
    );
};

export default StorageStats;
