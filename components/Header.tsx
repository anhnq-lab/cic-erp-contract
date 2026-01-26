
import React from 'react';
import { Search, Bell, User, Menu } from 'lucide-react';

interface HeaderProps {
  onMenuClick: () => void;
  isSidebarCollapsed: boolean;
}

const Header: React.FC<HeaderProps> = ({ onMenuClick, isSidebarCollapsed }) => {
  const marginClass = isSidebarCollapsed ? 'md:ml-20' : 'md:ml-64';

  return (
    <header className={`h-16 border-b border-slate-200 dark:border-slate-800 bg-white/80 dark:bg-slate-900/80 backdrop-blur-md flex items-center justify-between px-4 md:px-8 sticky top-0 z-30 transition-all duration-300 ${marginClass}`}>
      <div className="flex items-center gap-4 flex-1">
        <button 
          onClick={onMenuClick}
          className="p-2 text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg md:hidden"
        >
          <Menu size={24} />
        </button>
        
        <div className="flex items-center bg-slate-100 dark:bg-slate-800 px-3 py-2 rounded-xl w-full max-w-[120px] sm:max-w-xs md:max-w-md border border-transparent focus-within:border-indigo-300 dark:focus-within:border-indigo-900/50 transition-all">
          <Search size={18} className="text-slate-400 mr-2 flex-shrink-0" />
          <input 
            type="text" 
            placeholder="Tìm kiếm..." 
            className="bg-transparent border-none outline-none text-sm w-full text-slate-700 dark:text-slate-200"
          />
        </div>
      </div>
      
      <div className="flex items-center gap-1 sm:gap-4 ml-2">
        <button className="relative p-2 text-slate-500 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-full transition-colors">
          <Bell size={20} />
          <span className="absolute top-1 right-1 w-2 h-2 bg-red-500 rounded-full border-2 border-white dark:border-slate-900"></span>
        </button>
        <div className="h-8 w-[1px] bg-slate-200 dark:bg-slate-700 mx-1 hidden sm:block"></div>
        <div className="flex items-center gap-2 sm:gap-3 pl-1 sm:pl-2">
          <div className="text-right hidden sm:block">
            <p className="text-sm font-semibold text-slate-800 dark:text-slate-100 leading-none">Admin User</p>
            <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-1 leading-none">Quản trị viên</p>
          </div>
          <div className="w-8 h-8 sm:w-10 sm:h-10 rounded-full bg-gradient-to-br from-indigo-500 to-purple-500 flex items-center justify-center text-white shadow-sm overflow-hidden flex-shrink-0">
            <img src="https://picsum.photos/seed/admin/40/40" alt="avatar" />
          </div>
        </div>
      </div>
    </header>
  );
};

export default Header;
