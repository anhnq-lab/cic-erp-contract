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
 * Wide C letters with rounded ends, matching original logo
 */
const CICLogo: React.FC<CICLogoProps> = ({
    size = 'md',
    variant = 'full',
    className = ''
}) => {
    // Size configurations  
    const sizeConfig = {
        xs: { scale: 0.20, erpSize: 10, gap: 4 },
        sm: { scale: 0.28, erpSize: 13, gap: 6 },
        md: { scale: 0.38, erpSize: 16, gap: 8 },
        lg: { scale: 0.52, erpSize: 20, gap: 10 },
        xl: { scale: 0.68, erpSize: 26, gap: 14 },
    };

    const config = sizeConfig[size];

    return (
        <div className={`inline-flex items-center ${className}`} style={{ gap: config.gap }}>
            {/* CIC Logo - Wide C letters with rounded bars */}
            <svg
                width={260 * config.scale}
                height={120 * config.scale}
                viewBox="0 0 260 120"
                fill="none"
                xmlns="http://www.w3.org/2000/svg"
                className="flex-shrink-0"
            >
                {/* ===== CIC LETTERS ===== */}
                {/* Bar height: 11px, rounded ends (rx=5) */}

                {/* === LETTER C (LEFT) - WIDE with smooth curve === */}
                <rect x="5" y="5" width="70" height="11" fill="#E8612D" rx="5" />
                <rect x="5" y="17" width="55" height="11" fill="#E8612D" rx="5" />
                <rect x="5" y="29" width="40" height="11" fill="#E8612D" rx="5" />
                <rect x="5" y="41" width="28" height="11" fill="#E8612D" rx="5" />
                <rect x="5" y="53" width="22" height="11" fill="#E8612D" rx="5" />
                <rect x="5" y="65" width="28" height="11" fill="#E8612D" rx="5" />
                <rect x="5" y="77" width="40" height="11" fill="#E8612D" rx="5" />
                <rect x="5" y="89" width="55" height="11" fill="#E8612D" rx="5" />
                <rect x="5" y="101" width="70" height="11" fill="#E8612D" rx="5" />

                {/* === LETTER I (CENTER) === */}
                <rect x="88" y="5" width="64" height="11" fill="#E8612D" rx="5" />
                <rect x="97" y="17" width="46" height="11" fill="#E8612D" rx="5" />
                <rect x="105" y="29" width="30" height="11" fill="#E8612D" rx="5" />
                <rect x="105" y="41" width="30" height="11" fill="#E8612D" rx="5" />
                <rect x="105" y="53" width="30" height="11" fill="#E8612D" rx="5" />
                <rect x="105" y="65" width="30" height="11" fill="#E8612D" rx="5" />
                <rect x="105" y="77" width="30" height="11" fill="#E8612D" rx="5" />
                <rect x="97" y="89" width="46" height="11" fill="#E8612D" rx="5" />
                <rect x="88" y="101" width="64" height="11" fill="#E8612D" rx="5" />

                {/* === LETTER C (RIGHT) - WIDE with smooth curve === */}
                <rect x="165" y="5" width="70" height="11" fill="#E8612D" rx="5" />
                <rect x="165" y="17" width="55" height="11" fill="#E8612D" rx="5" />
                <rect x="165" y="29" width="40" height="11" fill="#E8612D" rx="5" />
                <rect x="165" y="41" width="28" height="11" fill="#E8612D" rx="5" />
                <rect x="165" y="53" width="22" height="11" fill="#E8612D" rx="5" />
                <rect x="165" y="65" width="28" height="11" fill="#E8612D" rx="5" />
                <rect x="165" y="77" width="40" height="11" fill="#E8612D" rx="5" />
                <rect x="165" y="89" width="55" height="11" fill="#E8612D" rx="5" />
                <rect x="165" y="101" width="70" height="11" fill="#E8612D" rx="5" />
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
    size = 55,
    className = ''
}) => (
    <svg
        width={size}
        height={size * 0.46}
        viewBox="0 0 260 120"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        className={className}
    >
        {/* C LEFT - wide with rounded ends */}
        <rect x="5" y="5" width="70" height="11" fill="#E8612D" rx="5" />
        <rect x="5" y="17" width="55" height="11" fill="#E8612D" rx="5" />
        <rect x="5" y="29" width="40" height="11" fill="#E8612D" rx="5" />
        <rect x="5" y="41" width="28" height="11" fill="#E8612D" rx="5" />
        <rect x="5" y="53" width="22" height="11" fill="#E8612D" rx="5" />
        <rect x="5" y="65" width="28" height="11" fill="#E8612D" rx="5" />
        <rect x="5" y="77" width="40" height="11" fill="#E8612D" rx="5" />
        <rect x="5" y="89" width="55" height="11" fill="#E8612D" rx="5" />
        <rect x="5" y="101" width="70" height="11" fill="#E8612D" rx="5" />

        {/* I CENTER */}
        <rect x="88" y="5" width="64" height="11" fill="#E8612D" rx="5" />
        <rect x="97" y="17" width="46" height="11" fill="#E8612D" rx="5" />
        <rect x="105" y="29" width="30" height="11" fill="#E8612D" rx="5" />
        <rect x="105" y="41" width="30" height="11" fill="#E8612D" rx="5" />
        <rect x="105" y="53" width="30" height="11" fill="#E8612D" rx="5" />
        <rect x="105" y="65" width="30" height="11" fill="#E8612D" rx="5" />
        <rect x="105" y="77" width="30" height="11" fill="#E8612D" rx="5" />
        <rect x="97" y="89" width="46" height="11" fill="#E8612D" rx="5" />
        <rect x="88" y="101" width="64" height="11" fill="#E8612D" rx="5" />

        {/* C RIGHT - wide with rounded ends */}
        <rect x="165" y="5" width="70" height="11" fill="#E8612D" rx="5" />
        <rect x="165" y="17" width="55" height="11" fill="#E8612D" rx="5" />
        <rect x="165" y="29" width="40" height="11" fill="#E8612D" rx="5" />
        <rect x="165" y="41" width="28" height="11" fill="#E8612D" rx="5" />
        <rect x="165" y="53" width="22" height="11" fill="#E8612D" rx="5" />
        <rect x="165" y="65" width="28" height="11" fill="#E8612D" rx="5" />
        <rect x="165" y="77" width="40" height="11" fill="#E8612D" rx="5" />
        <rect x="165" y="89" width="55" height="11" fill="#E8612D" rx="5" />
        <rect x="165" y="101" width="70" height="11" fill="#E8612D" rx="5" />
    </svg>
);
