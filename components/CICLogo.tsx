import React from 'react';

interface CICLogoProps {
    /** Logo size variant */
    size?: 'xs' | 'sm' | 'md' | 'lg' | 'xl';
    /** Show full logo with text, or compact icon only */
    variant?: 'full' | 'compact';
    /** Custom className for additional styling */
    className?: string;
}

/**
 * CIC ERP Logo — Shield/Badge Mark
 * 
 * Modern geometric shield with "CIC" monogram.
 * Responsive to light/dark mode via currentColor + gradient.
 * Clean SVG paths, no pixel-bar rects.
 */
const CICLogo: React.FC<CICLogoProps> = ({
    size = 'md',
    variant = 'full',
    className = ''
}) => {
    const sizeConfig = {
        xs: { icon: 20, text: 10, gap: 4 },
        sm: { icon: 28, text: 12, gap: 6 },
        md: { icon: 36, text: 15, gap: 8 },
        lg: { icon: 48, text: 18, gap: 10 },
        xl: { icon: 64, text: 24, gap: 14 },
    };

    const config = sizeConfig[size];
    const gradientId = `cic-shield-grad-${size}`;
    const gradientIdDark = `cic-shield-grad-dark-${size}`;

    return (
        <div className={`inline-flex items-center ${className}`} style={{ gap: config.gap }}>
            {/* Shield Icon */}
            <svg
                width={config.icon}
                height={config.icon}
                viewBox="0 0 64 64"
                fill="none"
                xmlns="http://www.w3.org/2000/svg"
                className="flex-shrink-0"
            >
                <defs>
                    {/* Light mode gradient */}
                    <linearGradient id={gradientId} x1="0" y1="0" x2="64" y2="64" gradientUnits="userSpaceOnUse">
                        <stop offset="0%" stopColor="#EA580C" />
                        <stop offset="100%" stopColor="#F97316" />
                    </linearGradient>
                    {/* Dark mode: brighter tint */}
                    <linearGradient id={gradientIdDark} x1="0" y1="0" x2="64" y2="64" gradientUnits="userSpaceOnUse">
                        <stop offset="0%" stopColor="#FB923C" />
                        <stop offset="100%" stopColor="#FDBA74" />
                    </linearGradient>
                </defs>

                {/* Shield shape — rounded rectangle with pointed bottom */}
                <path
                    d="M8 6C8 3.79 9.79 2 12 2H52C54.21 2 56 3.79 56 6V36C56 42.5 50.5 50 32 62C13.5 50 8 42.5 8 36V6Z"
                    className="fill-[url(#cic-shield-grad-xs)] dark:fill-[url(#cic-shield-grad-dark-xs)]"
                    style={{ fill: `url(#${gradientId})` }}
                />
                {/* Dark mode override via CSS class */}
                <path
                    d="M8 6C8 3.79 9.79 2 12 2H52C54.21 2 56 3.79 56 6V36C56 42.5 50.5 50 32 62C13.5 50 8 42.5 8 36V6Z"
                    className="hidden dark:block"
                    style={{ fill: `url(#${gradientIdDark})` }}
                />

                {/* Inner shield border — lighter stroke */}
                <path
                    d="M12 8C12 6.9 12.9 6 14 6H50C51.1 6 52 6.9 52 8V34C52 39.5 47.2 46 32 56C16.8 46 12 39.5 12 34V8Z"
                    fill="white"
                    fillOpacity="0.15"
                />

                {/* CIC Text inside shield */}
                <text
                    x="32"
                    y="36"
                    textAnchor="middle"
                    dominantBaseline="central"
                    fill="white"
                    fontFamily="'Inter', 'Segoe UI', system-ui, sans-serif"
                    fontWeight="900"
                    fontSize="18"
                    letterSpacing="1.5"
                >
                    CIC
                </text>
            </svg>

            {/* Text label (only for full variant) */}
            {variant === 'full' && (
                <div className="flex flex-col leading-none">
                    <span
                        className="font-black tracking-wider text-slate-800 dark:text-slate-100"
                        style={{
                            fontSize: config.text,
                            fontFamily: "'Inter', 'Segoe UI', system-ui, sans-serif",
                        }}
                    >
                        CIC ERP
                    </span>
                    {size !== 'xs' && size !== 'sm' && (
                        <span
                            className="font-medium text-slate-500 dark:text-slate-400 tracking-wide mt-0.5"
                            style={{
                                fontSize: Math.max(8, config.text * 0.55),
                                fontFamily: "'Inter', 'Segoe UI', system-ui, sans-serif",
                            }}
                        >
                            Contract Management
                        </span>
                    )}
                </div>
            )}
        </div>
    );
};

export default CICLogo;

/**
 * Compact CIC Icon for collapsed sidebar — Shield mark only
 */
export const CICLogoIcon: React.FC<{ size?: number; className?: string }> = ({
    size = 36,
    className = ''
}) => (
    <svg
        width={size}
        height={size}
        viewBox="0 0 64 64"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        className={className}
    >
        <defs>
            <linearGradient id="cic-icon-grad" x1="0" y1="0" x2="64" y2="64" gradientUnits="userSpaceOnUse">
                <stop offset="0%" stopColor="#EA580C" />
                <stop offset="100%" stopColor="#F97316" />
            </linearGradient>
            <linearGradient id="cic-icon-grad-dark" x1="0" y1="0" x2="64" y2="64" gradientUnits="userSpaceOnUse">
                <stop offset="0%" stopColor="#FB923C" />
                <stop offset="100%" stopColor="#FDBA74" />
            </linearGradient>
        </defs>

        {/* Shield */}
        <path
            d="M8 6C8 3.79 9.79 2 12 2H52C54.21 2 56 3.79 56 6V36C56 42.5 50.5 50 32 62C13.5 50 8 42.5 8 36V6Z"
            fill="url(#cic-icon-grad)"
        />

        {/* Inner highlight */}
        <path
            d="M12 8C12 6.9 12.9 6 14 6H50C51.1 6 52 6.9 52 8V34C52 39.5 47.2 46 32 56C16.8 46 12 39.5 12 34V8Z"
            fill="white"
            fillOpacity="0.15"
        />

        {/* CIC Text */}
        <text
            x="32"
            y="36"
            textAnchor="middle"
            dominantBaseline="central"
            fill="white"
            fontFamily="'Inter', 'Segoe UI', system-ui, sans-serif"
            fontWeight="900"
            fontSize="18"
            letterSpacing="1.5"
        >
            CIC
        </text>
    </svg>
);
