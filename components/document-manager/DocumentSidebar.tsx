
import React, { useState } from 'react';
import {
    ChevronRight,
    ChevronDown,
    Folder,
    FileText,
    FileSpreadsheet,
    LayoutGrid,
    Building2
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
            case 'HopDong': return <FileText size={16} />;
            case 'PAKD': return <FileSpreadsheet size={16} />;
            case 'HoaDon': return <FileText size={16} />;
            case 'BaoCao': return <LayoutGrid size={16} />;
            default: return <Folder size={16} />;
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
            <div className="p-4 border-b border-slate-100 dark:border-slate-800">
                <h3 className="font-semibold text-slate-700 dark:text-slate-200 uppercase text-xs tracking-wider">
                    Thư mục
                </h3>
            </div>

            <div className="flex-1 overflow-y-auto p-2 space-y-1 scrollbar-thin scrollbar-thumb-slate-200 dark:scrollbar-thumb-slate-700">
                {/* Global Folders */}
                <div className="mb-4">
                    <div className="px-3 py-2 text-xs font-semibold text-slate-400 uppercase tracking-wider mb-1">
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
                                className={`w-full flex items-center gap-2 px-3 py-2 rounded-lg text-sm transition-colors ${isSelected
                                        ? 'bg-blue-50 text-blue-600 dark:bg-blue-900/30 dark:text-blue-400'
                                        : 'text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800/50'
                                    }`}
                            >
                                <Folder size={16} className={isSelected ? 'text-blue-500' : 'text-slate-400'} />
                                <span className="truncate">{folderName}</span>
                            </button>
                        );
                    })}
                </div>

                {/* Units */}
                <div>
                    <div className="px-3 py-2 text-xs font-semibold text-slate-400 uppercase tracking-wider mb-1">
                        Đơn vị
                    </div>
                    {Object.entries(UNIT_FOLDER_MAP).map(([unitId, unitName]) => {
                        const unitMapping = getUnitMapping(unitId);
                        const isExpanded = expandedUnits[unitId];
                        const subfolders = getUnitSubfolders(unitId);

                        if (!unitMapping) return null;

                        const isSelected = selectedFolderId === unitMapping.drive_folder_id;

                        return (
                            <div key={unitId} className="mb-1">
                                <div
                                    className={`flex items-center gap-1 rounded-lg transition-colors pr-2 ${isSelected
                                            ? 'bg-blue-50 dark:bg-blue-900/30'
                                            : 'hover:bg-slate-50 dark:hover:bg-slate-800/50'
                                        }`}
                                >
                                    <button
                                        onClick={() => toggleUnit(unitId)}
                                        className="p-2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-300 transition-colors"
                                    >
                                        {isExpanded ? <ChevronDown size={14} /> : <ChevronRight size={14} />}
                                    </button>

                                    <button
                                        onClick={() => onSelectFolder(unitMapping.drive_folder_id, unitName)}
                                        className={`flex-1 flex items-center gap-2 py-2 text-sm text-left ${isSelected
                                                ? 'text-blue-600 dark:text-blue-400 font-medium'
                                                : 'text-slate-700 dark:text-slate-200'
                                            }`}
                                    >
                                        <Building2 size={16} className={isSelected ? 'text-blue-500' : 'text-slate-400'} />
                                        <span className="truncate line-clamp-1" title={unitName}>{unitName}</span>
                                    </button>
                                </div>

                                {/* Subfolders */}
                                {isExpanded && (
                                    <div className="ml-4 pl-4 border-l border-slate-200 dark:border-slate-800 space-y-0.5 mt-1">
                                        {subfolders.map(sub => {
                                            const subMapping = getSubfolderMapping(unitId, sub);
                                            if (!subMapping) return null;

                                            const isSubSelected = selectedFolderId === subMapping.drive_folder_id;

                                            return (
                                                <button
                                                    key={sub}
                                                    onClick={() => onSelectFolder(subMapping.drive_folder_id, sub)}
                                                    className={`w-full flex items-center gap-2 px-3 py-1.5 rounded-lg text-sm transition-colors ${isSubSelected
                                                            ? 'bg-blue-50 text-blue-600 dark:bg-blue-900/30 dark:text-blue-400'
                                                            : 'text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800/50'
                                                        }`}
                                                >
                                                    <span className={isSubSelected ? 'text-blue-500' : 'text-slate-400'}>
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
