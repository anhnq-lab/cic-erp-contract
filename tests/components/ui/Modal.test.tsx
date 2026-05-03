import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import React from 'react';
import Modal from '../../../components/ui/Modal';

const defaultProps = {
    isOpen: true,
    onClose: vi.fn(),
    title: 'Test Modal',
    children: <p>Modal body</p>,
};

describe('Modal', () => {
    it('renders nothing when isOpen is false', () => {
        render(<Modal {...defaultProps} isOpen={false} />);
        expect(screen.queryByText('Test Modal')).not.toBeInTheDocument();
    });

    it('renders title and children when isOpen is true', () => {
        render(<Modal {...defaultProps} />);
        expect(screen.getByText('Test Modal')).toBeInTheDocument();
        expect(screen.getByText('Modal body')).toBeInTheDocument();
    });

    it('calls onClose when X button is clicked', () => {
        const onClose = vi.fn();
        render(<Modal {...defaultProps} onClose={onClose} />);
        const closeBtn = screen.getByRole('button');
        fireEvent.click(closeBtn);
        expect(onClose).toHaveBeenCalledOnce();
    });

    it('calls onClose when Escape key is pressed', () => {
        const onClose = vi.fn();
        render(<Modal {...defaultProps} onClose={onClose} />);
        fireEvent.keyDown(document, { key: 'Escape' });
        expect(onClose).toHaveBeenCalledOnce();
    });

    it('does not listen for Escape key when closed', () => {
        const onClose = vi.fn();
        render(<Modal {...defaultProps} isOpen={false} onClose={onClose} />);
        fireEvent.keyDown(document, { key: 'Escape' });
        expect(onClose).not.toHaveBeenCalled();
    });

    it('renders different sizes without error', () => {
        const sizes = ['sm', 'md', 'lg', 'xl'] as const;
        for (const size of sizes) {
            const { unmount } = render(<Modal {...defaultProps} size={size} title={`${size} modal`} />);
            expect(screen.getByText(`${size} modal`)).toBeInTheDocument();
            unmount();
        }
    });
});
