import React, { useState } from 'react';
import { X, FileText, Link, Send, AlertCircle } from 'lucide-react';

interface SubmitLegalDialogProps {
    isOpen: boolean;
    onClose: () => void;
    onSubmit: (draftUrl: string) => void;
    contractName: string;
}

/**
 * Dialog để nhập link dự thảo hợp đồng (Google Doc) trước khi gửi pháp lý duyệt
 */
export const SubmitLegalDialog: React.FC<SubmitLegalDialogProps> = ({
    isOpen,
    onClose,
    onSubmit,
    contractName
}) => {
    const [draftUrl, setDraftUrl] = useState('');
    const [error, setError] = useState('');

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
        onSubmit(draftUrl);
        setDraftUrl('');
    };

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
                <div className="p-6">
                    <div className="mb-4">
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

                    <div className="bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800 rounded-xl p-4 text-sm">
                        <p className="text-amber-800 dark:text-amber-300">
                            <strong>Lưu ý:</strong> Link phải là Google Docs hoặc Google Drive và được share quyền view/comment cho Pháp chế.
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
                        className="px-5 py-2.5 rounded-xl bg-violet-600 text-white hover:bg-violet-700 font-medium flex items-center gap-2 transition-colors shadow-lg shadow-violet-200 dark:shadow-violet-900/30"
                    >
                        <Send size={16} />
                        Gửi duyệt
                    </button>
                </div>
            </div>
        </div>
    );
};
