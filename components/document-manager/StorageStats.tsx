
import React from 'react';
import { Database } from 'lucide-react';

const StorageStats: React.FC = () => {
    // Mock data - in real app would fetch from API
    const used = 45.5; // GB
    const total = 100; // GB
    const percentage = (used / total) * 100;

    return (
        <div className="p-4 bg-slate-50 dark:bg-slate-800/50 rounded-xl border border-slate-200 dark:border-slate-700">
            <div className="flex items-center gap-2 mb-2 text-slate-700 dark:text-slate-200 font-medium">
                <Database size={16} className="text-blue-500" />
                <span>Dung lượng</span>
            </div>

            <div className="w-full h-2 bg-slate-200 dark:bg-slate-700 rounded-full overflow-hidden mb-2">
                <div
                    className="h-full bg-blue-500 rounded-full transition-all duration-500"
                    style={{ width: `${percentage}%` }}
                />
            </div>

            <div className="flex justify-between text-xs text-slate-500 dark:text-slate-400">
                <span>Đã dùng: {used} GB</span>
                <span>Tổng: {total} GB</span>
            </div>
        </div>
    );
};

export default StorageStats;
