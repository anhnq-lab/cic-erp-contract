import React, { useState, useMemo, useEffect, useCallback } from 'react';
import { toast } from 'sonner';
import * as XLSX from 'xlsx';
import { Search, Filter, Plus, MoreVertical, ExternalLink, User, Loader2, DollarSign, Briefcase, TrendingUp, Calendar, Building2, ChevronLeft, ChevronRight, Download, Upload, Copy } from 'lucide-react';
import { ContractsAPI, PersonnelAPI, UnitsAPI } from '../services/api';
import { ContractStatus, Unit, Contract, SalesPerson } from '../types';
// import { useDebounce } from '../hooks/useDebounce'; // Inline implementation used instead

// Inline debounce hook if not exists, but better to check. 
// For now, I'll use a simple useEffect debounce logic.

interface ContractListProps {
  selectedUnit: Unit;
  onSelectContract: (id: string) => void;
  onAdd: () => void;
  onClone?: (contract: Contract) => void;
}

const ContractList: React.FC<ContractListProps> = ({ selectedUnit, onSelectContract, onAdd }) => {
  // Params state
  const [statusFilter, setStatusFilter] = useState<ContractStatus | 'All'>('All');
  const [yearFilter, setYearFilter] = useState<string>('All');
  const [unitFilter, setUnitFilter] = useState<string>('All');
  const [searchTerm, setSearchTerm] = useState('');
  const [debouncedSearch, setDebouncedSearch] = useState('');

  // Pagination state
  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(20);
  const [totalCount, setTotalCount] = useState(0);

  // Data state
  const [contracts, setContracts] = useState<Contract[]>([]);
  const [salespeople, setSalespeople] = useState<SalesPerson[]>([]);
  const [units, setUnits] = useState<Unit[]>([]);
  const [loading, setLoading] = useState(true);
  const [metrics, setMetrics] = useState({ totalContracts: 0, totalValue: 0, totalRevenue: 0, totalProfit: 0 });

  // Debounce search
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearch(searchTerm);
      setPage(1); // Reset to page 1 on search change
    }, 500);
    return () => clearTimeout(timer);
  }, [searchTerm]);

  // Initial lookup data fetch (Run once)
  useEffect(() => {
    const fetchLookups = async () => {
      try {
        const [personnelData, unitsData] = await Promise.all([
          PersonnelAPI.getAll(),
          UnitsAPI.getAll()
        ]);
        setSalespeople(personnelData);
        setUnits(unitsData);
      } catch (e) {
        console.error("Fetch lookups failed", e);
        toast.error("Không thể tải dữ liệu danh mục");
      }
    };
    fetchLookups();
  }, []);

  // Fetch Contracts & Stats when params change
  useEffect(() => {
    const fetchContracts = async () => {
      setLoading(true);
      try {
        // Resolve effective unit ID (Global > Local > All)
        let effectiveUnitId = 'All';
        if (selectedUnit && selectedUnit.id !== 'all') {
          effectiveUnitId = selectedUnit.id;
        } else if (unitFilter !== 'All') {
          effectiveUnitId = unitFilter;
        }

        const params = {
          page,
          limit,
          search: debouncedSearch,
          status: statusFilter,
          unitId: effectiveUnitId,
          year: yearFilter
        };

        const [listRes, statsRes] = await Promise.all([
          ContractsAPI.list(params),
          ContractsAPI.getStats(params) // Reuse same filters for stats
        ]);

        setContracts(listRes.data);
        setTotalCount(listRes.count);
        setMetrics(statsRes);
      } catch (error) {
        console.error("Failed to fetch contracts:", error);
        toast.error("Không thể tải danh sách hợp đồng");
      } finally {
        setLoading(false);
      }
    };
    fetchContracts();
  }, [page, limit, debouncedSearch, statusFilter, yearFilter, unitFilter, selectedUnit]);

  // Extract unique years (We can keep this separate or hardcode for now since we don't have all data to derive from)
  // For server-side, it's better to verify available years from API, but for now fallback to static range or keeping simple
  const availableYears = ['2026', '2025', '2024', '2023'];

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

  const formatCompactNumber = (number: number) => {
    return new Intl.NumberFormat('vi-VN', { notation: "compact", maximumFractionDigits: 1 }).format(number);
  };

  const totalPages = Math.ceil(totalCount / limit);

  // File input ref for import
  const fileInputRef = React.useRef<HTMLInputElement>(null);

  const handleImport = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const promise = new Promise(async (resolve, reject) => {
      try {
        const data = await file.arrayBuffer();
        const workbook = XLSX.read(data);
        const worksheet = workbook.Sheets[workbook.SheetNames[0]];
        const jsonData = XLSX.utils.sheet_to_json(worksheet);

        let successCount = 0;
        let failCount = 0;

        // Process each row
        // Expected headers: 'Mã HĐ', 'Tên HĐ', 'Khách hàng', 'Giá trị', 'Ngày ký', 'Trạng thái'
        // Or simple object keys mapping
        // We will try to map loosely
        for (const row of jsonData as any[]) {
          try {
            // Minimal mapping
            const contractData: any = {
              id: row['Mã HĐ'] || row['id'] || `HD-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
              title: row['Tên HĐ'] || row['title'] || 'Hợp đồng nhập khẩu',
              partyA: row['Khách hàng'] || row['partyA'] || 'Khách hàng',
              value: Number(row['Giá trị'] || row['value'] || 0),
              actualRevenue: Number(row['Doanh thu'] || row['actualRevenue'] || 0),
              signedDate: row['Ngày ký'] || row['signedDate'] || new Date().toISOString().split('T')[0],
              status: row['Trạng thái'] || row['status'] || 'Pending',
              // Defaults
              contractType: 'HĐ',
              unitId: selectedUnit?.id !== 'all' ? selectedUnit.id : (units[0]?.id || 'u1'),
              customerId: 'mimock', // Placeholder, ideally should match by name
              salespersonId: 'admin'
            };

            // Try create
            // Note: ID must be unique. If 'Mã HĐ' exists, it might fail or we should use update?
            // For now, assume create new items
            await ContractsAPI.create(contractData);
            successCount++;
          } catch (err) {
            console.error("Row error", err);
            failCount++;
          }
        }

        // Refresh list
        setDebouncedSearch(prev => prev + " "); // Trigger effect

        resolve(`Nhập thành công ${successCount} hợp đồng. Thất bại ${failCount}.`);
      } catch (err) {
        reject(err);
      }
    });

    toast.promise(promise, {
      loading: 'Đang xử lý file...',
      success: (data: any) => data,
      error: 'Lỗi khi nhập file',
    });

    // Reset input
    e.target.value = '';
  };

  return (
    <div className="space-y-6 animate-in slide-in-from-bottom-4 duration-500 pb-12">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-black text-slate-900 dark:text-slate-100 tracking-tight">Hợp đồng & Vụ việc</h1>
          <p className="text-slate-600 dark:text-slate-400 text-sm font-bold mt-1">
            Đơn vị: <span className="text-indigo-700 dark:text-indigo-400 font-black uppercase">{selectedUnit?.name || 'Toàn công ty'}</span>
          </p>
        </div>
        <div className="flex items-center gap-3">
          <input
            type="file"
            ref={fileInputRef}
            onChange={handleImport}
            className="hidden"
            accept=".xlsx, .xls"
          />
          <button
            onClick={() => fileInputRef.current?.click()}
            className="flex items-center justify-center gap-2 bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 px-5 py-3 rounded-2xl font-bold hover:bg-slate-200 dark:hover:bg-slate-700 transition-all"
          >
            <Upload size={20} /> Nhập Excel
          </button>
          <button
            onClick={async () => {
              try {
                toast.info("Đang tạo file Excel...");
                // Resolve effective unit ID (Global > Local > All)
                let effectiveUnitId = 'All';
                if (selectedUnit && selectedUnit.id !== 'all') {
                  effectiveUnitId = selectedUnit.id;
                } else if (unitFilter !== 'All') {
                  effectiveUnitId = unitFilter;
                }

                const { data } = await ContractsAPI.list({
                  page: 1, limit: 10000,
                  search: debouncedSearch,
                  status: statusFilter,
                  unitId: effectiveUnitId,
                  year: yearFilter
                });

                // Map to export format
                const exportData = data.map((c, idx) => ({
                  'STT': idx + 1,
                  'Mã HĐ': c.id,
                  'Tên HĐ': c.title,
                  'Khách hàng': c.partyA,
                  'Giá trị': c.value,
                  'Doanh thu': c.actualRevenue,
                  'Ngày ký': c.signedDate,
                  'Trạng thái': c.status
                }));

                const ws = XLSX.utils.json_to_sheet(exportData);
                const wb = XLSX.utils.book_new();
                XLSX.utils.book_append_sheet(wb, ws, "Danh sách HĐ");
                XLSX.writeFile(wb, `Danh_sach_Hop_dong_${new Date().toISOString().split('T')[0]}.xlsx`);

                toast.success("Xuất file thành công!");
              } catch (e) {
                console.error(e);
                toast.error("Lỗi khi xuất file");
              }
            }}
            className="flex items-center justify-center gap-2 bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 px-5 py-3 rounded-2xl font-bold hover:bg-slate-200 dark:hover:bg-slate-700 transition-all"
          >
            <Download size={20} /> Xuất Excel
          </button>
          <button
            onClick={onAdd}
            className="flex items-center justify-center gap-2 bg-indigo-700 text-white px-6 py-3 rounded-2xl font-black hover:bg-indigo-800 transition-all shadow-xl shadow-indigo-100 dark:shadow-none"
          >
            <Plus size={22} /> Thêm mới
          </button>
        </div>
      </div>

      {/* SCORE CARDS */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Total Contracts */}
        <div className="bg-white dark:bg-slate-900 p-5 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-sm flex items-center gap-4">
          <div className="w-12 h-12 rounded-2xl bg-slate-100 dark:bg-slate-800 flex items-center justify-center text-slate-600 dark:text-slate-300">
            <Briefcase size={24} />
          </div>
          <div>
            <p className="text-xs font-bold text-slate-400 uppercase tracking-wider">Tổng số hồ sơ</p>
            <p className="text-2xl font-black text-slate-900 dark:text-slate-100">{metrics.totalContracts}</p>
          </div>
        </div>

        {/* Total Value */}
        <div className="bg-white dark:bg-slate-900 p-5 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-sm flex items-center gap-4">
          <div className="w-12 h-12 rounded-2xl bg-indigo-100 dark:bg-indigo-900/30 flex items-center justify-center text-indigo-600 dark:text-indigo-400">
            <DollarSign size={24} />
          </div>
          <div>
            <p className="text-xs font-bold text-slate-400 uppercase tracking-wider">Tổng giá trị ký</p>
            <p className="text-2xl font-black text-indigo-600 dark:text-indigo-400" title={formatCurrency(metrics.totalValue)}>
              {formatCompactNumber(metrics.totalValue)}
            </p>
          </div>
        </div>

        {/* Revenue */}
        <div className="bg-white dark:bg-slate-900 p-5 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-sm flex items-center gap-4">
          <div className="w-12 h-12 rounded-2xl bg-emerald-100 dark:bg-emerald-900/30 flex items-center justify-center text-emerald-600 dark:text-emerald-400">
            <TrendingUp size={24} />
          </div>
          <div>
            <p className="text-xs font-bold text-slate-400 uppercase tracking-wider">Doanh thu thực tế</p>
            <p className="text-2xl font-black text-emerald-600 dark:text-emerald-400" title={formatCurrency(metrics.totalRevenue)}>
              {formatCompactNumber(metrics.totalRevenue)}
            </p>
          </div>
        </div>

        {/* Profit */}
        <div className="bg-white dark:bg-slate-900 p-5 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-sm flex items-center gap-4">
          <div className="w-12 h-12 rounded-2xl bg-amber-100 dark:bg-amber-900/30 flex items-center justify-center text-amber-600 dark:text-amber-400">
            <DollarSign size={24} />
          </div>
          <div>
            <p className="text-xs font-bold text-slate-400 uppercase tracking-wider">Lợi nhuận gộp</p>
            <p className="text-2xl font-black text-amber-600 dark:text-amber-400" title={formatCurrency(metrics.totalProfit)}>
              {formatCompactNumber(metrics.totalProfit)}
            </p>
          </div>
        </div>
      </div>

      <div className="bg-white dark:bg-slate-900 p-5 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-md flex flex-wrap gap-4 items-center">
        {/* Search */}
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

        {/* Year Filter */}
        <div className="flex items-center gap-2 bg-slate-100 dark:bg-slate-800 rounded-2xl px-4 border-2 border-slate-200 dark:border-slate-700">
          <Calendar size={18} className="text-slate-500" />
          <select
            className="bg-transparent py-3 text-sm font-black text-slate-900 dark:text-slate-100 outline-none w-[100px]"
            value={yearFilter}
            onChange={(e) => {
              setYearFilter(e.target.value);
              setPage(1);
            }}
          >
            <option value="All">Tất cả năm</option>
            {availableYears.map(year => (
              <option key={year} value={year}>Năm {year}</option>
            ))}
          </select>
        </div>

        {/* Unit Filter (Local) - Only show if Global is All */}
        {selectedUnit?.id === 'all' && (
          <div className="flex items-center gap-2 bg-slate-100 dark:bg-slate-800 rounded-2xl px-4 border-2 border-slate-200 dark:border-slate-700">
            <Building2 size={18} className="text-slate-500" />
            <select
              className="bg-transparent py-3 text-sm font-black text-slate-900 dark:text-slate-100 outline-none max-w-[150px]"
              value={unitFilter}
              onChange={(e) => {
                setUnitFilter(e.target.value);
                setPage(1);
              }}
            >
              <option value="All">Tất cả đơn vị</option>
              {units.map(u => (
                <option key={u.id} value={u.id}>{u.name}</option>
              ))}
            </select>
          </div>
        )}

        {/* Status Filter */}
        <div className="flex items-center gap-2 bg-slate-100 dark:bg-slate-800 rounded-2xl px-4 border-2 border-slate-200 dark:border-slate-700">
          <Filter size={18} className="text-slate-500" />
          <select
            className="bg-transparent py-3 text-sm font-black text-slate-900 dark:text-slate-100 outline-none"
            value={statusFilter}
            onChange={(e) => {
              setStatusFilter(e.target.value as any);
              setPage(1);
            }}
          >
            <option value="All">Tất cả trạng thái</option>
            <option value="Active">Đang hiệu lực</option>
            <option value="Pending">Chờ duyệt</option>
            <option value="Reviewing">Đang xem xét</option>
            <option value="Expired">Hết hạn</option>
          </select>
        </div>
      </div>

      {/* TABLE */}
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
            {loading ? (
              <tr>
                <td colSpan={10} className="p-8 text-center text-slate-500">
                  <Loader2 className="animate-spin inline-block mr-2" /> Đang tải dữ liệu...
                </td>
              </tr>
            ) : contracts.length === 0 ? (
              <tr>
                <td colSpan={10} className="p-8 text-center text-slate-500">
                  Không tìm thấy hợp đồng nào
                </td>
              </tr>
            ) : contracts.map((contract, index) => {
              const profit = (contract.value || 0) - (contract.estimatedCost || 0);
              const margin = (contract.value || 0) > 0 ? (profit / contract.value) * 100 : 0;
              const salesperson = salespeople.find(s => s.id === contract.salespersonId);

              // STT calculate based on page
              const stt = ((page - 1) * limit) + index + 1;

              return (
                <tr
                  key={contract.id}
                  onClick={() => onSelectContract(contract.id)}
                  className="group hover:bg-indigo-50/50 dark:hover:bg-indigo-900/10 transition-all cursor-pointer"
                >
                  <td className="px-4 py-5 text-center text-xs font-bold text-slate-400 dark:text-slate-500 bg-white dark:bg-slate-900">
                    {stt.toString().padStart(2, '0')}
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
                  <td className="px-4 py-5 bg-white dark:bg-slate-900 text-sm font-black text-slate-800 dark:text-slate-200">
                    <p className="line-clamp-2" title={contract.title}>{contract.title}</p>
                    <p className="text-xs font-bold text-slate-500 dark:text-slate-400 mt-1">{contract.partyA}</p>
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
                    <div className="flex items-center justify-end gap-1">
                      {onClone && (
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            onClone(contract);
                          }}
                          className="p-2 text-slate-400 hover:text-indigo-600 dark:hover:text-indigo-400 transition-colors"
                          title="Nhân bản hợp đồng"
                        >
                          <Copy size={18} />
                        </button>
                      )}
                      <button className="p-2 text-slate-400 dark:text-slate-500 hover:text-indigo-700 dark:hover:text-indigo-400">
                        <MoreVertical size={20} />
                      </button>
                    </div>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {/* PAGINATION */}
      <div className="flex items-center justify-between pt-4 border-t border-slate-200 dark:border-slate-800">
        <div className="text-sm font-bold text-slate-500">
          Hiển thị {contracts.length} / {totalCount} kết quả
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={() => setPage(p => Math.max(1, p - 1))}
            disabled={page === 1}
            className="p-2 rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 hover:bg-slate-200 dark:hover:bg-slate-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            <ChevronLeft size={20} />
          </button>
          <div className="flex items-center gap-1">
            {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
              // Logic to show sliding window or just simple first 5
              // Simplified: show current surround or just basic 
              let p = i + 1;
              if (totalPages > 5 && page > 3) {
                p = page - 2 + i;
              }
              if (p > totalPages) return null;

              return (
                <button
                  key={p}
                  onClick={() => setPage(p)}
                  className={`w-10 h-10 rounded-xl text-sm font-black transition-all ${page === p
                    ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-200 dark:shadow-none'
                    : 'bg-transparent text-slate-500 hover:bg-slate-50 dark:hover:bg-slate-800'
                    }`}
                >
                  {p}
                </button>
              );
            })}
          </div>
          <button
            onClick={() => setPage(p => Math.min(totalPages, p + 1))}
            disabled={page === totalPages || totalPages === 0}
            className="p-2 rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 hover:bg-slate-200 dark:hover:bg-slate-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            <ChevronRight size={20} />
          </button>
        </div>
      </div>
    </div>
  );
};

export default ContractList;
