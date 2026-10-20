import React, { useRef } from 'react';
import { Transaction, TransactionItem, CompanyProfile } from '../types';
import { formatRupiah, formatDate } from '../services/api';
import { Printer, X, Building2, CheckCircle2, Clock, Ban } from 'lucide-react';

interface InvoiceModalProps {
  isOpen: boolean;
  onClose: () => void;
  transaction: Transaction;
  items: TransactionItem[];
  company?: CompanyProfile | null;
}

export const InvoiceModal: React.FC<InvoiceModalProps> = ({
  isOpen,
  onClose,
  transaction,
  items,
  company,
}) => {
  const printAreaRef = useRef<HTMLDivElement>(null);

  if (!isOpen) return null;

  const handlePrint = () => {
    window.print();
  };

  const statusBadge = () => {
    switch (transaction.payment_status) {
      case 'LUNAS':
        return (
          <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs font-bold bg-emerald-500/10 text-emerald-400 border border-emerald-500/30">
            <CheckCircle2 className="w-3.5 h-3.5" /> LUNAS
          </span>
        );
      case 'PENDING':
        return (
          <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs font-bold bg-amber-500/10 text-amber-400 border border-amber-500/30">
            <Clock className="w-3.5 h-3.5" /> MENUNGGU PEMBAYARAN
          </span>
        );
      case 'BATAL':
        return (
          <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs font-bold bg-rose-500/10 text-rose-400 border border-rose-500/30">
            <Ban className="w-3.5 h-3.5" /> DIBATALKAN
          </span>
        );
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm flex items-center justify-center p-3 sm:p-4 overflow-y-auto">
      <div className="bg-slate-900 border border-slate-800 rounded-2xl max-w-2xl w-full p-6 shadow-2xl relative my-8">
        {/* Header Action Buttons */}
        <div className="flex items-center justify-between pb-4 mb-4 border-b border-slate-800">
          <div className="flex items-center gap-2">
            <h3 className="text-base font-bold text-white">Pratinjau Dokumen Transaksi</h3>
            <span className="text-xs font-mono text-blue-400 font-semibold">{transaction.transaction_code}</span>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={handlePrint}
              className="py-1.5 px-3 rounded-xl bg-blue-600 hover:bg-blue-500 text-xs font-medium text-white flex items-center gap-1.5 cursor-pointer shadow"
            >
              <Printer className="w-4 h-4" />
              <span>Cetak / PDF</span>
            </button>
            <button
              onClick={onClose}
              className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Printable Paper Area */}
        <div
          ref={printAreaRef}
          className="bg-white text-slate-900 rounded-xl p-6 sm:p-8 shadow-inner font-sans text-xs print:m-0 print:p-0"
        >
          {/* Letterhead */}
          <div className="flex justify-between items-start border-b-2 border-slate-900 pb-4 mb-6">
            <div className="flex items-start gap-3">
              <div className="w-12 h-12 bg-blue-700 rounded-xl flex items-center justify-center text-white font-bold">
                <Building2 className="w-6 h-6" />
              </div>
              <div>
                <h1 className="text-base font-extrabold tracking-tight text-slate-900 uppercase">
                  {company?.name || 'PT Nusantara Megah Perkasa'}
                </h1>
                <p className="text-[11px] text-slate-600">{company?.address || 'Jl. Jend. Sudirman Kav. 45, Jakarta Selatan'}</p>
                <p className="text-[11px] text-slate-600">
                  Telp: {company?.phone || '(021) 582-9090'} | Email: {company?.email || 'kontak@nusantaramegah.co.id'}
                </p>
                <p className="text-[10px] text-slate-500 font-mono">NPWP: {company?.npwp || '01.884.293.4-054.000'}</p>
              </div>
            </div>
            <div className="text-right">
              <div className="text-xs font-extrabold uppercase tracking-wider text-blue-700">
                FAKTUR {transaction.type}
              </div>
              <div className="font-mono text-sm font-bold text-slate-900 mt-1">{transaction.transaction_code}</div>
              <div className="text-[11px] text-slate-500 mt-0.5">Tanggal: {formatDate(transaction.date)}</div>
              <div className="mt-2">{statusBadge()}</div>
            </div>
          </div>

          {/* Client / Party details */}
          <div className="grid grid-cols-2 gap-4 mb-6 bg-slate-50 p-3.5 rounded-lg border border-slate-200">
            <div>
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Ditujukan Kepada:</span>
              <div className="font-bold text-slate-900 text-sm mt-0.5">{transaction.party_name}</div>
              <div className="text-[11px] text-slate-600">Metode Bayar: {transaction.payment_method}</div>
            </div>
            <div className="text-right">
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Dibuat Oleh:</span>
              <div className="font-semibold text-slate-800 text-xs mt-0.5">{transaction.created_by || 'Admin ERP'}</div>
              <div className="text-[10px] text-slate-500">Divisi Keuangan & Administrasi</div>
            </div>
          </div>

          {/* Table Items */}
          <table className="w-full text-left border-collapse mb-6">
            <thead>
              <tr className="border-b-2 border-slate-300 text-[10px] uppercase font-bold text-slate-500">
                <th className="py-2 px-1">No</th>
                <th className="py-2 px-2">Rincian Deskripsi / Produk</th>
                <th className="py-2 px-2 text-center">Jumlah</th>
                <th className="py-2 px-2 text-right">Harga Satuan</th>
                <th className="py-2 px-2 text-right">Subtotal</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-xs">
              {items && items.length > 0 ? (
                items.map((it, idx) => (
                  <tr key={idx}>
                    <td className="py-2 px-1 text-slate-400">{idx + 1}</td>
                    <td className="py-2 px-2 font-medium text-slate-800">{it.item_name}</td>
                    <td className="py-2 px-2 text-center text-slate-600">{it.quantity}</td>
                    <td className="py-2 px-2 text-right text-slate-600">{formatRupiah(it.unit_price)}</td>
                    <td className="py-2 px-2 text-right font-semibold text-slate-900">{formatRupiah(it.total_price)}</td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={5} className="py-3 text-center text-slate-400 italic">
                    {transaction.notes || 'Transaksi operasional korporat langsung'}
                  </td>
                </tr>
              )}
            </tbody>
          </table>

          {/* Summary calculations */}
          <div className="flex justify-end mb-8">
            <div className="w-64 space-y-1.5 text-xs">
              <div className="flex justify-between py-1 text-slate-600">
                <span>Subtotal Barang/Jasa:</span>
                <span className="font-mono">{formatRupiah(transaction.subtotal)}</span>
              </div>
              {transaction.tax > 0 && (
                <div className="flex justify-between py-1 text-slate-600">
                  <span>Pajak PPN (11%):</span>
                  <span className="font-mono">{formatRupiah(transaction.tax)}</span>
                </div>
              )}
              {transaction.discount > 0 && (
                <div className="flex justify-between py-1 text-emerald-600">
                  <span>Diskon Khusus:</span>
                  <span className="font-mono">-{formatRupiah(transaction.discount)}</span>
                </div>
              )}
              <div className="flex justify-between py-2 border-t-2 border-slate-900 text-sm font-extrabold text-slate-900">
                <span>Total Akhir:</span>
                <span className="font-mono text-blue-700">{formatRupiah(transaction.total)}</span>
              </div>
            </div>
          </div>

          {/* Notes & Signatures */}
          <div className="grid grid-cols-2 gap-6 pt-4 border-t border-slate-200">
            <div>
              <span className="text-[10px] font-bold text-slate-400 uppercase">Catatan / Keterangan:</span>
              <p className="text-[11px] text-slate-600 mt-1 italic leading-relaxed">
                {transaction.notes || 'Terima kasih atas kerja sama bisnis dengan PT Nusantara Megah Perkasa.'}
              </p>
            </div>
            <div className="text-center flex flex-col items-center justify-end">
              <p className="text-[10px] text-slate-500 mb-12">Jakarta, {formatDate(transaction.date)}</p>
              <div className="w-40 border-b border-slate-400 pb-1 font-bold text-xs text-slate-800">
                {transaction.created_by || 'Finance Officer'}
              </div>
              <span className="text-[9px] text-slate-400 uppercase tracking-wider">Otorisasi Resmi</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
