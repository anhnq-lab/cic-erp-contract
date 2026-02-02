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
 * CIC ERP Logo Component - Authentic Striped Design
 * 
 * Original CIC logo style with thick horizontal stripes
 * forming the CIC letters within a bordered container
 */
const CICLogo: React.FC<CICLogoProps> = ({
    size = 'md',
    variant = 'full',
    className = ''
}) => {
    // Size configurations
    const sizeConfig = {
        xs: { scale: 0.4, erpSize: 12, gap: 6 },
        sm: { scale: 0.5, erpSize: 14, gap: 8 },
        md: { scale: 0.65, erpSize: 18, gap: 10 },
        lg: { scale: 0.85, erpSize: 22, gap: 12 },
        xl: { scale: 1.1, erpSize: 28, gap: 16 },
    };

    const config = sizeConfig[size];
    const baseWidth = 100;
    const baseHeight = 70;

    return (
        <div className={`inline-flex items-center ${className}`} style={{ gap: config.gap }}>
            {/* CIC Logo - Authentic Striped Style */}
            <svg
                width={baseWidth * config.scale}
                height={baseHeight * config.scale}
                viewBox="0 0 100 70"
                fill="none"
                xmlns="http://www.w3.org/2000/svg"
                className="flex-shrink-0"
            >
                {/* Outer Border - Dark Red */}
                <rect
                    x="1"
                    y="1"
                    width="98"
                    height="68"
                    rx="3"
                    fill="none"
                    stroke="#C53030"
                    strokeWidth="2"
                />

                {/* Inner Background - White */}
                <rect
                    x="3"
                    y="3"
                    width="94"
                    height="64"
                    rx="2"
                    className="fill-white dark:fill-slate-900"
                />

                {/* ===== CIC Letters - Thick Horizontal Stripes ===== */}

                {/* Letter C (Left) */}
                <g fill="#E85D04">
                    {/* Top bar - thick */}
                    <rect x="8" y="10" width="24" height="6" rx="1" />
                    {/* Side stripes */}
                    <rect x="8" y="18" width="10" height="5" rx="0.5" />
                    <rect x="8" y="25" width="10" height="5" rx="0.5" />
                    <rect x="8" y="32" width="10" height="5" rx="0.5" />
                    <rect x="8" y="39" width="10" height="5" rx="0.5" />
                    {/* Bottom bar - thick */}
                    <rect x="8" y="46" width="24" height="6" rx="1" />
                </g>

                {/* Letter I (Center) */}
                <g fill="#E85D04">
                    {/* Top bar */}
                    <rect x="36" y="10" width="28" height="6" rx="1" />
                    {/* Center stripes */}
                    <rect x="44" y="18" width="12" height="5" rx="0.5" />
                    <rect x="44" y="25" width="12" height="5" rx="0.5" />
                    <rect x="44" y="32" width="12" height="5" rx="0.5" />
                    <rect x="44" y="39" width="12" height="5" rx="0.5" />
                    {/* Bottom bar */}
                    <rect x="36" y="46" width="28" height="6" rx="1" />
                </g>

                {/* Letter C (Right) */}
                <g fill="#E85D04">
                    {/* Top bar - thick */}
                    <rect x="68" y="10" width="24" height="6" rx="1" />
                    {/* Side stripes */}
                    <rect x="68" y="18" width="10" height="5" rx="0.5" />
                    <rect x="68" y="25" width="10" height="5" rx="0.5" />
                    <rect x="68" y="32" width="10" height="5" rx="0.5" />
                    <rect x="68" y="39" width="10" height="5" rx="0.5" />
                    {/* Bottom bar - thick */}
                    <rect x="68" y="46" width="24" height="6" rx="1" />
                </g>

                {/* SINCE 1990 Text */}
                <text
                    x="50"
                    y="60"
                    textAnchor="middle"
                    fill="#C53030"
                    style={{
                        fontSize: '7px',
                        fontWeight: 600,
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
 * Compact CIC Icon for collapsed sidebar - Striped version
 */
export const CICLogoIcon: React.FC<{ size?: number; className?: string }> = ({
    size = 40,
    className = ''
}) => (
    <svg
        width={size}
        height={size * 0.7}
        viewBox="0 0 100 70"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        className={className}
    >
        {/* Border */}
        <rect
            x="1"
            y="1"
            width="98"
            height="68"
            rx="3"
            fill="none"
            stroke="#C53030"
            strokeWidth="2"
        />
        {/* Background */}
        <rect
            x="3"
            y="3"
            width="94"
            height="64"
            rx="2"
            className="fill-white dark:fill-slate-900"
        />

        {/* CIC Letters - Striped */}
        <g fill="#E85D04">
            {/* C Left */}
            <rect x="8" y="10" width="24" height="6" rx="1" />
            <rect x="8" y="18" width="10" height="5" rx="0.5" />
            <rect x="8" y="25" width="10" height="5" rx="0.5" />
            <rect x="8" y="32" width="10" height="5" rx="0.5" />
            <rect x="8" y="39" width="10" height="5" rx="0.5" />
            <rect x="8" y="46" width="24" height="6" rx="1" />

            {/* I Center */}
            <rect x="36" y="10" width="28" height="6" rx="1" />
            <rect x="44" y="18" width="12" height="5" rx="0.5" />
            <rect x="44" y="25" width="12" height="5" rx="0.5" />
            <rect x="44" y="32" width="12" height="5" rx="0.5" />
            <rect x="44" y="39" width="12" height="5" rx="0.5" />
            <rect x="36" y="46" width="28" height="6" rx="1" />

            {/* C Right */}
            <rect x="68" y="10" width="24" height="6" rx="1" />
            <rect x="68" y="18" width="10" height="5" rx="0.5" />
            <rect x="68" y="25" width="10" height="5" rx="0.5" />
            <rect x="68" y="32" width="10" height="5" rx="0.5" />
            <rect x="68" y="39" width="10" height="5" rx="0.5" />
            <rect x="68" y="46" width="24" height="6" rx="1" />
        </g>

        {/* SINCE 1990 */}
        <text
            x="50"
            y="60"
            textAnchor="middle"
            fill="#C53030"
            style={{
                fontSize: '7px',
                fontWeight: 600,
                fontFamily: "'Inter', 'Segoe UI', system-ui, sans-serif",
                letterSpacing: '1.5px',
            }}
        >
            SINCE 1990
        </text>
    </svg>
);
