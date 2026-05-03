import { describe, it, expect, vi, beforeEach } from 'vitest';
import { AuditLogService } from '../../services/auditLogService';
import { dataClient } from '../../lib/dataClient';

vi.mock('../../lib/dataClient', () => ({
    dataClient: { from: vi.fn(), rpc: vi.fn() },
}));

describe('AuditLogService', () => {
    beforeEach(() => {
        vi.clearAllMocks();
    });

    // ──────────────────────────────────────────────
    // formatAction (pure function — no mocking needed)
    // ──────────────────────────────────────────────
    describe('formatAction', () => {
        describe('INSERT action', () => {
            it('includes contract title when newData has title', () => {
                const result = AuditLogService.formatAction('INSERT', undefined, { title: 'Hợp đồng ABC' });
                expect(result).toBe('Tạo mới hợp đồng "Hợp đồng ABC"');
            });

            it('uses generic text when no title', () => {
                const result = AuditLogService.formatAction('INSERT', undefined, {});
                expect(result).toBe('Tạo mới hợp đồng');
            });

            it('uses generic text when newData is undefined', () => {
                const result = AuditLogService.formatAction('INSERT');
                expect(result).toBe('Tạo mới hợp đồng');
            });
        });

        describe('DELETE action', () => {
            it('includes contract title when oldData has title', () => {
                const result = AuditLogService.formatAction('DELETE', { title: 'Hợp đồng XYZ' });
                expect(result).toBe('Xóa hợp đồng "Hợp đồng XYZ"');
            });

            it('uses generic text when no title', () => {
                const result = AuditLogService.formatAction('DELETE', {});
                expect(result).toBe('Xóa hợp đồng');
            });
        });

        describe('UPDATE action — workflow transitions', () => {
            it('detects legal approval', () => {
                const result = AuditLogService.formatAction('UPDATE',
                    { legal_approved: false },
                    { legal_approved: true }
                );
                expect(result).toBe('✅ Pháp lý đã duyệt');
            });

            it('detects finance approval', () => {
                const result = AuditLogService.formatAction('UPDATE',
                    { finance_approved: null },
                    { finance_approved: true }
                );
                expect(result).toBe('✅ Tài chính đã duyệt');
            });

            it('detects submit for review (Draft → Pending_Review)', () => {
                const result = AuditLogService.formatAction('UPDATE',
                    { status: 'Draft' },
                    { status: 'Pending_Review' }
                );
                expect(result).toBe('📤 Gửi duyệt (Pháp lý + Tài chính song song)');
            });

            it('detects both approved (Pending_Review → Both_Approved)', () => {
                const result = AuditLogService.formatAction('UPDATE',
                    { status: 'Pending_Review' },
                    { status: 'Both_Approved' }
                );
                expect(result).toBe('🎉 Cả hai bên đã duyệt xong');
            });

            it('formats status change with Vietnamese labels', () => {
                const result = AuditLogService.formatAction('UPDATE',
                    { status: 'Processing' },
                    { status: 'Completed' }
                );
                expect(result).toContain('Đang thực hiện');
                expect(result).toContain('Hoàn thành');
            });

            it('formats status change for legacy statuses', () => {
                const result = AuditLogService.formatAction('UPDATE',
                    { status: 'Active' },
                    { status: 'Suspended' }
                );
                expect(result).toContain('Đang thực hiện');
                expect(result).toContain('Tạm dừng');
            });

            it('formats stage change with Vietnamese labels', () => {
                const result = AuditLogService.formatAction('UPDATE',
                    { status: 'Processing', stage: 'Signed' },
                    { status: 'Processing', stage: 'Advanced' }
                );
                expect(result).toContain('Đã ký');
                expect(result).toContain('Đã tạm ứng');
            });

            it('formats review_status change', () => {
                const result = AuditLogService.formatAction('UPDATE',
                    { review_status: 'PENDING_LEGAL' },
                    { review_status: 'LEGAL_APPROVED' }
                );
                expect(result).toContain('Pháp lý đã duyệt');
            });

            it('formats draft URL added', () => {
                const result = AuditLogService.formatAction('UPDATE',
                    { draft_url: null },
                    { draft_url: 'https://docs.google.com/...' }
                );
                expect(result).toBe('Gửi dự thảo cho Pháp lý xem xét');
            });

            it('returns generic text when no specific action matches', () => {
                const result = AuditLogService.formatAction('UPDATE',
                    { notes: 'old note' },
                    { notes: 'new note' }
                );
                // 'notes' is in fieldLabels → shows the changed field
                expect(result).toContain('Ghi chú');
            });

            it('handles UPDATE with no oldData/newData', () => {
                const result = AuditLogService.formatAction('UPDATE');
                expect(result).toBe('Cập nhật thông tin');
            });

            it('ignores id, created_at, updated_at, created_by fields', () => {
                const result = AuditLogService.formatAction('UPDATE',
                    { id: 'old', created_at: '2025-01-01', updated_at: '2025-01-01', created_by: 'u1' },
                    { id: 'new', created_at: '2025-01-02', updated_at: '2025-01-02', created_by: 'u2' }
                );
                expect(result).toBe('Cập nhật thông tin');
            });

            it('formats number values as currency when key contains "value"', () => {
                const result = AuditLogService.formatAction('UPDATE',
                    { value: 1000000000 },
                    { value: 2000000000 }
                );
                expect(result).toContain('Giá trị HĐ');
            });

            it('formats boolean values', () => {
                const result = AuditLogService.formatAction('UPDATE',
                    { legal_approved: false, finance_approved: false },
                    { legal_approved: false, finance_approved: false }
                );
                // No changes, so generic message
                expect(result).toBe('Cập nhật thông tin');
            });

            it('truncates long string values', () => {
                const longString = 'A'.repeat(30);
                const result = AuditLogService.formatAction('UPDATE',
                    { title: 'short' },
                    { title: longString }
                );
                // Long string gets truncated at 25 chars + '...'
                expect(result).toContain('...');
            });

            it('formats ISO date strings as DD/MM/YYYY', () => {
                const result = AuditLogService.formatAction('UPDATE',
                    { signed_date: '2025-01-15' },
                    { signed_date: '2025-06-20' }
                );
                expect(result).toContain('20/06/2025');
            });
        });

        describe('UPDATE action — formats null/empty values', () => {
            it('shows "Trống" for null values', () => {
                const result = AuditLogService.formatAction('UPDATE',
                    { title: 'Old Title' },
                    { title: null }
                );
                expect(result).toContain('Trống');
            });

            it('shows "Trống" for empty string values', () => {
                const result = AuditLogService.formatAction('UPDATE',
                    { title: 'Old Title' },
                    { title: '' }
                );
                expect(result).toContain('Trống');
            });
        });

        describe('special action strings', () => {
            it('returns correct text for APPROVE_LEGAL', () => {
                expect(AuditLogService.formatAction('APPROVE_LEGAL')).toBe('✅ Pháp lý phê duyệt nội dung');
            });

            it('returns correct text for APPROVE_FINANCE', () => {
                expect(AuditLogService.formatAction('APPROVE_FINANCE')).toBe('✅ Tài chính phê duyệt');
            });

            it('returns correct text for REJECT', () => {
                expect(AuditLogService.formatAction('REJECT')).toBe('❌ Từ chối phê duyệt');
            });

            it('returns correct text for SUBMIT_LEGAL', () => {
                expect(AuditLogService.formatAction('SUBMIT_LEGAL')).toBe('📤 Gửi duyệt Pháp lý');
            });

            it('returns raw action string for unknown action', () => {
                expect(AuditLogService.formatAction('CUSTOM_ACTION')).toBe('CUSTOM_ACTION');
            });
        });
    });

    // ──────────────────────────────────────────────
    // formatDateTime (pure function)
    // ──────────────────────────────────────────────
    describe('formatDateTime', () => {
        it('returns date and time parts', () => {
            const result = AuditLogService.formatDateTime('2025-06-15T14:30:00.000Z');
            expect(result).toHaveProperty('date');
            expect(result).toHaveProperty('time');
        });

        it('date part is a non-empty string', () => {
            const result = AuditLogService.formatDateTime('2025-01-01T00:00:00.000Z');
            expect(typeof result.date).toBe('string');
            expect(result.date.length).toBeGreaterThan(0);
        });

        it('time part contains colon separator', () => {
            const result = AuditLogService.formatDateTime('2025-06-15T10:30:00.000Z');
            expect(result.time).toContain(':');
        });
    });

    // ──────────────────────────────────────────────
    // getByRecordId (mocked DB)
    // ──────────────────────────────────────────────
    describe('getByRecordId', () => {
        function setupFromChain(chain: any) {
            (dataClient.from as any) = vi.fn().mockReturnValue(chain);
        }

        it('returns empty array when error occurs', async () => {
            const consoleError = vi.spyOn(console, 'error').mockImplementation(() => { });
            const chain: any = {
                select: vi.fn().mockReturnThis(),
                eq: vi.fn().mockReturnThis(),
                order: vi.fn().mockReturnThis(),
                limit: vi.fn().mockResolvedValue({ data: null, error: new Error('DB error') }),
            };
            setupFromChain(chain);

            const result = await AuditLogService.getByRecordId('contracts', 'c1');
            expect(result).toEqual([]);
            consoleError.mockRestore();
        });

        it('returns empty array when data is empty', async () => {
            const chain: any = {
                select: vi.fn().mockReturnThis(),
                eq: vi.fn().mockReturnThis(),
                order: vi.fn().mockReturnThis(),
                limit: vi.fn().mockResolvedValue({ data: [], error: null }),
            };
            setupFromChain(chain);

            const result = await AuditLogService.getByRecordId('contracts', 'c1');
            expect(result).toEqual([]);
        });

        it('resolves user_name to "Hệ thống" when user_id is null', async () => {
            const mockLog = {
                id: 'log1',
                user_id: null,
                table_name: 'contracts',
                record_id: 'c1',
                action: 'INSERT',
                old_data: null,
                new_data: { title: 'Test' },
                comment: null,
                created_at: '2025-01-01T00:00:00Z',
            };

            const chain: any = {
                select: vi.fn().mockReturnThis(),
                eq: vi.fn().mockReturnThis(),
                order: vi.fn().mockReturnThis(),
                limit: vi.fn().mockResolvedValue({ data: [mockLog], error: null }),
            };
            setupFromChain(chain);

            const result = await AuditLogService.getByRecordId('contracts', 'c1');
            expect(result[0].user_name).toBe('Hệ thống');
        });

        it('resolves user_name from profiles for known user_id', async () => {
            const mockLog = {
                id: 'log2',
                user_id: 'u1',
                table_name: 'contracts',
                record_id: 'c1',
                action: 'UPDATE',
                old_data: {},
                new_data: {},
                comment: null,
                created_at: '2025-01-01T00:00:00Z',
            };

            let callCount = 0;
            (dataClient.from as any) = vi.fn().mockImplementation((_table: string) => {
                callCount++;
                if (callCount === 1) {
                    // First call: audit_logs query
                    return {
                        select: vi.fn().mockReturnThis(),
                        eq: vi.fn().mockReturnThis(),
                        order: vi.fn().mockReturnThis(),
                        limit: vi.fn().mockResolvedValue({ data: [mockLog], error: null }),
                    };
                }
                // Second call: profiles query
                return {
                    select: vi.fn().mockReturnThis(),
                    in: vi.fn().mockResolvedValue({
                        data: [{ id: 'u1', full_name: 'Nguyễn Văn A' }],
                    }),
                };
            });

            const result = await AuditLogService.getByRecordId('contracts', 'c1');
            expect(result[0].user_name).toBe('Nguyễn Văn A');
        });
    });

    // ──────────────────────────────────────────────
    // create (mocked DB)
    // ──────────────────────────────────────────────
    describe('create', () => {
        it('returns null when DB error occurs', async () => {
            const consoleError = vi.spyOn(console, 'error').mockImplementation(() => { });
            (dataClient.from as any) = vi.fn().mockReturnValue({
                insert: vi.fn().mockReturnThis(),
                select: vi.fn().mockReturnThis(),
                single: vi.fn().mockResolvedValue({ data: null, error: new Error('Insert error') }),
            });

            const result = await AuditLogService.create({
                user_id: 'u1',
                table_name: 'contracts',
                record_id: 'c1',
                action: 'UPDATE',
                old_data: null,
                new_data: {},
                comment: null,
            });

            expect(result).toBeNull();
            consoleError.mockRestore();
        });

        it('returns created log when successful', async () => {
            const mockLog = {
                id: 'log1',
                user_id: 'u1',
                table_name: 'contracts',
                record_id: 'c1',
                action: 'UPDATE',
                old_data: null,
                new_data: {},
                comment: null,
                created_at: '2025-01-01T00:00:00Z',
            };

            (dataClient.from as any) = vi.fn().mockReturnValue({
                insert: vi.fn().mockReturnThis(),
                select: vi.fn().mockReturnThis(),
                single: vi.fn().mockResolvedValue({ data: mockLog, error: null }),
            });

            const result = await AuditLogService.create({
                user_id: 'u1',
                table_name: 'contracts',
                record_id: 'c1',
                action: 'UPDATE',
                old_data: null,
                new_data: {},
                comment: null,
            });

            expect(result).toEqual(mockLog);
        });
    });
});
