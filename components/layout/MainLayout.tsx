import React, { useState, useEffect } from 'react';
import { Outlet, useNavigate, useLocation } from 'react-router-dom';
import { Toaster } from 'sonner';
import { Moon, Sun } from 'lucide-react';
import Sidebar from '../Sidebar';
import Header from '../Header';
import { RoleSwitcher } from '../RoleSwitcher';
import DebugPanel from '../DebugPanel';
import CommandPalette from '../ui/CommandPalette';
import { useAuth } from '../../contexts/AuthContext';
import Auth from '../Auth';
import ErrorBoundary from '../ErrorBoundary';
import { Unit } from '../../types';

const MainLayout: React.FC = () => {
    const navigate = useNavigate();
    const location = useLocation();
    const { session, isLoading: isLoadingSession, profile } = useAuth();

    // Sidebar state
    const [isSidebarOpen, setIsSidebarOpen] = useState(false);
    const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);

    // Unit selection (shared across dashboard/analytics)
    const ALL_UNIT: Unit = {
        id: 'all',
        name: 'Toàn công ty',
        code: 'ALL',
        type: 'Company',
        target: { signing: 0, revenue: 0, adminProfit: 0, revProfit: 0, cash: 0 },
        lastYearActual: { signing: 0, revenue: 0, adminProfit: 0, revProfit: 0, cash: 0 }
    };
    const [selectedUnit, setSelectedUnit] = useState<Unit>(ALL_UNIT);

    // Theme management — 2 axes: mode (light/dark) + accent (orange/blue)
    const [theme, setTheme] = useState<'light' | 'dark'>(() => {
        const saved = localStorage.getItem('contract-pro-theme');
        // Migrate legacy 'blue' theme: convert to dark mode + blue accent
        if (saved === 'blue') {
            localStorage.setItem('contract-pro-theme', 'dark');
            localStorage.setItem('contract-pro-accent', 'blue');
            return 'dark';
        }
        if (saved === 'light' || saved === 'dark') return saved;
        if (window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches) return 'dark';
        return 'light';
    });

    const [accent, setAccent] = useState<'orange' | 'blue'>(() => {
        const saved = localStorage.getItem('contract-pro-accent');
        if (saved === 'orange' || saved === 'blue') return saved;
        return 'orange';
    });

    useEffect(() => {
        const root = window.document.documentElement;
        root.classList.remove('dark');
        if (theme === 'dark') root.classList.add('dark');
        localStorage.setItem('contract-pro-theme', theme);
    }, [theme]);

    useEffect(() => {
        const root = window.document.documentElement;
        root.classList.remove('accent-blue');
        if (accent === 'blue') root.classList.add('accent-blue');
        localStorage.setItem('contract-pro-accent', accent);
    }, [accent]);

    // Responsive sidebar
    useEffect(() => {
        const handleResize = () => {
            if (window.innerWidth >= 768) {
                setIsSidebarOpen(false);
            }
        };
        window.addEventListener('resize', handleResize);
        return () => window.removeEventListener('resize', handleResize);
    }, []);

    // Derive activeTab from location for Sidebar highlighting
    const getActiveTab = () => {
        const path = location.pathname;
        if (path === '/' || path === '/dashboard') return 'dashboard';
        if (path.startsWith('/contracts')) return 'contracts';
        if (path.startsWith('/payments')) return 'payments';
        if (path.startsWith('/analytics')) return 'analytics';
        if (path.startsWith('/ai-assistant')) return 'ai-assistant';
        if (path.startsWith('/personnel')) return 'personnel';
        if (path.startsWith('/customers')) return 'customers';
        if (path.startsWith('/products')) return 'products';
        if (path.startsWith('/units')) return 'units';
        if (path.startsWith('/settings')) return 'settings';
        return 'dashboard';
    };

    // Loading state
    if (isLoadingSession) {
        return <div className="min-h-screen bg-slate-50 dark:bg-slate-950 flex items-center justify-center text-slate-400">Loading...</div>;
    }

    // Auth required
    if (!session) {
        return (
            <ErrorBoundary>
                <Auth />
            </ErrorBoundary>
        );
    }

    const mainMarginClass = isSidebarCollapsed ? 'md:ml-20' : 'md:ml-64';
    const contentMaxWidthClass = isSidebarCollapsed ? 'max-w-[1920px]' : 'max-w-[1600px]';

    return (
        <ErrorBoundary>
            <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 dark:from-slate-950 dark:to-slate-900 antialiased">
                <Toaster position="top-center" richColors closeButton />

                {/* Sidebar */}
                <Sidebar
                    activeTab={getActiveTab()}
                    setActiveTab={(tab) => navigate(`/${tab === 'dashboard' ? '' : tab}`)}
                    isOpen={isSidebarOpen}
                    isCollapsed={isSidebarCollapsed}
                    setIsCollapsed={setIsSidebarCollapsed}
                    onClose={() => setIsSidebarOpen(false)}
                />

                {/* Main Content */}
                <div className={`transition-all duration-300 ${mainMarginClass}`}>
                    {/* Header */}
                    <Header
                        onMenuClick={() => setIsSidebarOpen(!isSidebarOpen)}
                        isSidebarCollapsed={isSidebarCollapsed}
                    />

                    {/* Page Content */}
                    <main className="mt-16 p-4 md:p-6 lg:p-8">
                        <div className={`${contentMaxWidthClass} mx-auto`}>
                            {/* Pass context to child routes via Outlet */}
                            <Outlet context={{ selectedUnit, setSelectedUnit, theme, setTheme, accent, setAccent }} />
                        </div>
                    </main>
                </div>

                {/* Development Tools */}
                {profile?.role === 'Admin' && <RoleSwitcher />}
                <DebugPanel />

                {/* Global Search (Cmd+K) */}
                <CommandPalette />
            </div>
        </ErrorBoundary>
    );
};

export default MainLayout;

// Hook to access layout context in child routes
import { useOutletContext } from 'react-router-dom';

interface LayoutContext {
    selectedUnit: Unit;
    setSelectedUnit: (unit: Unit) => void;
    theme: 'light' | 'dark';
    setTheme: (theme: 'light' | 'dark') => void;
    accent: 'orange' | 'blue';
    setAccent: (accent: 'orange' | 'blue') => void;
}

export function useLayoutContext() {
    return useOutletContext<LayoutContext>();
}
