import initSqlJs, { Database, SqlJsStatic } from 'sql.js';
import fs from 'fs';
import path from 'path';
import bcrypt from 'bcryptjs';

const DATA_DIR = path.resolve(process.cwd(), 'data');
const DB_FILE = path.join(DATA_DIR, 'company.sqlite');

let db: Database;
let SQL: SqlJsStatic;

export async function initDatabase(): Promise<Database> {
  if (db) return db;

  if (!fs.existsSync(DATA_DIR)) {
    fs.mkdirSync(DATA_DIR, { recursive: true });
  }

  SQL = await initSqlJs();

  if (fs.existsSync(DB_FILE)) {
    try {
      const fileBuffer = fs.readFileSync(DB_FILE);
      db = new SQL.Database(fileBuffer);
      console.log('Loaded existing SQLite database from', DB_FILE);
    } catch (e) {
      console.error('Failed to load SQLite file, creating new database', e);
      db = new SQL.Database();
    }
  } else {
    console.log('Creating new SQLite database at', DB_FILE);
    db = new SQL.Database();
  }

  // Create tables if not exist
  db.run(`
    CREATE TABLE IF NOT EXISTS users (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      username TEXT UNIQUE NOT NULL,
      email TEXT UNIQUE NOT NULL,
      password_hash TEXT NOT NULL,
      full_name TEXT NOT NULL,
      role TEXT NOT NULL DEFAULT 'STAFF',
      phone TEXT,
      avatar_url TEXT,
      status TEXT DEFAULT 'AKTIF',
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      last_login DATETIME
    );

    CREATE TABLE IF NOT EXISTS master_departments (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      code TEXT UNIQUE NOT NULL,
      name TEXT NOT NULL,
      head_name TEXT,
      budget REAL DEFAULT 0,
      location TEXT,
      description TEXT,
      status TEXT DEFAULT 'AKTIF',
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS master_employees (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      employee_code TEXT UNIQUE NOT NULL,
      name TEXT NOT NULL,
      email TEXT,
      phone TEXT,
      department_id INTEGER,
      position TEXT NOT NULL,
      salary REAL DEFAULT 0,
      join_date TEXT,
      status TEXT DEFAULT 'TETAP',
      address TEXT,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS master_products (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      sku TEXT UNIQUE NOT NULL,
      name TEXT NOT NULL,
      category TEXT NOT NULL,
      unit TEXT DEFAULT 'Pcs',
      cost_price REAL DEFAULT 0,
      selling_price REAL DEFAULT 0,
      stock_quantity INTEGER DEFAULT 0,
      min_stock INTEGER DEFAULT 5,
      supplier_name TEXT,
      status TEXT DEFAULT 'AKTIF',
      description TEXT,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS master_clients (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      client_code TEXT UNIQUE NOT NULL,
      company_name TEXT NOT NULL,
      contact_person TEXT,
      email TEXT,
      phone TEXT,
      address TEXT,
      tax_id TEXT,
      status TEXT DEFAULT 'AKTIF',
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS master_suppliers (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      supplier_code TEXT UNIQUE NOT NULL,
      company_name TEXT NOT NULL,
      contact_person TEXT,
      email TEXT,
      phone TEXT,
      address TEXT,
      category TEXT,
      status TEXT DEFAULT 'AKTIF',
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS transactions (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      transaction_code TEXT UNIQUE NOT NULL,
      type TEXT NOT NULL, -- PENJUALAN, PENGADAAN, PENGGAJIAN, OPERASIONAL
      party_name TEXT NOT NULL,
      date TEXT NOT NULL,
      subtotal REAL DEFAULT 0,
      tax REAL DEFAULT 0,
      discount REAL DEFAULT 0,
      total REAL DEFAULT 0,
      payment_status TEXT DEFAULT 'PENDING', -- LUNAS, PENDING, BATAL
      payment_method TEXT DEFAULT 'TRANSFER',
      notes TEXT,
      created_by TEXT,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS transaction_items (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      transaction_id INTEGER NOT NULL,
      product_id INTEGER,
      item_name TEXT NOT NULL,
      quantity INTEGER NOT NULL,
      unit_price REAL NOT NULL,
      total_price REAL NOT NULL
    );

    CREATE TABLE IF NOT EXISTS audit_logs (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      user_name TEXT NOT NULL,
      action TEXT NOT NULL,
      module TEXT NOT NULL,
      record_id TEXT,
      details TEXT,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS company_profile (
      id INTEGER PRIMARY KEY,
      name TEXT NOT NULL,
      legal_name TEXT,
      npwp TEXT,
      email TEXT,
      phone TEXT,
      address TEXT,
      website TEXT,
      currency TEXT DEFAULT 'IDR'
    );
  `);

  // Seed default data if empty
  await seedInitialData();

  saveDatabase();
  return db;
}

