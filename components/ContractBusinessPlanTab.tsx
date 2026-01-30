import React, { useState, useEffect } from 'react';
import { ApprovalStepper } from './workflow/ApprovalStepper';
import { ActionPanel } from './workflow/ActionPanel';
import { ReviewLog } from './workflow/ReviewLog';
import { RejectDialog } from './workflow/RejectDialog';
import { PLAN_STATUS_LABELS } from '../constants';
import { Contract, BusinessPlan, PaymentPhase, UserProfile } from '../types';
import { useAuth } from '../contexts/AuthContext';
import { supabase } from '../lib/supabase';
import { WorkflowService } from '../services';
import { toast } from 'sonner';
import { Check, X, AlertTriangle, Send, FileText, Lock } from 'lucide-react';

interface Props {
    contract: Contract;
    onUpdate: () => void;
}

const ContractBusinessPlanTab: React.FC<Props> = ({ contract, onUpdate }) => {
    // ... (keep hooks and state)
    const { profile, canEdit: canEditResource, canApprove } = useAuth();
    const [plan, setPlan] = useState<BusinessPlan | null>(null);
    const [reviews, setReviews] = useState<any[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [isEditing, setIsEditing] = useState(false);
    const [showRejectDialog, setShowRejectDialog] = useState(false);
    const [isRejecting, setIsRejecting] = useState(false);

    // Form State
    const [financials, setFinancials] = useState({
        revenue: contract.value,
        costs: contract.estimatedCost,
        margin: 0,
        grossProfit: 0
    });

    // ... (keep useEffect and fetchPlan)
    useEffect(() => {
        fetchPlan();
    }, [contract.id]);

    const fetchPlan = async () => {
        setIsLoading(true);
        const { data, error } = await supabase
            .from('contract_business_plans')
            .select('*')
            .eq('contract_id', contract.id)
            .eq('is_active', true)
            .single();

        if (error && error.code !== 'PGRST116') {
            console.error("Error fetching plan:", error);
        }

        if (data) {
            setPlan({
                id: data.id,
                contractId: data.contract_id,
                version: data.version,
                status: data.status,
                financials: data.financials,
                isActive: data.is_active,
                createdBy: data.created_by,
                createdAt: data.created_at,
                approvedBy: data.approved_by,
                approvedAt: data.approved_at,
                notes: data.notes
            });

            // Fetch reviews
            const { data: reviewsData } = await supabase
                .from('contract_reviews')
                .select('*, reviewer_profile:reviewer_id(full_name)')
                .eq('plan_id', data.id)
                .order('created_at', { ascending: false });
            setReviews(reviewsData || []);

            setFinancials({
                revenue: data.financials.revenue || contract.value,
                costs: data.financials.costs || contract.estimatedCost,
                margin: data.financials.margin || 0,
                grossProfit: data.financials.grossProfit || 0
            });
        } else {
            setFinancials({
                revenue: contract.value,
                costs: contract.estimatedCost,
                margin: contract.value ? ((contract.value - contract.estimatedCost) / contract.value) * 100 : 0,
                grossProfit: contract.value - contract.estimatedCost
            });
        }
        setIsLoading(false);
    };

    const calculateMargin = (rev: number, cost: number) => {
        const profit = rev - cost;
        const margin = rev > 0 ? (profit / rev) * 100 : 0;
        return { profit, margin };
    };

    const handleSave = async () => {
        const { profit, margin } = calculateMargin(financials.revenue, financials.costs);

        const payload = {
            contract_id: contract.id,
            version: plan ? plan.version + 1 : 1,
            status: 'Draft',
            financials: {
                revenue: financials.revenue,
                costs: financials.costs,
                grossProfit: profit,
                margin: margin,
                cashflow: contract.paymentPhases || []
            },
            is_active: true,
            created_by: profile?.id,
            notes: 'Updated manual plan'
        };

        if (plan && plan.status !== 'Draft') {
            const { error } = await supabase.from('contract_business_plans').insert(payload);
            if (error) { toast.error("Lỗi tạo phiên bản mới: " + error.message); return; }
        } else {
            if (plan?.id) {
                const { error } = await supabase.from('contract_business_plans')
                    .update({ financials: payload.financials, updated_at: new Date().toISOString() })
                    .eq('id', plan.id);
                if (error) { toast.error(error.message); return; }
            } else {
                const { error } = await supabase.from('contract_business_plans').insert(payload);
                if (error) { toast.error(error.message); return; }
            }
        }

        toast.success("Đã lưu PAKD!");
        setIsEditing(false);
        fetchPlan();
        onUpdate();
    };

    const handleAction = async (action: 'Submit' | 'Approve' | 'Reject') => {
        if (!plan) return;

        // Handle Reject via dialog
        if (action === 'Reject') {
            setShowRejectDialog(true);
            return;
        }

        try {
            let result;
            if (action === 'Submit') {
                result = await WorkflowService.submitPAKD(plan.id);
            } else if (action === 'Approve') {
                // Profile role check handled in service mostly
                if (!profile?.role && !profile?.email) return;
                result = await WorkflowService.approvePAKD(plan.id, profile?.role || 'NVKD');
            }

            if (result && result.success) {
                toast.success(`Đã thực hiện: ${action}`);
                fetchPlan();
                onUpdate();
            } else {
                toast.error(`Lỗi: ${result?.error?.message || 'Không xác định'}`);
            }

        } catch (err: any) {
            toast.error("Lỗi cập nhật trạng thái: " + err.message);
        }
    };

    const handleReject = async (reason: string) => {
        if (!plan) return;
        setIsRejecting(true);

        try {
            const result = await WorkflowService.rejectPAKD(plan.id, reason);
            if (result.success) {
                toast.success('Đã từ chối PAKD');
                setShowRejectDialog(false);
                fetchPlan();
                onUpdate();
            } else {
                toast.error(`Lỗi: ${result.error?.message || 'Không xác định'}`);
            }
        } catch (err: any) {
            toast.error("Lỗi từ chối: " + err.message);
        } finally {
            setIsRejecting(false);
        }
    };

    if (isLoading) return <div className="p-8 text-center text-slate-500">Đang tải phương án kinh doanh...</div>;

    // Permissions
    const canEditPlan = canEditResource('pakd', contract.unitId, plan?.status);
    const showSubmit = plan?.status === 'Draft' && canEditResource('pakd', contract.unitId, 'Draft');
    const showApproveUnit = canApprove('pakd', 'Pending_Unit');
    const showApproveFinance = canApprove('pakd', 'Pending_Finance');
    const showApproveBoard = canApprove('pakd', 'Pending_Board');

    // Explicitly check for Admin/Cost Adjustment roles
    const canAdjustCost = !!(profile?.role === 'Accountant' || profile?.role === 'ChiefAccountant' || profile?.role === 'Leadership' || profile?.role === 'Admin');

    return (
        <div className="bg-white dark:bg-slate-900 rounded-3xl p-6 border border-slate-200 dark:border-slate-800 shadow-sm animate-in fade-in slide-in-from-bottom-4 duration-500">
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-6 gap-4">
                <div>
                    <h3 className="text-xl font-bold flex items-center gap-2">
                        <FileText className="text-indigo-600" />
                        Phương án Kinh doanh (PAKD)
                        {plan && (
                            <span className={`text-xs px-2 py-1 rounded-full ${plan.status === 'Approved' ? 'bg-green-100 text-green-700' :
                                plan.status === 'Draft' ? 'bg-slate-100 text-slate-600' :
                                    'bg-amber-100 text-amber-700'
                                }`}>
                                {PLAN_STATUS_LABELS[plan.status]} v{plan.version}
                            </span>
                        )}
                    </h3>
                    <p className="text-slate-500 text-sm mt-1">Quản lý dòng tiền, lợi nhuận và phê duyệt nội bộ</p>
                </div>

                <ActionPanel
                    isEditing={isEditing}
                    setIsEditing={setIsEditing}
                    onSave={handleSave}
                    onAction={handleAction}
                    canEditPlan={canEditPlan}
                    showSubmit={showSubmit}
                    showApproveUnit={showApproveUnit}
                    showApproveFinance={showApproveFinance}
                    showApproveBoard={showApproveBoard}
                    canAdjustCost={canAdjustCost}
                    planExists={!!plan}
                />
            </div>

            {/* 1. FINANCIAL SUMMARY */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
                <div className="bg-slate-50 dark:bg-slate-800 p-5 rounded-2xl border border-slate-100 dark:border-slate-700">
                    <p className="text-slate-500 text-xs font-bold uppercase tracking-wider mb-1">Doanh thu dự kiến</p>
                    <p className="text-2xl font-bold text-slate-900 dark:text-white">
                        {new Intl.NumberFormat('vi-VN').format(financials.revenue)} ₫
                    </p>
                </div>

                <div className="bg-slate-50 dark:bg-slate-800 p-5 rounded-2xl border border-slate-100 dark:border-slate-700">
                    <p className="text-slate-500 text-xs font-bold uppercase tracking-wider mb-1">Tổng chi phí</p>
                    <p className="text-2xl font-bold text-slate-900 dark:text-white">
                        {new Intl.NumberFormat('vi-VN').format(financials.costs)} ₫
                    </p>
                </div>

                <div className={`p-5 rounded-2xl border ${financials.margin >= 30
                    ? 'bg-green-50 border-green-200 dark:bg-green-900/20 dark:border-green-800'
                    : 'bg-amber-50 border-amber-200 dark:bg-amber-900/20 dark:border-amber-800'
                    }`}>
                    <div className="flex justify-between items-start">
                        <div>
                            <p className={`text-xs font-bold uppercase tracking-wider mb-1 ${financials.margin >= 30 ? 'text-green-600' : 'text-amber-600'
                                }`}>Lợi nhuận gộp</p>
                            <p className={`text-2xl font-bold ${financials.margin >= 30 ? 'text-green-700' : 'text-amber-700'
                                }`}>
                                {new Intl.NumberFormat('vi-VN').format(financials.grossProfit)} ₫
                            </p>
                        </div>
                        <div className={`text-lg font-bold px-3 py-1 rounded-lg ${financials.margin >= 30 ? 'bg-green-200 text-green-800' : 'bg-amber-200 text-amber-800'
                            }`}>
                            {financials.margin.toFixed(1)}%
                        </div>
                    </div>
                </div>
            </div>

            {/* 2. BUSINESS PLAN DETAILS */}
            <div className="mb-8">
                {/* 2.1 Products Table */}
                <div className="mb-8 overflow-x-auto rounded-xl border border-slate-200 dark:border-slate-700">
                    <table className="w-full text-left text-xs min-w-[800px]">
                        <thead className="bg-slate-50 dark:bg-slate-800/50">
                            <tr>
                                <th className="px-4 py-3 font-black text-slate-400 uppercase tracking-tighter">Sản phẩm/Dịch vụ</th>
                                <th className="px-2 py-3 font-black text-slate-400 uppercase tracking-tighter text-center">SL</th>
                                <th className="px-4 py-3 font-black text-slate-400 uppercase tracking-tighter text-right">Giá Đầu vào</th>
                                <th className="px-4 py-3 font-black text-slate-400 uppercase tracking-tighter text-right">Giá Đầu ra</th>
                                <th className="px-4 py-3 font-black text-slate-400 uppercase tracking-tighter text-right">CP Trực tiếp</th>
                                <th className="px-4 py-3 font-black text-slate-400 uppercase tracking-tighter text-right">Chênh lệch</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-50 dark:divide-slate-800">
                            {contract.lineItems?.map((item, idx) => {
                                const inputTotal = item.quantity * item.inputPrice;
                                const outputTotal = item.quantity * item.outputPrice;
                                const margin = outputTotal - inputTotal - (item.directCosts || 0);

                                return (
                                    <tr key={idx} className="group hover:bg-slate-50 dark:hover:bg-slate-800/20">
                                        <td className="px-4 py-3 font-bold text-slate-700 dark:text-slate-200">{item.name}</td>
                                        <td className="px-2 py-3 text-center">{item.quantity}</td>
                                        <td className="px-4 py-3 text-right text-slate-500">{new Intl.NumberFormat('vi-VN').format(item.inputPrice)}</td>
                                        <td className="px-4 py-3 text-right font-bold text-indigo-600">{new Intl.NumberFormat('vi-VN').format(item.outputPrice)}</td>
                                        <td className="px-4 py-3 text-right text-rose-500 font-bold align-top">
                                            <div className={`border-b border-dashed ${item.directCostDetails?.length ? 'border-rose-300/50 cursor-help' : 'border-transparent'} w-fit ml-auto pb-0.5`} title="Chi tiết phí trực tiếp">
                                                {new Intl.NumberFormat('vi-VN').format(item.directCosts || 0)}
                                            </div>
                                        </td>
                                        <td className={`px-4 py-3 text-right font-black ${margin >= 0 ? 'text-emerald-600' : 'text-rose-600'}`}>
                                            {new Intl.NumberFormat('vi-VN').format(margin)}
                                        </td>
                                    </tr>
                                );
                            })}
                            <tr className="bg-slate-50 dark:bg-slate-800/50 font-black text-slate-800 dark:text-slate-200 border-t-2 border-slate-100 dark:border-slate-700">
                                <td className="px-4 py-3" colSpan={2}>TỔNG CỘNG</td>
                                <td className="px-4 py-3 text-right text-slate-500">{new Intl.NumberFormat('vi-VN').format(financials.costs - (contract.adminCosts ? Object.values(contract.adminCosts).reduce((a: any, b: any) => a + b, 0) : 0))}</td>
                                <td className="px-4 py-3 text-right text-indigo-600">{new Intl.NumberFormat('vi-VN').format(financials.revenue)}</td>
                                <td className="px-4 py-3 text-right text-rose-500">
                                    {new Intl.NumberFormat('vi-VN').format(contract.lineItems?.reduce((acc, item) => acc + (item.directCosts || 0), 0) || 0)}
                                </td>
                                <td className={`px-4 py-3 text-right ${financials.grossProfit >= 0 ? 'text-emerald-600' : 'text-rose-600'}`}>
                                    {new Intl.NumberFormat('vi-VN').format(financials.grossProfit)}
                                </td>
                            </tr>
                        </tbody>
                    </table>
                </div>

                {/* 2.2 Admin Costs */}
                <h4 className="text-sm font-bold text-slate-600 dark:text-slate-400 uppercase tracking-widest mb-4 flex items-center gap-2">
                    Chi phí Quản lý Hợp đồng
                </h4>
                <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
                    {[
                        { key: 'transferFee', label: 'Phí chuyển tiền' },
                        { key: 'contractorTax', label: 'Thuế nhà thầu' },
                        { key: 'importFee', label: 'Logistics/NK' },
                        { key: 'expertHiring', label: 'Thuê chuyên gia' },
                        { key: 'documentProcessing', label: 'Xử lý chứng từ' }
                    ].map(item => (
                        <div key={item.key} className="p-3 bg-slate-50 dark:bg-slate-800/50 rounded-xl border border-slate-100 dark:border-slate-700">
                            <p className="text-[10px] text-slate-400 font-bold uppercase truncate" title={item.label}>{item.label}</p>
                            <p className="text-sm font-black text-rose-500 mt-1">
                                {new Intl.NumberFormat('vi-VN').format((contract.adminCosts as any)?.[item.key] || 0)}
                            </p>
                        </div>
                    ))}
                </div>
            </div>

            {/* Warning if Margin < 30% */}
            {financials.margin < 30 && (
                <div className="flex items-start gap-3 p-4 bg-amber-50 text-amber-800 rounded-xl mb-6 border border-amber-100">
                    <AlertTriangle className="shrink-0 mt-0.5" size={18} />
                    <div className="text-sm">
                        <strong className="block mb-1">Cảnh báo Hiệu quả thấp</strong>
                        Tỷ suất lợi nhuận dưới 30% (KPI chuẩn). PAKD này sẽ cần Lãnh đạo Công ty phê duyệt thủ công.
                    </div>
                </div>
            )}

            {/* Workflow Steps & History */}
            <div className="mt-8 border-t border-slate-100 dark:border-slate-800 pt-6">
                <h4 className="text-sm font-bold text-slate-900 dark:text-white mb-4">Tiến độ Phê duyệt</h4>

                {plan && <ApprovalStepper currentStatus={plan.status} />}

                <div className="mt-6">
                    <ReviewLog reviews={reviews} />
                </div>
            </div>

            {/* Reject Dialog */}
            <RejectDialog
                isOpen={showRejectDialog}
                onClose={() => setShowRejectDialog(false)}
                onConfirm={handleReject}
                isLoading={isRejecting}
            />
        </div>
    );
};

export default ContractBusinessPlanTab;
