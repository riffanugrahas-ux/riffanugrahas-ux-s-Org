import express, { Request, Response, NextFunction } from 'express';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import fs from 'fs';
import path from 'path';
import { query, queryOne, run, logAudit, saveDatabase } from './db.ts';

const JWT_SECRET = process.env.JWT_SECRET || 'nusantara_megah_enterprise_secret_key_2026';

export const apiRouter = express.Router();
apiRouter.use(express.json());

// Auth Middleware
export interface AuthUser {
  id: number;
  username: string;
  email: string;
  role: string;
  full_name: string;
}

export interface AuthRequest extends Request {
  user?: AuthUser;
}

export function authMiddleware(req: AuthRequest, res: Response, next: NextFunction) {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({ error: 'Token autentikasi tidak ditemukan. Silakan login.' });
  }

  const token = authHeader.split(' ')[1];
  try {
    const decoded = jwt.verify(token, JWT_SECRET) as AuthUser;
    req.user = decoded;
    next();
  } catch (err) {
    return res.status(401).json({ error: 'Sesi telah kedaluwarsa atau token tidak valid. Silakan login kembali.' });
  }
}

// Optional Auth (for public check if needed)
export function optionalAuthMiddleware(req: AuthRequest, res: Response, next: NextFunction) {
  const authHeader = req.headers.authorization;
  if (authHeader && authHeader.startsWith('Bearer ')) {
    const token = authHeader.split(' ')[1];
    try {
      const decoded = jwt.verify(token, JWT_SECRET) as AuthUser;
      req.user = decoded;
    } catch {
      // ignore
    }
  }
  next();
}

// -------------------------------------------------------------
// AUTH ENDPOINTS
// -------------------------------------------------------------

apiRouter.post('/auth/login', async (req: Request, res: Response) => {
  try {
    const { usernameOrEmail, password } = req.body;
    if (!usernameOrEmail || !password) {
      return res.status(400).json({ error: 'Username/Email dan kata sandi wajib diisi.' });
    }

    const user = queryOne<any>(
      'SELECT * FROM users WHERE (username = ? OR email = ?) AND status = "AKTIF"',
      [usernameOrEmail.trim(), usernameOrEmail.trim()]
    );

    if (!user) {
      return res.status(401).json({ error: 'Kredensial tidak valid atau akun tidak aktif.' });
    }

    const isMatch = await bcrypt.compare(password, user.password_hash);
    if (!isMatch) {
      return res.status(401).json({ error: 'Kata sandi yang Anda masukkan salah.' });
    }

    // Update last login
    run('UPDATE users SET last_login = CURRENT_TIMESTAMP WHERE id = ?', [user.id]);
    logAudit(user.username, 'LOGIN', 'AUTH', user.id, `User ${user.username} (${user.role}) berhasil masuk`);

    const tokenPayload: AuthUser = {
      id: user.id,
      username: user.username,
      email: user.email,
      role: user.role,
      full_name: user.full_name,
    };

    const token = jwt.sign(tokenPayload, JWT_SECRET, { expiresIn: '7d' });

    const safeUser = {
      id: user.id,
      username: user.username,
      email: user.email,
      full_name: user.full_name,
      role: user.role,
      phone: user.phone,
      avatar_url: user.avatar_url,
      last_login: new Date().toISOString(),
    };

    return res.json({ token, user: safeUser });
  } catch (err: any) {
    console.error('Login error:', err);
    return res.status(500).json({ error: 'Terjadi kesalahan sistem saat proses login: ' + err.message });
  }
});

apiRouter.get('/auth/me', authMiddleware, (req: AuthRequest, res: Response) => {
  const user = queryOne<any>('SELECT id, username, email, full_name, role, phone, avatar_url, status, created_at, last_login FROM users WHERE id = ?', [req.user!.id]);
  if (!user) {
    return res.status(404).json({ error: 'User tidak ditemukan' });
  }
  return res.json({ user });
});

apiRouter.post('/auth/change-password', authMiddleware, async (req: AuthRequest, res: Response) => {
  try {
    const { oldPassword, newPassword } = req.body;
    if (!oldPassword || !newPassword || newPassword.length < 6) {
      return res.status(400).json({ error: 'Kata sandi baru minimal 6 karakter.' });
    }

    const user = queryOne<any>('SELECT * FROM users WHERE id = ?', [req.user!.id]);
    if (!user) return res.status(404).json({ error: 'User tidak ditemukan' });

    const isMatch = await bcrypt.compare(oldPassword, user.password_hash);
    if (!isMatch) {
      return res.status(400).json({ error: 'Kata sandi lama salah.' });
    }

    const newHash = await bcrypt.hash(newPassword, 10);
    run('UPDATE users SET password_hash = ? WHERE id = ?', [newHash, user.id]);
    logAudit(req.user!.username, 'UPDATE', 'AUTH', user.id, 'Mengubah kata sandi akun');

    return res.json({ success: true, message: 'Kata sandi berhasil diperbarui.' });
  } catch (err: any) {
    return res.status(500).json({ error: err.message });
  }
});

// Users management
apiRouter.get('/users', authMiddleware, (req: AuthRequest, res: Response) => {
  const users = query<any>('SELECT id, username, email, full_name, role, phone, status, created_at, last_login FROM users ORDER BY id ASC');
  return res.json({ users });
});

