import React, { useState } from 'react';
import { Check, X, Gavel, Calculator, Signature, Send, Eye, Loader2 } from 'lucide-react';

interface ContractReviewPanelProps {
    contractId: string;
    currentStatus: string;
    userRole: string;
    onAction: (action: 'SubmitLegal' | 'ApproveLegal' | 'RejectLegal' | 'ApproveFinance' | 'RejectFinance' | 'SubmitSign' | 'Sign') => void;
}

/**
 * ContractReviewPanel - Hiển thị các nút duyệt theo quy trình:
 * Draft/Pending → Pending_Legal → Pending_Finance → Finance_Approved → Pending_Sign → Active
 * 
 * Phân quyền:
 * - Admin/Leadership: Thấy TẤT CẢ và có thể thực hiện mọi thao tác
 * - NVKD/UnitLeader: Gửi duyệt (Draft/Pending → Pending_Legal)
 * - Legal: Duyệt pháp lý (Pending_Legal)
 * - Accountant/ChiefAccountant: Duyệt tài chính (Pending_Finance)
 */
export const ContractReviewPanel: React.FC<ContractReviewPanelProps> = ({
    contractId,
    currentStatus,
    userRole,
    onAction
}) => {
    // Loading state for buttons
    const [loadingAction, setLoadingAction] = useState<string | null>(null);

    const handleAction = async (action: Parameters<typeof onAction>[0]) => {
        setLoadingAction(action);
        try {
            await onAction(action);
        } finally {
            setLoadingAction(null);
        }
    };

    // Admin/Leadership có quyền thấy và thao tác tất cả
    const isAdmin = userRole === 'Admin' || userRole === 'Leadership';

    // Điều kiện hiển thị các nút
    const showSubmitLegal = (currentStatus === 'Draft' || currentStatus === 'Pending') &&
        (isAdmin || userRole === 'NVKD' || userRole === 'UnitLeader');

    const showLegalReview = currentStatus === 'Pending_Legal' &&
        (isAdmin || userRole === 'Legal');

    const showFinanceReview = currentStatus === 'Pending_Finance' &&
        (isAdmin || userRole === 'Accountant' || userRole === 'ChiefAccountant');

    const showSubmitSign = currentStatus === 'Finance_Approved' && isAdmin;

    const showSign = currentStatus === 'Pending_Sign' && isAdmin;

    // Status display cho Admin
    const statusLabels: Record<string, { label: string; color: string }> = {
        'Draft': { label: 'Nháp', color: 'bg-slate-100 text-slate-600' },
        'Pending': { label: 'Chờ xử lý', color: 'bg-amber-100 text-amber-700' },
        'Pending_Legal': { label: 'Chờ Pháp lý duyệt', color: 'bg-violet-100 text-violet-700' },
        'Pending_Finance': { label: 'Chờ Tài chính duyệt', color: 'bg-emerald-100 text-emerald-700' },
        'Finance_Approved': { label: 'Đã duyệt TC', color: 'bg-blue-100 text-blue-700' },
        'Pending_Sign': { label: 'Chờ ký', color: 'bg-purple-100 text-purple-700' },
        'Active': { label: 'Đang hiệu lực', color: 'bg-green-100 text-green-700' },
        'Completed': { label: 'Hoàn thành', color: 'bg-gray-100 text-gray-700' },
    };

    const hasAnyAction = showSubmitLegal || showLegalReview || showFinanceReview || showSubmitSign || showSign;

    // Không có action nào và không phải Admin thì ẩn
    if (!hasAnyAction && !isAdmin) {
        return null;
    }

    return (
        <div className="flex gap-3 flex-wrap items-center">
            {/* ADMIN STATUS INDICATOR */}
            {isAdmin && (
                <div className="flex items-center gap-2 text-xs">
                    <Eye size={14} className="text-slate-400" />
                    <span className="text-slate-500">Workflow:</span>
                    <span className={`px-2 py-0.5 rounded-full font-medium ${statusLabels[currentStatus]?.color || 'bg-slate-100 text-slate-600'}`}>
                        {statusLabels[currentStatus]?.label || currentStatus}
                    </span>
                </div>
            )}

            {/* SUBMIT FOR LEGAL REVIEW (Draft/Pending → Pending_Legal) */}
            {showSubmitLegal && (
                <button
                    onClick={() => handleAction('SubmitLegal')}
                    disabled={!!loadingAction}
                    className="px-4 py-2 bg-blue-600 text-white rounded-xl hover:bg-blue-700 font-medium text-sm flex items-center gap-2 transition-colors shadow-lg shadow-blue-200 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                    {loadingAction === 'SubmitLegal' ? <Loader2 size={16} className="animate-spin" /> : <Send size={16} />}
                    Gửi duyệt Pháp lý
                </button>
            )}

            {/* LEGAL REVIEW */}
            {showLegalReview && (
                <div className="flex gap-2 items-center bg-violet-50 rounded-xl p-1 pr-2 border border-violet-200">
                    <Gavel size={14} className="text-violet-600 ml-2" />
                    <span className="text-[10px] font-bold text-violet-600 uppercase mr-2">
                        Duyệt Pháp lý
                    </span>
                    <button
                        onClick={() => handleAction('RejectLegal')}
                        disabled={!!loadingAction}
                        className="px-3 py-1.5 bg-white text-rose-600 rounded-lg hover:bg-rose-50 font-bold text-xs shadow-sm border border-slate-200 transition-colors flex items-center gap-1 disabled:opacity-50"
                    >
                        {loadingAction === 'RejectLegal' ? <Loader2 size={12} className="animate-spin" /> : <X size={12} />} Từ chối
                    </button>
                    <button
                        onClick={() => handleAction('ApproveLegal')}
                        disabled={!!loadingAction}
                        className="px-3 py-1.5 bg-violet-600 text-white rounded-lg hover:bg-violet-700 font-bold text-xs shadow-sm flex items-center gap-1 transition-colors disabled:opacity-50"
                    >
                        {loadingAction === 'ApproveLegal' ? <Loader2 size={12} className="animate-spin" /> : <Check size={12} />} Duyệt
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
                        onClick={() => handleAction('RejectFinance')}
                        disabled={!!loadingAction}
                        className="px-3 py-1.5 bg-white text-rose-600 rounded-lg hover:bg-rose-50 font-bold text-xs shadow-sm border border-slate-200 transition-colors flex items-center gap-1 disabled:opacity-50"
                    >
                        {loadingAction === 'RejectFinance' ? <Loader2 size={12} className="animate-spin" /> : <X size={12} />} Từ chối
                    </button>
                    <button
                        onClick={() => handleAction('ApproveFinance')}
                        disabled={!!loadingAction}
                        className="px-3 py-1.5 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 font-bold text-xs shadow-sm flex items-center gap-1 transition-colors disabled:opacity-50"
                    >
                        {loadingAction === 'ApproveFinance' ? <Loader2 size={12} className="animate-spin" /> : <Check size={12} />} Duyệt
                    </button>
                </div>
            )}

            {/* SUBMIT FOR SIGNATURE */}
            {showSubmitSign && (
                <button
                    onClick={() => handleAction('SubmitSign')}
                    disabled={!!loadingAction}
                    className="px-4 py-2 bg-amber-600 text-white rounded-xl hover:bg-amber-700 font-medium text-sm flex items-center gap-2 transition-colors shadow-lg shadow-amber-200 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                    {loadingAction === 'SubmitSign' ? <Loader2 size={16} className="animate-spin" /> : <Signature size={16} />}
                    Trình ký
                </button>
            )}

            {/* SIGN */}
            {showSign && (
                <button
                    onClick={() => handleAction('Sign')}
                    disabled={!!loadingAction}
                    className="px-4 py-2 bg-purple-600 text-white rounded-xl hover:bg-purple-700 font-medium text-sm flex items-center gap-2 transition-colors shadow-lg shadow-purple-200 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                    {loadingAction === 'Sign' ? <Loader2 size={16} className="animate-spin" /> : <Signature size={16} />}
                    Ký hợp đồng
                </button>
            )}
        </div>
    );
};
