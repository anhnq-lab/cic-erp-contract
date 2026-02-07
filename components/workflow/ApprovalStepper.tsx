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
    // Map step to the "TO" status (what the review transitions to)
    const toStatusMap: Record<string, string> = {
        'Pending_Unit': 'Pending_Unit',      // Review that created Pending_Unit
        'Pending_Finance': 'Pending_Finance', // Review that created Pending_Finance
        'Pending_Board': 'Pending_Board',     // Review that created Pending_Board
        'Approved': 'Approved'                // Review that created Approved
    };

    const toStatus = toStatusMap[stepId];
    if (!toStatus) return undefined;

    // Find review where comment contains "to {toStatus}"
    return reviews.find(r =>
        r.action === 'Approve' &&
        r.comment?.includes(`to ${toStatus}`)
    );
};

export const ApprovalStepper: React.FC<Props> = ({ currentStatus, reviews = [] }) => {
    const isRejected = currentStatus === 'Rejected';

    return (
        <div className="space-y-4">
            {/* Rejected Banner */}
            {isRejected && (
                <div className="flex items-center gap-3 p-3 bg-rose-50 dark:bg-rose-900/30 border border-rose-200 dark:border-rose-800 rounded-lg text-rose-700 dark:text-rose-300">
                    <X size={18} className="shrink-0" />
                    <div>
                        <p className="font-bold text-sm">PAKD đã bị từ chối</p>
                        <p className="text-xs text-rose-600 dark:text-rose-400">Cần chỉnh sửa và gửi lại</p>
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

                    // Find the review that transition to this step (or approved this step)
                    // For Draft step: find review that went to Pending_Unit
                    // For Pending_Unit step: find review that went to Pending_Finance
                    const nextStepId = STEPS[stepIdx + 1]?.id;
                    const stepReview = isPast && nextStepId ? getReviewForStep(nextStepId, reviews) : undefined;

                    return (
                        <div
                            key={step.id}
                            className={`relative p-4 rounded-lg border-2 transition-all ${isCurrent
                                ? 'border-orange-500 dark:border-orange-400 bg-orange-50 dark:bg-orange-900/30 shadow-lg shadow-orange-100 dark:shadow-none'
                                : isPast
                                    ? 'border-emerald-300 dark:border-emerald-700 bg-emerald-50 dark:bg-emerald-900/20'
                                    : isNext
                                        ? 'border-amber-200 dark:border-amber-700 bg-amber-50/50 dark:bg-amber-900/20'
                                        : 'border-slate-100 dark:border-slate-700 bg-slate-50/50 dark:bg-slate-800 opacity-60'
                                }`}
                        >
                            {/* Step Number Badge */}
                            <div className={`absolute -top-2.5 -left-2.5 w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold shadow-sm ${isPast
                                ? 'bg-emerald-500 text-white'
                                : isCurrent
                                    ? 'bg-orange-500 text-white ring-2 ring-orange-200 dark:ring-orange-800'
                                    : 'bg-slate-200 dark:bg-slate-600 text-slate-500 dark:text-slate-300'
                                }`}>
                                {isPast ? <Check size={14} /> : idx + 1}
                            </div>

                            {/* Icon & Label */}
                            <div className={`flex items-center gap-2 mb-2 ${isCurrent ? 'text-orange-700 dark:text-orange-400' : isPast ? 'text-emerald-700 dark:text-emerald-400' : 'text-slate-500 dark:text-slate-400'
                                }`}>
                                {step.icon}
                                <span className="font-bold text-sm">{step.label}</span>
                            </div>

                            {/* Description */}
                            <p className={`text-xs ${isCurrent || isPast ? 'text-slate-600 dark:text-slate-300' : 'text-slate-400 dark:text-slate-500'}`}>
                                {step.description}
                            </p>

                            {/* Approver or Timestamp */}
                            {isPast && stepReview ? (
                                <div className="mt-3 pt-2 border-t border-emerald-200 dark:border-emerald-800">
                                    <p className="text-[10px] text-emerald-600 dark:text-emerald-400 font-medium flex items-center gap-1">
                                        <Check size={10} />
                                        {stepReview.reviewer_profile?.full_name || 'Đã duyệt'}
                                    </p>
                                    <p className="text-[10px] text-emerald-500 dark:text-emerald-500 flex items-center gap-1 mt-0.5">
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
                                <p className={`text-[10px] mt-3 font-medium ${isCurrent ? 'text-orange-600 dark:text-orange-400' : 'text-slate-400 dark:text-slate-500'
                                    }`}>
                                    → {step.approver}
                                </p>
                            ) : null}

                            {/* Current Indicator */}
                            {isCurrent && (
                                <div className="absolute -top-1 -right-1">
                                    <span className="relative flex h-3 w-3">
                                        <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-orange-400 opacity-75"></span>
                                        <span className="relative inline-flex rounded-full h-3 w-3 bg-orange-500"></span>
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