export function saveDatabase() {
  if (!db) return;
  try {
    const data = db.export();
    const buffer = Buffer.from(data);
    fs.writeFileSync(DB_FILE, buffer);
  } catch (err) {
    console.error('Failed to save SQLite database to disk:', err);
  }
}

export function query<T = any>(sql: string, params: any[] = []): T[] {
  if (!db) throw new Error('Database not initialized');
  const stmt = db.prepare(sql);
  stmt.bind(params);
  const results: T[] = [];
  while (stmt.step()) {
    results.push(stmt.getAsObject() as T);
  }
  stmt.free();
  return results;
}

export function queryOne<T = any>(sql: string, params: any[] = []): T | null {
  const rows = query<T>(sql, params);
  return rows.length > 0 ? rows[0] : null;
}

export function run(sql: string, params: any[] = []): { changes: number; lastInsertId?: number } {
  if (!db) throw new Error('Database not initialized');
  db.run(sql, params);
  const changes = db.getRowsModified();
  const idResult = queryOne<{ id: number }>('SELECT last_insert_rowid() AS id');
  saveDatabase();
  return { changes, lastInsertId: idResult ? idResult.id : undefined };
}

export function logAudit(userName: string, action: string, module: string, recordId: string | number, details: string) {
  try {
    run(
      'INSERT INTO audit_logs (user_name, action, module, record_id, details) VALUES (?, ?, ?, ?, ?)',
      [userName, action, module, String(recordId), details]
    );
  } catch (e) {
    console.error('Failed to write audit log:', e);
  }
}