apiRouter.post('/users', authMiddleware, async (req: AuthRequest, res: Response) => {
  try {
    if (req.user?.role !== 'ADMIN') {
      return res.status(403).json({ error: 'Hanya Admin yang berhak menambahkan pengguna.' });
    }
    const { username, email, password, full_name, role, phone, status } = req.body;
    if (!username || !email || !password || !full_name) {
      return res.status(400).json({ error: 'Semua kolom wajib diisi.' });
    }

    const existing = queryOne('SELECT id FROM users WHERE username = ? OR email = ?', [username, email]);
    if (existing) {
      return res.status(400).json({ error: 'Username atau Email sudah terdaftar.' });
    }

    const passwordHash = await bcrypt.hash(password, 10);
    const result = run(
      'INSERT INTO users (username, email, password_hash, full_name, role, phone, status) VALUES (?, ?, ?, ?, ?, ?, ?)',
      [username, email, passwordHash, full_name, role || 'STAFF', phone || '', status || 'AKTIF']
    );

    logAudit(req.user.username, 'CREATE', 'USERS', result.lastInsertId || 0, `Membuat akun user: ${username} (${role})`);
    return res.status(201).json({ success: true, id: result.lastInsertId });
  } catch (err: any) {
    return res.status(500).json({ error: err.message });
  }
});

apiRouter.delete('/users/:id', authMiddleware, (req: AuthRequest, res: Response) => {
  if (req.user?.role !== 'ADMIN') {
    return res.status(403).json({ error: 'Hanya Admin yang berhak menghapus pengguna.' });
  }
  const id = parseInt(req.params.id);
  if (id === req.user.id) {
    return res.status(400).json({ error: 'Anda tidak dapat menghapus akun Anda sendiri saat sedang login.' });
  }

  run('DELETE FROM users WHERE id = ?', [id]);
  logAudit(req.user.username, 'DELETE', 'USERS', id, `Menghapus akun pengguna ID: ${id}`);
  return res.json({ success: true });
});

// -------------------------------------------------------------
// MASTER DATA - KARYAWAN (EMPLOYEES)
// -------------------------------------------------------------

apiRouter.get('/master/employees', authMiddleware, (req: Request, res: Response) => {
  const { search, department_id, status } = req.query;
  let sql = `
    SELECT e.*, d.name as department_name, d.code as department_code
    FROM master_employees e
    LEFT JOIN master_departments d ON e.department_id = d.id
    WHERE 1=1
  `;
  const params: any[] = [];

  if (search) {
    sql += ` AND (e.name LIKE ? OR e.employee_code LIKE ? OR e.email LIKE ? OR e.position LIKE ?)`;
    const s = `%${search}%`;
    params.push(s, s, s, s);
  }
  if (department_id) {
    sql += ` AND e.department_id = ?`;
    params.push(department_id);
  }
  if (status) {
    sql += ` AND e.status = ?`;
    params.push(status);
  }

  sql += ` ORDER BY e.id DESC`;
  const employees = query(sql, params);
  return res.json({ employees });
});

apiRouter.post('/master/employees', authMiddleware, (req: AuthRequest, res: Response) => {
  try {
    const { employee_code, name, email, phone, department_id, position, salary, join_date, status, address } = req.body;
    if (!employee_code || !name || !position) {
      return res.status(400).json({ error: 'Kode Karyawan, Nama, dan Posisi/Jabatan wajib diisi.' });
    }

    const existing = queryOne('SELECT id FROM master_employees WHERE employee_code = ?', [employee_code.trim()]);
    if (existing) {
      return res.status(400).json({ error: `Kode Karyawan ${employee_code} sudah digunakan.` });
    }

    const result = run(`
      INSERT INTO master_employees (employee_code, name, email, phone, department_id, position, salary, join_date, status, address)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `, [
      employee_code.trim(),
      name.trim(),
      email || '',
      phone || '',
      department_id ? Number(department_id) : null,
      position.trim(),
      salary ? Number(salary) : 0,
      join_date || new Date().toISOString().split('T')[0],
      status || 'TETAP',
      address || ''
    ]);

    logAudit(req.user?.username || 'Admin', 'CREATE', 'KARYAWAN', result.lastInsertId || 0, `Tambah karyawan baru: ${name} (${employee_code})`);
    return res.status(201).json({ success: true, id: result.lastInsertId });
  } catch (err: any) {
    return res.status(500).json({ error: err.message });
  }
});

apiRouter.put('/master/employees/:id', authMiddleware, (req: AuthRequest, res: Response) => {
  try {
    const id = parseInt(req.params.id);
    const { employee_code, name, email, phone, department_id, position, salary, join_date, status, address } = req.body;

    const existingCode = queryOne('SELECT id FROM master_employees WHERE employee_code = ? AND id != ?', [employee_code.trim(), id]);
    if (existingCode) {
      return res.status(400).json({ error: `Kode Karyawan ${employee_code} sudah digunakan oleh karyawan lain.` });
    }

    run(`
      UPDATE master_employees 
      SET employee_code = ?, name = ?, email = ?, phone = ?, department_id = ?, position = ?, salary = ?, join_date = ?, status = ?, address = ?
      WHERE id = ?
    `, [
      employee_code.trim(),
      name.trim(),
      email || '',
      phone || '',
      department_id ? Number(department_id) : null,
      position.trim(),
      salary ? Number(salary) : 0,
      join_date,
      status || 'TETAP',
      address || '',
      id
    ]);

    logAudit(req.user?.username || 'Admin', 'UPDATE', 'KARYAWAN', id, `Perbarui data karyawan: ${name}`);
    return res.json({ success: true });
  } catch (err: any) {
    return res.status(500).json({ error: err.message });
  }
});

