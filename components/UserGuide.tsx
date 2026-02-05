import React, { useState } from 'react';
import {
    Book, Keyboard, Search, FileText, Users, Building2, Package,
    LayoutDashboard, CreditCard, BarChart3, Bot, ChevronRight,
    ChevronDown, Lightbulb, Zap, HelpCircle,
    Copy, Edit, Plus, Filter, Sparkles
} from 'lucide-react';

interface GuideSection {
    id: string;
    title: string;
    icon: React.ReactNode;
    content: React.ReactNode;
}

const UserGuide: React.FC = () => {
    const [activeSection, setActiveSection] = useState<string>('overview');
    const [expandedFaq, setExpandedFaq] = useState<string | null>(null);

    const sections: GuideSection[] = [
        { id: 'overview', title: 'Tổng quan', icon: <LayoutDashboard size={18} />, content: <OverviewSection /> },
        { id: 'contracts', title: 'Quản lý Hợp đồng', icon: <FileText size={18} />, content: <ContractsSection /> },
        { id: 'search', title: 'Tìm kiếm', icon: <Search size={18} />, content: <SearchSection /> },
        { id: 'shortcuts', title: 'Phím tắt', icon: <Keyboard size={18} />, content: <ShortcutsSection /> },
        { id: 'modules', title: 'Các Module', icon: <Package size={18} />, content: <ModulesSection /> },
        { id: 'tips', title: 'Mẹo hay', icon: <Lightbulb size={18} />, content: <TipsSection /> },
        { id: 'faq', title: 'Câu hỏi thường gặp', icon: <HelpCircle size={18} />, content: <FaqSection expandedFaq={expandedFaq} setExpandedFaq={setExpandedFaq} /> }
    ];

    return (
        <div className="flex h-full bg-slate-50 dark:bg-slate-950">
            {/* Sidebar */}
            <div className="w-64 bg-white dark:bg-slate-900 border-r border-slate-200 dark:border-slate-800 p-4 flex flex-col flex-shrink-0">
                <div className="flex items-center gap-3 mb-6">
                    <div className="p-2 bg-orange-100 dark:bg-orange-900/30 rounded-xl">
                        <Book size={24} className="text-orange-600" />
                    </div>
                    <div>
                        <h2 className="font-black text-slate-900 dark:text-slate-100">Hướng dẫn</h2>
                        <p className="text-xs text-slate-500">CIC ERP Contract</p>
                    </div>
                </div>

                <nav className="flex-1 space-y-1">
                    {sections.map(section => (
                        <button
                            key={section.id}
                            onClick={() => setActiveSection(section.id)}
                            className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-left transition-all ${activeSection === section.id
                                    ? 'bg-orange-100 dark:bg-orange-900/30 text-orange-700 dark:text-orange-400'
                                    : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800'
                                }`}
                        >
                            {section.icon}
                            <span className="font-semibold text-sm">{section.title}</span>
                        </button>
                    ))}
                </nav>

                <div className="pt-4 border-t border-slate-200 dark:border-slate-700">
                    <p className="text-xs text-slate-400 text-center">Phiên bản 2.0</p>
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
    );
};

// Section Components
const OverviewSection = () => (
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
            <FeatureCard icon={<FileText className="text-orange-500" />} title="Quản lý Hợp đồng" description="Tạo, chỉnh sửa, theo dõi hợp đồng với đầy đủ thông tin chi tiết" />
            <FeatureCard icon={<BarChart3 className="text-indigo-500" />} title="Dashboard Thông minh" description="Phân tích dữ liệu theo thời gian thực, so sánh năm" />
            <FeatureCard icon={<Search className="text-emerald-500" />} title="Tìm kiếm Toàn cục" description="Tìm nhanh hợp đồng, khách hàng, nhân sự với Ctrl+K" />
            <FeatureCard icon={<Bot className="text-purple-500" />} title="AI Assistant" description="Trợ lý AI hỗ trợ phân tích và đề xuất hành động" />
        </div>

        <div className="bg-slate-100 dark:bg-slate-800/50 rounded-xl p-4">
            <h5 className="font-bold text-sm text-slate-700 dark:text-slate-300 mb-3 flex items-center gap-2">
                <Zap size={16} className="text-amber-500" /> Bắt đầu nhanh
            </h5>
            <ol className="space-y-2 text-sm text-slate-600 dark:text-slate-400">
                <li className="flex items-start gap-2">
                    <span className="bg-orange-100 dark:bg-orange-900/30 text-orange-700 dark:text-orange-400 px-2 py-0.5 rounded-full text-xs font-bold">1</span>
                    Nhấn <kbd className="px-2 py-1 bg-white dark:bg-slate-700 rounded border text-xs font-mono">Ctrl+K</kbd> để tìm kiếm nhanh
                </li>
                <li className="flex items-start gap-2">
                    <span className="bg-orange-100 dark:bg-orange-900/30 text-orange-700 dark:text-orange-400 px-2 py-0.5 rounded-full text-xs font-bold">2</span>
                    Vào <strong>Hợp đồng</strong> để xem danh sách và tạo mới
                </li>
                <li className="flex items-start gap-2">
                    <span className="bg-orange-100 dark:bg-orange-900/30 text-orange-700 dark:text-orange-400 px-2 py-0.5 rounded-full text-xs font-bold">3</span>
                    Xem <strong>Dashboard</strong> để theo dõi tổng quan kinh doanh
                </li>
            </ol>
        </div>
    </div>
);

const ContractsSection = () => (
    <div className="space-y-6">
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

const SearchSection = () => (
    <div className="space-y-6">
        <div className="bg-indigo-50 dark:bg-indigo-900/20 rounded-2xl p-6 border border-indigo-100 dark:border-indigo-800">
            <h4 className="font-black text-lg text-slate-900 dark:text-slate-100 mb-2 flex items-center gap-2">
                <Search size={20} className="text-indigo-600" /> Tìm kiếm Toàn cục
            </h4>
            <p className="text-slate-600 dark:text-slate-400 mb-4">
                Nhấn <kbd className="px-2 py-1 bg-white dark:bg-slate-700 rounded border text-sm font-mono">Ctrl+K</kbd> hoặc click ô tìm kiếm ở header để mở.
            </p>
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
    </div>
);

const ModulesSection = () => (
    <div className="space-y-4">
        <ModuleCard icon={<LayoutDashboard className="text-indigo-500" />} title="Dashboard" description="Tổng quan kinh doanh: KPI, biểu đồ, so sánh năm, phân bổ theo đơn vị/nhân sự." />
        <ModuleCard icon={<FileText className="text-orange-500" />} title="Hợp đồng" description="Quản lý toàn bộ hợp đồng: Tạo mới, chỉnh sửa, theo dõi trạng thái, lịch thu chi." />
        <ModuleCard icon={<CreditCard className="text-emerald-500" />} title="Thanh toán" description="Theo dõi các đợt thanh toán, cảnh báo quá hạn, ghi nhận tiền về." />
        <ModuleCard icon={<BarChart3 className="text-purple-500" />} title="Phân tích" description="Báo cáo chi tiết, phân tích xu hướng, đánh giá hiệu suất." />
        <ModuleCard icon={<Users className="text-cyan-500" />} title="Nhân sự" description="Quản lý thông tin, chức vụ, đơn vị của nhân viên." />
        <ModuleCard icon={<Building2 className="text-blue-500" />} title="Khách hàng" description="Danh bạ khách hàng, lịch sử hợp đồng, thông tin liên hệ." />
    </div>
);

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

// Helper Components
const FeatureCard = ({ icon, title, description }: { icon: React.ReactNode, title: string, description: string }) => (
    <div className="p-4 bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700">
        <div className="p-2 bg-slate-50 dark:bg-slate-700 rounded-lg w-fit mb-3">{icon}</div>
        <h5 className="font-bold text-slate-900 dark:text-slate-100 mb-1">{title}</h5>
        <p className="text-xs text-slate-500 dark:text-slate-400">{description}</p>
    </div>
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

const ModuleCard = ({ icon, title, description }: { icon: React.ReactNode, title: string, description: string }) => (
    <div className="flex items-start gap-4 p-4 bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700">
        <div className="p-3 bg-slate-50 dark:bg-slate-700 rounded-xl">{icon}</div>
        <div>
            <h5 className="font-bold text-slate-900 dark:text-slate-100">{title}</h5>
            <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">{description}</p>
        </div>
    </div>
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
