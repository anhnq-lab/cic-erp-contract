
import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { toast } from 'sonner';
import {
    Folder,
    Settings,
    Menu
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
        <div className="flex h-screen bg-slate-50 dark:bg-slate-900 overflow-hidden">
            {/* Sidebar Toggle for Mobile */}
            {!isSidebarOpen && (
                <button
                    onClick={() => setIsSidebarOpen(true)}
                    className="absolute top-4 left-4 z-50 p-2 bg-white dark:bg-slate-800 shadow-md rounded-lg md:hidden"
                >
                    <Menu size={20} />
                </button>
            )}

            {/* Sidebar */}
            <div className={`
                fixed inset-y-0 left-0 z-40 w-72 bg-white dark:bg-slate-900 border-r border-slate-200 dark:border-slate-800 transform transition-transform duration-300 ease-in-out md:static md:translate-x-0
                ${isSidebarOpen ? 'translate-x-0' : '-translate-x-full'}
            `}>
                <div className="flex flex-col h-full">
                    {/* Sidebar Header */}
                    <div className="p-4 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between">
                        <div className="flex items-center gap-2 font-bold text-slate-800 dark:text-slate-100">
                            <div className="bg-blue-600 text-white p-1.5 rounded-lg">
                                <Folder size={20} />
                            </div>
                            <span>Tài Liệu Số</span>
                        </div>
                        <button
                            onClick={() => navigate('/settings')}
                            className="p-1.5 text-slate-400 hover:text-blue-500 hover:bg-blue-50 dark:hover:bg-blue-900/30 rounded-lg transition-colors"
                            title="Cấu hình Google Drive"
                        >
                            <Settings size={18} />
                        </button>
                    </div>

                    {/* Stats & Recent */}
                    <div className="p-4 space-y-6 overflow-y-auto flex-1">
                        <StorageStats />
                        <RecentFiles />

                        {/* Divider */}
                        <div className="border-t border-slate-100 dark:border-slate-800 my-2"></div>

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
                    className="fixed inset-0 bg-black/20 z-30 md:hidden"
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
                    <div className="flex-1 flex flex-col items-center justify-center text-slate-400 bg-slate-50 dark:bg-slate-900/50">
                        <div className="bg-white dark:bg-slate-800 p-8 rounded-2xl shadow-sm text-center max-w-md mx-4">
                            <div className="bg-blue-50 dark:bg-blue-900/30 w-20 h-20 rounded-full flex items-center justify-center mx-auto mb-6">
                                <Folder size={40} className="text-blue-500" />
                            </div>
                            <h2 className="text-xl font-bold text-slate-700 dark:text-slate-200 mb-2">
                                Chào mừng đến Kho Tài Liệu Số
                            </h2>
                            <p className="text-slate-500 dark:text-slate-400 mb-6">
                                Chọn một thư mục từ danh sách bên trái để bắt đầu quản lý và xem tài liệu.
                            </p>
                            <div className="grid grid-cols-2 gap-3 text-left">
                                <div className="p-3 bg-slate-50 dark:bg-slate-700/30 rounded-lg">
                                    <div className="font-semibold text-slate-700 dark:text-slate-300">12 Đơn vị</div>
                                    <div className="text-xs text-slate-500">Quản lý hồ sơ</div>
                                </div>
                                <div className="p-3 bg-slate-50 dark:bg-slate-700/30 rounded-lg">
                                    <div className="font-semibold text-slate-700 dark:text-slate-300">Google Drive</div>
                                    <div className="text-xs text-slate-500">Đồng bộ 2 chiều</div>
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
