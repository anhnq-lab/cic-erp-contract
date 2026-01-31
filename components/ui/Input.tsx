import React from 'react';
import { AlertCircle, CheckCircle2 } from 'lucide-react';

export type InputSize = 'sm' | 'md' | 'lg';

interface InputProps extends Omit<React.InputHTMLAttributes<HTMLInputElement>, 'size'> {
    label?: string;
    error?: string;
    hint?: string;
    success?: boolean;
    size?: InputSize;
    leftIcon?: React.ReactNode;
    rightIcon?: React.ReactNode;
    fullWidth?: boolean;
}

const sizeStyles: Record<InputSize, { input: string; icon: string }> = {
    sm: {
        input: 'px-3 py-2 text-sm rounded-lg',
        icon: 'w-4 h-4'
    },
    md: {
        input: 'px-4 py-2.5 text-sm rounded-xl',
        icon: 'w-4 h-4'
    },
    lg: {
        input: 'px-5 py-3 text-base rounded-xl',
        icon: 'w-5 h-5'
    },
};

const Input = React.forwardRef<HTMLInputElement, InputProps>(
    (
        {
            label,
            error,
            hint,
            success,
            size = 'md',
            leftIcon,
            rightIcon,
            fullWidth = true,
            disabled,
            className = '',
            id,
            ...props
        },
        ref
    ) => {
        const inputId = id || `input-${Math.random().toString(36).substr(2, 9)}`;
        const hasError = !!error;
        const hasSuccess = success && !hasError;

        const getBorderColor = () => {
            if (hasError) return 'border-red-500 focus:border-red-500 focus:ring-red-500/20';
            if (hasSuccess) return 'border-emerald-500 focus:border-emerald-500 focus:ring-emerald-500/20';
            return 'border-slate-200 focus:border-orange-500 focus:ring-orange-500/20 dark:border-slate-700 dark:focus:border-orange-500';
        };

        return (
            <div className={`${fullWidth ? 'w-full' : ''}`}>
                {label && (
                    <label
                        htmlFor={inputId}
                        className="block text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wide mb-1.5"
                    >
                        {label}
                    </label>
                )}

                <div className="relative">
                    {/* Left Icon */}
                    {leftIcon && (
                        <div className={`absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 ${sizeStyles[size].icon}`}>
                            {leftIcon}
                        </div>
                    )}

                    <input
                        ref={ref}
                        id={inputId}
                        disabled={disabled}
                        className={`
              ${fullWidth ? 'w-full' : ''}
              ${sizeStyles[size].input}
              ${leftIcon ? 'pl-10' : ''}
              ${rightIcon || hasError || hasSuccess ? 'pr-10' : ''}
              bg-slate-50 dark:bg-slate-800
              ${getBorderColor()}
              border
              text-slate-900 dark:text-slate-100
              placeholder:text-slate-400 dark:placeholder:text-slate-500
              font-medium
              transition-all duration-200
              focus:outline-none focus:ring-4
              disabled:opacity-50 disabled:cursor-not-allowed disabled:bg-slate-100 dark:disabled:bg-slate-800
              ${className}
            `.trim().replace(/\s+/g, ' ')}
                        {...props}
                    />

                    {/* Right Icon / Status Icon */}
                    <div className={`absolute right-3 top-1/2 -translate-y-1/2 ${sizeStyles[size].icon}`}>
                        {hasError && <AlertCircle className="text-red-500" />}
                        {hasSuccess && <CheckCircle2 className="text-emerald-500" />}
                        {!hasError && !hasSuccess && rightIcon && (
                            <span className="text-slate-400">{rightIcon}</span>
                        )}
                    </div>
                </div>

                {/* Error / Hint Message */}
                {(error || hint) && (
                    <p className={`mt-1.5 text-xs font-medium ${hasError ? 'text-red-500' : 'text-slate-400'}`}>
                        {error || hint}
                    </p>
                )}
            </div>
        );
    }
);

Input.displayName = 'Input';

export default Input;
