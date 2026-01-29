import React, { useState, useMemo, useEffect } from 'react';
import { toast } from 'sonner';
import {
  X, Save, Calendar, User, FileText,
  DollarSign, Calculator, Building2,
  Plus, Trash2, Users, Briefcase,
  TrendingUp, CreditCard, Receipt,
  Info, Package, ShieldCheck, Wallet,
  MapPin, UserCheck, Hash, Percent
} from 'lucide-react';
import {
  Unit, ContractType, LineItem,
  ContractContact, PaymentSchedule,
  RevenueSchedule, AdministrativeCosts,
  Contract, SalesPerson, Customer, Product, DirectCostDetail
} from '../types';
import { UnitService, SalesPersonService, CustomerService, ProductService, ContractService } from '../services';
import Modal from './ui/Modal';

interface ContractFormProps {
  contract?: Contract; // For edit mode
  isCloning?: boolean; // For clone mode
  onSave: (contract: any) => void;
  onCancel: () => void;
}

const ContractForm: React.FC<ContractFormProps> = ({ contract, isCloning = false, onSave, onCancel }) => {
  const isEditing = !!contract && !isCloning;

  // Data Options State
  const [units, setUnits] = useState<Unit[]>([]);
  const [salespeople, setSalespeople] = useState<SalesPerson[]>([]);
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [products, setProducts] = useState<Product[]>([]);

  useEffect(() => {
    const fetchOptions = async () => {
      try {
        const [unitsData, peopleData, customersRes, productsData] = await Promise.all([
          UnitService.getAll(),
          SalesPersonService.getAll(),
          CustomerService.getAll({ pageSize: 1000 }), // Ensure we get enough for dropdown
          ProductService.getAll()
        ]);
        setUnits(unitsData);
        setSalespeople(peopleData);
        // CustomerService.getAll returns { data, total }
        setCustomers(customersRes.data || []);
        setProducts(productsData);

        // Set default unit if creating new and no unit selected yet
        if (!isEditing && !unitId && unitsData.length > 0) {
          setUnitId(unitsData[0].id);
        }
      } catch (error) {
        console.error(error);
      }
    }
    fetchOptions();
  }, []);

  // 1. Identification & Responsibility
  const [contractType, setContractType] = useState<ContractType>(contract?.contractType || 'HĐ');
  const [unitId, setUnitId] = useState(contract?.unitId || '');
  const [coordinatingUnitId, setCoordinatingUnitId] = useState(contract?.coordinatingUnitId || '');
  const [salespersonId, setSalespersonId] = useState(contract?.salespersonId || '');
  const [customerId, setCustomerId] = useState(contract?.customerId || null);
  const [title, setTitle] = useState(contract?.title || '');
  const [clientName, setClientName] = useState(contract?.partyA || '');
  const [signedDate, setSignedDate] = useState(contract?.signedDate || new Date().toISOString().split('T')[0]);

  // const [manualValue, setManualValue] = useState<number>(contract?.value || 0); // Removed per request

  // 2. Client Contacts (Multi-entry)
  const [contacts, setContacts] = useState<ContractContact[]>(contract?.contacts || [{ id: '1', name: '', role: 'Mua sắm' }]);

  // 3. Line Items (Sản phẩm/Dịch vụ chi tiết)
  const [lineItems, setLineItems] = useState<LineItem[]>(contract?.lineItems || [{
    id: '1', name: '', quantity: 1, supplier: '', inputPrice: 0, outputPrice: 0, directCosts: 0
  }]);

  // 4. Financial Schedules (Hóa đơn & Tiền về & Chi trả NCC)
  const [revenueSchedules, setRevenueSchedules] = useState<RevenueSchedule[]>([{ id: '1', date: '', amount: 0, description: 'Đợt 1' }]);
  const [paymentSchedules, setPaymentSchedules] = useState<PaymentSchedule[]>([{ id: '1', date: '', amount: 0, description: 'Tạm ứng', type: 'Revenue' }]);
  const [supplierSchedules, setSupplierSchedules] = useState<PaymentSchedule[]>([{ id: '1', date: '', amount: 0, description: 'Thanh toán đợt 1', type: 'Expense' }]);

  // Load existing phases
  useEffect(() => {
    if (contract?.paymentPhases && Array.isArray(contract.paymentPhases)) {
      try {
        const revenue = contract.paymentPhases
          .filter(p => p && (!p.type || p.type === 'Revenue'))
          .map(p => ({
            ...p,
            date: p.dueDate || '',
            description: p.name || ''
          })) as PaymentSchedule[];

        const expense = contract.paymentPhases
          .filter(p => p && p.type === 'Expense')
          .map(p => ({
            ...p,
            date: p.dueDate || '',
            description: p.name || ''
          })) as PaymentSchedule[];

        if (revenue.length > 0) setPaymentSchedules(revenue);
        if (expense.length > 0) setSupplierSchedules(expense);
      } catch (error) {
        console.error("Error loading payment phases:", error);
      }
    }
  }, [contract]);

  // 5. Overhead Costs
  const [adminCosts, setAdminCosts] = useState<AdministrativeCosts>(contract?.adminCosts || {
    transferFee: 0, contractorTax: 0, importFee: 0, expertHiring: 0, documentProcessing: 0
  });

  const [adminCostPercentages, setAdminCostPercentages] = useState<AdministrativeCosts>({
    transferFee: 0, contractorTax: 0, importFee: 0, expertHiring: 0, documentProcessing: 0
  });

  // 6. Direct Costs Modal State
  const [activeCostModalIndex, setActiveCostModalIndex] = useState<number | null>(null);
  const [tempCostDetails, setTempCostDetails] = useState<DirectCostDetail[]>([]);

  // Function to open modal
  const openCostModal = (index: number) => {
    setActiveCostModalIndex(index);
    setTempCostDetails(lineItems[index].directCostDetails || []);
  };

  // Auto-save Logic
  const [currentStep, setCurrentStep] = useState(1);

  // Wizard Navigation
  const handleNext = () => {
    if (currentStep === 1) {
      if (!unitId || !salespersonId) {
        toast.error("Vui lòng chọn Đơn vị và Nhân viên phụ trách trước khi tiếp tục!");
        return;
      }
      if (!title && !customerId) {
        toast.warning("Lưu ý: Bạn chưa nhập thông tin Khách hàng hoặc Tiêu đề hợp đồng.");
      }
    }
    setCurrentStep(prev => prev + 1);
    // Scroll to top
    const formContainer = document.querySelector('.overflow-y-auto');
    if (formContainer) formContainer.scrollTop = 0;
  };

  const handleBack = () => {
    setCurrentStep(prev => prev - 1);
  };

  // Function to save modal
  const saveCostModal = () => {
    if (activeCostModalIndex === null) return;

    const newList = [...lineItems];
    const totalAmount = tempCostDetails.reduce((acc, item) => acc + item.amount, 0);

    newList[activeCostModalIndex].directCostDetails = tempCostDetails;
    newList[activeCostModalIndex].directCosts = totalAmount;

    setLineItems(newList);
    setActiveCostModalIndex(null);
  };

  // Auto-save Logic
  useEffect(() => {
    if (isEditing) return; // Only auto-save for new contracts

    const timer = setTimeout(() => {
      const draft = {
        contractType, unitId, coordinatingUnitId, salespersonId, customerId, title, clientName,
        signedDate, contacts, lineItems, revenueSchedules, paymentSchedules, supplierSchedules,
        adminCosts, adminCostPercentages
      };

      // Only save if there's some data
      if (title || clientName || lineItems.length > 0) {
        localStorage.setItem('contract_form_draft', JSON.stringify(draft));
      }
    }, 1000);

    return () => clearTimeout(timer);
  }, [
    isEditing,
    contractType, unitId, coordinatingUnitId, salespersonId, customerId, title, clientName,
    signedDate, contacts, lineItems, revenueSchedules, paymentSchedules, supplierSchedules,
    adminCosts, adminCostPercentages
  ]);

  // Restore Draft Hook
  useEffect(() => {
    if (!isEditing && !isCloning) {
      const saved = localStorage.getItem('contract_form_draft');
      if (saved) {
        try {
          const draft = JSON.parse(saved);
          if (draft.title || draft.clientName) {
            toast("Tìm thấy bản nháp chưa lưu!", {
              description: "Bạn có muốn khôi phục dữ liệu đang nhập dở không?",
              action: {
                label: "Khôi phục",
                onClick: () => {
                  if (draft.contractType) setContractType(draft.contractType);
                  if (draft.unitId) setUnitId(draft.unitId);
                  if (draft.coordinatingUnitId) setCoordinatingUnitId(draft.coordinatingUnitId);
                  if (draft.salespersonId) setSalespersonId(draft.salespersonId);
                  if (draft.customerId) setCustomerId(draft.customerId);
                  if (draft.title) setTitle(draft.title);
                  if (draft.clientName) setClientName(draft.clientName);
                  if (draft.signedDate) setSignedDate(draft.signedDate);
                  if (draft.contacts) setContacts(draft.contacts);
                  if (draft.lineItems) setLineItems(draft.lineItems);
                  if (draft.revenueSchedules) setRevenueSchedules(draft.revenueSchedules);
                  if (draft.paymentSchedules) setPaymentSchedules(draft.paymentSchedules);
                  if (draft.supplierSchedules) setSupplierSchedules(draft.supplierSchedules);
                  if (draft.adminCosts) setAdminCosts(draft.adminCosts);
                  if (draft.adminCostPercentages) setAdminCostPercentages(draft.adminCostPercentages);
                  toast.success("Đã khôi phục bản nháp!");
                }
              }
            });
          }
        } catch (e) {
          console.error("Failed to parse draft", e);
        }
      }
    }
  }, []);

  // Filter sales based on selected unit
  const filteredSales = useMemo(() => {
    if (!unitId) return salespeople;
    return salespeople.filter(s => s.unitId === unitId);
  }, [salespeople, unitId]);

  // Auto-generate Supplier Schedules from Line Items
  const generateSupplierSchedules = () => {
    const supplierGroups: { [key: string]: number } = {};

    lineItems.forEach(item => {
      if (item.supplier) {
        const cost = item.quantity * item.inputPrice;
        if (supplierGroups[item.supplier]) {
          supplierGroups[item.supplier] += cost;
        } else {
          supplierGroups[item.supplier] = cost;
        }
      }
    });

    const newSchedules: PaymentSchedule[] = Object.keys(supplierGroups).map((supplierName, index) => {
      const existing = supplierSchedules.find(s => s.description.includes(supplierName));
      return {
        id: existing?.id || `sup-${Date.now()}-${index}`,
        date: existing?.date || '',
        amount: supplierGroups[supplierName],
        description: `Thanh toán cho ${supplierName}`,
        status: 'Pending',
        percentage: 0,
        type: 'Expense'
      };
    });

    if (newSchedules.length > 0) {
      setSupplierSchedules(newSchedules);
      toast.info("Đã cập nhật lịch thanh toán cho Nhà cung cấp");
    } else {
      toast.warning("Chưa có thông tin Nhà cung cấp trong mục chi tiết sản phẩm!");
    }
  };

  // Auto-generate Contract ID: HĐ_STT/Đơn vị_Khách hàng_Năm
  const [formContractId, setFormContractId] = useState(isCloning ? '' : (contract?.id || ''));
  const [isIdTouched, setIsIdTouched] = useState(isCloning ? false : !!contract?.id);

  useEffect(() => {
    const generateId = async () => {
      try {
        // Only auto-generate if NOT editing, ID NOT touched, and we have enough info
        if (isEditing || isIdTouched || !unitId) return;

        const unit = units.find(u => u.id === unitId);
        const unitCode = unit?.code || 'UNIT';
        const year = new Date(signedDate).getFullYear();

        // Get next number from API
        const nextNum = await ContractService.getNextContractNumber(unitId, year);
        const stt = nextNum.toString().padStart(3, '0');

        const clientInitial = clientName ? clientName.split(' ').map(w => w[0]).join('').toUpperCase().slice(0, 5) : 'KH';

        const newId = `HĐ_${stt}/${unitCode}_${clientInitial}_${year}`;
        setFormContractId(newId);
      } catch (error) {
        console.error("Error generating contract ID:", error);
      }
    };

    const timer = setTimeout(generateId, 500); // Debounce
    return () => clearTimeout(timer);
  }, [unitId, clientName, signedDate, units, isEditing, isIdTouched]);

  // Logic tính toán chuyên sâu
  const totals = useMemo(() => {
    const signingValue = lineItems.reduce((acc, item) => acc + (item.quantity * item.outputPrice), 0);
    const totalInput = lineItems.reduce((acc, item) => acc + (item.quantity * item.inputPrice), 0);
    const totalDirectCosts = lineItems.reduce((acc, item) => acc + item.directCosts, 0);

    // Explicit typing for admin costs sum
    const adminSum = (Object.values(adminCosts) as number[]).reduce((acc: number, val: number) => acc + val, 0);

    const estimatedRevenue = signingValue / 1.1; // Giá trị ký kết trừ thuế VAT (giả định 10%)
    const totalCosts = totalInput + totalDirectCosts + adminSum;
    const grossProfit = signingValue - totalCosts;
    const profitMargin = signingValue > 0 ? (grossProfit / signingValue) * 100 : 0;

    return { signingValue, estimatedRevenue, totalCosts, grossProfit, profitMargin, totalInput, totalDirectCosts, adminSum };
  }, [lineItems, adminCosts]);

  const formatVND = (val: number) => new Intl.NumberFormat('vi-VN').format(Math.round(val));

  // Handlers for dynamic lists
  const addContact = () => setContacts([...contacts, { id: Date.now().toString(), name: '', role: '' }]);
  const removeContact = (id: string) => setContacts(contacts.filter(c => c.id !== id));

  const addLineItem = () => setLineItems([...lineItems, { id: Date.now().toString(), name: '', quantity: 1, supplier: '', inputPrice: 0, outputPrice: 0, directCosts: 0 }]);
  const removeLineItem = (id: string) => setLineItems(lineItems.filter(i => i.id !== id));

  const handleSave = () => {
    // Validate
    if (!unitId || !salespersonId || !clientName) {
      toast.error("Vui lòng nhập đầy đủ thông tin bắt buộc (Đơn vị, Sale, Khách hàng)");
      return;
    }

    const payload = {
      id: formContractId, // Use form ID
      title: title || 'Hợp đồng chưa đặt tên',
      contractType,
      partyA: clientName,
      partyB: 'CIC', // Default
      clientInitials: clientName ? clientName.split(' ').map(w => w[0]).join('').toUpperCase().slice(0, 5) : 'KH',
      customerId: customerId || null,
      unitId,
      coordinatingUnitId: coordinatingUnitId || null,
      salespersonId,
      value: totals.signingValue,
      estimatedCost: totals.totalCosts,
      actualRevenue: 0,
      actualCost: totals.totalCosts,
      status: 'Pending',
      stage: 'New',
      category: 'Project',
      signedDate,
      startDate: signedDate,
      endDate: signedDate,
      content: title, // Simplified
      contacts: contacts,
      milestones: [],
      paymentPhases: [...paymentSchedules, ...supplierSchedules],
      lineItems: lineItems,
      adminCosts: adminCosts
    };

    onSave(payload);
  };

  return (
    <div className="bg-white dark:bg-slate-900 rounded-[40px] border border-slate-200 dark:border-slate-800 shadow-2xl overflow-hidden animate-in zoom-in-95 duration-300 max-w-7xl w-full mx-auto flex flex-col h-[92vh]">

      {/* HEADER */}
      <div className="px-10 py-6 border-b border-slate-100 dark:border-slate-800 flex justify-between items-center bg-slate-50/50 dark:bg-slate-800/50">
        <div className="flex items-center gap-6">
          <div className="w-14 h-14 bg-indigo-600 rounded-[20px] flex items-center justify-center text-white shadow-xl shadow-indigo-100 dark:shadow-none">
            <Plus size={28} strokeWidth={3} />
          </div>
          <div>
            <div className="flex items-center gap-3">
              <h2 className="text-2xl font-black text-slate-900 dark:text-slate-100 tracking-tight">
                {isEditing ? 'Chỉnh sửa hợp đồng' : isCloning ? 'Nhân bản hợp đồng' : 'Khai báo hồ sơ hợp đồng'}
              </h2>
              <div className="flex items-center gap-1.5 px-3 py-1 bg-indigo-100 dark:bg-indigo-900/40 text-indigo-700 dark:text-indigo-300 text-[10px] font-black rounded-lg uppercase tracking-wider">
                <Hash size={10} /> {formContractId}
              </div>
            </div>
            <p className="text-[11px] font-bold text-slate-400 uppercase tracking-widest mt-1">Nghiệp vụ Quản trị & Theo dõi KPI mục tiêu</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          {!isEditing && (
            <button
              onClick={() => {
                // Auto-fill logic
                if (units.length > 0) setUnitId(units[0].id);
                if (customers.length > 0) {
                  setCustomerId(customers[0].id);
                  setClientName(customers[0].name);
                }
                if (salespeople.length > 0) setSalespersonId(salespeople[0].id);

                setTitle('Hợp đồng Tư vấn Giải pháp chuyển đổi số BIM');
                setTitle('Hợp đồng Tư vấn Giải pháp chuyển đổi số BIM');
                // setManualValue(150000000); // Removed
                setLineItems([
                  { id: 'sample-1', name: 'Tư vấn BIM Setup', quantity: 1, supplier: '', inputPrice: 0, outputPrice: 50000000, directCosts: 0 },
                  { id: 'sample-2', name: 'Đào tạo Revit Arch', quantity: 2, supplier: 'CTV_ABC', inputPrice: 5000000, outputPrice: 15000000, directCosts: 10000000, directCostDetails: [{ id: 'd1', name: 'Thuê giảng viên', amount: 10000000 }] }
                ]);
                setAdminCosts({
                  transferFee: 50000, contractorTax: 0, importFee: 0, expertHiring: 2000000, documentProcessing: 100000
                });
                setPaymentSchedules([
                  { id: 'p1', date: new Date().toISOString().split('T')[0], amount: 50000000, description: 'Tạm ứng 30%', type: 'Revenue', status: 'Pending' },
                  { id: 'p2', date: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0], amount: 100000000, description: 'Nghiệm thu', type: 'Revenue', status: 'Pending' }
                ]);
              }}
              className="p-3 bg-purple-100 hover:bg-purple-200 text-purple-700 rounded-2xl font-bold text-xs uppercase transition-all flex items-center gap-2"
              title="Điền dữ liệu mẫu"
            >
              <Users size={16} /> Data Mẫu
            </button>
          )}
          <button onClick={onCancel} className="p-3 hover:bg-rose-50 dark:hover:bg-rose-900/20 rounded-2xl text-slate-400 hover:text-rose-500 transition-all">
            <X size={24} />
          </button>
        </div>
      </div>

      {/* STEPPER PROGRESS */}
      <div className="px-10 py-4 bg-white dark:bg-slate-900 border-b border-slate-100 dark:border-slate-800">
        <div className="flex items-center justify-between max-w-3xl mx-auto relative">
          {/* Progress Bar Background */}
          <div className="absolute top-1/2 left-0 w-full h-1 bg-slate-100 dark:bg-slate-800 -z-0 rounded-full"></div>
          {/* Active Progress */}
          <div
            className="absolute top-1/2 left-0 h-1 bg-indigo-600 transition-all duration-300 -z-0 rounded-full"
            style={{ width: `${((currentStep - 1) / 2) * 100}%` }}
          ></div>

          {/* Steps */}
          {[1, 2, 3].map((step) => {
            const isActive = currentStep >= step;
            const isCurrent = currentStep === step;
            return (
              <div key={step} className="relative z-10 flex flex-col items-center gap-2">
                <div
                  className={`w-10 h-10 rounded-full flex items-center justify-center font-black border-4 transition-all duration-300
                    ${isActive
                      ? 'bg-indigo-600 border-indigo-100 dark:border-indigo-900 text-white'
                      : 'bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700 text-slate-400'
                    }
                    ${isCurrent ? 'scale-110 shadow-lg shadow-indigo-200 dark:shadow-none ring-2 ring-indigo-500 ring-offset-2 dark:ring-offset-slate-900' : ''}
                  `}
                >
                  {step}
                </div>
                <span className={`text-[10px] font-bold uppercase tracking-wider transition-colors duration-300 ${isActive ? 'text-indigo-700 dark:text-indigo-400' : 'text-slate-400'}`}>
                  {step === 1 ? 'Thông tin chung' : step === 2 ? 'Kinh doanh & Chi phí' : 'Tài chính & Hoàn tất'}
                </span>
              </div>
            );
          })}
        </div>
      </div>

      {/* FINANCIAL SUMMARY (Only show in Step 2 & 3) */}
      {currentStep > 1 && (
        <div className="px-10 pt-8 pb-4 shrink-0 z-10 bg-white dark:bg-slate-900 animate-in fade-in slide-in-from-top-4 duration-500">
          <section className="bg-gradient-to-r from-slate-900 via-indigo-950 to-slate-900 rounded-[32px] p-8 text-white shadow-2xl relative overflow-hidden">
            <div className="absolute top-0 right-0 p-8 opacity-10">
              <TrendingUp size={120} />
            </div>

            <div className="flex flex-col md:flex-row items-center justify-between gap-8 relative z-10">
              {/* Header Vertical */}
              <div className="flex items-center gap-4 border-r border-white/10 pr-8 min-w-[200px]">
                <div className="p-3 bg-indigo-500/20 rounded-2xl">
                  <ShieldCheck size={32} className="text-indigo-400" />
                </div>
                <div>
                  <h3 className="text-xs font-black text-indigo-400 uppercase tracking-widest mb-1">Báo cáo</h3>
                  <p className="text-lg font-black text-white">Lợi nhuận dự kiến</p>
                </div>
              </div>

              {/* Stats Grid */}
              <div className="flex-1 grid grid-cols-1 md:grid-cols-4 gap-4">
                {/* Total Value */}
                <div>
                  <p className="text-[10px] font-bold text-slate-400 uppercase tracking-tighter mb-1">Giá trị Ký kết (Tổng đầu ra)</p>
                  <p className="text-lg font-black text-white leading-none truncate" title={formatVND(totals.signingValue)}>{formatVND(totals.signingValue)} <span className="text-xs font-medium text-slate-500">đ</span></p>
                </div>

                {/* Revenue */}
                <div>
                  <p className="text-[10px] font-bold text-slate-400 uppercase tracking-tighter mb-1">Doanh thu dự kiến (Trừ VAT)</p>
                  <p className="text-lg font-black text-slate-200 truncate" title={formatVND(totals.estimatedRevenue)}>{formatVND(totals.estimatedRevenue)}</p>
                </div>

                {/* Costs */}
                <div>
                  <p className="text-[10px] font-bold text-rose-400/80 uppercase tracking-tighter mb-1">Tổng chi phí & Giá vốn</p>
                  <p className="text-lg font-black text-rose-400 truncate" title={formatVND(totals.totalCosts)}>{formatVND(totals.totalCosts)}</p>
                </div>

                {/* Profit */}
                <div className="relative group cursor-help">
                  <p className="text-[10px] font-black text-emerald-400 uppercase tracking-widest mb-1">Lợi nhuận gộp</p>
                  <div className="flex items-end gap-2">
                    <p className="text-lg font-black text-emerald-400 leading-none truncate" title={formatVND(totals.grossProfit)}>{formatVND(totals.grossProfit)}</p>
                    <span className="text-xs font-bold text-emerald-600 mb-0.5">({totals.profitMargin.toFixed(0)}%)</span>
                  </div>
                  <div className="absolute -bottom-2 left-0 w-full h-1 bg-white/10 rounded-full overflow-hidden mt-2">
                    <div className="h-full bg-emerald-500 rounded-full" style={{ width: `${Math.min(100, totals.profitMargin)}%` }}></div>
                  </div>
                </div>
              </div>
            </div>
          </section>
        </div>
      )}

      {/* BODY */}
      <div className="flex-1 overflow-y-auto px-10 pb-10 pt-2 custom-scrollbar space-y-8 scroll-smooth">

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-12">

          {/* MAIN CONTENT (Now Full Width) */}
          <div className="col-span-12 space-y-12">

            {/* 1. ĐƠN VỊ & NHÂN SỰ */}
            {currentStep === 1 && (
              <section className="space-y-6 animate-in slide-in-from-right-8 duration-500">
                <div className="flex items-center gap-3 border-l-4 border-indigo-600 pl-4">
                  <h3 className="text-sm font-black text-slate-800 dark:text-slate-200 uppercase tracking-widest flex items-center gap-2">
                    <UserCheck size={16} /> Đơn vị & Nhân sự thực hiện
                  </h3>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-2">
                    <label className="text-[11px] font-bold text-slate-500 uppercase ml-1 flex items-center gap-1">
                      <MapPin size={10} /> Đơn vị thực hiện (Trung tâm/Chi nhánh)
                    </label>
                    <select
                      value={unitId}
                      onChange={(e) => { setUnitId(e.target.value); setSalespersonId(''); }}
                      className="w-full px-5 py-3 bg-slate-50 dark:bg-slate-800 border-2 border-slate-100 dark:border-slate-700 rounded-2xl text-sm font-bold outline-none focus:border-indigo-500 transition-all"
                    >
                      <option value="">-- Chọn đơn vị --</option>
                      {units.filter(u => u.id !== 'all').map(u => <option key={u.id} value={u.id}>{u.name}</option>)}
                    </select>
                  </div>

                  {/* Coordinating Unit */}
                  <div className="space-y-2">
                    <label className="text-[11px] font-bold text-slate-500 uppercase ml-1 flex items-center gap-1">
                      <Users size={10} /> Đơn vị phối hợp
                    </label>
                    <select
                      value={coordinatingUnitId}
                      onChange={(e) => setCoordinatingUnitId(e.target.value)}
                      className="w-full px-5 py-3 bg-slate-50 dark:bg-slate-800 border-2 border-slate-100 dark:border-slate-700 rounded-2xl text-sm font-bold outline-none focus:border-indigo-500 transition-all"
                    >
                      <option value="">-- Chọn đơn vị phối hợp (nếu có) --</option>
                      {units.filter(u => u.id !== 'all' && u.id !== unitId).map(u => <option key={u.id} value={u.id}>{u.name}</option>)}
                    </select>
                  </div>

                  <div className="space-y-2 md:col-span-2">
                    <label className="text-[11px] font-bold text-slate-500 uppercase ml-1 flex items-center gap-1">
                      <User size={10} /> Sale thực hiện (Chịu trách nhiệm KPI)
                    </label>
                    <select
                      value={salespersonId}
                      onChange={(e) => setSalespersonId(e.target.value)}
                      className="w-full px-5 py-3 bg-indigo-50 dark:bg-indigo-900/20 border-2 border-indigo-100 dark:border-indigo-800 rounded-2xl text-sm font-bold text-indigo-700 dark:text-indigo-300 outline-none"
                    >
                      <option value="" className="text-slate-800 dark:text-slate-200 bg-white dark:bg-slate-900">-- Chọn nhân viên phụ trách --</option>
                      {filteredSales.map(s => <option key={s.id} value={s.id} className="text-slate-800 dark:text-slate-200 bg-white dark:bg-slate-900">{s.name}</option>)}
                    </select>
                  </div>
                </div>
              </section>

            )}

            {/* 2. THÔNG TIN KHÁCH HÀNG & NỘI DUNG (Part of Step 1) */}
            {currentStep === 1 && (
              <section className="space-y-6 animate-in slide-in-from-right-8 duration-500 delay-100">
                <div className="flex items-center gap-3 border-l-4 border-slate-600 pl-4">
                  <h3 className="text-sm font-black text-slate-800 dark:text-slate-200 uppercase tracking-widest flex items-center gap-2">
                    <Building2 size={16} /> Thông tin Khách hàng & Nội dung
                  </h3>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-2">
                    <label className="text-[11px] font-bold text-slate-500 uppercase ml-1">Số hợp đồng (ID)</label>
                    <input
                      value={formContractId}
                      onChange={(e) => {
                        setFormContractId(e.target.value);
                        setIsIdTouched(true);
                      }}
                      placeholder="Nhập số hợp đồng..."
                      className="w-full px-5 py-3 bg-slate-50 dark:bg-slate-800 border-2 border-slate-100 dark:border-slate-700 rounded-2xl text-sm font-bold focus:border-indigo-500 outline-none"
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="text-[11px] font-bold text-slate-500 uppercase ml-1">Tên khách hàng</label>
                    <select
                      value={customerId || ''}
                      onChange={(e) => {
                        const cId = e.target.value;
                        setCustomerId(cId || null);
                        const cust = customers.find(c => c.id === cId);
                        if (cust) {
                          setClientName(cust.name);
                        } else {
                          setClientName('');
                        }
                      }}
                      className="w-full px-5 py-3 bg-slate-50 dark:bg-slate-800 border-2 border-slate-100 dark:border-slate-700 rounded-2xl text-sm font-bold focus:border-indigo-500 outline-none"
                    >
                      <option value="">-- Chọn khách hàng --</option>
                      {customers
                        .filter(c => !c.type || c.type === 'Customer' || c.type === 'Both')
                        .map(c => (
                          <option key={c.id} value={c.id}>{c.name}</option>
                        ))}
                    </select>
                  </div>
                  <div className="space-y-2">
                    <label className="text-[11px] font-bold text-slate-500 uppercase ml-1">Ngày ký kết</label>
                    <input
                      type="date"
                      value={signedDate}
                      onChange={(e) => setSignedDate(e.target.value)}
                      className="w-full px-5 py-3 bg-slate-50 dark:bg-slate-800 border-2 border-slate-100 dark:border-slate-700 rounded-2xl text-sm font-bold focus:border-indigo-500 outline-none"
                    />
                  </div>
                </div>


                {/* Removed Manual Value Input per request */}


                <div className="space-y-2">
                  <label className="text-[11px] font-bold text-slate-500 uppercase ml-1">Nội dung hợp đồng</label>
                  <textarea
                    placeholder="VD: Tư vấn giải pháp BIM, Đào tạo chuyên sâu phần mềm Plaxis 3D..."
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                    className="w-full px-5 py-3 bg-slate-50 dark:bg-slate-800 border-2 border-slate-100 dark:border-slate-700 rounded-2xl text-sm font-bold focus:border-indigo-500 outline-none h-20"
                  ></textarea>
                </div>

                {/* Multi-contact List */}
                <div className="space-y-4">
                  <div className="flex justify-between items-center">
                    <label className="text-[11px] font-black text-slate-400 uppercase tracking-widest">Đầu mối liên hệ phía khách hàng</label>
                    <button onClick={addContact} className="flex items-center gap-1 text-indigo-600 font-black text-[10px] uppercase">
                      <Plus size={12} /> Thêm đầu mối
                    </button>
                  </div>
                  <div className="space-y-3">
                    {contacts.map((contact, index) => (
                      <div key={contact.id} className="grid grid-cols-12 gap-3 items-center animate-in slide-in-from-left-2 duration-300">
                        <div className="col-span-5">
                          <input placeholder="Họ tên..." className="w-full px-4 py-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-100 dark:border-slate-700 rounded-xl text-xs font-bold" />
                        </div>
                        <div className="col-span-6">
                          <input placeholder="Vai trò (Mua sắm, Kế toán, Kỹ thuật...)" className="w-full px-4 py-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-100 dark:border-slate-700 rounded-xl text-xs font-bold" />
                        </div>
                        <div className="col-span-1 text-center">
                          {contacts.length > 1 && (
                            <button onClick={() => removeContact(contact.id)} className="text-slate-300 hover:text-rose-500 transition-colors">
                              <Trash2 size={16} />
                            </button>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </section>

            )}

            {/* 3. PHƯƠNG ÁN KINH DOANH */}
            {currentStep === 2 && (
              <section className="space-y-8 animate-in slide-in-from-right-8 duration-500">
                <div className="flex items-center gap-3 border-l-4 border-indigo-500 pl-4">
                  <h3 className="text-sm font-black text-slate-800 dark:text-slate-200 uppercase tracking-widest flex items-center gap-2">
                    <Briefcase size={16} /> Phương án kinh doanh
                  </h3>
                </div>

                <div className="pl-4 border-l border-slate-200 dark:border-slate-800 space-y-8">
                  {/* 3.1 CHI TIẾT SẢN PHẨM & DỊCH VỤ CUNG CẤP */}
                  <div className="space-y-6">
                    <div className="flex items-center justify-between">
                      <h4 className="text-xs font-black text-slate-600 dark:text-slate-400 uppercase tracking-widest flex items-center gap-2">
                        <Package size={14} /> Chi tiết Sản phẩm & Dịch vụ
                      </h4>
                      <button onClick={addLineItem} className="px-3 py-1.5 bg-emerald-50 dark:bg-emerald-900/30 text-emerald-600 dark:text-emerald-400 rounded-lg text-[10px] font-black uppercase flex items-center gap-2 border border-emerald-100 dark:border-emerald-800 hover:bg-emerald-100 transition-colors">
                        <Plus size={12} /> Thêm hạng mục
                      </button>
                    </div>

                    <div className="overflow-x-auto rounded-3xl border border-slate-100 dark:border-slate-800 shadow-sm">
                      <table className="w-full text-left text-xs min-w-[1200px]">
                        <thead className="bg-slate-50 dark:bg-slate-800/50">
                          <tr>
                            <th className="px-4 py-4 font-black text-slate-400 uppercase tracking-tighter">Sản phẩm/Dịch vụ</th>
                            <th className="px-2 py-4 font-black text-slate-400 uppercase tracking-tighter w-16">SL</th>
                            <th className="px-4 py-4 font-black text-slate-400 uppercase tracking-tighter">Nhà cung cấp</th>
                            <th className="px-4 py-4 font-black text-slate-400 uppercase tracking-tighter text-right">Giá Đầu vào</th>
                            <th className="px-4 py-4 font-black text-slate-400 uppercase tracking-tighter text-right">Giá Đầu ra</th>
                            <th className="px-4 py-4 font-black text-slate-400 uppercase tracking-tighter text-right">CP Trực tiếp</th>
                            <th className="px-4 py-4 font-black text-slate-400 uppercase tracking-tighter text-right">Chênh lệch</th>
                            <th className="px-4 py-4 w-10"></th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-50 dark:divide-slate-800">
                          {lineItems.map((item, index) => {
                            const inputTotal = item.quantity * item.inputPrice;
                            const outputTotal = item.quantity * item.outputPrice;
                            const lineMargin = outputTotal - inputTotal - item.directCosts;
                            const lineMarginRate = outputTotal > 0 ? (lineMargin / outputTotal) * 100 : 0;

                            return (
                              <tr key={item.id} className="group hover:bg-slate-50 dark:hover:bg-slate-800/30 transition-colors">
                                <td className="px-4 py-3">
                                  <select
                                    value={products.find(p => p.name === item.name)?.id || ''}
                                    onChange={(e) => {
                                      const pId = e.target.value;
                                      const prod = products.find(p => p.id === pId);
                                      const newList = [...lineItems];
                                      if (prod) {
                                        newList[index].name = prod.name;
                                        newList[index].inputPrice = prod.costPrice || 0;
                                        newList[index].outputPrice = prod.basePrice;
                                      } else {
                                        newList[index].name = '';
                                      }
                                      setLineItems(newList);
                                    }}
                                    className="w-full bg-transparent font-black text-slate-700 dark:text-slate-200 outline-none"
                                  >
                                    <option value="">-- Chọn SP --</option>
                                    {products.map(p => (
                                      <option key={p.id} value={p.id}>{p.name}</option>
                                    ))}
                                  </select>
                                </td>
                                <td className="px-2 py-3">
                                  <input
                                    type="number"
                                    value={item.quantity}
                                    onChange={(e) => {
                                      const newList = [...lineItems];
                                      newList[index].quantity = Number(e.target.value);
                                      setLineItems(newList);
                                    }}
                                    className="w-full bg-transparent font-black outline-none"
                                  />
                                </td>
                                <td className="px-4 py-3">
                                  <select
                                    value={item.supplier}
                                    onChange={(e) => {
                                      const newList = [...lineItems];
                                      newList[index].supplier = e.target.value;
                                      setLineItems(newList);
                                    }}
                                    className="w-full bg-transparent font-medium text-slate-500 outline-none"
                                  >
                                    <option value="">-- Chọn NCC --</option>
                                    {customers.filter(c => c.type === 'Supplier' || c.type === 'Both').map(s => (
                                      <option key={s.id} value={s.shortName}>{s.shortName}</option>
                                    ))}
                                  </select>
                                </td>
                                <td className="px-4 py-3 text-right">
                                  <input
                                    type="text"
                                    value={item.inputPrice ? formatVND(item.inputPrice) : '0'}
                                    onChange={(e) => {
                                      const raw = e.target.value.replace(/\./g, '');
                                      if (!/^\d*$/.test(raw)) return;
                                      const newList = [...lineItems];
                                      newList[index].inputPrice = Number(raw);
                                      setLineItems(newList);
                                    }}
                                    className="w-full bg-transparent font-bold text-slate-500 text-right outline-none"
                                  />
                                </td>
                                <td className="px-4 py-3 text-right">
                                  <input
                                    type="text"
                                    value={item.outputPrice ? formatVND(item.outputPrice) : '0'}
                                    onChange={(e) => {
                                      const raw = e.target.value.replace(/\./g, '');
                                      if (!/^\d*$/.test(raw)) return;
                                      const newList = [...lineItems];
                                      newList[index].outputPrice = Number(raw);
                                      setLineItems(newList);
                                    }}
                                    className="w-full bg-transparent font-bold text-indigo-600 text-right outline-none"
                                  />
                                </td>
                                <td className="px-4 py-3 text-right">
                                  <div className="relative group">
                                    <input
                                      type="text"
                                      readOnly
                                      onClick={() => openCostModal(index)}
                                      value={item.directCosts ? formatVND(item.directCosts) : '0'}
                                      className="w-full bg-transparent font-bold text-rose-500 text-right outline-none cursor-pointer hover:bg-slate-100 dark:hover:bg-slate-800 rounded px-1"
                                    />
                                    {/* Hover Tooltip */}
                                    {item.directCostDetails && item.directCostDetails.length > 0 && (
                                      <div className="absolute top-full right-0 mt-2 w-64 p-3 bg-slate-900 text-white text-[10px] rounded-xl shadow-xl z-50 opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none">
                                        <div className="space-y-1">
                                          {item.directCostDetails.map((detail, i) => (
                                            <div key={i} className="flex justify-between items-center border-b border-slate-700 pb-1 last:border-0 last:pb-0">
                                              <span className="font-medium">{detail.name}</span>
                                              <span className="font-bold">{formatVND(detail.amount)}</span>
                                            </div>
                                          ))}
                                          <div className="pt-2 mt-1 border-t border-slate-700 flex justify-between">
                                            <span className="font-bold uppercase opacity-70">Tổng</span>
                                            <span className="font-black text-emerald-400">{formatVND(item.directCosts)}</span>
                                          </div>
                                        </div>
                                      </div>
                                    )}
                                  </div>
                                </td>
                                <td className="px-4 py-3 text-right">
                                  <div className="flex flex-col items-end">
                                    <span className={`font-black ${lineMargin >= 0 ? 'text-emerald-600' : 'text-rose-600'}`}>{formatVND(lineMargin)}</span>
                                    <span className="text-[9px] font-bold text-slate-400">{lineMarginRate.toFixed(1)}%</span>
                                  </div>
                                </td>
                                <td className="px-4 py-3 text-center">
                                  {lineItems.length > 1 && (
                                    <button onClick={() => removeLineItem(item.id)} className="text-slate-300 hover:text-rose-500 transition-colors">
                                      <Trash2 size={14} />
                                    </button>
                                  )}
                                </td>
                              </tr>
                            );
                          })}
                        </tbody>
                        {/* TOTALS FOOTER */}
                        <tfoot className="bg-slate-100 dark:bg-slate-800/80 font-black text-slate-700 dark:text-slate-200 border-t-2 border-slate-200 dark:border-slate-700">
                          <tr>
                            <td colSpan={3} className="px-4 py-4 text-left uppercase text-xs tracking-widest text-slate-500">
                              Tổng cộng
                            </td>
                            <td className="px-4 py-4 text-right text-slate-600 dark:text-slate-400">
                              {formatVND(totals.totalInput)}
                            </td>
                            <td className="px-4 py-4 text-right text-indigo-600">
                              {formatVND(totals.signingValue)}
                            </td>
                            <td className="px-4 py-4 text-right text-rose-500">
                              {formatVND(totals.totalDirectCosts)}
                            </td>
                            <td className="px-4 py-4 text-right">
                              <span className={totals.signingValue - totals.totalInput - totals.totalDirectCosts >= 0 ? 'text-emerald-600' : 'text-rose-600'}>
                                {formatVND(totals.signingValue - totals.totalInput - totals.totalDirectCosts)}
                              </span>
                            </td>
                            <td className="px-4 py-4"></td>
                          </tr>
                        </tfoot>
                      </table>
                    </div>
                  </div>


                  {/* 3.2 CHI PHÍ QUẢN LÝ HỢP ĐỒNG (Moved inside Step 2) */}
                  <div className="bg-slate-50 dark:bg-slate-800/40 p-6 rounded-[24px] border border-slate-100 dark:border-slate-800 space-y-6">
                    <h4 className="text-xs font-black text-slate-600 dark:text-slate-400 uppercase tracking-widest flex items-center gap-2">
                      <Calculator size={14} /> Chi phí quản lý hợp đồng
                    </h4>
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-6">
                      {[
                        { key: 'transferFee', label: 'Phí chuyển tiền / Ngân hàng' },
                        { key: 'contractorTax', label: 'Thuế nhà thầu (nếu có)' },
                        { key: 'importFee', label: 'Phí nhập khẩu / Logistics' },
                        { key: 'expertHiring', label: 'Chi phí thuê khoán chuyên môn' },
                        { key: 'documentProcessing', label: 'Chi phí xử lý chứng từ' }
                      ].map((cost) => (
                        <div key={cost.key} className="space-y-1.5">
                          <label className="text-[10px] font-bold text-slate-400 uppercase ml-1">{cost.label}</label>
                          <div className="grid grid-cols-12 gap-2">
                            <div className="col-span-4 relative group">
                              <div className="absolute inset-y-0 left-0 flex items-center pl-2 pointer-events-none">
                                <Percent size={10} className="text-slate-400" />
                              </div>
                              <input
                                type="number"
                                placeholder="%"
                                value={(adminCostPercentages as any)[cost.key] || ''}
                                onChange={(e) => {
                                  const pct = Number(e.target.value);
                                  setAdminCostPercentages({ ...adminCostPercentages, [cost.key]: pct });
                                  // Auto-calc amount based on Signing Value (Total Output)
                                  const amount = Math.round((pct / 100) * totals.signingValue);
                                  setAdminCosts({ ...adminCosts, [cost.key]: amount });
                                }}
                                className="w-full pl-6 pr-1 py-2 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl text-xs font-bold focus:ring-2 focus:ring-indigo-500 outline-none text-center"
                              />
                            </div>
                            <div className="col-span-8 relative">
                              <DollarSign className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-300" size={12} />
                              <input
                                type="text"
                                value={(adminCosts as any)[cost.key] ? formatVND((adminCosts as any)[cost.key]) : '0'}
                                onChange={(e) => {
                                  const raw = e.target.value.replace(/\./g, '');
                                  if (!/^\d*$/.test(raw)) return;
                                  const val = Number(raw);
                                  setAdminCosts({ ...adminCosts, [cost.key]: val });

                                  // Reverse calc percentage
                                  if (totals.signingValue > 0) {
                                    const pct = (val / totals.signingValue) * 100;
                                    setAdminCostPercentages({ ...adminCostPercentages, [cost.key]: Number(pct.toFixed(2)) });
                                  }
                                }}
                                className="w-full pl-8 pr-4 py-2 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl text-xs font-black focus:ring-2 focus:ring-rose-500 outline-none transition-all text-right"
                              />
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              </section >
            )}

            {/* 4. Financial Schedules (Hóa đơn & Tiền về & Chi trả NCC) */}
            {
              currentStep === 3 && (
                <section className="space-y-6 animate-in slide-in-from-right-8 duration-500">
                  <div className="flex items-center gap-3 border-l-4 border-amber-500 pl-4">
                    <h3 className="text-sm font-black text-slate-800 dark:text-slate-200 uppercase tracking-widest flex items-center gap-2">
                      <Wallet size={16} /> Kế hoạch Doanh thu & Tiền về
                    </h3>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                    {/* Revenue Schedules */}
                    <div className="space-y-4">
                      <div className="flex justify-between items-center">
                        <p className="text-[11px] font-black text-slate-400 uppercase tracking-widest">Lịch xuất hóa đơn doanh thu</p>
                        <button onClick={() => setRevenueSchedules([...revenueSchedules, { id: Date.now().toString(), date: '', amount: 0, description: 'Đợt mới' }])} className="text-indigo-600 font-bold text-[10px]">+ Thêm đợt</button>
                      </div>
                      <div className="space-y-3">
                        {revenueSchedules.map((rev, idx) => (
                          <div key={rev.id} className="grid grid-cols-12 gap-2 bg-slate-50 dark:bg-slate-800/50 p-3 rounded-2xl border border-slate-100 dark:border-slate-800">
                            <div className="col-span-4 space-y-1">
                              <label className="text-[9px] text-slate-400 font-bold uppercase">Ngày XHĐ</label>
                              <input
                                type="date"
                                value={rev.date}
                                onChange={(e) => {
                                  const newSched = [...revenueSchedules];
                                  newSched[idx].date = e.target.value;
                                  setRevenueSchedules(newSched);
                                }}
                                className="w-full bg-transparent text-[11px] font-bold outline-none"
                              />
                            </div>
                            <div className="col-span-4 space-y-1">
                              <label className="text-[9px] text-slate-400 font-bold uppercase">Giai đoạn</label>
                              <input
                                placeholder="Giai đoạn..."
                                value={rev.description}
                                onChange={(e) => {
                                  const newSched = [...revenueSchedules];
                                  newSched[idx].description = e.target.value;
                                  setRevenueSchedules(newSched);
                                }}
                                className="w-full bg-transparent text-[11px] font-bold outline-none"
                              />
                            </div>
                            <div className="col-span-4 space-y-1 text-right">
                              <label className="text-[9px] text-slate-400 font-bold uppercase">Tiền (VAT)</label>
                              <div className="flex items-center justify-end gap-2">
                                <input
                                  type="number"
                                  placeholder="Tiền..."
                                  value={rev.amount}
                                  onChange={(e) => {
                                    const newSched = [...revenueSchedules];
                                    newSched[idx].amount = Number(e.target.value);
                                    setRevenueSchedules(newSched);
                                  }}
                                  className="w-full bg-transparent text-[11px] font-black text-right outline-none"
                                />
                                {revenueSchedules.length > 1 && (
                                  <button onClick={() => setRevenueSchedules(revenueSchedules.filter(r => r.id !== rev.id))} className="text-slate-300 hover:text-rose-500 opacity-0 group-hover:opacity-100 transition-opacity">
                                    <X size={12} />
                                  </button>
                                )}
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>

                    {/* Payment Schedules (Incoming) */}
                    <div className="space-y-4">
                      <div className="flex justify-between items-center">
                        <p className="text-[11px] font-black text-emerald-600 uppercase tracking-widest">Kế hoạch Tiền về (Từ Khách hàng)</p>
                        <button onClick={() => setPaymentSchedules([...paymentSchedules, { id: Date.now().toString(), date: '', amount: 0, description: '', status: 'Pending', percentage: 0, type: 'Revenue' }])} className="text-emerald-600 font-bold text-[10px]">+ Thêm đợt</button>
                      </div>
                      <div className="space-y-3">
                        {paymentSchedules.map((pay, idx) => (
                          <div key={pay.id} className="grid grid-cols-12 gap-2 bg-emerald-50/50 dark:bg-emerald-900/20 p-3 rounded-2xl border border-emerald-100 dark:border-emerald-800">
                            <div className="col-span-4 space-y-1">
                              <label className="text-[9px] text-slate-400 font-bold uppercase">Ngày thanh toán</label>
                              <input
                                type="date"
                                value={pay.date}
                                onChange={(e) => {
                                  const newSched = [...paymentSchedules];
                                  newSched[idx].date = e.target.value;
                                  setPaymentSchedules(newSched);
                                }}
                                className="w-full bg-transparent text-[11px] font-bold outline-none"
                              />
                            </div>
                            <div className="col-span-4 space-y-1">
                              <label className="text-[9px] text-slate-400 font-bold uppercase">Nội dung</label>
                              <input
                                placeholder="Nội dung..."
                                value={pay.description}
                                onChange={(e) => {
                                  const newSched = [...paymentSchedules];
                                  newSched[idx].description = e.target.value;
                                  setPaymentSchedules(newSched);
                                }}
                                className="w-full bg-transparent text-[11px] font-bold outline-none"
                              />
                            </div>
                            <div className="col-span-4 space-y-1 text-right">
                              <label className="text-[9px] text-slate-400 font-bold uppercase">Số tiền</label>
                              <div className="flex items-center justify-end gap-2">
                                <input
                                  type="number"
                                  placeholder="Tiền..."
                                  value={pay.amount}
                                  onChange={(e) => {
                                    const newSched = [...paymentSchedules];
                                    newSched[idx].amount = Number(e.target.value);
                                    setPaymentSchedules(newSched);
                                  }}
                                  className="w-full bg-transparent text-[11px] font-black text-right outline-none text-emerald-600"
                                />
                                {paymentSchedules.length > 1 && (
                                  <button onClick={() => setPaymentSchedules(paymentSchedules.filter(p => p.id !== pay.id))} className="text-emerald-400 hover:text-emerald-600 opacity-0 group-hover:opacity-100 transition-opacity">
                                    <X size={12} />
                                  </button>
                                )}
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>

                  <div className="border-t border-slate-100 dark:border-slate-800 pt-6">
                    <div className="flex justify-between items-center mb-4">
                      <p className="text-[11px] font-black text-rose-600 uppercase tracking-widest">Kế hoạch Chi trả Nhà cung cấp</p>
                      <div className="flex items-center gap-3">
                        <button
                          onClick={generateSupplierSchedules}
                          className="px-3 py-1.5 bg-indigo-50 dark:bg-indigo-900/30 text-indigo-600 dark:text-indigo-400 rounded-lg text-[10px] font-bold flex items-center gap-1.5 hover:bg-indigo-100 transition-colors"
                        >
                          <Calculator size={10} /> Tự động tính từ SP
                        </button>
                      </div>
                      <button onClick={() => setSupplierSchedules([...supplierSchedules, { id: Date.now().toString(), date: '', amount: 0, description: '', status: 'Pending', percentage: 0, type: 'Expense' }])} className="text-rose-600 font-bold text-[10px]">+ Thêm đợt chi</button>
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      {supplierSchedules.map((pay, idx) => (
                        <div key={pay.id} className="grid grid-cols-12 gap-2 bg-rose-50/50 dark:bg-rose-900/10 p-3 rounded-2xl border border-rose-100 dark:border-rose-800">
                          <div className="col-span-4 space-y-1">
                            <label className="text-[9px] text-slate-400 font-bold uppercase">Hạn thanh toán</label>
                            <input
                              type="date"
                              value={pay.date}
                              onChange={(e) => {
                                const newSched = [...supplierSchedules];
                                newSched[idx].date = e.target.value;
                                setSupplierSchedules(newSched);
                              }}
                              className="w-full bg-transparent text-[11px] font-bold outline-none"
                            />
                          </div>
                          <div className="col-span-4 space-y-1">
                            <label className="text-[9px] text-slate-400 font-bold uppercase">Nhà cung cấp / Nội dung</label>
                            <input
                              placeholder="Chi cho..."
                              value={pay.description}
                              onChange={(e) => {
                                const newSched = [...supplierSchedules];
                                newSched[idx].description = e.target.value;
                                setSupplierSchedules(newSched);
                              }}
                              className="w-full bg-transparent text-[11px] font-bold outline-none"
                            />
                          </div>
                          <div className="col-span-4 space-y-1 text-right">
                            <label className="text-[9px] text-slate-400 font-bold uppercase">Số tiền chi</label>
                            <div className="flex items-center justify-end gap-2">
                              <input
                                type="number"
                                placeholder="Tiền..."
                                value={pay.amount}
                                onChange={(e) => {
                                  const newSched = [...supplierSchedules];
                                  newSched[idx].amount = Number(e.target.value);
                                  setSupplierSchedules(newSched);
                                }}
                                className="w-full bg-transparent text-[11px] font-black text-right outline-none text-rose-500"
                              />
                              <button onClick={() => setSupplierSchedules(supplierSchedules.filter(p => p.id !== pay.id))} className="text-rose-400 hover:text-rose-600 opacity-0 group-hover:opacity-100 transition-opacity">
                                <X size={12} />
                              </button>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                </section >
              )
            }
          </div >
        </div >
      </div >

      {/* Direct Costs Modal */}
      < Modal
        isOpen={activeCostModalIndex !== null}
        onClose={() => setActiveCostModalIndex(null)}
        title="Chi tiết Chi phí Trực tiếp"
        size="lg"
      >
        <div className="space-y-4">
          <div className="bg-slate-50 dark:bg-slate-800 p-4 rounded-xl border border-slate-100 dark:border-slate-700">
            <h4 className="text-sm font-bold text-indigo-600 mb-2">
              {activeCostModalIndex !== null && lineItems[activeCostModalIndex]?.name
                ? `Sản phẩm: ${lineItems[activeCostModalIndex].name}`
                : 'Chi tiết chi phí'}
            </h4>
            <p className="text-xs text-slate-500">Thêm các khoản chi phí trực tiếp liên quan đến sản phẩm/dịch vụ này.</p>
          </div>

          <div className="space-y-3 max-h-[400px] overflow-y-auto pr-2">
            {tempCostDetails.map((detail, index) => (
              <div key={index} className="flex items-center gap-3 bg-white dark:bg-slate-900 p-2 rounded-lg border border-slate-200 dark:border-slate-700 shadow-sm">
                <input
                  type="text"
                  placeholder="Tên chi phí (VD: Tiếp khách, Vận chuyển...)"
                  value={detail.name}
                  onChange={(e) => {
                    const newDetails = [...tempCostDetails];
                    newDetails[index].name = e.target.value;
                    setTempCostDetails(newDetails);
                  }}
                  className="flex-1 bg-transparent px-3 py-2 text-sm font-medium outline-none border-b border-transparent focus:border-indigo-500 transition-colors"
                  autoFocus
                />
                <div className="w-32 relative">
                  <span className="absolute left-2 top-1/2 -translate-y-1/2 text-xs text-slate-400">₫</span>
                  <input
                    type="text"
                    value={detail.amount ? formatVND(detail.amount) : '0'}
                    onChange={(e) => {
                      const raw = e.target.value.replace(/\./g, '');
                      if (!/^\d*$/.test(raw)) return;
                      const newDetails = [...tempCostDetails];
                      newDetails[index].amount = Number(raw);
                      setTempCostDetails(newDetails);
                    }}
                    className="w-full bg-slate-50 dark:bg-slate-800 rounded-lg px-3 pl-6 py-2 text-sm font-bold text-right outline-none focus:ring-1 focus:ring-indigo-500"
                  />
                </div>
                <button
                  onClick={() => {
                    const newDetails = tempCostDetails.filter((_, i) => i !== index);
                    setTempCostDetails(newDetails);
                  }}
                  className="p-2 text-rose-400 hover:text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-900/30 rounded-lg transition-colors"
                >
                  <Trash2 size={16} />
                </button>
              </div>
            ))}
          </div>

          <button
            onClick={() => {
              setTempCostDetails([...tempCostDetails, { id: Date.now().toString(), name: '', amount: 0 }]);
            }}
            className="w-full py-3 border-2 border-dashed border-slate-200 dark:border-slate-700 rounded-xl text-slate-400 font-bold text-sm hover:border-indigo-500 hover:text-indigo-500 transition-all flex items-center justify-center gap-2"
          >
            <Plus size={16} /> Thêm khoản chi phí
          </button>

          <div className="flex items-center justify-between pt-4 border-t border-slate-100 dark:border-slate-800 mt-4">
            <div className="text-right">
              <p className="text-xs text-slate-400 uppercase font-bold">Tổng chi phí</p>
              <p className="text-xl font-black text-rose-500">
                {formatVND(tempCostDetails.reduce((acc, item) => acc + item.amount, 0))}
              </p>
            </div>
            <div className="flex gap-3">
              <button
                onClick={() => setActiveCostModalIndex(null)}
                className="px-5 py-2.5 rounded-xl font-bold text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
              >
                Hủy
              </button>
              <button
                onClick={saveCostModal}
                className="px-5 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl font-bold shadow-lg shadow-indigo-200 dark:shadow-none transition-all flex items-center gap-2"
              >
                <Save size={16} /> Lưu cập nhật
              </button>
            </div>
          </div>
        </div>
      </Modal >

      {/* FOOTER */}
      < div className="px-10 py-6 border-t border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-800/50 flex justify-between items-center" >
        <div className="flex items-center gap-6">
          <button onClick={() => { localStorage.removeItem('contract_form_draft'); onCancel(); }} className="px-6 py-3 text-slate-400 hover:text-rose-500 font-bold text-xs uppercase tracking-widest transition-all flex items-center gap-2">
            <X size={14} /> Hủy bỏ
          </button>
        </div>

        <div className="flex gap-3">
          {currentStep > 1 && (
            <button
              onClick={handleBack}
              className="px-8 py-3 bg-white dark:bg-slate-800 text-slate-600 dark:text-slate-300 border border-slate-200 dark:border-slate-700 rounded-[20px] font-black text-xs uppercase tracking-widest hover:bg-slate-50 dark:hover:bg-slate-700 transition-all shadow-sm"
            >
              Quay lại
            </button>
          )}

          {currentStep < 3 ? (
            <button
              onClick={handleNext}
              className="px-10 py-3 bg-indigo-600 text-white rounded-[20px] font-black text-xs uppercase tracking-widest flex items-center gap-3 hover:bg-indigo-700 transition-all shadow-xl shadow-indigo-200 dark:shadow-none hover:scale-105 active:scale-95"
            >
              Tiếp tục <Users size={16} />
            </button>
          ) : (
            <button
              onClick={() => { localStorage.removeItem('contract_form_draft'); handleSave(); }}
              className="px-10 py-3 bg-emerald-500 text-white rounded-[20px] font-black text-xs uppercase tracking-widest flex items-center gap-3 hover:bg-emerald-600 transition-all shadow-xl shadow-emerald-200 dark:shadow-none hover:scale-105 active:scale-95"
            >
              <Save size={16} strokeWidth={2.5} />
              Hoàn tất & Lưu
            </button>
          )}
        </div>
      </div >
    </div >
  );
};

export default ContractForm;
