import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import React from 'react';
import ErrorState from '../../../components/ui/ErrorState';

describe('ErrorState', () => {
    it('renders with default title and message', () => {
        render(<ErrorState />);
        expect(screen.getByText('Đã xảy ra lỗi')).toBeInTheDocument();
        expect(screen.getByText('Không thể tải dữ liệu. Vui lòng thử lại sau.')).toBeInTheDocument();
    });

    it('renders custom title and message', () => {
        render(<ErrorState title="Custom Error" message="Something broke" />);
        expect(screen.getByText('Custom Error')).toBeInTheDocument();
        expect(screen.getByText('Something broke')).toBeInTheDocument();
    });

    it('does not render retry button when onRetry is not provided', () => {
        render(<ErrorState />);
        expect(screen.queryByRole('button')).not.toBeInTheDocument();
    });

    it('renders retry button with default label when onRetry provided', () => {
        render(<ErrorState onRetry={vi.fn()} />);
        expect(screen.getByRole('button', { name: /Thử lại/i })).toBeInTheDocument();
    });

    it('renders retry button with custom label', () => {
        render(<ErrorState onRetry={vi.fn()} retryLabel="Reload Page" />);
        expect(screen.getByRole('button', { name: /Reload Page/i })).toBeInTheDocument();
    });

    it('calls onRetry when retry button clicked', () => {
        const onRetry = vi.fn();
        render(<ErrorState onRetry={onRetry} />);
        fireEvent.click(screen.getByRole('button', { name: /Thử lại/i }));
        expect(onRetry).toHaveBeenCalledOnce();
    });
});
