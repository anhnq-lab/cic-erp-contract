
export type ContractStatus = 'Active' | 'Pending' | 'Expired' | 'Terminated' | 'Reviewing' | 'Completed';
export type ImplementationStage = 'Signed' | 'Advanced' | 'Guaranteed' | 'InputOrdered' | 'Implementation' | 'Completed' | 'Invoiced';
export type ContractType = 'HĐ' | 'VV';

export interface KPIPlan {
  signing: number;
  revenue: number;
  adminProfit: number; // LNG Quản trị (Dựa trên giá trị ký)
  revProfit: number;   // LNG theo DT (Dựa trên doanh thu thực tế)
  cash: number;        // Tiền về thực tế
}

export interface SalesPerson {
  id: string;
  name: string;
  unitId: string;
  avatar?: string;
  target: KPIPlan;
  // General info
  email?: string;
  phone?: string;
  position?: string; // Chức vụ
  dateJoined?: string; // Ngày vào công ty
  employeeCode?: string; // Mã nhân viên
}

export interface Unit {
  id: string;
  name: string;
  type: 'Company' | 'Branch' | 'Center';
  code: string;
  target: KPIPlan;
  lastYearActual?: KPIPlan; // Dữ liệu năm trước để so sánh YoY
}

/**
 * Represents a key milestone in contract implementation
 */
export interface Milestone {
  id: string;
  name: string;
  status: 'Completed' | 'Ongoing' | 'Planned';
  date: string;
  description?: string;
}

/**
 * Represents a payment phase/roadmap
 */
export interface PaymentPhase {
  id: string;
  name: string;
  dueDate: string;
  status: 'Paid' | 'Overdue' | 'Pending';
  percentage: number;
  amount: number;
  type?: 'Revenue' | 'Expense'; // Thu hoặc Chi
}

/**
 * Represents a contact person at the client organization
 */
export interface ContractContact {
  id: string;
  name: string;
  role: string;
}

/**
 * Represents an individual line item in the contract
 */
export interface LineItem {
  id: string;
  name: string;
  quantity: number;
  supplier: string;
  inputPrice: number;
  outputPrice: number;
  directCosts: number;
}

/**
 * Represents a scheduled revenue recognition event
 */
export interface RevenueSchedule {
  id: string;
  date: string;
  amount: number;
  description: string;
}

/**
 * Represents a scheduled payment event
 */
export interface PaymentSchedule {
  id: string;
  date: string;
  amount: number;
  description: string;
}

/**
 * Represents administrative and overhead costs
 */
export interface AdministrativeCosts {
  transferFee: number;
  contractorTax: number;
  importFee: number;
  expertHiring: number;
  documentProcessing: number;
}

export interface Contract {
  id: string;
  title: string;
  contractType: ContractType;
  customerId: string; // FK to Customer
  partyA: string;
  partyB: string;
  clientInitials: string;
  contacts: ContractContact[];
  content: string;
  signedDate: string;
  startDate: string;
  endDate: string;
  value: number;
  estimatedCost: number;
  actualRevenue: number;
  actualCost: number;
  status: ContractStatus;
  stage: ImplementationStage;
  category: string;
  unitId: string;
  salespersonId: string;
  milestones?: Milestone[];
  paymentPhases?: PaymentPhase[];
}

/**
 * Represents a customer/client organization
 */
export interface Customer {
  id: string;
  name: string;
  shortName: string;
  industry: 'Xây dựng' | 'Bất động sản' | 'Năng lượng' | 'Công nghệ' | 'Sản xuất' | 'Khác';
  contactPerson: string;
  phone: string;
  email: string;
  address: string;
  taxCode?: string;
  website?: string;
  notes?: string;
  // Bank info for payments
  bankName?: string;
  bankBranch?: string;
  bankAccount?: string;
  foundedDate?: string;
  type?: 'Customer' | 'Supplier' | 'Both';
}

/**
 * Product/Service category type
 */
export type ProductCategory = 'Phần mềm' | 'Tư vấn' | 'Thiết kế' | 'Thi công' | 'Bảo trì' | 'Đào tạo' | 'Khác';

/**
 * Represents a product or service offering
 */
export interface Product {
  id: string;
  code: string;
  name: string;
  category: ProductCategory;
  description: string;
  unit: string; // đơn vị tính: gói, m2, ngày công, etc.
  basePrice: number;
  costPrice?: number;
  isActive: boolean;
  unitId?: string; // đơn vị kinh doanh phụ trách
  createdAt?: string;
  updatedAt?: string;
}

/**
 * Payment status type - Vietnamese
 * Đã xuất HĐ = Invoiced but not paid
 * Tiền về = Cash received
 */
export type PaymentStatus = 'Chờ xuất HĐ' | 'Đã xuất HĐ' | 'Tiền về' | 'Quá hạn' | 'Paid' | 'Pending' | 'Overdue';

/**
 * Payment method type
 */
export type PaymentMethod = 'Chuyển khoản' | 'Tiền mặt' | 'LC' | 'Khác';

/**
 * Represents a payment record
 */
export interface Payment {
  id: string;
  contractId: string;
  customerId: string;
  phaseId?: string; // Link to PaymentPhase if applicable
  paymentDate: string;
  dueDate: string;
  amount: number;
  paidAmount: number;
  status: PaymentStatus;
  method: PaymentMethod;
  bankAccount?: string;
  reference?: string; // Số chứng từ, UNC
  invoiceNumber?: string;
  notes?: string;
  paymentType: 'Revenue' | 'Expense'; // Thu hoặc Chi
  createdAt?: string;
  updatedAt?: string;
}

/**
 * Customer bank information (for payments)
 */
export interface CustomerBank {
  bankName: string;
  bankBranch?: string;
  accountNumber: string;
  accountHolder: string;
}

