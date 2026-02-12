
import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { toast } from 'sonner';
import {
    Folder,
    Settings,
    Menu,
    X,
    FolderOpen,
    Database,
    FileText,
    Sparkles
} from 'lucide-react';
import { FolderMappingRow, DriveInitService } from '../services/driveInitService';

// New Components
import DocumentSidebar from './document-manager/DocumentSidebar';
import DocumentExplorer from './document-manager/DocumentExplorer';
import RecentFiles from './document-manager/RecentFiles';
import StorageStats from './document-manager/StorageStats';

const DocumentManager: React.FC = () => {
    const navigate = useNavigate();
    const [mappings, setMappings] = useState<FolderMappingRow[]>([]);
    const [loading, setLoading] = useState(true);
    const [isSidebarOpen, setIsSidebarOpen] = useState(true);

    // Selection State
    const [selectedFolderId, setSelectedFolderId] = useState<string | null>(null);
    const [selectedFolderName, setSelectedFolderName] = useState<string>('Tổng quan');

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

    const handleSelectFolder = (folderId: string, folderName: string) => {
        setSelectedFolderId(folderId);
        setSelectedFolderName(folderName);
        if (window.innerWidth < 768) {
            setIsSidebarOpen(false);
        }
    };

    return (
        <div className="flex h-screen bg-slate-50 dark:bg-slate-950 overflow-hidden">
            {/* Sidebar Toggle for Mobile */}
            {!isSidebarOpen && (
                <button
                    onClick={() => setIsSidebarOpen(true)}
                    className="absolute top-4 left-4 z-50 p-2 bg-white dark:bg-slate-800 shadow-lg rounded-lg md:hidden border border-slate-200 dark:border-slate-700"
                >
                    <Menu size={20} className="text-slate-600 dark:text-slate-300" />
                </button>
            )}

            {/* Sidebar */}
            <div className={`
                fixed inset-y-0 left-0 z-40 w-72 bg-white dark:bg-slate-900 border-r border-slate-200 dark:border-slate-800 transform transition-transform duration-300 ease-in-out md:static md:translate-x-0 shadow-xl md:shadow-none
                ${isSidebarOpen ? 'translate-x-0' : '-translate-x-full'}
            `}>
                <div className="flex flex-col h-full">
                    {/* Sidebar Header */}
                    <div className="p-4 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between bg-gradient-to-r from-indigo-50 to-purple-50 dark:from-indigo-900/10 dark:to-purple-900/10">
                        <div className="flex items-center gap-2.5 font-black text-sm text-slate-800 dark:text-slate-100 tracking-tight">
                            <div className="bg-gradient-to-br from-indigo-500 to-purple-600 text-white p-2 rounded-lg shadow-lg shadow-indigo-200/50 dark:shadow-none">
                                <Database size={18} />
                            </div>
                            <div>
                                <span className="block">Kho Tài Liệu</span>
                                <span className="text-[9px] font-bold text-slate-400 uppercase tracking-widest">Digital Document System</span>
                            </div>
                        </div>
                        <div className="flex items-center gap-1">
                            <button
                                onClick={() => navigate('/settings')}
                                className="p-1.5 text-slate-400 hover:text-indigo-500 hover:bg-indigo-50 dark:hover:bg-indigo-900/30 rounded-lg transition-all"
                                title="Cấu hình Google Drive"
                            >
                                <Settings size={16} />
                            </button>
                            <button
                                onClick={() => setIsSidebarOpen(false)}
                                className="p-1.5 text-slate-400 hover:text-slate-600 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg transition-all md:hidden"
                            >
                                <X size={16} />
                            </button>
                        </div>
                    </div>

                    {/* Stats & Recent */}
                    <div className="p-4 space-y-5 overflow-y-auto flex-1 scrollbar-thin scrollbar-thumb-slate-200 dark:scrollbar-thumb-slate-700">
                        <StorageStats />
                        <RecentFiles />

                        {/* Divider */}
                        <div className="border-t border-slate-100 dark:border-slate-800"></div>

                        {/* Tree View */}
                        <DocumentSidebar
                            mappings={mappings}
                            selectedFolderId={selectedFolderId}
                            onSelectFolder={handleSelectFolder}
                            className="border-none"
                        />
                    </div>
                </div>
            </div>

            {/* Overlay for mobile sidebar */}
            {isSidebarOpen && (
                <div
                    className="fixed inset-0 bg-black/30 backdrop-blur-sm z-30 md:hidden"
                    onClick={() => setIsSidebarOpen(false)}
                />
            )}

            {/* Main Content Area */}
            <div className="flex-1 flex flex-col overflow-hidden relative">
                {selectedFolderId ? (
                    <DocumentExplorer
                        folderId={selectedFolderId}
                        folderName={selectedFolderName}
                        onNavigateBack={() => {
                            // Optional: Handle back to root or parent
                        }}
                    />
                ) : (
                    <div className="flex-1 flex flex-col items-center justify-center bg-gradient-to-br from-slate-50 to-indigo-50/30 dark:from-slate-900/50 dark:to-indigo-950/20">
                        <div className="bg-white dark:bg-slate-800/80 p-10 rounded-2xl shadow-xl shadow-indigo-100/50 dark:shadow-none text-center max-w-lg mx-4 border border-slate-200 dark:border-slate-700 dark-card-glow">
                            <div className="bg-gradient-to-br from-indigo-500 to-purple-600 w-20 h-20 rounded-2xl flex items-center justify-center mx-auto mb-6 shadow-xl shadow-indigo-200/50 dark:shadow-indigo-500/10">
                                <FolderOpen size={36} className="text-white" />
                            </div>
                            <h2 className="text-xl font-black text-slate-800 dark:text-slate-100 mb-2 tracking-tight">
                                Kho Tài Liệu Số CIC
                            </h2>
                            <p className="text-sm text-slate-500 dark:text-slate-400 mb-8 font-medium leading-relaxed">
                                Chọn một thư mục từ danh sách bên trái để bắt đầu quản lý và xem tài liệu.
                            </p>
                            <div className="grid grid-cols-3 gap-4 text-left">
                                <div className="p-4 bg-indigo-50 dark:bg-indigo-900/20 rounded-xl border border-indigo-100 dark:border-indigo-800/40">
                                    <div className="w-8 h-8 bg-indigo-100 dark:bg-indigo-800/40 rounded-lg flex items-center justify-center mb-2">
                                        <Folder size={16} className="text-indigo-600 dark:text-indigo-400" />
                                    </div>
                                    <div className="text-xs font-black text-slate-700 dark:text-slate-200">12 Đơn vị</div>
                                    <div className="text-[10px] font-bold text-slate-400 mt-0.5">Quản lý hồ sơ</div>
                                </div>
                                <div className="p-4 bg-purple-50 dark:bg-purple-900/20 rounded-xl border border-purple-100 dark:border-purple-800/40">
                                    <div className="w-8 h-8 bg-purple-100 dark:bg-purple-800/40 rounded-lg flex items-center justify-center mb-2">
                                        <FileText size={16} className="text-purple-600 dark:text-purple-400" />
                                    </div>
                                    <div className="text-xs font-black text-slate-700 dark:text-slate-200">Google Drive</div>
                                    <div className="text-[10px] font-bold text-slate-400 mt-0.5">Đồng bộ tự động</div>
                                </div>
                                <div className="p-4 bg-emerald-50 dark:bg-emerald-900/20 rounded-xl border border-emerald-100 dark:border-emerald-800/40">
                                    <div className="w-8 h-8 bg-emerald-100 dark:bg-emerald-800/40 rounded-lg flex items-center justify-center mb-2">
                                        <Sparkles size={16} className="text-emerald-600 dark:text-emerald-400" />
                                    </div>
                                    <div className="text-xs font-black text-slate-700 dark:text-slate-200">Tìm kiếm</div>
                                    <div className="text-[10px] font-bold text-slate-400 mt-0.5">Nhanh & chính xác</div>
                                </div>
                            </div>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
};

export default DocumentManager;
