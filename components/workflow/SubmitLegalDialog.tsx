import React, { useState, useEffect, useRef } from 'react';
import { X, FileText, Link, Send, AlertCircle, Loader2, RefreshCw, CheckCircle, AlertTriangle } from 'lucide-react';

interface SubmitLegalDialogProps {
    isOpen: boolean;
    onClose: () => void;
    onSubmit: (draftUrl: string, draftName?: string) => void;
    contractName: string;
}

const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL || 'https://jyohocjsnsyfgfsmjfqx.supabase.co';

/**
 * Extract document ID from Google URL for default naming
 */
const extractGoogleDocInfo = (url: string): { type: string, id: string | null, defaultName: string } => {
    try {
        let type = 'other';
        let id: string | null = null;

        if (url.includes('docs.google.com/document')) {
            type = 'doc';
            const match = url.match(/\/document\/d\/([a-zA-Z0-9_-]+)/);
            id = match ? match[1] : null;
        } else if (url.includes('docs.google.com/spreadsheets')) {
            type = 'sheet';
            const match = url.match(/\/spreadsheets\/d\/([a-zA-Z0-9_-]+)/);
            id = match ? match[1] : null;
        } else if (url.includes('drive.google.com')) {
            type = 'drive';
            const match = url.match(/\/file\/d\/([a-zA-Z0-9_-]+)/) || url.match(/id=([a-zA-Z0-9_-]+)/);
            id = match ? match[1] : null;
        }

        const shortId = id ? id.substring(0, 8) : '';
        const typeLabel = type === 'doc' ? 'Google Doc' : type === 'sheet' ? 'Google Sheet' : type === 'drive' ? 'Google Drive' : 'Tài liệu';
        const defaultName = id ? `Dự thảo HĐ - ${shortId}...` : 'Dự thảo hợp đồng';

        return { type, id, defaultName };
    } catch {
        return { type: 'other', id: null, defaultName: 'Dự thảo hợp đồng' };
    }
};

/**
 * Dialog để nhập link dự thảo hợp đồng (Google Doc) trước khi gửi pháp lý duyệt
 * Tự động lấy tên từ Google
 */
