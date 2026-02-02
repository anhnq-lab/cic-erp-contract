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
 * CIC ERP Logo Component - Authentic Thick Striped Design
 * 
 * Original CIC logo with THICK horizontal stripes
 * matching the company's original logo perfectly
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
            {/* CIC Logo - Thick Striped Style like Original */}
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
                    rx="3"
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
                    rx="1"
                    className="fill-white dark:fill-slate-900"
                />

                {/* ===== CIC Letters - THICK Horizontal Stripes ===== */}
                {/* Letter heights: 7px bars with 1px gaps = very thick like original */}

                {/* Letter C (Left) - Thick stripes */}
                <g fill="#E85D04">
                    <rect x="10" y="10" width="28" height="7" rx="0.5" />
                    <rect x="10" y="18" width="12" height="7" rx="0.5" />
                    <rect x="10" y="26" width="12" height="7" rx="0.5" />
                    <rect x="10" y="34" width="12" height="7" rx="0.5" />
                    <rect x="10" y="42" width="12" height="7" rx="0.5" />
                    <rect x="10" y="50" width="28" height="7" rx="0.5" />
                </g>

                {/* Letter I (Center) - Thick stripes */}
                <g fill="#E85D04">
                    <rect x="42" y="10" width="36" height="7" rx="0.5" />
                    <rect x="52" y="18" width="16" height="7" rx="0.5" />
                    <rect x="52" y="26" width="16" height="7" rx="0.5" />
                    <rect x="52" y="34" width="16" height="7" rx="0.5" />
                    <rect x="52" y="42" width="16" height="7" rx="0.5" />
                    <rect x="42" y="50" width="36" height="7" rx="0.5" />
                </g>

                {/* Letter C (Right) - Thick stripes */}
                <g fill="#E85D04">
                    <rect x="82" y="10" width="28" height="7" rx="0.5" />
                    <rect x="82" y="18" width="12" height="7" rx="0.5" />
                    <rect x="82" y="26" width="12" height="7" rx="0.5" />
                    <rect x="82" y="34" width="12" height="7" rx="0.5" />
                    <rect x="82" y="42" width="12" height="7" rx="0.5" />
                    <rect x="82" y="50" width="28" height="7" rx="0.5" />
                </g>

                {/* SINCE 1990 Text */}
                <text
                    x="60"
                    y="70"
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
 * Compact CIC Icon for collapsed sidebar - Thick stripes version
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
            rx="3"
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
            rx="1"
            className="fill-white dark:fill-slate-900"
        />

        {/* CIC Letters - THICK Stripes */}
        <g fill="#E85D04">
            {/* C Left */}
            <rect x="10" y="10" width="28" height="7" rx="0.5" />
            <rect x="10" y="18" width="12" height="7" rx="0.5" />
            <rect x="10" y="26" width="12" height="7" rx="0.5" />
            <rect x="10" y="34" width="12" height="7" rx="0.5" />
            <rect x="10" y="42" width="12" height="7" rx="0.5" />
            <rect x="10" y="50" width="28" height="7" rx="0.5" />

            {/* I Center */}
            <rect x="42" y="10" width="36" height="7" rx="0.5" />
            <rect x="52" y="18" width="16" height="7" rx="0.5" />
            <rect x="52" y="26" width="16" height="7" rx="0.5" />
            <rect x="52" y="34" width="16" height="7" rx="0.5" />
            <rect x="52" y="42" width="16" height="7" rx="0.5" />
            <rect x="42" y="50" width="36" height="7" rx="0.5" />

            {/* C Right */}
            <rect x="82" y="10" width="28" height="7" rx="0.5" />
            <rect x="82" y="18" width="12" height="7" rx="0.5" />
            <rect x="82" y="26" width="12" height="7" rx="0.5" />
            <rect x="82" y="34" width="12" height="7" rx="0.5" />
            <rect x="82" y="42" width="12" height="7" rx="0.5" />
            <rect x="82" y="50" width="28" height="7" rx="0.5" />
        </g>

        {/* SINCE 1990 */}
        <text
            x="60"
            y="70"
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
