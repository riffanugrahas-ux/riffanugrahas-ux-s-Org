import React, { useState, useEffect } from 'react';
import { Department } from '../types';
import { api, formatRupiah } from '../services/api';
import { DeleteModal } from '../components/DeleteModal';
import {
  Layers,
  Plus,
  Edit2,
  Trash2,
  Building,
  Users,
  AlertCircle,
  CheckCircle2,
  X
} from 'lucide-react';

export const DepartmentsView: React.FC = () => {
  const [departments, setDepartments] = useState<Department[]>([]);
  const [loading, setLoading] = useState(true);

  // Modal states
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [modalMode, setModalMode] = useState<'create' | 'edit'>('create');
  const [editingId, setEditingId] = useState<number | null>(null);

  // Form states
  const [formCode, setFormCode] = useState('');
  const [formName, setFormName] = useState('');
  const [formHeadName, setFormHeadName] = useState('');
  const [formBudget, setFormBudget] = useState('0');
  const [formLocation, setFormLocation] = useState('');
  const [formDescription, setFormDescription] = useState('');
  const [formStatus, setFormStatus] = useState<'AKTIF' | 'NONAKTIF'>('AKTIF');
  const [formError, setFormError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Delete modal state
  const [deleteTarget, setDeleteTarget] = useState<Department | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  // Toast
  const [toastMsg, setToastMsg] = useState('');
  const showToast = (msg: string) => {
    setToastMsg(msg);
    setTimeout(() => setToastMsg(''), 3000);
  };

  const loadData = async () => {
    try {
      setLoading(true);
      const res = await api.getDepartments();
      setDepartments(res.departments);
    } catch (err: any) {
      console.error('Error fetching departments:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const handleOpenCreate = () => {
    setModalMode('create');
    setEditingId(null);
    setFormCode(`DEP-${String(Math.floor(100 + Math.random() * 900))}`);
    setFormName('');
    setFormHeadName('');
    setFormBudget('150000000');
    setFormLocation('Gedung Wisma Lt. 18');
    setFormDescription('');
    setFormStatus('AKTIF');
    setFormError('');
    setIsModalOpen(true);
  };

  const handleOpenEdit = (dept: Department) => {
    setModalMode('edit');
    setEditingId(dept.id);
    setFormCode(dept.code);
    setFormName(dept.name);
    setFormHeadName(dept.head_name || '');
    setFormBudget(String(dept.budget || 0));
    setFormLocation(dept.location || '');
    setFormDescription(dept.description || '');
    setFormStatus(dept.status);
    setFormError('');
    setIsModalOpen(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formCode || !formName) {
      setFormError('Kode dan Nama Departemen wajib diisi.');
      return;
    }

    setIsSubmitting(true);
    setFormError('');

    try {
      const payload: Partial<Department> = {
        code: formCode,
        name: formName,
        head_name: formHeadName,
        budget: Number(formBudget) || 0,
        location: formLocation,
        description: formDescription,
        status: formStatus,
      };

      if (modalMode === 'create') {
        await api.createDepartment(payload);
        showToast('Departemen baru berhasil ditambahkan!');
      } else if (editingId) {
        await api.updateDepartment(editingId, payload);
        showToast('Departemen berhasil diperbarui!');
      }

      setIsModalOpen(false);
      loadData();
    } catch (err: any) {
      setFormError(err.message || 'Gagal menyimpan departemen.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDeleteConfirm = async () => {
    if (!deleteTarget) return;
    setIsDeleting(true);
    try {
      await api.deleteDepartment(deleteTarget.id);
      showToast(`Departemen "${deleteTarget.name}" berhasil dihapus.`);
      setDeleteTarget(null);
      loadData();
    } catch (err: any) {
      alert(err.message || 'Gagal menghapus departemen.');
    } finally {
      setIsDeleting(false);
    }
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
            <h1 className="text-2xl font-bold text-white tracking-tight">Master Data Departemen</h1>
            <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-purple-500/10 text-purple-400 border border-purple-500/20 font-mono">
              {departments.length} Divisi
            </span>
          </div>
          <p className="text-xs text-slate-400 mt-1">
            Struktur divisi organisasi, penanggung jawab (Head), plafon anggaran (Budget), dan lokasi kerja.
          </p>
        </div>

        <button
          onClick={handleOpenCreate}
          className="py-2.5 px-4 rounded-xl bg-blue-600 hover:bg-blue-500 text-white text-xs font-semibold flex items-center gap-2 shadow-lg shadow-blue-600/30 transition-all cursor-pointer self-start sm:self-auto"
        >
          <Plus className="w-4 h-4" />
          <span>Tambah Departemen</span>
        </button>
      </div>

      {/* Grid of Departments */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {loading ? (
          <div className="col-span-full py-12 text-center text-slate-400">
            <div className="w-6 h-6 border-2 border-blue-500 border-t-transparent rounded-full animate-spin mx-auto mb-2" />
            Membaca data departemen dari database SQLite...
          </div>
        ) : departments.length === 0 ? (
          <div className="col-span-full py-12 text-center text-slate-400">
            Belum ada departemen terdaftar.
          </div>
        ) : (
          departments.map((dept) => (
            <div
              key={dept.id}
              className="bg-slate-900/90 border border-slate-800 rounded-2xl p-5 shadow-lg flex flex-col justify-between hover:border-slate-700 transition-colors"
            >
              <div>
                <div className="flex items-start justify-between mb-3">
                  <div className="flex items-center gap-2.5">
                    <div className="p-2 rounded-xl bg-purple-500/10 text-purple-400 border border-purple-500/20">
                      <Layers className="w-4 h-4" />
                    </div>
                    <div>
                      <h3 className="text-sm font-bold text-white">{dept.name}</h3>
                      <span className="text-[10px] font-mono font-semibold text-purple-400">{dept.code}</span>
                    </div>
                  </div>

                  <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                    {dept.status}
                  </span>
                </div>

                <p className="text-xs text-slate-400 line-clamp-2 mb-4">
                  {dept.description || 'Tidak ada deskripsi khusus.'}
                </p>

                <div className="space-y-2 bg-slate-950/60 p-3 rounded-xl border border-slate-800 text-xs">
                  <div className="flex justify-between items-center text-slate-300">
                    <span className="text-slate-400">Pimpinan Divisi:</span>
                    <span className="font-semibold text-white">{dept.head_name || '-'}</span>
                  </div>
                  <div className="flex justify-between items-center text-slate-300">
                    <span className="text-slate-400">Plafon Anggaran:</span>
                    <span className="font-mono font-bold text-emerald-400">{formatRupiah(dept.budget)}</span>
                  </div>
                  <div className="flex justify-between items-center text-slate-300">
                    <span className="text-slate-400">Total Karyawan:</span>
                    <span className="inline-flex items-center gap-1 font-mono text-blue-400 font-bold">
                      <Users className="w-3.5 h-3.5" />
                      {dept.employee_count || 0} Orang
                    </span>
                  </div>
                  <div className="flex justify-between items-center text-slate-300 text-[11px]">
                    <span className="text-slate-400">Lokasi Kantor:</span>
                    <span className="text-slate-300 truncate max-w-[150px]">{dept.location || '-'}</span>
                  </div>
                </div>
              </div>

              <div className="mt-4 pt-3 border-t border-slate-800 flex justify-end gap-1.5">
                <button
                  type="button"
                  onClick={() => handleOpenEdit(dept)}
                  className="p-1.5 rounded-lg text-slate-400 hover:text-blue-400 hover:bg-blue-500/10 transition-colors"
                  title="Ubah Departemen (Update)"
                >
                  <Edit2 className="w-4 h-4" />
                </button>
                <button
                  type="button"
                  onClick={() => setDeleteTarget(dept)}
                  className="p-1.5 rounded-lg text-slate-400 hover:text-rose-400 hover:bg-rose-500/10 transition-colors"
                  title="Hapus Departemen (Delete)"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            </div>
          ))
        )}
      </div>

      {/* Add / Edit Department Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl max-w-lg w-full p-6 shadow-2xl relative">
            <button
              onClick={() => setIsModalOpen(false)}
              className="absolute top-4 right-4 p-1 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800"
            >
              <X className="w-5 h-5" />
            </button>

            <div className="flex items-center gap-3 mb-5">
              <div className="p-2.5 rounded-xl bg-purple-500/10 text-purple-400 border border-purple-500/20">
                <Layers className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-lg font-bold text-white">
                  {modalMode === 'create' ? 'Tambah Departemen (Create)' : 'Perbarui Departemen (Update)'}
                </h3>
                <p className="text-xs text-slate-400">
                  Data tersimpan di tabel master_departments SQLite
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
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">
                    Kode Divisi *
                  </label>
                  <input
                    type="text"
                    value={formCode}
                    onChange={(e) => setFormCode(e.target.value)}
                    required
                    placeholder="DEP-XXX"
                    className="w-full px-3 py-2 bg-slate-950 border border-slate-700 rounded-xl text-xs text-white focus:outline-none focus:ring-2 focus:ring-blue-500 font-mono"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">
                    Nama Departemen *
                  </label>
                  <input
                    type="text"
                    value={formName}
                    onChange={(e) => setFormName(e.target.value)}
                    required
                    placeholder="Contoh: Divisi Keuangan"
                    className="w-full px-3 py-2 bg-slate-950 border border-slate-700 rounded-xl text-xs text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">
                    Kepala / Pimpinan
                  </label>
                  <input
                    type="text"
                    value={formHeadName}
                    onChange={(e) => setFormHeadName(e.target.value)}
                    placeholder="Nama Direktur / Manager"
                    className="w-full px-3 py-2 bg-slate-950 border border-slate-700 rounded-xl text-xs text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">
                    Plafon Anggaran (Rp)
                  </label>
                  <input
                    type="number"
                    value={formBudget}
                    onChange={(e) => setFormBudget(e.target.value)}
                    min={0}
                    step={10000000}
                    className="w-full px-3 py-2 bg-slate-950 border border-slate-700 rounded-xl text-xs text-white focus:outline-none focus:ring-2 focus:ring-blue-500 font-mono"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">
                  Lokasi Gedung / Ruangan
                </label>
                <input
                  type="text"
                  value={formLocation}
                  onChange={(e) => setFormLocation(e.target.value)}
                  placeholder="Gedung Wisma Perkasa Lt. 18"
                  className="w-full px-3 py-2 bg-slate-950 border border-slate-700 rounded-xl text-xs text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">
                  Deskripsi Tanggung Jawab
                </label>
                <textarea
                  value={formDescription}
                  onChange={(e) => setFormDescription(e.target.value)}
                  rows={2}
                  placeholder="Uraian tanggung jawab departemen..."
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
                  {isSubmitting ? 'Menyimpan...' : modalMode === 'create' ? 'Simpan Departemen' : 'Perbarui'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      <DeleteModal
        isOpen={!!deleteTarget}
        title="Hapus Master Departemen"
        itemName={deleteTarget?.name || ''}
        itemType="departemen"
        onConfirm={handleDeleteConfirm}
        onClose={() => setDeleteTarget(null)}
        isDeleting={isDeleting}
      />
    </div>
  );
};
