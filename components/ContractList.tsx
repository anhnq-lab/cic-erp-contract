import React, { useState, useMemo, useEffect } from 'react';
import { Search, Filter, Plus, MoreVertical, ExternalLink, User, Loader2 } from 'lucide-react';
import { ContractsAPI, PersonnelAPI } from '../services/api';
import { ContractStatus, Unit, Contract, SalesPerson } from '../types';

interface ContractListProps {
  selectedUnit: Unit;
  onSelectContract: (id: string) => void;
  onAdd: () => void;
}

const ContractList: React.FC<ContractListProps> = ({ selectedUnit, onSelectContract, onAdd }) => {
  const [statusFilter, setStatusFilter] = useState<ContractStatus | 'All'>('All');
  const [contracts, setContracts] = useState<Contract[]>([]);
  const [salespeople, setSalespeople] = useState<SalesPerson[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');

  // Fetch data
  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      try {
        const [contractsData, personnelData] = await Promise.all([
          ContractsAPI.getAll(),
          PersonnelAPI.getAll()
        ]);
        setContracts(contractsData);
        setSalespeople(personnelData);
      } catch (error) {
        console.error("Failed to fetch data:", error);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, []); // Reload when unit changes? No, filter locally for smoothness, or fetch by unit if heavy.

  const filteredContracts = useMemo(() => {
    let result = contracts;

    // Filter by Unit
    if (selectedUnit && selectedUnit.id !== 'all') {
      result = result.filter(c => c.unitId === selectedUnit.id);
    }

    // Filter by Status
    if (statusFilter !== 'All') {
      result = result.filter(c => c.status === statusFilter);
    }

    // Filter by Search
    if (searchTerm) {
      const lowerTerm = searchTerm.toLowerCase();
      result = result.filter(c =>
        c.id.toLowerCase().includes(lowerTerm) ||
        c.partyA.toLowerCase().includes(lowerTerm) ||
        c.title.toLowerCase().includes(lowerTerm)
      );
    }

    return result;
  }, [contracts, selectedUnit, statusFilter, searchTerm]);

  const getStatusColor = (status: ContractStatus) => {
    switch (status) {
      case 'Active': return 'bg-emerald-100 text-emerald-800 dark:bg-emerald-900/30 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-800';
      case 'Pending': return 'bg-amber-100 text-amber-800 dark:bg-amber-900/30 dark:text-amber-400 border border-amber-200 dark:border-amber-800';
      case 'Reviewing': return 'bg-indigo-100 text-indigo-800 dark:bg-indigo-900/30 dark:text-indigo-400 border border-indigo-200 dark:border-indigo-800';
      case 'Expired': return 'bg-rose-100 text-rose-800 dark:bg-rose-900/30 dark:text-rose-400 border border-rose-200 dark:border-rose-800';
      default: return 'bg-slate-100 text-slate-800 dark:bg-slate-800 dark:text-slate-400 border border-slate-200 dark:border-slate-700';
    }
  };

  const formatCurrency = (val: number) => {
    return new Intl.NumberFormat('vi-VN').format(Math.round(val));
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="animate-spin text-indigo-600" size={32} />
        <span className="ml-2 text-slate-500 font-bold">Đang tải dữ liệu...</span>
      </div>
    )
  }

  return (
    <div className="space-y-6 animate-in slide-in-from-bottom-4 duration-500 pb-12">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-black text-slate-900 dark:text-slate-100 tracking-tight">Hợp đồng & Vụ việc</h1>
          <p className="text-slate-600 dark:text-slate-400 text-sm font-bold mt-1">
            Đơn vị: <span className="text-indigo-700 dark:text-indigo-400 font-black uppercase">{selectedUnit?.name || 'Toàn công ty'}</span>
            <span className="mx-2">•</span>
            Tổng số: <span className="text-slate-900 dark:text-slate-100 font-black">{filteredContracts.length} hồ sơ</span>
          </p>
        </div>
        <button
          onClick={onAdd}
          className="flex items-center justify-center gap-2 bg-indigo-700 text-white px-6 py-3 rounded-2xl font-black hover:bg-indigo-800 transition-all shadow-xl shadow-indigo-100 dark:shadow-none"
        >
          <Plus size={22} /> Thêm mới
        </button>
      </div>

      <div className="bg-white dark:bg-slate-900 p-5 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-md flex flex-wrap gap-4 items-center">
        <div className="flex-1 min-w-[240px] relative">
          <Search size={20} className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-500" />
          <input
            type="text"
            placeholder="Tìm mã HĐ, tên khách hàng hoặc dự án..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-12 pr-4 py-3 bg-slate-100 dark:bg-slate-800 border-2 border-slate-200 dark:border-slate-700 rounded-2xl focus:outline-none focus:ring-2 focus:ring-indigo-500 text-sm font-bold text-slate-900 dark:text-slate-100"
          />
        </div>

        <select
          className="bg-slate-100 dark:bg-slate-800 border-2 border-slate-200 dark:border-slate-700 rounded-2xl px-4 py-3 text-sm font-black text-slate-900 dark:text-slate-100 outline-none"
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value as any)}
        >
          <option value="All">Tất cả trạng thái</option>
          <option value="Active">Đang hiệu lực</option>
          <option value="Pending">Chờ duyệt</option>
          <option value="Reviewing">Đang xem xét</option>
          <option value="Expired">Hết hạn</option>
        </select>
      </div>

      {/* 
          GIẢI PHÁP THOÁNG: 
          - Không dùng overflow-hidden ở div cha.
          - Table sử dụng border-separate để sticky hoạt động chính xác.
      */}
      <div className="bg-white dark:bg-slate-900 rounded-[32px] border border-slate-200 dark:border-slate-800 shadow-lg transition-colors overflow-x-auto">
        <table className="w-full text-left border-separate border-spacing-0 min-w-[1400px]">
          <thead>
            <tr className="z-20">
              {[
                { label: 'STT', align: 'center', width: 'w-12' },
                { label: 'Mã hiệu / Loại', align: 'left' },
                { label: 'Nội dung thực hiện', align: 'left' },
                { label: 'Phụ trách (Sale)', align: 'left' },
                { label: 'Giá trị ký', align: 'right' },
                { label: 'Tiền về', align: 'right' },
                { label: 'Lợi nhuận', align: 'right', color: 'text-emerald-700 dark:text-emerald-400' },
                { label: 'Tỷ suất', align: 'center' },
                { label: 'Trạng thái', align: 'center' },
                { label: '', align: 'right' }
              ].map((col, idx) => (
                <th
                  key={idx}
                  className={`sticky top-0 z-20 bg-slate-50 dark:bg-slate-800 px-4 py-5 text-[10px] font-black uppercase tracking-widest border-b border-slate-200 dark:border-slate-700 shadow-[inset_0_-1px_0_rgba(0,0,0,0.05)]
                    ${col.align === 'center' ? 'text-center' : col.align === 'right' ? 'text-right' : 'text-left'}
                    ${col.color || 'text-slate-500 dark:text-slate-400'}
                    ${col.width || ''}`}
                >
                  {col.label}
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100 dark:divide-slate-800 bg-white dark:bg-slate-900">
            {filteredContracts.map((contract, index) => {
              const profit = (contract.value || 0) - (contract.estimatedCost || 0);
              const margin = (contract.value || 0) > 0 ? (profit / contract.value) * 100 : 0;
              const salesperson = salespeople.find(s => s.id === contract.salespersonId);

              return (
                <tr
                  key={contract.id}
                  onClick={() => onSelectContract(contract.id)}
                  className="group hover:bg-indigo-50/50 dark:hover:bg-indigo-900/10 transition-all cursor-pointer"
                >
                  <td className="px-4 py-5 text-center text-xs font-bold text-slate-400 dark:text-slate-500 bg-white dark:bg-slate-900">
                    {(index + 1).toString().padStart(2, '0')}
                  </td>
                  <td className="px-4 py-5 bg-white dark:bg-slate-900">
                    <div className="flex items-center gap-3">
                      <div className={`w-8 h-8 rounded-lg flex items-center justify-center text-[10px] font-black flex-shrink-0 ${contract.contractType === 'HĐ' ? 'bg-indigo-100 dark:bg-indigo-900/40 text-indigo-700 dark:text-indigo-400 border border-indigo-200 dark:border-indigo-800' : 'bg-amber-100 dark:bg-amber-900/40 text-amber-700 dark:text-amber-400 border border-amber-200 dark:border-amber-800'}`}>
                        {contract.contractType}
                      </div>
                      <div>
                        <p className="text-sm font-black text-slate-900 dark:text-slate-100 leading-none">{contract.id}</p>
                        <p className="text-[9px] font-bold text-slate-500 dark:text-slate-400 mt-1 uppercase tracking-tighter">
                          {contract.signedDate}
                        </p>
                      </div>
                    </div>
                  </td>
                  <td className="px-4 py-5 bg-white dark:bg-slate-900">
                    <div className="text-sm font-black text-slate-800 dark:text-slate-200 truncate max-w-[200px]">
                      {contract.title}
                    </div>
                    <div className="text-xs font-bold text-slate-500 dark:text-slate-400 mt-0.5">{contract.partyA}</div>
                  </td>
                  <td className="px-4 py-5 bg-white dark:bg-slate-900">
                    <div className="flex items-center gap-2">
                      <div className="w-6 h-6 rounded-full bg-slate-100 dark:bg-slate-800 flex items-center justify-center text-[10px] font-black text-slate-400">
                        {salesperson?.name ? salesperson.name[0] : '?'}
                      </div>
                      <span className="text-xs font-bold text-slate-700 dark:text-slate-300">{salesperson?.name || 'Chưa gán'}</span>
                    </div>
                  </td>
                  <td className="px-4 py-5 text-right bg-white dark:bg-slate-900">
                    <span className="text-sm font-black text-slate-900 dark:text-slate-100">
                      {formatCurrency(contract.value || 0)}
                    </span>
                  </td>
                  <td className="px-4 py-5 text-right bg-white dark:bg-slate-900">
                    <span className="text-sm font-black text-slate-900 dark:text-slate-100">
                      {formatCurrency(contract.actualRevenue || 0)}
                    </span>
                  </td>
                  <td className="px-4 py-5 text-right bg-white dark:bg-slate-900">
                    <span className="text-sm font-black text-emerald-700 dark:text-emerald-400">
                      {formatCurrency(profit)}
                    </span>
                  </td>
                  <td className="px-4 py-5 text-center bg-white dark:bg-slate-900">
                    <span className={`px-2 py-0.5 rounded-full text-[10px] font-black ${margin > 50 ? 'bg-emerald-100 dark:bg-emerald-900/30 text-emerald-800 dark:text-emerald-400' : 'bg-indigo-100 dark:bg-indigo-900/30 text-indigo-800 dark:text-indigo-400'}`}>
                      {margin.toFixed(0)}%
                    </span>
                  </td>
                  <td className="px-4 py-5 text-center bg-white dark:bg-slate-900">
                    <span className={`px-3 py-1.5 rounded-xl text-[9px] font-black uppercase shadow-sm ${getStatusColor(contract.status)} inline-block min-w-[80px]`}>
                      {contract.status}
                    </span>
                  </td>
                  <td className="px-4 py-5 text-right bg-white dark:bg-slate-900">
                    <button className="p-2 text-slate-400 dark:text-slate-500 hover:text-indigo-700 dark:hover:text-indigo-400">
                      <MoreVertical size={20} />
                    </button>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default ContractList;
