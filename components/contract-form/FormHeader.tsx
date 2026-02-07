import React from 'react';
import { Plus, X, Users, Hash } from 'lucide-react';

interface FormHeaderProps {
    formContractId: string;
    isEditing: boolean;
    isCloning: boolean;
    onCancel: () => void;
    onAutoFill?: () => void;
    showAutoFill?: boolean;
}

const FormHeader: React.FC<FormHeaderProps> = ({
    formContractId,
    isEditing,
    isCloning,
    onCancel,
    onAutoFill,
    showAutoFill = false,
}) => {
    const getTitle = () => {
        if (isEditing) return 'Chỉnh sửa hợp đồng';
        if (isCloning) return 'Nhân bản hợp đồng';
        return 'Khai báo hồ sơ hợp đồng';
    };

    return (
        <div className="px-10 py-6 border-b border-slate-100 dark:border-slate-800 flex justify-between items-center bg-slate-50/50 dark:bg-slate-800">
            <div className="flex items-center gap-6">
                <div className="w-14 h-14 bg-indigo-600 rounded-[20px] flex items-center justify-center text-white shadow-xl shadow-indigo-100 dark:shadow-none">
                    <Plus size={28} strokeWidth={3} />
                </div>
                <div>
                    <div className="flex items-center gap-3">
                        <h2 className="text-2xl font-black text-slate-900 dark:text-slate-100 tracking-tight">
                            {getTitle()}
                        </h2>
                        <div className="flex items-center gap-1.5 px-3 py-1 bg-indigo-100 dark:bg-indigo-900/40 text-indigo-700 dark:text-indigo-300 text-[10px] font-black rounded-lg uppercase tracking-wider">
                            <Hash size={10} /> {formContractId}
                        </div>
                    </div>
                    <p className="text-[11px] font-bold text-slate-400 uppercase tracking-widest mt-1">
                        Nghiệp vụ Quản trị & Theo dõi KPI mục tiêu
                    </p>
                </div>
            </div>

            <div className="flex items-center gap-2">
                {showAutoFill && onAutoFill && (
                    <button
                        onClick={onAutoFill}
                        className="p-3 bg-purple-100 hover:bg-purple-200 text-purple-700 rounded-xl font-bold text-xs uppercase transition-all flex items-center gap-2"
                        title="Điền dữ liệu mẫu"
                    >
                        <Users size={16} /> Data Mẫu
                    </button>
                )}
                <button
                    onClick={onCancel}
                    className="p-3 hover:bg-rose-50 dark:hover:bg-rose-900/20 rounded-xl text-slate-400 hover:text-rose-500 transition-all"
                >
                    <X size={24} />
                </button>
            </div>
        </div>
    );
};

export default FormHeader;
