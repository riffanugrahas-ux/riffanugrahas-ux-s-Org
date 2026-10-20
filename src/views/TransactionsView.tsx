import React, { useState, useEffect } from 'react';
import { Transaction, TransactionItem, Product, Client, Supplier, CompanyProfile } from '../types';
import { api, formatRupiah, formatDate } from '../services/api';
import { DeleteModal } from '../components/DeleteModal';
import { InvoiceModal } from '../components/InvoiceModal';
import {
  Receipt,
  Plus,
  Search,
  Filter,
  Eye,
  Trash2,
  CheckCircle2,
  Clock,
  Ban,
  Download,
  AlertCircle,
  X,
  CreditCard,
  PlusCircle,
  Trash
} from 'lucide-react';

interface TransactionsViewProps {
  initialType?: string;
}

export const TransactionsView: React.FC<TransactionsViewProps> = ({ initialType }) => {
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [clients, setClients] = useState<Client[]>([]);
  const [suppliers, setSuppliers] = useState<Supplier[]>([]);
  const [companyProfile, setCompanyProfile] = useState<CompanyProfile | null>(null);

  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [selectedType, setSelectedType] = useState(initialType || '');
  const [selectedStatus, setSelectedStatus] = useState('');

  // Invoice view modal
  const [viewingTx, setViewingTx] = useState<Transaction | null>(null);
  const [viewingItems, setViewingItems] = useState<TransactionItem[]>([]);
  const [isInvoiceOpen, setIsInvoiceOpen] = useState(false);

  // Create Transaction modal state
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [formType, setFormType] = useState<'PENJUALAN' | 'PENGADAAN' | 'PENGGAJIAN' | 'OPERASIONAL'>('PENJUALAN');
  const [formPartyName, setFormPartyName] = useState('');
  const [formDate, setFormDate] = useState(new Date().toISOString().split('T')[0]);
  const [formPaymentStatus, setFormPaymentStatus] = useState<'LUNAS' | 'PENDING'>('LUNAS');
  const [formPaymentMethod, setFormPaymentMethod] = useState<'TRANSFER' | 'TUNAI' | 'GIRO'>('TRANSFER');
  const [formNotes, setFormNotes] = useState('');
  const [applyTax, setApplyTax] = useState(true);
  const [discountAmount, setDiscountAmount] = useState<number>(0);

  // Multi-item lines for Transaction
  const [lineItems, setLineItems] = useState<
    { product_id: number | null; item_name: string; quantity: number; unit_price: number }[]
  >([{ product_id: null, item_name: '', quantity: 1, unit_price: 0 }]);

  const [formError, setFormError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Delete modal
  const [deleteTarget, setDeleteTarget] = useState<Transaction | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  // Status edit modal / fast toggle
  const [statusEditTx, setStatusEditTx] = useState<Transaction | null>(null);
  const [newStatus, setNewStatus] = useState<'LUNAS' | 'PENDING' | 'BATAL'>('LUNAS');

  // Toast
  const [toastMsg, setToastMsg] = useState('');
  const showToast = (msg: string) => {
    setToastMsg(msg);
    setTimeout(() => setToastMsg(''), 3000);
  };

  const loadData = async () => {
    try {
      setLoading(true);
      const [txRes, prodRes, clientRes, supRes, profileRes] = await Promise.all([
        api.getTransactions({
          search: search || undefined,
          type: selectedType || undefined,
          payment_status: selectedStatus || undefined,
        }),
        api.getProducts(),
        api.getClients(),
        api.getSuppliers(),
        api.getCompanyProfile().catch(() => ({ profile: null as any })),
      ]);
      setTransactions(txRes.transactions);
      setProducts(prodRes.products);
      setClients(clientRes.clients);
      setSuppliers(supRes.suppliers);
      if (profileRes?.profile) setCompanyProfile(profileRes.profile);
    } catch (err: any) {
      console.error('Error fetching transactions:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, [search, selectedType, selectedStatus]);

  // Calculate totals for create form
  const calculatedSubtotal = lineItems.reduce((acc, it) => acc + (it.quantity || 0) * (it.unit_price || 0), 0);
  const calculatedTax = applyTax ? Math.round(calculatedSubtotal * 0.11) : 0;
  const calculatedTotal = Math.max(0, calculatedSubtotal + calculatedTax - (Number(discountAmount) || 0));

  const handleOpenCreate = () => {
    setFormType('PENJUALAN');
    setFormPartyName(clients.length > 0 ? clients[0].company_name : '');
    setFormDate(new Date().toISOString().split('T')[0]);
    setFormPaymentStatus('LUNAS');
    setFormPaymentMethod('TRANSFER');
    setFormNotes('');
    setApplyTax(true);
    setDiscountAmount(0);

    // Initial item from products if available
    if (products.length > 0) {
      setLineItems([
        {
          product_id: products[0].id,
          item_name: products[0].name,
          quantity: 1,
          unit_price: products[0].selling_price,
        },
      ]);
    } else {
      setLineItems([{ product_id: null, item_name: '', quantity: 1, unit_price: 0 }]);
    }

    setFormError('');
    setIsCreateOpen(true);
  };

  const handleProductSelect = (index: number, productId: string) => {
    const updated = [...lineItems];
    if (productId === 'custom' || !productId) {
      updated[index] = { ...updated[index], product_id: null };
    } else {
      const p = products.find((prod) => prod.id === Number(productId));
      if (p) {
        updated[index] = {
          product_id: p.id,
          item_name: p.name,
          quantity: updated[index].quantity || 1,
          unit_price: formType === 'PENGADAAN' ? p.cost_price : p.selling_price,
        };
      }
    }
    setLineItems(updated);
  };

  const handleLineItemChange = (index: number, field: string, val: any) => {
    const updated = [...lineItems];
    updated[index] = { ...updated[index], [field]: val };
    setLineItems(updated);
  };

  const addLineItem = () => {
    setLineItems([...lineItems, { product_id: null, item_name: '', quantity: 1, unit_price: 0 }]);
  };

  const removeLineItem = (index: number) => {
    if (lineItems.length === 1) return;
    setLineItems(lineItems.filter((_, i) => i !== index));
  };

  const handleCreateSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formPartyName.trim()) {
      setFormError('Nama pihak terkait (pelanggan, vendor, atau karyawan) wajib diisi.');
      return;
    }

    for (const item of lineItems) {
      if (!item.item_name.trim()) {
        setFormError('Nama deskripsi pada semua baris barang wajib diisi.');
        return;
      }
    }

    setIsSubmitting(true);
    setFormError('');

    try {
      const formattedItems = lineItems.map((it) => ({
        product_id: it.product_id,
        item_name: it.item_name,
        quantity: Number(it.quantity) || 1,
        unit_price: Number(it.unit_price) || 0,
        total_price: (Number(it.quantity) || 1) * (Number(it.unit_price) || 0),
      }));

      const res = await api.createTransaction({
        type: formType,
        party_name: formPartyName,
        date: formDate,
        subtotal: calculatedSubtotal,
        tax: calculatedTax,
        discount: Number(discountAmount) || 0,
        total: calculatedTotal,
        payment_status: formPaymentStatus,
        payment_method: formPaymentMethod,
        notes: formNotes,
        items: formattedItems,
      });

      showToast(`Transaksi baru ${res.transaction_code} berhasil dibuat dan stok tersinkronisasi!`);
      setIsCreateOpen(false);
      loadData();
    } catch (err: any) {
      setFormError(err.message || 'Gagal menyimpan transaksi.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleViewInvoice = async (tx: Transaction) => {
    try {
      const res = await api.getTransactionDetail(tx.id);
      setViewingTx(res.transaction);
      setViewingItems(res.items || []);
      setIsInvoiceOpen(true);
    } catch (err: any) {
      alert(err.message || 'Gagal mengambil rincian transaksi');
    }
  };

  const handleStatusUpdate = async () => {
    if (!statusEditTx) return;
    try {
      await api.updateTransaction(statusEditTx.id, { payment_status: newStatus });
      showToast(`Status transaksi ${statusEditTx.transaction_code} diubah menjadi ${newStatus}`);
      setStatusEditTx(null);
      loadData();
    } catch (err: any) {
      alert(err.message || 'Gagal memperbarui status transaksi.');
    }
  };

  const handleDeleteConfirm = async () => {
    if (!deleteTarget) return;
    setIsDeleting(true);
    try {
      await api.deleteTransaction(deleteTarget.id);
      showToast(`Transaksi ${deleteTarget.transaction_code} berhasil dihapus.`);
      setDeleteTarget(null);
      loadData();
    } catch (err: any) {
      alert(err.message || 'Gagal menghapus transaksi.');
    } finally {
      setIsDeleting(false);
    }
  };

  const exportCSV = () => {
    if (transactions.length === 0) return;
    const headers = ['ID', 'Nomor Transaksi', 'Tipe', 'Pihak Terkait', 'Tanggal', 'Subtotal', 'PPN', 'Diskon', 'Total', 'Status', 'Metode Bayar', 'Petugas'];
    const rows = transactions.map((t) => [
      t.id,
      `"${t.transaction_code}"`,
      `"${t.type}"`,
      `"${t.party_name}"`,
      `"${t.date}"`,
      t.subtotal,
      t.tax,
      t.discount,
      t.total,
      `"${t.payment_status}"`,
      `"${t.payment_method}"`,
      `"${t.created_by}"`,
    ]);

    const csvContent = 'data:text/csv;charset=utf-8,' + [headers.join(','), ...rows.map((r) => r.join(','))].join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `data_transaksi_${new Date().toISOString().split('T')[0]}.csv`);
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
            <h1 className="text-2xl font-bold text-white tracking-tight">Transaksi Data Perusahaan</h1>
            <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-blue-500/10 text-blue-400 border border-blue-500/20 font-mono">
              {transactions.length} Catatan
            </span>
          </div>
          <p className="text-xs text-slate-400 mt-1">
            Pencatatan faktur Penjualan (Sales), Pengadaan barang (PO), Penggajian staf (Payroll), dan Operasional.
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
            <Plus className="w-4 h-4" />
            <span>Buat Transaksi Baru</span>
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
            placeholder="Cari kode transaksi, pihak terkait, nota..."
            className="w-full pl-10 pr-4 py-2 bg-slate-950 border border-slate-700 rounded-xl text-xs text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>

        <div className="flex flex-wrap items-center gap-2.5 w-full md:w-auto">
          <select
            value={selectedType}
            onChange={(e) => setSelectedType(e.target.value)}
            className="px-3 py-2 bg-slate-950 border border-slate-700 rounded-xl text-xs text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="">Semua Tipe Transaksi</option>
            <option value="PENJUALAN">Penjualan (Sales)</option>
            <option value="PENGADAAN">Pengadaan (Purchasing/PO)</option>
            <option value="PENGGAJIAN">Penggajian (Payroll)</option>
            <option value="OPERASIONAL">Beban Operasional</option>
          </select>

          <select
            value={selectedStatus}
            onChange={(e) => setSelectedStatus(e.target.value)}
            className="px-3 py-2 bg-slate-950 border border-slate-700 rounded-xl text-xs text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="">Semua Status Bayar</option>
            <option value="LUNAS">Lunas</option>
            <option value="PENDING">Pending (Menunggu)</option>
            <option value="BATAL">Batal</option>
          </select>
        </div>
      </div>

      {/* Transactions Table */}
      <div className="bg-slate-900/90 border border-slate-800 rounded-2xl overflow-hidden shadow-xl">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead>
              <tr className="border-b border-slate-800 bg-slate-950/60 text-slate-400 font-semibold uppercase text-[10px] tracking-wider">
                <th className="py-3 px-4">Kode Transaksi</th>
                <th className="py-3 px-4">Tipe & Tanggal</th>
                <th className="py-3 px-4">Pihak Terkait</th>
                <th className="py-3 px-4 text-right">Nilai Total</th>
                <th className="py-3 px-4 text-center">Status Pembayaran</th>
                <th className="py-3 px-4 text-right">Aksi (CRUD)</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60">
              {loading ? (
                <tr>
                  <td colSpan={6} className="py-12 text-center text-slate-400">
                    <div className="w-6 h-6 border-2 border-blue-500 border-t-transparent rounded-full animate-spin mx-auto mb-2" />
                    Memuat daftar transaksi dari SQLite...
                  </td>
                </tr>
              ) : transactions.length === 0 ? (
                <tr>
                  <td colSpan={6} className="py-12 text-center text-slate-400">
                    Tidak ada transaksi tercatat untuk kriteria ini.
                  </td>
                </tr>
              ) : (
                transactions.map((tx) => (
                  <tr key={tx.id} className="hover:bg-slate-800/40 transition-colors">
                    {/* Code & User */}
                    <td className="py-3.5 px-4">
                      <div className="font-mono font-bold text-white text-xs">{tx.transaction_code}</div>
                      <div className="text-[10px] text-slate-500 mt-0.5">
                        Oleh: <span className="text-slate-400">{tx.created_by || 'Admin'}</span>
                      </div>
                    </td>

                    {/* Type & Date */}
                    <td className="py-3.5 px-4">
                      <span className={`inline-block px-2 py-0.5 rounded text-[10px] font-bold ${
                        tx.type === 'PENJUALAN' ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20' :
                        tx.type === 'PENGADAAN' ? 'bg-blue-500/10 text-blue-400 border border-blue-500/20' :
                        tx.type === 'PENGGAJIAN' ? 'bg-purple-500/10 text-purple-400 border border-purple-500/20' :
                        'bg-amber-500/10 text-amber-400 border border-amber-500/20'
                      }`}>
                        {tx.type}
                      </span>
                      <div className="text-[11px] text-slate-400 font-mono mt-1">
                        {formatDate(tx.date)}
                      </div>
                    </td>

                    {/* Party Name */}
                    <td className="py-3.5 px-4">
                      <div className="font-semibold text-slate-200 text-xs">{tx.party_name}</div>
                      <div className="text-[10px] text-slate-400 mt-0.5">
                        Metode: <span className="font-mono">{tx.payment_method}</span>
                      </div>
                    </td>

                    {/* Total Amount */}
                    <td className="py-3.5 px-4 text-right">
                      <div className="font-mono font-bold text-sm text-white">{formatRupiah(tx.total)}</div>
                      {tx.tax > 0 && (
                        <div className="text-[10px] text-slate-400 font-mono">
                          (PPN: {formatRupiah(tx.tax)})
                        </div>
                      )}
                    </td>

                    {/* Status with Quick Toggle */}
                    <td className="py-3.5 px-4 text-center">
                      <button
                        type="button"
                        onClick={() => {
                          setStatusEditTx(tx);
                          setNewStatus(tx.payment_status);
                        }}
                        className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[10px] font-bold transition-all hover:scale-105 cursor-pointer ${
                          tx.payment_status === 'LUNAS'
                            ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/30'
                            : tx.payment_status === 'PENDING'
                            ? 'bg-amber-500/10 text-amber-400 border border-amber-500/30'
                            : 'bg-rose-500/10 text-rose-400 border border-rose-500/30'
                        }`}
                        title="Klik untuk mengubah status pembayaran"
                      >
                        {tx.payment_status === 'LUNAS' && <CheckCircle2 className="w-3 h-3" />}
                        {tx.payment_status === 'PENDING' && <Clock className="w-3 h-3" />}
                        {tx.payment_status === 'BATAL' && <Ban className="w-3 h-3" />}
                        <span>{tx.payment_status}</span>
                      </button>
                    </td>

                    {/* CRUD Actions */}
                    <td className="py-3.5 px-4 text-right">
                      <div className="flex items-center justify-end gap-1.5">
                        <button
                          type="button"
                          onClick={() => handleViewInvoice(tx)}
                          className="p-1.5 rounded-lg text-slate-400 hover:text-blue-400 hover:bg-blue-500/10 transition-colors"
                          title="Lihat / Cetak Faktur (Invoice)"
                        >
                          <Eye className="w-4 h-4" />
                        </button>
                        <button
                          type="button"
                          onClick={() => setDeleteTarget(tx)}
                          className="p-1.5 rounded-lg text-slate-400 hover:text-rose-400 hover:bg-rose-500/10 transition-colors"
                          title="Hapus Transaksi (Delete)"
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

      {/* Create Transaction Modal (Multi-Item line items with auto stock calculation) */}
      {isCreateOpen && (
        <div className="fixed inset-0 z-50 bg-black/75 backdrop-blur-sm flex items-center justify-center p-3 sm:p-4 overflow-y-auto">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl max-w-2xl w-full p-6 shadow-2xl relative my-8">
            <button
              onClick={() => setIsCreateOpen(false)}
              className="absolute top-4 right-4 p-1 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800"
            >
              <X className="w-5 h-5" />
            </button>

            <div className="flex items-center gap-3 mb-5">
              <div className="p-2.5 rounded-xl bg-blue-600/10 text-blue-400 border border-blue-500/20">
                <Receipt className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-lg font-bold text-white">Form Input Transaksi Baru (Create)</h3>
                <p className="text-xs text-slate-400">
                  Sinkronisasi instan ke tabel transactions & update kuantitas stok otomatis
                </p>
              </div>
            </div>

            {formError && (
              <div className="mb-4 p-3 rounded-xl bg-rose-500/10 border border-rose-500/20 text-rose-300 text-xs flex items-center gap-2">
                <AlertCircle className="w-4 h-4 text-rose-400" />
                <span>{formError}</span>
              </div>
            )}

            <form onSubmit={handleCreateSubmit} className="space-y-4">
              {/* Type, Date, Party */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">
                    Tipe Transaksi *
                  </label>
                  <select
                    value={formType}
                    onChange={(e) => {
                      const t = e.target.value as any;
                      setFormType(t);
                      if (t === 'PENJUALAN' && clients.length > 0) setFormPartyName(clients[0].company_name);
                      if (t === 'PENGADAAN' && suppliers.length > 0) setFormPartyName(suppliers[0].company_name);
                    }}
                    className="w-full px-3 py-2 bg-slate-950 border border-slate-700 rounded-xl text-xs text-white focus:outline-none focus:ring-2 focus:ring-blue-500 font-semibold"
                  >
                    <option value="PENJUALAN">Penjualan (Sales Out)</option>
                    <option value="PENGADAAN">Pengadaan (Purchase In)</option>
                    <option value="PENGGAJIAN">Penggajian (Payroll)</option>
                    <option value="OPERASIONAL">Beban Operasional</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">
                    Pihak Terkait / Rekanan *
                  </label>
                  <input
                    type="text"
                    value={formPartyName}
                    onChange={(e) => setFormPartyName(e.target.value)}
                    required
                    placeholder="Nama Klien, Vendor, atau Divisi"
                    className="w-full px-3 py-2 bg-slate-950 border border-slate-700 rounded-xl text-xs text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">
                    Tanggal Transaksi
                  </label>
                  <input
                    type="date"
                    value={formDate}
                    onChange={(e) => setFormDate(e.target.value)}
                    required
                    className="w-full px-3 py-2 bg-slate-950 border border-slate-700 rounded-xl text-xs text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
              </div>

              {/* Line Items Container */}
              <div className="border border-slate-800 rounded-xl p-3 bg-slate-950/60">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-xs font-bold text-slate-300 uppercase tracking-wider">
                    Rincian Item / Produk
                  </span>
                  <button
                    type="button"
                    onClick={addLineItem}
                    className="text-xs text-blue-400 hover:text-blue-300 flex items-center gap-1 font-semibold"
                  >
                    <PlusCircle className="w-3.5 h-3.5" />
                    <span>Tambah Baris</span>
                  </button>
                </div>

                <div className="space-y-2.5 max-h-52 overflow-y-auto pr-1">
                  {lineItems.map((item, idx) => (
                    <div key={idx} className="flex items-center gap-2 bg-slate-900 p-2 rounded-lg border border-slate-800">
                      {/* Product Selector */}
                      <div className="w-44">
                        <select
                          value={item.product_id ? String(item.product_id) : 'custom'}
                          onChange={(e) => handleProductSelect(idx, e.target.value)}
                          className="w-full px-2 py-1.5 bg-slate-950 border border-slate-700 rounded text-xs text-white"
                        >
                          <option value="custom">-- Input Manual --</option>
                          {products.map((p) => (
                            <option key={p.id} value={p.id}>
                              {p.name} (Stok: {p.stock_quantity})
                            </option>
                          ))}
                        </select>
                      </div>

                      {/* Description input */}
                      <input
                        type="text"
                        value={item.item_name}
                        onChange={(e) => handleLineItemChange(idx, 'item_name', e.target.value)}
                        placeholder="Deskripsi barang / jasa..."
                        className="flex-1 px-2 py-1.5 bg-slate-950 border border-slate-700 rounded text-xs text-white"
                        required
                      />

                      {/* Quantity */}
                      <div className="w-20">
                        <input
                          type="number"
                          value={item.quantity}
                          onChange={(e) => handleLineItemChange(idx, 'quantity', Number(e.target.value))}
                          min={1}
                          placeholder="Qty"
                          className="w-full px-2 py-1.5 bg-slate-950 border border-slate-700 rounded text-xs text-white text-center font-mono"
                          required
                        />
                      </div>

                      {/* Unit Price */}
                      <div className="w-32">
                        <input
                          type="number"
                          value={item.unit_price}
                          onChange={(e) => handleLineItemChange(idx, 'unit_price', Number(e.target.value))}
                          min={0}
                          step={1000}
                          placeholder="Harga Satuan"
                          className="w-full px-2 py-1.5 bg-slate-950 border border-slate-700 rounded text-xs text-white text-right font-mono"
                          required
                        />
                      </div>

                      {/* Remove item button */}
                      <button
                        type="button"
                        onClick={() => removeLineItem(idx)}
                        disabled={lineItems.length === 1}
                        className="p-1 text-slate-500 hover:text-rose-400 disabled:opacity-30"
                      >
                        <Trash className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  ))}
                </div>

                {/* Calculation Summary */}
                <div className="mt-3 pt-3 border-t border-slate-800 space-y-1.5 text-xs">
                  <div className="flex justify-between text-slate-400">
                    <span>Subtotal:</span>
                    <span className="font-mono text-slate-200">{formatRupiah(calculatedSubtotal)}</span>
                  </div>

                  <div className="flex justify-between items-center text-slate-400">
                    <label className="flex items-center gap-1.5 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={applyTax}
                        onChange={(e) => setApplyTax(e.target.checked)}
                        className="rounded bg-slate-950 border-slate-700 text-blue-600"
                      />
                      <span>Terapkan Pajak Pertambahan Nilai (PPN 11%)</span>
                    </label>
                    <span className="font-mono text-slate-200">{formatRupiah(calculatedTax)}</span>
                  </div>

                  <div className="flex justify-between items-center text-slate-400">
                    <span>Diskon Potongan (Rp):</span>
                    <input
                      type="number"
                      value={discountAmount}
                      onChange={(e) => setDiscountAmount(Number(e.target.value))}
                      min={0}
                      step={50000}
                      className="w-32 px-2 py-1 bg-slate-950 border border-slate-700 rounded text-xs text-white text-right font-mono"
                    />
                  </div>

                  <div className="flex justify-between items-center pt-2 border-t border-slate-800 text-sm font-bold text-white">
                    <span>Total Tagihan Akhir:</span>
                    <span className="font-mono text-blue-400">{formatRupiah(calculatedTotal)}</span>
                  </div>
                </div>
              </div>

              {/* Payment Status & Method */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">
                    Status Pembayaran
                  </label>
                  <select
                    value={formPaymentStatus}
                    onChange={(e) => setFormPaymentStatus(e.target.value as any)}
                    className="w-full px-3 py-2 bg-slate-950 border border-slate-700 rounded-xl text-xs text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="LUNAS">Lunas Langsung</option>
                    <option value="PENDING">Pending (Belum Dibayar)</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">
                    Metode Pembayaran
                  </label>
                  <select
                    value={formPaymentMethod}
                    onChange={(e) => setFormPaymentMethod(e.target.value as any)}
                    className="w-full px-3 py-2 bg-slate-950 border border-slate-700 rounded-xl text-xs text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="TRANSFER">Transfer Bank Korporat</option>
                    <option value="TUNAI">Kas Tunai (Petty Cash)</option>
                    <option value="GIRO">Bilyet Giro / Cek</option>
                  </select>
                </div>
              </div>

              {/* Notes */}
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">
                  Catatan / Syarat Transaksi
                </label>
                <textarea
                  value={formNotes}
                  onChange={(e) => setFormNotes(e.target.value)}
                  rows={2}
                  placeholder="Keterangan kontrak, jatuh tempo pembayaran, atau nomor PO"
                  className="w-full px-3 py-2 bg-slate-950 border border-slate-700 rounded-xl text-xs text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div className="pt-3 border-t border-slate-800 flex justify-end gap-2.5">
                <button
                  type="button"
                  onClick={() => setIsCreateOpen(false)}
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
                    <span>Simpan & Buat Faktur</span>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Quick Status Update Modal */}
      {statusEditTx && (
        <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl max-w-sm w-full p-6 shadow-2xl relative">
            <button
              onClick={() => setStatusEditTx(null)}
              className="absolute top-4 right-4 p-1 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800"
            >
              <X className="w-5 h-5" />
            </button>

            <div className="flex items-center gap-2 mb-3">
              <CreditCard className="w-5 h-5 text-blue-400" />
              <h3 className="text-base font-bold text-white">Update Status Pembayaran</h3>
            </div>
            <p className="text-xs text-slate-400 mb-4">
              Nomor: <strong className="text-white font-mono">{statusEditTx.transaction_code}</strong> ({statusEditTx.party_name})
            </p>

            <div className="space-y-3">
              <select
                value={newStatus}
                onChange={(e) => setNewStatus(e.target.value as any)}
                className="w-full px-3 py-2.5 bg-slate-950 border border-slate-700 rounded-xl text-xs text-white focus:outline-none focus:ring-2 focus:ring-blue-500 font-bold"
              >
                <option value="LUNAS">LUNAS (Sudah Diterima / Dibayar)</option>
                <option value="PENDING">PENDING (Menunggu Pembayaran)</option>
                <option value="BATAL">BATAL (Transaksi Dibatalkan)</option>
              </select>

              <div className="pt-2 flex gap-2">
                <button
                  type="button"
                  onClick={() => setStatusEditTx(null)}
                  className="flex-1 py-2 px-3 rounded-xl bg-slate-800 text-slate-300 text-xs font-medium"
                >
                  Batal
                </button>
                <button
                  type="button"
                  onClick={handleStatusUpdate}
                  className="flex-1 py-2 px-3 rounded-xl bg-blue-600 hover:bg-blue-500 text-white text-xs font-medium cursor-pointer"
                >
                  Perbarui Status
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      <DeleteModal
        isOpen={!!deleteTarget}
        title="Hapus Transaksi Finansial"
        itemName={deleteTarget?.transaction_code || ''}
        itemType="transaksi"
        onConfirm={handleDeleteConfirm}
        onClose={() => setDeleteTarget(null)}
        isDeleting={isDeleting}
      />

      {/* Printable Invoice Modal */}
      {viewingTx && (
        <InvoiceModal
          isOpen={isInvoiceOpen}
          onClose={() => setIsInvoiceOpen(false)}
          transaction={viewingTx}
          items={viewingItems}
          company={companyProfile}
        />
      )}
    </div>
  );
};
