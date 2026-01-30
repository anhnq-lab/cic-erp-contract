import React from 'react';
import { Check, X, Clock, Send, FileCheck, Banknote, Users } from 'lucide-react';
import { PlanStatus } from '../../types';
import { PLAN_STATUS_LABELS } from '../../constants';

interface ReviewData {
    role: 'Unit' | 'Finance' | 'Legal' | 'Board';
    action: string;
    comment?: string;
    created_at: string;
    reviewer_profile?: { full_name?: string };
}

interface Props {
    currentStatus: PlanStatus;
    reviews?: ReviewData[];
}

const STEPS: {
    id: PlanStatus;
    reviewRole: 'Unit' | 'Finance' | 'Legal' | 'Board';
    label: string;
    icon: React.ReactNode;
    approver: string;
    description: string;
}[] = [
        {
            id: 'Draft',
            reviewRole: 'Unit',
            label: 'Soạn thảo',
            icon: <Send size={16} />,
            approver: 'NVKD / AdminUnit',
            description: 'Khởi tạo PAKD'
        },
        {
            id: 'Pending_Unit',
            reviewRole: 'Unit',
            label: 'Duyệt Đơn vị',
            icon: <Users size={16} />,
            approver: 'Trưởng Đơn vị',
            description: 'Xét duyệt nội bộ'
        },
        {
            id: 'Pending_Finance',
            reviewRole: 'Finance',
            label: 'Duyệt Tài chính',
            icon: <Banknote size={16} />,
            approver: 'Kế toán trưởng',
            description: 'Kiểm tra cashflow'
        },
        {
            id: 'Pending_Board',
            reviewRole: 'Board',
            label: 'Duyệt Lãnh đạo',
            icon: <FileCheck size={16} />,
            approver: 'Ban Lãnh đạo',
            description: 'Phê duyệt cuối'
        },
        {
            id: 'Approved',
            reviewRole: 'Board',
            label: 'Đã duyệt',
            icon: <Check size={16} />,
            approver: '',
            description: 'PAKD hoàn thành'
        }
    ];

const STATUS_ORDER = ['Draft', 'Pending_Unit', 'Pending_Finance', 'Pending_Board', 'Approved'];

// Map từ status sang review_role để tìm đúng review
const getReviewForStep = (stepId: PlanStatus, reviews: ReviewData[] = []): ReviewData | undefined => {
    // Find the review that advanced TO this status
    const statusMap: Record<string, string> = {
        'Pending_Unit': 'Draft',      // Review "Draft → Pending_Unit" 
        'Pending_Finance': 'Pending_Unit',
        'Pending_Board': 'Pending_Finance',
        'Approved': 'Pending_Board'
    };

    const fromStatus = statusMap[stepId];
    if (!fromStatus) return undefined;

    return reviews.find(r =>
        r.action === 'Approve' &&
        r.comment?.includes(`from ${fromStatus}`)
    );
};

export const ApprovalStepper: React.FC<Props> = ({ currentStatus, reviews = [] }) => {
    const isRejected = currentStatus === 'Rejected';

    return (
        <div className="space-y-4">
            {/* Rejected Banner */}
            {isRejected && (
                <div className="flex items-center gap-3 p-3 bg-rose-50 border border-rose-200 rounded-xl text-rose-700">
                    <X size={18} className="shrink-0" />
                    <div>
                        <p className="font-bold text-sm">PAKD đã bị từ chối</p>
                        <p className="text-xs text-rose-600">Cần chỉnh sửa và gửi lại</p>
                    </div>
                </div>
            )}

            {/* Steps Grid - Full Width */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
                {STEPS.map((step, idx) => {
                    const isCurrent = currentStatus === step.id;
                    const currentIdx = STATUS_ORDER.indexOf(currentStatus || 'Draft');
                    const stepIdx = STATUS_ORDER.indexOf(step.id);
                    const isPast = !isRejected && currentIdx > stepIdx;
                    const isNext = !isRejected && stepIdx === currentIdx + 1;

                    // Find the review that completed this step
                    const stepReview = isPast ? getReviewForStep(STEPS[stepIdx + 1]?.id, reviews) : undefined;

                    return (
                        <div
                            key={step.id}
                            className={`relative p-4 rounded-2xl border-2 transition-all ${isCurrent
                                    ? 'border-indigo-500 bg-indigo-50 shadow-lg shadow-indigo-100'
                                    : isPast
                                        ? 'border-emerald-300 bg-emerald-50'
                                        : isNext
                                            ? 'border-amber-200 bg-amber-50/50'
                                            : 'border-slate-100 bg-slate-50/50 opacity-60'
                                }`}
                        >
                            {/* Step Number Badge */}
                            <div className={`absolute -top-2.5 -left-2.5 w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold shadow-sm ${isPast
                                    ? 'bg-emerald-500 text-white'
                                    : isCurrent
                                        ? 'bg-indigo-600 text-white ring-2 ring-indigo-200'
                                        : 'bg-slate-200 text-slate-500'
                                }`}>
                                {isPast ? <Check size={14} /> : idx + 1}
                            </div>

                            {/* Icon & Label */}
                            <div className={`flex items-center gap-2 mb-2 ${isCurrent ? 'text-indigo-700' : isPast ? 'text-emerald-700' : 'text-slate-500'
                                }`}>
                                {step.icon}
                                <span className="font-bold text-sm">{step.label}</span>
                            </div>

                            {/* Description */}
                            <p className={`text-xs ${isCurrent || isPast ? 'text-slate-600' : 'text-slate-400'}`}>
                                {step.description}
                            </p>

                            {/* Approver or Timestamp */}
                            {isPast && stepReview ? (
                                <div className="mt-3 pt-2 border-t border-emerald-200">
                                    <p className="text-[10px] text-emerald-600 font-medium flex items-center gap-1">
                                        <Check size={10} />
                                        {stepReview.reviewer_profile?.full_name || 'Đã duyệt'}
                                    </p>
                                    <p className="text-[10px] text-emerald-500 flex items-center gap-1 mt-0.5">
                                        <Clock size={10} />
                                        {new Date(stepReview.created_at).toLocaleString('vi-VN', {
                                            day: '2-digit',
                                            month: '2-digit',
                                            hour: '2-digit',
                                            minute: '2-digit'
                                        })}
                                    </p>
                                </div>
                            ) : step.approver && !isPast ? (
                                <p className={`text-[10px] mt-3 font-medium ${isCurrent ? 'text-indigo-600' : 'text-slate-400'
                                    }`}>
                                    → {step.approver}
                                </p>
                            ) : null}

                            {/* Current Indicator */}
                            {isCurrent && (
                                <div className="absolute -top-1 -right-1">
                                    <span className="relative flex h-3 w-3">
                                        <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-indigo-400 opacity-75"></span>
                                        <span className="relative inline-flex rounded-full h-3 w-3 bg-indigo-500"></span>
                                    </span>
                                </div>
                            )}
                        </div>
                    );
                })}
            </div>
        </div>
    );
};
