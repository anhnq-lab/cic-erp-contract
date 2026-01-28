
import React from 'react';
import { NAV_ITEMS } from '../constants';
import { X, ChevronLeft, ChevronRight } from 'lucide-react';

interface SidebarProps {
  activeTab: string;
  setActiveTab: (tab: string) => void;
  isOpen: boolean;
  isCollapsed: boolean;
  setIsCollapsed: (collapsed: boolean) => void;
  onClose: () => void;
}

interface NavItemProps {
  item: typeof NAV_ITEMS[0];
  activeTab: string;
  setActiveTab: (tab: string) => void;
  isCollapsed: boolean;
  onClose: () => void;
}

const NavItem: React.FC<NavItemProps> = ({ item, activeTab, setActiveTab, isCollapsed, onClose }) => (
  <button
    onClick={() => {
      setActiveTab(item.id);
      if (window.innerWidth < 768) onClose();
    }}
    className={`w-full flex items-center gap-3 px-4 py-3 text-sm font-medium rounded-xl transition-all mb-1 ${activeTab === item.id
      ? 'bg-indigo-50 dark:bg-indigo-900/30 text-indigo-700 dark:text-indigo-300'
      : 'text-slate-500 hover:bg-slate-50 dark:hover:bg-slate-800 hover:text-slate-700 dark:hover:text-slate-200'
      } ${isCollapsed ? 'md:px-0 md:justify-center' : ''}`}
    title={isCollapsed ? item.label : ''}
  >
    <span className={`transition-all ${activeTab === item.id ? 'text-indigo-600 dark:text-indigo-400' : 'text-slate-400'} ${isCollapsed ? 'md:scale-110' : ''}`}>
      {item.icon}
    </span>
    <span className={`transition-all duration-300 whitespace-nowrap overflow-hidden ${isCollapsed ? 'md:w-0 md:opacity-0' : 'w-auto opacity-100'}`}>
      {item.label}
    </span>
  </button>
);

const Sidebar: React.FC<SidebarProps> = ({
  activeTab,
  setActiveTab,
  isOpen,
  isCollapsed,
  setIsCollapsed,
  onClose,
}) => {
  const managementItems = NAV_ITEMS.filter(item => ['dashboard', 'contracts', 'payments', 'analytics', 'ai-assistant'].includes(item.id));
  const categoryItems = NAV_ITEMS.filter(item => ['units', 'personnel', 'products', 'customers'].includes(item.id));
  const settingsItem = NAV_ITEMS.find(item => item.id === 'settings');

  return (
    <>
      {/* Mobile Backdrop */}
      {isOpen && (
        <div
          className="fixed inset-0 bg-slate-900/50 dark:bg-slate-950/60 backdrop-blur-sm z-40 md:hidden"
          onClick={onClose}
        />
      )}

      <div className={`
        fixed left-0 top-0 h-full bg-white dark:bg-slate-900 border-r border-slate-200 dark:border-slate-800 flex flex-col z-50 transition-all duration-300 ease-in-out
        ${isCollapsed ? 'md:w-20' : 'md:w-64'} 
        ${isOpen ? 'translate-x-0 w-64' : '-translate-x-full md:translate-x-0'}
      `}>
        {/* Header & Logo */}
        <div className={`p-4 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between ${isCollapsed ? 'md:px-2 md:justify-center' : ''}`}>
          <div className={`flex items-center gap-2 overflow-hidden transition-all ${isCollapsed ? 'md:hidden' : 'w-auto'}`}>
            <div className="w-8 h-8 bg-indigo-600 rounded-lg flex items-center justify-center text-white font-bold flex-shrink-0">CIC</div>
            <span className="text-xl font-bold text-slate-800 dark:text-slate-100 tracking-tight whitespace-nowrap">CIC ERP</span>
          </div>

          {/* Collapse Toggle Button - Top */}
          <button
            onClick={() => setIsCollapsed(!isCollapsed)}
            className={`hidden md:flex p-2 text-slate-400 hover:text-indigo-600 dark:hover:text-indigo-400 hover:bg-indigo-50 dark:hover:bg-indigo-900/20 rounded-xl transition-all ${isCollapsed ? 'w-full justify-center' : ''}`}
          >
            {isCollapsed ? <ChevronRight size={20} /> : <ChevronLeft size={20} />}
          </button>

          {/* Mobile Close */}
          <div className="flex items-center gap-1 md:hidden">
            <button onClick={onClose} className="p-2 text-slate-400 hover:text-slate-600">
              <X size={20} />
            </button>
          </div>
        </div>

        {/* Scrollable Content */}
        <div className={`flex-1 overflow-y-auto p-4 ${isCollapsed ? 'md:px-2' : ''}`}>

          {/* Group: Quản trị */}
          <div className="mb-6">
            {!isCollapsed && <p className="px-4 text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">Quản trị</p>}
            <nav>
              {managementItems.map((item) => (
                <NavItem
                  key={item.id}
                  item={item}
                  activeTab={activeTab}
                  setActiveTab={setActiveTab}
                  isCollapsed={isCollapsed}
                  onClose={onClose}
                />
              ))}
            </nav>
          </div>

          <div className="w-full h-px bg-slate-100 dark:bg-slate-800 my-4 md:hidden"></div>

          {/* Group: Danh mục */}
          <div>
            {!isCollapsed && <p className="px-4 text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">Danh mục</p>}
            <nav>
              {categoryItems.map((item) => (
                <NavItem
                  key={item.id}
                  item={item}
                  activeTab={activeTab}
                  setActiveTab={setActiveTab}
                  isCollapsed={isCollapsed}
                  onClose={onClose}
                />
              ))}
            </nav>
          </div>

        </div>

        {/* Bottom: Settings */}
        <div className={`p-4 border-t border-slate-100 dark:border-slate-800 ${isCollapsed ? 'md:px-2' : ''}`}>
          {settingsItem && (
            <NavItem
              item={settingsItem}
              activeTab={activeTab}
              setActiveTab={setActiveTab}
              isCollapsed={isCollapsed}
              onClose={onClose}
            />
          )}
        </div>
      </div>
    </>
  );
};

export default Sidebar;
