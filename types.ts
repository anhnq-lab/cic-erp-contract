
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

export interface Employee {
  id: string;
  name: string;
  unitId: string;
  avatar?: string;
  target: KPIPlan;
  // General info
  email?: string;
  phone?: string;
  telegram?: string; // Tài khoản Telegram
  position?: string; // Chức vụ
  department?: string; // Phòng ban / Khối
  roleCode?: string; // Mã role hệ thống
  dateJoined?: string; // Ngày vào công ty
  employeeCode?: string; // Mã nhân viên
  // HR fields
  dateOfBirth?: string; // Ngày sinh
  gender?: 'male' | 'female' | 'other';
  address?: string; // Địa chỉ
  education?: string; // Trình độ học vấn
  specialization?: string; // Chuyên ngành
  certificates?: string; // Chứng chỉ
  idNumber?: string; // CCCD/CMND
  bankAccount?: string; // Số tài khoản (thuộc hợp đồng)
  bankName?: string; // Tên ngân hàng (thuộc hợp đồng)
  maritalStatus?: 'single' | 'married' | 'divorced' | 'widowed';
  emergencyContact?: string; // Người liên hệ khẩn cấp
  emergencyPhone?: string; // SĐT khẩn cấp
  contractType?: string; // Loại hợp đồng LĐ
  contractEndDate?: string; // Ngày hết hạn HĐ
}

