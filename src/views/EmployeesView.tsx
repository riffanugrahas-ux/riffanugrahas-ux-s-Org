import React, { useState, useEffect } from 'react';
import { Employee, Department } from '../types';
import { api, formatRupiah, formatDate } from '../services/api';
import { DeleteModal } from '../components/DeleteModal';
import {
  Users,
  UserPlus,
  Search,
  Filter,
  Edit2,
  Trash2,
  Download,
  Mail,
  Phone,
  Building,
  CheckCircle2,
  AlertCircle,
  X
} from 'lucide-react';

export const EmployeesView: React.FC = () => {
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [departments, setDepartments] = useState<Department[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [selectedDept, setSelectedDept] = useState('');
  const [selectedStatus, setSelectedStatus] = useState('');

  // Modal states
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [modalMode, setModalMode] = useState<'create' | 'edit'>('create');
  const [editingId, setEditingId] = useState<number | null>(null);

  // Form states
  const [formEmployeeCode, setFormEmployeeCode] = useState('');
  const [formName, setFormName] = useState('');
  const [formEmail, setFormEmail] = useState('');
  const [formPhone, setFormPhone] = useState('');
  const [formDeptId, setFormDeptId] = useState<string>('');
  const [formPosition, setFormPosition] = useState('');
  const [formSalary, setFormSalary] = useState<string>('0');
  const [formJoinDate, setFormJoinDate] = useState(new Date().toISOString().split('T')[0]);
  const [formStatus, setFormStatus] = useState<'TETAP' | 'KONTRAK' | 'MAGANG'>('TETAP');
  const [formAddress, setFormAddress] = useState('');
  const [formError, setFormError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Delete modal state
  const [deleteTarget, setDeleteTarget] = useState<Employee | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  // Success flash message
  const [toastMsg, setToastMsg] = useState('');

  const showToast = (msg: string) => {
    setToastMsg(msg);
    setTimeout(() => setToastMsg(''), 3000);
  };

  const loadData = async () => {
    try {
      setLoading(true);
      const [empRes, deptRes] = await Promise.all([
        api.getEmployees({
          search: search || undefined,
          department_id: selectedDept || undefined,
          status: selectedStatus || undefined,
        }),
        api.getDepartments(),
      ]);
      setEmployees(empRes.employees);
      setDepartments(deptRes.departments);
    } catch (err: any) {
      console.error('Error fetching employees:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, [search, selectedDept, selectedStatus]);

  const handleOpenCreate = () => {
    setModalMode('create');
    setEditingId(null);
    setFormEmployeeCode(`EMP-${String(Math.floor(100 + Math.random() * 900))}`);
    setFormName('');
    setFormEmail('');
    setFormPhone('');
    setFormDeptId(departments.length > 0 ? String(departments[0].id) : '');
    setFormPosition('');
    setFormSalary('10000000');
    setFormJoinDate(new Date().toISOString().split('T')[0]);
    setFormStatus('TETAP');
    setFormAddress('');
    setFormError('');
    setIsModalOpen(true);
  };

  const handleOpenEdit = (emp: Employee) => {
    setModalMode('edit');
    setEditingId(emp.id);
    setFormEmployeeCode(emp.employee_code);
    setFormName(emp.name);
    setFormEmail(emp.email || '');
    setFormPhone(emp.phone || '');
    setFormDeptId(emp.department_id ? String(emp.department_id) : '');
    setFormPosition(emp.position);
    setFormSalary(String(emp.salary));
    setFormJoinDate(emp.join_date || new Date().toISOString().split('T')[0]);
    setFormStatus((emp.status as any) || 'TETAP');
    setFormAddress(emp.address || '');
    setFormError('');
    setIsModalOpen(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formEmployeeCode || !formName || !formPosition) {
      setFormError('Kode Karyawan, Nama, dan Posisi/Jabatan wajib diisi.');
      return;
    }

    setIsSubmitting(true);
    setFormError('');

    try {
      const payload: Partial<Employee> = {
        employee_code: formEmployeeCode,
        name: formName,
        email: formEmail,
        phone: formPhone,
        department_id: formDeptId ? Number(formDeptId) : null,
        position: formPosition,
        salary: Number(formSalary) || 0,
        join_date: formJoinDate,
        status: formStatus,
        address: formAddress,
      };

      if (modalMode === 'create') {
        await api.createEmployee(payload);
        showToast('Karyawan baru berhasil ditambahkan ke database!');
      } else if (editingId) {
        await api.updateEmployee(editingId, payload);
        showToast('Data karyawan berhasil diperbarui!');
      }

      setIsModalOpen(false);
      loadData();
    } catch (err: any) {
      setFormError(err.message || 'Gagal menyimpan data karyawan.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDeleteConfirm = async () => {
    if (!deleteTarget) return;
    setIsDeleting(true);
    try {
      await api.deleteEmployee(deleteTarget.id);
      showToast(`Karyawan "${deleteTarget.name}" berhasil dihapus.`);
      setDeleteTarget(null);
      loadData();
    } catch (err: any) {
      alert(err.message || 'Gagal menghapus karyawan.');
    } finally {
      setIsDeleting(false);
    }
  };

  const exportCSV = () => {
    if (employees.length === 0) return;
    const headers = ['ID', 'NIK/Kode', 'Nama Lengkap', 'Jabatan', 'Departemen', 'Gaji Pokok', 'Status', 'Tanggal Gabung', 'Email', 'Telepon'];
    const rows = employees.map(e => [
      e.id,
      `"${e.employee_code}"`,
      `"${e.name}"`,
      `"${e.position}"`,
      `"${e.department_name || '-'}"`,
      e.salary,
      `"${e.status}"`,
      `"${e.join_date}"`,
      `"${e.email || '-'}"`,
      `"${e.phone || '-'}"`,
    ]);

    const csvContent = 'data:text/csv;charset=utf-8,' + [headers.join(','), ...rows.map(r => r.join(','))].join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `data_karyawan_${new Date().toISOString().split('T')[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="space-y-6">
      {/* Toast Notification */}
      {toastMsg && (
        <div className="fixed bottom-6 right-6 z-50 p-4 rounded-xl bg-emerald-600 text-white shadow-xl flex items-center gap-2 animate-bounce">
          <CheckCircle2 className="w-5 h-5" />
          <span className="text-xs font-semibold">{toastMsg}</span>
        </div>
      )}

      {/* Header View */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-2xl font-bold text-white tracking-tight">Master Data Karyawan</h1>
            <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-blue-500/10 text-blue-400 border border-blue-500/20 font-mono">
              {employees.length} Orang
            </span>
          </div>
          <p className="text-xs text-slate-400 mt-1">
            Pengelolaan biodata staf, struktur jabatan departemen, status kerja, dan nominal gaji.
          </p>
        </div>

        <div className="flex items-center gap-2.5">
          <button
            onClick={exportCSV}
            className="py-2.5 px-3.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold flex items-center gap-2 border border-slate-700 cursor-pointer"
          >
            <Download className="w-4 h-4" />
            <span className="hidden sm:inline">Ekspor CSV</span>
          </button>

          <button
            onClick={handleOpenCreate}
            className="py-2.5 px-4 rounded-xl bg-blue-600 hover:bg-blue-500 text-white text-xs font-semibold flex items-center gap-2 shadow-lg shadow-blue-600/30 transition-all cursor-pointer"
          >
            <UserPlus className="w-4 h-4" />
            <span>Tambah Karyawan</span>
          </button>
        </div>
      </div>

      {/* Filter & Search Bar */}
      <div className="p-4 rounded-2xl bg-slate-900/90 border border-slate-800 flex flex-col md:flex-row gap-3 items-center justify-between">
        <div className="relative w-full md:w-80">
          <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Cari nama, kode, email, jabatan..."
            className="w-full pl-10 pr-4 py-2 bg-slate-950 border border-slate-700 rounded-xl text-xs text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>

        <div className="flex flex-wrap items-center gap-2.5 w-full md:w-auto">
          <div className="flex items-center gap-2">
            <Filter className="w-4 h-4 text-slate-400 hidden sm:block" />
            <select
              value={selectedDept}
              onChange={(e) => setSelectedDept(e.target.value)}
              className="px-3 py-2 bg-slate-950 border border-slate-700 rounded-xl text-xs text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="">Semua Departemen</option>
              {departments.map((d) => (
                <option key={d.id} value={d.id}>
                  {d.name}
                </option>
              ))}
            </select>
          </div>

          <select
            value={selectedStatus}
            onChange={(e) => setSelectedStatus(e.target.value)}
            className="px-3 py-2 bg-slate-950 border border-slate-700 rounded-xl text-xs text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="">Semua Status</option>
            <option value="TETAP">Karyawan Tetap</option>
            <option value="KONTRAK">PKWT / Kontrak</option>
            <option value="MAGANG">Magang</option>
          </select>
        </div>
      </div>

      {/* Employees Table Card */}
      <div className="bg-slate-900/90 border border-slate-800 rounded-2xl overflow-hidden shadow-xl">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead>
              <tr className="border-b border-slate-800 bg-slate-950/60 text-slate-400 font-semibold uppercase text-[10px] tracking-wider">
                <th className="py-3 px-4">Karyawan</th>
                <th className="py-3 px-4">Departemen & Jabatan</th>
                <th className="py-3 px-4">Kontak</th>
                <th className="py-3 px-4 text-right">Gaji Pokok</th>
                <th className="py-3 px-4 text-center">Status</th>
                <th className="py-3 px-4 text-right">Aksi (CRUD)</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60">
              {loading ? (
                <tr>
                  <td colSpan={6} className="py-12 text-center text-slate-400">
                    <div className="w-6 h-6 border-2 border-blue-500 border-t-transparent rounded-full animate-spin mx-auto mb-2" />
                    Memuat data karyawan dari database SQLite...
                  </td>
                </tr>
              ) : employees.length === 0 ? (
                <tr>
                  <td colSpan={6} className="py-12 text-center text-slate-400">
                    Tidak ada data karyawan yang cocok dengan kriteria pencarian.
                  </td>
                </tr>
              ) : (
                employees.map((emp) => (
                  <tr key={emp.id} className="hover:bg-slate-800/40 transition-colors">
                    {/* Employee Identity */}
                    <td className="py-3.5 px-4">
                      <div className="flex items-center gap-3">
                        <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-blue-600 to-indigo-600 text-white font-bold flex items-center justify-center text-xs shadow-inner">
                          {emp.name.charAt(0)}
                        </div>
                        <div>
                          <div className="font-semibold text-white text-xs">{emp.name}</div>
                          <div className="font-mono text-[11px] text-blue-400">{emp.employee_code}</div>
                        </div>
                      </div>
                    </td>

                    {/* Department & Position */}
                    <td className="py-3.5 px-4">
                      <div className="font-medium text-slate-200">{emp.position}</div>
                      <div className="text-[11px] text-slate-400 flex items-center gap-1 mt-0.5">
                        <Building className="w-3 h-3 text-slate-500" />
                        <span>{emp.department_name || 'Umum'}</span>
                      </div>
                    </td>

                    {/* Contact */}
                    <td className="py-3.5 px-4">
                      <div className="text-slate-300 text-[11px] flex items-center gap-1.5">
                        <Mail className="w-3 h-3 text-slate-400" />
                        <span>{emp.email || '-'}</span>
                      </div>
                      <div className="text-slate-400 text-[11px] flex items-center gap-1.5 mt-0.5">
                        <Phone className="w-3 h-3 text-slate-500" />
                        <span>{emp.phone || '-'}</span>
                      </div>
                    </td>

                    {/* Salary */}
                    <td className="py-3.5 px-4 text-right font-mono font-semibold text-slate-200">
                      {formatRupiah(emp.salary)}
                    </td>

                    {/* Status */}
                    <td className="py-3.5 px-4 text-center">
                      <span className={`inline-block px-2.5 py-0.5 rounded-full text-[10px] font-bold ${
                        emp.status === 'TETAP' ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20' :
                        emp.status === 'KONTRAK' ? 'bg-blue-500/10 text-blue-400 border border-blue-500/20' :
                        'bg-amber-500/10 text-amber-400 border border-amber-500/20'
                      }`}>
                        {emp.status}
                      </span>
                    </td>

                    {/* CRUD Actions */}
                    <td className="py-3.5 px-4 text-right">
                      <div className="flex items-center justify-end gap-1.5">
                        <button
                          type="button"
                          onClick={() => handleOpenEdit(emp)}
                          className="p-1.5 rounded-lg text-slate-400 hover:text-blue-400 hover:bg-blue-500/10 transition-colors"
                          title="Ubah Data Karyawan (Update)"
                        >
                          <Edit2 className="w-4 h-4" />
                        </button>
                        <button
                          type="button"
                          onClick={() => setDeleteTarget(emp)}
                          className="p-1.5 rounded-lg text-slate-400 hover:text-rose-400 hover:bg-rose-500/10 transition-colors"
                          title="Hapus Karyawan (Delete)"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Add / Edit Employee Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl max-w-xl w-full p-6 shadow-2xl relative my-8">
            <button
              onClick={() => setIsModalOpen(false)}
              className="absolute top-4 right-4 p-1 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800"
            >
              <X className="w-5 h-5" />
            </button>

            <div className="flex items-center gap-3 mb-6">
              <div className="p-2.5 rounded-xl bg-blue-600/10 text-blue-400 border border-blue-500/20">
                <Users className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-lg font-bold text-white">
                  {modalMode === 'create' ? 'Tambah Karyawan Baru (Create)' : 'Perbarui Data Karyawan (Update)'}
                </h3>
                <p className="text-xs text-slate-400">
                  Formulir sinkronisasi langsung ke tabel master_employees SQLite
                </p>
              </div>
            </div>

            {formError && (
              <div className="mb-4 p-3 rounded-xl bg-rose-500/10 border border-rose-500/20 text-rose-300 text-xs flex items-center gap-2">
                <AlertCircle className="w-4 h-4 text-rose-400" />
                <span>{formError}</span>
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">
                    Kode NIK Karyawan *
                  </label>
                  <input
                    type="text"
                    value={formEmployeeCode}
                    onChange={(e) => setFormEmployeeCode(e.target.value)}
                    required
                    placeholder="Contoh: EMP-009"
                    className="w-full px-3 py-2 bg-slate-950 border border-slate-700 rounded-xl text-xs text-white focus:outline-none focus:ring-2 focus:ring-blue-500 font-mono"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">
                    Nama Lengkap *
                  </label>
                  <input
                    type="text"
                    value={formName}
                    onChange={(e) => setFormName(e.target.value)}
                    required
                    placeholder="Nama lengkap sesuai KTP"
                    className="w-full px-3 py-2 bg-slate-950 border border-slate-700 rounded-xl text-xs text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">
                    Email Kantor / Pribadi
                  </label>
                  <input
                    type="email"
                    value={formEmail}
                    onChange={(e) => setFormEmail(e.target.value)}
                    placeholder="email@perusahaan.co.id"
                    className="w-full px-3 py-2 bg-slate-950 border border-slate-700 rounded-xl text-xs text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">
                    Nomor WhatsApp / HP
                  </label>
                  <input
                    type="text"
                    value={formPhone}
                    onChange={(e) => setFormPhone(e.target.value)}
                    placeholder="0812xxxxxxx"
                    className="w-full px-3 py-2 bg-slate-950 border border-slate-700 rounded-xl text-xs text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">
                    Departemen Penempatan
                  </label>
                  <select
                    value={formDeptId}
                    onChange={(e) => setFormDeptId(e.target.value)}
                    className="w-full px-3 py-2 bg-slate-950 border border-slate-700 rounded-xl text-xs text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="">Pilih Departemen...</option>
                    {departments.map((d) => (
                      <option key={d.id} value={d.id}>
                        {d.name} ({d.code})
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">
                    Posisi / Jabatan *
                  </label>
                  <input
                    type="text"
                    value={formPosition}
                    onChange={(e) => setFormPosition(e.target.value)}
                    required
                    placeholder="Staff IT, Akuntan, dll."
                    className="w-full px-3 py-2 bg-slate-950 border border-slate-700 rounded-xl text-xs text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">
                    Gaji Pokok Bulanan (Rp)
                  </label>
                  <input
                    type="number"
                    value={formSalary}
                    onChange={(e) => setFormSalary(e.target.value)}
                    min={0}
                    step={500000}
                    className="w-full px-3 py-2 bg-slate-950 border border-slate-700 rounded-xl text-xs text-white focus:outline-none focus:ring-2 focus:ring-blue-500 font-mono"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">
                    Tanggal Mulai Gabung
                  </label>
                  <input
                    type="date"
                    value={formJoinDate}
                    onChange={(e) => setFormJoinDate(e.target.value)}
                    className="w-full px-3 py-2 bg-slate-950 border border-slate-700 rounded-xl text-xs text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">
                    Status Ikatan Kerja
                  </label>
                  <select
                    value={formStatus}
                    onChange={(e) => setFormStatus(e.target.value as any)}
                    className="w-full px-3 py-2 bg-slate-950 border border-slate-700 rounded-xl text-xs text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="TETAP">Karyawan Tetap</option>
                    <option value="KONTRAK">PKWT / Kontrak</option>
                    <option value="MAGANG">Magang</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">
                  Alamat Domisili
                </label>
                <textarea
                  value={formAddress}
                  onChange={(e) => setFormAddress(e.target.value)}
                  rows={2}
                  placeholder="Alamat lengkap tempat tinggal"
                  className="w-full px-3 py-2 bg-slate-950 border border-slate-700 rounded-xl text-xs text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div className="pt-3 border-t border-slate-800 flex justify-end gap-2.5">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  disabled={isSubmitting}
                  className="py-2 px-4 rounded-xl bg-slate-800 hover:bg-slate-700 text-xs font-semibold text-slate-300"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="py-2 px-5 rounded-xl bg-blue-600 hover:bg-blue-500 text-xs font-semibold text-white shadow-lg shadow-blue-600/30 flex items-center gap-1.5 cursor-pointer disabled:opacity-50"
                >
                  {isSubmitting ? (
                    <>
                      <div className="w-3.5 h-3.5 border-2 border-white/20 border-t-white rounded-full animate-spin" />
                      <span>Menyimpan ke SQLite...</span>
                    </>
                  ) : (
                    <span>{modalMode === 'create' ? 'Simpan Karyawan' : 'Perbarui Karyawan'}</span>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      <DeleteModal
        isOpen={!!deleteTarget}
        title="Hapus Data Karyawan"
        itemName={deleteTarget?.name || ''}
        itemType="karyawan"
        onConfirm={handleDeleteConfirm}
        onClose={() => setDeleteTarget(null)}
        isDeleting={isDeleting}
      />
    </div>
  );
};
