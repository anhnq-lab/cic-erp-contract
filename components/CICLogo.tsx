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
 * CIC ERP Logo Component - 100% EXACT Replica
 * 
 * Both C letters have the SAME shape - opening to the RIGHT
 * This matches the original logo exactly
 */
const CICLogo: React.FC<CICLogoProps> = ({
    size = 'md',
    variant = 'full',
    className = ''
}) => {
    // Size configurations  
    const sizeConfig = {
        xs: { scale: 0.22, erpSize: 10, gap: 4 },
        sm: { scale: 0.30, erpSize: 13, gap: 6 },
        md: { scale: 0.40, erpSize: 16, gap: 8 },
        lg: { scale: 0.55, erpSize: 20, gap: 10 },
        xl: { scale: 0.70, erpSize: 26, gap: 14 },
    };

    const config = sizeConfig[size];

    return (
        <div className={`inline-flex items-center ${className}`} style={{ gap: config.gap }}>
            {/* CIC Logo - 100% EXACT replica from original */}
            <svg
                width={220 * config.scale}
                height={130 * config.scale}
                viewBox="0 0 220 130"
                fill="none"
                xmlns="http://www.w3.org/2000/svg"
                className="flex-shrink-0"
            >
                {/* ===== CIC LETTERS - EXACT COPY ===== */}
                {/* 9 rows, bar height 11px, gap ~2px */}

                {/* === LETTER C (LEFT) - Opens RIGHT === */}
                {/* All bars start from x=5, varying widths creating curve on right side */}
                <rect x="5" y="5" width="55" height="11" fill="#E8612D" rx="1" />
                <rect x="5" y="18" width="48" height="11" fill="#E8612D" rx="1" />
                <rect x="5" y="31" width="38" height="11" fill="#E8612D" rx="1" />
                <rect x="5" y="44" width="28" height="11" fill="#E8612D" rx="1" />
                <rect x="5" y="57" width="22" height="11" fill="#E8612D" rx="1" />
                <rect x="5" y="70" width="28" height="11" fill="#E8612D" rx="1" />
                <rect x="5" y="83" width="38" height="11" fill="#E8612D" rx="1" />
                <rect x="5" y="96" width="48" height="11" fill="#E8612D" rx="1" />
                <rect x="5" y="109" width="55" height="11" fill="#E8612D" rx="1" />

                {/* === LETTER I (CENTER) === */}
                {/* Top/bottom bars full width, middle bars narrower and centered */}
                <rect x="70" y="5" width="60" height="11" fill="#E8612D" rx="1" />
                <rect x="78" y="18" width="44" height="11" fill="#E8612D" rx="1" />
                <rect x="85" y="31" width="30" height="11" fill="#E8612D" rx="1" />
                <rect x="85" y="44" width="30" height="11" fill="#E8612D" rx="1" />
                <rect x="85" y="57" width="30" height="11" fill="#E8612D" rx="1" />
                <rect x="85" y="70" width="30" height="11" fill="#E8612D" rx="1" />
                <rect x="85" y="83" width="30" height="11" fill="#E8612D" rx="1" />
                <rect x="78" y="96" width="44" height="11" fill="#E8612D" rx="1" />
                <rect x="70" y="109" width="60" height="11" fill="#E8612D" rx="1" />

                {/* === LETTER C (RIGHT) - SAME as left C, opens RIGHT === */}
                {/* This is the key - both C letters have identical shape! */}
                <rect x="140" y="5" width="55" height="11" fill="#E8612D" rx="1" />
                <rect x="140" y="18" width="48" height="11" fill="#E8612D" rx="1" />
                <rect x="140" y="31" width="38" height="11" fill="#E8612D" rx="1" />
                <rect x="140" y="44" width="28" height="11" fill="#E8612D" rx="1" />
                <rect x="140" y="57" width="22" height="11" fill="#E8612D" rx="1" />
                <rect x="140" y="70" width="28" height="11" fill="#E8612D" rx="1" />
                <rect x="140" y="83" width="38" height="11" fill="#E8612D" rx="1" />
                <rect x="140" y="96" width="48" height="11" fill="#E8612D" rx="1" />
                <rect x="140" y="109" width="55" height="11" fill="#E8612D" rx="1" />

                {/* No border, no SINCE 1990 in this version - clean CIC only */}
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
 * Compact CIC Icon for collapsed sidebar
 */
export const CICLogoIcon: React.FC<{ size?: number; className?: string }> = ({
    size = 50,
    className = ''
}) => (
    <svg
        width={size}
        height={size * 0.57}
        viewBox="0 0 220 125"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        className={className}
    >
        {/* C LEFT */}
        <rect x="5" y="5" width="55" height="11" fill="#E8612D" rx="1" />
        <rect x="5" y="18" width="48" height="11" fill="#E8612D" rx="1" />
        <rect x="5" y="31" width="38" height="11" fill="#E8612D" rx="1" />
        <rect x="5" y="44" width="28" height="11" fill="#E8612D" rx="1" />
        <rect x="5" y="57" width="22" height="11" fill="#E8612D" rx="1" />
        <rect x="5" y="70" width="28" height="11" fill="#E8612D" rx="1" />
        <rect x="5" y="83" width="38" height="11" fill="#E8612D" rx="1" />
        <rect x="5" y="96" width="48" height="11" fill="#E8612D" rx="1" />
        <rect x="5" y="109" width="55" height="11" fill="#E8612D" rx="1" />

        {/* I CENTER */}
        <rect x="70" y="5" width="60" height="11" fill="#E8612D" rx="1" />
        <rect x="78" y="18" width="44" height="11" fill="#E8612D" rx="1" />
        <rect x="85" y="31" width="30" height="11" fill="#E8612D" rx="1" />
        <rect x="85" y="44" width="30" height="11" fill="#E8612D" rx="1" />
        <rect x="85" y="57" width="30" height="11" fill="#E8612D" rx="1" />
        <rect x="85" y="70" width="30" height="11" fill="#E8612D" rx="1" />
        <rect x="85" y="83" width="30" height="11" fill="#E8612D" rx="1" />
        <rect x="78" y="96" width="44" height="11" fill="#E8612D" rx="1" />
        <rect x="70" y="109" width="60" height="11" fill="#E8612D" rx="1" />

        {/* C RIGHT - same shape as left C */}
        <rect x="140" y="5" width="55" height="11" fill="#E8612D" rx="1" />
        <rect x="140" y="18" width="48" height="11" fill="#E8612D" rx="1" />
        <rect x="140" y="31" width="38" height="11" fill="#E8612D" rx="1" />
        <rect x="140" y="44" width="28" height="11" fill="#E8612D" rx="1" />
        <rect x="140" y="57" width="22" height="11" fill="#E8612D" rx="1" />
        <rect x="140" y="70" width="28" height="11" fill="#E8612D" rx="1" />
        <rect x="140" y="83" width="38" height="11" fill="#E8612D" rx="1" />
        <rect x="140" y="96" width="48" height="11" fill="#E8612D" rx="1" />
        <rect x="140" y="109" width="55" height="11" fill="#E8612D" rx="1" />
    </svg>
);