apiRouter.delete('/master/employees/:id', authMiddleware, (req: AuthRequest, res: Response) => {
  try {
    const id = parseInt(req.params.id);
    const emp = queryOne<any>('SELECT name, employee_code FROM master_employees WHERE id = ?', [id]);
    run('DELETE FROM master_employees WHERE id = ?', [id]);
    logAudit(req.user?.username || 'Admin', 'DELETE', 'KARYAWAN', id, `Hapus karyawan: ${emp?.name || id}`);
    return res.json({ success: true });
  } catch (err: any) {
    return res.status(500).json({ error: err.message });
  }
});

// -------------------------------------------------------------
// MASTER DATA - PRODUK & INVENTARIS (PRODUCTS)
// -------------------------------------------------------------

apiRouter.get('/master/products', authMiddleware, (req: Request, res: Response) => {
  const { search, category, lowStockOnly } = req.query;
  let sql = 'SELECT * FROM master_products WHERE 1=1';
  const params: any[] = [];

  if (search) {
    sql += ' AND (sku LIKE ? OR name LIKE ? OR supplier_name LIKE ?)';
    const s = `%${search}%`;
    params.push(s, s, s);
  }
  if (category) {
    sql += ' AND category = ?';
    params.push(category);
  }
  if (lowStockOnly === 'true') {
    sql += ' AND stock_quantity <= min_stock';
  }

  sql += ' ORDER BY id DESC';
  const products = query(sql, params);
  return res.json({ products });
});

apiRouter.post('/master/products', authMiddleware, (req: AuthRequest, res: Response) => {
  try {
    const { sku, name, category, unit, cost_price, selling_price, stock_quantity, min_stock, supplier_name, status, description } = req.body;
    if (!sku || !name || !category) {
      return res.status(400).json({ error: 'SKU, Nama Produk, dan Kategori wajib diisi.' });
    }

    const existing = queryOne('SELECT id FROM master_products WHERE sku = ?', [sku.trim()]);
    if (existing) {
      return res.status(400).json({ error: `SKU ${sku} sudah terdaftar.` });
    }

    const result = run(`
      INSERT INTO master_products (sku, name, category, unit, cost_price, selling_price, stock_quantity, min_stock, supplier_name, status, description)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `, [
      sku.trim(),
      name.trim(),
      category.trim(),
      unit || 'Pcs',
      cost_price ? Number(cost_price) : 0,
      selling_price ? Number(selling_price) : 0,
      stock_quantity ? Number(stock_quantity) : 0,
      min_stock ? Number(min_stock) : 5,
      supplier_name || '',
      status || 'AKTIF',
      description || ''
    ]);

    logAudit(req.user?.username || 'Admin', 'CREATE', 'PRODUK', result.lastInsertId || 0, `Tambah produk baru: ${name} (${sku})`);
    return res.status(201).json({ success: true, id: result.lastInsertId });
  } catch (err: any) {
    return res.status(500).json({ error: err.message });
  }
});

apiRouter.put('/master/products/:id', authMiddleware, (req: AuthRequest, res: Response) => {
  try {
    const id = parseInt(req.params.id);
    const { sku, name, category, unit, cost_price, selling_price, stock_quantity, min_stock, supplier_name, status, description } = req.body;

    const existing = queryOne('SELECT id FROM master_products WHERE sku = ? AND id != ?', [sku.trim(), id]);
    if (existing) {
      return res.status(400).json({ error: `SKU ${sku} sudah digunakan oleh produk lain.` });
    }

    run(`
      UPDATE master_products
      SET sku = ?, name = ?, category = ?, unit = ?, cost_price = ?, selling_price = ?, stock_quantity = ?, min_stock = ?, supplier_name = ?, status = ?, description = ?
      WHERE id = ?
    `, [
      sku.trim(),
      name.trim(),
      category.trim(),
      unit || 'Pcs',
      cost_price ? Number(cost_price) : 0,
      selling_price ? Number(selling_price) : 0,
      stock_quantity ? Number(stock_quantity) : 0,
      min_stock ? Number(min_stock) : 5,
      supplier_name || '',
      status || 'AKTIF',
      description || '',
      id
    ]);

    logAudit(req.user?.username || 'Admin', 'UPDATE', 'PRODUK', id, `Update data produk: ${name}`);
    return res.json({ success: true });
  } catch (err: any) {
    return res.status(500).json({ error: err.message });
  }
});

