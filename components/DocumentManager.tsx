
import React, { useState, useEffect } from 'react';
import {
    Folder,
    Search,
    ExternalLink,
    LayoutGrid,
    FileText,
    FileSpreadsheet,
    Settings,
    FolderOpen
} from 'lucide-react';
import {
    UNIT_FOLDER_MAP,
    GLOBAL_FOLDERS,
    GoogleDriveService,
    getUnitSubfolders
} from '../services/googleDriveService';
import { DriveInitService, FolderMappingRow } from '../services/driveInitService';
import { toast } from 'sonner';
import { useNavigate } from 'react-router-dom';

const DocumentManager: React.FC = () => {
    const navigate = useNavigate();
    const [searchTerm, setSearchTerm] = useState('');
    const [mappings, setMappings] = useState<FolderMappingRow[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        loadMappings();
    }, []);

    const loadMappings = async () => {
        try {
            setLoading(true);
            const data = await DriveInitService.getAllMappings();
            setMappings(data);
        } catch (error) {
            console.error('Failed to load mappings', error);
            toast.error('Không thể tải dữ liệu thư mục');
        } finally {
            setLoading(false);
        }
    };

    const handleOpenFolder = (url: string | null, fallbackId?: string) => {
        if (url) {
            window.open(url, '_blank');
        } else if (fallbackId) {
            window.open(GoogleDriveService.getFolderUrl(fallbackId), '_blank');
        } else {
            toast.error('Không tìm thấy liên kết thư mục');
        }
    };

    // Filter units based on search
    const filteredUnits = Object.entries(UNIT_FOLDER_MAP).filter(([id, name]) =>
        name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        id.toLowerCase().includes(searchTerm.toLowerCase())
    );

    // Get mapping for a specific unit (root folder of unit)
    const getUnitMapping = (unitId: string) => {
        return mappings.find(m =>
            m.entity_type === 'unit' &&
            m.entity_id === unitId
        );
    };

    // Get mapping for a specific subfolder of a unit
    const getSubfolderMapping = (unitId: string, folderType: string) => {
        return mappings.find(m =>
            m.entity_type === 'doctype' &&
            m.entity_id === unitId &&
            m.folder_type === folderType
        );
    };

    // Get mapping for global folders
    const getGlobalMapping = (name: string) => {
        return mappings.find(m =>
            m.entity_type === 'root' &&
            m.entity_id === name
        );
    };

    const getIconForFolderType = (type: string) => {
        switch (type) {
            case 'HopDong': return FileText;
            case 'PAKD': return FileSpreadsheet;
            case 'HoaDon': return FileText;
            case 'BaoCao': return LayoutGrid;
            case 'Templates': return Folder;
            case 'VanBan': return FileText;
            default: return Folder;
        }
    };

    const Building2Icon = () => (
        <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-blue-600 dark:text-blue-400">
            <rect x="4" y="2" width="16" height="20" rx="2" ry="2"></rect>
            <path d="M9 22v-4h6v4"></path>
            <path d="M8 6h.01"></path>
            <path d="M16 6h.01"></path>
            <path d="M12 6h.01"></path>
            <path d="M12 10h.01"></path>
            <path d="M12 14h.01"></path>
            <path d="M16 10h.01"></path>
            <path d="M16 14h.01"></path>
            <path d="M8 10h.01"></path>
            <path d="M8 14h.01"></path>
        </svg>
    );

    return (
        <div className="h-full flex flex-col bg-slate-50 dark:bg-slate-900 overflow-hidden">
            {/* Header */}
            <div className="bg-gradient-to-r from-blue-600 to-indigo-700 p-6 text-white shadow-lg shrink-0">
                <div className="flex justify-between items-center mb-6">
                    <div>
                        <h1 className="text-2xl font-bold flex items-center gap-2">
                            <FolderOpen className="w-8 h-8" />
                            Kho Tài Liệu Số
                        </h1>
                        <p className="text-blue-100 mt-1 opacity-90 text-sm">
                            Quản lý và truy cập nhanh hồ sơ tài liệu trên Google Drive
                        </p>
                    </div>
                    <button
                        onClick={() => navigate('/settings')}
                        className="bg-white/10 hover:bg-white/20 text-white px-4 py-2 rounded-lg flex items-center gap-2 transition-colors backdrop-blur-sm text-sm font-medium"
                    >
                        <Settings size={18} />
                        Cấu hình
                    </button>
                </div>

                {/* Search Bar */}
                <div className="relative max-w-2xl">
                    <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={20} />
                    <input
                        type="text"
                        placeholder="Tìm kiếm đơn vị, phòng ban..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        className="w-full pl-12 pr-4 py-3 rounded-xl bg-white text-slate-900 shadow-xl border-0 focus:ring-2 focus:ring-blue-300 placeholder:text-slate-400 transition-all outline-none"
                    />
                </div>
            </div>

            {/* Main Content */}
            <div className="flex-1 overflow-y-auto p-4 md:p-6 scrollbar-thin scrollbar-thumb-slate-300 dark:scrollbar-thumb-slate-600">

                {/* Global Folders */}
                <div className="mb-8">
                    <h2 className="text-lg font-semibold text-slate-700 dark:text-slate-200 mb-4 flex items-center gap-2">
                        <LayoutGrid size={20} className="text-blue-600 dark:text-blue-400" />
                        Thư mục Chung
                    </h2>
                    <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4">
                        {GLOBAL_FOLDERS.map((folderName) => {
                            const mapping = getGlobalMapping(folderName);
                            return (
                                <div
                                    key={folderName}
                                    onClick={() => mapping && handleOpenFolder(mapping.drive_folder_url || null, mapping.drive_folder_id)}
                                    className={`bg-white dark:bg-slate-800 p-4 rounded-xl border border-slate-200 dark:border-slate-700 shadow-sm hover:shadow-md transition-all cursor-pointer group ${!mapping ? 'opacity-60 pointer-events-none grayscale' : ''}`}
                                >
                                    <div className="flex items-center gap-3">
                                        <div className="bg-blue-50 dark:bg-blue-900/30 p-3 rounded-lg group-hover:bg-blue-100 dark:group-hover:bg-blue-900/50 transition-colors">
                                            <Folder className="w-6 h-6 text-blue-600 dark:text-blue-400" />
                                        </div>
                                        <div className="flex-1 min-w-0">
                                            <div className="font-medium text-slate-700 dark:text-slate-200 group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors truncate">
                                                {folderName}
                                            </div>
                                            <div className="text-xs text-slate-500 mt-1 truncate">
                                                {mapping ? 'Sẵn sàng truy cập' : 'Chưa khởi tạo'}
                                            </div>
                                        </div>
                                        <ExternalLink className="w-4 h-4 text-slate-400 ml-auto opacity-0 group-hover:opacity-100 transition-opacity" />
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                </div>

                {/* Unit Folders */}
                <div>
                    <h2 className="text-lg font-semibold text-slate-700 dark:text-slate-200 mb-4 flex items-center gap-2">
                        <Building2Icon />
                        Hồ sơ Đơn vị ({filteredUnits.length})
                    </h2>

                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                        {filteredUnits.map(([unitId, unitName]) => {
                            const unitMapping = getUnitMapping(unitId);
                            const subfolders = getUnitSubfolders(unitId);

                            return (
                                <div key={unitId} className="bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 shadow-sm hover:shadow-md transition-all overflow-hidden flex flex-col h-full group/card">
                                    {/* Card Header */}
                                    <div className="p-4 border-b border-slate-100 dark:border-slate-700 bg-slate-50/50 dark:bg-slate-800/50 flex justify-between items-start">
                                        <div>
                                            <h3 className="font-bold text-slate-800 dark:text-slate-100 line-clamp-1" title={unitName}>
                                                {unitName}
                                            </h3>
                                            <span className="text-xs font-mono text-slate-500 bg-slate-200 dark:bg-slate-700 px-2 py-0.5 rounded mt-1 inline-block uppercase">
                                                {unitId}
                                            </span>
                                        </div>
                                        {unitMapping && (
                                            <button
                                                onClick={() => handleOpenFolder(unitMapping.drive_folder_url || null, unitMapping.drive_folder_id)}
                                                className="text-blue-600 dark:text-blue-400 hover:text-blue-700 p-1.5 hover:bg-blue-50 dark:hover:bg-blue-900/30 rounded-lg transition-colors opacity-0 group-hover/card:opacity-100"
                                                title="Mở thư mục gốc đơn vị"
                                            >
                                                <ExternalLink size={18} />
                                            </button>
                                        )}
                                    </div>

                                    {/* Subfolders List */}
                                    <div className="p-4 flex-1">
                                        <div className="space-y-1">
                                            {subfolders.map((sub) => {
                                                const subMapping = getSubfolderMapping(unitId, sub);
                                                const Icon = getIconForFolderType(sub);

                                                return (
                                                    <button
                                                        key={sub}
                                                        onClick={() => subMapping && handleOpenFolder(subMapping.drive_folder_url || null, subMapping.drive_folder_id)}
                                                        disabled={!subMapping}
                                                        className="w-full flex items-center gap-3 p-2 rounded-lg hover:bg-slate-50 dark:hover:bg-slate-700/50 transition-colors text-left group/item disabled:opacity-40 disabled:cursor-not-allowed"
                                                    >
                                                        <Icon size={16} className={`text-slate-400 group-hover/item:text-blue-500 transition-colors ${!subMapping ? 'opacity-50' : ''}`} />
                                                        <span className="text-sm text-slate-600 dark:text-slate-300 group-hover/item:text-slate-900 dark:group-hover/item:text-white flex-1 truncate">
                                                            {sub}
                                                        </span>
                                                        {subMapping && (
                                                            <ExternalLink size={14} className="text-slate-300 group-hover/item:text-blue-400 opacity-0 group-hover/item:opacity-100 transition-all shrink-0" />
                                                        )}
                                                    </button>
                                                );
                                            })}
                                        </div>
                                    </div>

                                    {!unitMapping && (
                                        <div className="px-4 py-2 bg-amber-50 dark:bg-amber-900/20 text-amber-600 dark:text-amber-400 text-xs text-center border-t border-amber-100 dark:border-amber-800/30">
                                            Chưa khởi tạo
                                        </div>
                                    )}
                                </div>
                            );
                        })}
                    </div>
                </div>
            </div>
        </div>
    );
};

export default DocumentManager;
