import { describe, it, expect, vi, beforeEach } from 'vitest';
import { z } from 'zod';
import {
    validateToolInput,
    wrapWithValidation,
    SearchContractsInputSchema,
    GetContractDetailInputSchema,
    SearchCustomersInputSchema,
    GetCustomer360InputSchema,
    SearchEmployeesInputSchema,
    GetDashboardKpiInputSchema,
    SearchPaymentsInputSchema,
    CreateTaskInputSchema,
    DateStringSchema,
    YearSchema,
    ContractStatusSchema,
} from '../../../services/ai/openclaw/toolValidation';
import type { UserContext } from '../../../services/ai/openclaw/types';

const mockCtx: UserContext = {
    userId: 'user-1',
    fullName: 'Test User',
    role: 'NVKD',
    unitId: 'unit-1',
    unitName: 'Test Unit',
};

// ── validateToolInput ─────────────────────────────────────────────────────────

describe('validateToolInput', () => {
    const SimpleSchema = z.object({ name: z.string().min(1) });

    it('returns success=true with data for valid input', () => {
        const result = validateToolInput(SimpleSchema, { name: 'Alice' });
        expect(result.success).toBe(true);
        if (result.success) expect(result.data.name).toBe('Alice');
    });

    it('returns success=false with error message for invalid input', () => {
        const result = validateToolInput(SimpleSchema, { name: '' });
        expect(result.success).toBe(false);
        if (!result.success) expect(result.error).toContain('Tool input không hợp lệ');
    });

    it('includes field path in error message', () => {
        const result = validateToolInput(SimpleSchema, { name: 123 });
        expect(result.success).toBe(false);
        if (!result.success) expect(result.error).toContain('name');
    });

    it('handles missing required field', () => {
        const result = validateToolInput(SimpleSchema, {});
        expect(result.success).toBe(false);
    });
});

// ── wrapWithValidation ────────────────────────────────────────────────────────

describe('wrapWithValidation', () => {
    const Schema = z.object({ id: z.string().min(1) });
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    let handler: (args: any, context: UserContext) => Promise<unknown>;
    beforeEach(() => { handler = vi.fn().mockResolvedValue({ ok: true }); });

    it('calls handler with parsed args when input is valid', async () => {
        const wrapped = wrapWithValidation(Schema, handler);
        const result = await wrapped({ id: 'abc' }, mockCtx);
        expect(vi.mocked(handler)).toHaveBeenCalledOnce();
        expect(result).toEqual({ ok: true });
    });

    it('returns error string without calling handler when input invalid', async () => {
        const wrapped = wrapWithValidation(Schema, handler);
        const result = await wrapped({ id: '' }, mockCtx);
        expect(typeof result).toBe('string');
        expect(result as string).toContain('Lỗi:');
        expect(vi.mocked(handler)).not.toHaveBeenCalled();
    });

    it('propagates handler errors when input is valid', async () => {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const failingHandler: (args: any, context: UserContext) => Promise<unknown> =
            vi.fn().mockRejectedValue(new Error('DB error'));
        const wrapped = wrapWithValidation(Schema, failingHandler);
        await expect(wrapped({ id: 'abc' }, mockCtx)).rejects.toThrow('DB error');
    });
});

// ── Domain-specific schemas ───────────────────────────────────────────────────

describe('SearchContractsInputSchema', () => {
    it('accepts all valid fields', () => {
        const r = SearchContractsInputSchema.safeParse({
            search: 'ABC', status: 'Processing', unitId: 'u1',
            year: '2026', dateFrom: '2026-01-01', dateTo: '2026-12-31',
            page: 1, limit: 10,
        });
        expect(r.success).toBe(true);
    });

    it('accepts empty object (all fields optional)', () => {
        expect(SearchContractsInputSchema.safeParse({}).success).toBe(true);
    });

    it('rejects invalid status', () => {
        expect(SearchContractsInputSchema.safeParse({ status: 'Invalid' }).success).toBe(false);
    });

    it('rejects invalid dateFrom format', () => {
        expect(SearchContractsInputSchema.safeParse({ dateFrom: '01/01/2026' }).success).toBe(false);
    });

    it('rejects limit over 50', () => {
        expect(SearchContractsInputSchema.safeParse({ limit: 100 }).success).toBe(false);
    });
});

