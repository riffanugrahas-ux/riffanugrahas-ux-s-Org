import React, { useState, useEffect } from 'react';
import { IncomeStatement } from '../types';
import { api, formatRupiah, formatDate } from '../services/api';
import {
  PieChart,
  Printer,
  Download,
  Calendar,
  FileSpreadsheet,
  TrendingUp,
  TrendingDown,
  DollarSign,
  Package,
  Users,
  ShieldCheck,
  Building2,
  Layers
} from 'lucide-react';

export const ReportsView: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'income' | 'inventory' | 'payroll'>('income');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [loading, setLoading] = useState(false);

  // Report data states
  const [incomeData, setIncomeData] = useState<IncomeStatement | null>(null);
  const [inventoryItems, setInventoryItems] = useState<any[]>([]);
  const [payrollSummary, setPayrollSummary] = useState<any[]>([]);

  const loadReport = async () => {
    setLoading(true);
    try {
      if (activeTab === 'income') {
        const data = await api.getIncomeStatement(startDate || undefined, endDate || undefined);
        setIncomeData(data);
      } else if (activeTab === 'inventory') {
        const res = await api.getInventoryValuation();
        setInventoryItems(res.items || []);
      } else if (activeTab === 'payroll') {
        const res = await api.getPayrollReport();
        setPayrollSummary(res.summary || []);
      }
    } catch (err: any) {
      console.error('Error loading report:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadReport();
  }, [activeTab, startDate, endDate]);

  const handlePrint = () => {
    window.print();
  };

  const exportCurrentCSV = () => {
    if (activeTab === 'income' && incomeData) {
      const headers = ['Komponen Laporan', 'Nominal (Rp)'];
      const rows = [
        ['Pendapatan Penjualan', incomeData.sales],
        ['Harga Pokok Penjualan (HPP)', incomeData.cogs],
        ['Laba Kotor (Gross Profit)', incomeData.grossProfit],
        ['Beban Penggajian Karyawan', incomeData.payroll],
        ['Beban Operasional Umum', incomeData.operational],
        ['Total Beban Operasional', incomeData.totalExpenses],
        ['Laba Bersih Bersih (Net Income)', incomeData.netIncome],
      ];
      downloadCSV('laporan_laba_rugi.csv', headers, rows);
    } else if (activeTab === 'inventory' && inventoryItems.length > 0) {
      const headers = ['SKU', 'Nama Barang', 'Kategori', 'Stok', 'Satuan', 'HPP', 'Total Nilai Aset', 'Harga Jual', 'Potensi Laba'];
      const rows = inventoryItems.map((i) => [
        `"${i.sku}"`,
        `"${i.name}"`,
        `"${i.category}"`,
        i.stock_quantity,
        `"${i.unit}"`,
        i.cost_price,
        i.total_cost_value,
        i.selling_price,
        i.potential_profit,
      ]);
      downloadCSV('laporan_valuasi_stok.csv', headers, rows);
    } else if (activeTab === 'payroll' && payrollSummary.length > 0) {
      const headers = ['Kode Departemen', 'Nama Departemen', 'Jumlah Karyawan', 'Total Beban Gaji', 'Rata-rata Gaji'];
      const rows = payrollSummary.map((p) => [
        `"${p.department_code}"`,
        `"${p.department_name}"`,
        p.total_employees,
        p.total_salary,
        p.average_salary,
      ]);
      downloadCSV('laporan_rekap_gaji.csv', headers, rows);
    }
  };

  const downloadCSV = (filename: string, headers: string[], rows: (string | number)[][]) => {
    const csvContent = 'data:text/csv;charset=utf-8,' + [headers.join(','), ...rows.map((r) => r.join(','))].join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', filename);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="space-y-6">
      {/* Header View */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-2xl font-bold text-white tracking-tight">Pusat Laporan Perusahaan</h1>
            <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-blue-500/10 text-blue-400 border border-blue-500/20 font-mono">
              Real SQLite Analytics
            </span>
          </div>
          <p className="text-xs text-slate-400 mt-1">
            Laporan Keuangan Laba Rugi, Valuasi Aset Inventaris, dan Rekapitulasi Beban Payroll.
          </p>
        </div>

        <div className="flex items-center gap-2.5">
          <button
            onClick={exportCurrentCSV}
            className="py-2.5 px-3.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold flex items-center gap-2 border border-slate-700 cursor-pointer"
          >
            <Download className="w-4 h-4" />
            <span className="hidden sm:inline">Ekspor CSV</span>
          </button>
          <button
            onClick={handlePrint}
            className="py-2.5 px-4 rounded-xl bg-blue-600 hover:bg-blue-500 text-white text-xs font-semibold flex items-center gap-2 shadow-lg shadow-blue-600/30 transition-all cursor-pointer"
          >
            <Printer className="w-4 h-4" />
            <span>Cetak / Cetak PDF</span>
          </button>
        </div>
      </div>

      {/* Tabs Switcher */}
      <div className="flex flex-col sm:flex-row gap-4 justify-between items-start sm:items-center border-b border-slate-800 pb-4">
        <div className="flex p-1 bg-slate-900 border border-slate-800 rounded-xl">
          <button
            onClick={() => setActiveTab('income')}
            className={`px-4 py-2 rounded-lg text-xs font-semibold flex items-center gap-2 transition-all ${
              activeTab === 'income'
                ? 'bg-blue-600 text-white shadow'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            <DollarSign className="w-3.5 h-3.5" />
            <span>Laba Rugi (Income Statement)</span>
          </button>

          <button
            onClick={() => setActiveTab('inventory')}
            className={`px-4 py-2 rounded-lg text-xs font-semibold flex items-center gap-2 transition-all ${
              activeTab === 'inventory'
                ? 'bg-blue-600 text-white shadow'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            <Package className="w-3.5 h-3.5" />
            <span>Valuasi Stok Inventaris</span>
          </button>

          <button
            onClick={() => setActiveTab('payroll')}
            className={`px-4 py-2 rounded-lg text-xs font-semibold flex items-center gap-2 transition-all ${
              activeTab === 'payroll'
                ? 'bg-blue-600 text-white shadow'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            <Users className="w-3.5 h-3.5" />
            <span>Rekap Gaji & Payroll</span>
          </button>
        </div>

        {/* Date Filter (for Income statement) */}
        {activeTab === 'income' && (
          <div className="flex items-center gap-2 text-xs">
            <Calendar className="w-4 h-4 text-slate-400 hidden sm:block" />
            <input
              type="date"
              value={startDate}
              onChange={(e) => setStartDate(e.target.value)}
              className="px-2.5 py-1.5 bg-slate-950 border border-slate-700 rounded-lg text-white"
            />
            <span className="text-slate-400">s/d</span>
            <input
              type="date"
              value={endDate}
              onChange={(e) => setEndDate(e.target.value)}
              className="px-2.5 py-1.5 bg-slate-950 border border-slate-700 rounded-lg text-white"
            />
            {(startDate || endDate) && (
              <button
                onClick={() => {
                  setStartDate('');
                  setEndDate('');
                }}
                className="text-[11px] text-blue-400 hover:underline"
              >
                Reset
              </button>
            )}
          </div>
        )}
      </div>

      {/* Tab 1: Income Statement */}
      {activeTab === 'income' && (
        <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-6 shadow-xl">
          <div className="text-center pb-6 border-b border-slate-800 mb-6">
            <h2 className="text-xl font-extrabold text-white uppercase tracking-tight">
              PT Nusantara Megah Perkasa
            </h2>
            <h3 className="text-sm font-semibold text-blue-400 mt-0.5">
              Laporan Laba Rugi Komprehensif
            </h3>
            <p className="text-xs text-slate-400 mt-1">
              Periode: {startDate ? formatDate(startDate) : 'Awal Tahun'} s/d {endDate ? formatDate(endDate) : 'Sekarang'}
            </p>
          </div>

          {loading ? (
            <div className="py-12 text-center text-slate-400">
              <div className="w-6 h-6 border-2 border-blue-500 border-t-transparent rounded-full animate-spin mx-auto mb-2" />
              Menghitung laporan laba rugi dari SQLite database...
            </div>
          ) : !incomeData ? (
            <div className="py-12 text-center text-slate-500">Data laporan tidak ditemukan.</div>
          ) : (
            <div className="max-w-2xl mx-auto space-y-6 text-xs">
              {/* Pendapatan Penjualan */}
              <div className="space-y-2">
                <div className="flex justify-between items-center text-sm font-bold text-white pb-1.5 border-b border-slate-800">
                  <span>I. PENDAPATAN USAHA (REVENUE)</span>
                  <span className="font-mono text-emerald-400">{formatRupiah(incomeData.sales)}</span>
                </div>
                <div className="flex justify-between pl-4 text-slate-300">
                  <span>Hasil Penjualan Barang & Jasa Korporat</span>
                  <span className="font-mono">{formatRupiah(incomeData.sales)}</span>
                </div>
              </div>

              {/* HPP (COGS) */}
              <div className="space-y-2">
                <div className="flex justify-between items-center text-sm font-bold text-white pb-1.5 border-b border-slate-800">
                  <span>II. BEBAN POKOK PENDAPATAN (HPP / PENGADAAN)</span>
                  <span className="font-mono text-rose-400">({formatRupiah(incomeData.cogs)})</span>
                </div>
                <div className="flex justify-between pl-4 text-slate-300">
                  <span>Biaya Pembelian & Pengadaan Barang Dagang</span>
                  <span className="font-mono text-rose-300">({formatRupiah(incomeData.cogs)})</span>
                </div>
              </div>

              {/* Laba Kotor */}
              <div className="p-3.5 rounded-xl bg-slate-950 border border-slate-800 flex justify-between items-center font-bold text-sm">
                <span className="text-slate-200">LABA KOTOR (GROSS PROFIT):</span>
                <span className={`font-mono ${incomeData.grossProfit >= 0 ? 'text-emerald-400' : 'text-rose-400'}`}>
                  {formatRupiah(incomeData.grossProfit)}
                </span>
              </div>

              {/* Beban Operasional */}
              <div className="space-y-2.5">
                <div className="flex justify-between items-center text-sm font-bold text-white pb-1.5 border-b border-slate-800">
                  <span>III. BEBAN OPERASIONAL & UMUM</span>
                  <span className="font-mono text-rose-400">({formatRupiah(incomeData.totalExpenses)})</span>
                </div>
                <div className="flex justify-between pl-4 text-slate-300">
                  <span>Beban Penggajian Pegawai & Personalia</span>
                  <span className="font-mono text-slate-400">({formatRupiah(incomeData.payroll)})</span>
                </div>
                <div className="flex justify-between pl-4 text-slate-300">
                  <span>Beban Operasional Kantor, Listrik & Fasilitas</span>
                  <span className="font-mono text-slate-400">({formatRupiah(incomeData.operational)})</span>
                </div>
              </div>

              {/* Laba Bersih */}
              <div className="p-5 rounded-2xl bg-gradient-to-r from-blue-950/70 to-slate-950 border border-blue-500/30 flex justify-between items-center shadow-lg">
                <div>
                  <div className="text-sm font-extrabold text-white">LABA BERSIH TAHUN BERJALAN (NET INCOME)</div>
                  <div className="text-[11px] text-slate-400 mt-0.5">Setelah dikurangi seluruh beban HPP dan operasional</div>
                </div>
                <div className={`text-xl font-extrabold font-mono ${incomeData.netIncome >= 0 ? 'text-blue-400' : 'text-rose-400'}`}>
                  {formatRupiah(incomeData.netIncome)}
                </div>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Tab 2: Inventory Valuation */}
      {activeTab === 'inventory' && (
        <div className="bg-slate-900/90 border border-slate-800 rounded-2xl overflow-hidden shadow-xl">
          <div className="p-5 border-b border-slate-800 flex justify-between items-center">
            <div>
              <h3 className="text-base font-bold text-white">Laporan Valuasi Aset Stok & Inventaris</h3>
              <p className="text-xs text-slate-400">Perhitungan total nilai modal (HPP) dan estimasi margin keuntungan</p>
            </div>
            <div className="text-right">
              <span className="text-xs text-slate-400">Total Nilai Aset Modal:</span>
              <div className="font-mono font-bold text-sm text-emerald-400">
                {formatRupiah(inventoryItems.reduce((acc, i) => acc + (i.total_cost_value || 0), 0))}
              </div>
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead>
                <tr className="border-b border-slate-800 bg-slate-950/60 text-slate-400 font-semibold uppercase text-[10px]">
                  <th className="py-3 px-4">SKU & Barang</th>
                  <th className="py-3 px-4">Kategori</th>
                  <th className="py-3 px-4 text-center">Stok</th>
                  <th className="py-3 px-4 text-right">HPP Satuan</th>
                  <th className="py-3 px-4 text-right">Total Nilai Modal</th>
                  <th className="py-3 px-4 text-right">Harga Jual</th>
                  <th className="py-3 px-4 text-right">Potensi Margin Laba</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60">
                {inventoryItems.map((item) => (
                  <tr key={item.id} className="hover:bg-slate-800/40">
                    <td className="py-3 px-4">
                      <div className="font-semibold text-white">{item.name}</div>
                      <div className="font-mono text-[11px] text-amber-400">{item.sku}</div>
                    </td>
                    <td className="py-3 px-4 text-slate-300">{item.category}</td>
                    <td className="py-3 px-4 text-center font-mono font-bold text-white">
                      {item.stock_quantity} {item.unit}
                    </td>
                    <td className="py-3 px-4 text-right font-mono text-slate-300">
                      {formatRupiah(item.cost_price)}
                    </td>
                    <td className="py-3 px-4 text-right font-mono font-bold text-slate-100">
                      {formatRupiah(item.total_cost_value)}
                    </td>
                    <td className="py-3 px-4 text-right font-mono text-emerald-400">
                      {formatRupiah(item.selling_price)}
                    </td>
                    <td className="py-3 px-4 text-right font-mono text-blue-400 font-semibold">
                      +{formatRupiah(item.potential_profit)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Tab 3: Payroll Summary */}
      {activeTab === 'payroll' && (
        <div className="bg-slate-900/90 border border-slate-800 rounded-2xl overflow-hidden shadow-xl">
          <div className="p-5 border-b border-slate-800 flex justify-between items-center">
            <div>
              <h3 className="text-base font-bold text-white">Laporan Rekapitulasi Gaji per Departemen</h3>
              <p className="text-xs text-slate-400">Alokasi anggaran gaji bulanan seluruh divisi perusahaan</p>
            </div>
            <div className="text-right">
              <span className="text-xs text-slate-400">Total Pengeluaran Payroll:</span>
              <div className="font-mono font-bold text-sm text-purple-400">
                {formatRupiah(payrollSummary.reduce((acc, p) => acc + (p.total_salary || 0), 0))}
              </div>
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead>
                <tr className="border-b border-slate-800 bg-slate-950/60 text-slate-400 font-semibold uppercase text-[10px]">
                  <th className="py-3 px-4">Kode & Divisi</th>
                  <th className="py-3 px-4 text-center">Jumlah Pegawai</th>
                  <th className="py-3 px-4 text-right">Rata-rata Gaji</th>
                  <th className="py-3 px-4 text-right">Total Anggaran Gaji</th>
                  <th className="py-3 px-4 text-right">Porsi Pengeluaran</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60">
                {payrollSummary.map((dept, idx) => {
                  const grandTotal = payrollSummary.reduce((acc, p) => acc + (p.total_salary || 0), 0);
                  const percentage = grandTotal > 0 ? Math.round((dept.total_salary / grandTotal) * 100) : 0;

                  return (
                    <tr key={idx} className="hover:bg-slate-800/40">
                      <td className="py-3.5 px-4">
                        <div className="font-semibold text-white">{dept.department_name}</div>
                        <div className="font-mono text-[11px] text-purple-400">{dept.department_code}</div>
                      </td>
                      <td className="py-3.5 px-4 text-center font-mono font-bold text-white">
                        {dept.total_employees} Orang
                      </td>
                      <td className="py-3.5 px-4 text-right font-mono text-slate-300">
                        {formatRupiah(dept.average_salary)}
                      </td>
                      <td className="py-3.5 px-4 text-right font-mono font-bold text-emerald-400">
                        {formatRupiah(dept.total_salary)}
                      </td>
                      <td className="py-3.5 px-4 text-right">
                        <div className="inline-flex items-center gap-2">
                          <div className="w-16 bg-slate-800 h-2 rounded-full overflow-hidden">
                            <div className="bg-purple-500 h-full rounded-full" style={{ width: `${percentage}%` }} />
                          </div>
                          <span className="font-mono text-slate-300 text-[11px]">{percentage}%</span>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
};