apiRouter.post('/master/products/:id/adjust-stock', authMiddleware, (req: AuthRequest, res: Response) => {
  try {
    const id = parseInt(req.params.id);
    const { delta, reason } = req.body;
    const product = queryOne<any>('SELECT * FROM master_products WHERE id = ?', [id]);
    if (!product) return res.status(404).json({ error: 'Produk tidak ditemukan' });

    const newStock = Math.max(0, product.stock_quantity + Number(delta));
    run('UPDATE master_products SET stock_quantity = ? WHERE id = ?', [newStock, id]);

    logAudit(req.user?.username || 'Admin', 'STOCK_ADJUST', 'PRODUK', id, `Penyesuaian stok produk ${product.name}: ${product.stock_quantity} -> ${newStock} (${reason || 'Manual'})`);
    return res.json({ success: true, newStock });
  } catch (err: any) {
    return res.status(500).json({ error: err.message });
  }
});

apiRouter.delete('/master/products/:id', authMiddleware, (req: AuthRequest, res: Response) => {
  try {
    const id = parseInt(req.params.id);
    const prod = queryOne<any>('SELECT name, sku FROM master_products WHERE id = ?', [id]);
    run('DELETE FROM master_products WHERE id = ?', [id]);
    logAudit(req.user?.username || 'Admin', 'DELETE', 'PRODUK', id, `Hapus produk: ${prod?.name || id}`);
    return res.json({ success: true });
  } catch (err: any) {
    return res.status(500).json({ error: err.message });
  }
});

// -------------------------------------------------------------
// MASTER DATA - DEPARTEMEN (DEPARTMENTS)
// -------------------------------------------------------------

apiRouter.get('/master/departments', authMiddleware, (req: Request, res: Response) => {
  const departments = query(`
    SELECT d.*, COUNT(e.id) as employee_count
    FROM master_departments d
    LEFT JOIN master_employees e ON d.id = e.department_id
    GROUP BY d.id
    ORDER BY d.id ASC
  `);
  return res.json({ departments });
});

apiRouter.post('/master/departments', authMiddleware, (req: AuthRequest, res: Response) => {
  try {
    const { code, name, head_name, budget, location, description, status } = req.body;
    if (!code || !name) {
      return res.status(400).json({ error: 'Kode Departemen dan Nama wajib diisi.' });
    }

    const existing = queryOne('SELECT id FROM master_departments WHERE code = ?', [code.trim()]);
    if (existing) {
      return res.status(400).json({ error: `Kode departemen ${code} sudah terdaftar.` });
    }

    const result = run(`
      INSERT INTO master_departments (code, name, head_name, budget, location, description, status)
      VALUES (?, ?, ?, ?, ?, ?, ?)
    `, [
      code.trim(),
      name.trim(),
      head_name || '',
      budget ? Number(budget) : 0,
      location || '',
      description || '',
      status || 'AKTIF'
    ]);

    logAudit(req.user?.username || 'Admin', 'CREATE', 'DEPARTEMEN', result.lastInsertId || 0, `Tambah departemen: ${name}`);
    return res.status(201).json({ success: true, id: result.lastInsertId });
  } catch (err: any) {
    return res.status(500).json({ error: err.message });
  }
});

apiRouter.put('/master/departments/:id', authMiddleware, (req: AuthRequest, res: Response) => {
  try {
    const id = parseInt(req.params.id);
    const { code, name, head_name, budget, location, description, status } = req.body;

    const existing = queryOne('SELECT id FROM master_departments WHERE code = ? AND id != ?', [code.trim(), id]);
    if (existing) {
      return res.status(400).json({ error: `Kode departemen ${code} sudah digunakan departemen lain.` });
    }

    run(`
      UPDATE master_departments
      SET code = ?, name = ?, head_name = ?, budget = ?, location = ?, description = ?, status = ?
      WHERE id = ?
    `, [
      code.trim(),
      name.trim(),
      head_name || '',
      budget ? Number(budget) : 0,
      location || '',
      description || '',
      status || 'AKTIF',
      id
    ]);

    logAudit(req.user?.username || 'Admin', 'UPDATE', 'DEPARTEMEN', id, `Update departemen: ${name}`);
    return res.json({ success: true });
  } catch (err: any) {
    return res.status(500).json({ error: err.message });
  }
});

apiRouter.delete('/master/departments/:id', authMiddleware, (req: AuthRequest, res: Response) => {
  try {
    const id = parseInt(req.params.id);
    const employeesCount = queryOne<{ count: number }>('SELECT COUNT(*) as count FROM master_employees WHERE department_id = ?', [id]);
    if (employeesCount && employeesCount.count > 0) {
      return res.status(400).json({ error: `Departemen ini memiliki ${employeesCount.count} karyawan terkait. Pindahkan karyawan terlebih dahulu sebelum menghapus.` });
    }

    const dept = queryOne<any>('SELECT name FROM master_departments WHERE id = ?', [id]);
    run('DELETE FROM master_departments WHERE id = ?', [id]);
    logAudit(req.user?.username || 'Admin', 'DELETE', 'DEPARTEMEN', id, `Hapus departemen: ${dept?.name || id}`);
    return res.json({ success: true });
  } catch (err: any) {
    return res.status(500).json({ error: err.message });
  }
});

// -------------------------------------------------------------
// MASTER DATA - KLIEN & SUPPLIER
// -------------------------------------------------------------

apiRouter.get('/master/clients', authMiddleware, (req: Request, res: Response) => {
  const clients = query('SELECT * FROM master_clients ORDER BY id DESC');
  return res.json({ clients });
});

