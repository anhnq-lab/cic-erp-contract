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
 * 
 * Authentic CIC logo with horizontal orange/red stripes
 * Based on original CIC logo design with modernized SVG rendering
 * 
 * Design System (UI UX Pro Max):
 * - Primary Color: #E85D04 (Orange) to #DC2F02 (Red-Orange)
 * - Border Color: #B91C1C (Red-700)
 * - Typography: Bold tracking for ERP text
 * - Light/Dark mode aware container
 */
const CICLogo: React.FC<CICLogoProps> = ({
    size = 'md',
    variant = 'full',
    className = ''
}) => {
    // Size configurations matching original logo proportions
    const sizeConfig = {
        xs: { height: 32, logoScale: 0.35, erpSize: 10, gap: 8 },
        sm: { height: 44, logoScale: 0.48, erpSize: 13, gap: 10 },
        md: { height: 56, logoScale: 0.62, erpSize: 16, gap: 12 },
        lg: { height: 72, logoScale: 0.8, erpSize: 20, gap: 14 },
        xl: { height: 100, logoScale: 1.1, erpSize: 28, gap: 18 },
    };

    const config = sizeConfig[size];
    const svgWidth = 120 * config.logoScale;
    const svgHeight = 90 * config.logoScale;

    return (
        <div className={`inline-flex items-center ${className}`} style={{ gap: config.gap }}>
            {/* CIC Logo - Authentic Horizontal Striped Style */}
            <svg
                width={svgWidth}
                height={svgHeight}
                viewBox="0 0 120 90"
                fill="none"
                xmlns="http://www.w3.org/2000/svg"
                className="flex-shrink-0"
                style={{ filter: 'drop-shadow(2px 2px 4px rgba(0,0,0,0.15))' }}
            >
                {/* Outer Border - Red */}
                <rect
                    x="1"
                    y="1"
                    width="118"
                    height="88"
                    rx="4"
                    ry="4"
                    fill="none"
                    stroke="#B91C1C"
                    strokeWidth="2"
                />

                {/* Inner Background */}
                <rect
                    x="4"
                    y="4"
                    width="112"
                    height="82"
                    rx="2"
                    ry="2"
                    className="fill-white dark:fill-slate-900"
                />

                {/* ===== CIC Letters made of horizontal stripes ===== */}
                {/* Each letter is created using multiple horizontal bars */}

                {/* Letter C (Left) - 5 horizontal stripes forming C shape */}
                <g fill="#E85D04">
                    {/* Top bar */}
                    <rect x="10" y="14" width="28" height="5" rx="1" />
                    {/* Upper side */}
                    <rect x="10" y="21" width="8" height="5" rx="1" />
                    {/* Middle */}
                    <rect x="10" y="28" width="8" height="5" rx="1" />
                    {/* Lower side */}
                    <rect x="10" y="35" width="8" height="5" rx="1" />
                    {/* Middle center */}
                    <rect x="10" y="42" width="8" height="5" rx="1" />
                    {/* Lower middle */}
                    <rect x="10" y="49" width="8" height="5" rx="1" />
                    {/* Bottom bar */}
                    <rect x="10" y="56" width="28" height="5" rx="1" />
                </g>

                {/* Letter I (Center) - Vertical with top/bottom bars */}
                <g fill="#E85D04">
                    {/* Top bar */}
                    <rect x="44" y="14" width="32" height="5" rx="1" />
                    {/* Stripe 1 */}
                    <rect x="54" y="21" width="12" height="5" rx="1" />
                    {/* Stripe 2 */}
                    <rect x="54" y="28" width="12" height="5" rx="1" />
                    {/* Stripe 3 */}
                    <rect x="54" y="35" width="12" height="5" rx="1" />
                    {/* Stripe 4 */}
                    <rect x="54" y="42" width="12" height="5" rx="1" />
                    {/* Stripe 5 */}
                    <rect x="54" y="49" width="12" height="5" rx="1" />
                    {/* Bottom bar */}
                    <rect x="44" y="56" width="32" height="5" rx="1" />
                </g>

                {/* Letter C (Right) - Same as left C */}
                <g fill="#E85D04">
                    {/* Top bar */}
                    <rect x="82" y="14" width="28" height="5" rx="1" />
                    {/* Upper side */}
                    <rect x="82" y="21" width="8" height="5" rx="1" />
                    {/* Middle */}
                    <rect x="82" y="28" width="8" height="5" rx="1" />
                    {/* Lower side */}
                    <rect x="82" y="35" width="8" height="5" rx="1" />
                    {/* Middle center */}
                    <rect x="82" y="42" width="8" height="5" rx="1" />
                    {/* Lower middle */}
                    <rect x="82" y="49" width="8" height="5" rx="1" />
                    {/* Bottom bar */}
                    <rect x="82" y="56" width="28" height="5" rx="1" />
                </g>

                {/* SINCE 1990 Text */}
                <text
                    x="60"
                    y="76"
                    textAnchor="middle"
                    fill="#E85D04"
                    style={{
                        fontSize: '9px',
                        fontWeight: 600,
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
                    className="font-bold tracking-[0.15em] text-slate-700 dark:text-slate-200"
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

// Compact Icon version for sidebar collapsed state
export const CICLogoIcon: React.FC<{ size?: number; className?: string }> = ({
    size = 36,
    className = ''
}) => (
    <svg
        width={size}
        height={size * 0.75}
        viewBox="0 0 120 90"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        className={className}
        style={{ filter: 'drop-shadow(1px 1px 2px rgba(0,0,0,0.1))' }}
    >
        {/* Outer Border */}
        <rect
            x="1"
            y="1"
            width="118"
            height="88"
            rx="4"
            fill="none"
            stroke="#B91C1C"
            strokeWidth="2"
        />
        {/* Background */}
        <rect
            x="4"
            y="4"
            width="112"
            height="82"
            rx="2"
            className="fill-white dark:fill-slate-900"
        />

        {/* Simplified CIC with stripes */}
        <g fill="#E85D04">
            {/* C Left */}
            <rect x="10" y="14" width="28" height="5" rx="1" />
            <rect x="10" y="21" width="8" height="5" rx="1" />
            <rect x="10" y="28" width="8" height="5" rx="1" />
            <rect x="10" y="35" width="8" height="5" rx="1" />
            <rect x="10" y="42" width="8" height="5" rx="1" />
            <rect x="10" y="49" width="8" height="5" rx="1" />
            <rect x="10" y="56" width="28" height="5" rx="1" />

            {/* I Center */}
            <rect x="44" y="14" width="32" height="5" rx="1" />
            <rect x="54" y="21" width="12" height="5" rx="1" />
            <rect x="54" y="28" width="12" height="5" rx="1" />
            <rect x="54" y="35" width="12" height="5" rx="1" />
            <rect x="54" y="42" width="12" height="5" rx="1" />
            <rect x="54" y="49" width="12" height="5" rx="1" />
            <rect x="44" y="56" width="32" height="5" rx="1" />

            {/* C Right */}
            <rect x="82" y="14" width="28" height="5" rx="1" />
            <rect x="82" y="21" width="8" height="5" rx="1" />
            <rect x="82" y="28" width="8" height="5" rx="1" />
            <rect x="82" y="35" width="8" height="5" rx="1" />
            <rect x="82" y="42" width="8" height="5" rx="1" />
            <rect x="82" y="49" width="8" height="5" rx="1" />
            <rect x="82" y="56" width="28" height="5" rx="1" />
        </g>

        {/* SINCE 1990 */}
        <text
            x="60"
            y="76"
            textAnchor="middle"
            fill="#E85D04"
            style={{
                fontSize: '9px',
                fontWeight: 600,
                fontFamily: "'Inter', 'Segoe UI', system-ui, sans-serif",
                letterSpacing: '2px',
            }}
        >
            SINCE 1990
        </text>
    </svg>
);
