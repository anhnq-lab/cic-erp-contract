import { supabase } from '../lib/supabase';
import { PlanStatus, UserRole } from '../types';

export const WorkflowService = {
    /**
     * Approve a Business Plan (PAKD)
     * transitions: Draft -> Pending_Unit -> Pending_Finance -> Pending_Board -> Approved
     */
    async approvePAKD(planId: string, currentRole: UserRole): Promise<{ success: boolean; error?: any }> {
        try {
            // 1. Get current plan status and financials for auto-approve check
            const { data: plans, error: fetchError } = await supabase
                .from('contract_business_plans')
                .select('status, contract_id, financials')
                .eq('id', planId);

            if (fetchError || !plans || plans.length === 0) {
                console.error('Plan not found:', planId);
                return { success: false, error: 'Plan not found' };
            }
            const plan = plans[0];


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
                    // AUTO-APPROVE CHECK: If margin >= 30% AND no expert hiring, skip Pending_Board
                    const financials = plan.financials as { margin?: number; adminCosts?: { expertHiring?: number } } | null;
                    const margin = financials?.margin || 0;
                    const expertHiring = financials?.adminCosts?.expertHiring || 0;

                    if (margin >= 30 && expertHiring === 0) {
                        nextStatus = 'Approved'; // Auto-approve, skip Board
                        console.log(`[AUTO-APPROVE] PAKD ${planId}: margin=${margin}%, expertHiring=${expertHiring} → Skipping Pending_Board`);
                    } else {
                        nextStatus = 'Pending_Board';
                        console.log(`[MANUAL] PAKD ${planId}: margin=${margin}%, expertHiring=${expertHiring} → Requires Board approval`);
                    }
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
            // Map current status to review_role enum (Unit, Finance, Legal, Board)
            const reviewRoleMap: Record<string, 'Unit' | 'Finance' | 'Legal' | 'Board'> = {
                'Draft': 'Unit',           // Submitting from Draft is Unit action
                'Pending_Unit': 'Unit',    // UnitLeader approving
                'Pending_Finance': 'Finance', // Accountant approving
                'Pending_Board': 'Board'   // Leadership approving
            };
            const reviewRole = reviewRoleMap[currentStatus] || 'Unit';

            // Determine if this was auto-approved
            const wasAutoApproved = currentStatus === 'Pending_Finance' && nextStatus === 'Approved';
            const commentText = wasAutoApproved
                ? `[TỰ ĐỘNG] Phê duyệt từ ${currentStatus} → ${nextStatus} (Margin ≥ 30%, Không thuê ngoài)`
                : `Approved from ${currentStatus} to ${nextStatus}`;

            const { error: reviewError } = await supabase.from('contract_reviews').insert({
                contract_id: plan.contract_id,
                plan_id: planId,
                reviewer_id: currentUser?.id,
                role: wasAutoApproved ? 'Finance' : reviewRole,
                action: 'Approve',
                comment: commentText
            });

            if (reviewError) {
                console.error('Failed to log review:', reviewError);
                // Don't fail the entire operation, but log it
            }

            return { success: true };

        } catch (error) {
            console.error('Approve PAKD Error:', error);
            return { success: false, error };
        }
    },

    async rejectPAKD(planId: string, reason: string): Promise<{ success: boolean; error?: any }> {
        try {
            const currentUser = (await supabase.auth.getUser()).data.user;

            // Get Plan for contract_id and current status
            const { data: plans } = await supabase
                .from('contract_business_plans')
                .select('contract_id, status')
                .eq('id', planId);

            const plan = plans?.[0];


            const { error } = await supabase
                .from('contract_business_plans')
                .update({
                    status: 'Rejected',
                    notes: reason
                })
                .eq('id', planId);

            if (error) throw error;

            // Log Rejection with proper role mapping
            if (plan) {
                const reviewRoleMap: Record<string, 'Unit' | 'Finance' | 'Legal' | 'Board'> = {
                    'Pending_Unit': 'Unit',
                    'Pending_Finance': 'Finance',
                    'Pending_Board': 'Board'
                };
                const reviewRole = reviewRoleMap[plan.status as string] || 'Unit';

                const { error: reviewError } = await supabase.from('contract_reviews').insert({
                    contract_id: plan.contract_id,
                    plan_id: planId,
                    reviewer_id: currentUser?.id,
                    role: reviewRole,
                    action: 'Reject',
                    comment: reason
                });

                if (reviewError) {
                    console.error('Failed to log rejection:', reviewError);
                }
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
