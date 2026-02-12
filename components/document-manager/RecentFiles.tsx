
import React, { useEffect, useState } from 'react';
import { supabase } from '../../lib/supabase';
import { FileText, Clock, FileSpreadsheet, Image as ImageIcon } from 'lucide-react';
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
            // Supabase join queries can return arrays or objects depending on relationship detection
            // Casting to any to avoid strict type mismatch during development
            setFiles(data as any || []);
        } catch (error) {
            console.error('Error fetching recent files:', error);
        } finally {
            setLoading(false);
        }
    };

    const getFileIcon = (filename: string) => {
        const ext = filename.split('.').pop()?.toLowerCase();
        if (['xls', 'xlsx', 'csv'].includes(ext || '')) return <FileSpreadsheet size={16} className="text-green-500" />;
        if (['jpg', 'png', 'jpeg', 'webp'].includes(ext || '')) return <ImageIcon size={16} className="text-purple-500" />;
        return <FileText size={16} className="text-blue-500" />;
    };

    if (loading) return <div className="p-4 text-center text-slate-400 text-sm">Đang tải...</div>;

    return (
        <div className="space-y-3">
            <h3 className="font-semibold text-slate-700 dark:text-slate-200 uppercase text-xs tracking-wider flex items-center gap-2">
                <Clock size={16} />
                Gần đây
            </h3>

            <div className="space-y-2">
                {files.map(file => {
                    // Handle contracts relation which might be returned as an array or object
                    const contractCode = Array.isArray(file.contracts)
                        ? file.contracts[0]?.contract_code
                        : file.contracts?.contract_code;

                    return (
                        <div key={file.id} className="group flex items-center gap-3 p-2 rounded-lg hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors cursor-pointer border border-transparent hover:border-slate-100 dark:hover:border-slate-800">
                            <div className="bg-slate-100 dark:bg-slate-800 p-2 rounded-lg group-hover:bg-white dark:group-hover:bg-slate-700 transition-colors shadow-sm">
                                {getFileIcon(file.name)}
                            </div>
                            <div className="flex-1 min-w-0">
                                <div className="text-sm font-medium text-slate-700 dark:text-slate-200 truncate" title={file.name}>
                                    {file.name}
                                </div>
                                <div className="flex items-center gap-2 text-xs text-slate-500">
                                    <span className="bg-slate-100 dark:bg-slate-800 px-1.5 py-0.5 rounded text-slate-600 dark:text-slate-400 font-mono">
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
                    <div className="text-center py-4 text-slate-400 text-sm">
                        Chưa có tài liệu nào
                    </div>
                )}
            </div>
        </div>
    );
};

export default RecentFiles;
