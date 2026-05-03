import { describe, it, expect, vi, beforeEach } from 'vitest';
import { ExecutionCostService } from '../../services/ExecutionCostService';
import { dataClient } from '../../lib/dataClient';

vi.mock('../../lib/dataClient', () => ({
    dataClient: { from: vi.fn(), rpc: vi.fn() },
}));

describe('ExecutionCostService', () => {
    beforeEach(() => { vi.clearAllMocks(); });

    describe('getAll', () => {
        it('returns all execution cost types sorted by name', async () => {
            const mockData = [{ id: 'ec1', name: 'Công tác phí', created_at: '2025-01-01' }];
            (dataClient.from as any) = vi.fn().mockReturnValue({
                select: vi.fn().mockReturnThis(),
                order: vi.fn().mockResolvedValue({ data: mockData, error: null }),
            });

            const result = await ExecutionCostService.getAll();
            expect(result).toEqual(mockData);
        });

        it('returns empty array when data is null', async () => {
            (dataClient.from as any) = vi.fn().mockReturnValue({
                select: vi.fn().mockReturnThis(),
                order: vi.fn().mockResolvedValue({ data: null, error: null }),
            });

            const result = await ExecutionCostService.getAll();
            expect(result).toEqual([]);
        });

        it('throws when DB error occurs', async () => {
            const err = new Error('DB error');
            (dataClient.from as any) = vi.fn().mockReturnValue({
                select: vi.fn().mockReturnThis(),
                order: vi.fn().mockResolvedValue({ data: null, error: err }),
            });

            await expect(ExecutionCostService.getAll()).rejects.toThrow('DB error');
        });
    });

    describe('findOrCreate', () => {
        it('returns null for empty name', async () => {
            const result = await ExecutionCostService.findOrCreate('');
            expect(result).toBeNull();
        });

        it('returns null for whitespace-only name', async () => {
            const result = await ExecutionCostService.findOrCreate('   ');
            expect(result).toBeNull();
        });

        it('returns existing record when found', async () => {
            const existing = { id: 'ec1', name: 'Công tác phí', created_at: '2025-01-01' };
            (dataClient.from as any) = vi.fn().mockReturnValue({
                select: vi.fn().mockReturnThis(),
                ilike: vi.fn().mockReturnThis(),
                maybeSingle: vi.fn().mockResolvedValue({ data: existing, error: null }),
            });

            const result = await ExecutionCostService.findOrCreate('Công tác phí');
            expect(result).toEqual(existing);
        });

        it('creates new record when not found', async () => {
            const newRecord = { id: 'ec2', name: 'Bảo hiểm', created_at: '2025-01-01' };
            let callCount = 0;
            (dataClient.from as any) = vi.fn().mockImplementation(() => {
                callCount++;
                if (callCount === 1) {
                    // First call: check existing → not found
                    return {
                        select: vi.fn().mockReturnThis(),
                        ilike: vi.fn().mockReturnThis(),
                        maybeSingle: vi.fn().mockResolvedValue({ data: null, error: null }),
                    };
                }
                // Second call: insert → success
                return {
                    insert: vi.fn().mockReturnThis(),
                    select: vi.fn().mockReturnThis(),
                    single: vi.fn().mockResolvedValue({ data: newRecord, error: null }),
                };
            });

            const result = await ExecutionCostService.findOrCreate('Bảo hiểm');
            expect(result).toEqual(newRecord);
        });

        it('throws on fetch error', async () => {
            const err = new Error('Fetch error');
            (dataClient.from as any) = vi.fn().mockReturnValue({
                select: vi.fn().mockReturnThis(),
                ilike: vi.fn().mockReturnThis(),
                maybeSingle: vi.fn().mockResolvedValue({ data: null, error: err }),
            });

            await expect(ExecutionCostService.findOrCreate('Test')).rejects.toThrow('Fetch error');
        });

        it('throws on insert error', async () => {
            const insertErr = new Error('Insert error');
            let callCount = 0;
            (dataClient.from as any) = vi.fn().mockImplementation(() => {
                callCount++;
                if (callCount === 1) {
                    return {
                        select: vi.fn().mockReturnThis(),
                        ilike: vi.fn().mockReturnThis(),
                        maybeSingle: vi.fn().mockResolvedValue({ data: null, error: null }),
                    };
                }
                return {
                    insert: vi.fn().mockReturnThis(),
                    select: vi.fn().mockReturnThis(),
                    single: vi.fn().mockResolvedValue({ data: null, error: insertErr }),
                };
            });

            await expect(ExecutionCostService.findOrCreate('New')).rejects.toThrow('Insert error');
        });
    });

    describe('bulkAdd', () => {
        it('does nothing for empty array', async () => {
            const fromSpy = vi.fn();
            (dataClient.from as any) = fromSpy;

            await ExecutionCostService.bulkAdd([]);
            expect(fromSpy).not.toHaveBeenCalled();
        });

        it('does nothing for array of empty strings', async () => {
            const fromSpy = vi.fn();
            (dataClient.from as any) = fromSpy;

            await ExecutionCostService.bulkAdd(['', '  ', '']);
            expect(fromSpy).not.toHaveBeenCalled();
        });

        it('deduplicates names and trims whitespace before inserting', async () => {
            let capturedPayload: any[] = [];
            (dataClient.from as any) = vi.fn().mockReturnValue({
                upsert: vi.fn().mockImplementation((payload: any[]) => {
                    capturedPayload = payload;
                    return Promise.resolve({ error: null });
                }),
            });

            await ExecutionCostService.bulkAdd(['  Alpha  ', 'Beta', 'Alpha', 'Beta', '']);
            // Should deduplicate: Alpha, Beta
            expect(capturedPayload).toHaveLength(2);
            expect(capturedPayload.map((p: any) => p.name)).toEqual(
                expect.arrayContaining(['Alpha', 'Beta'])
            );
        });

        it('does not throw on upsert error (swallows it)', async () => {
            const consoleError = vi.spyOn(console, 'error').mockImplementation(() => { });
            (dataClient.from as any) = vi.fn().mockReturnValue({
                upsert: vi.fn().mockResolvedValue({ error: new Error('Conflict') }),
            });

            // Should not throw
            await expect(ExecutionCostService.bulkAdd(['Test'])).resolves.toBeUndefined();
            consoleError.mockRestore();
        });
    });
});
