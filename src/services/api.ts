import {
  User,
  Department,
  Employee,
  Product,
  Client,
  Supplier,
  Transaction,
  TransactionItem,
  DashboardSummary,
  IncomeStatement,
  CompanyProfile,
  SystemStatus,
  AuditLog,
} from '../types';

const TOKEN_KEY = 'erp_auth_token';

export function getStoredToken(): string | null {
  return localStorage.getItem(TOKEN_KEY);
}

export function setStoredToken(token: string | null) {
  if (token) {
    localStorage.setItem(TOKEN_KEY, token);
  } else {
    localStorage.removeItem(TOKEN_KEY);
  }
}

async function request<T>(endpoint: string, options: RequestInit = {}): Promise<T> {
  const token = getStoredToken();
  const headers = new Headers(options.headers || {});

  if (!headers.has('Content-Type') && !(options.body instanceof FormData)) {
    headers.set('Content-Type', 'application/json');
  }

  if (token) {
    headers.set('Authorization', `Bearer ${token}`);
  }

  const response = await fetch(`/api${endpoint}`, {
    ...options,
    headers,
  });

  const contentType = response.headers.get('content-type') || '';
  let data: any = {};
  if (contentType.includes('application/json')) {
    data = await response.json();
  } else {
    const text = await response.text();
    data = { error: text || response.statusText };
  }

  if (!response.ok) {
    if (response.status === 401 && !endpoint.includes('/auth/login')) {
      setStoredToken(null);
      window.dispatchEvent(new CustomEvent('auth:expired'));
    }
    throw new Error(data.error || `HTTP ${response.status}: Terjadi kesalahan pada server`);
  }

  return data as T;
}

