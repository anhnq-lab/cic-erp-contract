import { supabase } from '../lib/supabase';
import { PlanStatus, UserRole } from '../types';

export const WorkflowService = {
    /**
     * Approve a Business Plan (PAKD)
     * transitions: Draft -> Pending_Unit -> Pending_Finance -> Pending_Board -> Approved
     */
    async approvePAKD(planId: string, currentRole: UserRole): Promise<{ success: boolean; error?: any }> {
        try {
            // 1. Get current plan status
            const { data: plan, error: fetchError } = await supabase
                .from('contract_business_plans')
                .select('status, contract_id')
                .eq('id', planId)
                .single();

            if (fetchError || !plan) throw new Error('Plan not found');

            let nextStatus: PlanStatus | null = null;
            const currentStatus = plan.status as PlanStatus;

            // 2. Determine next status based on Role & Current Status
            const user = (await supabase.auth.getUser()).data.user;
            const userEmail = user?.email;
            const isAdmin = currentRole === 'Admin' || userEmail === 'anhnq@cic.com.vn';

            if (isAdmin) {
                // GOD MODE: Auto-advance based on current status
                if (currentStatus === 'Draft') nextStatus = 'Pending_Unit';
                else if (currentStatus === 'Pending_Unit') nextStatus = 'Pending_Finance';
                else if (currentStatus === 'Pending_Finance') nextStatus = 'Pending_Board';
                else if (currentStatus === 'Pending_Board') nextStatus = 'Approved';
            }

            // Normal Flow Fallback
            if (!nextStatus) {
                if (currentStatus === 'Draft' && (currentRole === 'NVKD' || currentRole === 'UnitLeader' || currentRole === 'AdminUnit')) {
                    nextStatus = 'Pending_Unit';
                } else if (currentStatus === 'Pending_Unit' && (currentRole === 'UnitLeader' || currentRole === 'AdminUnit')) {
                    nextStatus = 'Pending_Finance';
                } else if (currentStatus === 'Pending_Finance' && (currentRole === 'Accountant' || currentRole === 'ChiefAccountant')) {
                    nextStatus = 'Pending_Board';
                } else if (currentStatus === 'Pending_Board' && currentRole === 'Leadership') {
                    nextStatus = 'Approved';
                }
            }

            if (!nextStatus) {
                // Allow Leadership to force approve
                if (currentRole === 'Leadership' || isAdmin) nextStatus = 'Approved';
                else throw new Error(`Invalid transition for Role ${currentRole} from Status ${currentStatus}`);
            }

            const currentUser = (await supabase.auth.getUser()).data.user;

            // 3. Update Status
            const { error: updateError } = await supabase
                .from('contract_business_plans')
                .update({
                    status: nextStatus,
                    approved_by: nextStatus === 'Approved' ? currentUser?.id : undefined,
                    approved_at: nextStatus === 'Approved' ? new Date().toISOString() : undefined
                })
                .eq('id', planId);

            if (updateError) throw updateError;

            // 4. Manual Log to contract_reviews
            await supabase.from('contract_reviews').insert({
                contract_id: plan.contract_id,
                plan_id: planId,
                reviewer_id: currentUser?.id,
                role: 'Unit', // Simplified mapping, ideally map currentRole to ReviewRole
                action: 'Approve',
                comment: `Approved from ${currentStatus} to ${nextStatus}`
            });

            return { success: true };

        } catch (error) {
            console.error('Approve PAKD Error:', error);
            return { success: false, error };
        }
    },

    async rejectPAKD(planId: string, reason: string): Promise<{ success: boolean; error?: any }> {
        try {
            const currentUser = (await supabase.auth.getUser()).data.user;

            // Get Plan for contract_id
            const { data: plan } = await supabase.from('contract_business_plans').select('contract_id').eq('id', planId).single();

            const { error } = await supabase
                .from('contract_business_plans')
                .update({
                    status: 'Rejected',
                    notes: reason
                })
                .eq('id', planId);

            if (error) throw error;

            // Log Rejection
            if (plan) {
                await supabase.from('contract_reviews').insert({
                    contract_id: plan.contract_id,
                    plan_id: planId,
                    reviewer_id: currentUser?.id,
                    role: 'Unit', // Placeholder
                    action: 'Reject',
                    comment: reason
                });
            }

            return { success: true };
        } catch (error) {
            console.error('Reject PAKD Error:', error);
            return { success: false, error };
        }
    },

    async submitPAKD(planId: string): Promise<{ success: boolean; error?: any }> {
        return this.approvePAKD(planId, 'NVKD');
    },

    /**
     * Helper to check if user can approve current stage
     */
    checkPermission(currentRole: UserRole, planStatus: PlanStatus, userEmail?: string): boolean {
        const isAdmin = currentRole === 'Admin' || userEmail === 'anhnq@cic.com.vn';
        if (isAdmin) return true;

        if (planStatus === 'Draft' && (currentRole === 'NVKD' || currentRole === 'UnitLeader')) return true;
        if (planStatus === 'Pending_Unit' && (currentRole === 'UnitLeader' || currentRole === 'AdminUnit')) return true;
        if (planStatus === 'Pending_Finance' && (currentRole === 'Accountant' || currentRole === 'ChiefAccountant')) return true;
        if (planStatus === 'Pending_Board' && currentRole === 'Leadership') return true;

        return false;
    }
};
