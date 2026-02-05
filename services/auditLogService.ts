import { dataClient as supabase } from '../lib/dataClient';

export interface AuditLog {
    id: string;
    user_id: string | null;
    table_name: string;
    record_id: string;
    action: string;
    old_data: any | null;
    new_data: any | null;
    comment: string | null;
    created_at: string;
    // Joined fields
    user_name?: string;
}

/**
 * Service để quản lý Audit Logs - lịch sử tác động
 */
export const AuditLogService = {
    /**
     * Lấy danh sách audit logs cho một record cụ thể
     * Include thông tin người thực hiện từ profiles
     */
    async getByRecordId(tableName: string, recordId: string): Promise<AuditLog[]> {
        try {
            console.log('[AuditLogService] Fetching logs for:', tableName, recordId);

            // Query audit_logs only (without profile join to avoid FK issues)
            const { data, error } = await supabase
                .from('audit_logs')
                .select('*')
                .eq('table_name', tableName)
                .eq('record_id', recordId)
                .order('created_at', { ascending: false })
                .limit(20);

            console.log('[AuditLogService] Query result:', { data, error });

            if (error) {
                console.error('Error fetching audit logs:', error);
                return [];
            }

            // Map data with default user_name
            return (data || []).map((log: any) => ({
                ...log,
                user_name: 'Hệ thống' // Will enhance later with user lookup
            }));
        } catch (err) {
            console.error('AuditLogService.getByRecordId error:', err);
            return [];
        }
    },

    /**
     * Tạo audit log entry mới
     * Thường được gọi từ các service khác khi có action xảy ra
     */
    async create(log: Omit<AuditLog, 'id' | 'created_at' | 'user_name'>): Promise<AuditLog | null> {
        try {
            console.log('[AuditLogService] Creating audit log:', log);

            const { data, error } = await supabase
                .from('audit_logs')
                .insert(log)
                .select()
                .single();

            if (error) {
                console.error('[AuditLogService] Error creating audit log:', error);
                console.error('[AuditLogService] RLS or permission issue? Check audit_logs policies.');
                return null;
            }

            console.log('[AuditLogService] Successfully created audit log:', data?.id);
            return data;
        } catch (err) {
            console.error('[AuditLogService] Exception in create:', err);
            return null;
        }
    },

    /**
     * Format action thành text tiếng Việt thân thiện
     */
    formatAction(action: string, oldData?: any, newData?: any): string {
        // Status translation map - Vietnamese
        const statusLabels: Record<string, string> = {
            // Contract workflow statuses
            'Active': 'Đang hiệu lực',
            'Pending': 'Chờ xử lý',
            'Reviewing': 'Đang xem xét',
            'Expired': 'Hết hạn',
            'Draft': 'Nháp',
            'Liquidated': 'Đã thanh lý',
            'Completed': 'Hoàn thành',
            'Terminated': 'Đã chấm dứt',
            // Parallel approval workflow
            'Pending_Review': 'Chờ Pháp lý + Tài chính duyệt',
            'Both_Approved': 'Pháp lý + Tài chính đã duyệt',
            // Legacy sequential workflow
            'Pending_Legal': 'Chờ Pháp lý duyệt',
            'Pending_Finance': 'Chờ Tài chính duyệt',
            'Finance_Approved': 'Tài chính đã duyệt',
            'Pending_Sign': 'Chờ ký hợp đồng',
            'Pending_Unit': 'Chờ Đơn vị duyệt',
            'Pending_Board': 'Chờ Ban Lãnh đạo duyệt',
            'Approved': 'Đã phê duyệt',
            'Rejected': 'Từ chối'
        };

        // Stage translation map - Vietnamese
        const stageLabels: Record<string, string> = {
            'Signed': 'Đã ký',
            'Advanced': 'Đã tạm ứng',
            'Guaranteed': 'Đã bảo lãnh',
            'InputOrdered': 'Đã đặt hàng đầu vào',
            'Implementation': 'Đang triển khai',
            'Completed': 'Hoàn thành',
            'Invoiced': 'Đã xuất hóa đơn'
        };

        const translateStatus = (status: string) => statusLabels[status] || status;
        const translateStage = (stage: string) => stageLabels[stage] || stage;

        switch (action) {
            case 'INSERT':
                return 'Tạo mới hợp đồng';
            case 'UPDATE':
                // Check specific field changes
                if (oldData && newData) {
                    // PRIORITY: Check for parallel approval actions FIRST
                    // Legal approval: legal_approved changed from false/null to true
                    if (!oldData.legal_approved && newData.legal_approved === true) {
                        return '✅ Pháp lý đã duyệt';
                    }
                    // Finance approval: finance_approved changed from false/null to true
                    if (!oldData.finance_approved && newData.finance_approved === true) {
                        return '✅ Tài chính đã duyệt';
                    }
                    // Submit for review: Draft -> Pending_Review with draft_url
                    if (oldData.status === 'Draft' && newData.status === 'Pending_Review') {
                        return '📤 Gửi duyệt (Pháp lý + Tài chính song song)';
                    }
                    // Both approved -> automatically advances
                    if (oldData.status === 'Pending_Review' && newData.status === 'Both_Approved') {
                        return '🎉 Cả hai bên đã duyệt xong';
                    }
                    // Other status changes
                    if (oldData.status !== newData.status) {
                        return `Cập nhật trạng thái: ${translateStatus(oldData.status)} → ${translateStatus(newData.status)}`;
                    }
                    if (oldData.stage !== newData.stage) {
                        return `Chuyển giai đoạn: ${translateStage(oldData.stage)} → ${translateStage(newData.stage)}`;
                    }
                    if (oldData.review_status !== newData.review_status) {
                        const statusMap: Record<string, string> = {
                            'PENDING_LEGAL': 'Chờ Pháp lý duyệt',
                            'LEGAL_APPROVED': 'Pháp lý đã duyệt',
                            'PENDING_FINANCE': 'Chờ Tài chính duyệt',
                            'FINANCE_APPROVED': 'Tài chính đã duyệt',
                            'REJECTED': 'Từ chối'
                        };
                        return `Duyệt: ${statusMap[newData.review_status] || newData.review_status}`;
                    }
                    if (!oldData.draft_url && newData.draft_url) {
                        return 'Gửi dự thảo cho Pháp lý xem xét';
                    }
                }
                return 'Cập nhật thông tin';
            case 'DELETE':
                return 'Xóa hợp đồng';
            case 'APPROVE_LEGAL':
                return 'Pháp lý phê duyệt nội dung';
            case 'APPROVE_FINANCE':
                return 'Tài chính phê duyệt';
            case 'REJECT':
                return 'Từ chối phê duyệt';
            case 'SUBMIT_LEGAL':
                return 'Gửi duyệt Pháp lý';
            default:
                return action;
        }
    },

    /**
     * Format thời gian thành chuỗi ngày/giờ tiếng Việt
     */
    formatDateTime(dateString: string): { date: string; time: string } {
        const date = new Date(dateString);
        return {
            date: date.toLocaleDateString('vi-VN', {
                day: '2-digit',
                month: '2-digit',
                year: 'numeric'
            }),
            time: date.toLocaleTimeString('vi-VN', {
                hour: '2-digit',
                minute: '2-digit'
            })
        };
    }
};