export const api = {
  // Auth
  login: (usernameOrEmail: string, password: string) =>
    request<{ token: string; user: User }>('/auth/login', {
      method: 'POST',
      body: JSON.stringify({ usernameOrEmail, password }),
    }),
  getMe: () => request<{ user: User }>('/auth/me'),
  changePassword: (oldPassword: string, newPassword: string) =>
    request<{ success: boolean; message: string }>('/auth/change-password', {
      method: 'POST',
      body: JSON.stringify({ oldPassword, newPassword }),
    }),

  // Users
  getUsers: () => request<{ users: User[] }>('/users'),
  createUser: (userData: any) =>
    request<{ success: boolean; id: number }>('/users', {
      method: 'POST',
      body: JSON.stringify(userData),
    }),
  deleteUser: (id: number) =>
    request<{ success: boolean }>(`/users/${id}`, { method: 'DELETE' }),

  // Master Karyawan
  getEmployees: (params?: { search?: string; department_id?: number | string; status?: string }) => {
    const q = new URLSearchParams();
    if (params?.search) q.append('search', params.search);
    if (params?.department_id) q.append('department_id', String(params.department_id));
    if (params?.status) q.append('status', params.status);
    return request<{ employees: Employee[] }>(`/master/employees?${q.toString()}`);
  },
  createEmployee: (employee: Partial<Employee>) =>
    request<{ success: boolean; id: number }>('/master/employees', {
      method: 'POST',
      body: JSON.stringify(employee),
    }),
  updateEmployee: (id: number, employee: Partial<Employee>) =>
    request<{ success: boolean }>(`/master/employees/${id}`, {
      method: 'PUT',
      body: JSON.stringify(employee),
    }),
  deleteEmployee: (id: number) =>
    request<{ success: boolean }>(`/master/employees/${id}`, { method: 'DELETE' }),

  // Master Produk & Stok
  getProducts: (params?: { search?: string; category?: string; lowStockOnly?: boolean }) => {
    const q = new URLSearchParams();
    if (params?.search) q.append('search', params.search);
    if (params?.category) q.append('category', params.category);
    if (params?.lowStockOnly) q.append('lowStockOnly', 'true');
    return request<{ products: Product[] }>(`/master/products?${q.toString()}`);
  },
  createProduct: (product: Partial<Product>) =>
    request<{ success: boolean; id: number }>('/master/products', {
      method: 'POST',
      body: JSON.stringify(product),
    }),
  updateProduct: (id: number, product: Partial<Product>) =>
    request<{ success: boolean }>(`/master/products/${id}`, {
      method: 'PUT',
      body: JSON.stringify(product),
    }),
  adjustStock: (id: number, delta: number, reason?: string) =>
    request<{ success: boolean; newStock: number }>(`/master/products/${id}/adjust-stock`, {
      method: 'POST',
      body: JSON.stringify({ delta, reason }),
    }),
  deleteProduct: (id: number) =>
    request<{ success: boolean }>(`/master/products/${id}`, { method: 'DELETE' }),

  // Master Departemen
  getDepartments: () => request<{ departments: Department[] }>('/master/departments'),
  createDepartment: (dept: Partial<Department>) =>
    request<{ success: boolean; id: number }>('/master/departments', {
      method: 'POST',
      body: JSON.stringify(dept),
    }),
  updateDepartment: (id: number, dept: Partial<Department>) =>
    request<{ success: boolean }>(`/master/departments/${id}`, {
      method: 'PUT',
      body: JSON.stringify(dept),
    }),
  deleteDepartment: (id: number) =>
    request<{ success: boolean }>(`/master/departments/${id}`, { method: 'DELETE' }),

  // Master Klien
  getClients: () => request<{ clients: Client[] }>('/master/clients'),
  createClient: (client: Partial<Client>) =>
    request<{ success: boolean; id: number }>('/master/clients', {
      method: 'POST',
      body: JSON.stringify(client),
    }),
  updateClient: (id: number, client: Partial<Client>) =>
    request<{ success: boolean }>(`/master/clients/${id}`, {
      method: 'PUT',
      body: JSON.stringify(client),
    }),
  deleteClient: (id: number) =>
    request<{ success: boolean }>(`/master/clients/${id}`, { method: 'DELETE' }),

  // Master Supplier
  getSuppliers: () => request<{ suppliers: Supplier[] }>('/master/suppliers'),
  createSupplier: (supplier: Partial<Supplier>) =>
    request<{ success: boolean; id: number }>('/master/suppliers', {
      method: 'POST',
      body: JSON.stringify(supplier),
    }),
  updateSupplier: (id: number, supplier: Partial<Supplier>) =>
    request<{ success: boolean }>(`/master/suppliers/${id}`, {
      method: 'PUT',
      body: JSON.stringify(supplier),
    }),
  deleteSupplier: (id: number) =>
    request<{ success: boolean }>(`/master/suppliers/${id}`, { method: 'DELETE' }),

  // Transaksi
  getTransactions: (params?: { search?: string; type?: string; payment_status?: string; startDate?: string; endDate?: string }) => {
    const q = new URLSearchParams();
    if (params?.search) q.append('search', params.search);
    if (params?.type) q.append('type', params.type);
    if (params?.payment_status) q.append('payment_status', params.payment_status);
    if (params?.startDate) q.append('startDate', params.startDate);
    if (params?.endDate) q.append('endDate', params.endDate);
    return request<{ transactions: Transaction[] }>(`/transactions?${q.toString()}`);
  },
  getTransactionDetail: (id: number) =>
    request<{ transaction: Transaction; items: TransactionItem[] }>(`/transactions/${id}`),
  createTransaction: (data: Partial<Transaction> & { items?: Partial<TransactionItem>[] }) =>
    request<{ success: boolean; id: number; transaction_code: string }>('/transactions', {
      method: 'POST',
      body: JSON.stringify(data),
    }),
  updateTransaction: (id: number, data: Partial<Transaction>) =>
    request<{ success: boolean }>(`/transactions/${id}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    }),
  deleteTransaction: (id: number) =>
    request<{ success: boolean }>(`/transactions/${id}`, { method: 'DELETE' }),

  // Laporan & Dashboard
  getDashboardSummary: () => request<DashboardSummary>('/reports/summary'),
  getIncomeStatement: (startDate?: string, endDate?: string) => {
    const q = new URLSearchParams();
    if (startDate) q.append('startDate', startDate);
    if (endDate) q.append('endDate', endDate);
    return request<IncomeStatement>(`/reports/income-statement?${q.toString()}`);
  },
  getInventoryValuation: () =>
    request<{ items: any[] }>('/reports/inventory-valuation'),
  getPayrollReport: () =>
    request<{ summary: any[] }>('/reports/payroll'),

  // Profil & Sistem
  getCompanyProfile: () => request<{ profile: CompanyProfile }>('/company/profile'),
  updateCompanyProfile: (profile: Partial<CompanyProfile>) =>
    request<{ success: boolean }>('/company/profile', {
      method: 'PUT',
      body: JSON.stringify(profile),
    }),
  getSystemStatus: () => request<SystemStatus>('/system/status'),
  getAuditLogs: () => request<{ logs: AuditLog[] }>('/audit-logs'),
};

// Indonesian Currency and Date formatters
export function formatRupiah(amount: number): string {
  return new Intl.NumberFormat('id-ID', {
    style: 'currency',
    currency: 'IDR',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(amount || 0);
}

export function formatDate(dateStr?: string): string {
  if (!dateStr) return '-';
  try {
    const d = new Date(dateStr);
    return d.toLocaleDateString('id-ID', {
      day: 'numeric',
      month: 'short',
      year: 'numeric',
    });
  } catch {
    return dateStr;
  }
}
