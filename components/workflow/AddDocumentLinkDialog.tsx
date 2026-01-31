import React, { useState, useEffect, useRef } from 'react';
import { X, Link, FileText, Table, FolderOpen, Plus, AlertCircle, Loader2 } from 'lucide-react';
import { supabase } from '../../lib/supabase';

interface AddDocumentLinkDialogProps {
    isOpen: boolean;
    onClose: () => void;
    onSubmit: (doc: { name: string; url: string; type: 'drive' | 'doc' | 'sheet' | 'other' }) => void;
}

const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL || 'https://jyohocjsnsyfgfsmjfqx.supabase.co';

/**
 * Dialog để thêm link tài liệu Google Drive/Doc/Sheet
 * Tự động lấy tên file từ Google
 */
export const AddDocumentLinkDialog: React.FC<AddDocumentLinkDialogProps> = ({
    isOpen,
    onClose,
    onSubmit
}) => {
    const [name, setName] = useState('');
    const [url, setUrl] = useState('');
    const [error, setError] = useState('');
    const [isFetchingTitle, setIsFetchingTitle] = useState(false);
    const debounceRef = useRef<number | null>(null);

    // Auto-fetch title when URL changes
    useEffect(() => {
        if (!url || !isGoogleUrl(url)) {
            return;
        }

        // Debounce fetch
        if (debounceRef.current) {
            clearTimeout(debounceRef.current);
        }

        debounceRef.current = window.setTimeout(async () => {
            await fetchGoogleTitle(url);
        }, 500);

        return () => {
            if (debounceRef.current) {
                clearTimeout(debounceRef.current);
            }
        };
    }, [url]);

    const isGoogleUrl = (link: string): boolean => {
        return link.includes('docs.google.com') || link.includes('drive.google.com');
    };

    const fetchGoogleTitle = async (link: string) => {
        setIsFetchingTitle(true);
        try {
            const response = await fetch(`${SUPABASE_URL}/functions/v1/fetch-google-doc-title`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ url: link })
            });

            const data = await response.json();
            if (data.title && !name) {
                setName(data.title);
            }
        } catch (err) {
            console.error('Failed to fetch title:', err);
        } finally {
            setIsFetchingTitle(false);
        }
    };

    if (!isOpen) return null;

    const detectLinkType = (link: string): 'drive' | 'doc' | 'sheet' | 'other' => {
        if (link.includes('docs.google.com/document')) return 'doc';
        if (link.includes('docs.google.com/spreadsheets')) return 'sheet';
        if (link.includes('drive.google.com')) return 'drive';
        return 'other';
    };

    const handleSubmit = () => {
        if (!name.trim()) {
            setError('Vui lòng nhập tên tài liệu');
            return;
        }
        if (!url.trim()) {
            setError('Vui lòng nhập link tài liệu');
            return;
        }

        // Basic URL validation
        try {
            new URL(url);
        } catch {
            setError('Link không hợp lệ');
            return;
        }

        const type = detectLinkType(url);
        onSubmit({ name, url, type });
        setName('');
        setUrl('');
        setError('');
        onClose();
    };

    const linkTypeIcon = (type: 'drive' | 'doc' | 'sheet' | 'other') => {
        switch (type) {
            case 'doc': return <FileText size={16} className="text-blue-500" />;
            case 'sheet': return <Table size={16} className="text-green-500" />;
            case 'drive': return <FolderOpen size={16} className="text-yellow-500" />;
            default: return <Link size={16} className="text-slate-500" />;
        }
    };

    const detectedType = url ? detectLinkType(url) : null;

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm">
            <div className="bg-white dark:bg-slate-900 rounded-2xl shadow-2xl w-full max-w-md mx-4 animate-in fade-in zoom-in duration-200">
                {/* Header */}
                <div className="flex items-center justify-between p-5 border-b border-slate-200 dark:border-slate-800">
                    <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-xl bg-indigo-100 dark:bg-indigo-900/30 flex items-center justify-center">
                            <Link size={20} className="text-indigo-600" />
                        </div>
                        <h3 className="font-bold text-lg text-slate-900 dark:text-white">
                            Thêm tài liệu
                        </h3>
                    </div>
                    <button
                        onClick={onClose}
                        className="p-2 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
                    >
                        <X size={20} className="text-slate-500" />
                    </button>
                </div>

                {/* Content */}
                <div className="p-5 space-y-4">
                    {/* Document URL - Đặt lên trước để auto-fetch tên */}
                    <div>
                        <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                            Link tài liệu
                        </label>
                        <div className="relative">
                            <input
                                type="url"
                                value={url}
                                onChange={(e) => { setUrl(e.target.value); setError(''); }}
                                placeholder="https://docs.google.com/..."
                                className="w-full px-4 py-3 pl-10 rounded-xl border border-slate-300 dark:border-slate-700 dark:bg-slate-800 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-200 transition-colors"
                            />
                            <div className="absolute left-3 top-1/2 -translate-y-1/2">
                                {detectedType ? linkTypeIcon(detectedType) : <Link size={16} className="text-slate-400" />}
                            </div>
                        </div>
                        {detectedType && (
                            <p className="mt-2 text-xs text-slate-500 flex items-center gap-1">
                                {linkTypeIcon(detectedType)}
                                {detectedType === 'doc' && 'Google Docs'}
                                {detectedType === 'sheet' && 'Google Sheets'}
                                {detectedType === 'drive' && 'Google Drive'}
                                {detectedType === 'other' && 'Link khác'}
                            </p>
                        )}
                    </div>

                    {/* Document Name - Auto-filled from Google */}
                    <div>
                        <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2 flex items-center gap-2">
                            Tên tài liệu
                            {isFetchingTitle && (
                                <span className="text-xs text-indigo-500 flex items-center gap-1">
                                    <Loader2 size={12} className="animate-spin" />
                                    Đang lấy tên...
                                </span>
                            )}
                        </label>
                        <input
                            type="text"
                            value={name}
                            onChange={(e) => { setName(e.target.value); setError(''); }}
                            placeholder="Tự động lấy từ Google hoặc nhập thủ công"
                            className="w-full px-4 py-3 rounded-xl border border-slate-300 dark:border-slate-700 dark:bg-slate-800 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-200 transition-colors"
                        />
                    </div>

                    {error && (
                        <p className="text-sm text-red-600 flex items-center gap-1">
                            <AlertCircle size={14} />
                            {error}
                        </p>
                    )}
                </div>

                {/* Footer */}
                <div className="flex justify-end gap-3 p-5 border-t border-slate-200 dark:border-slate-800">
                    <button
                        onClick={onClose}
                        className="px-5 py-2.5 rounded-xl border border-slate-300 dark:border-slate-700 text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800 font-medium transition-colors"
                    >
                        Hủy
                    </button>
                    <button
                        onClick={handleSubmit}
                        disabled={isFetchingTitle}
                        className="px-5 py-2.5 rounded-xl bg-indigo-600 text-white hover:bg-indigo-700 font-medium flex items-center gap-2 transition-colors shadow-lg shadow-indigo-200 dark:shadow-indigo-900/30 disabled:opacity-50"
                    >
                        <Plus size={16} />
                        Thêm
                    </button>
                </div>
            </div>
        </div>
    );
};
