import React, { useState, useEffect } from 'react';
import { Client } from '../types';
import { api } from '../services/api';
import { DeleteModal } from '../components/DeleteModal';
import {
  Briefcase,
  Plus,
  Edit2,
  Trash2,
  Search,
  Mail,
  Phone,
  Building,
  CheckCircle2,
  AlertCircle,
  X
} from 'lucide-react';

export const ClientsView: React.FC = () => {
  const [clients, setClients] = useState<Client[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');

  // Modal states
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [modalMode, setModalMode] = useState<'create' | 'edit'>('create');
  const [editingId, setEditingId] = useState<number | null>(null);

  // Form states
  const [formCode, setFormCode] = useState('');
  const [formName, setFormName] = useState('');
  const [formContact, setFormContact] = useState('');
  const [formEmail, setFormEmail] = useState('');
  const [formPhone, setFormPhone] = useState('');
  const [formAddress, setFormAddress] = useState('');
  const [formTaxId, setFormTaxId] = useState('');
  const [formStatus, setFormStatus] = useState<'AKTIF' | 'NONAKTIF'>('AKTIF');
  const [formError, setFormError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Delete modal state
  const [deleteTarget, setDeleteTarget] = useState<Client | null>(null);
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
      const res = await api.getClients();
      setClients(res.clients);
    } catch (err: any) {
      console.error('Error loading clients:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const filteredClients = clients.filter((c) => {
    if (!search) return true;
    const s = search.toLowerCase();
    return (
      c.company_name.toLowerCase().includes(s) ||
      c.client_code.toLowerCase().includes(s) ||
      c.contact_person.toLowerCase().includes(s) ||
      c.email.toLowerCase().includes(s)
    );
  });

  const handleOpenCreate = () => {
    setModalMode('create');
    setEditingId(null);
    setFormCode(`CLN-${String(Math.floor(100 + Math.random() * 900))}`);
    setFormName('');
    setFormContact('');
    setFormEmail('');
    setFormPhone('');
    setFormAddress('');
    setFormTaxId('');
    setFormStatus('AKTIF');
    setFormError('');
    setIsModalOpen(true);
  };

  const handleOpenEdit = (c: Client) => {
    setModalMode('edit');
    setEditingId(c.id);
    setFormCode(c.client_code);
    setFormName(c.company_name);
    setFormContact(c.contact_person);
    setFormEmail(c.email || '');
    setFormPhone(c.phone || '');
    setFormAddress(c.address || '');
    setFormTaxId(c.tax_id || '');
    setFormStatus(c.status);
    setFormError('');
    setIsModalOpen(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formCode || !formName) {
      setFormError('Kode Klien dan Nama Perusahaan wajib diisi.');
      return;
    }

    setIsSubmitting(true);
    setFormError('');

    try {
      const payload: Partial<Client> = {
        client_code: formCode,
        company_name: formName,
        contact_person: formContact,
        email: formEmail,
        phone: formPhone,
        address: formAddress,
        tax_id: formTaxId,
        status: formStatus,
      };

      if (modalMode === 'create') {
        await api.createClient(payload);
        showToast('Klien baru berhasil ditambahkan!');
      } else if (editingId) {
        await api.updateClient(editingId, payload);
        showToast('Data klien berhasil diperbarui!');
      }

      setIsModalOpen(false);
      loadData();
    } catch (err: any) {
      setFormError(err.message || 'Gagal menyimpan klien.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDeleteConfirm = async () => {
    if (!deleteTarget) return;
    setIsDeleting(true);
    try {
      await api.deleteClient(deleteTarget.id);
      showToast(`Klien "${deleteTarget.company_name}" berhasil dihapus.`);
      setDeleteTarget(null);
      loadData();
    } catch (err: any) {
      alert(err.message || 'Gagal menghapus klien.');
    } finally {
      setIsDeleting(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Toast */}
      {toastMsg && (
        <div className="fixed bottom-6 right-6 z-50 p-4 rounded-xl bg-emerald-600 text-white shadow-xl flex items-center gap-2 animate-bounce">
          <CheckCircle2 className="w-5 h-5" />
          <span className="text-xs font-semibold">{toastMsg}</span>
        </div>
      )}

      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-2xl font-bold text-white tracking-tight">Master Data Klien & Pelanggan</h1>
            <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-indigo-500/10 text-indigo-400 border border-indigo-500/20 font-mono">
              {clients.length} Mitra
            </span>
          </div>
          <p className="text-xs text-slate-400 mt-1">
            Data customer B2B, PIC penanggung jawab kontrak, NPWP, dan histori pembayaran.
          </p>
        </div>

        <button
          onClick={handleOpenCreate}
          className="py-2.5 px-4 rounded-xl bg-blue-600 hover:bg-blue-500 text-white text-xs font-semibold flex items-center gap-2 shadow-lg shadow-blue-600/30 transition-all cursor-pointer self-start sm:self-auto"
        >
          <Plus className="w-4 h-4" />
          <span>Tambah Klien</span>
        </button>
      </div>

      {/* Search Bar */}
      <div className="p-4 rounded-2xl bg-slate-900/90 border border-slate-800 flex items-center justify-between">
        <div className="relative w-full max-w-md">
          <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Cari nama perusahaan, PIC, kode klien, email..."
            className="w-full pl-10 pr-4 py-2 bg-slate-950 border border-slate-700 rounded-xl text-xs text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>
      </div>

      {/* Clients Table */}
      <div className="bg-slate-900/90 border border-slate-800 rounded-2xl overflow-hidden shadow-xl">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead>
              <tr className="border-b border-slate-800 bg-slate-950/60 text-slate-400 font-semibold uppercase text-[10px] tracking-wider">
                <th className="py-3 px-4">Nama Perusahaan & Kode</th>
                <th className="py-3 px-4">Person in Charge (PIC)</th>
                <th className="py-3 px-4">Kontak Resmi</th>
                <th className="py-3 px-4">NPWP & Alamat</th>
                <th className="py-3 px-4 text-center">Status</th>
                <th className="py-3 px-4 text-right">Aksi (CRUD)</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60">
              {loading ? (
                <tr>
                  <td colSpan={6} className="py-12 text-center text-slate-400">
                    <div className="w-6 h-6 border-2 border-blue-500 border-t-transparent rounded-full animate-spin mx-auto mb-2" />
                    Membaca data klien dari SQLite...
                  </td>
                </tr>
              ) : filteredClients.length === 0 ? (
                <tr>
                  <td colSpan={6} className="py-12 text-center text-slate-400">
                    Tidak ada data klien yang ditemukan.
                  </td>
                </tr>
              ) : (
                filteredClients.map((client) => (
                  <tr key={client.id} className="hover:bg-slate-800/40 transition-colors">
                    <td className="py-3.5 px-4">
                      <div className="font-semibold text-white text-xs">{client.company_name}</div>
                      <div className="font-mono text-[11px] text-indigo-400 mt-0.5">{client.client_code}</div>
                    </td>
                    <td className="py-3.5 px-4 font-medium text-slate-200">
                      {client.contact_person || '-'}
                    </td>
                    <td className="py-3.5 px-4">
                      <div className="text-slate-300 text-[11px] flex items-center gap-1.5">
                        <Mail className="w-3 h-3 text-slate-400" />
                        <span>{client.email || '-'}</span>
                      </div>
                      <div className="text-slate-400 text-[11px] flex items-center gap-1.5 mt-0.5">
                        <Phone className="w-3 h-3 text-slate-500" />
                        <span>{client.phone || '-'}</span>
                      </div>
                    </td>
                    <td className="py-3.5 px-4">
                      <div className="font-mono text-[11px] text-slate-300">{client.tax_id || '-'}</div>
                      <div className="text-[11px] text-slate-500 truncate max-w-xs">{client.address || '-'}</div>
                    </td>
                    <td className="py-3.5 px-4 text-center">
                      <span className="inline-block px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                        {client.status}
                      </span>
                    </td>
                    <td className="py-3.5 px-4 text-right">
                      <div className="flex items-center justify-end gap-1.5">
                        <button
                          type="button"
                          onClick={() => handleOpenEdit(client)}
                          className="p-1.5 rounded-lg text-slate-400 hover:text-blue-400 hover:bg-blue-500/10 transition-colors"
                          title="Ubah Klien (Update)"
                        >
                          <Edit2 className="w-4 h-4" />
                        </button>
                        <button
                          type="button"
                          onClick={() => setDeleteTarget(client)}
                          className="p-1.5 rounded-lg text-slate-400 hover:text-rose-400 hover:bg-rose-500/10 transition-colors"
                          title="Hapus Klien (Delete)"
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

      {/* Add / Edit Client Modal */}
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
              <div className="p-2.5 rounded-xl bg-indigo-500/10 text-indigo-400 border border-indigo-500/20">
                <Briefcase className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-lg font-bold text-white">
                  {modalMode === 'create' ? 'Tambah Klien Baru (Create)' : 'Perbarui Data Klien (Update)'}
                </h3>
                <p className="text-xs text-slate-400">
                  Data tersimpan di tabel master_clients SQLite
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
                    Kode Klien *
                  </label>
                  <input
                    type="text"
                    value={formCode}
                    onChange={(e) => setFormCode(e.target.value)}
                    required
                    placeholder="CLN-005"
                    className="w-full px-3 py-2 bg-slate-950 border border-slate-700 rounded-xl text-xs text-white focus:outline-none focus:ring-2 focus:ring-blue-500 font-mono"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">
                    Nama Perusahaan *
                  </label>
                  <input
                    type="text"
                    value={formName}
                    onChange={(e) => setFormName(e.target.value)}
                    required
                    placeholder="PT Bank Central ..."
                    className="w-full px-3 py-2 bg-slate-950 border border-slate-700 rounded-xl text-xs text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">
                    Person in Charge (PIC)
                  </label>
                  <input
                    type="text"
                    value={formContact}
                    onChange={(e) => setFormContact(e.target.value)}
                    placeholder="Nama kontak perwakilan"
                    className="w-full px-3 py-2 bg-slate-950 border border-slate-700 rounded-xl text-xs text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">
                    NPWP Badan Usaha
                  </label>
                  <input
                    type="text"
                    value={formTaxId}
                    onChange={(e) => setFormTaxId(e.target.value)}
                    placeholder="01.234.567.8-011.000"
                    className="w-full px-3 py-2 bg-slate-950 border border-slate-700 rounded-xl text-xs text-white focus:outline-none focus:ring-2 focus:ring-blue-500 font-mono"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">
                    Email Resmi
                  </label>
                  <input
                    type="email"
                    value={formEmail}
                    onChange={(e) => setFormEmail(e.target.value)}
                    placeholder="procurement@perusahaan.com"
                    className="w-full px-3 py-2 bg-slate-950 border border-slate-700 rounded-xl text-xs text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">
                    Nomor Telepon
                  </label>
                  <input
                    type="text"
                    value={formPhone}
                    onChange={(e) => setFormPhone(e.target.value)}
                    placeholder="(021) 500-xxx"
                    className="w-full px-3 py-2 bg-slate-950 border border-slate-700 rounded-xl text-xs text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">
                  Alamat Kantor
                </label>
                <textarea
                  value={formAddress}
                  onChange={(e) => setFormAddress(e.target.value)}
                  rows={2}
                  placeholder="Gedung / Jl. ..."
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
                  {isSubmitting ? 'Menyimpan...' : modalMode === 'create' ? 'Simpan Klien' : 'Perbarui'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      <DeleteModal
        isOpen={!!deleteTarget}
        title="Hapus Data Klien"
        itemName={deleteTarget?.company_name || ''}
        itemType="klien"
        onConfirm={handleDeleteConfirm}
        onClose={() => setDeleteTarget(null)}
        isDeleting={isDeleting}
      />
    </div>
  );
};
