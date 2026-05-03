import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import React from 'react';
import ErrorBoundary from '../../components/ErrorBoundary';

// ── Helpers ─────────────────────────────────────────────────────────────────

/** A component that throws synchronously on render when `shouldThrow` is true */
const Bomb: React.FC<{ shouldThrow?: boolean; message?: string }> = ({
    shouldThrow = false,
    message = 'Test error',
}) => {
    if (shouldThrow) throw new Error(message);
    return <div>Content OK</div>;
};

/** Suppress jsdom's console.error flood for expected errors */
let consoleError: ReturnType<typeof vi.spyOn>;
beforeEach(() => {
    consoleError = vi.spyOn(console, 'error').mockImplementation(() => {});
});
afterEach(() => {
    consoleError.mockRestore();
    vi.restoreAllMocks();
    sessionStorage.clear();
});

// ── Tests ────────────────────────────────────────────────────────────────────

describe('ErrorBoundary', () => {
    it('renders children when there is no error', () => {
        render(
            <ErrorBoundary>
                <Bomb />
            </ErrorBoundary>
        );
        expect(screen.getByText('Content OK')).toBeInTheDocument();
    });

    it('renders default error UI when child throws', () => {
        render(
            <ErrorBoundary>
                <Bomb shouldThrow message="Unexpected failure" />
            </ErrorBoundary>
        );
        expect(screen.getByText('Sự cố bất ngờ')).toBeInTheDocument();
        expect(screen.getByText(/Đã xảy ra lỗi trong thành phần này: Unexpected failure/)).toBeInTheDocument();
    });

    it('renders custom fallback prop when provided', () => {
        render(
            <ErrorBoundary fallback={<div>Custom Fallback</div>}>
                <Bomb shouldThrow />
            </ErrorBoundary>
        );
        expect(screen.getByText('Custom Fallback')).toBeInTheDocument();
        expect(screen.queryByText('Sự cố bất ngờ')).not.toBeInTheDocument();
    });

    it('calls onError prop with error and errorInfo', () => {
        const onError = vi.fn();
        render(
            <ErrorBoundary onError={onError}>
                <Bomb shouldThrow message="logged error" />
            </ErrorBoundary>
        );
        expect(onError).toHaveBeenCalledOnce();
        const [error] = onError.mock.calls[0];
        expect(error.message).toBe('logged error');
    });

    it('retry button resets error state', async () => {
        // Use a stateful wrapper so after retry click we can prevent Bomb from throwing again
        let setShouldThrow: (v: boolean) => void;

        const Wrapper = () => {
            const [shouldThrow, _set] = React.useState(true);
            setShouldThrow = _set;
            return (
                <ErrorBoundary>
                    <Bomb shouldThrow={shouldThrow} />
                </ErrorBoundary>
            );
        };

        render(<Wrapper />);
        expect(screen.getByText('Sự cố bất ngờ')).toBeInTheDocument();

        // Change shouldThrow to false before retry so re-render doesn't throw again
        setShouldThrow!(false);
        fireEvent.click(screen.getByRole('button', { name: /Thử lại/i }));

        expect(screen.getByText('Content OK')).toBeInTheDocument();
    });

    it('shows chunk-load error UI for dynamic import failures', () => {
        render(
            <ErrorBoundary>
                <Bomb shouldThrow message="Failed to fetch dynamically imported module" />
            </ErrorBoundary>
        );
        expect(screen.getByText('Phiên bản mới')).toBeInTheDocument();
        expect(screen.getByText(/Ứng dụng đã được cập nhật/)).toBeInTheDocument();
    });

    it('shows "Tải lại trang" label for chunk load errors', () => {
        render(
            <ErrorBoundary>
                <Bomb shouldThrow message="Failed to fetch dynamically imported module" />
            </ErrorBoundary>
        );
        expect(screen.getByRole('button', { name: /Tải lại trang/i })).toBeInTheDocument();
    });

    it('detects "Loading chunk" as chunk load error', () => {
        render(
            <ErrorBoundary>
                <Bomb shouldThrow message="Loading chunk 42 failed." />
            </ErrorBoundary>
        );
        expect(screen.getByText('Phiên bản mới')).toBeInTheDocument();
    });

    it('does not auto-reload if chunk reload happened recently', () => {
        const reloadSpy = vi.fn();
        Object.defineProperty(window, 'location', {
            value: { reload: reloadSpy },
            writable: true,
        });

        // Simulate a very recent reload
        sessionStorage.setItem('chunk_reload_ts', String(Date.now() - 1000));

        render(
            <ErrorBoundary>
                <Bomb shouldThrow message="Failed to fetch dynamically imported module" />
            </ErrorBoundary>
        );

        // Should NOT have called reload again
        expect(reloadSpy).not.toHaveBeenCalled();
    });
});
