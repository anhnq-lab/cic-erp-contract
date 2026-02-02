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
 * CIC ERP Logo Component - EXACT Replica of Original
 * 
 * Thick horizontal stripes forming CIC letters
 * C letters have curved appearance through varying bar lengths
 */
const CICLogo: React.FC<CICLogoProps> = ({
    size = 'md',
    variant = 'full',
    className = ''
}) => {
    // Size configurations
    const sizeConfig = {
        xs: { scale: 0.32, erpSize: 9, gap: 3 },
        sm: { scale: 0.42, erpSize: 12, gap: 5 },
        md: { scale: 0.55, erpSize: 15, gap: 7 },
        lg: { scale: 0.75, erpSize: 19, gap: 9 },
        xl: { scale: 0.95, erpSize: 24, gap: 12 },
    };

    const config = sizeConfig[size];
    const baseWidth = 130;
    const baseHeight = 95;

    return (
        <div className={`inline-flex items-center ${className}`} style={{ gap: config.gap }}>
            {/* CIC Logo - EXACT replica with thick stripes */}
            <svg
                width={baseWidth * config.scale}
                height={baseHeight * config.scale}
                viewBox="0 0 130 95"
                fill="none"
                xmlns="http://www.w3.org/2000/svg"
                className="flex-shrink-0"
            >
                {/* Outer Border - Red */}
                <rect
                    x="2"
                    y="2"
                    width="126"
                    height="91"
                    rx="3"
                    fill="none"
                    stroke="#C53030"
                    strokeWidth="3"
                />

                {/* Inner Background */}
                <rect
                    x="5"
                    y="5"
                    width="120"
                    height="85"
                    rx="1"
                    className="fill-white dark:fill-slate-900"
                />

                {/* ===== CIC LETTERS - THICK STRIPES ===== */}
                {/* Each bar is 8px tall with 1px gap = very thick and tight */}

                {/* === LETTER C (LEFT) === */}
                {/* Top bar - full width */}
                <rect x="12" y="12" width="30" height="8" fill="#E85D04" rx="1" />
                {/* Row 2 - curved (shorter on right) */}
                <rect x="12" y="21" width="22" height="8" fill="#E85D04" rx="1" />
                {/* Row 3 - curved (even shorter) */}
                <rect x="12" y="30" width="16" height="8" fill="#E85D04" rx="1" />
                {/* Row 4 - curved (shortest - middle) */}
                <rect x="12" y="39" width="14" height="8" fill="#E85D04" rx="1" />
                {/* Row 5 - curved (even shorter) */}
                <rect x="12" y="48" width="16" height="8" fill="#E85D04" rx="1" />
                {/* Row 6 - curved (shorter on right) */}
                <rect x="12" y="57" width="22" height="8" fill="#E85D04" rx="1" />
                {/* Bottom bar - full width */}
                <rect x="12" y="66" width="30" height="8" fill="#E85D04" rx="1" />

                {/* === LETTER I (CENTER) === */}
                {/* Top bar - wide */}
                <rect x="48" y="12" width="34" height="8" fill="#E85D04" rx="1" />
                {/* Row 2 - stem only */}
                <rect x="57" y="21" width="16" height="8" fill="#E85D04" rx="1" />
                {/* Row 3 - stem */}
                <rect x="57" y="30" width="16" height="8" fill="#E85D04" rx="1" />
                {/* Row 4 - stem */}
                <rect x="57" y="39" width="16" height="8" fill="#E85D04" rx="1" />
                {/* Row 5 - stem */}
                <rect x="57" y="48" width="16" height="8" fill="#E85D04" rx="1" />
                {/* Row 6 - stem */}
                <rect x="57" y="57" width="16" height="8" fill="#E85D04" rx="1" />
                {/* Bottom bar - wide */}
                <rect x="48" y="66" width="34" height="8" fill="#E85D04" rx="1" />

                {/* === LETTER C (RIGHT) === */}
                {/* Top bar - full width */}
                <rect x="88" y="12" width="30" height="8" fill="#E85D04" rx="1" />
                {/* Row 2 - curved */}
                <rect x="88" y="21" width="22" height="8" fill="#E85D04" rx="1" />
                {/* Row 3 - curved */}
                <rect x="88" y="30" width="16" height="8" fill="#E85D04" rx="1" />
                {/* Row 4 - curved (middle) */}
                <rect x="88" y="39" width="14" height="8" fill="#E85D04" rx="1" />
                {/* Row 5 - curved */}
                <rect x="88" y="48" width="16" height="8" fill="#E85D04" rx="1" />
                {/* Row 6 - curved */}
                <rect x="88" y="57" width="22" height="8" fill="#E85D04" rx="1" />
                {/* Bottom bar - full width */}
                <rect x="88" y="66" width="30" height="8" fill="#E85D04" rx="1" />

                {/* SINCE 1990 Text */}
                <text
                    x="65"
                    y="84"
                    textAnchor="middle"
                    fill="#C53030"
                    style={{
                        fontSize: '9px',
                        fontWeight: 700,
                        fontFamily: "'Inter', 'Segoe UI', system-ui, sans-serif",
                        letterSpacing: '1.5px',
                    }}
                >
                    SINCE 1990
                </text>
            </svg>

            {/* ERP Text (only for full variant) */}
            {variant === 'full' && (
                <span
                    className="font-bold tracking-wide text-slate-700 dark:text-slate-200"
                    style={{
                        fontSize: config.erpSize,
                        fontFamily: "'Inter', 'Segoe UI', system-ui, sans-serif",
                    }}
                >
                    ERP
                </span>
            )}
        </div>
    );
};

