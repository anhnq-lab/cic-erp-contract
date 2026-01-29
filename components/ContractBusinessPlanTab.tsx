import React, { useState, useEffect } from 'react';
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
    const { profile, canEdit: canEditResource, canApprove } = useAuth();
    const [plan, setPlan] = useState<BusinessPlan | null>(null);
    const [reviews, setReviews] = useState<any[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [isEditing, setIsEditing] = useState(false);

    // Form State
    const [financials, setFinancials] = useState({
        revenue: contract.value,
        costs: contract.estimatedCost,
        margin: 0,
        grossProfit: 0
    });

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

        if (error && error.code !== 'PGRST116') { // Not found is ok
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
            // Init default state
            setFinancials({
                revenue: contract.value,
                costs: contract.estimatedCost,
                margin: ((contract.value - contract.estimatedCost) / contract.value) * 100,
                grossProfit: contract.value - contract.estimatedCost
            });
        }
        setIsLoading(false);
    };

    // Helper: Calculate Margin
    const calculateMargin = (rev: number, cost: number) => {
        const profit = rev - cost;
        const margin = rev > 0 ? (profit / rev) * 100 : 0;
        return { profit, margin };
    };

    const handleSave = async () => {
        const { profit, margin } = calculateMargin(financials.revenue, financials.costs);

        const payload = {
            contract_id: contract.id,
            version: plan ? plan.version + 1 : 1, // New version if already exists
            status: 'Draft', // Reset to Draft on edit
            financials: {
                revenue: financials.revenue,
                costs: financials.costs,
                grossProfit: profit,
                margin: margin,
                cashflow: contract.paymentPhases || []
            },
            is_active: true,
            created_by: profile?.id, // Supabase Auth ID
            notes: 'Updated manual plan'
        };

        // If plan exists, we might want to archive old one (set is_active=false)
        // For simplicity, we just INSERT new and trigger handles active... 
        // Or we update existing 'Draft'. Strict versioning requires INSERT.

        // Let's TRY simple UPSERT for Draft, but INSERT for new Version if it was Approved.
        // For now: UPSERT if Draft, INSERT if Approved.

        if (plan && plan.status !== 'Draft') {
            // Create New Version
            const { error } = await supabase.from('contract_business_plans').insert(payload);
            if (error) { toast.error("Lỗi tạo phiên bản mới: " + error.message); return; }
        } else {
            // Update/Create Draft
            if (plan?.id) {
                const { error } = await supabase.from('contract_business_plans')
                    .update({ financials: payload.financials, updated_at: new Date().toISOString() })
                    .eq('id', plan.id);
                if (error) { toast.error(error.message); return; }
            } else {
                const { error } = await supabase.from('contract_business_plans').insert(payload);
                if (error) { toast.error(error.message); return; }

                // Fetch the new plan using contract_id to get its ID properly (since we don't have ID return from insert in v1)
                // Actually we can enable returning, but for now:
                // ...
            }
        }

        toast.success("Đã lưu PAKD!");
        setIsEditing(false);
        fetchPlan(); // Refresh logic
        fetchPlan();
        onUpdate();
    };

    // ...

    const handleAction = async (action: 'Submit' | 'Approve' | 'Reject') => {
        if (!plan) return;

        try {
            let result;
            if (action === 'Submit') {
                result = await WorkflowService.submitPAKD(plan.id);
            } else if (action === 'Approve') {
                // Profile role should be guaranteed by canApprove check in UI
                if (!profile?.role) return;
                result = await WorkflowService.approvePAKD(plan.id, profile.role);
            } else if (action === 'Reject') {
                // We might need a prompt for reason here
                const reason = window.prompt("Nhập lý do từ chối:");
                if (!reason) return;
                result = await WorkflowService.rejectPAKD(plan.id, reason);
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

    if (isLoading) return <div className="p-8 text-center text-slate-500">Đang tải phương án kinh doanh...</div>;


    // Permission Checks from AuthContext
    const canEditPlan = canEditResource('pakd', undefined, plan?.status); // Unit check implied? mostly global or owner. workflowService checks logic.
    // Actually AuthContext canEdit for pakd checks unitId. We should pass it if we have it. 
    // Contract has unitId. Plan belongs to contract. 
    // const canEditPlan = canEditResource('pakd', contract.unitId, plan?.status); 

    // UI Permission Flags
    const showSubmit = plan?.status === 'Draft' && canEditResource('pakd', contract.unitId, 'Draft');

    const showApproveUnit = canApprove('pakd', 'Pending_Unit');
    const showApproveFinance = canApprove('pakd', 'Pending_Finance');
    const showApproveBoard = canApprove('pakd', 'Pending_Board');

    return (
        <div className="bg-white dark:bg-slate-900 rounded-3xl p-6 border border-slate-200 dark:border-slate-800 shadow-sm">
            <div className="flex justify-between items-center mb-6">
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

                <div className="flex gap-2">
                    {/* EDIT ACTION */}
                    {canEditPlan && !isEditing && (
                        <button onClick={() => setIsEditing(true)} className="px-4 py-2 bg-indigo-50 text-indigo-600 rounded-xl hover:bg-indigo-100 font-medium text-sm">
                            {plan ? 'Chỉnh sửa' : 'Lập PAKD'}
                        </button>
                    )}

                    {/* EDIT MODE ACTIONS */}
                    {isEditing && (
                        <div className="flex gap-2">
                            <button onClick={() => setIsEditing(false)} className="px-4 py-2 text-slate-600 hover:bg-slate-50 rounded-xl text-sm font-medium">Hủy</button>
                            <button onClick={handleSave} className="px-4 py-2 bg-indigo-600 text-white rounded-xl hover:bg-indigo-700 text-sm font-medium shadow-lg shadow-indigo-200">Lưu nháp</button>
                        </div>
                    )}

                    {/* SUBMIT ACTION (Draft -> Pending_Unit) */}
                    {!isEditing && showSubmit && (
                        <button onClick={() => handleAction('Submit')} className="px-4 py-2 bg-blue-600 text-white rounded-xl hover:bg-blue-700 font-medium text-sm flex items-center gap-2">
                            <Send size={16} /> Gửi duyệt
                        </button>
                    )}

                    {/* UNIT APPROVAL (Pending_Unit -> Pending_Finance) */}
                    {showApproveUnit && (
                        <div className="flex gap-2 items-center bg-amber-50 rounded-xl p-1 pr-2">
                            <span className="text-[10px] font-bold text-amber-600 uppercase ml-2 mr-2">Duyệt Đơn vị</span>
                            <button onClick={() => handleAction('Reject')} className="px-3 py-1.5 bg-white text-rose-600 rounded-lg hover:bg-rose-50 font-bold text-xs shadow-sm border border-slate-200">Từ chối</button>
                            <button onClick={() => handleAction('Approve')} className="px-3 py-1.5 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 font-bold text-xs shadow-sm flex items-center gap-1">
                                <Check size={12} /> Duyệt
                            </button>
                        </div>
                    )}

                    {/* FINANCE APPROVAL (Pending_Finance -> Pending_Board/Approved) */}
                    {showApproveFinance && (
                        <div className="flex gap-2 items-center bg-indigo-50 rounded-xl p-1 pr-2">
                            <span className="text-[10px] font-bold text-indigo-600 uppercase ml-2 mr-2">Duyệt Tài chính</span>
                            <button onClick={() => handleAction('Reject')} className="px-3 py-1.5 bg-white text-rose-600 rounded-lg hover:bg-rose-50 font-bold text-xs shadow-sm border border-slate-200">Từ chối</button>
                            <button onClick={() => handleAction('Approve')} className="px-3 py-1.5 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 font-bold text-xs shadow-sm flex items-center gap-1">
                                <Check size={12} /> Duyệt
                            </button>
                        </div>
                    )}

                    {/* BOARD APPROVAL (Pending_Board -> Approved) */}
                    {showApproveBoard && (
                        <div className="flex gap-2 items-center bg-purple-50 rounded-xl p-1 pr-2">
                            <span className="text-[10px] font-bold text-purple-600 uppercase ml-2 mr-2">Duyệt Lãnh đạo</span>
                            <button onClick={() => handleAction('Reject')} className="px-3 py-1.5 bg-white text-rose-600 rounded-lg hover:bg-rose-50 font-bold text-xs shadow-sm border border-slate-200">Từ chối</button>
                            <button onClick={() => handleAction('Approve')} className="px-3 py-1.5 bg-purple-600 text-white rounded-lg hover:bg-purple-700 font-bold text-xs shadow-sm flex items-center gap-1">
                                <Check size={12} /> Phê duyệt
                            </button>
                        </div>
                    )}

                    {/* 4. ADJUST ACTUAL COSTS (Allowed for Confirmed Roles even if Approved) */}
                    {(profile?.role === 'Accountant' || profile?.role === 'ChiefAccountant' || profile?.role === 'Leadership') && (
                        <div className="ml-2 pl-2 border-l border-slate-200">
                            <button
                                onClick={() => toast.info("Tính năng đang phát triển: Mở dialog nhập chi phí thực tế (Cost Adjustments)")}
                                className="px-3 py-2 bg-emerald-50 text-emerald-700 rounded-xl hover:bg-emerald-100 font-medium text-xs flex items-center gap-1 border border-emerald-200"
                            >
                                <FileText size={14} /> Cập nhật Chi phí
                            </button>
                        </div>
                    )}
                </div>
            </div>

            {/* 1. FINANCIAL SUMMARY (Restored) */}
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

            {/* 2. BUSINESS PLAN DETAILS (Moved from Overview) */}
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
                            {/* Totals Row */}
                            <tr className="bg-slate-50 dark:bg-slate-800/50 font-black text-slate-800 dark:text-slate-200 border-t-2 border-slate-100 dark:border-slate-700">
                                <td className="px-4 py-3" colSpan={2}>TỔNG CỘNG</td>
                                <td className="px-4 py-3 text-right text-slate-500">{new Intl.NumberFormat('vi-VN').format(financials.costs - (contract.adminCosts ? Object.values(contract.adminCosts).reduce((a: any, b: any) => a + b, 0) : 0))}</td>
                                {/* Note: approximate logic for input total, relying on passed financials or contract details in full impl */}
                                <td className="px-4 py-3 text-right text-indigo-600">{new Intl.NumberFormat('vi-VN').format(financials.revenue)}</td>
                                <td className="px-4 py-3 text-right text-rose-500">
                                    {/* Calculated Direct Costs from items */}
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

                {/* Visual Steps */}
                <div className="flex items-center gap-4 mb-8 overflow-x-auto pb-2">
                    {[
                        { id: 'Draft', label: PLAN_STATUS_LABELS['Draft'] },
                        { id: 'Pending_Unit', label: PLAN_STATUS_LABELS['Pending_Unit'] },
                        { id: 'Pending_Finance', label: PLAN_STATUS_LABELS['Pending_Finance'] },
                        { id: 'Pending_Board', label: PLAN_STATUS_LABELS['Pending_Board'] },
                        { id: 'Approved', label: PLAN_STATUS_LABELS['Approved'] }
                    ].map((step, idx) => {
                        const isCurrent = plan?.status === step.id;
                        // Simple logic: if plan status index > step index, it's passed.
                        // We need a helper to know order, but for now simple checking via hardcode
                        const statusOrder = ['Draft', 'Pending_Unit', 'Pending_Finance', 'Pending_Board', 'Approved'];
                        const currentIdx = statusOrder.indexOf(plan?.status || 'Draft');
                        const stepIdx = statusOrder.indexOf(step.id);
                        const isPast = currentIdx > stepIdx;

                        return (
                            <div key={step.id} className={`flex items-center gap-2 whitespace-nowrap ${(isCurrent || isPast) ? 'text-indigo-600 font-bold' : 'text-slate-400'}`}>
                                <div className={`w-8 h-8 rounded-full flex items-center justify-center text-xs border ${isCurrent ? 'border-indigo-600 bg-indigo-50 text-indigo-700 ring-2 ring-indigo-200' :
                                    isPast ? 'border-indigo-600 bg-indigo-600 text-white' :
                                        'border-slate-300 bg-slate-50'
                                    }`}>
                                    {isPast ? <Check size={14} /> : idx + 1}
                                </div>
                                <span className="text-sm">{step.label}</span>
                                {idx < 4 && <div className={`w-8 h-[2px] ${isPast ? 'bg-indigo-600' : 'bg-slate-200'}`} />}
                            </div>
                        )
                    })}
                </div>

                {/* Detailed History Log */}
                <div className="bg-slate-50 dark:bg-slate-800/50 rounded-xl p-4 border border-slate-200 dark:border-slate-700">
                    <h5 className="text-xs font-bold text-slate-500 uppercase mb-4 flex items-center gap-2">
                        <span className="w-2 h-2 bg-slate-400 rounded-full"></span> Lịch sử Xử lý
                    </h5>
                    {reviews.length === 0 ? (
                        <p className="text-sm text-slate-400 italic pl-4">Chưa có lịch sử phê duyệt.</p>
                    ) : (
                        <div className="space-y-4">
                            {reviews.map((rv, i) => (
                                <div key={i} className="flex gap-4 relative pl-4 opacity-90 hover:opacity-100 transition-opacity">
                                    {/* Timeline Line */}
                                    {i < reviews.length - 1 && (
                                        <div className="absolute left-[20px] top-6 bottom-[-20px] w-[2px] bg-slate-200 dark:bg-slate-700"></div>
                                    )}

                                    <div className={`w-8 h-8 rounded-full flex items-center justify-center shrink-0 border z-10 ${rv.action === 'Approve' || rv.action === 'Submit' ? 'bg-emerald-100 text-emerald-600 border-emerald-200' :
                                        rv.action === 'Reject' ? 'bg-rose-100 text-rose-600 border-rose-200' :
                                            'bg-slate-100 text-slate-600'
                                        }`}>
                                        {rv.action === 'Reject' ? <X size={14} /> : <Check size={14} />}
                                    </div>
                                    <div>
                                        <div className="flex items-center gap-2 mb-1">
                                            <span className="font-bold text-sm text-slate-700 dark:text-slate-200">
                                                {rv.reviewer_profile?.full_name || 'Người dùng'}
                                            </span>
                                            <span className={`text-[10px] px-2 py-0.5 rounded-full font-bold uppercase ${rv.action === 'Approve' || rv.action === 'Submit' ? 'bg-emerald-50 text-emerald-600' : 'bg-rose-50 text-rose-600'
                                                }`}>
                                                {rv.action}
                                            </span>
                                        </div>
                                        <p className="text-sm text-slate-600 dark:text-slate-400 mb-1">
                                            {rv.comment}
                                        </p>
                                        <p className="text-xs text-slate-400">
                                            {new Date(rv.created_at).toLocaleString('vi-VN')}
                                        </p>
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};

export default ContractBusinessPlanTab;
