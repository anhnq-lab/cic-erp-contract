
import React, { useState, useRef, useEffect } from 'react';
import { Search, Bell, Menu, LogOut, ChevronDown } from 'lucide-react';
import { User as SupabaseUser } from '@supabase/supabase-js';
import { useAuth } from '../contexts/AuthContext';

interface HeaderProps {
  onMenuClick: () => void;
  isSidebarCollapsed: boolean;
  user?: SupabaseUser | null;
}

const Header: React.FC<HeaderProps> = ({ onMenuClick, isSidebarCollapsed, user }) => {
  const marginClass = isSidebarCollapsed ? 'md:ml-20' : 'md:ml-64';
  const { signOut } = useAuth();
  const [showUserMenu, setShowUserMenu] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  // Close menu when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setShowUserMenu(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleSignOut = async () => {
    await signOut();
    setShowUserMenu(false);
  };

  const displayName = user?.user_metadata?.full_name || user?.email?.split('@')[0] || 'User';
  const initials = displayName.split(' ').map((n: string) => n[0]).join('').slice(0, 2).toUpperCase();

  return (
    <header className={`fixed top-0 left-0 right-0 h-16 bg-white/95 dark:bg-slate-900/95 backdrop-blur-sm border-b border-slate-200 dark:border-slate-800 ${marginClass} z-30 flex items-center justify-between px-4 transition-all duration-300`}>
      <div className="flex items-center gap-2 sm:gap-4">
        <button
          onClick={onMenuClick}
          className="md:hidden p-2 text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-xl transition-colors"
        >
          <Menu size={20} />
        </button>

        {/* Search Trigger - Opens CommandPalette */}
        <button
          onClick={() => {
            // Trigger CommandPalette
            window.dispatchEvent(new KeyboardEvent('keydown', { key: 'k', ctrlKey: true, bubbles: true }));
          }}
          className="flex items-center bg-slate-100 dark:bg-slate-800 px-3 py-2 rounded-xl w-full max-w-[120px] sm:max-w-xs md:max-w-md border border-transparent hover:border-orange-300 dark:hover:border-orange-700 transition-all cursor-pointer group"
        >
          <Search size={18} className="text-slate-400 mr-2 flex-shrink-0 group-hover:text-orange-500 transition-colors" />
          <span className="text-sm text-slate-400 text-left flex-1 truncate">Tìm kiếm...</span>
          <kbd className="hidden sm:inline-flex items-center gap-1 px-1.5 py-0.5 bg-white dark:bg-slate-700 text-[10px] font-bold text-slate-400 rounded border border-slate-200 dark:border-slate-600 ml-2">
            Ctrl+K
          </kbd>
        </button>
      </div>

      <div className="flex items-center gap-1 sm:gap-4 ml-2">
        <button className="relative p-2 text-slate-500 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-full transition-colors">
          <Bell size={20} />
          <span className="absolute top-1 right-1 w-2 h-2 bg-red-500 rounded-full border-2 border-white dark:border-slate-900"></span>
        </button>
        <div className="h-8 w-[1px] bg-slate-200 dark:bg-slate-700 mx-1 hidden sm:block"></div>

        {/* User Menu with Dropdown */}
        <div className="relative" ref={menuRef}>
          <button
            onClick={() => setShowUserMenu(!showUserMenu)}
            className="flex items-center gap-2 p-1.5 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-xl transition-colors"
          >
            <div className="w-9 h-9 rounded-full bg-gradient-to-br from-orange-500 to-amber-500 flex items-center justify-center">
              <span className="text-white text-sm font-bold">{initials}</span>
            </div>
            <div className="hidden sm:block text-left">
              <p className="text-sm font-semibold text-slate-700 dark:text-slate-200 truncate max-w-[120px]">
                {displayName}
              </p>
              <p className="text-xs text-slate-500 dark:text-slate-400">Admin</p>
            </div>
            <ChevronDown size={16} className={`hidden sm:block text-slate-400 transition-transform ${showUserMenu ? 'rotate-180' : ''}`} />
          </button>

          {/* Dropdown Menu */}
          {showUserMenu && (
            <div className="absolute right-0 top-full mt-2 w-64 bg-white dark:bg-slate-800 rounded-xl shadow-lg border border-slate-200 dark:border-slate-700 py-2 z-50">
              <div className="px-4 py-3 border-b border-slate-100 dark:border-slate-700">
                <p className="text-sm font-semibold text-slate-900 dark:text-slate-100 truncate">
                  {displayName}
                </p>
                <p className="text-xs text-slate-500 dark:text-slate-400 truncate">
                  {user?.email}
                </p>
              </div>
              <div className="py-1">
                <button
                  onClick={handleSignOut}
                  className="w-full flex items-center gap-3 px-4 py-2.5 text-sm text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors"
                >
                  <LogOut size={16} />
                  Đăng xuất
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </header>
  );
};

export default Header;