export const SubmitLegalDialog: React.FC<SubmitLegalDialogProps> = ({
    isOpen,
    onClose,
    onSubmit,
    contractName
}) => {
    const [draftUrl, setDraftUrl] = useState('');
    const [draftName, setDraftName] = useState('');
    const [error, setError] = useState('');
    const [isFetchingTitle, setIsFetchingTitle] = useState(false);
    const [titleFetched, setTitleFetched] = useState(false);
    const [fetchFailed, setFetchFailed] = useState(false);
    const debounceRef = useRef<number | null>(null);

    // Auto-fetch title when URL changes
    useEffect(() => {
        if (!draftUrl) {
            setDraftName('');
            setTitleFetched(false);
            setFetchFailed(false);
            return;
        }

        const { type, defaultName } = extractGoogleDocInfo(draftUrl);

        // Set default name immediately
        if (!draftName && type !== 'other') {
            setDraftName(defaultName);
        }

        // Debounce fetch
        if (debounceRef.current) {
            clearTimeout(debounceRef.current);
        }

        if (type !== 'other') {
            debounceRef.current = window.setTimeout(() => {
                fetchTitleFromGoogle(draftUrl);
            }, 800);
        }

        return () => {
            if (debounceRef.current) {
                clearTimeout(debounceRef.current);
            }
        };
    }, [draftUrl]);

    const fetchTitleFromGoogle = async (link: string) => {
        setIsFetchingTitle(true);
        setFetchFailed(false);
        try {
            const response = await fetch(`${SUPABASE_URL}/functions/v1/fetch-google-doc-title`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ url: link })
            });

            const data = await response.json();
            if (data.title && data.success) {
                setDraftName(data.title);
                setTitleFetched(true);
                setFetchFailed(false);
            } else {
                setFetchFailed(true);
            }
        } catch (err) {
            console.error('Failed to fetch title:', err);
            setFetchFailed(true);
        } finally {
            setIsFetchingTitle(false);
        }
    };

    if (!isOpen) return null;

    const handleSubmit = () => {
        // Validate URL
        if (!draftUrl.trim()) {
            setError('Vui lòng nhập link dự thảo hợp đồng');
            return;
        }

        // Basic URL validation
        try {
            const url = new URL(draftUrl);
            if (!url.hostname.includes('docs.google.com') && !url.hostname.includes('drive.google.com')) {
                setError('Vui lòng sử dụng link Google Docs hoặc Google Drive');
                return;
            }
        } catch {
            setError('Link không hợp lệ');
            return;
        }

        setError('');
        onSubmit(draftUrl, draftName || 'Dự thảo hợp đồng');
        setDraftUrl('');
        setDraftName('');
        setTitleFetched(false);
        setFetchFailed(false);
    };

    const { type } = extractGoogleDocInfo(draftUrl);

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm">
            <div className="bg-white dark:bg-slate-900 rounded-2xl shadow-2xl w-full max-w-lg mx-4 animate-in fade-in zoom-in duration-200">
                {/* Header */}
                <div className="flex items-center justify-between p-6 border-b border-slate-200 dark:border-slate-800">
                    <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-xl bg-violet-100 dark:bg-violet-900/30 flex items-center justify-center">
                            <FileText size={20} className="text-violet-600" />
                        </div>
                        <div>
                            <h3 className="font-bold text-lg text-slate-900 dark:text-white">
                                Gửi duyệt Pháp lý
                            </h3>
                            <p className="text-sm text-slate-500 dark:text-slate-400">
                                {contractName}
                            </p>
                        </div>
                    </div>
                    <button
                        onClick={onClose}
                        className="p-2 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
                    >
                        <X size={20} className="text-slate-500" />
                    </button>
                </div>

                {/* Content */}
                <div className="p-6 space-y-4">
                    {/* URL Input */}
                    <div>
                        <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                            <Link size={14} className="inline mr-2" />
                            Link dự thảo hợp đồng (Google Doc)
                        </label>
                        <input
                            type="url"
                            value={draftUrl}
                            onChange={(e) => {
                                setDraftUrl(e.target.value);
                                setError('');
                                setDraftName('');
                                setTitleFetched(false);
                                setFetchFailed(false);
                            }}
                            placeholder="https://docs.google.com/document/d/..."
                            className={`w-full px-4 py-3 rounded-xl border ${error
                                ? 'border-red-300 focus:border-red-500 focus:ring-red-200'
                                : 'border-slate-300 focus:border-violet-500 focus:ring-violet-200'
                                } dark:bg-slate-800 dark:border-slate-700 focus:ring-2 transition-colors`}
                        />
                        {error && (
                            <p className="mt-2 text-sm text-red-600 flex items-center gap-1">
                                <AlertCircle size={14} />
                                {error}
                            </p>
                        )}
                    </div>

                    {/* Document Name - Auto-filled */}
                    {draftUrl && type !== 'other' && (
                        <div>
                            <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2 flex items-center gap-2">
                                <FileText size={14} />
                                Tên tài liệu
                                {isFetchingTitle && (
                                    <span className="text-xs text-violet-500 flex items-center gap-1">
                                        <Loader2 size={12} className="animate-spin" />
                                        Đang lấy tên...
                                    </span>
                                )}
                                {titleFetched && (
                                    <span className="text-xs text-green-500 flex items-center gap-1">
                                        <CheckCircle size={12} />
                                        Đã lấy tên
                                    </span>
                                )}
                            </label>
                            <div className="relative">
                                <input
                                    type="text"
                                    value={draftName}
                                    onChange={(e) => setDraftName(e.target.value)}
                                    placeholder="Tên tài liệu"
                                    className="w-full px-4 py-3 pr-10 rounded-xl border border-slate-300 dark:border-slate-700 dark:bg-slate-800 focus:border-violet-500 focus:ring-2 focus:ring-violet-200 transition-colors"
                                />
                                {!isFetchingTitle && (
                                    <button
                                        onClick={() => fetchTitleFromGoogle(draftUrl)}
                                        className="absolute right-3 top-1/2 -translate-y-1/2 p-1 hover:bg-slate-100 dark:hover:bg-slate-700 rounded"
                                        title="Thử lấy lại tên từ Google"
                                    >
                                        <RefreshCw size={14} className="text-slate-400" />
                                    </button>
                                )}
                            </div>

                            {/* Warning when fetch fails */}
                            {fetchFailed && (
                                <div className="mt-2 p-2 bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800 rounded-lg">
                                    <p className="text-xs text-amber-700 dark:text-amber-300 flex items-start gap-2">
                                        <AlertTriangle size={14} className="flex-shrink-0 mt-0.5" />
                                        <span>
                                            Không lấy được tên tự động. Để lấy tên:<br />
                                            1. Share file → "Anyone with the link"<br />
                                            2. Bấm 🔄 để thử lại
                                        </span>
                                    </p>
                                </div>
                            )}
                        </div>
                    )}

                    <div className="bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800 rounded-xl p-4 text-sm">
                        <p className="text-amber-800 dark:text-amber-300">
                            <strong>Lưu ý:</strong> Link phải là Google Docs và được share quyền view/comment cho Pháp chế.
                        </p>
                    </div>
                </div>

                {/* Footer */}
                <div className="flex justify-end gap-3 p-6 border-t border-slate-200 dark:border-slate-800">
                    <button
                        onClick={onClose}
                        className="px-5 py-2.5 rounded-xl border border-slate-300 dark:border-slate-700 text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800 font-medium transition-colors"
                    >
                        Hủy
                    </button>
                    <button
                        onClick={handleSubmit}
                        disabled={isFetchingTitle}
                        className="px-5 py-2.5 rounded-xl bg-violet-600 text-white hover:bg-violet-700 font-medium flex items-center gap-2 transition-colors shadow-lg shadow-violet-200 dark:shadow-violet-900/30 disabled:opacity-50"
                    >
                        <Send size={16} />
                        Gửi duyệt
                    </button>
                </div>
            </div>
        </div>
    );
};
