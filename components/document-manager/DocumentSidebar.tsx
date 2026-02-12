
import React, { useState } from 'react';
import {
    ChevronRight,
    ChevronDown,
    Folder,
    FileText,
    FileSpreadsheet,
    LayoutGrid,
    Building2,
    FolderOpen
} from 'lucide-react';
import { DriveFolderMapping } from '../../services/driveInitService';
import {
    UNIT_FOLDER_MAP,
    GLOBAL_FOLDERS,
    getUnitSubfolders
} from '../../services/googleDriveService';

interface DocumentSidebarProps {
    mappings: DriveFolderMapping[];
    selectedFolderId: string | null;
    onSelectFolder: (folderId: string, folderName: string) => void;
    className?: string;
}

const DocumentSidebar: React.FC<DocumentSidebarProps> = ({
    mappings,
    selectedFolderId,
    onSelectFolder,
    className = ''
}) => {
    const [expandedUnits, setExpandedUnits] = useState<Record<string, boolean>>({});

    const toggleUnit = (unitId: string) => {
        setExpandedUnits(prev => ({
            ...prev,
            [unitId]: !prev[unitId]
        }));
    };

    const getIconForFolderType = (type: string) => {
        switch (type) {
            case 'HopDong': return <FileText size={14} />;
            case 'PAKD': return <FileSpreadsheet size={14} />;
            case 'HoaDon': return <FileText size={14} />;
            case 'BaoCao': return <LayoutGrid size={14} />;
            default: return <Folder size={14} />;
        }
    };

    const getFolderTypeColor = (type: string) => {
        switch (type) {
            case 'HopDong': return 'text-indigo-500';
            case 'PAKD': return 'text-emerald-500';
            case 'HoaDon': return 'text-amber-500';
            case 'BaoCao': return 'text-purple-500';
            case 'Templates': return 'text-cyan-500';
            case 'VanBan': return 'text-rose-500';
            default: return 'text-slate-400';
        }
    };

    // Helper to get mapping for a unit
    const getUnitMapping = (unitId: string) => {
        return mappings.find(m => m.entity_type === 'unit' && m.entity_id === unitId);
    };

    // Helper to get mapping for a subfolder
    const getSubfolderMapping = (unitId: string, folderType: string) => {
        return mappings.find(m =>
            m.entity_type === 'doctype' &&
            m.entity_id === unitId &&
            m.folder_type === folderType
        );
    };

    // Helper to get mapping for global folder
    const getGlobalMapping = (name: string) => {
        return mappings.find(m => m.entity_type === 'root' && m.entity_id === name);
    };

    return (
        <div className={`flex flex-col h-full bg-white dark:bg-slate-900 border-r border-slate-200 dark:border-slate-800 ${className}`}>
            <div className="p-3">
                <h3 className="font-black text-slate-700 dark:text-slate-200 uppercase text-[10px] tracking-widest flex items-center gap-2">
                    <FolderOpen size={14} className="text-indigo-500" />
                    Thư mục
                </h3>
            </div>

            <div className="flex-1 overflow-y-auto px-2 pb-4 space-y-1 scrollbar-thin scrollbar-thumb-slate-200 dark:scrollbar-thumb-slate-700">
                {/* Global Folders */}
                <div className="mb-3">
                    <div className="px-3 py-1.5 text-[9px] font-black text-slate-400 uppercase tracking-widest mb-1">
                        Chung
                    </div>
                    {GLOBAL_FOLDERS.map(folderName => {
                        const mapping = getGlobalMapping(folderName);
                        if (!mapping) return null;

                        const isSelected = selectedFolderId === mapping.drive_folder_id;

                        return (
                            <button
                                key={folderName}
                                onClick={() => onSelectFolder(mapping.drive_folder_id, folderName)}
                                className={`w-full flex items-center gap-2.5 px-3 py-2 rounded-lg text-sm transition-all ${isSelected
                                    ? 'bg-indigo-50 text-indigo-700 dark:bg-slate-700/80 dark:text-indigo-400 font-bold shadow-sm border border-indigo-100 dark:border-slate-600'
                                    : 'text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-700/50 border border-transparent'
                                    }`}
                            >
                                <Folder size={15} className={isSelected ? 'text-indigo-500' : 'text-slate-400'} />
                                <span className="truncate text-xs font-bold">{folderName}</span>
                            </button>
                        );
                    })}
                </div>

                {/* Units */}
                <div>
                    <div className="px-3 py-1.5 text-[9px] font-black text-slate-400 uppercase tracking-widest mb-1">
                        Đơn vị
                    </div>
                    {Object.entries(UNIT_FOLDER_MAP).map(([unitId, unitName]) => {
                        const unitMapping = getUnitMapping(unitId);
                        const isExpanded = expandedUnits[unitId];
                        const subfolders = getUnitSubfolders(unitId);

                        if (!unitMapping) return null;

                        const isSelected = selectedFolderId === unitMapping.drive_folder_id;

                        return (
                            <div key={unitId} className="mb-0.5">
                                <div
                                    className={`flex items-center gap-0.5 rounded-lg transition-all pr-2 ${isSelected
                                        ? 'bg-indigo-50 dark:bg-slate-700/80 border border-indigo-100 dark:border-slate-600 shadow-sm'
                                        : 'hover:bg-slate-50 dark:hover:bg-slate-700/50 border border-transparent'
                                        }`}
                                >
                                    <button
                                        onClick={() => toggleUnit(unitId)}
                                        className="p-2 text-slate-400 hover:text-indigo-600 dark:hover:text-indigo-400 transition-colors"
                                    >
                                        {isExpanded ? <ChevronDown size={13} /> : <ChevronRight size={13} />}
                                    </button>

                                    <button
                                        onClick={() => onSelectFolder(unitMapping.drive_folder_id, unitName)}
                                        className={`flex-1 flex items-center gap-2 py-2 text-xs text-left font-bold ${isSelected
                                            ? 'text-indigo-700 dark:text-indigo-400'
                                            : 'text-slate-700 dark:text-slate-200'
                                            }`}
                                    >
                                        <Building2 size={14} className={isSelected ? 'text-indigo-500' : 'text-slate-400'} />
                                        <span className="truncate line-clamp-1" title={unitName}>{unitName}</span>
                                    </button>
                                </div>

                                {/* Subfolders */}
                                {isExpanded && (
                                    <div className="ml-5 pl-3 border-l-2 border-indigo-100 dark:border-indigo-800/40 space-y-0.5 mt-0.5 mb-1">
                                        {subfolders.map(sub => {
                                            const subMapping = getSubfolderMapping(unitId, sub);
                                            if (!subMapping) return null;

                                            const isSubSelected = selectedFolderId === subMapping.drive_folder_id;

                                            return (
                                                <button
                                                    key={sub}
                                                    onClick={() => onSelectFolder(subMapping.drive_folder_id, sub)}
                                                    className={`w-full flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs transition-all ${isSubSelected
                                                        ? 'bg-indigo-50 text-indigo-700 dark:bg-slate-700/80 dark:text-indigo-400 font-bold'
                                                        : 'text-slate-500 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-700/50 hover:text-slate-700 dark:hover:text-slate-300'
                                                        }`}
                                                >
                                                    <span className={isSubSelected ? 'text-indigo-500' : getFolderTypeColor(sub)}>
                                                        {getIconForFolderType(sub)}
                                                    </span>
                                                    <span className="truncate">{sub}</span>
                                                </button>
                                            );
                                        })}
                                    </div>
                                )}
                            </div>
                        );
                    })}
                </div>
            </div>
        </div>
    );
};

export default DocumentSidebar;