apiRouter.post('/master/clients', authMiddleware, (req: AuthRequest, res: Response) => {
  try {
    const { client_code, company_name, contact_person, email, phone, address, tax_id, status } = req.body;
    if (!client_code || !company_name) {
      return res.status(400).json({ error: 'Kode Klien dan Nama Perusahaan wajib diisi.' });
    }
    const result = run(`
      INSERT INTO master_clients (client_code, company_name, contact_person, email, phone, address, tax_id, status)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?)
    `, [client_code.trim(), company_name.trim(), contact_person || '', email || '', phone || '', address || '', tax_id || '', status || 'AKTIF']);

    logAudit(req.user?.username || 'Admin', 'CREATE', 'KLIEN', result.lastInsertId || 0, `Tambah klien: ${company_name}`);
    return res.status(201).json({ success: true, id: result.lastInsertId });
  } catch (err: any) {
    return res.status(500).json({ error: err.message });
  }
});

apiRouter.put('/master/clients/:id', authMiddleware, (req: AuthRequest, res: Response) => {
  try {
    const id = parseInt(req.params.id);
    const { client_code, company_name, contact_person, email, phone, address, tax_id, status } = req.body;
    run(`
      UPDATE master_clients
      SET client_code = ?, company_name = ?, contact_person = ?, email = ?, phone = ?, address = ?, tax_id = ?, status = ?
      WHERE id = ?
    `, [client_code.trim(), company_name.trim(), contact_person || '', email || '', phone || '', address || '', tax_id || '', status || 'AKTIF', id]);

    logAudit(req.user?.username || 'Admin', 'UPDATE', 'KLIEN', id, `Update klien: ${company_name}`);
    return res.json({ success: true });
  } catch (err: any) {
    return res.status(500).json({ error: err.message });
  }
});

apiRouter.delete('/master/clients/:id', authMiddleware, (req: AuthRequest, res: Response) => {
  try {
    const id = parseInt(req.params.id);
    run('DELETE FROM master_clients WHERE id = ?', [id]);
    logAudit(req.user?.username || 'Admin', 'DELETE', 'KLIEN', id, `Hapus klien ID: ${id}`);
    return res.json({ success: true });
  } catch (err: any) {
    return res.status(500).json({ error: err.message });
  }
});

apiRouter.get('/master/suppliers', authMiddleware, (req: Request, res: Response) => {
  const suppliers = query('SELECT * FROM master_suppliers ORDER BY id DESC');
  return res.json({ suppliers });
});

apiRouter.post('/master/suppliers', authMiddleware, (req: AuthRequest, res: Response) => {
  try {
    const { supplier_code, company_name, contact_person, email, phone, address, category, status } = req.body;
    if (!supplier_code || !company_name) {
      return res.status(400).json({ error: 'Kode Supplier dan Nama Perusahaan wajib diisi.' });
    }
    const result = run(`
      INSERT INTO master_suppliers (supplier_code, company_name, contact_person, email, phone, address, category, status)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?)
    `, [supplier_code.trim(), company_name.trim(), contact_person || '', email || '', phone || '', address || '', category || '', status || 'AKTIF']);

    logAudit(req.user?.username || 'Admin', 'CREATE', 'SUPPLIER', result.lastInsertId || 0, `Tambah supplier: ${company_name}`);
    return res.status(201).json({ success: true, id: result.lastInsertId });
  } catch (err: any) {
    return res.status(500).json({ error: err.message });
  }
});

apiRouter.put('/master/suppliers/:id', authMiddleware, (req: AuthRequest, res: Response) => {
  try {
    const id = parseInt(req.params.id);
    const { supplier_code, company_name, contact_person, email, phone, address, category, status } = req.body;
    run(`
      UPDATE master_suppliers
      SET supplier_code = ?, company_name = ?, contact_person = ?, email = ?, phone = ?, address = ?, category = ?, status = ?
      WHERE id = ?
    `, [supplier_code.trim(), company_name.trim(), contact_person || '', email || '', phone || '', address || '', category || '', status || 'AKTIF', id]);

    logAudit(req.user?.username || 'Admin', 'UPDATE', 'SUPPLIER', id, `Update supplier: ${company_name}`);
    return res.json({ success: true });
  } catch (err: any) {
    return res.status(500).json({ error: err.message });
  }
});

apiRouter.delete('/master/suppliers/:id', authMiddleware, (req: AuthRequest, res: Response) => {
  try {
    const id = parseInt(req.params.id);
    run('DELETE FROM master_suppliers WHERE id = ?', [id]);
    logAudit(req.user?.username || 'Admin', 'DELETE', 'SUPPLIER', id, `Hapus supplier ID: ${id}`);
    return res.json({ success: true });
  } catch (err: any) {
    return res.status(500).json({ error: err.message });
  }
});

// -------------------------------------------------------------
// TRANSAKSI DATA (TRANSACTIONS CRUD + STOCK SYNC)
// -------------------------------------------------------------

