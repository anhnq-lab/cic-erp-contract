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
 * Modern, professional SVG logo with automatic light/dark mode support
 * 
 * Features:
 * - Rounded corners for modern look
 * - Gradient accents for premium feel  
 * - Responsive sizing
 * - Light/Dark mode aware
 */
const CICLogo: React.FC<CICLogoProps> = ({
    size = 'md',
    variant = 'full',
    className = ''
}) => {
    // Size configurations
    const sizeConfig = {
        xs: { height: 24, fontSize: 10, erpSize: 6, gap: 2 },
        sm: { height: 32, fontSize: 14, erpSize: 8, gap: 3 },
        md: { height: 40, fontSize: 18, erpSize: 10, gap: 4 },
        lg: { height: 56, fontSize: 24, erpSize: 14, gap: 5 },
        xl: { height: 80, fontSize: 34, erpSize: 18, gap: 6 },
    };

    const config = sizeConfig[size];
    const aspectRatio = variant === 'full' ? 2.8 : 1.4;
    const width = config.height * aspectRatio;

    return (
        <div className={`inline-flex items-center ${className}`}>
            <svg
                width={width}
                height={config.height}
                viewBox={variant === 'full' ? "0 0 280 100" : "0 0 140 100"}
                fill="none"
                xmlns="http://www.w3.org/2000/svg"
                className="drop-shadow-sm"
            >
                {/* Definitions - Gradients */}
                <defs>
                    {/* Primary gradient - Blue to Teal (Light mode) */}
                    <linearGradient id="cic-gradient-light" x1="0%" y1="0%" x2="100%" y2="100%">
                        <stop offset="0%" stopColor="#2563EB" />
                        <stop offset="50%" stopColor="#0891B2" />
                        <stop offset="100%" stopColor="#14B8A6" />
                    </linearGradient>

                    {/* Primary gradient - Lighter for Dark mode */}
                    <linearGradient id="cic-gradient-dark" x1="0%" y1="0%" x2="100%" y2="100%">
                        <stop offset="0%" stopColor="#60A5FA" />
                        <stop offset="50%" stopColor="#22D3EE" />
                        <stop offset="100%" stopColor="#2DD4BF" />
                    </linearGradient>

                    {/* Accent gradient for ERP */}
                    <linearGradient id="erp-gradient" x1="0%" y1="0%" x2="100%" y2="0%">
                        <stop offset="0%" stopColor="#6366F1" />
                        <stop offset="100%" stopColor="#8B5CF6" />
                    </linearGradient>

                    {/* Subtle shadow filter */}
                    <filter id="logo-shadow" x="-10%" y="-10%" width="120%" height="120%">
                        <feDropShadow dx="1" dy="2" stdDeviation="2" floodOpacity="0.15" />
                    </filter>
                </defs>

                {/* Main Logo Container with rounded corners */}
                <g filter="url(#logo-shadow)">
                    {/* CIC Text Block - Rounded rectangle background */}
                    <rect
                        x="5"
                        y="10"
                        width="115"
                        height="80"
                        rx="16"
                        ry="16"
                        className="fill-slate-800 dark:fill-slate-100"
                    />

                    {/* Inner accent bar */}
                    <rect
                        x="10"
                        y="75"
                        width="105"
                        height="10"
                        rx="5"
                        className="fill-blue-600 dark:fill-blue-400"
                    />

                    {/* CIC Letters */}
                    <text
                        x="62.5"
                        y="62"
                        textAnchor="middle"
                        className="fill-white dark:fill-slate-900"
                        style={{
                            fontSize: '46px',
                            fontWeight: 800,
                            fontFamily: "'Inter', 'SF Pro Display', 'Segoe UI', system-ui, sans-serif",
                            letterSpacing: '2px',
                        }}
                    >
                        CIC
                    </text>
                </g>

                {/* ERP Section (only for full variant) */}
                {variant === 'full' && (
                    <g>
                        {/* ERP container with modern styling */}
                        <rect
                            x="130"
                            y="22"
                            width="140"
                            height="56"
                            rx="12"
                            ry="12"
                            className="fill-slate-100 dark:fill-slate-800 stroke-slate-200 dark:stroke-slate-700"
                            strokeWidth="1.5"
                        />

                        {/* ERP Text with gradient */}
                        <text
                            x="200"
                            y="60"
                            textAnchor="middle"
                            style={{
                                fontSize: '32px',
                                fontWeight: 600,
                                fontFamily: "'Inter', 'SF Pro Display', 'Segoe UI', system-ui, sans-serif",
                                letterSpacing: '8px',
                            }}
                        >
                            <tspan className="fill-slate-700 dark:fill-slate-200">ERP</tspan>
                        </text>

                        {/* Small accent line under ERP */}
                        <rect
                            x="160"
                            y="70"
                            width="80"
                            height="3"
                            rx="1.5"
                            className="fill-blue-500 dark:fill-blue-400"
                        />
                    </g>
                )}
            </svg>
        </div>
    );
};

export default CICLogo;

// Alternative: Icon only version for favicon/small spaces
export const CICLogoIcon: React.FC<{ size?: number; className?: string }> = ({
    size = 32,
    className = ''
}) => (
    <svg
        width={size}
        height={size}
        viewBox="0 0 100 100"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        className={`drop-shadow-sm ${className}`}
    >
        <rect
            x="5"
            y="5"
            width="90"
            height="90"
            rx="20"
            className="fill-slate-800 dark:fill-slate-100"
        />
        <rect
            x="10"
            y="78"
            width="80"
            height="10"
            rx="5"
            className="fill-blue-600 dark:fill-blue-400"
        />
        <text
            x="50"
            y="62"
            textAnchor="middle"
            className="fill-white dark:fill-slate-900"
            style={{
                fontSize: '38px',
                fontWeight: 800,
                fontFamily: "'Inter', 'SF Pro Display', 'Segoe UI', system-ui, sans-serif",
                letterSpacing: '1px',
            }}
        >
            CIC
        </text>
    </svg>
);
