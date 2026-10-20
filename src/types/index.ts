export interface User {
  id: number;
  username: string;
  email: string;
  full_name: string;
  role: 'ADMIN' | 'MANAGER' | 'STAFF';
  phone?: string;
  avatar_url?: string;
  status?: string;
  created_at?: string;
  last_login?: string;
}

export interface Department {
  id: number;
  code: string;
  name: string;
  head_name: string;
  budget: number;
  location: string;
  description: string;
  status: 'AKTIF' | 'NONAKTIF';
  employee_count?: number;
  created_at?: string;
}

export interface Employee {
  id: number;
  employee_code: string;
  name: string;
  email: string;
  phone: string;
  department_id: number | null;
  department_name?: string;
  department_code?: string;
  position: string;
  salary: number;
  join_date: string;
  status: 'TETAP' | 'KONTRAK' | 'MAGANG' | 'NONAKTIF';
  address: string;
  created_at?: string;
}

export interface Product {
  id: number;
  sku: string;
  name: string;
  category: string;
  unit: string;
  cost_price: number;
  selling_price: number;
  stock_quantity: number;
  min_stock: number;
  supplier_name: string;
  status: 'AKTIF' | 'NONAKTIF';
  description: string;
  created_at?: string;
}

export interface Client {
  id: number;
  client_code: string;
  company_name: string;
  contact_person: string;
  email: string;
  phone: string;
  address: string;
  tax_id: string;
  status: 'AKTIF' | 'NONAKTIF';
  created_at?: string;
}

export interface Supplier {
  id: number;
  supplier_code: string;
  company_name: string;
  contact_person: string;
  email: string;
  phone: string;
  address: string;
  category: string;
  status: 'AKTIF' | 'NONAKTIF';
  created_at?: string;
}

export type TransactionType = 'PENJUALAN' | 'PENGADAAN' | 'PENGGAJIAN' | 'OPERASIONAL';
export type PaymentStatus = 'LUNAS' | 'PENDING' | 'BATAL';
export type PaymentMethod = 'TRANSFER' | 'TUNAI' | 'GIRO' | 'KREDIT';

export interface Transaction {
  id: number;
  transaction_code: string;
  type: TransactionType;
  party_name: string;
  date: string;
  subtotal: number;
  tax: number;
  discount: number;
  total: number;
  payment_status: PaymentStatus;
  payment_method: PaymentMethod;
  notes: string;
  created_by: string;
  created_at?: string;
}

export interface TransactionItem {
  id?: number;
  transaction_id?: number;
  product_id?: number | null;
  item_name: string;
  quantity: number;
  unit_price: number;
  total_price: number;
}

export interface DashboardSummary {
  revenueSales: number;
  totalExpenses: number;
  netProfit: number;
  employeeCount: number;
  productCount: number;
  lowStockCount: number;
  clientCount: number;
  pendingTransactionsCount: number;
  inventoryValuation: number;
  recentTransactions: Transaction[];
  lowStockItems: Product[];
  typeBreakdown: { type: TransactionType; count: number; total_amount: number }[];
}

export interface IncomeStatement {
  sales: number;
  cogs: number;
  grossProfit: number;
  payroll: number;
  operational: number;
  totalExpenses: number;
  netIncome: number;
}

export interface CompanyProfile {
  id: number;
  name: string;
  legal_name: string;
  npwp: string;
  email: string;
  phone: string;
  address: string;
  website: string;
  currency: string;
}

export interface SystemStatus {
  engine: string;
  storage: string;
  dbFilePath: string;
  fileSizeKb: number;
  tables: Record<string, number>;
  uptimeSeconds: number;
  timestamp: string;
}

export interface AuditLog {
  id: number;
  user_name: string;
  action: string;
  module: string;
  record_id: string;
  details: string;
  created_at: string;
}
