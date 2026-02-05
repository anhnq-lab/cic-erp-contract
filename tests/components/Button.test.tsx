import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import Button from '../../components/ui/Button';

describe('Button Component', () => {
    it('renders with children text', () => {
        render(<Button>Click me</Button>);
        expect(screen.getByRole('button', { name: /click me/i })).toBeInTheDocument();
    });

    it('applies primary variant styles by default', () => {
        render(<Button>Primary</Button>);
        const button = screen.getByRole('button');
        expect(button.className).toContain('bg-orange');
    });

    it('applies secondary variant styles when specified', () => {
        render(<Button variant="secondary">Secondary</Button>);
        const button = screen.getByRole('button');
        expect(button.className).toContain('bg-slate');
    });

    it('handles click events', async () => {
        const user = userEvent.setup();
        const handleClick = vi.fn();

        render(<Button onClick={handleClick}>Click</Button>);
        await user.click(screen.getByRole('button'));

        expect(handleClick).toHaveBeenCalledTimes(1);
    });

    it('disables button when disabled prop is true', () => {
        render(<Button disabled>Disabled</Button>);
        expect(screen.getByRole('button')).toBeDisabled();
    });

    it('shows loading state with spinner', () => {
        render(<Button isLoading>Loading</Button>);
        const button = screen.getByRole('button');
        expect(button).toBeDisabled();
        // Loader2 icon should be present
        expect(button.querySelector('svg')).toBeInTheDocument();
    });

    it('applies fullWidth class when specified', () => {
        render(<Button fullWidth>Full Width</Button>);
        const button = screen.getByRole('button');
        expect(button.className).toContain('w-full');
    });

    it('renders left icon when provided', () => {
        render(<Button leftIcon={<span data-testid="left-icon">→</span>}>With Icon</Button>);
        expect(screen.getByTestId('left-icon')).toBeInTheDocument();
    });
});
