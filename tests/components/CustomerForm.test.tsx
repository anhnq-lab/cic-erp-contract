import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import React from 'react';

// ── Mock heavy dependencies before importing the component ───────────────────

vi.mock('../../services/customerService', () => ({
    CustomerService: {
        checkDuplicate: vi.fn().mockResolvedValue([]),
    },
}));

vi.mock('../../services/taxLookupService', () => ({
    TaxLookupService: {
        lookup: vi.fn().mockResolvedValue(null),
    },
}));

vi.mock('sonner', () => ({
    toast: {
        error: vi.fn(),
        success: vi.fn(),
    },
}));

vi.mock('../../components/ui/AICustomerFill', () => ({
    default: () => <div data-testid="ai-fill-mock">AI Fill Mock</div>,
}));

vi.mock('../../constants', () => ({
    INDUSTRIES: ['Xây dựng', 'Công nghệ', 'Thương mại'],
}));

// Import after mocks
import CustomerForm from '../../components/CustomerForm';
import { CustomerService } from '../../services/customerService';
import { toast } from 'sonner';

// ── Helper types & factories ─────────────────────────────────────────────────

const buildProps = (overrides: Partial<React.ComponentProps<typeof CustomerForm>> = {}) => ({
    isOpen: true,
    onClose: vi.fn(),
    onSave: vi.fn().mockResolvedValue(undefined),
    ...overrides,
});

beforeEach(() => {
    vi.clearAllMocks();
});

// ── Tests ────────────────────────────────────────────────────────────────────

describe('CustomerForm', () => {
    describe('rendering', () => {
        it('renders nothing when isOpen is false', () => {
            render(<CustomerForm {...buildProps({ isOpen: false })} />);
            expect(screen.queryByText('Thêm Khách hàng mới')).not.toBeInTheDocument();
        });

        it('shows create title for new customer', () => {
            render(<CustomerForm {...buildProps()} />);
            expect(screen.getByText('Thêm Khách hàng mới')).toBeInTheDocument();
        });

        it('shows "Thêm Nhà cung cấp mới" when defaultType is Supplier', () => {
            render(<CustomerForm {...buildProps({ defaultType: 'Supplier' })} />);
            expect(screen.getByText('Thêm Nhà cung cấp mới')).toBeInTheDocument();
        });

        it('shows edit title when customer prop is provided', () => {
            const customer = {
                id: 'c1', name: 'Test Co', shortName: 'TC',
                taxCode: '0123456789', type: 'Customer' as const,
                industry: [], contactPerson: '', phone: '', email: '',
                address: '', website: '', notes: '', rating: 'Standard' as const,
                source: '', paymentTerms: '', creditLimit: 0,
            };
            render(<CustomerForm {...buildProps({ customer })} />);
            expect(screen.getByText('Chỉnh sửa Đối tác')).toBeInTheDocument();
        });

        it('shows AI fill button only for new customer', () => {
            render(<CustomerForm {...buildProps()} />);
            expect(screen.getByTestId('ai-fill-mock')).toBeInTheDocument();
        });

        it('hides AI fill button when editing existing customer', () => {
            const customer = {
                id: 'c1', name: 'Test Co', shortName: 'TC',
                taxCode: '0123456789', type: 'Customer' as const,
                industry: [], contactPerson: '', phone: '', email: '',
                address: '', website: '', notes: '', rating: 'Standard' as const,
                source: '', paymentTerms: '', creditLimit: 0,
            };
            render(<CustomerForm {...buildProps({ customer })} />);
            expect(screen.queryByTestId('ai-fill-mock')).not.toBeInTheDocument();
        });
    });

    describe('validation', () => {
        it('shows error toast when taxCode missing for Customer type', async () => {
            render(<CustomerForm {...buildProps()} />);

            // fireEvent.submit bypasses native required-field validation
            // so our React handler runs and checks taxCode
            fireEvent.submit(document.querySelector('form')!);

            await waitFor(() => {
                expect(toast.error).toHaveBeenCalledWith(
                    expect.stringContaining('Mã số Doanh nghiệp là bắt buộc')
                );
            });
        });

        it('does not require taxCode for Supplier-only type', async () => {
            render(<CustomerForm {...buildProps({ defaultType: 'Supplier' })} />);

            fireEvent.submit(document.querySelector('form')!);

            // Supplier type skips the taxCode check; toast.error should not fire with that message
            await waitFor(() => {
                expect(toast.error).not.toHaveBeenCalledWith(
                    expect.stringContaining('Mã số Doanh nghiệp là bắt buộc')
                );
            });
        });
    });

    describe('submit behavior', () => {
        it('calls onSave and onClose when no duplicates', async () => {
            const user = userEvent.setup();
            const onSave = vi.fn().mockResolvedValue(undefined);
            const onClose = vi.fn();
            (CustomerService.checkDuplicate as any).mockResolvedValue([]);

            render(<CustomerForm {...buildProps({ onSave, onClose })} />);

            // Fill taxCode so our React validation passes
            const taxCodeInput = screen.getByPlaceholderText('VD: 0101234567');
            await user.type(taxCodeInput, '0123456789');

            // Use fireEvent.submit to bypass native required validation
            fireEvent.submit(document.querySelector('form')!);

            await waitFor(() => {
                expect(onSave).toHaveBeenCalledOnce();
                expect(onClose).toHaveBeenCalledOnce();
            });
        });

        it('shows duplicate warning and does not call onSave when duplicates exist', async () => {
            const user = userEvent.setup();
            const onSave = vi.fn();
            (CustomerService.checkDuplicate as any).mockResolvedValue([
                { id: 'dup1', name: 'Existing Co', reason: 'Tax code match' }
            ]);

            render(<CustomerForm {...buildProps({ onSave })} />);

            const taxCodeInput = screen.getByPlaceholderText('VD: 0101234567');
            await user.type(taxCodeInput, '0123456789');

            fireEvent.submit(document.querySelector('form')!);

            await waitFor(() => {
                expect(toast.error).toHaveBeenCalledWith(
                    expect.stringContaining('Phát hiện')
                );
                expect(onSave).not.toHaveBeenCalled();
            });
        });
    });

    describe('edit mode', () => {
        it('populates form fields from customer prop', () => {
            const customer = {
                id: 'c1', name: 'Công ty ABC', shortName: 'ABC',
                taxCode: '9876543210', type: 'Customer' as const,
                industry: ['Xây dựng'], contactPerson: 'Nguyễn Văn A',
                phone: '0901234567', email: 'abc@example.com',
                address: 'Hà Nội', website: '', notes: '', rating: 'VIP' as const,
                source: '', paymentTerms: '', creditLimit: 5000,
            };
            render(<CustomerForm {...buildProps({ customer })} />);

            expect(screen.getByDisplayValue('Công ty ABC')).toBeInTheDocument();
            expect(screen.getByDisplayValue('ABC')).toBeInTheDocument();
            expect(screen.getByDisplayValue('9876543210')).toBeInTheDocument();
        });
    });
});