apiRouter.get('/transactions', authMiddleware, (req: Request, res: Response) => {
  const { search, type, payment_status, startDate, endDate } = req.query;
  let sql = 'SELECT * FROM transactions WHERE 1=1';
  const params: any[] = [];

  if (search) {
    sql += ' AND (transaction_code LIKE ? OR party_name LIKE ? OR notes LIKE ?)';
    const s = `%${search}%`;
    params.push(s, s, s);
  }
  if (type) {
    sql += ' AND type = ?';
    params.push(type);
  }
  if (payment_status) {
    sql += ' AND payment_status = ?';
    params.push(payment_status);
  }
  if (startDate) {
    sql += ' AND date >= ?';
    params.push(startDate);
  }
  if (endDate) {
    sql += ' AND date <= ?';
    params.push(endDate);
  }

  sql += ' ORDER BY id DESC';
  const transactions = query(sql, params);
  return res.json({ transactions });
});

apiRouter.get('/transactions/:id', authMiddleware, (req: Request, res: Response) => {
  const id = parseInt(req.params.id);
  const transaction = queryOne('SELECT * FROM transactions WHERE id = ?', [id]);
  if (!transaction) return res.status(404).json({ error: 'Transaksi tidak ditemukan' });

  const items = query('SELECT * FROM transaction_items WHERE transaction_id = ?', [id]);
  return res.json({ transaction, items });
});

apiRouter.post('/transactions', authMiddleware, (req: AuthRequest, res: Response) => {
  try {
    const {
      transaction_code,
      type,
      party_name,
      date,
      subtotal,
      tax,
      discount,
      total,
      payment_status,
      payment_method,
      notes,
      items, // array of { product_id, item_name, quantity, unit_price, total_price }
    } = req.body;

    if (!type || !party_name) {
      return res.status(400).json({ error: 'Tipe transaksi dan Nama Pihak Terkait wajib diisi.' });
    }

    // Auto generate code if not supplied
    const code = transaction_code || `TRX-${new Date().getFullYear()}-${String(Date.now()).slice(-5)}`;

    const existing = queryOne('SELECT id FROM transactions WHERE transaction_code = ?', [code]);
    if (existing) {
      return res.status(400).json({ error: `Kode Transaksi ${code} sudah ada.` });
    }

    const calculatedSubtotal = Number(subtotal || 0);
    const calculatedTax = Number(tax || 0);
    const calculatedDiscount = Number(discount || 0);
    const calculatedTotal = Number(total || (calculatedSubtotal + calculatedTax - calculatedDiscount));

    const result = run(`
      INSERT INTO transactions (transaction_code, type, party_name, date, subtotal, tax, discount, total, payment_status, payment_method, notes, created_by)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `, [
      code,
      type,
      party_name,
      date || new Date().toISOString().split('T')[0],
      calculatedSubtotal,
      calculatedTax,
      calculatedDiscount,
      calculatedTotal,
      payment_status || 'PENDING',
      payment_method || 'TRANSFER',
      notes || '',
      req.user?.full_name || 'Admin'
    ]);

    const transactionId = result.lastInsertId!;

    // Insert items & sync inventory
    if (Array.isArray(items) && items.length > 0) {
      for (const item of items) {
        run(`
          INSERT INTO transaction_items (transaction_id, product_id, item_name, quantity, unit_price, total_price)
          VALUES (?, ?, ?, ?, ?, ?)
        `, [
          transactionId,
          item.product_id ? Number(item.product_id) : null,
          item.item_name,
          Number(item.quantity || 1),
          Number(item.unit_price || 0),
          Number(item.total_price || (item.quantity * item.unit_price))
        ]);

        // Auto inventory adjust for Penjualan & Pengadaan
        if (item.product_id) {
          if (type === 'PENJUALAN') {
            run('UPDATE master_products SET stock_quantity = MAX(0, stock_quantity - ?) WHERE id = ?', [Number(item.quantity), item.product_id]);
          } else if (type === 'PENGADAAN') {
            run('UPDATE master_products SET stock_quantity = stock_quantity + ? WHERE id = ?', [Number(item.quantity), item.product_id]);
          }
        }
      }
    }

    logAudit(req.user?.username || 'Admin', 'CREATE', 'TRANSAKSI', transactionId, `Buat transaksi baru ${code} (${type}) senilai Rp ${calculatedTotal.toLocaleString('id-ID')}`);
    return res.status(201).json({ success: true, id: transactionId, transaction_code: code });
  } catch (err: any) {
    return res.status(500).json({ error: err.message });
  }
});

apiRouter.put('/transactions/:id', authMiddleware, (req: AuthRequest, res: Response) => {
  try {
    const id = parseInt(req.params.id);
    const { payment_status, payment_method, notes, party_name, date } = req.body;

    const existing = queryOne<any>('SELECT * FROM transactions WHERE id = ?', [id]);
    if (!existing) return res.status(404).json({ error: 'Transaksi tidak ditemukan' });

    run(`
      UPDATE transactions
      SET payment_status = ?, payment_method = ?, notes = ?, party_name = COALESCE(?, party_name), date = COALESCE(?, date)
      WHERE id = ?
    `, [
      payment_status || existing.payment_status,
      payment_method || existing.payment_method,
      notes !== undefined ? notes : existing.notes,
      party_name,
      date,
      id
    ]);

    logAudit(req.user?.username || 'Admin', 'UPDATE', 'TRANSAKSI', id, `Update status transaksi ${existing.transaction_code}: ${payment_status}`);
    return res.json({ success: true });
  } catch (err: any) {
    return res.status(500).json({ error: err.message });
  }
});

