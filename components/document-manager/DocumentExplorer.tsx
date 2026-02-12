
import React, { useState, useEffect } from 'react';
import {
    Folder,
    FileText,
    FileSpreadsheet,
    Image as ImageIcon,
    MoreVertical,
    Download,
    ExternalLink,
    Info,
    Grid,
    List,
    Search,
    ArrowLeft
} from 'lucide-react';
import { GoogleDriveService, DriveFile } from '../../services/googleDriveService';
import { toast } from 'sonner';

interface DocumentExplorerProps {
    folderId: string;
    folderName: string;
    onNavigateBack?: () => void;
}

const DocumentExplorer: React.FC<DocumentExplorerProps> = ({
    folderId,
    folderName,
    onNavigateBack
}) => {
    const [files, setFiles] = useState<DriveFile[]>([]);
    const [loading, setLoading] = useState(true);
    const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
    const [searchTerm, setSearchTerm] = useState('');
    const [currentFolderId, setCurrentFolderId] = useState(folderId);
    const [currentFolderName, setCurrentFolderName] = useState(folderName);
    const [history, setHistory] = useState<{ id: string, name: string }[]>([]);

    useEffect(() => {
        // Reset when prop changes
        setCurrentFolderId(folderId);
        setCurrentFolderName(folderName);
        setHistory([]);
    }, [folderId, folderName]);

    useEffect(() => {
        loadFiles(currentFolderId);
    }, [currentFolderId]);

    const loadFiles = async (id: string) => {
        if (!id) return;
        setLoading(true);
        try {
            const data = await GoogleDriveService.listFiles(id);
            setFiles(data);
        } catch (error) {
            console.error('Failed to load files:', error);
            toast.error('Không thể tải danh sách tệp');
        } finally {
            setLoading(false);
        }
    };

    const handleNavigate = (folder: DriveFile) => {
        setHistory(prev => [...prev, { id: currentFolderId, name: currentFolderName }]);
        setCurrentFolderId(folder.id);
        setCurrentFolderName(folder.name);
    };

    const handleBack = () => {
        if (history.length > 0) {
            const prev = history[history.length - 1];
            setHistory(prevHistory => prevHistory.slice(0, -1));
            setCurrentFolderId(prev.id);
            setCurrentFolderName(prev.name);
        } else if (onNavigateBack) {
            onNavigateBack();
        }
    };

    const getFileIcon = (mimeType: string, name: string) => {
        if (mimeType === 'application/vnd.google-apps.folder') return <Folder size={40} className="text-blue-500" />;
        if (mimeType.includes('sheet') || name.endsWith('.xlsx')) return <FileSpreadsheet size={40} className="text-green-500" />;
        if (mimeType.includes('document') || name.endsWith('.docx')) return <FileText size={40} className="text-blue-600" />;
        if (mimeType.includes('image')) return <ImageIcon size={40} className="text-purple-500" />;
        return <FileText size={40} className="text-slate-400" />;
    };

    const filteredFiles = files.filter(f =>
        f.name.toLowerCase().includes(searchTerm.toLowerCase())
    );

    return (
        <div className="flex flex-col h-full bg-white dark:bg-slate-900">
            {/* Toolbar */}
            <div className="flex items-center justify-between p-4 border-b border-slate-100 dark:border-slate-800">
                <div className="flex items-center gap-3">
                    {history.length > 0 && (
                        <button onClick={handleBack} className="p-2 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg transition-colors">
                            <ArrowLeft size={18} className="text-slate-600 dark:text-slate-300" />
                        </button>
                    )}
                    <h2 className="text-lg font-semibold text-slate-800 dark:text-slate-100 flex items-center gap-2">
                        <Folder className="text-blue-500" size={20} />
                        {currentFolderName}
                    </h2>
                </div>

                <div className="flex items-center gap-2">
                    <div className="relative">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
                        <input
                            type="text"
                            placeholder="Tìm kiếm..."
                            value={searchTerm}
                            onChange={e => setSearchTerm(e.target.value)}
                            className="pl-9 pr-4 py-2 bg-slate-50 dark:bg-slate-800 rounded-lg text-sm border-none focus:ring-2 focus:ring-blue-500 outline-none w-48 transition-all focus:w-64"
                        />
                    </div>

                    <div className="flex bg-slate-100 dark:bg-slate-800 p-1 rounded-lg">
                        <button
                            onClick={() => setViewMode('grid')}
                            className={`p-1.5 rounded-md transition-all ${viewMode === 'grid' ? 'bg-white dark:bg-slate-700 shadow-sm text-blue-600' : 'text-slate-500'}`}
                        >
                            <Grid size={18} />
                        </button>
                        <button
                            onClick={() => setViewMode('list')}
                            className={`p-1.5 rounded-md transition-all ${viewMode === 'list' ? 'bg-white dark:bg-slate-700 shadow-sm text-blue-600' : 'text-slate-500'}`}
                        >
                            <List size={18} />
                        </button>
                    </div>
                </div>
            </div>

            {/* Content */}
            <div className="flex-1 overflow-y-auto p-4">
                {loading ? (
                    <div className="flex justify-center items-center h-48">
                        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
                    </div>
                ) : filteredFiles.length === 0 ? (
                    <div className="flex flex-col items-center justify-center h-full text-slate-400">
                        <Folder size={64} className="mb-4 opacity-20" />
                        <p>Thư mục trống</p>
                    </div>
                ) : (
                    <div className={viewMode === 'grid' ? "grid grid-cols-2 md:grid-cols-4 lg:grid-cols-5 gap-4" : "space-y-2"}>
                        {filteredFiles.map(file => (
                            <div
                                key={file.id}
                                className={`
                                    group relative bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 
                                    hover:border-blue-400 dark:hover:border-blue-500 hover:shadow-md transition-all cursor-pointer
                                    ${viewMode === 'grid' ? 'flex flex-col items-center p-6 text-center rounded-xl aspect-square justify-center' : 'flex items-center p-3 gap-4 rounded-lg'}
                                `}
                                onClick={() => {
                                    if (file.mimeType === 'application/vnd.google-apps.folder') {
                                        handleNavigate(file);
                                    } else {
                                        window.open(file.webViewLink, '_blank');
                                    }
                                }}
                            >
                                <div className="relative">
                                    {getFileIcon(file.mimeType, file.name)}
                                    {file.thumbnailLink && viewMode === 'grid' && (
                                        <img
                                            src={file.thumbnailLink}
                                            alt={file.name}
                                            className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-16 h-16 object-cover rounded opacity-0 group-hover:opacity-10 shadow-sm"
                                        />
                                    )}
                                </div>

                                <div className={`min-w-0 ${viewMode === 'grid' ? 'mt-3 w-full' : 'flex-1'}`}>
                                    <h3 className="text-sm font-medium text-slate-700 dark:text-slate-200 truncate" title={file.name}>
                                        {file.name}
                                    </h3>
                                    {viewMode === 'list' && (
                                        <p className="text-xs text-slate-400 mt-0.5">
                                            {file.size ? `${(parseInt(file.size) / 1024 / 1024).toFixed(2)} MB` : 'Folder'} • {new Date(file.modifiedTime || '').toLocaleDateString('vi-VN')}
                                        </p>
                                    )}
                                </div>

                                <button
                                    className="opacity-0 group-hover:opacity-100 p-1.5 hover:bg-slate-100 dark:hover:bg-slate-700 rounded-full transition-all absolute top-2 right-2"
                                    onClick={(e) => {
                                        e.stopPropagation();
                                        // Context menu logic here
                                    }}
                                >
                                    <MoreVertical size={16} className="text-slate-400" />
                                </button>
                            </div>
                        ))}
                    </div>
                )}
            </div>
        </div>
    );
};

export default DocumentExplorer;
