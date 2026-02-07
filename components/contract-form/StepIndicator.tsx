import React from 'react';

interface StepIndicatorProps {
    currentStep: number;
    totalSteps?: number;
    steps?: { label: string }[];
}

const defaultSteps = [
    { label: 'Thông tin chung' },
    { label: 'Kinh doanh & Chi phí' },
    { label: 'Tài chính & Hoàn tất' },
];

const StepIndicator: React.FC<StepIndicatorProps> = ({
    currentStep,
    totalSteps = 3,
    steps = defaultSteps,
}) => {
    return (
        <div className="px-10 py-4 bg-white dark:bg-slate-900 border-b border-slate-100 dark:border-slate-800">
            <div className="flex items-center justify-between max-w-3xl mx-auto relative">
                {/* Progress Bar Background */}
                <div className="absolute top-1/2 left-0 w-full h-1 bg-slate-100 dark:bg-slate-800 -z-0 rounded-full" />

                {/* Active Progress */}
                <div
                    className="absolute top-1/2 left-0 h-1 bg-indigo-600 transition-all duration-300 -z-0 rounded-full"
                    style={{ width: `${((currentStep - 1) / (totalSteps - 1)) * 100}%` }}
                />

                {/* Steps */}
                {steps.map((step, index) => {
                    const stepNum = index + 1;
                    const isActive = currentStep >= stepNum;
                    const isCurrent = currentStep === stepNum;

                    return (
                        <div key={stepNum} className="relative z-10 flex flex-col items-center gap-2">
                            <div
                                className={`
                  w-10 h-10 rounded-full flex items-center justify-center 
                  font-black border-4 transition-all duration-300
                  ${isActive
                                        ? 'bg-indigo-600 border-indigo-100 dark:border-indigo-900 text-white'
                                        : 'bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-800 text-slate-400'
                                    }
                  ${isCurrent
                                        ? 'scale-110 shadow-lg shadow-indigo-200 dark:shadow-none ring-2 ring-indigo-500 ring-offset-2 dark:ring-offset-slate-900'
                                        : ''
                                    }
                `}
                            >
                                {stepNum}
                            </div>
                            <span
                                className={`
                  text-[10px] font-bold uppercase tracking-wider 
                  transition-colors duration-300 text-center
                  ${isActive ? 'text-indigo-700 dark:text-indigo-400' : 'text-slate-400'}
                `}
                            >
                                {step.label}
                            </span>
                        </div>
                    );
                })}
            </div>
        </div>
    );
};

export default StepIndicator;
