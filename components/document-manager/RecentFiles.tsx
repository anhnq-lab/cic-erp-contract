
import React, { useEffect, useState } from 'react';
import { supabase } from '../../lib/supabase';
import { FileText, Clock, FileSpreadsheet, Image as ImageIcon, ExternalLink } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';
import { vi } from 'date-fns/locale';

interface RecentFile {
    id: string;
    name: string;
    created_at: string;
    contract_id: string;
    contracts?: {
        contract_code: string;
    } | {
        contract_code: string;
    }[];
}

const RecentFiles: React.FC = () => {
    const [files, setFiles] = useState<RecentFile[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        fetchRecentFiles();
    }, []);

    const fetchRecentFiles = async () => {
        try {
            const { data, error } = await supabase
                .from('contract_documents')
                .select(`
          id,
          name,
          created_at,
          contract_id,
          contracts (contract_code)
        `)
                .order('created_at', { ascending: false })
                .limit(5);

            if (error) throw error;
            setFiles(data as any || []);
        } catch (error) {
            console.error('Error fetching recent files:', error);
        } finally {
            setLoading(false);
        }
    };

    const getFileIcon = (filename: string) => {
        const ext = filename.split('.').pop()?.toLowerCase();
        if (['xls', 'xlsx', 'csv'].includes(ext || '')) return <FileSpreadsheet size={14} className="text-emerald-500" />;
        if (['jpg', 'png', 'jpeg', 'webp'].includes(ext || '')) return <ImageIcon size={14} className="text-purple-500" />;
        if (['pdf'].includes(ext || '')) return <FileText size={14} className="text-rose-500" />;
        return <FileText size={14} className="text-indigo-500" />;
    };

    if (loading) return (
        <div className="space-y-3">
            <h3 className="font-black text-slate-700 dark:text-slate-200 uppercase text-[10px] tracking-widest flex items-center gap-2">
                <Clock size={14} className="text-indigo-500" /> Gần đây
            </h3>
            {[1, 2, 3].map(i => (
                <div key={i} className="flex items-center gap-3 p-2">
                    <div className="w-8 h-8 rounded-lg bg-slate-100 dark:bg-slate-800 animate-pulse" />
                    <div className="flex-1 space-y-1.5">
                        <div className="w-3/4 h-3 bg-slate-100 dark:bg-slate-800 rounded animate-pulse" />
                        <div className="w-1/2 h-2 bg-slate-100 dark:bg-slate-800 rounded animate-pulse" />
                    </div>
                </div>
            ))}
        </div>
    );

    return (
        <div className="space-y-3">
            <h3 className="font-black text-slate-700 dark:text-slate-200 uppercase text-[10px] tracking-widest flex items-center gap-2">
                <Clock size={14} className="text-indigo-500" />
                Gần đây
            </h3>

            <div className="space-y-1">
                {files.map(file => {
                    const contractCode = Array.isArray(file.contracts)
                        ? file.contracts[0]?.contract_code
                        : file.contracts?.contract_code;

                    return (
                        <div key={file.id} className="group flex items-center gap-3 p-2.5 rounded-lg hover:bg-indigo-50 dark:hover:bg-indigo-900/20 transition-all cursor-pointer border border-transparent hover:border-indigo-100 dark:hover:border-indigo-800/40">
                            <div className="bg-slate-100 dark:bg-slate-800 p-2 rounded-lg group-hover:bg-white dark:group-hover:bg-slate-700 transition-colors shadow-sm flex-shrink-0">
                                {getFileIcon(file.name)}
                            </div>
                            <div className="flex-1 min-w-0">
                                <div className="text-xs font-bold text-slate-700 dark:text-slate-200 truncate group-hover:text-indigo-600 dark:group-hover:text-indigo-400 transition-colors" title={file.name}>
                                    {file.name}
                                </div>
                                <div className="flex items-center gap-1.5 text-[10px] text-slate-400 mt-0.5">
                                    <span className="bg-slate-100 dark:bg-slate-800 px-1.5 py-0.5 rounded text-slate-500 dark:text-slate-400 font-mono font-bold">
                                        {contractCode || 'N/A'}
                                    </span>
                                    <span>•</span>
                                    <span>{formatDistanceToNow(new Date(file.created_at), { addSuffix: true, locale: vi })}</span>
                                </div>
                            </div>
                        </div>
                    );
                })}

                {files.length === 0 && (
                    <div className="text-center py-6 text-slate-400 text-xs font-bold">
                        Chưa có tài liệu nào
                    </div>
                )}
            </div>
        </div>
    );
};

export default RecentFiles;
