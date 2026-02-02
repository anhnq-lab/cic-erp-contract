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
 * CIC ERP Logo Component - Modern Professional Design
 * 
 * Design System (UI UX Pro Max):
 * - Style: Minimalism + Gradient Text
 * - Primary: Orange gradient (#F97316 → #DC2626)
 * - Typography: Bold Inter font
 * - Light/Dark mode aware
 */
const CICLogo: React.FC<CICLogoProps> = ({
    size = 'md',
    variant = 'full',
    className = ''
}) => {
    // Size configurations
    const sizeConfig = {
        xs: { cicSize: 20, erpSize: 12, gap: 4, since: 7 },
        sm: { cicSize: 26, erpSize: 14, gap: 6, since: 8 },
        md: { cicSize: 32, erpSize: 18, gap: 8, since: 9 },
        lg: { cicSize: 40, erpSize: 22, gap: 10, since: 10 },
        xl: { cicSize: 52, erpSize: 28, gap: 12, since: 11 },
    };

    const config = sizeConfig[size];

    return (
        <div className={`inline-flex items-center ${className}`} style={{ gap: config.gap }}>
            {/* CIC Text with Gradient - Modern Clean Style */}
            <div className="relative">
                <span
                    className="font-black tracking-tight bg-gradient-to-r from-orange-500 via-orange-600 to-red-600 bg-clip-text text-transparent"
                    style={{
                        fontSize: config.cicSize,
                        fontFamily: "'Inter', 'Segoe UI', system-ui, sans-serif",
                        lineHeight: 1,
                    }}
                >
                    CIC
                </span>
                {/* Subtle glow effect */}
                <span
                    className="absolute inset-0 font-black tracking-tight text-orange-500/10 dark:text-orange-400/5 blur-[2px] -z-10"
                    style={{
                        fontSize: config.cicSize,
                        fontFamily: "'Inter', 'Segoe UI', system-ui, sans-serif",
                        lineHeight: 1,
                    }}
                >
                    CIC
                </span>
            </div>

            {/* ERP Badge + Since (only for full variant) */}
            {variant === 'full' && (
                <div className="flex flex-col items-start leading-none">
                    <span
                        className="font-bold text-slate-700 dark:text-slate-200 tracking-wide"
                        style={{
                            fontSize: config.erpSize,
                            fontFamily: "'Inter', 'Segoe UI', system-ui, sans-serif",
                        }}
                    >
                        ERP
                    </span>
                    <span
                        className="font-semibold text-slate-400 dark:text-slate-500 tracking-[0.15em] uppercase"
                        style={{
                            fontSize: config.since,
                            fontFamily: "'Inter', 'Segoe UI', system-ui, sans-serif",
                        }}
                    >
                        Since 1990
                    </span>
                </div>
            )}
        </div>
    );
};

export default CICLogo;

/**
 * Compact CIC Icon for collapsed sidebar
 * Modern gradient style matching main logo
 */
export const CICLogoIcon: React.FC<{ size?: number; className?: string }> = ({
    size = 36,
    className = ''
}) => (
    <div className={`relative flex items-center justify-center ${className}`}>
        <span
            className="font-black tracking-tight bg-gradient-to-r from-orange-500 via-orange-600 to-red-600 bg-clip-text text-transparent"
            style={{
                fontSize: size * 0.6,
                fontFamily: "'Inter', 'Segoe UI', system-ui, sans-serif",
                lineHeight: 1,
            }}
        >
            CIC
        </span>
        {/* Subtle glow */}
        <span
            className="absolute font-black tracking-tight text-orange-500/15 dark:text-orange-400/10 blur-[1px] -z-10"
            style={{
                fontSize: size * 0.6,
                fontFamily: "'Inter', 'Segoe UI', system-ui, sans-serif",
                lineHeight: 1,
            }}
        >
            CIC
        </span>
    </div>
);
