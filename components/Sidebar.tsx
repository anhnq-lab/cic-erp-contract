
import React, { useState } from 'react';
import { NAV_ITEMS, MOCK_UNITS } from '../constants';
import { X, ChevronDown, Building2, Layers, ChevronLeft, ChevronRight } from 'lucide-react';
import { Unit } from '../types';

interface SidebarProps {
  activeTab: string;
  setActiveTab: (tab: string) => void;
  isOpen: boolean;
  isCollapsed: boolean;
  setIsCollapsed: (collapsed: boolean) => void;
  onClose: () => void;
  selectedUnit: Unit;
  onUnitChange: (unit: Unit) => void;
}

const Sidebar: React.FC<SidebarProps> = ({ 
  activeTab, 
  setActiveTab, 
  isOpen, 
  isCollapsed, 
  setIsCollapsed, 
  onClose, 
  selectedUnit, 
  onUnitChange 
}) => {
  const [showUnitSelector, setShowUnitSelector] = useState(false);

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
        <div className={`p-4 border-b border-slate-100 dark:border-slate-800 ${isCollapsed ? 'md:px-2' : ''}`}>
          <div className="flex items-center justify-between mb-6 px-2">
            <div className={`flex items-center gap-2 overflow-hidden transition-all ${isCollapsed ? 'md:w-0 md:opacity-0' : 'w-auto opacity-100'}`}>
              <div className="w-8 h-8 bg-indigo-600 rounded-lg flex items-center justify-center text-white font-bold flex-shrink-0">CP</div>
              <span className="text-xl font-bold text-slate-800 dark:text-slate-100 tracking-tight whitespace-nowrap">ContractPro</span>
            </div>
            
            {/* Show only icon when collapsed on desktop */}
            {isCollapsed && (
               <div className="hidden md:flex w-full items-center justify-center mb-0">
                  <div className="w-10 h-10 bg-indigo-600 rounded-xl flex items-center justify-center text-white font-bold shadow-lg shadow-indigo-200 dark:shadow-none">CP</div>
               </div>
            )}

            <div className="flex items-center gap-1 md:hidden">
              <button onClick={onClose} className="p-2 text-slate-400 hover:text-slate-600">
                <X size={20} />
              </button>
            </div>
          </div>

          {/* Unit Switcher */}
          <div className="relative">
            <button 
              onClick={() => setShowUnitSelector(!showUnitSelector)}
              className={`w-full flex items-center bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl hover:border-indigo-300 transition-all group overflow-hidden ${isCollapsed ? 'md:p-2 md:justify-center' : 'p-3 justify-between'}`}
            >
              <div className={`flex items-center gap-3 overflow-hidden text-left ${isCollapsed ? 'md:gap-0' : ''}`}>
                <div className={`w-8 h-8 rounded-lg bg-indigo-100 dark:bg-indigo-900/40 flex items-center justify-center text-indigo-600 dark:text-indigo-400 flex-shrink-0 transition-all ${isCollapsed ? 'md:w-10 md:h-10' : ''}`}>
                  {selectedUnit.id === 'all' ? <Building2 size={isCollapsed ? 20 : 18} /> : <Layers size={isCollapsed ? 20 : 18} />}
                </div>
                <div className={`overflow-hidden transition-all duration-300 ${isCollapsed ? 'md:w-0 md:opacity-0' : 'w-auto opacity-100'}`}>
                  <p className="text-[10px] text-slate-500 dark:text-slate-400 font-bold uppercase leading-none mb-1 whitespace-nowrap">Đơn vị</p>
                  <p className="text-sm font-bold text-slate-800 dark:text-slate-100 truncate leading-none">{selectedUnit.name}</p>
                </div>
              </div>
              <ChevronDown size={16} className={`text-slate-400 transition-all duration-300 ${showUnitSelector ? 'rotate-180' : ''} ${isCollapsed ? 'md:w-0 md:opacity-0' : 'w-auto opacity-100'}`} />
            </button>

            {showUnitSelector && (
              <div className={`absolute left-0 w-64 mt-2 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl shadow-xl z-10 py-2 animate-in fade-in zoom-in-95 duration-200 ${isCollapsed ? 'md:left-full md:ml-2 md:top-0' : 'top-full'}`}>
                {MOCK_UNITS.map((unit) => (
                  <button
                    key={unit.id}
                    onClick={() => {
                      onUnitChange(unit);
                      setShowUnitSelector(false);
                    }}
                    className={`w-full flex items-center gap-3 px-4 py-2 text-sm hover:bg-indigo-50 dark:hover:bg-indigo-900/30 transition-colors ${selectedUnit.id === unit.id ? 'text-indigo-700 dark:text-indigo-300 bg-indigo-50 dark:bg-indigo-900/20 font-bold' : 'text-slate-600 dark:text-slate-400'}`}
                  >
                    <div className={`w-2 h-2 rounded-full ${unit.id === 'all' ? 'bg-indigo-400' : 'bg-slate-300'}`}></div>
                    {unit.name}
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>
        
        <div className={`p-4 flex-1 overflow-y-auto ${isCollapsed ? 'md:px-2' : ''}`}>
          <nav className="space-y-1">
            {NAV_ITEMS.map((item) => (
              <button
                key={item.id}
                onClick={() => {
                  setActiveTab(item.id);
                  if (window.innerWidth < 768) onClose();
                }}
                className={`w-full flex items-center gap-3 px-4 py-3 text-sm font-medium rounded-xl transition-all ${
                  activeTab === item.id 
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
            ))}
          </nav>
        </div>
        
        <div className={`p-4 transition-all duration-300 ${isCollapsed ? 'md:px-2' : ''}`}>
          <div className={`bg-slate-50 dark:bg-slate-800 rounded-2xl p-4 transition-all ${isCollapsed ? 'md:p-2' : ''}`}>
             <div className={`transition-all duration-300 overflow-hidden ${isCollapsed ? 'md:h-0 md:opacity-0' : 'h-auto opacity-100'}`}>
                <p className="text-xs text-slate-400 mb-2 whitespace-nowrap">Hệ thống quản trị</p>
                <p className="text-sm font-semibold text-slate-800 dark:text-slate-200">Cấp: {selectedUnit.type === 'Company' ? 'Công ty' : 'Đơn vị'}</p>
                <div className="w-full bg-slate-200 dark:bg-slate-700 h-1.5 rounded-full mt-3">
                  <div className="bg-indigo-600 h-1.5 rounded-full w-4/5"></div>
                </div>
             </div>
             {isCollapsed && (
                <div className="hidden md:flex flex-col items-center py-2 gap-2">
                   <div className="w-1.5 h-10 bg-slate-200 dark:bg-slate-700 rounded-full relative overflow-hidden">
                      <div className="absolute bottom-0 w-full bg-indigo-600 h-4/5"></div>
                   </div>
                </div>
             )}
          </div>
          
          {/* Collapse Toggle Button (Desktop Only) */}
          <button 
            onClick={() => setIsCollapsed(!isCollapsed)}
            className="hidden md:flex mt-4 w-full items-center justify-center p-2 text-slate-400 hover:text-indigo-600 dark:hover:text-indigo-400 hover:bg-indigo-50 dark:hover:bg-indigo-900/20 rounded-xl transition-all border border-transparent hover:border-indigo-100 dark:hover:border-indigo-900/30"
          >
            {isCollapsed ? <ChevronRight size={20} /> : <div className="flex items-center gap-2"><ChevronLeft size={20} /><span className="text-xs font-bold uppercase tracking-wider">Thu gọn</span></div>}
          </button>
        </div>
      </div>
    </>
  );
};

export default Sidebar;
