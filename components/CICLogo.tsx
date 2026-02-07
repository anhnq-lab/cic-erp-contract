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
 * Supports orange/blue accent switching via .accent-blue CSS class.
 * Responsive to light/dark mode.
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

   Faithful to the original CIC corporate logo:
   6 horizontal bars per letter column with:
   - C (left):  all bars full-width, but rows 1-4 (middle) are
     shorter on the right → creating the C opening
   - I (center): all bars full width (narrow column)
   - C (right): mirrored C, shorter on the left for middle rows

   Layout (viewBox 0 0 300 130):
   - C-left:   x=0…80
   - gap:      80…96
   - I-center: 96…172
   - gap:      172…188
   - C-right:  188…268
   ═══════════════════════════════════════════════════════════════ */

/**
 * Reactively watches <html> classList for accent & dark mode
 */
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

    // ── Geometry ──
    const vbW = 300;
    const vbH = 130;
    const rows = 6;
    const barH = 15;
    const gapY = 5;
    const rx = 2;

    const totalH = rows * barH + (rows - 1) * gapY;
    const y0 = (vbH - totalH) / 2;

    // Letter column positions
    const cL = { x: 8, fullW: 78, shortW: 48 };       // Left C
    const iM = { x: 104, w: 60 };                       // Center I
    const cR = { endX: 292, fullW: 78, shortW: 48 };   // Right C (mirrored)

    const gapBetween = 18; // visual gap between letters

    // Gradient
    const stops = isBlue
        ? isDark
            ? ['#0EA5E9', '#38BDF8', '#7DD3FC']
            : ['#0369A1', '#0284C7', '#0EA5E9']
        : isDark
            ? ['#F97316', '#FB923C', '#FDBA74']
            : ['#C2410C', '#EA580C', '#F97316'];

    // Build bar data
    type Bar = { x: number; y: number; w: number };
    const bars: Bar[] = [];

    for (let i = 0; i < rows; i++) {
        const y = y0 + i * (barH + gapY);
        const isEdge = (i === 0 || i === rows - 1);

        // Left C
        bars.push({ x: cL.x, y, w: isEdge ? cL.fullW : cL.shortW });

        // Center I
        bars.push({ x: iM.x, y, w: iM.w });

        // Right C (mirrored)
        const rW = isEdge ? cR.fullW : cR.shortW;
        bars.push({ x: cR.endX - rW, y, w: rW });
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
 * Compact CIC Icon for collapsed sidebar — Stripe mark only, proportionally scaled
 */
export const CICLogoIcon: React.FC<{ size?: number; className?: string }> = ({
    size = 36,
    className = ''
}) => (
    <div className={`flex items-center justify-center ${className}`}>
        <CICStripeMark width={size} height={size * 0.43} />
    </div>
);
