/**
 * Theme-aware chart colors utility
 * Returns correct color palette based on current theme (light/dark/blue)
 */

export type ThemeName = 'light' | 'dark' | 'blue';

export function getTheme(): ThemeName {
    const root = document.documentElement;
    if (root.classList.contains('theme-blue')) return 'blue';
    if (root.classList.contains('dark')) return 'dark';
    return 'light';
}

export function isDarkTheme(): boolean {
    const root = document.documentElement;
    return root.classList.contains('dark') || root.classList.contains('theme-blue');
}

// Primary accent color per theme
export function getAccentColor(): string {
    return getTheme() === 'blue' ? '#0ea5e9' : '#f97316';
}

export function getAccentColorLight(): string {
    return getTheme() === 'blue' ? '#38bdf8' : '#fb923c';
}

// Chart COLORS palette — professional, harmonious
const CHART_COLORS_DEFAULT = ['#f97316', '#10b981', '#6366f1', '#8b5cf6', '#06b6d4', '#ec4899', '#f59e0b'];
const CHART_COLORS_BLUE = ['#0ea5e9', '#10b981', '#6366f1', '#8b5cf6', '#06b6d4', '#ec4899', '#818cf8'];

export function getChartColors(): string[] {
    return getTheme() === 'blue' ? CHART_COLORS_BLUE : CHART_COLORS_DEFAULT;
}

// Tooltip / grid styles for Recharts
export function getTooltipStyle(): React.CSSProperties {
    const dark = isDarkTheme();
    const theme = getTheme();
    return {
        borderRadius: 12,
        border: dark ? (theme === 'blue' ? '1px solid #1c3654' : '1px solid #293548') : '1px solid #e2e8f0',
        boxShadow: '0 20px 25px -5px rgb(0 0 0 / 0.2)',
        background: dark ? (theme === 'blue' ? '#0d2137' : '#1e293b') : '#fff',
        color: dark ? '#e2e8f0' : '#1e293b',
        padding: '12px 20px',
    };
}

export function getGridStroke(): string {
    const theme = getTheme();
    if (theme === 'blue') return '#1c3654';
    if (theme === 'dark') return '#293548';
    return '#e2e8f0';
}

export function getCursorFill(): string {
    const theme = getTheme();
    if (theme === 'blue') return 'rgba(28,54,84,0.3)';
    if (theme === 'dark') return 'rgba(41,53,72,0.3)';
    return '#f8fafc';
}

export function getMutedBarFill(): string {
    const theme = getTheme();
    if (theme === 'blue') return '#1c3654';
    if (theme === 'dark') return '#293548';
    return '#e2e8f0';
}
