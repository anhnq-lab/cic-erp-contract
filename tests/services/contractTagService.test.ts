import { describe, it, expect, vi, beforeEach } from 'vitest';
import { normalizeTag, ContractTagService } from '../../services/contractTagService';
import { dataClient } from '../../lib/dataClient';

vi.mock('../../lib/dataClient', () => ({
    dataClient: { from: vi.fn(), rpc: vi.fn() },
}));

// ─── normalizeTag (pure function) ────────────────────────────────────────────
describe('normalizeTag', () => {
    it('lowercases the tag', () => {
        expect(normalizeTag('HELLO')).toBe('hello');
    });

    it('trims leading and trailing whitespace', () => {
        expect(normalizeTag('  hello  ')).toBe('hello');
    });

    it('strips leading # symbol', () => {
        expect(normalizeTag('#mytag')).toBe('mytag');
    });

    it('strips leading # and trims whitespace', () => {
        expect(normalizeTag('# my tag ')).toBe('my_tag');
    });

    it('replaces internal spaces with underscores', () => {
        expect(normalizeTag('my cool tag')).toBe('my_cool_tag');
    });

    it('replaces multiple spaces with a single underscore', () => {
        expect(normalizeTag('a   b')).toBe('a_b');
    });

    it('preserves hyphens', () => {
        expect(normalizeTag('hợp-đồng')).toBe('hợp-đồng');
    });

    it('preserves underscores', () => {
        expect(normalizeTag('my_tag')).toBe('my_tag');
    });

    it('preserves Vietnamese characters', () => {
        expect(normalizeTag('hợp đồng')).toBe('hợp_đồng');
    });

    it('removes special characters (!, @, $, etc.)', () => {
        expect(normalizeTag('tag!@$%')).toBe('tag');
    });

    it('handles empty string', () => {
        expect(normalizeTag('')).toBe('');
    });

    it('handles string that is only # and spaces', () => {
        expect(normalizeTag('#   ')).toBe('');
    });

    it('handles digits', () => {
        expect(normalizeTag('tag123')).toBe('tag123');
    });

    it('full pipeline: # + uppercase + spaces + special chars', () => {
        expect(normalizeTag('#My Tag! 2025')).toBe('my_tag_2025');
    });
});

// ─── ContractTagService (mocked DB) ──────────────────────────────────────────
describe('ContractTagService', () => {
    beforeEach(() => { vi.clearAllMocks(); });

    describe('getTagsForContract', () => {
        it('returns tags when query succeeds', async () => {
            (dataClient.from as any) = vi.fn().mockReturnValue({
                select: vi.fn().mockReturnThis(),
                eq: vi.fn().mockReturnThis(),
                order: vi.fn().mockResolvedValue({
                    data: [{ tag: 'khẩn' }, { tag: 'vip' }],
                    error: null,
                }),
            });

            const result = await ContractTagService.getTagsForContract('u1', 'c1');
            expect(result).toEqual(['khẩn', 'vip']);
        });

        it('returns empty array on DB error', async () => {
            const consoleError = vi.spyOn(console, 'error').mockImplementation(() => { });
            (dataClient.from as any) = vi.fn().mockReturnValue({
                select: vi.fn().mockReturnThis(),
                eq: vi.fn().mockReturnThis(),
                order: vi.fn().mockResolvedValue({
                    data: null,
                    error: new Error('DB error'),
                }),
            });

            const result = await ContractTagService.getTagsForContract('u1', 'c1');
            expect(result).toEqual([]);
            consoleError.mockRestore();
        });

        it('returns empty array on exception', async () => {
            const consoleError = vi.spyOn(console, 'error').mockImplementation(() => { });
            (dataClient.from as any) = vi.fn().mockImplementation(() => {
                throw new Error('Network error');
            });

            const result = await ContractTagService.getTagsForContract('u1', 'c1');
            expect(result).toEqual([]);
            consoleError.mockRestore();
        });
    });

    describe('getAllUserTags', () => {
        it('returns deduplicated sorted tags', async () => {
            (dataClient.from as any) = vi.fn().mockReturnValue({
                select: vi.fn().mockReturnThis(),
                eq: vi.fn().mockResolvedValue({
                    data: [{ tag: 'vip' }, { tag: 'khẩn' }, { tag: 'vip' }],
                    error: null,
                }),
            });

            const result = await ContractTagService.getAllUserTags('u1');
            // Should be unique (Set deduplication)
            expect(result.filter(t => t === 'vip')).toHaveLength(1);
            expect(result).toContain('khẩn');
        });

        it('returns empty array on error', async () => {
            const consoleError = vi.spyOn(console, 'error').mockImplementation(() => { });
            (dataClient.from as any) = vi.fn().mockReturnValue({
                select: vi.fn().mockReturnThis(),
                eq: vi.fn().mockResolvedValue({ data: null, error: new Error('error') }),
            });

            const result = await ContractTagService.getAllUserTags('u1');
            expect(result).toEqual([]);
            consoleError.mockRestore();
        });
    });
});