export interface Unit {
  id: string;
  name: string;
  type: 'Company' | 'Branch' | 'Center';
  code: string;
  target: KPIPlan;
  lastYearActual?: KPIPlan; // Dữ liệu năm trước để so sánh YoY
  functions?: string; // Chức năng nhiệm vụ
  // New fields from Phase 2 enhancement
  managerId?: string; // ID of unit manager (references employees)
  logoUrl?: string; // URL to unit logo/avatar
  address?: string;
  phone?: string;
  email?: string;
  description?: string;
  parentId?: string; // Parent unit for org chart hierarchy
  sortOrder?: number;
  isActive?: boolean;
  createdAt?: string;
  updatedAt?: string;
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
export interface DirectCostDetail {
  id: string;
  name: string;
  amount: number;
}

export interface LineItem {
  id: string;
  name: string;
  quantity: number;
  supplier: string;
  inputPrice: number;
  outputPrice: number;
  directCosts: number;
  directCostDetails?: DirectCostDetail[];
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
  status?: 'Paid' | 'Overdue' | 'Pending';
  percentage?: number;
  type?: 'Revenue' | 'Expense';
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
  invoicedAmount?: number; // Đã xuất hóa đơn
  actualCost: number;
  status: ContractStatus;
  stage: ImplementationStage;
  category: string;
  unitId: string;
  coordinatingUnitId?: string; // Đơn vị phối hợp
  salespersonId: string;
  lineItems?: LineItem[];
  adminCosts?: AdministrativeCosts;
  milestones?: Milestone[];
  paymentPhases?: PaymentPhase[];
  documents?: ContractDocument[];
  draft_url?: string; // URL to draft contract document (Google Doc) for legal review
}

export interface ContractDocument {
  id: string;
  contractId: string;
  name: string;
  url: string;
  filePath: string;
  type?: string;
  size?: number;
  uploadedAt: string;
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
  stats?: {
    contractCount: number;
    totalValue: number;
    totalRevenue: number;
    activeContracts: number;
  };
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


// ============================================
// WORKFLOW & PERMISSIONS
// ============================================

export type UserRole = 'Admin' | 'NVKD' | 'AdminUnit' | 'UnitLeader' | 'Accountant' | 'ChiefAccountant' | 'Legal' | 'Leadership';

export interface UserProfile {
  id: string; // Links to auth.users
  email: string;
  fullName: string;
  role: UserRole;
  unitId?: string; // Links to Unit
  avatarUrl?: string;
}

export type PlanStatus = 'Draft' | 'Pending_Unit' | 'Pending_Finance' | 'Pending_Board' | 'Approved' | 'Rejected';

export interface BusinessPlan {
  id: string;
  contractId: string;
  version: number;
  status: PlanStatus;
  financials: {
    revenue: number;
    costs: number;
    grossProfit: number;
    margin: number;
    cashflow: PaymentPhase[]; // Using existing PaymentPhase structure
  };
  isActive: boolean;
  createdBy: string;
  createdAt: string;
  approvedBy?: string;
  approvedAt?: string;
  notes?: string;
}

export type ReviewAction = 'Approve' | 'Reject' | 'RequestChange' | 'Submit';
export type ReviewRole = 'Unit' | 'Finance' | 'Legal' | 'Board';

export interface ContractReview {
  id: string;
  contractId: string;
  planId?: string;
  reviewerId: string;
  role: ReviewRole;
  action: ReviewAction;
  comment?: string;
  createdAt: string;
}

// ============================================
// PERMISSIONS (RBAC)
// ============================================

export type PermissionAction = 'view' | 'create' | 'update' | 'delete';
export type PermissionResource =
  | 'contracts'
  | 'employees'
  | 'units'
  | 'customers'
  | 'products'
  | 'payments'
  | 'settings'
  | 'permissions';

export interface UserPermission {
  id?: string;
  userId: string;
  resource: PermissionResource;
  actions: PermissionAction[];
  createdAt?: string;
  updatedAt?: string;
}

// Default permissions by role
export const DEFAULT_ROLE_PERMISSIONS: Record<UserRole, Partial<Record<PermissionResource, PermissionAction[]>>> = {
  Admin: {
    contracts: ['view', 'create', 'update', 'delete'],
    employees: ['view', 'create', 'update', 'delete'],
    units: ['view', 'create', 'update', 'delete'],
    customers: ['view', 'create', 'update', 'delete'],
    products: ['view', 'create', 'update', 'delete'],
    payments: ['view', 'create', 'update', 'delete'],
    settings: ['view', 'create', 'update', 'delete'],
    permissions: ['view', 'create', 'update', 'delete'],
  },
  Leadership: {
    contracts: ['view', 'create', 'update', 'delete'],
    employees: ['view', 'create', 'update', 'delete'],
    units: ['view', 'create', 'update', 'delete'],
    customers: ['view', 'create', 'update', 'delete'],
    products: ['view', 'create', 'update', 'delete'],
    payments: ['view', 'create', 'update', 'delete'],
    settings: ['view'],
    permissions: ['view'],
  },
  AdminUnit: {
    contracts: ['view', 'create', 'update', 'delete'],
    employees: ['view', 'create', 'update', 'delete'],
    units: ['view'],
    customers: ['view', 'create', 'update', 'delete'],
    products: ['view'],
    payments: ['view', 'create', 'update', 'delete'],
    settings: ['view'],
  },
  UnitLeader: {
    contracts: ['view', 'create', 'update', 'delete'],
    employees: ['view'],
    units: ['view'],
    customers: ['view', 'create', 'update', 'delete'],
    products: ['view'],
    payments: ['view'],
    settings: ['view'],
  },
  NVKD: {
    contracts: ['view', 'create', 'update'],
    employees: ['view'],
    units: ['view'],
    customers: ['view', 'create', 'update'],
    products: ['view'],
    payments: ['view'],
    settings: ['view'],
  },
  Accountant: {
    contracts: ['view'],
    employees: ['view'],
    units: ['view'],
    customers: ['view'],
    products: ['view'],
    payments: ['view', 'create', 'update', 'delete'],
    settings: ['view'],
  },
  ChiefAccountant: {
    contracts: ['view', 'create', 'update'],
    employees: ['view'],
    units: ['view'],
    customers: ['view'],
    products: ['view'],
    payments: ['view', 'create', 'update', 'delete'],
    settings: ['view'],
  },
  Legal: {
    contracts: ['view', 'create', 'update'],
    employees: ['view'],
    units: ['view'],
    customers: ['view'],
    products: ['view'],
    payments: ['view'],
    settings: ['view'],
  },
};
