
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
  GanttChart,
  Package,
  Briefcase,
  Percent,
  Wallet,
  Building2,
  Users,
  Trash2,
  Plus,
  Loader2
} from 'lucide-react';
import { Contract, Unit, Milestone, PaymentPhase, AdministrativeCosts, ContractDocument } from '../types';
import { MOCK_UNITS } from '../constants';
import { ContractsAPI, UnitsAPI, PersonnelAPI, CustomersAPI, DocumentsAPI } from '../services/api';

interface ContractDetailProps {
  contract?: Contract;
  contractId?: string;
  onBack: () => void;
  onEdit: (contract: Contract) => void;
  onDelete: () => void;
}

const formatVND = (amount: number) => {
  return new Intl.NumberFormat('vi-VN').format(amount);
};

const ContractDetail: React.FC<ContractDetailProps> = ({ contract: initialContract, contractId, onBack, onEdit, onDelete }) => {
  const [contract, setContract] = useState<Contract | null>(initialContract || null);
  const [loading, setLoading] = useState(!initialContract);
  const [error, setError] = useState('');

  // Reference Names State
  const [unitName, setUnitName] = useState('...');
  const [salesName, setSalesName] = useState('...');
  const [customerName, setCustomerName] = useState('...');

  // Documents State
  const [documents, setDocuments] = useState<ContractDocument[]>([]);
  const [isUploading, setIsUploading] = useState(false);

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

  // Fetch References
  useEffect(() => {
    const fetchRefs = async () => {
      if (!contract) return;

      try {
        // Unit
        if (contract.unitId) {
          if (contract.unitId === 'all') setUnitName('Tất cả');
          else {
            const u = await UnitsAPI.getAll().then(res => res.find(i => i.id === contract.unitId));
            setUnitName(u?.name || 'Unknown');
          }
        }

        // Salesperson
        if (contract.salespersonId) {
          const s = await PersonnelAPI.getAll().then(res => res.find(i => i.id === contract.salespersonId));
          setSalesName(s?.name || 'Unknown');
        }

        // Customer
        if (contract.customerId) {
          const c = await CustomersAPI.getAll().then(res => res.find(i => i.id === contract.customerId));
          setCustomerName(c?.name || 'Unknown');
        } else if (contract.partyA) {
          setCustomerName(contract.partyA);
        }

      } catch (e) {
        console.error("Error fetching refs", e);
      }
    };
    fetchRefs();
  }, [contract]);

  // Fetch Documents
  useEffect(() => {
    if (contract?.id) {
      DocumentsAPI.getByContractId(contract.id)
        .then(setDocuments)
        .catch(e => console.error("Load docs error", e));
    }
  }, [contract?.id]);

  const handleUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!e.target.files || !e.target.files[0] || !contract) return;
    const file = e.target.files[0];
    setIsUploading(true);
    try {
      const newDoc = await DocumentsAPI.upload(contract.id, file);
      setDocuments(prev => [newDoc, ...prev]);
      // alert("Upload thành công!");
    } catch (err: any) {
      alert("Upload thất bại: " + err.message);
    } finally {
      setIsUploading(false);
      // Reset input to allow same file selection if needed
      e.target.value = '';
    }
  };

  const handleDeleteDoc = async (doc: ContractDocument, e: React.MouseEvent) => {
    e.stopPropagation();
    if (!window.confirm(`Xóa tài liệu ${doc.name}?`)) return;
    try {
      await DocumentsAPI.delete(doc.id, doc.filePath);
      setDocuments(prev => prev.filter(d => d.id !== doc.id));
    } catch (err: any) {
      alert("Xóa thất bại: " + err.message);
    }
  };

  const handleDownloadDoc = async (doc: ContractDocument) => {
    try {
      const blob = await DocumentsAPI.download(doc.filePath);
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = doc.name;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
    } catch (e: any) {
      alert("Download error: " + e.message);
    }
  };

  // Business Logic Calculations
  const financials = useMemo(() => {
    if (!contract) return null;

    const lineItems = contract.lineItems || [];
    const totalOutput = lineItems.reduce((acc, item) => acc + (item.quantity * item.outputPrice), 0);
    const totalInput = lineItems.reduce((acc, item) => acc + (item.quantity * item.inputPrice), 0);
    const totalDirect = lineItems.reduce((acc, item) => acc + (item.directCosts || 0), 0);

    const adminCosts = contract.adminCosts || {
      transferFee: 0, contractorTax: 0, importFee: 0, expertHiring: 0, documentProcessing: 0
    };
    const totalAdmin = Object.values(adminCosts).reduce((acc: number, val: any) => acc + (val || 0), 0);

    const totalCosts = totalInput + totalDirect + totalAdmin;
    const grossProfit = totalOutput - totalCosts; // Or use contract.value if distinct
    const margin = totalOutput > 0 ? (grossProfit / totalOutput) * 100 : 0;

    return {
      totalOutput,
      totalInput,
      totalDirect,
      totalAdmin,
      totalCosts,
      grossProfit,
      margin
    };
  }, [contract]);

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

  if (loading) return <div className="p-8 text-center text-slate-500">Đang tải dữ liệu hợp đồng...</div>;
  if (error || !contract || !financials) return <div className="p-8 text-center text-rose-500 font-bold">{error || 'Không tìm thấy dữ liệu'}</div>;

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

            {/* General Info Badges */}
            <div className="flex flex-wrap gap-4 mt-3">
              <div className="flex items-center gap-1.5 text-slate-500 dark:text-slate-400 text-xs font-medium">
                <Building2 size={14} />
                <span>Đơn vị: <b className="text-slate-700 dark:text-slate-200">{unitName}</b></span>
              </div>
              <div className="flex items-center gap-1.5 text-slate-500 dark:text-slate-400 text-xs font-medium">
                <User size={14} />
                <span>PIC: <b className="text-slate-700 dark:text-slate-200">{salesName}</b></span>
              </div>
              <div className="flex items-center gap-1.5 text-slate-500 dark:text-slate-400 text-xs font-medium">
                <Users size={14} />
                <span>Khách hàng: <b className="text-slate-700 dark:text-slate-200">{customerName}</b></span>
              </div>
            </div>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={() => {
              if (window.confirm("Bạn có chắc chắn muốn xóa hợp đồng này không? hành động này không thể hoàn tác.")) {
                onDelete();
              }
            }}
            className="flex-1 md:flex-none flex items-center justify-center gap-2 px-4 py-2 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-sm font-semibold text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-900/20 transition-all"
          >
            <div className="w-4 h-4"><svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M3 6h18" /><path d="M19 6v14c0 1-1 2-2 2H7c-1 0-2-1-2-2V6" /><path d="M8 6V4c0-1 1-2 2-2h4c1 0 2 1 2 2v2" /><line x1="10" x2="10" y1="11" y2="17" /><line x1="14" x2="14" y1="11" y2="17" /></svg></div>
            Xóa
          </button>

          <button
            onClick={() => contract && onEdit(contract)}
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
          {/* 1. FINANCIAL SUMMARY */}
          <div className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-sm p-6 md:p-8">
            <h3 className="text-lg font-bold text-slate-800 dark:text-slate-100 mb-6 flex items-center gap-2">
              <Wallet size={20} className="text-indigo-600 dark:text-indigo-400" />
              Tổng quan Tài chính
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <div className="space-y-1">
                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Giá trị Ký kết</p>
                <p className="text-xl font-black text-slate-900 dark:text-slate-100">
                  {formatVND(financials.totalOutput)} <span className="text-xs font-medium text-slate-400">đ</span>
                </p>
              </div>
              <div className="space-y-1">
                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Doanh thu (Trừ VAT)</p>
                <p className="text-xl font-black text-indigo-600 dark:text-indigo-400">
                  {formatVND(Math.round(financials.totalOutput / 1.1))}
                </p>
              </div>
              <div className="space-y-1">
                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Tổng chi phí</p>
                <p className="text-xl font-black text-rose-600 dark:text-rose-400">
                  {formatVND(financials.totalCosts)}
                </p>
              </div>
              <div className="space-y-1">
                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Lợi nhuận gộp</p>
                <div className="flex items-center gap-2">
                  <p className={`text-xl font-black ${financials.grossProfit >= 0 ? 'text-emerald-600' : 'text-rose-600'}`}>
                    {formatVND(financials.grossProfit)}
                  </p>
                  <span className={`text-xs font-bold px-1.5 py-0.5 rounded ${financials.grossProfit >= 0 ? 'bg-emerald-100 text-emerald-700' : 'bg-rose-100 text-rose-700'}`}>
                    {financials.margin.toFixed(1)}%
                  </span>
                </div>
              </div>
            </div>
          </div>

          {/* 2. BUSINESS PLAN DETAILS */}
          <div className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-sm p-6 md:p-8">
            <h3 className="text-lg font-bold text-slate-800 dark:text-slate-100 mb-6 flex items-center gap-2">
              <Briefcase size={20} className="text-indigo-600 dark:text-indigo-400" />
              Chi tiết Phương án Kinh doanh
            </h3>

            {/* 2.1 Products Table */}
            <div className="mb-8 overflow-x-auto">
              <table className="w-full text-left text-xs min-w-[800px]">
                <thead className="bg-slate-50 dark:bg-slate-800/50">
                  <tr>
                    <th className="px-4 py-3 font-black text-slate-400 uppercase tracking-tighter">Sản phẩm/Dịch vụ</th>
                    <th className="px-2 py-3 font-black text-slate-400 uppercase tracking-tighter text-center">SL</th>
                    <th className="px-4 py-3 font-black text-slate-400 uppercase tracking-tighter text-right">Giá Đầu vào</th>
                    <th className="px-4 py-3 font-black text-slate-400 uppercase tracking-tighter text-right">Giá Đầu ra</th>
                    <th className="px-4 py-3 font-black text-slate-400 uppercase tracking-tighter text-right">CP Trực tiếp</th>
                    <th className="px-4 py-3 font-black text-slate-400 uppercase tracking-tighter text-right">Chênh lệch</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-50 dark:divide-slate-800">
                  {contract.lineItems?.map((item, idx) => {
                    const inputTotal = item.quantity * item.inputPrice;
                    const outputTotal = item.quantity * item.outputPrice;
                    const margin = outputTotal - inputTotal - (item.directCosts || 0);

                    return (
                      <tr key={idx} className="group hover:bg-slate-50 dark:hover:bg-slate-800/20">
                        <td className="px-4 py-3 font-bold text-slate-700 dark:text-slate-200">{item.name}</td>
                        <td className="px-2 py-3 text-center">{item.quantity}</td>
                        <td className="px-4 py-3 text-right text-slate-500">{formatVND(item.inputPrice)}</td>
                        <td className="px-4 py-3 text-right font-bold text-indigo-600">{formatVND(item.outputPrice)}</td>
                        <td className="px-4 py-3 text-right text-rose-500 relative group/tooltip font-bold cursor-help">
                          {formatVND(item.directCosts || 0)}
                          {/* Tooltip for Details */}
                          {item.directCostDetails && item.directCostDetails.length > 0 && (
                            <div className="absolute top-full right-0 mt-2 w-56 p-3 bg-slate-900 text-white text-[10px] rounded-xl shadow-xl z-50 opacity-0 group-hover/tooltip:opacity-100 transition-opacity pointer-events-none hidden group-hover/tooltip:block">
                              <div className="space-y-1">
                                {item.directCostDetails.map((d, i) => (
                                  <div key={i} className="flex justify-between border-b border-slate-700 pb-1 last:border-0 last:pb-0">
                                    <span>{d.name}</span>
                                    <span className="font-bold">{formatVND(d.amount)}</span>
                                  </div>
                                ))}
                              </div>
                            </div>
                          )}
                        </td>
                        <td className={`px-4 py-3 text-right font-black ${margin >= 0 ? 'text-emerald-600' : 'text-rose-600'}`}>
                          {formatVND(margin)}
                        </td>
                      </tr>
                    );
                  })}
                  {/* Totals Row */}
                  <tr className="bg-slate-50 dark:bg-slate-800/50 font-black text-slate-800 dark:text-slate-200 border-t-2 border-slate-100 dark:border-slate-700">
                    <td className="px-4 py-3" colSpan={2}>TỔNG CỘNG</td>
                    <td className="px-4 py-3 text-right text-slate-500">{formatVND(financials.totalInput)}</td>
                    <td className="px-4 py-3 text-right text-indigo-600">{formatVND(financials.totalOutput)}</td>
                    <td className="px-4 py-3 text-right text-rose-500">{formatVND(financials.totalDirect)}</td>
                    <td className={`px-4 py-3 text-right ${financials.grossProfit >= 0 ? 'text-emerald-600' : 'text-rose-600'}`}>
                      {formatVND(financials.totalOutput - financials.totalInput - financials.totalDirect)}
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>

            {/* 2.2 Admin Costs */}
            <h4 className="text-sm font-bold text-slate-600 dark:text-slate-400 uppercase tracking-widest mb-4 flex items-center gap-2">
              <ShieldCheck size={16} /> Chi phí Quản lý Hợp đồng
            </h4>
            <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
              {[
                { key: 'transferFee', label: 'Phí chuyển tiền' },
                { key: 'contractorTax', label: 'Thuế nhà thầu' },
                { key: 'importFee', label: 'Logistics/NK' },
                { key: 'expertHiring', label: 'Thuê chuyên gia' },
                { key: 'documentProcessing', label: 'Xử lý chứng từ' }
              ].map(item => (
                <div key={item.key} className="p-3 bg-slate-50 dark:bg-slate-800/50 rounded-xl border border-slate-100 dark:border-slate-700">
                  <p className="text-[10px] text-slate-400 font-bold uppercase truncate" title={item.label}>{item.label}</p>
                  <p className="text-sm font-black text-rose-500 mt-1">
                    {formatVND((contract.adminCosts as any)?.[item.key] || 0)}
                  </p>
                </div>
              ))}
            </div>
          </div>

          {/* 3. IMPLEMENTATION PLAN */}
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

          {/* 4. PAYMENT & CASHFLOW */}
          <div className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-sm p-6 md:p-8">
            <h3 className="text-lg font-bold text-slate-800 dark:text-slate-100 mb-6 flex items-center gap-2">
              <ReceiptText size={20} className="text-indigo-600 dark:text-indigo-400" />
              Lộ trình thanh toán & Công nợ
            </h3>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              {/* Revenue (In) */}
              <div className="space-y-4">
                <p className="text-[11px] font-black text-emerald-600 uppercase tracking-widest border-b border-emerald-100 dark:border-emerald-900 pb-2">Kế hoạch Tiền về</p>
                {contract.paymentPhases?.filter(p => !p.type || p.type === 'Revenue').map(p => (
                  <div key={p.id} className="p-4 bg-emerald-50/50 dark:bg-emerald-900/10 rounded-xl border border-emerald-100 dark:border-emerald-800">
                    <div className="flex justify-between mb-2">
                      <span className="text-xs font-bold text-slate-700 dark:text-slate-200">{p.name || p.id}</span>
                      {getPaymentStatusBadge(p.status)}
                    </div>
                    <div className="flex justify-between items-end">
                      <span className="text-[10px] text-slate-400">{p.dueDate}</span>
                      <span className="text-sm font-black text-emerald-600">{formatVND(p.amount)}</span>
                    </div>
                  </div>
                ))}
              </div>

              {/* Expense (Out) */}
              <div className="space-y-4">
                <p className="text-[11px] font-black text-rose-600 uppercase tracking-widest border-b border-rose-100 dark:border-rose-900 pb-2">Kế hoạch Chi trả</p>
                {contract.paymentPhases?.filter(p => p.type === 'Expense').map(p => (
                  <div key={p.id} className="p-4 bg-rose-50/50 dark:bg-rose-900/10 rounded-xl border border-rose-100 dark:border-rose-800">
                    <div className="flex justify-between mb-2">
                      <span className="text-xs font-bold text-slate-700 dark:text-slate-200">{p.name || p.id}</span>
                      <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-slate-100 text-slate-500">DỰ CHI</span>
                    </div>
                    <div className="flex justify-between items-end">
                      <span className="text-[10px] text-slate-400">{p.dueDate}</span>
                      <span className="text-sm font-black text-rose-500">{formatVND(p.amount)}</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* SIDEBAR RIGHT */}
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
              <label className="cursor-pointer bg-indigo-50 hover:bg-indigo-100 dark:bg-indigo-900/30 dark:hover:bg-indigo-900/50 text-indigo-600 dark:text-indigo-400 p-2 rounded-lg transition-colors flex items-center justify-center">
                {isUploading ? <Loader2 size={16} className="animate-spin" /> : <Plus size={16} />}
                <input type="file" className="hidden" onChange={handleUpload} disabled={isUploading} />
              </label>
            </div>
            <div className="space-y-2">
              {documents.length === 0 && <p className="text-xs text-slate-400 italic text-center py-4">Chưa có tài liệu nào</p>}
              {documents.map((file) => (
                <div key={file.id} className="flex items-center justify-between p-3 rounded-2xl hover:bg-slate-50 dark:hover:bg-slate-800 border border-transparent hover:border-slate-100 dark:hover:border-slate-700 transition-all cursor-pointer group" onClick={() => handleDownloadDoc(file)}>
                  <div className="flex items-center gap-3 overflow-hidden">
                    <div className="p-2 bg-rose-50 dark:bg-rose-900/30 text-rose-500 dark:text-rose-400 rounded-lg group-hover:bg-rose-100 transition-colors">
                      <FileText size={16} />
                    </div>
                    <div className="overflow-hidden">
                      <p className="text-xs font-bold text-slate-700 dark:text-slate-200 truncate">{file.name}</p>
                      <p className="text-[10px] text-slate-400 dark:text-slate-500">{((file.size || 0) / 1024).toFixed(0)} KB • {new Date(file.uploadedAt).toLocaleDateString('vi-VN')}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <button onClick={(e) => handleDeleteDoc(file, e)} className="p-1.5 hover:bg-rose-100 dark:hover:bg-rose-900/50 rounded-lg text-slate-300 hover:text-rose-500 transition-colors opacity-0 group-hover:opacity-100">
                      <Trash2 size={14} />
                    </button>
                    <button className="p-1.5 hover:bg-indigo-100 dark:hover:bg-indigo-900/50 rounded-lg text-slate-300 hover:text-indigo-600 transition-colors">
                      <Download size={14} />
                    </button>
                  </div>
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
