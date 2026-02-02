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
 * CIC ERP Logo Component - EXACT Replica
 * 
 * Based on the original logo image provided by user
 * Thick horizontal stripes with curved C shapes
 */
const CICLogo: React.FC<CICLogoProps> = ({
    size = 'md',
    variant = 'full',
    className = ''
}) => {
    // Size configurations
    const sizeConfig = {
        xs: { scale: 0.22, erpSize: 10, gap: 4, sinceSize: 6 },
        sm: { scale: 0.30, erpSize: 13, gap: 6, sinceSize: 8 },
        md: { scale: 0.40, erpSize: 16, gap: 8, sinceSize: 10 },
        lg: { scale: 0.55, erpSize: 20, gap: 10, sinceSize: 12 },
        xl: { scale: 0.70, erpSize: 26, gap: 14, sinceSize: 14 },
    };

    const config = sizeConfig[size];

    return (
        <div className={`inline-flex items-center ${className}`} style={{ gap: config.gap }}>
            {/* CIC Logo - EXACT replica from original image */}
            <svg
                width={200 * config.scale}
                height={130 * config.scale}
                viewBox="0 0 200 130"
                fill="none"
                xmlns="http://www.w3.org/2000/svg"
                className="flex-shrink-0"
            >
                {/* ===== CIC LETTERS - THICK HORIZONTAL STRIPES ===== */}
                {/* Bar height: 10px, gap: 2px - very thick and tight */}

                {/* === LETTER C (LEFT) - Curved shape === */}
                {/* Row 1 - Top curve */}
                <rect x="10" y="5" width="50" height="10" fill="#E8612D" rx="2" />
                {/* Row 2 */}
                <rect x="5" y="17" width="42" height="10" fill="#E8612D" rx="2" />
                {/* Row 3 */}
                <rect x="3" y="29" width="32" height="10" fill="#E8612D" rx="2" />
                {/* Row 4 */}
                <rect x="2" y="41" width="25" height="10" fill="#E8612D" rx="2" />
                {/* Row 5 - Middle (shortest) */}
                <rect x="2" y="53" width="22" height="10" fill="#E8612D" rx="2" />
                {/* Row 6 */}
                <rect x="2" y="65" width="25" height="10" fill="#E8612D" rx="2" />
                {/* Row 7 */}
                <rect x="3" y="77" width="32" height="10" fill="#E8612D" rx="2" />
                {/* Row 8 */}
                <rect x="5" y="89" width="42" height="10" fill="#E8612D" rx="2" />
                {/* Row 9 - Bottom curve */}
                <rect x="10" y="101" width="50" height="10" fill="#E8612D" rx="2" />

                {/* === LETTER I (CENTER) === */}
                {/* Row 1 - Top bar (full width) */}
                <rect x="68" y="5" width="64" height="10" fill="#E8612D" rx="2" />
                {/* Row 2 */}
                <rect x="80" y="17" width="40" height="10" fill="#E8612D" rx="2" />
                {/* Row 3 - Stem */}
                <rect x="85" y="29" width="30" height="10" fill="#E8612D" rx="2" />
                {/* Row 4 - Stem */}
                <rect x="85" y="41" width="30" height="10" fill="#E8612D" rx="2" />
                {/* Row 5 - Stem */}
                <rect x="85" y="53" width="30" height="10" fill="#E8612D" rx="2" />
                {/* Row 6 - Stem */}
                <rect x="85" y="65" width="30" height="10" fill="#E8612D" rx="2" />
                {/* Row 7 - Stem */}
                <rect x="85" y="77" width="30" height="10" fill="#E8612D" rx="2" />
                {/* Row 8 */}
                <rect x="80" y="89" width="40" height="10" fill="#E8612D" rx="2" />
                {/* Row 9 - Bottom bar (full width) */}
                <rect x="68" y="101" width="64" height="10" fill="#E8612D" rx="2" />

                {/* === LETTER C (RIGHT) - Curved shape === */}
                {/* Row 1 - Top curve */}
                <rect x="140" y="5" width="50" height="10" fill="#E8612D" rx="2" />
                {/* Row 2 */}
                <rect x="153" y="17" width="42" height="10" fill="#E8612D" rx="2" />
                {/* Row 3 */}
                <rect x="165" y="29" width="32" height="10" fill="#E8612D" rx="2" />
                {/* Row 4 */}
                <rect x="173" y="41" width="25" height="10" fill="#E8612D" rx="2" />
                {/* Row 5 - Middle (shortest) */}
                <rect x="176" y="53" width="22" height="10" fill="#E8612D" rx="2" />
                {/* Row 6 */}
                <rect x="173" y="65" width="25" height="10" fill="#E8612D" rx="2" />
                {/* Row 7 */}
                <rect x="165" y="77" width="32" height="10" fill="#E8612D" rx="2" />
                {/* Row 8 */}
                <rect x="153" y="89" width="42" height="10" fill="#E8612D" rx="2" />
                {/* Row 9 - Bottom curve */}
                <rect x="140" y="101" width="50" height="10" fill="#E8612D" rx="2" />

                {/* SINCE 1990 Text */}
                <text
                    x="100"
                    y="125"
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
        {/* C LEFT */}
        <rect x="10" y="5" width="50" height="10" fill="#E8612D" rx="2" />
        <rect x="5" y="17" width="42" height="10" fill="#E8612D" rx="2" />
        <rect x="3" y="29" width="32" height="10" fill="#E8612D" rx="2" />
        <rect x="2" y="41" width="25" height="10" fill="#E8612D" rx="2" />
        <rect x="2" y="53" width="22" height="10" fill="#E8612D" rx="2" />
        <rect x="2" y="65" width="25" height="10" fill="#E8612D" rx="2" />
        <rect x="3" y="77" width="32" height="10" fill="#E8612D" rx="2" />
        <rect x="5" y="89" width="42" height="10" fill="#E8612D" rx="2" />
        <rect x="10" y="101" width="50" height="10" fill="#E8612D" rx="2" />

        {/* I CENTER */}
        <rect x="68" y="5" width="64" height="10" fill="#E8612D" rx="2" />
        <rect x="80" y="17" width="40" height="10" fill="#E8612D" rx="2" />
        <rect x="85" y="29" width="30" height="10" fill="#E8612D" rx="2" />
        <rect x="85" y="41" width="30" height="10" fill="#E8612D" rx="2" />
        <rect x="85" y="53" width="30" height="10" fill="#E8612D" rx="2" />
        <rect x="85" y="65" width="30" height="10" fill="#E8612D" rx="2" />
        <rect x="85" y="77" width="30" height="10" fill="#E8612D" rx="2" />
        <rect x="80" y="89" width="40" height="10" fill="#E8612D" rx="2" />
        <rect x="68" y="101" width="64" height="10" fill="#E8612D" rx="2" />

        {/* C RIGHT */}
        <rect x="140" y="5" width="50" height="10" fill="#E8612D" rx="2" />
        <rect x="153" y="17" width="42" height="10" fill="#E8612D" rx="2" />
        <rect x="165" y="29" width="32" height="10" fill="#E8612D" rx="2" />
        <rect x="173" y="41" width="25" height="10" fill="#E8612D" rx="2" />
        <rect x="176" y="53" width="22" height="10" fill="#E8612D" rx="2" />
        <rect x="173" y="65" width="25" height="10" fill="#E8612D" rx="2" />
        <rect x="165" y="77" width="32" height="10" fill="#E8612D" rx="2" />
        <rect x="153" y="89" width="42" height="10" fill="#E8612D" rx="2" />
        <rect x="140" y="101" width="50" height="10" fill="#E8612D" rx="2" />

        {/* SINCE 1990 */}
        <text
            x="100"
            y="125"
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
