import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { ROUTES } from '../routes/routes';
import {
    Book, Keyboard, Search, FileText, Users, Building2, Package,
    LayoutDashboard, CreditCard, BarChart3, Bot, ChevronRight,
    ChevronDown, Lightbulb, Zap, HelpCircle, ExternalLink, Sparkles,
    Copy, Edit, Plus, Filter, ArrowRight, Play, Settings, CheckCircle2,
    Circle, Rocket, Phone, Mail, MessageCircle, X, Command, Video
} from 'lucide-react';

// ============================================
// USER GUIDE - User-Centric Redesign
// ============================================

const UserGuide: React.FC = () => {
    const navigate = useNavigate();
    const [searchQuery, setSearchQuery] = useState('');
    const [showShortcuts, setShowShortcuts] = useState(false);
    const [expandedFaq, setExpandedFaq] = useState<string | null>(null);

    // Onboarding progress (can be stored in localStorage for persistence)
    const [completedSteps, setCompletedSteps] = useState<string[]>(() => {
        const saved = localStorage.getItem('cic-onboarding-progress');
        return saved ? JSON.parse(saved) : [];
    });

    const onboardingSteps = [
        { id: 'dashboard', label: 'Xem Dashboard', path: ROUTES.DASHBOARD },
        { id: 'contracts', label: 'Xem danh sách Hợp đồng', path: ROUTES.CONTRACTS },
        { id: 'create', label: 'Tạo hợp đồng đầu tiên', path: ROUTES.CONTRACT_NEW },
        { id: 'search', label: 'Thử tìm kiếm với Ctrl+K', action: 'search' },
        { id: 'personnel', label: 'Xem danh sách Nhân sự', path: ROUTES.PERSONNEL },
    ];

    const progress = Math.round((completedSteps.length / onboardingSteps.length) * 100);

    const markStepComplete = (stepId: string) => {
        if (!completedSteps.includes(stepId)) {
            const newSteps = [...completedSteps, stepId];
            setCompletedSteps(newSteps);
            localStorage.setItem('cic-onboarding-progress', JSON.stringify(newSteps));
        }
    };

    const handleStepClick = (step: typeof onboardingSteps[0]) => {
        markStepComplete(step.id);
        if (step.path) {
            navigate(step.path);
        } else if (step.action === 'search') {
            window.dispatchEvent(new KeyboardEvent('keydown', { key: 'k', ctrlKey: true, bubbles: true }));
        }
    };

    // Keyboard shortcut to show shortcuts modal
    useEffect(() => {
        const handleKeyDown = (e: KeyboardEvent) => {
            if (e.key === '?' && !e.ctrlKey && !e.metaKey) {
                if (!(e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement)) {
                    e.preventDefault();
                    setShowShortcuts(true);
                }
            }
            if (e.key === 'Escape') {
                setShowShortcuts(false);
            }
        };
        window.addEventListener('keydown', handleKeyDown);
        return () => window.removeEventListener('keydown', handleKeyDown);
    }, []);

    // FAQ data
    const faqs = [
        { id: 'create', q: 'Làm sao tạo hợp đồng mới?', a: 'Vào Hợp đồng → Nhấn "+ Tạo mới" hoặc dùng phím Ctrl+N.' },
        { id: 'edit', q: 'Làm sao sửa hợp đồng?', a: 'Double-click vào hợp đồng trong danh sách, hoặc mở chi tiết rồi nhấn "Chỉnh sửa".' },
        { id: 'copy', q: 'Làm sao copy mã hợp đồng?', a: 'Click trực tiếp vào mã hợp đồng (ví dụ: HD_001/...). Hệ thống tự copy vào clipboard.' },
        { id: 'search', q: 'Làm sao tìm hợp đồng nhanh?', a: 'Nhấn Ctrl+K để mở tìm kiếm toàn cục, gõ mã HĐ hoặc tên khách hàng.' },
        { id: 'clone', q: 'Làm sao nhân bản hợp đồng?', a: 'Ở danh sách, nhấn icon 📋 cuối dòng để nhân bản.' },
        { id: 'export', q: 'Làm sao xuất Excel?', a: 'Ở danh sách hợp đồng, nhấn nút "Xuất Excel" ở góc phải.' },
    ];

    // Filter FAQs by search
    const filteredFaqs = searchQuery
        ? faqs.filter(f => f.q.toLowerCase().includes(searchQuery.toLowerCase()) || f.a.toLowerCase().includes(searchQuery.toLowerCase()))
        : faqs;

    return (
        <div className="max-w-4xl mx-auto space-y-6">
            {/* Header */}
            <div className="text-center py-6">
                <div className="inline-flex items-center gap-3 mb-4">
                    <div className="p-3 bg-gradient-to-br from-orange-500 to-amber-500 rounded-2xl shadow-lg">
                        <Book size={28} className="text-white" />
                    </div>
                    <div className="text-left">
                        <h1 className="text-2xl font-black text-slate-900 dark:text-slate-100">
                            Hướng dẫn sử dụng
                        </h1>
                        <p className="text-sm text-slate-500">CIC ERP Contract v2.1</p>
                    </div>
                </div>

                {/* Smart Search */}
                <div className="relative max-w-md mx-auto mt-4">
                    <Search size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" />
                    <input
                        type="text"
                        placeholder="Tìm hướng dẫn... (ví dụ: tạo hợp đồng)"
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        className="w-full pl-11 pr-4 py-3 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-2xl shadow-sm focus:outline-none focus:ring-2 focus:ring-orange-500/30 focus:border-orange-500 text-sm"
                    />
                    {searchQuery && (
                        <button
                            onClick={() => setSearchQuery('')}
                            className="absolute right-3 top-1/2 -translate-y-1/2 p-1 hover:bg-slate-100 dark:hover:bg-slate-700 rounded-full"
                        >
                            <X size={16} className="text-slate-400" />
                        </button>
                    )}
                </div>
            </div>

            {/* Onboarding Progress */}
            {progress < 100 && (
                <div className="bg-gradient-to-r from-indigo-50 to-purple-50 dark:from-indigo-900/20 dark:to-purple-900/20 rounded-2xl p-5 border border-indigo-100 dark:border-indigo-800">
                    <div className="flex items-center justify-between mb-3">
                        <h3 className="font-bold text-slate-900 dark:text-slate-100 flex items-center gap-2">
                            <Rocket size={18} className="text-indigo-500" />
                            Làm quen với hệ thống
                        </h3>
                        <span className="text-sm font-bold text-indigo-600 dark:text-indigo-400">
                            {progress}% hoàn thành
                        </span>
                    </div>

                    {/* Progress bar */}
                    <div className="h-2 bg-indigo-100 dark:bg-indigo-900/50 rounded-full mb-4 overflow-hidden">
                        <div
                            className="h-full bg-gradient-to-r from-indigo-500 to-purple-500 rounded-full transition-all duration-500"
                            style={{ width: `${progress}%` }}
                        />
                    </div>

                    {/* Steps */}
                    <div className="space-y-2">
                        {onboardingSteps.map((step) => {
                            const isComplete = completedSteps.includes(step.id);
                            return (
                                <button
                                    key={step.id}
                                    onClick={() => handleStepClick(step)}
                                    className={`w-full flex items-center gap-3 p-3 rounded-xl text-left transition-all ${isComplete
                                            ? 'bg-white/50 dark:bg-slate-800/50'
                                            : 'bg-white dark:bg-slate-800 hover:shadow-md hover:scale-[1.01]'
                                        }`}
                                >
                                    {isComplete ? (
                                        <CheckCircle2 size={20} className="text-emerald-500 flex-shrink-0" />
                                    ) : (
                                        <Circle size={20} className="text-slate-300 dark:text-slate-600 flex-shrink-0" />
                                    )}
                                    <span className={`text-sm font-medium flex-1 ${isComplete ? 'text-slate-400 line-through' : 'text-slate-700 dark:text-slate-300'
                                        }`}>
                                        {step.label}
                                    </span>
                                    {!isComplete && (
                                        <ArrowRight size={16} className="text-indigo-500" />
                                    )}
                                </button>
                            );
                        })}
                    </div>
                </div>
            )}

            {/* Completion celebration */}
            {progress === 100 && (
                <div className="bg-gradient-to-r from-emerald-50 to-teal-50 dark:from-emerald-900/20 dark:to-teal-900/20 rounded-2xl p-5 border border-emerald-200 dark:border-emerald-800 text-center">
                    <div className="text-4xl mb-2">🎉</div>
                    <h3 className="font-bold text-emerald-800 dark:text-emerald-300">Tuyệt vời! Bạn đã hoàn thành làm quen!</h3>
                    <p className="text-sm text-emerald-600 dark:text-emerald-400 mt-1">Tiếp tục khám phá các tính năng bên dưới.</p>
                </div>
            )}

            {/* Quick Actions */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                <QuickActionCard
                    icon={<Play size={20} />}
                    title="Bắt đầu Tour"
                    description="Hướng dẫn từng bước"
                    color="from-orange-500 to-amber-500"
                    onClick={() => {
                        // Start interactive tour
                        alert('🚧 Tính năng Tour đang được phát triển!');
                    }}
                />
                <QuickActionCard
                    icon={<Keyboard size={20} />}
                    title="Phím tắt"
                    description="Thao tác nhanh"
                    color="from-indigo-500 to-purple-500"
                    onClick={() => setShowShortcuts(true)}
                />
                <QuickActionCard
                    icon={<Search size={20} />}
                    title="Tìm kiếm"
                    description="Ctrl+K"
                    color="from-emerald-500 to-teal-500"
                    onClick={() => window.dispatchEvent(new KeyboardEvent('keydown', { key: 'k', ctrlKey: true, bubbles: true }))}
                />
                <QuickActionCard
                    icon={<Plus size={20} />}
                    title="Tạo HĐ"
                    description="Hợp đồng mới"
                    color="from-rose-500 to-pink-500"
                    onClick={() => navigate(ROUTES.CONTRACT_NEW)}
                />
            </div>

            {/* Popular Topics - Visual Cards */}
            <div>
                <h3 className="font-bold text-lg text-slate-900 dark:text-slate-100 mb-4 flex items-center gap-2">
                    <Lightbulb size={20} className="text-amber-500" />
                    Hướng dẫn phổ biến
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <TopicCard
                        icon={<Plus className="text-emerald-500" />}
                        title="Tạo hợp đồng mới"
                        steps={['Nhấn "+ Tạo mới" hoặc Ctrl+N', 'Điền thông tin cơ bản', 'Thêm sản phẩm/dịch vụ', 'Lưu hợp đồng']}
                        action={{ label: 'Tạo ngay', onClick: () => navigate(ROUTES.CONTRACT_NEW) }}
                    />
                    <TopicCard
                        icon={<Search className="text-indigo-500" />}
                        title="Tìm kiếm toàn cục"
                        steps={['Nhấn Ctrl+K hoặc click ô tìm kiếm', 'Gõ mã HĐ, tên KH, hoặc từ khóa', 'Dùng ↑↓ để chọn, Enter để mở']}
                        action={{ label: 'Thử ngay', onClick: () => window.dispatchEvent(new KeyboardEvent('keydown', { key: 'k', ctrlKey: true, bubbles: true })) }}
                    />
                    <TopicCard
                        icon={<Copy className="text-purple-500" />}
                        title="Nhân bản hợp đồng"
                        steps={['Vào danh sách Hợp đồng', 'Nhấn icon 📋 cuối dòng', 'Chỉnh sửa thông tin mới', 'Lưu như hợp đồng mới']}
                        action={{ label: 'Xem danh sách', onClick: () => navigate(ROUTES.CONTRACTS) }}
                    />
                    <TopicCard
                        icon={<BarChart3 className="text-orange-500" />}
                        title="Xem Dashboard"
                        steps={['Mở trang Dashboard', 'Xem KPI tổng quan', 'Chọn đơn vị/năm để lọc', 'Click vào biểu đồ để xem chi tiết']}
                        action={{ label: 'Mở Dashboard', onClick: () => navigate(ROUTES.DASHBOARD) }}
                    />
                </div>
            </div>

            {/* Module Navigation */}
            <div>
                <h3 className="font-bold text-lg text-slate-900 dark:text-slate-100 mb-4 flex items-center gap-2">
                    <Package size={20} className="text-blue-500" />
                    Các module trong hệ thống
                </h3>
                <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                    <ModuleLink icon={<LayoutDashboard />} label="Dashboard" path={ROUTES.DASHBOARD} color="indigo" />
                    <ModuleLink icon={<FileText />} label="Hợp đồng" path={ROUTES.CONTRACTS} color="orange" />
                    <ModuleLink icon={<CreditCard />} label="Thanh toán" path={ROUTES.PAYMENTS} color="emerald" />
                    <ModuleLink icon={<BarChart3 />} label="Phân tích" path={ROUTES.ANALYTICS} color="purple" />
                    <ModuleLink icon={<Users />} label="Nhân sự" path={ROUTES.PERSONNEL} color="cyan" />
                    <ModuleLink icon={<Building2 />} label="Khách hàng" path={ROUTES.CUSTOMERS} color="blue" />
                    <ModuleLink icon={<Package />} label="Sản phẩm" path={ROUTES.PRODUCTS} color="rose" />
                    <ModuleLink icon={<Bot />} label="AI Assistant" path={ROUTES.AI_ASSISTANT} color="violet" />
                    <ModuleLink icon={<Settings />} label="Cài đặt" path={ROUTES.SETTINGS} color="slate" />
                </div>
            </div>

            {/* FAQ */}
            <div>
                <h3 className="font-bold text-lg text-slate-900 dark:text-slate-100 mb-4 flex items-center gap-2">
                    <HelpCircle size={20} className="text-rose-500" />
                    Câu hỏi thường gặp
                </h3>
                <div className="space-y-2">
                    {filteredFaqs.map(faq => (
                        <div key={faq.id} className="bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 overflow-hidden">
                            <button
                                onClick={() => setExpandedFaq(expandedFaq === faq.id ? null : faq.id)}
                                className="w-full flex items-center justify-between p-4 text-left hover:bg-slate-50 dark:hover:bg-slate-700/50 transition-colors"
                            >
                                <span className="font-medium text-slate-900 dark:text-slate-100">{faq.q}</span>
                                <ChevronDown size={18} className={`text-slate-400 transition-transform ${expandedFaq === faq.id ? 'rotate-180' : ''}`} />
                            </button>
                            {expandedFaq === faq.id && (
                                <div className="px-4 pb-4 text-sm text-slate-600 dark:text-slate-400 border-t border-slate-100 dark:border-slate-700 pt-3">
                                    {faq.a}
                                </div>
                            )}
                        </div>
                    ))}
                </div>
            </div>

            {/* Tips */}
            <div className="bg-amber-50 dark:bg-amber-900/20 rounded-2xl p-5 border border-amber-200 dark:border-amber-800">
                <h3 className="font-bold text-amber-900 dark:text-amber-200 mb-3 flex items-center gap-2">
                    <Sparkles size={18} /> Mẹo hay
                </h3>
                <ul className="space-y-2 text-sm text-amber-800 dark:text-amber-300">
                    <li className="flex items-start gap-2">
                        <span className="font-bold">•</span>
                        <span><strong>Double-click</strong> vào hợp đồng để sửa nhanh, không cần mở chi tiết.</span>
                    </li>
                    <li className="flex items-start gap-2">
                        <span className="font-bold">•</span>
                        <span>Gõ <kbd className="px-1.5 py-0.5 bg-white dark:bg-slate-800 rounded text-xs font-mono">/</kbd> trong danh sách để focus ô tìm kiếm.</span>
                    </li>
                    <li className="flex items-start gap-2">
                        <span className="font-bold">•</span>
                        <span>Click vào <strong>mã hợp đồng</strong> để copy nhanh vào clipboard.</span>
                    </li>
                    <li className="flex items-start gap-2">
                        <span className="font-bold">•</span>
                        <span>Nhấn <kbd className="px-1.5 py-0.5 bg-white dark:bg-slate-800 rounded text-xs font-mono">?</kbd> bất kỳ lúc nào để xem phím tắt.</span>
                    </li>
                </ul>
            </div>

            {/* Contact Support */}
            <div className="bg-slate-100 dark:bg-slate-800/50 rounded-2xl p-5">
                <h3 className="font-bold text-slate-900 dark:text-slate-100 mb-3 flex items-center gap-2">
                    <Phone size={18} className="text-green-500" /> Cần hỗ trợ?
                </h3>
                <div className="flex flex-wrap gap-3">
                    <a href="tel:0123456789" className="flex items-center gap-2 px-4 py-2 bg-white dark:bg-slate-700 rounded-xl text-sm font-medium text-slate-700 dark:text-slate-300 hover:shadow-md transition-all">
                        <Phone size={16} className="text-green-500" /> Hotline
                    </a>
                    <a href="mailto:support@cic.vn" className="flex items-center gap-2 px-4 py-2 bg-white dark:bg-slate-700 rounded-xl text-sm font-medium text-slate-700 dark:text-slate-300 hover:shadow-md transition-all">
                        <Mail size={16} className="text-blue-500" /> Email
                    </a>
                    <a href="https://zalo.me" target="_blank" rel="noopener noreferrer" className="flex items-center gap-2 px-4 py-2 bg-white dark:bg-slate-700 rounded-xl text-sm font-medium text-slate-700 dark:text-slate-300 hover:shadow-md transition-all">
                        <MessageCircle size={16} className="text-blue-600" /> Zalo
                    </a>
                </div>
            </div>

            {/* Keyboard Shortcuts Modal */}
            {showShortcuts && (
                <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4" onClick={() => setShowShortcuts(false)}>
                    <div className="bg-white dark:bg-slate-900 rounded-2xl shadow-2xl max-w-lg w-full max-h-[80vh] overflow-y-auto" onClick={e => e.stopPropagation()}>
                        <div className="flex items-center justify-between p-4 border-b border-slate-200 dark:border-slate-700">
                            <h3 className="font-bold text-lg text-slate-900 dark:text-slate-100 flex items-center gap-2">
                                <Keyboard size={20} className="text-indigo-500" /> Phím tắt
                            </h3>
                            <button onClick={() => setShowShortcuts(false)} className="p-2 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-xl">
                                <X size={20} className="text-slate-400" />
                            </button>
                        </div>
                        <div className="p-4 space-y-4">
                            <ShortcutGroup title="Điều hướng" shortcuts={[
                                { keys: ['Ctrl', 'K'], desc: 'Mở tìm kiếm toàn cục' },
                                { keys: ['/'], desc: 'Focus ô tìm kiếm trong danh sách' },
                                { keys: ['?'], desc: 'Mở bảng phím tắt này' },
                            ]} />
                            <ShortcutGroup title="Hợp đồng" shortcuts={[
                                { keys: ['Ctrl', 'N'], desc: 'Tạo hợp đồng mới' },
                                { keys: ['Double-click'], desc: 'Sửa nhanh hợp đồng' },
                                { keys: ['Click mã HĐ'], desc: 'Copy mã hợp đồng' },
                            ]} />
                            <ShortcutGroup title="Thao tác chung" shortcuts={[
                                { keys: ['Esc'], desc: 'Đóng modal / Hủy' },
                                { keys: ['Tab'], desc: 'Chuyển trường tiếp theo' },
                                { keys: ['Enter'], desc: 'Xác nhận / Chọn' },
                            ]} />
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

// ============================================
// Helper Components
// ============================================

const QuickActionCard = ({ icon, title, description, color, onClick }: {
    icon: React.ReactNode;
    title: string;
    description: string;
    color: string;
    onClick: () => void;
}) => (
    <button
        onClick={onClick}
        className="group p-4 bg-white dark:bg-slate-800 rounded-2xl border border-slate-200 dark:border-slate-700 hover:shadow-lg hover:scale-[1.02] transition-all text-left"
    >
        <div className={`w-10 h-10 rounded-xl bg-gradient-to-br ${color} flex items-center justify-center mb-3 text-white shadow-lg group-hover:scale-110 transition-transform`}>
            {icon}
        </div>
        <h4 className="font-bold text-sm text-slate-900 dark:text-slate-100">{title}</h4>
        <p className="text-xs text-slate-500 mt-0.5">{description}</p>
    </button>
);

const TopicCard = ({ icon, title, steps, action }: {
    icon: React.ReactNode;
    title: string;
    steps: string[];
    action: { label: string; onClick: () => void };
}) => (
    <div className="bg-white dark:bg-slate-800 rounded-2xl border border-slate-200 dark:border-slate-700 p-4">
        <div className="flex items-center gap-3 mb-3">
            <div className="p-2 bg-slate-100 dark:bg-slate-700 rounded-xl">{icon}</div>
            <h4 className="font-bold text-slate-900 dark:text-slate-100">{title}</h4>
        </div>
        <ol className="space-y-1.5 mb-4">
            {steps.map((step, i) => (
                <li key={i} className="flex items-start gap-2 text-sm text-slate-600 dark:text-slate-400">
                    <span className="bg-slate-100 dark:bg-slate-700 text-slate-500 px-1.5 py-0.5 rounded text-xs font-bold flex-shrink-0">{i + 1}</span>
                    {step}
                </li>
            ))}
        </ol>
        <button
            onClick={action.onClick}
            className="w-full py-2 bg-indigo-50 dark:bg-indigo-900/30 text-indigo-600 dark:text-indigo-400 rounded-xl font-bold text-sm hover:bg-indigo-100 dark:hover:bg-indigo-900/50 transition-colors flex items-center justify-center gap-2"
        >
            {action.label} <ArrowRight size={14} />
        </button>
    </div>
);

const ModuleLink = ({ icon, label, path, color }: {
    icon: React.ReactNode;
    label: string;
    path: string;
    color: string;
}) => {
    const navigate = useNavigate();
    const colorClasses: Record<string, string> = {
        indigo: 'text-indigo-500 bg-indigo-50 dark:bg-indigo-900/30',
        orange: 'text-orange-500 bg-orange-50 dark:bg-orange-900/30',
        emerald: 'text-emerald-500 bg-emerald-50 dark:bg-emerald-900/30',
        purple: 'text-purple-500 bg-purple-50 dark:bg-purple-900/30',
        cyan: 'text-cyan-500 bg-cyan-50 dark:bg-cyan-900/30',
        blue: 'text-blue-500 bg-blue-50 dark:bg-blue-900/30',
        rose: 'text-rose-500 bg-rose-50 dark:bg-rose-900/30',
        violet: 'text-violet-500 bg-violet-50 dark:bg-violet-900/30',
        slate: 'text-slate-500 bg-slate-100 dark:bg-slate-700/50',
    };

    return (
        <button
            onClick={() => navigate(path)}
            className="flex items-center gap-3 p-3 bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 hover:shadow-md hover:scale-[1.02] transition-all text-left group"
        >
            <div className={`p-2 rounded-lg ${colorClasses[color]}`}>
                {React.cloneElement(icon as React.ReactElement, { size: 18 })}
            </div>
            <span className="font-medium text-sm text-slate-700 dark:text-slate-300 group-hover:text-indigo-600 dark:group-hover:text-indigo-400 transition-colors">
                {label}
            </span>
            <ChevronRight size={16} className="ml-auto text-slate-300 dark:text-slate-600 group-hover:text-indigo-500 transition-colors" />
        </button>
    );
};

const ShortcutGroup = ({ title, shortcuts }: {
    title: string;
    shortcuts: { keys: string[]; desc: string }[];
}) => (
    <div>
        <h4 className="font-bold text-sm text-slate-700 dark:text-slate-300 mb-2">{title}</h4>
        <div className="space-y-2">
            {shortcuts.map((s, i) => (
                <div key={i} className="flex items-center justify-between">
                    <div className="flex items-center gap-1">
                        {s.keys.map((key, j) => (
                            <React.Fragment key={j}>
                                <kbd className="px-2 py-1 bg-slate-100 dark:bg-slate-700 rounded border border-slate-200 dark:border-slate-600 text-xs font-mono">
                                    {key}
                                </kbd>
                                {j < s.keys.length - 1 && <span className="text-slate-400 text-xs">+</span>}
                            </React.Fragment>
                        ))}
                    </div>
                    <span className="text-sm text-slate-600 dark:text-slate-400">{s.desc}</span>
                </div>
            ))}
        </div>
    </div>
);

export default UserGuide;
