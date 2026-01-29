
import React, { Component, ErrorInfo, ReactNode } from 'react';
import ErrorState from './ui/ErrorState';

interface Props {
    children: ReactNode;
    fallback?: ReactNode;
}

interface State {
    hasError: boolean;
    error?: Error;
}

class ErrorBoundary extends Component<Props, State> {
    public state: State = {
        hasError: false
    };

    public static getDerivedStateFromError(error: Error): State {
        return { hasError: true, error };
    }

    public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
        console.error("Uncaught error:", error, errorInfo);
    }

    public render() {
        if (this.state.hasError) {
            if (this.props.fallback) {
                return this.props.fallback;
            }
            return (
                <div className="p-6">
                    <ErrorState
                        title="Sự cố bất ngờ"
                        message={`Đã xảy ra lỗi trong thành phần này: ${this.state.error?.message}`}
                        onRetry={() => this.setState({ hasError: false })}
                    />
                </div>
            );
        }

        return this.props.children;
    }
}

export default ErrorBoundary;