async function seedInitialData() {
  const usersCount = queryOne<{ count: number }>('SELECT COUNT(*) as count FROM users');
  if (usersCount && usersCount.count > 0) return;

  console.log('Seeding initial company data into SQLite database...');

  // Company Profile
  db.run(`
    INSERT OR REPLACE INTO company_profile (id, name, legal_name, npwp, email, phone, address, website, currency)
    VALUES (
      1,
      'PT Nusantara Megah Perkasa',
      'PT Nusantara Megah Perkasa Tbk.',
      '01.884.293.4-054.000',
      'kontak@nusantaramegah.co.id',
      '(021) 582-9090',
      'Gedung Wisma Perkasa Lt. 18, Jl. Jend. Sudirman Kav. 45, Jakarta Selatan',
      'www.nusantaramegah.co.id',
      'IDR'
    );
  `);

  // Default Users
  const adminPasswordHash = await bcrypt.hash('admin123', 10);
  const keuanganPasswordHash = await bcrypt.hash('keuangan123', 10);
  const staffPasswordHash = await bcrypt.hash('staff123', 10);

  db.run(`
    INSERT INTO users (username, email, password_hash, full_name, role, phone, status)
    VALUES 
      ('admin', 'admin@perusahaan.co.id', '${adminPasswordHash}', 'Raden Hendra Wibowo', 'ADMIN', '081298765432', 'AKTIF'),
      ('keuangan', 'keuangan@perusahaan.co.id', '${keuanganPasswordHash}', 'Siti Rahmawati, S.E.', 'MANAGER', '081387654321', 'AKTIF'),
      ('staff', 'staff@perusahaan.co.id', '${staffPasswordHash}', 'Budi Santoso', 'STAFF', '081576543210', 'AKTIF');
  `);

  // Master Departemen
  db.run(`
    INSERT INTO master_departments (code, name, head_name, budget, location, description, status)
    VALUES
      ('DEP-OPS', 'Operasional & Produksi', 'Ir. Bambang Soeprapto', 450000000, 'Gudang Utama & Pabrik Lt. 1', 'Divisi penanggung jawab alur kerja operasional dan produksi', 'AKTIF'),
      ('DEP-FIN', 'Keuangan & Akuntansi', 'Siti Rahmawati, S.E.', 180000000, 'Gedung Wisma Lt. 18 - Sayap Barat', 'Pengelolaan arus kas, pembukuan, kepatuhan pajak, dan budgeting', 'AKTIF'),
      ('DEP-IT', 'Teknologi & Sistem Informasi', 'Raden Hendra Wibowo', 220000000, 'Gedung Wisma Lt. 18 - Sayap Timur', 'Pengembangan infrastruktur digital, database, dan security', 'AKTIF'),
      ('DEP-MKT', 'Pemasaran & Penjualan', 'Clarissa Putri, B.B.A.', 320000000, 'Gedung Wisma Lt. 17', 'Divisi ekspansi pasar, akuisisi pelanggan B2B dan tender korporat', 'AKTIF'),
      ('DEP-HRD', 'Sumber Daya Manusia (HR)', 'Drs. Ananta Wijaya', 150000000, 'Gedung Wisma Lt. 18 - R. 1804', 'Rekrutmen, pengembangan kompetensi, payroll dan hubungan industrial', 'AKTIF');
  `);

  // Master Karyawan
  db.run(`
    INSERT INTO master_employees (employee_code, name, email, phone, department_id, position, salary, join_date, status, address)
    VALUES
      ('EMP-001', 'Raden Hendra Wibowo', 'hendra@nusantaramegah.co.id', '081298765432', 3, 'IT & Systems Director', 28500000, '2021-03-01', 'TETAP', 'Kebayoran Baru, Jakarta Selatan'),
      ('EMP-002', 'Siti Rahmawati, S.E.', 'siti.keuangan@nusantaramegah.co.id', '081387654321', 2, 'Finance Manager', 21000000, '2021-06-15', 'TETAP', 'Bintaro Jaya Sektor 7, Tangerang Selatan'),
      ('EMP-003', 'Clarissa Putri, B.B.A.', 'clarissa.mkt@nusantaramegah.co.id', '081211223344', 4, 'Sales & Marketing Head', 19500000, '2022-01-10', 'TETAP', 'Menteng, Jakarta Pusat'),
      ('EMP-004', 'Ir. Bambang Soeprapto', 'bambang.ops@nusantaramegah.co.id', '081399887766', 1, 'Head of Operations', 22000000, '2020-08-01', 'TETAP', 'Bekasi Barat, Jawa Barat'),
      ('EMP-005', 'Budi Santoso', 'budi.santoso@nusantaramegah.co.id', '081576543210', 1, 'Senior Operations Officer', 11500000, '2022-09-01', 'TETAP', 'Depok Timur, Jawa Barat'),
      ('EMP-006', 'Fadhil Pratama', 'fadhil.it@nusantaramegah.co.id', '081900112233', 3, 'Fullstack Engineer', 14000000, '2023-04-12', 'TETAP', 'Tebet, Jakarta Selatan'),
      ('EMP-007', 'Dewi Anggraini', 'dewi.hrd@nusantaramegah.co.id', '085712345678', 5, 'People & Talent Specialist', 10500000, '2023-08-20', 'TETAP', 'Kelapa Gading, Jakarta Utara'),
      ('EMP-008', 'Rian Hidayat', 'rian.mkt@nusantaramegah.co.id', '087812344321', 4, 'Account Executive B2B', 9800000, '2024-02-01', 'KONTRAK', 'Ciputat, Tangerang Selatan');
  `);

  // Master Produk & Inventaris
  db.run(`
    INSERT INTO master_products (sku, name, category, unit, cost_price, selling_price, stock_quantity, min_stock, supplier_name, status, description)
    VALUES
      ('PRD-SRV-01', 'Server Rack 42U Enterprise Xeon', 'Infrastruktur IT', 'Unit', 38000000, 52000000, 8, 3, 'PT Delta Tekno Distribusi', 'AKTIF', 'Rack server data center dengan redundant dual power supply & smart cooling'),
      ('PRD-LPT-02', 'ThinkPad P16 Workstation Gen 2', 'Perangkat Keras', 'Unit', 24500000, 31800000, 14, 4, 'PT Global Distribusi Komputer', 'AKTIF', 'Laptop workstation arsitek & engineer dengan Nvidia RTX GPU'),
      ('PRD-SWT-03', 'Cisco Catalyst 48-Port PoE+ Switch', 'Jaringan', 'Unit', 16500000, 22500000, 12, 5, 'PT Sinergi Network Solusindo', 'AKTIF', 'Switch jaringan L3 managed gigabit dengan fitur enterprise QoS'),
      ('PRD-UPS-04', 'APC Smart-UPS On-Line 5kVA', 'Power Supply', 'Unit', 18200000, 25000000, 4, 3, 'PT Daya Prima Mandiri', 'AKTIF', 'UPS daya cadangan ganda untuk ruang server zero-downtime'),
      ('PRD-ACC-05', 'Kabel Fiber Optic Single Mode 100m', 'Aksesoris Jaringan', 'Roll', 850000, 1350000, 45, 10, 'PT Sinergi Network Solusindo', 'AKTIF', 'Kabel fiber optic outdoor armored LSZH heavy duty'),
      ('PRD-SFT-06', 'Lisensi ERP Enterprise Core (Tahunan)', 'Software & Cloud', 'Lisensi', 6000000, 9500000, 50, 5, 'PT Inovasi Sistem Digital', 'AKTIF', 'Paket langganan software ERP cloud 50 user active concurrently'),
      ('PRD-SEC-07', 'Next-Gen Firewall Appliance 10Gbps', 'Security', 'Unit', 42000000, 58000000, 2, 2, 'PT Delta Tekno Distribusi', 'AKTIF', 'Hardware firewall dengan deep packet inspection dan IPS');
  `);

  // Master Klien / Pelanggan
  db.run(`
    INSERT INTO master_clients (client_code, company_name, contact_person, email, phone, address, tax_id, status)
    VALUES
      ('CLN-001', 'PT Bank Mandiri Sentosa Tbk.', 'Bpk. Irfan Maulana', 'procurement@mandirisentosa.co.id', '(021) 529-8800', 'Plaza Mandiri Sentosa Lt. 24, Jl. Gatot Subroto, Jakarta', '01.234.567.8-011.000', 'AKTIF'),
      ('CLN-002', 'PT Telekomunikasi Samudera Digital', 'Ibu Maya Lestari', 'vendor@samuderadigital.id', '(021) 791-2300', 'Samudera Tower Lt. 10, MT Haryono Kav. 30, Jakarta', '01.445.678.9-014.000', 'AKTIF'),
      ('CLN-003', 'RS Siloam Citra Husada', 'dr. Gunawan Santika, MARS', 'logistik@silocitrahusada.com', '(021) 808-7654', 'Jl. Boulevard Artha Gading No. 12, Jakarta Utara', '02.998.776.5-018.000', 'AKTIF'),
      ('CLN-004', 'PT Astra Logistik Distribusi', 'Bpk. Heri Prabowo', 'supplychain@astralogistik.co.id', '(021) 651-9988', 'Kawasan Industri Sunter II, Jakarta Utara', '01.887.665.4-023.000', 'AKTIF');
  `);

  // Master Supplier / Vendor
  db.run(`
    INSERT INTO master_suppliers (supplier_code, company_name, contact_person, email, phone, address, category, status)
    VALUES
      ('SUP-001', 'PT Delta Tekno Distribusi', 'Bpk. Steven Chandra', 'sales@deltatekno.co.id', '(021) 628-9000', 'Mangga Dua Mall Lt. 4 No. 28, Jakarta Pusat', 'Distributor IT Hardware', 'AKTIF'),
      ('SUP-002', 'PT Sinergi Network Solusindo', 'Ibu Diana Rosita', 'corporate@sinerginet.id', '(021) 579-4321', 'Kuningan Mega Kuningan Barat Kav. 12, Jakarta', 'Perangkat Jaringan', 'AKTIF'),
      ('SUP-003', 'PT Daya Prima Mandiri', 'Bpk. Rudi Hartono', 'order@dayaprima.co.id', '(021) 837-1234', 'Ruko Sentra Niaga Kalimalang No. 8, Bekasi', 'Power Protection & UPS', 'AKTIF'),
      ('SUP-004', 'PT Inovasi Sistem Digital', 'Bpk. Andre Kusuma', 'partner@inovasidigital.com', '(021) 293-8877', 'BSD Green Office Park 6, Tangerang', 'Cloud & Software Solution', 'AKTIF');
  `);

  // Sample Transactions
  db.run(`
    INSERT INTO transactions (transaction_code, type, party_name, date, subtotal, tax, discount, total, payment_status, payment_method, notes, created_by)
    VALUES
      ('TRX-2026-001', 'PENJUALAN', 'PT Bank Mandiri Sentosa Tbk.', '2026-10-15', 104000000, 11440000, 2000000, 113440000, 'LUNAS', 'TRANSFER', 'Pengadaan 2 unit Server Rack Enterprise untuk Data Center Surabaya', 'Raden Hendra Wibowo'),
      ('TRX-2026-002', 'PENJUALAN', 'PT Telekomunikasi Samudera Digital', '2026-10-17', 63600000, 6996000, 1000000, 69596000, 'PENDING', 'TRANSFER', 'Pesanan 2 unit ThinkPad P16 Workstation untuk tim IT Engineering', 'Clarissa Putri, B.B.A.'),
      ('TRX-2026-003', 'PENGADAAN', 'PT Delta Tekno Distribusi', '2026-10-10', 76000000, 8360000, 0, 84360000, 'LUNAS', 'TRANSFER', 'Restock 2 unit Server Rack 42U dari distributor resmi', 'Budi Santoso'),
      ('TRX-2026-004', 'PENGGAJIAN', 'Divisi IT & Finansial', '2026-10-01', 49500000, 0, 0, 49500000, 'LUNAS', 'TRANSFER', 'Gaji bulanan pegawai divisi teknologi dan keuangan periode Oktober 2026', 'Siti Rahmawati, S.E.'),
      ('TRX-2026-005', 'OPERASIONAL', 'PLN & Gedung Wisma Perkasa', '2026-10-05', 18500000, 2035000, 0, 20535000, 'LUNAS', 'TRANSFER', 'Biaya sewa kantor, listrik data center, dan maintenance AC gedung', 'Siti Rahmawati, S.E.');
  `);

  // Sample Transaction Items
  db.run(`
    INSERT INTO transaction_items (transaction_id, product_id, item_name, quantity, unit_price, total_price)
    VALUES
      (1, 1, 'Server Rack 42U Enterprise Xeon', 2, 52000000, 104000000),
      (2, 2, 'ThinkPad P16 Workstation Gen 2', 2, 31800000, 63600000),
      (3, 1, 'Server Rack 42U Enterprise Xeon', 2, 38000000, 76000000);
  `);

  // Initial Audit Logs
  db.run(`
    INSERT INTO audit_logs (user_name, action, module, record_id, details)
    VALUES
      ('System', 'INITIALIZE', 'DATABASE', '1', 'Inisialisasi sistem database SQLite perusahaan berhasil'),
      ('admin', 'LOGIN', 'AUTH', '1', 'Administrator sistem berhasil melakukan autentikasi login awal');
  `);

  console.log('Database initialization & seeding completed successfully.');
}
