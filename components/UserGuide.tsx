import React, { useState, useEffect, createContext, useContext } from 'react';
import { useNavigate } from 'react-router-dom';
import { ROUTES } from '../routes/routes';
import {
    Book, Keyboard, Search, FileText, Users, Building2, Package,
    LayoutDashboard, CreditCard, BarChart3, Bot, ChevronRight,
    ChevronDown, Lightbulb, Zap, HelpCircle, ExternalLink,
    Copy, Edit, Plus, Filter, Sparkles, ArrowRight, Play, Settings
} from 'lucide-react';

// Navigation Context to pass navigate function to child components
const NavigationContext = createContext<{ navigate: (path: string) => void } | null>(null);

const useNavigation = () => {
    const context = useContext(NavigationContext);
    if (!context) throw new Error('useNavigation must be used within NavigationContext');
    return context;
};

interface GuideSection {
    id: string;
    title: string;
    icon: React.ReactNode;
    content: React.ReactNode;
}

const UserGuide: React.FC = () => {
    const navigate = useNavigate();
    const [activeSection, setActiveSection] = useState<string>('overview');
    const [expandedFaq, setExpandedFaq] = useState<string | null>(null);
    const [searchQuery, setSearchQuery] = useState('');

    const sections: GuideSection[] = [
        { id: 'overview', title: 'Tổng quan', icon: <LayoutDashboard size={18} />, content: <OverviewSection /> },
        { id: 'quicklinks', title: 'Truy cập nhanh', icon: <Zap size={18} />, content: <QuickLinksSection /> },
        { id: 'contracts', title: 'Quản lý Hợp đồng', icon: <FileText size={18} />, content: <ContractsSection /> },
        { id: 'search', title: 'Tìm kiếm', icon: <Search size={18} />, content: <SearchSection /> },
        { id: 'shortcuts', title: 'Phím tắt', icon: <Keyboard size={18} />, content: <ShortcutsSection /> },
        { id: 'modules', title: 'Các Module', icon: <Package size={18} />, content: <ModulesSection /> },
        { id: 'tips', title: 'Mẹo hay', icon: <Lightbulb size={18} />, content: <TipsSection /> },
        { id: 'faq', title: 'Câu hỏi thường gặp', icon: <HelpCircle size={18} />, content: <FaqSection expandedFaq={expandedFaq} setExpandedFaq={setExpandedFaq} /> }
    ];

    // Filter sections based on search
    const filteredSections = searchQuery
        ? sections.filter(s => s.title.toLowerCase().includes(searchQuery.toLowerCase()))
        : sections;

    // Keyboard navigation for sections
    useEffect(() => {
        const handleKeyDown = (e: KeyboardEvent) => {
            if (e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement) return;

            const currentIndex = filteredSections.findIndex(s => s.id === activeSection);

            if (e.key === 'ArrowDown' || e.key === 'j') {
                e.preventDefault();
                const nextIndex = Math.min(currentIndex + 1, filteredSections.length - 1);
                setActiveSection(filteredSections[nextIndex].id);
            } else if (e.key === 'ArrowUp' || e.key === 'k') {
                e.preventDefault();
                const prevIndex = Math.max(currentIndex - 1, 0);
                setActiveSection(filteredSections[prevIndex].id);
            }
        };

        window.addEventListener('keydown', handleKeyDown);
        return () => window.removeEventListener('keydown', handleKeyDown);
    }, [activeSection, filteredSections]);

    return (
        <NavigationContext.Provider value={{ navigate }}>
            <div className="flex min-h-[calc(100vh-8rem)] bg-slate-50 dark:bg-slate-950 rounded-2xl overflow-hidden border border-slate-200 dark:border-slate-800">
                {/* Sidebar */}
                <div className="w-64 bg-white dark:bg-slate-900 border-r border-slate-200 dark:border-slate-800 p-4 flex flex-col flex-shrink-0">
                    <div className="flex items-center gap-3 mb-4">
                        <div className="p-2 bg-orange-100 dark:bg-orange-900/30 rounded-xl">
                            <Book size={24} className="text-orange-600" />
                        </div>
                        <div>
                            <h2 className="font-black text-slate-900 dark:text-slate-100">Hướng dẫn</h2>
                            <p className="text-xs text-slate-500">CIC ERP Contract</p>
                        </div>
                    </div>

                    {/* Search in sidebar */}
                    <div className="relative mb-4">
                        <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                        <input
                            type="text"
                            placeholder="Tìm mục..."
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            className="w-full pl-8 pr-3 py-2 text-sm bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl focus:outline-none focus:ring-2 focus:ring-orange-500/20 focus:border-orange-500"
                        />
                    </div>

                    <nav className="flex-1 space-y-1 overflow-y-auto">
                        {filteredSections.map((section, index) => (
                            <button
                                key={section.id}
                                onClick={() => setActiveSection(section.id)}
                                className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-left transition-all group ${activeSection === section.id
                                    ? 'bg-orange-100 dark:bg-orange-900/30 text-orange-700 dark:text-orange-400'
                                    : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800'
                                    }`}
                            >
                                {section.icon}
                                <span className="font-semibold text-sm flex-1">{section.title}</span>
                                <kbd className="hidden group-hover:inline-block px-1.5 py-0.5 text-[10px] font-mono bg-slate-200 dark:bg-slate-700 rounded text-slate-500">
                                    {index + 1}
                                </kbd>
                            </button>
                        ))}
                    </nav>

                    {/* Keyboard hint */}
                    <div className="pt-3 border-t border-slate-200 dark:border-slate-700 mt-2">
                        <p className="text-[10px] text-slate-400 text-center flex items-center justify-center gap-1.5">
                            <kbd className="px-1 py-0.5 bg-slate-100 dark:bg-slate-800 rounded text-[9px]">↑↓</kbd>
                            <span>hoặc</span>
                            <kbd className="px-1 py-0.5 bg-slate-100 dark:bg-slate-800 rounded text-[9px]">j/k</kbd>
                            <span>để chuyển mục</span>
                        </p>
                    </div>

                    <div className="pt-2">
                        <p className="text-xs text-slate-400 text-center">Phiên bản 2.1</p>
                    </div>
                </div>

                {/* Content */}
                <div className="flex-1 overflow-y-auto p-6">
                    <div className="max-w-4xl mx-auto">
                        <h3 className="text-2xl font-black text-slate-900 dark:text-slate-100 mb-6">
                            {sections.find(s => s.id === activeSection)?.title}
                        </h3>
                        {sections.find(s => s.id === activeSection)?.content}
                    </div>
                </div>
            </div>
        </NavigationContext.Provider>
    );
};

// ============================================
// NEW: Quick Links Section
// ============================================
const QuickLinksSection = () => {
    const { navigate } = useNavigation();

    const quickLinks = [
        { icon: <LayoutDashboard size={22} />, title: 'Dashboard', desc: 'Xem tổng quan', path: ROUTES.DASHBOARD, color: 'from-indigo-500 to-purple-500' },
        { icon: <FileText size={22} />, title: 'Hợp đồng', desc: 'Quản lý hợp đồng', path: ROUTES.CONTRACTS, color: 'from-orange-500 to-amber-500' },
        { icon: <Plus size={22} />, title: 'Tạo HĐ mới', desc: 'Thêm hợp đồng', path: ROUTES.CONTRACT_NEW, color: 'from-emerald-500 to-teal-500' },
        { icon: <CreditCard size={22} />, title: 'Thanh toán', desc: 'Theo dõi thu chi', path: ROUTES.PAYMENTS, color: 'from-green-500 to-emerald-500' },
        { icon: <BarChart3 size={22} />, title: 'Phân tích', desc: 'Báo cáo chi tiết', path: ROUTES.ANALYTICS, color: 'from-purple-500 to-pink-500' },
        { icon: <Users size={22} />, title: 'Nhân sự', desc: 'Quản lý nhân viên', path: ROUTES.PERSONNEL, color: 'from-cyan-500 to-blue-500' },
        { icon: <Building2 size={22} />, title: 'Khách hàng', desc: 'Danh bạ KH', path: ROUTES.CUSTOMERS, color: 'from-blue-500 to-indigo-500' },
        { icon: <Package size={22} />, title: 'Sản phẩm', desc: 'Quản lý SP/DV', path: ROUTES.PRODUCTS, color: 'from-rose-500 to-pink-500' },
        { icon: <Bot size={22} />, title: 'AI Assistant', desc: 'Trợ lý thông minh', path: ROUTES.AI_ASSISTANT, color: 'from-violet-500 to-purple-500' },
        { icon: <Settings size={22} />, title: 'Cài đặt', desc: 'Thiết lập hệ thống', path: ROUTES.SETTINGS, color: 'from-slate-500 to-zinc-500' },
    ];

    return (
        <div className="space-y-6">
            <div className="bg-gradient-to-r from-indigo-50 to-purple-50 dark:from-indigo-900/20 dark:to-purple-900/20 rounded-2xl p-5 border border-indigo-100 dark:border-indigo-800">
                <h4 className="font-bold text-slate-900 dark:text-slate-100 mb-1 flex items-center gap-2">
                    <Zap className="text-indigo-500" size={18} />
                    Truy cập nhanh các module
                </h4>
                <p className="text-sm text-slate-600 dark:text-slate-400">
                    Click vào bất kỳ thẻ nào để chuyển đến module tương ứng ngay lập tức.
                </p>
            </div>

            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
                {quickLinks.map((link, index) => (
                    <button
                        key={index}
                        onClick={() => navigate(link.path)}
                        className="group relative p-4 bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 hover:border-transparent hover:shadow-lg hover:scale-[1.02] transition-all duration-200 text-left overflow-hidden"
                    >
                        <div className={`absolute inset-0 bg-gradient-to-br ${link.color} opacity-0 group-hover:opacity-10 transition-opacity`} />
                        <div className={`w-10 h-10 rounded-xl bg-gradient-to-br ${link.color} flex items-center justify-center mb-3 text-white shadow-lg group-hover:scale-110 transition-transform`}>
                            {link.icon}
                        </div>
                        <h5 className="font-bold text-sm text-slate-900 dark:text-slate-100 group-hover:text-indigo-600 dark:group-hover:text-indigo-400 transition-colors">
                            {link.title}
                        </h5>
                        <p className="text-xs text-slate-500 mt-0.5">{link.desc}</p>
                        <ArrowRight size={14} className="absolute top-4 right-4 text-slate-300 dark:text-slate-600 group-hover:text-indigo-500 group-hover:translate-x-1 transition-all" />
                    </button>
                ))}
            </div>

            <div className="bg-amber-50 dark:bg-amber-900/20 rounded-xl p-4 border border-amber-200 dark:border-amber-800">
                <p className="text-sm text-amber-800 dark:text-amber-300 flex items-center gap-2">
                    <Sparkles size={16} />
                    <strong>Mẹo:</strong> Dùng <kbd className="px-1.5 py-0.5 bg-white dark:bg-slate-800 rounded text-xs font-mono">Ctrl+K</kbd> để tìm kiếm và truy cập bất kỳ module nào!
                </p>
            </div>
        </div>
    );
};

// ============================================
// Section Components (Updated with navigation)
// ============================================
const OverviewSection = () => {
    const { navigate } = useNavigation();

    return (
        <div className="space-y-6">
            <div className="bg-gradient-to-r from-orange-50 to-amber-50 dark:from-orange-900/20 dark:to-amber-900/20 rounded-2xl p-6 border border-orange-100 dark:border-orange-800">
                <h4 className="font-black text-lg text-slate-900 dark:text-slate-100 mb-2">
                    🎉 Chào mừng đến CIC ERP Contract!
                </h4>
                <p className="text-slate-600 dark:text-slate-400">
                    Hệ thống quản lý hợp đồng thông minh giúp bạn theo dõi, phân tích và tối ưu hóa hoạt động kinh doanh.
                </p>
            </div>

            <div className="grid grid-cols-2 gap-4">
                <FeatureCardClickable
                    icon={<FileText className="text-orange-500" />}
                    title="Quản lý Hợp đồng"
                    description="Tạo, chỉnh sửa, theo dõi hợp đồng"
                    onClick={() => navigate(ROUTES.CONTRACTS)}
                />
                <FeatureCardClickable
                    icon={<BarChart3 className="text-indigo-500" />}
                    title="Dashboard Thông minh"
                    description="Phân tích dữ liệu thời gian thực"
                    onClick={() => navigate(ROUTES.DASHBOARD)}
                />
                <FeatureCardClickable
                    icon={<Search className="text-emerald-500" />}
                    title="Tìm kiếm Toàn cục"
                    description="Tìm nhanh với Ctrl+K"
                    onClick={() => window.dispatchEvent(new KeyboardEvent('keydown', { key: 'k', ctrlKey: true, bubbles: true }))}
                />
                <FeatureCardClickable
                    icon={<Bot className="text-purple-500" />}
                    title="AI Assistant"
                    description="Trợ lý AI hỗ trợ phân tích"
                    onClick={() => navigate(ROUTES.AI_ASSISTANT)}
                />
            </div>

            <div className="bg-slate-100 dark:bg-slate-800/50 rounded-xl p-4">
                <h5 className="font-bold text-sm text-slate-700 dark:text-slate-300 mb-3 flex items-center gap-2">
                    <Zap size={16} className="text-amber-500" /> Bắt đầu nhanh
                </h5>
                <ol className="space-y-2 text-sm text-slate-600 dark:text-slate-400">
                    <li className="flex items-center gap-2">
                        <span className="bg-orange-100 dark:bg-orange-900/30 text-orange-700 dark:text-orange-400 px-2 py-0.5 rounded-full text-xs font-bold">1</span>
                        <span className="flex-1">Nhấn <kbd className="px-2 py-1 bg-white dark:bg-slate-700 rounded border text-xs font-mono">Ctrl+K</kbd> để tìm kiếm nhanh</span>
                        <button
                            onClick={() => window.dispatchEvent(new KeyboardEvent('keydown', { key: 'k', ctrlKey: true, bubbles: true }))}
                            className="px-2 py-1 text-xs font-bold text-indigo-600 hover:bg-indigo-50 dark:hover:bg-indigo-900/30 rounded-lg transition-colors flex items-center gap-1"
                        >
                            <Play size={12} /> Thử ngay
                        </button>
                    </li>
                    <li className="flex items-center gap-2">
                        <span className="bg-orange-100 dark:bg-orange-900/30 text-orange-700 dark:text-orange-400 px-2 py-0.5 rounded-full text-xs font-bold">2</span>
                        <span className="flex-1">Vào <strong>Hợp đồng</strong> để xem danh sách và tạo mới</span>
                        <button
                            onClick={() => navigate(ROUTES.CONTRACTS)}
                            className="px-2 py-1 text-xs font-bold text-indigo-600 hover:bg-indigo-50 dark:hover:bg-indigo-900/30 rounded-lg transition-colors flex items-center gap-1"
                        >
                            <ExternalLink size={12} /> Đi đến
                        </button>
                    </li>
                    <li className="flex items-center gap-2">
                        <span className="bg-orange-100 dark:bg-orange-900/30 text-orange-700 dark:text-orange-400 px-2 py-0.5 rounded-full text-xs font-bold">3</span>
                        <span className="flex-1">Xem <strong>Dashboard</strong> để theo dõi tổng quan</span>
                        <button
                            onClick={() => navigate(ROUTES.DASHBOARD)}
                            className="px-2 py-1 text-xs font-bold text-indigo-600 hover:bg-indigo-50 dark:hover:bg-indigo-900/30 rounded-lg transition-colors flex items-center gap-1"
                        >
                            <ExternalLink size={12} /> Đi đến
                        </button>
                    </li>
                </ol>
            </div>
        </div>
    );
};

const ContractsSection = () => {
    const { navigate } = useNavigation();

    return (
        <div className="space-y-6">
            {/* Quick action buttons */}
            <div className="flex flex-wrap gap-2">
                <button
                    onClick={() => navigate(ROUTES.CONTRACTS)}
                    className="px-4 py-2 bg-orange-100 dark:bg-orange-900/30 text-orange-700 dark:text-orange-400 rounded-xl font-bold text-sm hover:bg-orange-200 dark:hover:bg-orange-900/50 transition-colors flex items-center gap-2"
                >
                    <FileText size={16} /> Xem danh sách HĐ
                </button>
                <button
                    onClick={() => navigate(ROUTES.CONTRACT_NEW)}
                    className="px-4 py-2 bg-emerald-100 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-400 rounded-xl font-bold text-sm hover:bg-emerald-200 dark:hover:bg-emerald-900/50 transition-colors flex items-center gap-2"
                >
                    <Plus size={16} /> Tạo hợp đồng mới
                </button>
            </div>

            <ActionCard icon={<Plus className="text-emerald-500" />} title="Tạo hợp đồng mới" steps={[
                'Nhấn nút "+ Tạo mới" hoặc phím Ctrl+N',
                'Điền thông tin cơ bản: Loại HĐ, Đơn vị, Khách hàng',
                'Thêm sản phẩm/dịch vụ và chi phí',
                'Cài đặt lịch thu tiền',
                'Nhấn "Lưu hợp đồng"'
            ]} />
            <ActionCard icon={<Edit className="text-blue-500" />} title="Chỉnh sửa hợp đồng" steps={[
                'Double-click vào hợp đồng để sửa nhanh',
                'Hoặc: Click xem chi tiết → Nhấn nút "Chỉnh sửa"',
                'Sau khi lưu sẽ quay về trang chi tiết'
            ]} />
            <ActionCard icon={<Copy className="text-purple-500" />} title="Nhân bản hợp đồng" steps={[
                'Ở danh sách, nhấn icon 📋 cuối dòng',
                'Form tạo mới sẽ được điền sẵn dữ liệu',
                'Chỉnh sửa và lưu như hợp đồng mới'
            ]} />
            <ActionCard icon={<Filter className="text-amber-500" />} title="Lọc và tìm kiếm" steps={[
                'Gõ vào ô tìm kiếm để lọc theo mã HĐ, khách hàng',
                'Dùng bộ lọc: Năm, Đơn vị, Trạng thái',
                'Click vào tiêu đề cột để sắp xếp'
            ]} />
            <div className="bg-amber-50 dark:bg-amber-900/20 rounded-xl p-4 border border-amber-200 dark:border-amber-800">
                <h5 className="font-bold text-amber-800 dark:text-amber-300 flex items-center gap-2 mb-2">
                    <Sparkles size={16} /> Mẹo: Copy mã hợp đồng
                </h5>
                <p className="text-sm text-amber-700 dark:text-amber-400">
                    Click vào <strong>mã hợp đồng</strong> (ví dụ: HD_001/PMXD_FC_2026) để copy nhanh vào clipboard!
                </p>
            </div>
        </div>
    );
};

const SearchSection = () => (
    <div className="space-y-6">
        <div className="bg-indigo-50 dark:bg-indigo-900/20 rounded-2xl p-6 border border-indigo-100 dark:border-indigo-800">
            <h4 className="font-black text-lg text-slate-900 dark:text-slate-100 mb-2 flex items-center gap-2">
                <Search size={20} className="text-indigo-600" /> Tìm kiếm Toàn cục
            </h4>
            <p className="text-slate-600 dark:text-slate-400 mb-4">
                Nhấn <kbd className="px-2 py-1 bg-white dark:bg-slate-700 rounded border text-sm font-mono">Ctrl+K</kbd> hoặc click ô tìm kiếm ở header để mở.
            </p>
            <button
                onClick={() => window.dispatchEvent(new KeyboardEvent('keydown', { key: 'k', ctrlKey: true, bubbles: true }))}
                className="px-4 py-2 bg-indigo-600 text-white rounded-xl font-bold text-sm hover:bg-indigo-700 transition-colors flex items-center gap-2"
            >
                <Search size={16} /> Mở tìm kiếm ngay
            </button>
        </div>

        <h5 className="font-bold text-slate-900 dark:text-slate-100">Tìm kiếm được những gì?</h5>
        <div className="grid grid-cols-2 gap-3">
            <SearchTypeCard icon={<FileText className="text-orange-500" />} type="Hợp đồng" fields="Mã HĐ, Tiêu đề, Khách hàng" />
            <SearchTypeCard icon={<Building2 className="text-blue-500" />} type="Khách hàng" fields="Tên, Mã số thuế" />
            <SearchTypeCard icon={<Users className="text-emerald-500" />} type="Nhân sự" fields="Tên, Mã nhân viên" />
            <SearchTypeCard icon={<Package className="text-purple-500" />} type="Sản phẩm" fields="Tên, Mã sản phẩm" />
        </div>

        <div className="bg-slate-100 dark:bg-slate-800/50 rounded-xl p-4">
            <h5 className="font-bold text-sm text-slate-700 dark:text-slate-300 mb-3">Cách sử dụng</h5>
            <ul className="space-y-2 text-sm text-slate-600 dark:text-slate-400">
                <li className="flex items-center gap-2"><kbd className="px-2 py-1 bg-white dark:bg-slate-700 rounded border text-xs">↑ ↓</kbd> Di chuyển giữa kết quả</li>
                <li className="flex items-center gap-2"><kbd className="px-2 py-1 bg-white dark:bg-slate-700 rounded border text-xs">Enter</kbd> Chọn kết quả</li>
                <li className="flex items-center gap-2"><kbd className="px-2 py-1 bg-white dark:bg-slate-700 rounded border text-xs">Esc</kbd> Đóng tìm kiếm</li>
            </ul>
        </div>
    </div>
);

const ShortcutsSection = () => (
    <div className="space-y-4">
        <ShortcutCategory title="Điều hướng" shortcuts={[
            { keys: ['Ctrl', 'K'], action: 'Mở tìm kiếm toàn cục' },
            { keys: ['/'], action: 'Focus ô tìm kiếm trong danh sách' },
        ]} />
        <ShortcutCategory title="Hợp đồng" shortcuts={[
            { keys: ['Ctrl', 'N'], action: 'Tạo hợp đồng mới' },
            { keys: ['Double-click'], action: 'Sửa nhanh hợp đồng' },
            { keys: ['Click mã HĐ'], action: 'Copy mã hợp đồng' },
        ]} />
        <ShortcutCategory title="Form" shortcuts={[
            { keys: ['Esc'], action: 'Đóng modal / Hủy form' },
            { keys: ['Tab'], action: 'Chuyển trường tiếp theo' },
        ]} />
        <ShortcutCategory title="Hướng dẫn này" shortcuts={[
            { keys: ['↑', '↓'], action: 'Chuyển mục trong sidebar' },
            { keys: ['j', 'k'], action: 'Chuyển mục (Vim style)' },
        ]} />
    </div>
);

const ModulesSection = () => {
    const { navigate } = useNavigation();

    return (
        <div className="space-y-4">
            <ModuleCardClickable
                icon={<LayoutDashboard className="text-indigo-500" />}
                title="Dashboard"
                description="Tổng quan kinh doanh: KPI, biểu đồ, so sánh năm, phân bổ theo đơn vị/nhân sự."
                onClick={() => navigate(ROUTES.DASHBOARD)}
            />
            <ModuleCardClickable
                icon={<FileText className="text-orange-500" />}
                title="Hợp đồng"
                description="Quản lý toàn bộ hợp đồng: Tạo mới, chỉnh sửa, theo dõi trạng thái, lịch thu chi."
                onClick={() => navigate(ROUTES.CONTRACTS)}
            />
            <ModuleCardClickable
                icon={<CreditCard className="text-emerald-500" />}
                title="Thanh toán"
                description="Theo dõi các đợt thanh toán, cảnh báo quá hạn, ghi nhận tiền về."
                onClick={() => navigate(ROUTES.PAYMENTS)}
            />
            <ModuleCardClickable
                icon={<BarChart3 className="text-purple-500" />}
                title="Phân tích"
                description="Báo cáo chi tiết, phân tích xu hướng, đánh giá hiệu suất."
                onClick={() => navigate(ROUTES.ANALYTICS)}
            />
            <ModuleCardClickable
                icon={<Users className="text-cyan-500" />}
                title="Nhân sự"
                description="Quản lý thông tin, chức vụ, đơn vị của nhân viên."
                onClick={() => navigate(ROUTES.PERSONNEL)}
            />
            <ModuleCardClickable
                icon={<Building2 className="text-blue-500" />}
                title="Khách hàng"
                description="Danh bạ khách hàng, lịch sử hợp đồng, thông tin liên hệ."
                onClick={() => navigate(ROUTES.CUSTOMERS)}
            />
        </div>
    );
};

const TipsSection = () => (
    <div className="space-y-4">
        <TipCard number={1} title="Sử dụng Double-click để sửa nhanh" description="Không cần mở chi tiết rồi mới bấm Sửa. Double-click trực tiếp vào dòng hợp đồng!" />
        <TipCard number={2} title="Copy mã HĐ bằng 1 click" description="Click vào mã hợp đồng ở danh sách để copy nhanh, không cần select thủ công." />
        <TipCard number={3} title="Dùng / để tìm kiếm trong danh sách" description="Gõ / ở bất kỳ đâu để focus ngay vào ô tìm kiếm, giống GitHub/Slack!" />
        <TipCard number={4} title="Ctrl+K tìm kiếm toàn cục" description="Tìm hợp đồng, khách hàng, nhân sự, sản phẩm chỉ với 1 phím tắt." />
        <TipCard number={5} title="Nhân bản để tạo nhanh" description="Có hợp đồng tương tự? Nhấn icon 📋 để nhân bản, chỉ sửa vài trường là xong!" />
    </div>
);

const FaqSection = ({ expandedFaq, setExpandedFaq }: { expandedFaq: string | null, setExpandedFaq: (id: string | null) => void }) => {
    const faqs = [
        { id: 'edit', question: 'Làm sao để sửa hợp đồng?', answer: 'Double-click vào hợp đồng ở danh sách, hoặc mở chi tiết rồi nhấn nút "Chỉnh sửa".' },
        { id: 'copy', question: 'Làm sao copy mã hợp đồng?', answer: 'Click trực tiếp vào mã hợp đồng (ví dụ: HD_001/...) ở danh sách. Hệ thống sẽ copy và hiện thông báo.' },
        { id: 'search', question: 'Làm sao tìm hợp đồng nhanh?', answer: 'Nhấn Ctrl+K để mở tìm kiếm toàn cục. Gõ mã HĐ, tên khách hàng hoặc tiêu đề.' },
        { id: 'clone', question: 'Làm sao tạo hợp đồng tương tự?', answer: 'Ở danh sách, nhấn icon 📋 cuối dòng để nhân bản. Form sẽ được điền sẵn dữ liệu.' },
        { id: 'payment', question: 'Làm sao xem lịch thu tiền?', answer: 'Mở chi tiết hợp đồng, kéo xuống phần "Tiến độ thu chi" để xem các đợt thanh toán.' },
        { id: 'export', question: 'Làm sao xuất Excel?', answer: 'Ở danh sách hợp đồng, nhấn nút "Xuất Excel" ở góc phải để tải file.' }
    ];

    return (
        <div className="space-y-2">
            {faqs.map(faq => (
                <div key={faq.id} className="border border-slate-200 dark:border-slate-700 rounded-xl overflow-hidden">
                    <button onClick={() => setExpandedFaq(expandedFaq === faq.id ? null : faq.id)} className="w-full flex items-center justify-between p-4 text-left hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors">
                        <span className="font-semibold text-slate-900 dark:text-slate-100">{faq.question}</span>
                        <ChevronDown size={18} className={`text-slate-400 transition-transform ${expandedFaq === faq.id ? 'rotate-180' : ''}`} />
                    </button>
                    {expandedFaq === faq.id && <div className="px-4 pb-4 text-sm text-slate-600 dark:text-slate-400">{faq.answer}</div>}
                </div>
            ))}
        </div>
    );
};

// ============================================
// Helper Components
// ============================================
const FeatureCardClickable = ({ icon, title, description, onClick }: { icon: React.ReactNode, title: string, description: string, onClick: () => void }) => (
    <button
        onClick={onClick}
        className="p-4 bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 text-left hover:border-indigo-300 dark:hover:border-indigo-700 hover:shadow-md transition-all group w-full"
    >
        <div className="p-2 bg-slate-50 dark:bg-slate-700 rounded-lg w-fit mb-3 group-hover:scale-110 transition-transform">{icon}</div>
        <h5 className="font-bold text-slate-900 dark:text-slate-100 mb-1 group-hover:text-indigo-600 dark:group-hover:text-indigo-400 transition-colors">{title}</h5>
        <p className="text-xs text-slate-500 dark:text-slate-400">{description}</p>
        <span className="text-xs text-indigo-500 font-semibold mt-2 flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
            Đi đến <ArrowRight size={12} />
        </span>
    </button>
);

const ActionCard = ({ icon, title, steps }: { icon: React.ReactNode, title: string, steps: string[] }) => (
    <div className="bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 p-4">
        <div className="flex items-center gap-3 mb-3">
            <div className="p-2 bg-slate-50 dark:bg-slate-700 rounded-lg">{icon}</div>
            <h5 className="font-bold text-slate-900 dark:text-slate-100">{title}</h5>
        </div>
        <ol className="space-y-1.5">
            {steps.map((step, i) => (
                <li key={i} className="flex items-start gap-2 text-sm text-slate-600 dark:text-slate-400">
                    <span className="bg-slate-100 dark:bg-slate-700 text-slate-500 px-1.5 py-0.5 rounded text-xs font-bold flex-shrink-0">{i + 1}</span>
                    {step}
                </li>
            ))}
        </ol>
    </div>
);

const SearchTypeCard = ({ icon, type, fields }: { icon: React.ReactNode, type: string, fields: string }) => (
    <div className="flex items-center gap-3 p-3 bg-white dark:bg-slate-800 rounded-lg border border-slate-200 dark:border-slate-700">
        {icon}
        <div>
            <p className="font-semibold text-sm text-slate-900 dark:text-slate-100">{type}</p>
            <p className="text-xs text-slate-500">{fields}</p>
        </div>
    </div>
);

const ShortcutCategory = ({ title, shortcuts }: { title: string, shortcuts: { keys: string[], action: string }[] }) => (
    <div className="bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 p-4">
        <h5 className="font-bold text-sm text-slate-700 dark:text-slate-300 mb-3">{title}</h5>
        <div className="space-y-2">
            {shortcuts.map((s, i) => (
                <div key={i} className="flex items-center justify-between">
                    <div className="flex items-center gap-1">
                        {s.keys.map((key, j) => (
                            <React.Fragment key={j}>
                                <kbd className="px-2 py-1 bg-slate-100 dark:bg-slate-700 rounded border border-slate-200 dark:border-slate-600 text-xs font-mono">{key}</kbd>
                                {j < s.keys.length - 1 && <span className="text-slate-400 text-xs">+</span>}
                            </React.Fragment>
                        ))}
                    </div>
                    <span className="text-sm text-slate-600 dark:text-slate-400">{s.action}</span>
                </div>
            ))}
        </div>
    </div>
);

const ModuleCardClickable = ({ icon, title, description, onClick }: { icon: React.ReactNode, title: string, description: string, onClick: () => void }) => (
    <button
        onClick={onClick}
        className="w-full flex items-start gap-4 p-4 bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 text-left hover:border-indigo-300 dark:hover:border-indigo-700 hover:shadow-md transition-all group"
    >
        <div className="p-3 bg-slate-50 dark:bg-slate-700 rounded-xl group-hover:scale-110 transition-transform">{icon}</div>
        <div className="flex-1">
            <h5 className="font-bold text-slate-900 dark:text-slate-100 group-hover:text-indigo-600 dark:group-hover:text-indigo-400 transition-colors">{title}</h5>
            <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">{description}</p>
        </div>
        <div className="flex items-center gap-1 text-indigo-500 font-semibold text-sm opacity-0 group-hover:opacity-100 transition-opacity">
            Đi đến <ExternalLink size={14} />
        </div>
    </button>
);

const TipCard = ({ number, title, description }: { number: number, title: string, description: string }) => (
    <div className="flex items-start gap-4 p-4 bg-amber-50 dark:bg-amber-900/20 rounded-xl border border-amber-100 dark:border-amber-800">
        <div className="w-8 h-8 bg-amber-200 dark:bg-amber-800 rounded-full flex items-center justify-center flex-shrink-0">
            <span className="font-black text-amber-800 dark:text-amber-200">{number}</span>
        </div>
        <div>
            <h5 className="font-bold text-amber-900 dark:text-amber-200">{title}</h5>
            <p className="text-sm text-amber-700 dark:text-amber-400 mt-1">{description}</p>
        </div>
    </div>
);

export default UserGuide;
