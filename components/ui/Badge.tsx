import React from 'react';

export type BadgeVariant = 'default' | 'primary' | 'success' | 'warning' | 'danger' | 'info' | 'outline';
export type BadgeSize = 'xs' | 'sm' | 'md';

interface BadgeProps extends React.HTMLAttributes<HTMLSpanElement> {
    variant?: BadgeVariant;
    size?: BadgeSize;
    dot?: boolean;
    icon?: React.ReactNode;
}

const variantStyles: Record<BadgeVariant, string> = {
    default: `
    bg-slate-100 text-slate-600
    dark:bg-slate-800 dark:text-slate-300
  `,
    primary: `
    bg-orange-100 text-orange-700
    dark:bg-orange-900/30 dark:text-orange-400
  `,
    success: `
    bg-emerald-100 text-emerald-700
    dark:bg-emerald-900/30 dark:text-emerald-400
  `,
    warning: `
    bg-amber-100 text-amber-700
    dark:bg-amber-900/30 dark:text-amber-400
  `,
    danger: `
    bg-red-100 text-red-700
    dark:bg-red-900/30 dark:text-red-400
  `,
    info: `
    bg-blue-100 text-blue-700
    dark:bg-blue-900/30 dark:text-blue-400
  `,
    outline: `
    bg-transparent border border-slate-300 text-slate-600
    dark:border-slate-600 dark:text-slate-300
  `,
};

const sizeStyles: Record<BadgeSize, string> = {
    xs: 'px-1.5 py-0.5 text-[10px] rounded',
    sm: 'px-2 py-0.5 text-xs rounded-md',
    md: 'px-2.5 py-1 text-sm rounded-lg',
};

const dotSizes: Record<BadgeSize, string> = {
    xs: 'w-1.5 h-1.5',
    sm: 'w-2 h-2',
    md: 'w-2.5 h-2.5',
};

const Badge: React.FC<BadgeProps> = ({
    children,
    variant = 'default',
    size = 'sm',
    dot = false,
    icon,
    className = '',
    ...props
}) => {
    return (
        <span
            className={`
        inline-flex items-center gap-1.5
        font-semibold uppercase tracking-wide
        ${variantStyles[variant]}
        ${sizeStyles[size]}
        ${className}
      `.trim().replace(/\s+/g, ' ')}
            {...props}
        >
            {dot && (
                <span
                    className={`
            ${dotSizes[size]} 
            rounded-full 
            ${variant === 'success' ? 'bg-emerald-500' : ''}
            ${variant === 'warning' ? 'bg-amber-500' : ''}
            ${variant === 'danger' ? 'bg-red-500' : ''}
            ${variant === 'info' ? 'bg-blue-500' : ''}
            ${variant === 'primary' ? 'bg-orange-500' : ''}
            ${variant === 'default' ? 'bg-slate-500' : ''}
            ${variant === 'outline' ? 'bg-slate-400' : ''}
          `}
                />
            )}
            {icon && <span className="flex-shrink-0">{icon}</span>}
            {children}
        </span>
    );
};

export default Badge;

// Status badge presets for common use cases
export const StatusBadge: React.FC<{ status: string; size?: BadgeSize }> = ({ status, size = 'sm' }) => {
    const getVariant = (): BadgeVariant => {
        const s = status.toLowerCase();
        if (s.includes('active') || s.includes('hoàn thành') || s.includes('approved') || s.includes('completed')) return 'success';
        if (s.includes('pending') || s.includes('chờ') || s.includes('reviewing') || s.includes('đang')) return 'warning';
        if (s.includes('expired') || s.includes('hết hạn') || s.includes('rejected') || s.includes('cancelled')) return 'danger';
        if (s.includes('new') || s.includes('mới') || s.includes('draft')) return 'info';
        return 'default';
    };

    return (
        <Badge variant={getVariant()} size={size} dot>
            {status}
        </Badge>
    );
};
