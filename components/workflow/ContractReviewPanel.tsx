import React from 'react';
import { Check, X, Gavel, Calculator, Signature } from 'lucide-react';

interface ContractReviewPanelProps {
    contractId: string;
    currentStatus: string;
    userRole: string;
    onAction: (action: 'ApproveLegal' | 'RejectLegal' | 'ApproveFinance' | 'RejectFinance' | 'SubmitSign' | 'Sign') => void;
}

/**
 * ContractReviewPanel - Hiển thị các nút duyệt theo quy trình:
 * Draft → Pending_Legal → Legal_Approved → Pending_Finance → Finance_Approved → Pending_Sign → Signed
 * 
 * Phân quyền:
 * - Legal: Duyệt pháp lý (Pending_Legal)
 * - Accountant/ChiefAccountant: Duyệt tài chính (Pending_Finance)  
 * - Leadership: Trình ký + Ký (Finance_Approved → Pending_Sign → Signed)
 */
export const ContractReviewPanel: React.FC<ContractReviewPanelProps> = ({
    contractId,
    currentStatus,
    userRole,
    onAction
}) => {
    // Determine which buttons to show based on status and role
    const showLegalReview = currentStatus === 'Pending_Legal' &&
        (userRole === 'Legal' || userRole === 'Leadership');

    const showFinanceReview = currentStatus === 'Pending_Finance' &&
        (userRole === 'Accountant' || userRole === 'ChiefAccountant' || userRole === 'Leadership');

    const showSubmitSign = currentStatus === 'Finance_Approved' && userRole === 'Leadership';

    const showSign = currentStatus === 'Pending_Sign' && userRole === 'Leadership';

    if (!showLegalReview && !showFinanceReview && !showSubmitSign && !showSign) {
        return null;
    }

    return (
        <div className="flex gap-2 flex-wrap">
            {/* LEGAL REVIEW */}
            {showLegalReview && (
                <div className="flex gap-2 items-center bg-violet-50 rounded-xl p-1 pr-2 border border-violet-200">
                    <Gavel size={14} className="text-violet-600 ml-2" />
                    <span className="text-[10px] font-bold text-violet-600 uppercase mr-2">
                        Duyệt Pháp lý
                    </span>
                    <button
                        onClick={() => onAction('RejectLegal')}
                        className="px-3 py-1.5 bg-white text-rose-600 rounded-lg hover:bg-rose-50 font-bold text-xs shadow-sm border border-slate-200 transition-colors flex items-center gap-1"
                    >
                        <X size={12} /> Từ chối
                    </button>
                    <button
                        onClick={() => onAction('ApproveLegal')}
                        className="px-3 py-1.5 bg-violet-600 text-white rounded-lg hover:bg-violet-700 font-bold text-xs shadow-sm flex items-center gap-1 transition-colors"
                    >
                        <Check size={12} /> Duyệt
                    </button>
                </div>
            )}

            {/* FINANCE REVIEW */}
            {showFinanceReview && (
                <div className="flex gap-2 items-center bg-emerald-50 rounded-xl p-1 pr-2 border border-emerald-200">
                    <Calculator size={14} className="text-emerald-600 ml-2" />
                    <span className="text-[10px] font-bold text-emerald-600 uppercase mr-2">
                        Duyệt Tài chính
                    </span>
                    <button
                        onClick={() => onAction('RejectFinance')}
                        className="px-3 py-1.5 bg-white text-rose-600 rounded-lg hover:bg-rose-50 font-bold text-xs shadow-sm border border-slate-200 transition-colors flex items-center gap-1"
                    >
                        <X size={12} /> Từ chối
                    </button>
                    <button
                        onClick={() => onAction('ApproveFinance')}
                        className="px-3 py-1.5 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 font-bold text-xs shadow-sm flex items-center gap-1 transition-colors"
                    >
                        <Check size={12} /> Duyệt
                    </button>
                </div>
            )}

            {/* SUBMIT FOR SIGNATURE */}
            {showSubmitSign && (
                <button
                    onClick={() => onAction('SubmitSign')}
                    className="px-4 py-2 bg-amber-600 text-white rounded-xl hover:bg-amber-700 font-medium text-sm flex items-center gap-2 transition-colors shadow-lg shadow-amber-200"
                >
                    <Signature size={16} /> Trình ký
                </button>
            )}

            {/* SIGN */}
            {showSign && (
                <button
                    onClick={() => onAction('Sign')}
                    className="px-4 py-2 bg-purple-600 text-white rounded-xl hover:bg-purple-700 font-medium text-sm flex items-center gap-2 transition-colors shadow-lg shadow-purple-200"
                >
                    <Signature size={16} /> Ký hợp đồng
                </button>
            )}
        </div>
    );
};
