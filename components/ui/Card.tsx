import React from 'react';

export type CardVariant = 'default' | 'elevated' | 'outline' | 'interactive';

interface CardProps extends React.HTMLAttributes<HTMLDivElement> {
    variant?: CardVariant;
    padding?: 'none' | 'sm' | 'md' | 'lg';
    noBorder?: boolean;
}

const variantStyles: Record<CardVariant, string> = {
    default: `
    bg-white dark:bg-slate-900
    border border-slate-200 dark:border-slate-700/40
  `,
    elevated: `
    bg-white dark:bg-slate-900
    border border-slate-100 dark:border-slate-700/40
    shadow-lg dark:shadow-2xl
  `,
    outline: `
    bg-transparent
    border border-dashed border-slate-300 dark:border-slate-700/60
  `,
    interactive: `
    bg-white dark:bg-slate-900
    border border-slate-200 dark:border-slate-700/40
    hover:border-orange-300 dark:hover:border-orange-700/50
    hover:shadow-lg dark:hover:shadow-xl
    cursor-pointer
    transition-all duration-200
  `,
};

const paddingStyles: Record<string, string> = {
    none: '',
    sm: 'p-3',
    md: 'p-4 sm:p-6',
    lg: 'p-6 sm:p-8',
};

const Card: React.FC<CardProps> = ({
    children,
    variant = 'default',
    padding = 'md',
    noBorder = false,
    className = '',
    ...props
}) => {
    return (
        <div
            className={`
        rounded-lg
        ${variantStyles[variant]}
        ${paddingStyles[padding]}
        ${noBorder ? 'border-0' : ''}
        ${className}
      `.trim().replace(/\s+/g, ' ')}
            {...props}
        >
            {children}
        </div>
    );
};

// Card subcomponents
interface CardHeaderProps extends React.HTMLAttributes<HTMLDivElement> {
    title?: string;
    subtitle?: string;
    action?: React.ReactNode;
}

export const CardHeader: React.FC<CardHeaderProps> = ({
    title,
    subtitle,
    action,
    children,
    className = '',
    ...props
}) => {
    return (
        <div
            className={`flex items-start justify-between gap-4 ${className}`}
            {...props}
        >
            {children || (
                <div>
                    {title && (
                        <h3 className="text-lg font-bold text-slate-800 dark:text-slate-100">
                            {title}
                        </h3>
                    )}
                    {subtitle && (
                        <p className="text-sm text-slate-500 dark:text-slate-400 mt-0.5">
                            {subtitle}
                        </p>
                    )}
                </div>
            )}
            {action && <div className="flex-shrink-0">{action}</div>}
        </div>
    );
};

interface CardContentProps extends React.HTMLAttributes<HTMLDivElement> { }

export const CardContent: React.FC<CardContentProps> = ({
    children,
    className = '',
    ...props
}) => {
    return (
        <div className={`mt-4 ${className}`} {...props}>
            {children}
        </div>
    );
};

interface CardFooterProps extends React.HTMLAttributes<HTMLDivElement> { }

export const CardFooter: React.FC<CardFooterProps> = ({
    children,
    className = '',
    ...props
}) => {
    return (
        <div
            className={`
        mt-6 pt-4 
        border-t border-slate-100 dark:border-slate-800
        flex items-center justify-end gap-3
        ${className}
      `.trim().replace(/\s+/g, ' ')}
            {...props}
        >
            {children}
        </div>
    );
};

// Stat Card for dashboard metrics
interface StatCardProps {
    title: string;
    value: string | number;
    subtitle?: string;
    icon?: React.ReactNode;
    trend?: { value: number; isPositive: boolean };
    className?: string;
}

export const StatCard: React.FC<StatCardProps> = ({
    title,
    value,
    subtitle,
    icon,
    trend,
    className = '',
}) => {
    return (
        <Card variant="default" padding="md" className={className}>
            <div className="flex items-start justify-between">
                <div>
                    <p className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wide">
                        {title}
                    </p>
                    <p className="text-2xl font-black text-slate-800 dark:text-slate-100 mt-2">
                        {value}
                    </p>
                    {subtitle && (
                        <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
                            {subtitle}
                        </p>
                    )}
                    {trend && (
                        <p className={`text-sm font-semibold mt-2 ${trend.isPositive ? 'text-emerald-600' : 'text-red-600'}`}>
                            {trend.isPositive ? '↑' : '↓'} {Math.abs(trend.value)}%
                        </p>
                    )}
                </div>
                {icon && (
                    <div className="w-12 h-12 bg-orange-100 dark:bg-orange-900/30 rounded-lg flex items-center justify-center text-orange-600 dark:text-orange-400">
                        {icon}
                    </div>
                )}
            </div>
        </Card>
    );
};

export default Card;