export default CICLogo;

/**
 * Compact CIC Icon for collapsed sidebar - EXACT replica
 */
export const CICLogoIcon: React.FC<{ size?: number; className?: string }> = ({
    size = 44,
    className = ''
}) => (
    <svg
        width={size}
        height={size * 0.73}
        viewBox="0 0 130 95"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        className={className}
    >
        {/* Border */}
        <rect
            x="2"
            y="2"
            width="126"
            height="91"
            rx="3"
            fill="none"
            stroke="#C53030"
            strokeWidth="3"
        />
        {/* Background */}
        <rect
            x="5"
            y="5"
            width="120"
            height="85"
            rx="1"
            className="fill-white dark:fill-slate-900"
        />

        {/* C LEFT - curved stripes */}
        <rect x="12" y="12" width="30" height="8" fill="#E85D04" rx="1" />
        <rect x="12" y="21" width="22" height="8" fill="#E85D04" rx="1" />
        <rect x="12" y="30" width="16" height="8" fill="#E85D04" rx="1" />
        <rect x="12" y="39" width="14" height="8" fill="#E85D04" rx="1" />
        <rect x="12" y="48" width="16" height="8" fill="#E85D04" rx="1" />
        <rect x="12" y="57" width="22" height="8" fill="#E85D04" rx="1" />
        <rect x="12" y="66" width="30" height="8" fill="#E85D04" rx="1" />

        {/* I CENTER */}
        <rect x="48" y="12" width="34" height="8" fill="#E85D04" rx="1" />
        <rect x="57" y="21" width="16" height="8" fill="#E85D04" rx="1" />
        <rect x="57" y="30" width="16" height="8" fill="#E85D04" rx="1" />
        <rect x="57" y="39" width="16" height="8" fill="#E85D04" rx="1" />
        <rect x="57" y="48" width="16" height="8" fill="#E85D04" rx="1" />
        <rect x="57" y="57" width="16" height="8" fill="#E85D04" rx="1" />
        <rect x="48" y="66" width="34" height="8" fill="#E85D04" rx="1" />

        {/* C RIGHT - curved stripes */}
        <rect x="88" y="12" width="30" height="8" fill="#E85D04" rx="1" />
        <rect x="88" y="21" width="22" height="8" fill="#E85D04" rx="1" />
        <rect x="88" y="30" width="16" height="8" fill="#E85D04" rx="1" />
        <rect x="88" y="39" width="14" height="8" fill="#E85D04" rx="1" />
        <rect x="88" y="48" width="16" height="8" fill="#E85D04" rx="1" />
        <rect x="88" y="57" width="22" height="8" fill="#E85D04" rx="1" />
        <rect x="88" y="66" width="30" height="8" fill="#E85D04" rx="1" />

        {/* SINCE 1990 */}
        <text
            x="65"
            y="84"
            textAnchor="middle"
            fill="#C53030"
            style={{
                fontSize: '9px',
                fontWeight: 700,
                fontFamily: "'Inter', 'Segoe UI', system-ui, sans-serif",
                letterSpacing: '1.5px',
            }}
        >
            SINCE 1990
        </text>
    </svg>
);