apiRouter.delete('/transactions/:id', authMiddleware, (req: AuthRequest, res: Response) => {
  try {
    const id = parseInt(req.params.id);
    const existing = queryOne<any>('SELECT * FROM transactions WHERE id = ?', [id]);
    if (!existing) return res.status(404).json({ error: 'Transaksi tidak ditemukan' });

    // Optional revert inventory stock if requested
    const items = query<any>('SELECT * FROM transaction_items WHERE transaction_id = ?', [id]);
    for (const item of items) {
      if (item.product_id) {
        if (existing.type === 'PENJUALAN') {
          // Revert sales by adding back
          run('UPDATE master_products SET stock_quantity = stock_quantity + ? WHERE id = ?', [item.quantity, item.product_id]);
        } else if (existing.type === 'PENGADAAN') {
          // Revert purchase by subtracting
          run('UPDATE master_products SET stock_quantity = MAX(0, stock_quantity - ?) WHERE id = ?', [item.quantity, item.product_id]);
        }
      }
    }

    run('DELETE FROM transaction_items WHERE transaction_id = ?', [id]);
    run('DELETE FROM transactions WHERE id = ?', [id]);

    logAudit(req.user?.username || 'Admin', 'DELETE', 'TRANSAKSI', id, `Hapus transaksi ${existing.transaction_code}`);
    return res.json({ success: true });
  } catch (err: any) {
    return res.status(500).json({ error: err.message });
  }
});

// -------------------------------------------------------------
// LAPORAN & ANALITIK (REPORTS & DASHBOARD)
// -------------------------------------------------------------

apiRouter.get('/reports/summary', authMiddleware, (req: Request, res: Response) => {
  try {
    // 1. Total Penjualan LUNAS & PENDING
    const revenueSales = queryOne<{ total: number }>(`
      SELECT COALESCE(SUM(total), 0) as total FROM transactions WHERE type = 'PENJUALAN' AND payment_status != 'BATAL'
    `)?.total || 0;

    // 2. Total Pengeluaran (Pengadaan + Penggajian + Operasional)
    const totalExpenses = queryOne<{ total: number }>(`
      SELECT COALESCE(SUM(total), 0) as total FROM transactions WHERE type IN ('PENGADAAN', 'PENGGAJIAN', 'OPERASIONAL') AND payment_status != 'BATAL'
    `)?.total || 0;

    // 3. Laba Bersih Operasional
    const netProfit = revenueSales - totalExpenses;

    // 4. Counts
    const employeeCount = queryOne<{ count: number }>('SELECT COUNT(*) as count FROM master_employees WHERE status != "NONAKTIF"')?.count || 0;
    const productCount = queryOne<{ count: number }>('SELECT COUNT(*) as count FROM master_products WHERE status = "AKTIF"')?.count || 0;
    const lowStockCount = queryOne<{ count: number }>('SELECT COUNT(*) as count FROM master_products WHERE stock_quantity <= min_stock')?.count || 0;
    const clientCount = queryOne<{ count: number }>('SELECT COUNT(*) as count FROM master_clients WHERE status = "AKTIF"')?.count || 0;
    const pendingTransactionsCount = queryOne<{ count: number }>('SELECT COUNT(*) as count FROM transactions WHERE payment_status = "PENDING"')?.count || 0;

    // 5. Total Asset Inventory Value
    const inventoryValuation = queryOne<{ total: number }>(`
      SELECT COALESCE(SUM(cost_price * stock_quantity), 0) as total FROM master_products
    `)?.total || 0;

    // 6. Recent Transactions
    const recentTransactions = query('SELECT * FROM transactions ORDER BY id DESC LIMIT 6');

    // 7. Low stock items
    const lowStockItems = query('SELECT id, sku, name, stock_quantity, min_stock, category FROM master_products WHERE stock_quantity <= min_stock ORDER BY stock_quantity ASC LIMIT 5');

    // 8. Breakdown by transaction types
    const typeBreakdown = query(`
      SELECT type, COUNT(*) as count, COALESCE(SUM(total), 0) as total_amount
      FROM transactions
      WHERE payment_status != 'BATAL'
      GROUP BY type
    `);

    return res.json({
      revenueSales,
      totalExpenses,
      netProfit,
      employeeCount,
      productCount,
      lowStockCount,
      clientCount,
      pendingTransactionsCount,
      inventoryValuation,
      recentTransactions,
      lowStockItems,
      typeBreakdown,
    });
  } catch (err: any) {
    return res.status(500).json({ error: err.message });
  }
});

apiRouter.get('/reports/income-statement', authMiddleware, (req: Request, res: Response) => {
  try {
    const { startDate, endDate } = req.query;
    let dateFilter = '';
    const params: any[] = [];
    if (startDate && endDate) {
      dateFilter = ' AND date BETWEEN ? AND ?';
      params.push(startDate, endDate);
    }

    const sales = queryOne<{ total: number }>(`SELECT COALESCE(SUM(total), 0) as total FROM transactions WHERE type = 'PENJUALAN' AND payment_status != 'BATAL' ${dateFilter}`, params)?.total || 0;
    const cogs = queryOne<{ total: number }>(`SELECT COALESCE(SUM(total), 0) as total FROM transactions WHERE type = 'PENGADAAN' AND payment_status != 'BATAL' ${dateFilter}`, params)?.total || 0;
    const payroll = queryOne<{ total: number }>(`SELECT COALESCE(SUM(total), 0) as total FROM transactions WHERE type = 'PENGGAJIAN' AND payment_status != 'BATAL' ${dateFilter}`, params)?.total || 0;
    const operational = queryOne<{ total: number }>(`SELECT COALESCE(SUM(total), 0) as total FROM transactions WHERE type = 'OPERASIONAL' AND payment_status != 'BATAL' ${dateFilter}`, params)?.total || 0;

    const grossProfit = sales - cogs;
    const totalExpenses = payroll + operational;
    const netIncome = grossProfit - totalExpenses;

    return res.json({
      sales,
      cogs,
      grossProfit,
      payroll,
      operational,
      totalExpenses,
      netIncome,
    });
  } catch (err: any) {
    return res.status(500).json({ error: err.message });
  }
});

