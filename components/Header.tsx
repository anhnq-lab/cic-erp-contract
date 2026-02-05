
import React, { useState, useRef, useEffect } from 'react';
import { Search, Bell, Menu, LogOut, ChevronDown, User } from 'lucide-react';
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
    setShowUserMenu(false);
    await signOut();
  };

  return (
    <header className={`h-16 border-b border-slate-200 dark:border-slate-800 bg-white/80 dark:bg-slate-900/80 backdrop-blur-md flex items-center justify-between px-4 md:px-8 sticky top-0 z-30 transition-all duration-300 ${marginClass}`}>
      <div className="flex items-center gap-4 flex-1">
        <button
          onClick={onMenuClick}
          className="p-2 text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg md:hidden"
        >
          <Menu size={24} />
        </button>

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
            className="flex items-center gap-2 sm:gap-3 pl-1 sm:pl-2 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-xl py-1.5 px-2 transition-colors"
          >
            <div className="text-right hidden sm:block">
              <p className="text-sm font-semibold text-slate-800 dark:text-slate-100 leading-none truncate max-w-[150px]">
                {user?.user_metadata?.full_name || user?.email || 'Admin User'}
              </p>
              <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-1 leading-none">
                {user?.email || 'Quản trị viên'}
              </p>
            </div>
            <div className="w-8 h-8 sm:w-10 sm:h-10 rounded-full bg-gradient-to-br from-indigo-500 to-purple-500 flex items-center justify-center text-white shadow-sm overflow-hidden flex-shrink-0">
              {user?.user_metadata?.avatar_url ? (
                <img src={user.user_metadata.avatar_url} alt="avatar" className="w-full h-full object-cover" />
              ) : (
                <span className="font-bold text-sm">{(user?.email?.[0] || 'A').toUpperCase()}</span>
              )}
            </div>
            <ChevronDown size={16} className={`text-slate-400 hidden sm:block transition-transform ${showUserMenu ? 'rotate-180' : ''}`} />
          </button>

          {/* Dropdown Menu */}
          {showUserMenu && (
            <div className="absolute right-0 top-full mt-2 w-56 bg-white dark:bg-slate-800 rounded-xl shadow-lg border border-slate-200 dark:border-slate-700 py-2 z-50 animate-in fade-in slide-in-from-top-2 duration-200">
              <div className="px-4 py-3 border-b border-slate-200 dark:border-slate-700">
                <p className="text-sm font-medium text-slate-800 dark:text-slate-100 truncate">
                  {user?.user_metadata?.full_name || 'Admin User'}
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

