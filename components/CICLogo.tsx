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
 * CIC ERP Logo Component - Authentic Design with Curved C Letters
 * 
 * Original CIC logo with thick stripes and properly curved C letters
 */
const CICLogo: React.FC<CICLogoProps> = ({
    size = 'md',
    variant = 'full',
    className = ''
}) => {
    // Size configurations
    const sizeConfig = {
        xs: { scale: 0.35, erpSize: 10, gap: 4 },
        sm: { scale: 0.45, erpSize: 13, gap: 6 },
        md: { scale: 0.6, erpSize: 16, gap: 8 },
        lg: { scale: 0.8, erpSize: 20, gap: 10 },
        xl: { scale: 1.0, erpSize: 26, gap: 14 },
    };

    const config = sizeConfig[size];
    const baseWidth = 120;
    const baseHeight = 85;

    return (
        <div className={`inline-flex items-center ${className}`} style={{ gap: config.gap }}>
            {/* CIC Logo - Curved C with thick stripes */}
            <svg
                width={baseWidth * config.scale}
                height={baseHeight * config.scale}
                viewBox="0 0 120 85"
                fill="none"
                xmlns="http://www.w3.org/2000/svg"
                className="flex-shrink-0"
            >
                {/* Outer Border - Dark Red */}
                <rect
                    x="1"
                    y="1"
                    width="118"
                    height="83"
                    rx="4"
                    fill="none"
                    stroke="#C53030"
                    strokeWidth="2.5"
                />

                {/* Inner Background */}
                <rect
                    x="4"
                    y="4"
                    width="112"
                    height="77"
                    rx="2"
                    className="fill-white dark:fill-slate-900"
                />

                {/* ===== CIC Letters - Using paths for curved C ===== */}

                {/* Letter C (Left) - Curved shape with thick strokes */}
                <path
                    d="M32 12 L14 12 C10 12 8 14 8 18 L8 50 C8 54 10 56 14 56 L32 56"
                    fill="none"
                    stroke="#E85D04"
                    strokeWidth="8"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                />

                {/* Letter I (Center) - Thick strokes */}
                <g stroke="#E85D04" strokeWidth="8" strokeLinecap="round">
                    {/* Top bar */}
                    <line x1="46" y1="12" x2="74" y2="12" />
                    {/* Vertical stem */}
                    <line x1="60" y1="12" x2="60" y2="56" />
                    {/* Bottom bar */}
                    <line x1="46" y1="56" x2="74" y2="56" />
                </g>

                {/* Letter C (Right) - Curved shape with thick strokes */}
                <path
                    d="M112 12 L94 12 C90 12 88 14 88 18 L88 50 C88 54 90 56 94 56 L112 56"
                    fill="none"
                    stroke="#E85D04"
                    strokeWidth="8"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                />

                {/* SINCE 1990 Text */}
                <text
                    x="60"
                    y="72"
                    textAnchor="middle"
                    fill="#C53030"
                    style={{
                        fontSize: '10px',
                        fontWeight: 700,
                        fontFamily: "'Inter', 'Segoe UI', system-ui, sans-serif",
                        letterSpacing: '1px',
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
 * Compact CIC Icon for collapsed sidebar - Curved C version
 */
export const CICLogoIcon: React.FC<{ size?: number; className?: string }> = ({
    size = 40,
    className = ''
}) => (
    <svg
        width={size}
        height={size * 0.71}
        viewBox="0 0 120 85"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        className={className}
    >
        {/* Border */}
        <rect
            x="1"
            y="1"
            width="118"
            height="83"
            rx="4"
            fill="none"
            stroke="#C53030"
            strokeWidth="2.5"
        />
        {/* Background */}
        <rect
            x="4"
            y="4"
            width="112"
            height="77"
            rx="2"
            className="fill-white dark:fill-slate-900"
        />

        {/* Letter C (Left) */}
        <path
            d="M32 12 L14 12 C10 12 8 14 8 18 L8 50 C8 54 10 56 14 56 L32 56"
            fill="none"
            stroke="#E85D04"
            strokeWidth="8"
            strokeLinecap="round"
            strokeLinejoin="round"
        />

        {/* Letter I (Center) */}
        <g stroke="#E85D04" strokeWidth="8" strokeLinecap="round">
            <line x1="46" y1="12" x2="74" y2="12" />
            <line x1="60" y1="12" x2="60" y2="56" />
            <line x1="46" y1="56" x2="74" y2="56" />
        </g>

        {/* Letter C (Right) */}
        <path
            d="M112 12 L94 12 C90 12 88 14 88 18 L88 50 C88 54 90 56 94 56 L112 56"
            fill="none"
            stroke="#E85D04"
            strokeWidth="8"
            strokeLinecap="round"
            strokeLinejoin="round"
        />

        {/* SINCE 1990 */}
        <text
            x="60"
            y="72"
            textAnchor="middle"
            fill="#C53030"
            style={{
                fontSize: '10px',
                fontWeight: 700,
                fontFamily: "'Inter', 'Segoe UI', system-ui, sans-serif",
                letterSpacing: '1px',
            }}
        >
            SINCE 1990
        </text>
    </svg>
);