describe('GetContractDetailInputSchema', () => {
    it('accepts valid contractId', () => {
        expect(GetContractDetailInputSchema.safeParse({ contractId: 'abc123' }).success).toBe(true);
    });

    it('rejects empty contractId', () => {
        expect(GetContractDetailInputSchema.safeParse({ contractId: '' }).success).toBe(false);
    });

    it('rejects missing contractId', () => {
        expect(GetContractDetailInputSchema.safeParse({}).success).toBe(false);
    });
});

describe('SearchCustomersInputSchema', () => {
    it('accepts valid type values', () => {
        for (const type of ['Customer', 'Supplier', 'Both', 'all']) {
            expect(SearchCustomersInputSchema.safeParse({ type }).success).toBe(true);
        }
    });

    it('rejects invalid type', () => {
        expect(SearchCustomersInputSchema.safeParse({ type: 'Unknown' }).success).toBe(false);
    });
});

describe('GetCustomer360InputSchema', () => {
    it('accepts valid customerId', () => {
        expect(GetCustomer360InputSchema.safeParse({ customerId: 'cust-1' }).success).toBe(true);
    });

    it('rejects empty customerId', () => {
        expect(GetCustomer360InputSchema.safeParse({ customerId: '' }).success).toBe(false);
    });
});

describe('GetDashboardKpiInputSchema', () => {
    it('accepts valid year as string', () => {
        expect(GetDashboardKpiInputSchema.safeParse({ year: '2026' }).success).toBe(true);
    });

    it('accepts valid year as number', () => {
        expect(GetDashboardKpiInputSchema.safeParse({ year: 2026 }).success).toBe(true);
    });

    it('accepts valid quarter', () => {
        expect(GetDashboardKpiInputSchema.safeParse({ quarter: 3 }).success).toBe(true);
    });

    it('rejects quarter > 4', () => {
        expect(GetDashboardKpiInputSchema.safeParse({ quarter: 5 }).success).toBe(false);
    });

    it('rejects quarter < 1', () => {
        expect(GetDashboardKpiInputSchema.safeParse({ quarter: 0 }).success).toBe(false);
    });
});

describe('CreateTaskInputSchema', () => {
    it('accepts valid task input', () => {
        const r = CreateTaskInputSchema.safeParse({
            title: 'Kiểm tra hợp đồng',
            description: 'Mô tả chi tiết',
            priority: 'high',
            dueDate: '2026-06-01',
        });
        expect(r.success).toBe(true);
    });

    it('rejects empty title', () => {
        expect(CreateTaskInputSchema.safeParse({ title: '' }).success).toBe(false);
    });

    it('rejects title over 500 chars', () => {
        expect(CreateTaskInputSchema.safeParse({ title: 'a'.repeat(501) }).success).toBe(false);
    });

    it('rejects invalid priority', () => {
        expect(CreateTaskInputSchema.safeParse({ title: 'Task', priority: 'critical' }).success).toBe(false);
    });
});

// ── Shared primitive schemas ──────────────────────────────────────────────────

describe('DateStringSchema', () => {
    it('accepts valid YYYY-MM-DD', () => {
        expect(DateStringSchema.safeParse('2026-01-15').success).toBe(true);
    });

    it('accepts undefined (optional)', () => {
        expect(DateStringSchema.safeParse(undefined).success).toBe(true);
    });

    it('rejects DD/MM/YYYY format', () => {
        expect(DateStringSchema.safeParse('15/01/2026').success).toBe(false);
    });
});

describe('ContractStatusSchema', () => {
    it('accepts all valid statuses', () => {
        for (const s of ['Processing', 'Completed', 'Suspended', 'Cancelled', 'All']) {
            expect(ContractStatusSchema.safeParse(s).success).toBe(true);
        }
    });

    it('accepts undefined', () => {
        expect(ContractStatusSchema.safeParse(undefined).success).toBe(true);
    });

    it('rejects unknown status', () => {
        expect(ContractStatusSchema.safeParse('Draft').success).toBe(false);
    });
});
