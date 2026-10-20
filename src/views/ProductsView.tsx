import React, { useState, useEffect } from 'react';
import { Product } from '../types';
import { api, formatRupiah } from '../services/api';
import { DeleteModal } from '../components/DeleteModal';
import {
  Package,
  Plus,
  Search,
  Filter,
  Edit2,
  Trash2,
  Download,
  AlertTriangle,
  CheckCircle2,
  AlertCircle,
  PlusCircle,
  MinusCircle,
  X,
  TrendingUp
} from 'lucide-react';

export const ProductsView: React.FC = () => {
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('');
  const [lowStockOnly, setLowStockOnly] = useState(false);

  // Modal states
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [modalMode, setModalMode] = useState<'create' | 'edit'>('create');
  const [editingId, setEditingId] = useState<number | null>(null);

  // Form states
  const [formSku, setFormSku] = useState('');
  const [formName, setFormName] = useState('');
  const [formCategory, setFormCategory] = useState('');
  const [formUnit, setFormUnit] = useState('Unit');
  const [formCostPrice, setFormCostPrice] = useState<string>('0');
  const [formSellingPrice, setFormSellingPrice] = useState<string>('0');
  const [formStock, setFormStock] = useState<string>('0');
  const [formMinStock, setFormMinStock] = useState<string>('5');
  const [formSupplier, setFormSupplier] = useState('');
  const [formDescription, setFormDescription] = useState('');
  const [formStatus, setFormStatus] = useState<'AKTIF' | 'NONAKTIF'>('AKTIF');
  const [formError, setFormError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Quick adjust stock modal
  const [adjustTarget, setAdjustTarget] = useState<Product | null>(null);
  const [adjustDelta, setAdjustDelta] = useState<number>(1);
  const [adjustReason, setAdjustReason] = useState('Penyesuaian stok fisik (Stock Opname)');
  const [isAdjusting, setIsAdjusting] = useState(false);

  // Delete modal state
  const [deleteTarget, setDeleteTarget] = useState<Product | null>(null);
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
      const res = await api.getProducts({
        search: search || undefined,
        category: selectedCategory || undefined,
        lowStockOnly,
      });
      setProducts(res.products);
    } catch (err: any) {
      console.error('Error fetching products:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, [search, selectedCategory, lowStockOnly]);

  const categories = Array.from(new Set(products.map((p) => p.category))).filter(Boolean);

  const handleOpenCreate = () => {
    setModalMode('create');
    setEditingId(null);
    setFormSku(`PRD-${String(Math.floor(100 + Math.random() * 900))}`);
    setFormName('');
    setFormCategory('Perangkat Keras');
    setFormUnit('Unit');
    setFormCostPrice('1000000');
    setFormSellingPrice('1500000');
    setFormStock('10');
    setFormMinStock('5');
    setFormSupplier('');
    setFormDescription('');
    setFormStatus('AKTIF');
    setFormError('');
    setIsModalOpen(true);
  };

  const handleOpenEdit = (prod: Product) => {
    setModalMode('edit');
    setEditingId(prod.id);
    setFormSku(prod.sku);
    setFormName(prod.name);
    setFormCategory(prod.category);
    setFormUnit(prod.unit);
    setFormCostPrice(String(prod.cost_price));
    setFormSellingPrice(String(prod.selling_price));
    setFormStock(String(prod.stock_quantity));
    setFormMinStock(String(prod.min_stock));
    setFormSupplier(prod.supplier_name || '');
    setFormDescription(prod.description || '');
    setFormStatus(prod.status);
    setFormError('');
    setIsModalOpen(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formSku || !formName || !formCategory) {
      setFormError('SKU, Nama Produk, dan Kategori wajib diisi.');
      return;
    }

    setIsSubmitting(true);
    setFormError('');

    try {
      const payload: Partial<Product> = {
        sku: formSku,
        name: formName,
        category: formCategory,
        unit: formUnit,
        cost_price: Number(formCostPrice) || 0,
        selling_price: Number(formSellingPrice) || 0,
        stock_quantity: Number(formStock) || 0,
        min_stock: Number(formMinStock) || 0,
        supplier_name: formSupplier,
        description: formDescription,
        status: formStatus,
      };

      if (modalMode === 'create') {
        await api.createProduct(payload);
        showToast('Produk baru berhasil ditambahkan ke database!');
      } else if (editingId) {
        await api.updateProduct(editingId, payload);
        showToast('Data produk berhasil diperbarui!');
      }

      setIsModalOpen(false);
      loadData();
    } catch (err: any) {
      setFormError(err.message || 'Gagal menyimpan data produk.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleAdjustStockSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!adjustTarget) return;
    setIsAdjusting(true);
    try {
      await api.adjustStock(adjustTarget.id, adjustDelta, adjustReason);
      showToast(`Stok "${adjustTarget.name}" berhasil disesuaikan.`);
      setAdjustTarget(null);
      loadData();
    } catch (err: any) {
      alert(err.message || 'Gagal mengubah stok.');
    } finally {
      setIsAdjusting(false);
    }
  };

  const handleDeleteConfirm = async () => {
    if (!deleteTarget) return;
    setIsDeleting(true);
    try {
      await api.deleteProduct(deleteTarget.id);
      showToast(`Produk "${deleteTarget.name}" berhasil dihapus.`);
      setDeleteTarget(null);
      loadData();
    } catch (err: any) {
      alert(err.message || 'Gagal menghapus produk.');
    } finally {
      setIsDeleting(false);
    }
  };

  const exportCSV = () => {
    if (products.length === 0) return;
    const headers = ['ID', 'SKU', 'Nama Produk', 'Kategori', 'Satuan', 'Harga Beli (HPP)', 'Harga Jual', 'Stok Saat Ini', 'Batas Min Stok', 'Status'];
    const rows = products.map((p) => [
      p.id,
      `"${p.sku}"`,
      `"${p.name}"`,
      `"${p.category}"`,
      `"${p.unit}"`,
      p.cost_price,
      p.selling_price,
      p.stock_quantity,
      p.min_stock,
      `"${p.status}"`,
    ]);

    const csvContent = 'data:text/csv;charset=utf-8,' + [headers.join(','), ...rows.map((r) => r.join(','))].join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `data_produk_stok_${new Date().toISOString().split('T')[0]}.csv`);
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
            <h1 className="text-2xl font-bold text-white tracking-tight">Master Data Produk & Stok</h1>
            <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-amber-500/10 text-amber-400 border border-amber-500/20 font-mono">
              {products.length} SKU
            </span>
          </div>
          <p className="text-xs text-slate-400 mt-1">
            Katalog barang dagang, harga pokok (HPP), harga jual, dan kuantitas inventaris gudang.
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
            <span>Tambah Produk</span>
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
            placeholder="Cari SKU, nama barang, supplier..."
            className="w-full pl-10 pr-4 py-2 bg-slate-950 border border-slate-700 rounded-xl text-xs text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>

        <div className="flex flex-wrap items-center gap-2.5 w-full md:w-auto">
          <select
            value={selectedCategory}
            onChange={(e) => setSelectedCategory(e.target.value)}
            className="px-3 py-2 bg-slate-950 border border-slate-700 rounded-xl text-xs text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="">Semua Kategori</option>
            {categories.map((cat, idx) => (
              <option key={idx} value={cat}>
                {cat}
              </option>
            ))}
          </select>

          <button
            type="button"
            onClick={() => setLowStockOnly(!lowStockOnly)}
            className={`px-3 py-2 rounded-xl text-xs font-medium flex items-center gap-1.5 border transition-all ${
              lowStockOnly
                ? 'bg-amber-500/20 text-amber-300 border-amber-500/40 font-semibold'
                : 'bg-slate-950 text-slate-400 border-slate-700 hover:text-slate-200'
            }`}
          >
            <AlertTriangle className="w-3.5 h-3.5 text-amber-400" />
            <span>Hanya Stok Menipis</span>
          </button>
        </div>
      </div>

      {/* Products Table */}
      <div className="bg-slate-900/90 border border-slate-800 rounded-2xl overflow-hidden shadow-xl">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead>
              <tr className="border-b border-slate-800 bg-slate-950/60 text-slate-400 font-semibold uppercase text-[10px] tracking-wider">
                <th className="py-3 px-4">Info Produk / SKU</th>
                <th className="py-3 px-4">Kategori & Satuan</th>
                <th className="py-3 px-4 text-right">Harga Pokok (HPP)</th>
                <th className="py-3 px-4 text-right">Harga Jual</th>
                <th className="py-3 px-4 text-center">Stok Gudang</th>
                <th className="py-3 px-4 text-right">Aksi (CRUD)</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60">
              {loading ? (
                <tr>
                  <td colSpan={6} className="py-12 text-center text-slate-400">
                    <div className="w-6 h-6 border-2 border-blue-500 border-t-transparent rounded-full animate-spin mx-auto mb-2" />
                    Membaca master inventaris dari SQLite...
                  </td>
                </tr>
              ) : products.length === 0 ? (
                <tr>
                  <td colSpan={6} className="py-12 text-center text-slate-400">
                    Tidak ada produk ditemukan.
                  </td>
                </tr>
              ) : (
                products.map((prod) => {
                  const isLow = prod.stock_quantity <= prod.min_stock;
                  const margin = prod.selling_price - prod.cost_price;

                  return (
                    <tr key={prod.id} className="hover:bg-slate-800/40 transition-colors">
                      {/* Product Name & SKU */}
                      <td className="py-3.5 px-4">
                        <div className="font-semibold text-white text-xs">{prod.name}</div>
                        <div className="font-mono text-[11px] text-amber-400 mt-0.5">
                          SKU: {prod.sku}
                        </div>
                        {prod.supplier_name && (
                          <div className="text-[10px] text-slate-500 mt-0.5">
                            Vendor: {prod.supplier_name}
                          </div>
                        )}
                      </td>

                      {/* Category & Unit */}
                      <td className="py-3.5 px-4">
                        <span className="inline-block px-2 py-0.5 rounded text-[10px] font-medium bg-slate-800 text-slate-300 border border-slate-700">
                          {prod.category}
                        </span>
                        <div className="text-[11px] text-slate-400 mt-1">
                          Satuan: <strong className="text-slate-300">{prod.unit}</strong>
                        </div>
                      </td>

                      {/* Cost Price */}
                      <td className="py-3.5 px-4 text-right font-mono text-slate-300">
                        {formatRupiah(prod.cost_price)}
                      </td>

                      {/* Selling Price & Margin */}
                      <td className="py-3.5 px-4 text-right">
                        <div className="font-mono font-bold text-emerald-400">
                          {formatRupiah(prod.selling_price)}
                        </div>
                        <div className="text-[10px] text-slate-400 font-mono mt-0.5">
                          Laba: +{formatRupiah(margin)}
                        </div>
                      </td>

                      {/* Stock Quantity & Badge */}
                      <td className="py-3.5 px-4 text-center">
                        <div className="inline-flex items-center gap-1.5">
                          <span
                            className={`px-2.5 py-1 rounded-lg font-mono text-xs font-bold ${
                              isLow
                                ? 'bg-rose-500/20 text-rose-300 border border-rose-500/40'
                                : 'bg-slate-800 text-white border border-slate-700'
                            }`}
                          >
                            {prod.stock_quantity} {prod.unit}
                          </span>
                          <button
                            type="button"
                            onClick={() => {
                              setAdjustTarget(prod);
                              setAdjustDelta(1);
                            }}
                            className="p-1 rounded text-slate-400 hover:text-blue-400 hover:bg-slate-800"
                            title="Sesuaikan Stok Cepat"
                          >
                            <TrendingUp className="w-3.5 h-3.5" />
                          </button>
                        </div>
                        <div className="text-[10px] text-slate-500 mt-0.5">
                          Min: {prod.min_stock}
                        </div>
                      </td>

                      {/* CRUD Actions */}
                      <td className="py-3.5 px-4 text-right">
                        <div className="flex items-center justify-end gap-1.5">
                          <button
                            type="button"
                            onClick={() => handleOpenEdit(prod)}
                            className="p-1.5 rounded-lg text-slate-400 hover:text-blue-400 hover:bg-blue-500/10 transition-colors"
                            title="Ubah Produk (Update)"
                          >
                            <Edit2 className="w-4 h-4" />
                          </button>
                          <button
                            type="button"
                            onClick={() => setDeleteTarget(prod)}
                            className="p-1.5 rounded-lg text-slate-400 hover:text-rose-400 hover:bg-rose-500/10 transition-colors"
                            title="Hapus Produk (Delete)"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Add / Edit Product Modal */}
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
              <div className="p-2.5 rounded-xl bg-amber-500/10 text-amber-400 border border-amber-500/20">
                <Package className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-lg font-bold text-white">
                  {modalMode === 'create' ? 'Tambah Produk Baru (Create)' : 'Perbarui Data Produk (Update)'}
                </h3>
                <p className="text-xs text-slate-400">
                  Sinkronisasi ke tabel master_products SQLite real database
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
                    Kode SKU Barang *
                  </label>
                  <input
                    type="text"
                    value={formSku}
                    onChange={(e) => setFormSku(e.target.value)}
                    required
                    placeholder="Contoh: PRD-008"
                    className="w-full px-3 py-2 bg-slate-950 border border-slate-700 rounded-xl text-xs text-white focus:outline-none focus:ring-2 focus:ring-blue-500 font-mono"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">
                    Nama Barang / Produk *
                  </label>
                  <input
                    type="text"
                    value={formName}
                    onChange={(e) => setFormName(e.target.value)}
                    required
                    placeholder="Nama item inventaris"
                    className="w-full px-3 py-2 bg-slate-950 border border-slate-700 rounded-xl text-xs text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">
                    Kategori Barang *
                  </label>
                  <input
                    type="text"
                    value={formCategory}
                    onChange={(e) => setFormCategory(e.target.value)}
                    required
                    placeholder="Perangkat Keras, IT, Jaringan..."
                    className="w-full px-3 py-2 bg-slate-950 border border-slate-700 rounded-xl text-xs text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">
                    Satuan Unit
                  </label>
                  <input
                    type="text"
                    value={formUnit}
                    onChange={(e) => setFormUnit(e.target.value)}
                    placeholder="Pcs, Unit, Roll, Box..."
                    className="w-full px-3 py-2 bg-slate-950 border border-slate-700 rounded-xl text-xs text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">
                    Harga Pokok Pembelian (HPP Rp)
                  </label>
                  <input
                    type="number"
                    value={formCostPrice}
                    onChange={(e) => setFormCostPrice(e.target.value)}
                    min={0}
                    step={1000}
                    className="w-full px-3 py-2 bg-slate-950 border border-slate-700 rounded-xl text-xs text-white focus:outline-none focus:ring-2 focus:ring-blue-500 font-mono"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">
                    Harga Jual ke Pelanggan (Rp)
                  </label>
                  <input
                    type="number"
                    value={formSellingPrice}
                    onChange={(e) => setFormSellingPrice(e.target.value)}
                    min={0}
                    step={1000}
                    className="w-full px-3 py-2 bg-slate-950 border border-slate-700 rounded-xl text-xs text-white focus:outline-none focus:ring-2 focus:ring-blue-500 font-mono"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">
                    Kuantitas Stok Saat Ini
                  </label>
                  <input
                    type="number"
                    value={formStock}
                    onChange={(e) => setFormStock(e.target.value)}
                    min={0}
                    className="w-full px-3 py-2 bg-slate-950 border border-slate-700 rounded-xl text-xs text-white focus:outline-none focus:ring-2 focus:ring-blue-500 font-mono"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">
                    Batas Peringatan Stok Minimum
                  </label>
                  <input
                    type="number"
                    value={formMinStock}
                    onChange={(e) => setFormMinStock(e.target.value)}
                    min={0}
                    className="w-full px-3 py-2 bg-slate-950 border border-slate-700 rounded-xl text-xs text-white focus:outline-none focus:ring-2 focus:ring-blue-500 font-mono"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">
                  Nama Supplier / Distributor Pemasok
                </label>
                <input
                  type="text"
                  value={formSupplier}
                  onChange={(e) => setFormSupplier(e.target.value)}
                  placeholder="Nama PT atau vendor utama"
                  className="w-full px-3 py-2 bg-slate-950 border border-slate-700 rounded-xl text-xs text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">
                  Deskripsi / Spesifikasi Teknis Produk
                </label>
                <textarea
                  value={formDescription}
                  onChange={(e) => setFormDescription(e.target.value)}
                  rows={2}
                  placeholder="Keterangan spesifikasi barang"
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
                      <span>Menyimpan...</span>
                    </>
                  ) : (
                    <span>{modalMode === 'create' ? 'Simpan Produk' : 'Perbarui Produk'}</span>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Adjust Stock Quick Modal */}
      {adjustTarget && (
        <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl max-w-sm w-full p-6 shadow-2xl relative">
            <button
              onClick={() => setAdjustTarget(null)}
              className="absolute top-4 right-4 p-1 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800"
            >
              <X className="w-5 h-5" />
            </button>

            <div className="flex items-center gap-2 mb-3">
              <TrendingUp className="w-5 h-5 text-blue-400" />
              <h3 className="text-base font-bold text-white">Sesuaikan Stok Cepat</h3>
            </div>
            <p className="text-xs text-slate-400 mb-4">
              Produk: <strong className="text-white">{adjustTarget.name}</strong> (Stok saat ini: {adjustTarget.stock_quantity})
            </p>

            <form onSubmit={handleAdjustStockSubmit} className="space-y-3.5">
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">
                  Perubahan Jumlah (+/- Unit)
                </label>
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => setAdjustDelta((prev) => prev - 1)}
                    className="p-2 rounded-lg bg-slate-800 text-slate-300 hover:bg-slate-700"
                  >
                    <MinusCircle className="w-4 h-4" />
                  </button>
                  <input
                    type="number"
                    value={adjustDelta}
                    onChange={(e) => setAdjustDelta(Number(e.target.value))}
                    className="w-full px-3 py-2 bg-slate-950 border border-slate-700 rounded-xl text-center text-xs text-white focus:outline-none focus:ring-2 focus:ring-blue-500 font-mono font-bold"
                  />
                  <button
                    type="button"
                    onClick={() => setAdjustDelta((prev) => prev + 1)}
                    className="p-2 rounded-lg bg-slate-800 text-slate-300 hover:bg-slate-700"
                  >
                    <PlusCircle className="w-4 h-4" />
                  </button>
                </div>
                <div className="text-[11px] text-blue-400 font-mono mt-1 text-center">
                  Stok Akhir Nanti: {Math.max(0, adjustTarget.stock_quantity + adjustDelta)} {adjustTarget.unit}
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">
                  Alasan Penyesuaian
                </label>
                <input
                  type="text"
                  value={adjustReason}
                  onChange={(e) => setAdjustReason(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-950 border border-slate-700 rounded-xl text-xs text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div className="pt-2 flex gap-2">
                <button
                  type="button"
                  onClick={() => setAdjustTarget(null)}
                  className="flex-1 py-2 px-3 rounded-xl bg-slate-800 text-slate-300 text-xs font-medium"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  disabled={isAdjusting}
                  className="flex-1 py-2 px-3 rounded-xl bg-blue-600 hover:bg-blue-500 text-white text-xs font-medium disabled:opacity-50"
                >
                  {isAdjusting ? 'Menyesuaikan...' : 'Terapkan Stok'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      <DeleteModal
        isOpen={!!deleteTarget}
        title="Hapus Produk Inventaris"
        itemName={deleteTarget?.name || ''}
        itemType="produk"
        onConfirm={handleDeleteConfirm}
        onClose={() => setDeleteTarget(null)}
        isDeleting={isDeleting}
      />
    </div>
  );
};
