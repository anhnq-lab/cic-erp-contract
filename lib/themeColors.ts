/**
 * Theme-aware chart colors utility
 * Checks 2 independent axes:
 *   - Mode: 'light' | 'dark' (via .dark class)
 *   - Accent: 'orange' | 'blue' (via .accent-blue class)
 */

export function isBlueAccent(): boolean {
    return document.documentElement.classList.contains('accent-blue');
}

export function isDarkTheme(): boolean {
    return document.documentElement.classList.contains('dark');
}

// Primary accent color based on accent setting
export function getAccentColor(): string {
    return isBlueAccent() ? '#0ea5e9' : '#f97316';
}

export function getAccentColorLight(): string {
    return isBlueAccent() ? '#38bdf8' : '#fb923c';
}

// Chart COLORS palette — professional, harmonious
const CHART_COLORS_DEFAULT = ['#f97316', '#10b981', '#6366f1', '#8b5cf6', '#06b6d4', '#ec4899', '#f59e0b'];
const CHART_COLORS_BLUE = ['#0ea5e9', '#10b981', '#6366f1', '#8b5cf6', '#06b6d4', '#ec4899', '#818cf8'];

export function getChartColors(): string[] {
    return isBlueAccent() ? CHART_COLORS_BLUE : CHART_COLORS_DEFAULT;
}

// Tooltip / grid styles for Recharts
export function getTooltipStyle(): React.CSSProperties {
    const dark = isDarkTheme();
    return {
        borderRadius: 12,
        border: dark ? '1px solid #293548' : '1px solid #e2e8f0',
        boxShadow: '0 20px 25px -5px rgb(0 0 0 / 0.2)',
        background: dark ? '#1e293b' : '#fff',
        color: dark ? '#e2e8f0' : '#1e293b',
        padding: '12px 20px',
    };
}

export function getGridStroke(): string {
    return isDarkTheme() ? '#293548' : '#e2e8f0';
}

export function getCursorFill(): string {
    return isDarkTheme() ? 'rgba(41,53,72,0.3)' : '#f8fafc';
}

export function getMutedBarFill(): string {
    return isDarkTheme() ? '#293548' : '#e2e8f0';
}
