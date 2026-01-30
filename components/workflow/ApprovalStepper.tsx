import React from 'react';
import { Check } from 'lucide-react';
import { PlanStatus } from '../../types';
import { PLAN_STATUS_LABELS } from '../../constants';

interface Props {
    currentStatus: PlanStatus;
}

const STEPS: { id: PlanStatus; label: string }[] = [
    { id: 'Draft', label: PLAN_STATUS_LABELS['Draft'] },
    { id: 'Pending_Unit', label: PLAN_STATUS_LABELS['Pending_Unit'] },
    { id: 'Pending_Finance', label: PLAN_STATUS_LABELS['Pending_Finance'] },
    { id: 'Pending_Board', label: PLAN_STATUS_LABELS['Pending_Board'] },
    { id: 'Approved', label: PLAN_STATUS_LABELS['Approved'] }
];

const STATUS_ORDER = ['Draft', 'Pending_Unit', 'Pending_Finance', 'Pending_Board', 'Approved'];

export const ApprovalStepper: React.FC<Props> = ({ currentStatus }) => {
    return (
        <div className="flex items-center gap-4 overflow-x-auto pb-2 scrollbar-none">
            {STEPS.map((step, idx) => {
                const isCurrent = currentStatus === step.id;
                const currentIdx = STATUS_ORDER.indexOf(currentStatus || 'Draft');
                const stepIdx = STATUS_ORDER.indexOf(step.id);
                const isPast = currentIdx > stepIdx;

                return (
                    <div key={step.id} className={`flex items-center gap-2 whitespace-nowrap transition-colors ${(isCurrent || isPast) ? 'text-indigo-600 font-bold' : 'text-slate-400'
                        }`}>
                        <div className={`w-8 h-8 rounded-full flex items-center justify-center text-xs border transition-all ${isCurrent
                                ? 'border-indigo-600 bg-indigo-50 text-indigo-700 ring-2 ring-indigo-200'
                                : isPast
                                    ? 'border-indigo-600 bg-indigo-600 text-white'
                                    : 'border-slate-300 bg-slate-50'
                            }`}>
                            {isPast ? <Check size={14} /> : idx + 1}
                        </div>
                        <span className="text-sm">{step.label}</span>

                        {/* Connector Line */}
                        {idx < STEPS.length - 1 && (
                            <div className={`w-8 h-[2px] transition-colors ${isPast ? 'bg-indigo-600' : 'bg-slate-200'}`} />
                        )}
                    </div>
                );
            })}
        </div>
    );
};
