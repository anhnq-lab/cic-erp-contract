import React, { Component, ErrorInfo, ReactNode } from 'react';
import { AlertTriangle, RefreshCcw } from 'lucide-react';

interface Props {
    children?: ReactNode;
    fallback?: ReactNode;
}

interface State {
    hasError: boolean;
    error: Error | null;
}

export class ErrorBoundary extends Component<Props, State> {
    public state: State = {
        hasError: false,
        error: null
    };

    public static getDerivedStateFromError(error: Error): State {
        return { hasError: true, error };
    }

    public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
        console.error('Uncaught error:', error, errorInfo);
    }

    public render() {
        if (this.state.hasError) {
            return this.props.fallback || (
                <div className="min-h-screen bg-slate-50 dark:bg-slate-900 flex flex-col items-center justify-center p-4">
                    <div className="bg-white dark:bg-slate-800 p-8 rounded-2xl shadow-xl max-w-md w-full text-center border border-slate-200 dark:border-slate-700">
                        <div className="w-16 h-16 bg-red-100 dark:bg-red-900/30 rounded-full flex items-center justify-center mx-auto mb-6 text-red-600 dark:text-red-400">
                            <AlertTriangle size={32} />
                        </div>
                        <h2 className="text-2xl font-bold text-slate-900 dark:text-slate-100 mb-2">
                            Đã có lỗi xảy ra
                        </h2>
                        <p className="text-slate-500 dark:text-slate-400 mb-6 font-medium">
                            Ứng dụng gặp sự cố không mong muốn. Chúng tôi đã ghi nhận lỗi này.
                        </p>

                        <div className="bg-slate-100 dark:bg-slate-900/50 p-4 rounded-xl text-left mb-6 overflow-hidden">
                            <code className="text-xs text-red-500 font-mono break-all block">
                                {this.state.error?.message || 'Unknown Error'}
                            </code>
                        </div>

                        <button
                            onClick={() => window.location.reload()}
                            className="w-full py-3 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl font-bold transition-colors flex items-center justify-center gap-2"
                        >
                            <RefreshCcw size={18} />
                            Tải lại trang
                        </button>
                    </div>
                </div>
            );
        }

        return this.props.children;
    }
}
