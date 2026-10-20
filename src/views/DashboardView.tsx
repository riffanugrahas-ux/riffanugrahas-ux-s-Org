import React, { useState, useEffect } from 'react';
import { DashboardSummary } from '../types';
import { api, formatRupiah, formatDate } from '../services/api';
import {
  TrendingUp,
  TrendingDown,
  DollarSign,
  Users,
  Package,
  AlertTriangle,
  Receipt,
  Plus,
  ArrowRight,
  Database,
  CheckCircle2,
  Clock,
  Sparkles
} from 'lucide-react';

interface DashboardViewProps {
  onNavigate: (view: string) => void;
}

export const DashboardView: React.FC<DashboardViewProps> = ({ onNavigate }) => {
  const [summary, setSummary] = useState<DashboardSummary | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const loadSummary = async () => {
    try {
      setLoading(true);
      const data = await api.getDashboardSummary();
      setSummary(data);
    } catch (err: any) {
      setError(err.message || 'Gagal memuat ringkasan dashboard.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadSummary();
  }, []);

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] gap-3">
        <div className="w-8 h-8 border-3 border-blue-500/20 border-t-blue-500 rounded-full animate-spin" />
        <span className="text-xs text-slate-400">Menghubungkan & membaca data dari real database SQLite...</span>
      </div>
    );
  }

  if (error || !summary) {
    return (
      <div className="p-6 rounded-2xl bg-rose-500/10 border border-rose-500/20 text-rose-300">
        <div className="font-bold mb-1">Gagal Memuat Data</div>
        <p className="text-xs">{error || 'Data ringkasan tidak tersedia.'}</p>
        <button
          onClick={loadSummary}
          className="mt-3 px-3 py-1.5 bg-rose-600 text-white rounded-lg text-xs"
        >
          Coba Lagi
        </button>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Top Banner / Welcome */}
      <div className="relative overflow-hidden rounded-2xl bg-gradient-to-r from-blue-900/60 via-slate-900 to-indigo-950/60 border border-slate-800 p-6 sm:p-8">
        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-semibold bg-blue-500/10 text-blue-400 border border-blue-500/20 mb-3">
              <Sparkles className="w-3.5 h-3.5" />
              <span>Real Database SQLite Aktif & Terintegrasi</span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight">
              Dashboard Eksekutif Perusahaan
            </h1>
            <p className="mt-1 text-sm text-slate-300 max-w-xl">
              Pantau metrik finansial, pergerakan transaksi, stok inventaris, dan performa divisi secara real-time.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2.5">
            <button
              onClick={() => onNavigate('transactions')}
              className="py-2.5 px-4 rounded-xl bg-blue-600 hover:bg-blue-500 text-xs font-semibold text-white shadow-lg shadow-blue-600/30 flex items-center gap-2 transition-all cursor-pointer"
            >
              <Plus className="w-4 h-4" />
              <span>Transaksi Baru</span>
            </button>
            <button
              onClick={() => onNavigate('reports')}
              className="py-2.5 px-4 rounded-xl bg-slate-800 hover:bg-slate-700 text-xs font-semibold text-slate-200 border border-slate-700 flex items-center gap-2 transition-all cursor-pointer"
            >
              <span>Laporan Laba Rugi</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>

      {/* Primary KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Total Penjualan */}
        <div className="p-5 rounded-2xl bg-slate-900/90 border border-slate-800 relative overflow-hidden">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">
              Pendapatan Penjualan
            </span>
            <div className="p-2 rounded-xl bg-emerald-500/10 text-emerald-400">
              <TrendingUp className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-3 text-xl sm:text-2xl font-bold text-white tracking-tight font-mono">
            {formatRupiah(summary.revenueSales)}
          </div>
          <div className="mt-2 text-[11px] text-emerald-400 flex items-center gap-1 font-medium">
            <span>Omset Penjualan Masuk</span>
          </div>
        </div>

        {/* Total Pengeluaran */}
        <div className="p-5 rounded-2xl bg-slate-900/90 border border-slate-800 relative overflow-hidden">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">
              Total Beban & Biaya
            </span>
            <div className="p-2 rounded-xl bg-rose-500/10 text-rose-400">
              <TrendingDown className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-3 text-xl sm:text-2xl font-bold text-white tracking-tight font-mono">
            {formatRupiah(summary.totalExpenses)}
          </div>
          <div className="mt-2 text-[11px] text-slate-400 flex items-center gap-1">
            <span>Pengadaan, Payroll & Operasional</span>
          </div>
        </div>

        {/* Laba Bersih Operasional */}
        <div className="p-5 rounded-2xl bg-slate-900/90 border border-slate-800 relative overflow-hidden">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">
              Laba Bersih Usaha
            </span>
            <div className="p-2 rounded-xl bg-blue-500/10 text-blue-400">
              <DollarSign className="w-4 h-4" />
            </div>
          </div>
          <div className={`mt-3 text-xl sm:text-2xl font-bold tracking-tight font-mono ${
            summary.netProfit >= 0 ? 'text-blue-400' : 'text-rose-400'
          }`}>
            {formatRupiah(summary.netProfit)}
          </div>
          <div className="mt-2 text-[11px] text-slate-400">
            {summary.netProfit >= 0 ? 'Margin Profit Surplus' : 'Defisit Anggaran'}
          </div>
        </div>

        {/* Nilai Aset Inventaris */}
        <div className="p-5 rounded-2xl bg-slate-900/90 border border-slate-800 relative overflow-hidden">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">
              Valuasi Stok Barang
            </span>
            <div className="p-2 rounded-xl bg-amber-500/10 text-amber-400">
              <Package className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-3 text-xl sm:text-2xl font-bold text-white tracking-tight font-mono">
            {formatRupiah(summary.inventoryValuation)}
          </div>
          <div className="mt-2 text-[11px] text-slate-400">
            <span>Total {summary.productCount} SKU Produk Aktif</span>
          </div>
        </div>
      </div>

      {/* Secondary Quick Metrics */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 sm:gap-4">
        <button
          onClick={() => onNavigate('employees')}
          className="p-4 rounded-xl bg-slate-900/70 border border-slate-800 text-left hover:border-slate-700 transition-colors"
        >
          <div className="flex items-center gap-2 text-slate-400 text-xs font-medium">
            <Users className="w-3.5 h-3.5 text-blue-400" />
            <span>Karyawan Aktif</span>
          </div>
          <div className="mt-1.5 text-xl font-bold text-white font-mono">{summary.employeeCount} Orang</div>
        </button>

        <button
          onClick={() => onNavigate('clients')}
          className="p-4 rounded-xl bg-slate-900/70 border border-slate-800 text-left hover:border-slate-700 transition-colors"
        >
          <div className="flex items-center gap-2 text-slate-400 text-xs font-medium">
            <Receipt className="w-3.5 h-3.5 text-indigo-400" />
            <span>Klien Korporat</span>
          </div>
          <div className="mt-1.5 text-xl font-bold text-white font-mono">{summary.clientCount} Perusahaan</div>
        </button>

        <button
          onClick={() => onNavigate('products')}
          className="p-4 rounded-xl bg-slate-900/70 border border-slate-800 text-left hover:border-slate-700 transition-colors"
        >
          <div className="flex items-center gap-2 text-slate-400 text-xs font-medium">
            <AlertTriangle className="w-3.5 h-3.5 text-amber-400" />
            <span>Stok Menipis</span>
          </div>
          <div className="mt-1.5 text-xl font-bold text-amber-400 font-mono">{summary.lowStockCount} Produk</div>
        </button>

        <button
          onClick={() => onNavigate('transactions')}
          className="p-4 rounded-xl bg-slate-900/70 border border-slate-800 text-left hover:border-slate-700 transition-colors"
        >
          <div className="flex items-center gap-2 text-slate-400 text-xs font-medium">
            <Clock className="w-3.5 h-3.5 text-amber-400" />
            <span>Invoice Pending</span>
          </div>
          <div className="mt-1.5 text-xl font-bold text-white font-mono">{summary.pendingTransactionsCount} Tagihan</div>
        </button>
      </div>

      {/* Main Grid: Recent Transactions & Low Stock Alerts */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Recent Transactions List */}
        <div className="lg:col-span-2 bg-slate-900/90 border border-slate-800 rounded-2xl p-5 sm:p-6 shadow-xl">
          <div className="flex items-center justify-between mb-4 pb-3 border-b border-slate-800">
            <div>
              <h3 className="text-base font-bold text-white">Transaksi Terbaru</h3>
              <p className="text-xs text-slate-400">Aktivitas keuangan dan operasional terkini</p>
            </div>
            <button
              onClick={() => onNavigate('transactions')}
              className="text-xs text-blue-400 hover:text-blue-300 font-medium flex items-center gap-1"
            >
              <span>Lihat Semua</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead>
                <tr className="border-b border-slate-800 text-slate-400 font-semibold uppercase text-[10px]">
                  <th className="py-2.5 px-3">Kode / Tipe</th>
                  <th className="py-2.5 px-3">Pihak Terkait</th>
                  <th className="py-2.5 px-3">Tanggal</th>
                  <th className="py-2.5 px-3 text-right">Nilai Total</th>
                  <th className="py-2.5 px-3 text-center">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60">
                {summary.recentTransactions && summary.recentTransactions.length > 0 ? (
                  summary.recentTransactions.map((tx) => (
                    <tr key={tx.id} className="hover:bg-slate-800/40 transition-colors">
                      <td className="py-3 px-3">
                        <div className="font-mono font-semibold text-white">{tx.transaction_code}</div>
                        <span className={`inline-block mt-0.5 px-1.5 py-0.2 rounded text-[10px] font-bold ${
                          tx.type === 'PENJUALAN' ? 'bg-emerald-500/10 text-emerald-400' :
                          tx.type === 'PENGADAAN' ? 'bg-blue-500/10 text-blue-400' :
                          tx.type === 'PENGGAJIAN' ? 'bg-purple-500/10 text-purple-400' :
                          'bg-amber-500/10 text-amber-400'
                        }`}>
                          {tx.type}
                        </span>
                      </td>
                      <td className="py-3 px-3 font-medium text-slate-200">
                        {tx.party_name}
                      </td>
                      <td className="py-3 px-3 text-slate-400 font-mono text-[11px]">
                        {formatDate(tx.date)}
                      </td>
                      <td className="py-3 px-3 text-right font-mono font-semibold text-slate-100">
                        {formatRupiah(tx.total)}
                      </td>
                      <td className="py-3 px-3 text-center">
                        <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-semibold ${
                          tx.payment_status === 'LUNAS'
                            ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20'
                            : tx.payment_status === 'PENDING'
                            ? 'bg-amber-500/10 text-amber-400 border border-amber-500/20'
                            : 'bg-rose-500/10 text-rose-400 border border-rose-500/20'
                        }`}>
                          {tx.payment_status}
                        </span>
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan={5} className="py-6 text-center text-slate-500">
                      Belum ada transaksi tercatat.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* Low Stock Alerts & Breakdown */}
        <div className="space-y-6">
          {/* Low Stock Alert Box */}
          <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-5 shadow-xl">
            <div className="flex items-center justify-between mb-3 pb-2 border-b border-slate-800">
              <div className="flex items-center gap-2">
                <AlertTriangle className="w-4 h-4 text-amber-400" />
                <h3 className="text-sm font-bold text-white">Peringatan Stok Minimum</h3>
              </div>
              <button
                onClick={() => onNavigate('products')}
                className="text-[11px] text-blue-400 hover:text-blue-300"
              >
                Inventaris
              </button>
            </div>

            <div className="space-y-2.5">
              {summary.lowStockItems && summary.lowStockItems.length > 0 ? (
                summary.lowStockItems.map((prod) => (
                  <div
                    key={prod.id}
                    className="p-2.5 rounded-xl bg-slate-950/60 border border-slate-800 flex items-center justify-between"
                  >
                    <div>
                      <div className="text-xs font-semibold text-white">{prod.name}</div>
                      <div className="text-[10px] text-slate-400 font-mono">
                        SKU: {prod.sku} • Min: {prod.min_stock}
                      </div>
                    </div>
                    <div className="text-right">
                      <span className="inline-block px-2 py-0.5 rounded font-mono text-xs font-bold bg-amber-500/20 text-amber-300 border border-amber-500/30">
                        Sisa: {prod.stock_quantity}
                      </span>
                    </div>
                  </div>
                ))
              ) : (
                <div className="p-3 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-xs flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4" />
                  <span>Semua stok produk berada dalam batas aman.</span>
                </div>
              )}
            </div>
          </div>

          {/* Breakdown by Type */}
          <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-5 shadow-xl">
            <h3 className="text-sm font-bold text-white mb-3 pb-2 border-b border-slate-800">
              Distribusi Tipe Transaksi
            </h3>
            <div className="space-y-2">
              {summary.typeBreakdown.map((item, idx) => (
                <div key={idx} className="flex items-center justify-between text-xs py-1">
                  <span className="text-slate-300 font-medium">{item.type}</span>
                  <div className="text-right">
                    <span className="font-mono font-bold text-white">{formatRupiah(item.total_amount)}</span>
                    <span className="text-[10px] text-slate-500 ml-1.5">({item.count} transaksi)</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
