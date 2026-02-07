import React, { useEffect, useState, useId } from 'react';

interface CICLogoProps {
    /** Logo size variant */
    size?: 'xs' | 'sm' | 'md' | 'lg' | 'xl';
    /** Show full logo with text, or compact icon only */
    variant?: 'full' | 'compact';
    /** Custom className for additional styling */
    className?: string;
}

/**
 * CIC ERP Logo — Horizontal-Stripe Letterform Mark
 *
 * Faithfully inspired by the original CIC corporate identity:
 * Three bold horizontal-bar letterforms forming "CIC".
 * Both C letters open to the RIGHT (same direction).
 * Supports orange/blue accent switching via .accent-blue CSS class.
 */
const CICLogo: React.FC<CICLogoProps> = ({
    size = 'md',
    variant = 'full',
    className = ''
}) => {
    const sizeConfig = {
        xs: { iconW: 44, iconH: 20, text: 10, sub: 6, gap: 4 },
        sm: { iconW: 60, iconH: 27, text: 13, sub: 7.5, gap: 6 },
        md: { iconW: 76, iconH: 34, text: 16, sub: 8.5, gap: 8 },
        lg: { iconW: 100, iconH: 45, text: 20, sub: 10, gap: 10 },
        xl: { iconW: 140, iconH: 63, text: 28, sub: 14, gap: 14 },
    };

    const config = sizeConfig[size];

    return (
        <div className={`inline-flex items-center ${className}`} style={{ gap: config.gap }}>
            <CICStripeMark width={config.iconW} height={config.iconH} />

            {variant === 'full' && (
                <div className="flex flex-col leading-none select-none">
                    <span
                        className="font-black tracking-wider text-slate-800 dark:text-slate-100"
                        style={{
                            fontSize: config.text,
                            fontFamily: "'Inter', 'Segoe UI', system-ui, sans-serif",
                            letterSpacing: '0.08em',
                        }}
                    >
                        CIC ERP
                    </span>
                    {size !== 'xs' && size !== 'sm' && (
                        <span
                            className="font-medium text-slate-400 dark:text-slate-500 tracking-wide"
                            style={{
                                fontSize: config.sub,
                                fontFamily: "'Inter', 'Segoe UI', system-ui, sans-serif",
                                letterSpacing: '0.03em',
                                marginTop: 1.5,
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

/* ═══════════════════════════════════════════════════════════════
   Core SVG Mark — Horizontal-stripe "CIC" letterform

   Original CIC logo: both C letters open to the RIGHT.
   6 horizontal bars per letter, with the C bars gradually
   shorter in the middle rows for a rounded C appearance.

   Layout (viewBox 0 0 300 130):
   - C-left:   x=8, opening RIGHT
   - I-center: centered bars
   - C-right:  x=196, opening RIGHT (same as left C)
   ═══════════════════════════════════════════════════════════════ */

function useThemeAccent() {
    const [isBlue, setIsBlue] = useState(() =>
        typeof document !== 'undefined' && document.documentElement.classList.contains('accent-blue')
    );
    const [isDark, setIsDark] = useState(() =>
        typeof document !== 'undefined' && document.documentElement.classList.contains('dark')
    );

    useEffect(() => {
        const el = document.documentElement;
        const sync = () => {
            setIsBlue(el.classList.contains('accent-blue'));
            setIsDark(el.classList.contains('dark'));
        };
        sync();
        const observer = new MutationObserver(sync);
        observer.observe(el, { attributes: true, attributeFilter: ['class'] });
        return () => observer.disconnect();
    }, []);

    return { isBlue, isDark };
}

interface CICStripeMarkProps {
    width: number;
    height: number;
    className?: string;
}

const CICStripeMark: React.FC<CICStripeMarkProps> = ({ width, height, className = '' }) => {
    const { isBlue, isDark } = useThemeAccent();
    const gradId = useId().replace(/:/g, '_');

    const vbW = 300;
    const vbH = 130;
    const rows = 6;
    const barH = 15;
    const gapY = 5;
    const rx = 3.5; // More rounded corners

    const totalH = rows * barH + (rows - 1) * gapY;
    const y0 = (vbH - totalH) / 2;

    // Per-row widths for C letter — gradually shorter in the middle
    // for a smooth, rounded C shape (not just edge/non-edge)
    // Row 0 (top):    full width  (closing the C at top)
    // Row 1:          slightly shorter
    // Row 2:          shortest (deepest part of C opening)
    // Row 3:          shortest
    // Row 4:          slightly shorter
    // Row 5 (bottom): full width  (closing the C at bottom)
    const cFullW = 78;
    const cBarWidths = [
        cFullW,         // row 0 — top bar, full
        cFullW * 0.68,  // row 1
        cFullW * 0.55,  // row 2 — deepest
        cFullW * 0.55,  // row 3 — deepest
        cFullW * 0.68,  // row 4
        cFullW,         // row 5 — bottom bar, full
    ];

    // I column width (center letter, slightly narrower)
    const iW = 56;

    // Column x positions — both Cs open to the RIGHT
    const cLeftX = 8;       // Left C starts here
    const iCenterX = 104;   // Center I starts here
    const cRightX = 196;    // Right C starts here (same orientation as left)

    // Gradient: shifted towards RED-orange per user request
    const stops = isBlue
        ? isDark
            ? ['#0EA5E9', '#38BDF8', '#7DD3FC']    // dark+blue
            : ['#0369A1', '#0284C7', '#0EA5E9']    // light+blue
        : isDark
            ? ['#E8471C', '#F06030', '#FB923C']     // dark+red-orange
            : ['#C92A10', '#D94215', '#E8561C'];    // light+red-orange (deeper red)

    type Bar = { x: number; y: number; w: number };
    const bars: Bar[] = [];

    for (let i = 0; i < rows; i++) {
        const y = y0 + i * (barH + gapY);
        const cW = cBarWidths[i];

        // ─── Left C (opening RIGHT) ───
        // All bars start at cLeftX, shorter bars = opening on the right
        bars.push({ x: cLeftX, y, w: cW });

        // ─── Center I ───
        bars.push({ x: iCenterX, y, w: iW });

        // ─── Right C (opening RIGHT, same as left C) ───
        // Same orientation: bars start at cRightX, shorter bars on the right
        bars.push({ x: cRightX, y, w: cW });
    }

    return (
        <svg
            width={width}
            height={height}
            viewBox={`0 0 ${vbW} ${vbH}`}
            fill="none"
            xmlns="http://www.w3.org/2000/svg"
            className={`flex-shrink-0 ${className}`}
            role="img"
            aria-label="CIC Logo"
        >
            <defs>
                <linearGradient id={gradId} x1="0" y1="0" x2={vbW} y2={vbH} gradientUnits="userSpaceOnUse">
                    <stop offset="0%" stopColor={stops[0]} />
                    <stop offset="50%" stopColor={stops[1]} />
                    <stop offset="100%" stopColor={stops[2]} />
                </linearGradient>
            </defs>

            <g fill={`url(#${gradId})`}>
                {bars.map((b, i) => (
                    <rect key={i} x={b.x} y={b.y} width={b.w} height={barH} rx={rx} ry={rx} />
                ))}
            </g>
        </svg>
    );
};

/**
 * Compact CIC Icon for collapsed sidebar — Stripe mark only
 */
export const CICLogoIcon: React.FC<{ size?: number; className?: string }> = ({
    size = 36,
    className = ''
}) => (
    <div className={`flex items-center justify-center ${className}`}>
        <CICStripeMark width={size} height={size * 0.43} />
    </div>
);
