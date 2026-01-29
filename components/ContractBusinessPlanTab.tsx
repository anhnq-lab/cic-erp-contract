import React, { useState, useEffect } from 'react';
import { PLAN_STATUS_LABELS } from '../constants';

import { Contract, BusinessPlan, PaymentPhase, UserProfile } from '../types';
import { useAuth } from '../contexts/AuthContext';
import { supabase } from '../lib/supabase';
import { toast } from 'sonner';
import { Check, X, AlertTriangle, Send, FileText, Lock } from 'lucide-react';

interface Props {
    contract: Contract;
    onUpdate: () => void;
}

const ContractBusinessPlanTab: React.FC<Props> = ({ contract, onUpdate }) => {
    const { profile } = useAuth();
    const [plan, setPlan] = useState<BusinessPlan | null>(null);
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
            }
        }

        toast.success("Đã lưu PAKD!");
        setIsEditing(false);
        fetchPlan();
        onUpdate();
    };

    const handleAction = async (action: 'Submit' | 'Approve' | 'Reject') => {
        if (!plan) return;

        // Simple State Machine
        let nextStatus = plan.status;
        if (action === 'Submit') nextStatus = 'Pending_Unit';
        if (action === 'Approve') {
            if (plan.status === 'Pending_Unit') nextStatus = 'Pending_Finance';
            else if (plan.status === 'Pending_Finance') nextStatus = 'Pending_Board';
            else if (plan.status === 'Pending_Board') nextStatus = 'Approved';
        }
        if (action === 'Reject') nextStatus = 'Rejected';

        const { error } = await supabase.from('contract_business_plans')
            .update({ status: nextStatus })
            .eq('id', plan.id);

        if (error) toast.error(error.message);
        else {
            toast.success(`Đã thực hiện: ${action}`);
            fetchPlan();
        }
    };

    if (isLoading) return <div className="p-8 text-center text-slate-500">Đang tải phương án kinh doanh...</div>;

    // RBAC Logic
    const canEdit = (!plan || plan.status === 'Draft' || plan.status === 'Rejected') &&
        (profile?.role === 'NVKD' || profile?.role === 'UnitLeader' || profile?.role === 'Leadership');

    const canSubmit = plan?.status === 'Draft' &&
        (profile?.role === 'NVKD' || profile?.role === 'UnitLeader' || profile?.role === 'Leadership');

    const canApproveUnit = plan?.status === 'Pending_Unit' &&
        (profile?.role === 'UnitLeader' || profile?.role === 'Leadership');

    const canApproveFinance = plan?.status === 'Pending_Finance' &&
        (profile?.role === 'Accountant' || profile?.role === 'ChiefAccountant' || profile?.role === 'Leadership');

    const canApproveBoard = plan?.status === 'Pending_Board' &&
        (profile?.role === 'Leadership');

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
                    {canEdit && !isEditing && (
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
                    {!isEditing && canSubmit && (
                        <button onClick={() => handleAction('Submit')} className="px-4 py-2 bg-blue-600 text-white rounded-xl hover:bg-blue-700 font-medium text-sm flex items-center gap-2">
                            <Send size={16} /> Gửi duyệt
                        </button>
                    )}

                    {/* UNIT APPROVAL (Pending_Unit -> Pending_Finance) */}
                    {canApproveUnit && (
                        <div className="flex gap-2 items-center bg-amber-50 rounded-xl p-1 pr-2">
                            <span className="text-[10px] font-bold text-amber-600 uppercase ml-2 mr-2">Duyệt Đơn vị</span>
                            <button onClick={() => handleAction('Reject')} className="px-3 py-1.5 bg-white text-rose-600 rounded-lg hover:bg-rose-50 font-bold text-xs shadow-sm border border-slate-200">Từ chối</button>
                            <button onClick={() => handleAction('Approve')} className="px-3 py-1.5 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 font-bold text-xs shadow-sm flex items-center gap-1">
                                <Check size={12} /> Duyệt
                            </button>
                        </div>
                    )}

                    {/* FINANCE APPROVAL (Pending_Finance -> Pending_Board/Approved) */}
                    {canApproveFinance && (
                        <div className="flex gap-2 items-center bg-indigo-50 rounded-xl p-1 pr-2">
                            <span className="text-[10px] font-bold text-indigo-600 uppercase ml-2 mr-2">Duyệt Tài chính</span>
                            <button onClick={() => handleAction('Reject')} className="px-3 py-1.5 bg-white text-rose-600 rounded-lg hover:bg-rose-50 font-bold text-xs shadow-sm border border-slate-200">Từ chối</button>
                            <button onClick={() => handleAction('Approve')} className="px-3 py-1.5 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 font-bold text-xs shadow-sm flex items-center gap-1">
                                <Check size={12} /> Duyệt
                            </button>
                        </div>
                    )}

                    {/* BOARD APPROVAL (Pending_Board -> Approved) */}
                    {canApproveBoard && (
                        <div className="flex gap-2 items-center bg-purple-50 rounded-xl p-1 pr-2">
                            <span className="text-[10px] font-bold text-purple-600 uppercase ml-2 mr-2">Duyệt Lãnh đạo</span>
                            <button onClick={() => handleAction('Reject')} className="px-3 py-1.5 bg-white text-rose-600 rounded-lg hover:bg-rose-50 font-bold text-xs shadow-sm border border-slate-200">Từ chối</button>
                            <button onClick={() => handleAction('Approve')} className="px-3 py-1.5 bg-purple-600 text-white rounded-lg hover:bg-purple-700 font-bold text-xs shadow-sm flex items-center gap-1">
                                <Check size={12} /> Phê duyệt
                            </button>
                        </div>
                    )}
                </div>
            </div>

            {/* Financial Summary */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
                <div className="bg-slate-50 dark:bg-slate-800 p-5 rounded-2xl border border-slate-100 dark:border-slate-700">
                    <p className="text-slate-500 text-xs font-bold uppercase tracking-wider mb-1">Doanh thu dự kiến</p>
                    {isEditing ? (
                        <input
                            type="number"
                            className="w-full bg-white border border-slate-300 rounded-lg px-3 py-2 text-lg font-bold"
                            value={financials.revenue}
                            onChange={e => setFinancials({ ...financials, revenue: Number(e.target.value) })}
                        />
                    ) : (
                        <p className="text-2xl font-bold text-slate-900 dark:text-white">
                            {financials.revenue.toLocaleString('vi-VN')} ₫
                        </p>
                    )}
                </div>

                <div className="bg-slate-50 dark:bg-slate-800 p-5 rounded-2xl border border-slate-100 dark:border-slate-700">
                    <p className="text-slate-500 text-xs font-bold uppercase tracking-wider mb-1">Tổng chi phí</p>
                    {isEditing ? (
                        <input
                            type="number"
                            className="w-full bg-white border border-slate-300 rounded-lg px-3 py-2 text-lg font-bold"
                            value={financials.costs}
                            onChange={e => setFinancials({ ...financials, costs: Number(e.target.value) })}
                        />
                    ) : (
                        <p className="text-2xl font-bold text-slate-900 dark:text-white">
                            {financials.costs.toLocaleString('vi-VN')} ₫
                        </p>
                    )}
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
                                {financials.grossProfit.toLocaleString('vi-VN')} ₫
                            </p>
                        </div>
                        <div className={`text-lg font-bold px-3 py-1 rounded-lg ${financials.margin >= 30 ? 'bg-green-200 text-green-800' : 'bg-amber-200 text-amber-800'
                            }`}>
                            {financials.margin.toFixed(1)}%
                        </div>
                    </div>
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

            {/* Workflow Steps */}
            <div className="mt-8 border-t border-slate-100 dark:border-slate-800 pt-6">
                <h4 className="text-sm font-bold text-slate-900 dark:text-white mb-4">Quy trình Phê duyệt</h4>
                <div className="flex items-center gap-4">
                    {[
                        { id: 'Draft', label: PLAN_STATUS_LABELS['Draft'] },
                        { id: 'Pending_Unit', label: PLAN_STATUS_LABELS['Pending_Unit'] },
                        { id: 'Pending_Finance', label: PLAN_STATUS_LABELS['Pending_Finance'] },
                        { id: 'Approved', label: PLAN_STATUS_LABELS['Approved'] }
                    ].map((step, idx) => {
                        // Current logic is simplistic, strictly sequential for demo
                        const isActive = plan?.status === step.id;
                        const isPast = false; // logic needed
                        return (
                            <div key={step.id} className={`flex items-center gap-2 ${isActive ? 'text-indigo-600 font-bold' : 'text-slate-400'}`}>
                                <div className={`w-8 h-8 rounded-full flex items-center justify-center text-xs border ${isActive ? 'border-indigo-600 bg-indigo-50' : 'border-slate-300 bg-slate-50'
                                    }`}>
                                    {idx + 1}
                                </div>
                                <span className="text-sm">{step.label}</span>
                                {idx < 3 && <div className="w-8 h-[1px] bg-slate-200" />}
                            </div>
                        )
                    })}
                </div>
            </div>
        </div>
    );
};

export default ContractBusinessPlanTab;
