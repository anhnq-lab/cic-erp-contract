import React from 'react';

interface CICLogoProps {
    /** Logo size variant */
    size?: 'xs' | 'sm' | 'md' | 'lg' | 'xl';
    /** Show full logo with ERP text, or compact CIC only */
    variant?: 'full' | 'compact';
    /** Custom className for additional styling */
    className?: string;
}

/**
 * CIC ERP Logo Component  
 * Authentic CIC striped orange logo with modern ERP styling
 * Features:
 * - Original CIC horizontal striped orange letters
 * - Rounded corners container
 * - Light/Dark mode support
 */
const CICLogo: React.FC<CICLogoProps> = ({
    size = 'md',
    variant = 'full',
    className = ''
}) => {
    // Size configurations
    const sizeConfig = {
        xs: { height: 28, cicWidth: 55, erpFontSize: 11, gap: 6 },
        sm: { height: 36, cicWidth: 70, erpFontSize: 14, gap: 8 },
        md: { height: 48, cicWidth: 95, erpFontSize: 18, gap: 10 },
        lg: { height: 64, cicWidth: 125, erpFontSize: 24, gap: 12 },
        xl: { height: 90, cicWidth: 180, erpFontSize: 32, gap: 16 },
    };

    const config = sizeConfig[size];

    return (
        <div className={`inline-flex items-center ${className}`} style={{ gap: config.gap }}>
            {/* CIC Logo with Orange Stripes - Authentic Style */}
            <svg
                width={config.cicWidth}
                height={config.height}
                viewBox="0 0 130 90"
                fill="none"
                xmlns="http://www.w3.org/2000/svg"
                className="flex-shrink-0"
            >
                <defs>
                    {/* Orange color for the letters */}
                    <linearGradient id="orangeStripe" x1="0%" y1="0%" x2="0%" y2="100%">
                        <stop offset="0%" stopColor="#E85D04" />
                        <stop offset="100%" stopColor="#DC2F02" />
                    </linearGradient>
                </defs>

                {/* Background container with rounded corners */}
                <rect
                    x="2"
                    y="2"
                    width="126"
                    height="86"
                    rx="12"
                    ry="12"
                    className="fill-white dark:fill-slate-800 stroke-slate-200 dark:stroke-slate-700"
                    strokeWidth="1.5"
                />

                {/* ===== LETTER C (LEFT) ===== */}
                <g>
                    {/* Stripe 1 */}
                    <path d="M12,18 L38,18 L38,24 L18,24 L18,30 L12,30 Z" fill="#E85D04" />
                    {/* Stripe 2 */}
                    <path d="M12,32 L18,32 L18,38 L12,38 Z" fill="#E85D04" />
                    {/* Stripe 3 */}
                    <path d="M12,40 L18,40 L18,50 L12,50 Z" fill="#E85D04" />
                    {/* Stripe 4 */}
                    <path d="M12,52 L18,52 L18,58 L12,58 Z" fill="#E85D04" />
                    {/* Stripe 5 */}
                    <path d="M12,60 L18,60 L18,66 L38,66 L38,72 L12,72 Z" fill="#E85D04" />
                </g>

                {/* ===== LETTER I (CENTER) ===== */}
                <g>
                    {/* Top bar */}
                    <rect x="46" y="18" width="38" height="6" fill="#E85D04" />
                    {/* Stripe 1 */}
                    <rect x="58" y="26" width="14" height="6" fill="#E85D04" />
                    {/* Stripe 2 */}
                    <rect x="58" y="34" width="14" height="6" fill="#E85D04" />
                    {/* Stripe 3 */}
                    <rect x="58" y="42" width="14" height="6" fill="#E85D04" />
                    {/* Stripe 4 */}
                    <rect x="58" y="50" width="14" height="6" fill="#E85D04" />
                    {/* Stripe 5 */}
                    <rect x="58" y="58" width="14" height="6" fill="#E85D04" />
                    {/* Bottom bar */}
                    <rect x="46" y="66" width="38" height="6" fill="#E85D04" />
                </g>

                {/* ===== LETTER C (RIGHT) ===== */}
                <g>
                    {/* Stripe 1 */}
                    <path d="M92,18 L118,18 L118,24 L98,24 L98,30 L92,30 Z" fill="#E85D04" />
                    {/* Stripe 2 */}
                    <path d="M92,32 L98,32 L98,38 L92,38 Z" fill="#E85D04" />
                    {/* Stripe 3 */}
                    <path d="M92,40 L98,40 L98,50 L92,50 Z" fill="#E85D04" />
                    {/* Stripe 4 */}
                    <path d="M92,52 L98,52 L98,58 L92,58 Z" fill="#E85D04" />
                    {/* Stripe 5 */}
                    <path d="M92,60 L98,60 L98,66 L118,66 L118,72 L92,72 Z" fill="#E85D04" />
                </g>
            </svg>

            {/* ERP Text (only for full variant) */}
            {variant === 'full' && (
                <span
                    className="font-bold tracking-[0.2em] text-slate-700 dark:text-slate-200"
                    style={{ fontSize: config.erpFontSize }}
                >
                    ERP
                </span>
            )}
        </div>
    );
};

export default CICLogo;

// Icon only version for sidebar collapsed state
export const CICLogoIcon: React.FC<{ size?: number; className?: string }> = ({
    size = 32,
    className = ''
}) => (
    <svg
        width={size}
        height={size}
        viewBox="0 0 90 90"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        className={className}
    >
        {/* Background */}
        <rect
            x="2"
            y="2"
            width="86"
            height="86"
            rx="14"
            ry="14"
            className="fill-white dark:fill-slate-800 stroke-slate-200 dark:stroke-slate-700"
            strokeWidth="1.5"
        />

        {/* Simplified C letter with stripes */}
        <g>
            <rect x="20" y="20" width="50" height="8" rx="2" fill="#E85D04" />
            <rect x="20" y="30" width="12" height="8" fill="#E85D04" />
            <rect x="20" y="40" width="12" height="10" fill="#E85D04" />
            <rect x="20" y="52" width="12" height="8" fill="#E85D04" />
            <rect x="20" y="62" width="50" height="8" rx="2" fill="#E85D04" />
        </g>
    </svg>
);