apiRouter.get('/reports/inventory-valuation', authMiddleware, (req: Request, res: Response) => {
  try {
    const items = query(`
      SELECT id, sku, name, category, unit, cost_price, selling_price, stock_quantity, min_stock,
             (cost_price * stock_quantity) as total_cost_value,
             (selling_price * stock_quantity) as total_sales_value,
             ((selling_price - cost_price) * stock_quantity) as potential_profit
      FROM master_products
      ORDER BY total_cost_value DESC
    `);
    return res.json({ items });
  } catch (err: any) {
    return res.status(500).json({ error: err.message });
  }
});

apiRouter.get('/reports/payroll', authMiddleware, (req: Request, res: Response) => {
  try {
    const summary = query(`
      SELECT d.name as department_name, d.code as department_code,
             COUNT(e.id) as total_employees,
             COALESCE(SUM(e.salary), 0) as total_salary,
             COALESCE(AVG(e.salary), 0) as average_salary
      FROM master_departments d
      LEFT JOIN master_employees e ON d.id = e.department_id AND e.status != 'NONAKTIF'
      GROUP BY d.id
      ORDER BY total_salary DESC
    `);
    return res.json({ summary });
  } catch (err: any) {
    return res.status(500).json({ error: err.message });
  }
});

// -------------------------------------------------------------
// COMPANY PROFILE & SYSTEM STATUS
// -------------------------------------------------------------

apiRouter.get('/company/profile', authMiddleware, (req: Request, res: Response) => {
  const profile = queryOne('SELECT * FROM company_profile WHERE id = 1');
  return res.json({ profile });
});

apiRouter.put('/company/profile', authMiddleware, (req: AuthRequest, res: Response) => {
  try {
    if (req.user?.role !== 'ADMIN') {
      return res.status(403).json({ error: 'Hanya Admin yang berhak mengubah profil perusahaan.' });
    }
    const { name, legal_name, npwp, email, phone, address, website, currency } = req.body;
    run(`
      UPDATE company_profile
      SET name = ?, legal_name = ?, npwp = ?, email = ?, phone = ?, address = ?, website = ?, currency = ?
      WHERE id = 1
    `, [name, legal_name, npwp, email, phone, address, website, currency || 'IDR']);

    logAudit(req.user.username, 'UPDATE', 'COMPANY_PROFILE', 1, 'Memperbarui profil perusahaan');
    return res.json({ success: true });
  } catch (err: any) {
    return res.status(500).json({ error: err.message });
  }
});

apiRouter.get('/system/status', authMiddleware, (req: Request, res: Response) => {
  const DB_FILE = path.resolve(process.cwd(), 'data', 'company.sqlite');
  let fileSizeKb = 0;
  if (fs.existsSync(DB_FILE)) {
    const stat = fs.statSync(DB_FILE);
    fileSizeKb = Math.round(stat.size / 1024);
  }

  const userCount = queryOne<{ count: number }>('SELECT COUNT(*) as count FROM users')?.count || 0;
  const empCount = queryOne<{ count: number }>('SELECT COUNT(*) as count FROM master_employees')?.count || 0;
  const prodCount = queryOne<{ count: number }>('SELECT COUNT(*) as count FROM master_products')?.count || 0;
  const deptCount = queryOne<{ count: number }>('SELECT COUNT(*) as count FROM master_departments')?.count || 0;
  const clientCount = queryOne<{ count: number }>('SELECT COUNT(*) as count FROM master_clients')?.count || 0;
  const txCount = queryOne<{ count: number }>('SELECT COUNT(*) as count FROM transactions')?.count || 0;
  const auditCount = queryOne<{ count: number }>('SELECT COUNT(*) as count FROM audit_logs')?.count || 0;

  return res.json({
    engine: 'SQLite (sql.js / WebAssembly)',
    storage: 'Local Disk Persistent Binary (.sqlite)',
    dbFilePath: 'data/company.sqlite',
    fileSizeKb,
    tables: {
      users: userCount,
      master_employees: empCount,
      master_products: prodCount,
      master_departments: deptCount,
      master_clients: clientCount,
      transactions: txCount,
      audit_logs: auditCount,
    },
    uptimeSeconds: Math.floor(process.uptime()),
    timestamp: new Date().toISOString()
  });
});

apiRouter.get('/audit-logs', authMiddleware, (req: Request, res: Response) => {
  const logs = query('SELECT * FROM audit_logs ORDER BY id DESC LIMIT 50');
  return res.json({ logs });
});
