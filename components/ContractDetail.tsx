
import React, { useMemo, useState, useEffect } from 'react';
import {
  ArrowLeft,
  Calendar,
  DollarSign,
  User,
  FileText,
  Download,
  Edit3,
  History,
  Paperclip,
  ShieldCheck,
  AlertCircle,
  CheckCircle2,
  Clock,
  CreditCard,
  ChevronRight,
  TrendingUp,
  ReceiptText,
  ShieldAlert,
  PackageCheck,
  GanttChart
} from 'lucide-react';
import { Contract, Unit, Milestone, PaymentPhase } from '../types';
import { MOCK_UNITS } from '../constants';
import { ContractsAPI } from '../services/api';

interface ContractDetailProps {
  contract?: Contract;
  contractId?: string;
  onBack: () => void;
  onEdit: () => void;
}

const ContractDetail: React.FC<ContractDetailProps> = ({ contract: initialContract, contractId, onBack, onEdit }) => {
  const [contract, setContract] = useState<Contract | null>(initialContract || null);
  const [loading, setLoading] = useState(!initialContract);
  const [error, setError] = useState('');

  useEffect(() => {
    if (initialContract) {
      setContract(initialContract);
      setLoading(false);
      return;
    }

    if (contractId) {
      setLoading(true);
      ContractsAPI.getById(contractId)
        .then(data => {
          if (data) setContract(data);
          else setError('Không tìm thấy hợp đồng');
        })
        .catch(err => setError('Lỗi tải hợp đồng: ' + err))
        .finally(() => setLoading(false));
    }
  }, [contractId, initialContract]);

  const unit = useMemo(() => {
    if (!contract) return null;
    return MOCK_UNITS.find(u => u.id === contract.unitId);
  }, [contract]);

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'Active': return 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400 border-emerald-200 dark:border-emerald-800';
      case 'Pending': return 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400 border-amber-200 dark:border-amber-800';
      case 'Reviewing': return 'bg-indigo-100 text-indigo-700 dark:bg-indigo-900/30 dark:text-indigo-400 border-indigo-200 dark:border-indigo-800';
      case 'Expired': return 'bg-rose-100 text-rose-700 dark:bg-rose-900/30 dark:text-rose-400 border-rose-200 dark:border-rose-800';
      default: return 'bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-400 border-slate-200 dark:border-slate-700';
    }
  };

  const getPaymentStatusBadge = (status: PaymentPhase['status']) => {
    switch (status) {
      case 'Paid': return <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-emerald-100 dark:bg-emerald-900/40 text-emerald-700 dark:text-emerald-400">ĐÃ THU</span>;
      case 'Overdue': return <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-rose-100 dark:bg-rose-900/40 text-rose-700 dark:text-rose-400">QUÁ HẠN</span>;
      default: return <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400">CHỜ THU</span>;
    }
  };

  const totalPaidAmount = useMemo(() => {
    if (!contract) return 0;
    return contract.paymentPhases?.filter(p => p.status === 'Paid').reduce((acc, curr) => acc + curr.amount, 0) || 0;
  }, [contract]);

  const disbursementRate = contract && contract.value > 0 ? (totalPaidAmount / contract.value) * 100 : 0;

  if (loading) return <div className="p-8 text-center text-slate-500">Đang tải dữ liệu hợp đồng...</div>;
  if (error || !contract) return <div className="p-8 text-center text-rose-500 font-bold">{error || 'Không tìm thấy dữ liệu'}</div>;

  return (
    <div className="space-y-6 animate-in slide-in-from-right-4 duration-500 pb-12">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="flex items-center gap-4">
          <button
            onClick={onBack}
            className="p-2 hover:bg-white dark:hover:bg-slate-800 rounded-xl border border-transparent hover:border-slate-200 dark:hover:border-slate-700 transition-all text-slate-500"
          >
            <ArrowLeft size={20} />
          </button>
          <div>
            <div className="flex items-center gap-2 mb-1">
              <span className="text-xs font-bold text-indigo-600 dark:text-indigo-400 bg-indigo-50 dark:bg-indigo-900/30 px-2 py-0.5 rounded uppercase tracking-wider">
                {contract.id}
              </span>
              <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full border ${getStatusColor(contract.status)} uppercase`}>
                {contract.status === 'Active' ? 'Đang hiệu lực' : contract.status}
              </span>
            </div>
            <h1 className="text-xl md:text-2xl font-bold text-slate-900 dark:text-slate-100 leading-tight">{contract.title}</h1>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={onEdit}
            className="flex-1 md:flex-none flex items-center justify-center gap-2 px-4 py-2 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-sm font-semibold text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-700 transition-all"
          >
            <Edit3 size={16} />
            Chỉnh sửa
          </button>
          <button className="flex-1 md:flex-none flex items-center justify-center gap-2 px-4 py-2 bg-indigo-600 text-white rounded-xl text-sm font-semibold hover:bg-indigo-700 transition-all shadow-lg shadow-indigo-100 dark:shadow-none text-sm">
            <Download size={16} />
            Xuất PDF
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-6">
          <div className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-sm p-6 md:p-8">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="space-y-1">
                <p className="text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-widest">Tổng giá trị</p>
                <p className="text-2xl font-black text-slate-900 dark:text-slate-100">
                  {new Intl.NumberFormat('vi-VN').format(contract.value)} <span className="text-sm font-medium text-slate-400">đ</span>
                </p>
              </div>
              <div className="space-y-1">
                <p className="text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-widest">Đã giải ngân</p>
                <div className="flex items-center gap-2">
                  <p className="text-2xl font-black text-indigo-600 dark:text-indigo-400">
                    {new Intl.NumberFormat('vi-VN').format(totalPaidAmount)} <span className="text-sm font-medium text-slate-400">đ</span>
                  </p>
                  <span className="text-xs font-bold text-indigo-500 dark:text-indigo-400 bg-indigo-50 dark:bg-indigo-900/30 px-1.5 py-0.5 rounded">
                    {disbursementRate.toFixed(1)}%
                  </span>
                </div>
              </div>
              <div className="space-y-1">
                <p className="text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-widest">Thời hạn</p>
                <div className="flex items-center gap-2 text-slate-800 dark:text-slate-200 font-bold">
                  <Calendar size={16} className="text-slate-400" />
                  <span className="text-sm">{contract.startDate} - {contract.endDate}</span>
                </div>
              </div>
            </div>
          </div>

          <div className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-sm p-6 md:p-8">
            <h3 className="text-lg font-bold text-slate-800 dark:text-slate-100 mb-6 flex items-center gap-2">
              <GanttChart size={20} className="text-indigo-600 dark:text-indigo-400" />
              Quản trị Vận hành & Nghiệp vụ
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="p-5 border border-blue-100 dark:border-blue-900/40 bg-blue-50/20 dark:bg-blue-900/10 rounded-2xl">
                <div className="flex justify-between items-start mb-4">
                  <div className="flex items-center gap-3">
                    <div className="p-2 bg-blue-600 text-white rounded-xl">
                      <ShieldAlert size={18} />
                    </div>
                    <div>
                      <p className="text-xs font-bold text-slate-800 dark:text-slate-200">Bảo lãnh thực hiện</p>
                      <p className="text-[10px] text-slate-500 dark:text-slate-400">Trạng thái: Đã phát hành</p>
                    </div>
                  </div>
                  <span className="px-2 py-0.5 bg-emerald-100 dark:bg-emerald-900/40 text-emerald-700 dark:text-emerald-400 text-[9px] font-black rounded uppercase">Hiệu lực</span>
                </div>
                <div className="space-y-2 mt-4 pt-4 border-t border-blue-100/50 dark:border-blue-900/30">
                  <div className="flex justify-between text-xs">
                    <span className="text-slate-400">Ngân hàng:</span>
                    <span className="font-bold text-slate-700 dark:text-slate-200">Vietcombank</span>
                  </div>
                  <div className="flex justify-between text-xs">
                    <span className="text-slate-400">Giá trị:</span>
                    <span className="font-bold text-slate-700 dark:text-slate-200">25.000.000 đ</span>
                  </div>
                  <div className="flex justify-between text-xs">
                    <span className="text-slate-400">Hết hạn:</span>
                    <span className="font-bold text-rose-600 dark:text-rose-400">15/12/2024</span>
                  </div>
                </div>
              </div>

              <div className="p-5 border border-amber-100 dark:border-amber-900/40 bg-amber-50/20 dark:bg-amber-900/10 rounded-2xl">
                <div className="flex justify-between items-start mb-4">
                  <div className="flex items-center gap-3">
                    <div className="p-2 bg-amber-500 text-white rounded-xl">
                      <PackageCheck size={18} />
                    </div>
                    <div>
                      <p className="text-xs font-bold text-slate-800 dark:text-slate-200">Đặt hàng đầu vào</p>
                      <p className="text-[10px] text-slate-500 dark:text-slate-400">Trạng thái: Đang giao hàng</p>
                    </div>
                  </div>
                  <span className="px-2 py-0.5 bg-amber-100 dark:bg-amber-900/40 text-amber-700 dark:text-amber-400 text-[9px] font-black rounded uppercase">75%</span>
                </div>
                <div className="space-y-2 mt-4 pt-4 border-t border-amber-100/50 dark:border-amber-900/30">
                  <div className="flex justify-between text-xs">
                    <span className="text-slate-400">Số lượng PO:</span>
                    <span className="font-bold text-slate-700 dark:text-slate-200">02 đơn hàng</span>
                  </div>
                  <div className="flex justify-between text-xs">
                    <span className="text-slate-400">Giá trị mua:</span>
                    <span className="font-bold text-slate-700 dark:text-slate-200">120.000.000 đ</span>
                  </div>
                  <div className="flex justify-between text-xs">
                    <span className="text-slate-400">Dự kiến kho:</span>
                    <span className="font-bold text-slate-700 dark:text-slate-200">20/06/2024</span>
                  </div>
                </div>
              </div>
            </div>
          </div>

          <div className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-sm overflow-hidden transition-colors">
            <div className="p-6 md:p-8">
              <h3 className="text-lg font-bold text-slate-800 dark:text-slate-100 mb-6 flex items-center gap-2">
                <TrendingUp size={20} className="text-indigo-600 dark:text-indigo-400" />
                Tiến độ thực hiện & Triển khai
              </h3>

              <div className="relative space-y-6 before:absolute before:left-[11px] before:top-2 before:bottom-2 before:w-[2px] before:bg-slate-100 dark:before:bg-slate-800">
                {contract.milestones && contract.milestones.length > 0 ? (
                  contract.milestones.map((m) => (
                    <div key={m.id} className="flex gap-4 relative">
                      <div className={`w-6 h-6 rounded-full border-4 border-white dark:border-slate-900 z-10 flex-shrink-0 flex items-center justify-center shadow-sm ${m.status === 'Completed' ? 'bg-indigo-600' : m.status === 'Ongoing' ? 'bg-amber-400' : 'bg-slate-200 dark:bg-slate-700'
                        }`}>
                        {m.status === 'Completed' ? <CheckCircle2 size={10} className="text-white" /> : m.status === 'Ongoing' ? <Clock size={10} className="text-white" /> : null}
                      </div>
                      <div className="flex-1 p-4 bg-slate-50/50 dark:bg-slate-800/40 rounded-2xl border border-slate-100 dark:border-slate-800 hover:border-indigo-100 dark:hover:border-indigo-900 transition-colors">
                        <div className="flex justify-between items-start mb-1">
                          <p className="text-sm font-bold text-slate-800 dark:text-slate-200">{m.name}</p>
                          <span className="text-[10px] font-bold text-slate-400 uppercase">{m.date}</span>
                        </div>
                        {m.description && <p className="text-xs text-slate-500 dark:text-slate-400 italic mt-1">{m.description}</p>}
                      </div>
                    </div>
                  ))
                ) : (
                  <div className="p-4 bg-slate-50 dark:bg-slate-800 rounded-xl text-xs text-slate-500 dark:text-slate-400 italic">Chưa có thông tin các mốc triển khai chi tiết.</div>
                )}
              </div>
            </div>
          </div>

          <div className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-sm p-6 md:p-8">
            <h3 className="text-lg font-bold text-slate-800 dark:text-slate-100 mb-6 flex items-center gap-2">
              <ReceiptText size={20} className="text-indigo-600 dark:text-indigo-400" />
              Lộ trình thanh toán & Quyết toán
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {contract.paymentPhases && contract.paymentPhases.length > 0 ? (
                contract.paymentPhases.map((p) => (
                  <div key={p.id} className={`p-5 rounded-2xl border transition-all ${p.status === 'Paid' ? 'bg-emerald-50/30 dark:bg-emerald-900/10 border-emerald-100 dark:border-emerald-900/40' :
                    p.status === 'Overdue' ? 'bg-rose-50/30 dark:bg-rose-900/10 border-rose-100 dark:border-rose-900/40' : 'bg-slate-50 dark:bg-slate-800/40 border-slate-100 dark:border-slate-800'
                    }`}>
                    <div className="flex justify-between items-start mb-3">
                      <div>
                        <p className="text-xs font-bold text-slate-800 dark:text-slate-200">{p.name}</p>
                        <p className="text-[10px] text-slate-400 font-medium">Hạn thanh toán: {p.dueDate}</p>
                      </div>
                      {getPaymentStatusBadge(p.status)}
                    </div>
                    <div className="flex justify-between items-end">
                      <div>
                        <p className="text-[9px] font-bold text-slate-400 uppercase tracking-widest">Số tiền ({p.percentage}%)</p>
                        <p className="text-lg font-black text-slate-900 dark:text-slate-100">{new Intl.NumberFormat('vi-VN').format(p.amount)} <span className="text-xs font-medium">đ</span></p>
                      </div>
                      <div className="p-2 bg-white dark:bg-slate-700 rounded-xl shadow-sm border border-slate-100 dark:border-slate-600">
                        <CreditCard size={14} className="text-indigo-500 dark:text-indigo-400" />
                      </div>
                    </div>
                  </div>
                ))
              ) : (
                <div className="md:col-span-2 p-4 bg-slate-50 dark:bg-slate-800 rounded-xl text-xs text-slate-500 dark:text-slate-400 italic">Chưa có thông tin kế hoạch thanh toán chi tiết.</div>
              )}
            </div>
          </div>
        </div>

        <div className="space-y-6">
          <div className="bg-gradient-to-br from-indigo-600 to-purple-700 rounded-3xl p-6 text-white shadow-xl shadow-indigo-200 dark:shadow-none relative overflow-hidden transition-all">
            <div className="absolute top-[-20px] right-[-20px] w-32 h-32 bg-white/10 rounded-full blur-3xl"></div>
            <div className="flex items-center gap-2 mb-4">
              <ShieldCheck size={20} />
              <h4 className="font-bold">AI Risk Check</h4>
            </div>
            <div className="space-y-3">
              <p className="text-sm text-indigo-100 leading-relaxed">
                Hợp đồng này có mức độ rủi ro <span className="font-bold text-white underline">THẤP</span>.
              </p>
              <div className="flex gap-2 items-start text-xs text-indigo-100">
                <AlertCircle size={14} className="flex-shrink-0 mt-0.5" />
                <span>Cần chú ý điều khoản tự động gia hạn vào 12/2024.</span>
              </div>
              <div className="flex gap-2 items-start text-xs text-indigo-100">
                <AlertCircle size={14} className="flex-shrink-0 mt-0.5" />
                <span>Đã quá hạn thanh toán Quý 2.</span>
              </div>
            </div>
            <button className="w-full mt-6 py-2 bg-white/20 hover:bg-white/30 transition-colors rounded-xl text-xs font-bold backdrop-blur-md border border-white/10">
              Xem báo cáo AI chi tiết
            </button>
          </div>

          <div className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-sm p-6">
            <div className="flex justify-between items-center mb-4">
              <h4 className="font-bold text-slate-800 dark:text-slate-200 flex items-center gap-2">
                <Paperclip size={18} className="text-slate-400" />
                Tài liệu hồ sơ
              </h4>
              <span className="text-xs bg-slate-100 dark:bg-slate-800 text-slate-500 dark:text-slate-400 px-2 py-1 rounded-lg font-bold">3</span>
            </div>
            <div className="space-y-2">
              {[
                { name: 'Hop_dong_goc_ky_so.pdf', size: '2.4 MB' },
                { name: 'Phu_luc_01_Ky_thuat.pdf', size: '1.1 MB' },
                { name: 'Bien_ban_nghiem_thu_T1.pdf', size: '0.8 MB' }
              ].map((file, i) => (
                <div key={i} className="flex items-center justify-between p-3 rounded-2xl hover:bg-slate-50 dark:hover:bg-slate-800 border border-transparent hover:border-slate-100 dark:hover:border-slate-700 transition-all cursor-pointer group">
                  <div className="flex items-center gap-3 overflow-hidden">
                    <div className="p-2 bg-rose-50 dark:bg-rose-900/30 text-rose-500 dark:text-rose-400 rounded-lg group-hover:bg-rose-100 transition-colors">
                      <FileText size={16} />
                    </div>
                    <div className="overflow-hidden">
                      <p className="text-xs font-bold text-slate-700 dark:text-slate-200 truncate">{file.name}</p>
                      <p className="text-[10px] text-slate-400 dark:text-slate-500">{file.size}</p>
                    </div>
                  </div>
                  <Download size={14} className="text-slate-300 dark:text-slate-600 group-hover:text-indigo-600 dark:group-hover:text-indigo-400" />
                </div>
              ))}
            </div>
          </div>

          <div className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-sm p-6">
            <h4 className="font-bold text-slate-800 dark:text-slate-200 mb-6 flex items-center gap-2">
              <History size={18} className="text-slate-400" />
              Lịch sử tác động
            </h4>
            <div className="space-y-6 relative before:absolute before:left-[11px] before:top-2 before:bottom-2 before:w-[2px] before:bg-slate-100 dark:before:bg-slate-800">
              {[
                { date: '15/01/2024', event: 'Hợp đồng bắt đầu hiệu lực', status: 'done' },
                { date: '10/01/2024', event: 'Đã ký kết (Bên A & Bên B)', status: 'done' },
                { date: '05/01/2024', event: 'Phê duyệt nội dung bởi Ban Pháp chế', status: 'done' }
              ].map((item, i) => (
                <div key={i} className="flex gap-4 relative">
                  <div className={`w-6 h-6 rounded-full border-4 border-white dark:border-slate-900 z-10 flex-shrink-0 flex items-center justify-center shadow-sm ${item.status === 'done' ? 'bg-indigo-600' : 'bg-slate-200'}`}>
                    {item.status === 'done' && <ShieldCheck size={10} className="text-white" />}
                  </div>
                  <div>
                    <p className="text-[10px] font-bold text-slate-400">{item.date}</p>
                    <p className="text-xs font-semibold text-slate-700 dark:text-slate-300">{item.event}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ContractDetail;
