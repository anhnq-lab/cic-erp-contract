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
 * Based on the original logo image
 * Both C letters open INWARD toward the I
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
            {/* CIC Logo - 100% EXACT replica */}
            <svg
                width={200 * config.scale}
                height={130 * config.scale}
                viewBox="0 0 200 130"
                fill="none"
                xmlns="http://www.w3.org/2000/svg"
                className="flex-shrink-0"
            >
                {/* ===== CIC LETTERS ===== */}
                {/* Bar height: 10px, gap: 2px */}

                {/* === LETTER C (LEFT) - Opens to the RIGHT (toward I) === */}
                <rect x="5" y="5" width="50" height="10" fill="#E8612D" rx="1" />
                <rect x="5" y="17" width="40" height="10" fill="#E8612D" rx="1" />
                <rect x="5" y="29" width="30" height="10" fill="#E8612D" rx="1" />
                <rect x="5" y="41" width="24" height="10" fill="#E8612D" rx="1" />
                <rect x="5" y="53" width="20" height="10" fill="#E8612D" rx="1" />
                <rect x="5" y="65" width="24" height="10" fill="#E8612D" rx="1" />
                <rect x="5" y="77" width="30" height="10" fill="#E8612D" rx="1" />
                <rect x="5" y="89" width="40" height="10" fill="#E8612D" rx="1" />
                <rect x="5" y="101" width="50" height="10" fill="#E8612D" rx="1" />

                {/* === LETTER I (CENTER) === */}
                <rect x="68" y="5" width="64" height="10" fill="#E8612D" rx="1" />
                <rect x="78" y="17" width="44" height="10" fill="#E8612D" rx="1" />
                <rect x="85" y="29" width="30" height="10" fill="#E8612D" rx="1" />
                <rect x="85" y="41" width="30" height="10" fill="#E8612D" rx="1" />
                <rect x="85" y="53" width="30" height="10" fill="#E8612D" rx="1" />
                <rect x="85" y="65" width="30" height="10" fill="#E8612D" rx="1" />
                <rect x="85" y="77" width="30" height="10" fill="#E8612D" rx="1" />
                <rect x="78" y="89" width="44" height="10" fill="#E8612D" rx="1" />
                <rect x="68" y="101" width="64" height="10" fill="#E8612D" rx="1" />

                {/* === LETTER C (RIGHT) - Opens to the LEFT (toward I) === */}
                {/* Bars start from RIGHT edge and get shorter toward LEFT */}
                <rect x="145" y="5" width="50" height="10" fill="#E8612D" rx="1" />
                <rect x="155" y="17" width="40" height="10" fill="#E8612D" rx="1" />
                <rect x="165" y="29" width="30" height="10" fill="#E8612D" rx="1" />
                <rect x="171" y="41" width="24" height="10" fill="#E8612D" rx="1" />
                <rect x="175" y="53" width="20" height="10" fill="#E8612D" rx="1" />
                <rect x="171" y="65" width="24" height="10" fill="#E8612D" rx="1" />
                <rect x="165" y="77" width="30" height="10" fill="#E8612D" rx="1" />
                <rect x="155" y="89" width="40" height="10" fill="#E8612D" rx="1" />
                <rect x="145" y="101" width="50" height="10" fill="#E8612D" rx="1" />

                {/* SINCE 1990 Text */}
                <text
                    x="100"
                    y="124"
                    textAnchor="middle"
                    fill="#E8612D"
                    style={{
                        fontSize: '14px',
                        fontWeight: 700,
                        fontFamily: "'Inter', 'Segoe UI', system-ui, sans-serif",
                        letterSpacing: '2px',
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
 * Compact CIC Icon for collapsed sidebar
 */
export const CICLogoIcon: React.FC<{ size?: number; className?: string }> = ({
    size = 50,
    className = ''
}) => (
    <svg
        width={size}
        height={size * 0.65}
        viewBox="0 0 200 130"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        className={className}
    >
        {/* C LEFT - opens RIGHT */}
        <rect x="5" y="5" width="50" height="10" fill="#E8612D" rx="1" />
        <rect x="5" y="17" width="40" height="10" fill="#E8612D" rx="1" />
        <rect x="5" y="29" width="30" height="10" fill="#E8612D" rx="1" />
        <rect x="5" y="41" width="24" height="10" fill="#E8612D" rx="1" />
        <rect x="5" y="53" width="20" height="10" fill="#E8612D" rx="1" />
        <rect x="5" y="65" width="24" height="10" fill="#E8612D" rx="1" />
        <rect x="5" y="77" width="30" height="10" fill="#E8612D" rx="1" />
        <rect x="5" y="89" width="40" height="10" fill="#E8612D" rx="1" />
        <rect x="5" y="101" width="50" height="10" fill="#E8612D" rx="1" />

        {/* I CENTER */}
        <rect x="68" y="5" width="64" height="10" fill="#E8612D" rx="1" />
        <rect x="78" y="17" width="44" height="10" fill="#E8612D" rx="1" />
        <rect x="85" y="29" width="30" height="10" fill="#E8612D" rx="1" />
        <rect x="85" y="41" width="30" height="10" fill="#E8612D" rx="1" />
        <rect x="85" y="53" width="30" height="10" fill="#E8612D" rx="1" />
        <rect x="85" y="65" width="30" height="10" fill="#E8612D" rx="1" />
        <rect x="85" y="77" width="30" height="10" fill="#E8612D" rx="1" />
        <rect x="78" y="89" width="44" height="10" fill="#E8612D" rx="1" />
        <rect x="68" y="101" width="64" height="10" fill="#E8612D" rx="1" />

        {/* C RIGHT - opens LEFT */}
        <rect x="145" y="5" width="50" height="10" fill="#E8612D" rx="1" />
        <rect x="155" y="17" width="40" height="10" fill="#E8612D" rx="1" />
        <rect x="165" y="29" width="30" height="10" fill="#E8612D" rx="1" />
        <rect x="171" y="41" width="24" height="10" fill="#E8612D" rx="1" />
        <rect x="175" y="53" width="20" height="10" fill="#E8612D" rx="1" />
        <rect x="171" y="65" width="24" height="10" fill="#E8612D" rx="1" />
        <rect x="165" y="77" width="30" height="10" fill="#E8612D" rx="1" />
        <rect x="155" y="89" width="40" height="10" fill="#E8612D" rx="1" />
        <rect x="145" y="101" width="50" height="10" fill="#E8612D" rx="1" />

        {/* SINCE 1990 */}
        <text
            x="100"
            y="124"
            textAnchor="middle"
            fill="#E8612D"
            style={{
                fontSize: '14px',
                fontWeight: 700,
                fontFamily: "'Inter', 'Segoe UI', system-ui, sans-serif",
                letterSpacing: '2px',
            }}
        >
            SINCE 1990
        </text>
    </svg>
);
