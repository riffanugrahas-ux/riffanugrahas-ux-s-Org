import React, { useState, useEffect } from 'react';
import { SystemStatus, AuditLog, CompanyProfile } from '../types';
import { api, formatDate } from '../services/api';
import {
  Database,
  HardDrive,
  CheckCircle2,
  Table,
  History,
  Building,
  RefreshCw,
  Server,
  FileCode,
  ShieldAlert,
  Save
} from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';

export const DatabaseStatusView: React.FC = () => {
  const { user } = useAuth();
  const [status, setStatus] = useState<SystemStatus | null>(null);
  const [auditLogs, setAuditLogs] = useState<AuditLog[]>([]);
  const [company, setCompany] = useState<CompanyProfile | null>(null);
  const [loading, setLoading] = useState(true);

  // Profile edit form
  const [compName, setCompName] = useState('');
  const [compLegal, setCompLegal] = useState('');
  const [compNpwp, setCompNpwp] = useState('');
  const [compEmail, setCompEmail] = useState('');
  const [compPhone, setCompPhone] = useState('');
  const [compAddress, setCompAddress] = useState('');
  const [compWebsite, setCompWebsite] = useState('');
  const [isSavingProfile, setIsSavingProfile] = useState(false);
  const [profileMsg, setProfileMsg] = useState('');

  const loadData = async () => {
    try {
      setLoading(true);
      const [statusRes, logsRes, profileRes] = await Promise.all([
        api.getSystemStatus(),
        api.getAuditLogs(),
        api.getCompanyProfile(),
      ]);
      setStatus(statusRes);
      setAuditLogs(logsRes.logs);
      if (profileRes.profile) {
        setCompany(profileRes.profile);
        setCompName(profileRes.profile.name);
        setCompLegal(profileRes.profile.legal_name || '');
        setCompNpwp(profileRes.profile.npwp || '');
        setCompEmail(profileRes.profile.email || '');
        setCompPhone(profileRes.profile.phone || '');
        setCompAddress(profileRes.profile.address || '');
        setCompWebsite(profileRes.profile.website || '');
      }
    } catch (err: any) {
      console.error('Error fetching system status:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const handleSaveProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSavingProfile(true);
    setProfileMsg('');
    try {
      await api.updateCompanyProfile({
        name: compName,
        legal_name: compLegal,
        npwp: compNpwp,
        email: compEmail,
        phone: compPhone,
        address: compAddress,
        website: compWebsite,
      });
      setProfileMsg('Profil perusahaan berhasil disimpan ke database!');
      setTimeout(() => setProfileMsg(''), 3000);
    } catch (err: any) {
      alert(err.message || 'Gagal menyimpan profil');
    } finally {
      setIsSavingProfile(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-2xl font-bold text-white tracking-tight">Status Real Database & Konfigurasi</h1>
            <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 font-mono">
              Online & Connected
            </span>
          </div>
          <p className="text-xs text-slate-400 mt-1">
            Status mesin database relasional SQLite, ukuran file biner penyimpanan, dan riwayat audit trail log.
          </p>
        </div>

        <button
          onClick={loadData}
          className="py-2.5 px-3.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold flex items-center gap-2 border border-slate-700 cursor-pointer self-start sm:self-auto"
        >
          <RefreshCw className="w-4 h-4" />
          <span>Refresh Status</span>
        </button>
      </div>

      {/* Database Diagnostic Cards */}
      {status && (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="p-5 rounded-2xl bg-slate-900/90 border border-slate-800">
            <div className="flex items-center justify-between text-slate-400 text-xs font-medium">
              <span>Mesin Database</span>
              <Database className="w-4 h-4 text-emerald-400" />
            </div>
            <div className="mt-2 text-base font-bold text-white">{status.engine}</div>
            <div className="mt-1 text-[11px] text-emerald-400 flex items-center gap-1">
              <CheckCircle2 className="w-3.5 h-3.5" />
              <span>Full SQL Support & ACID</span>
            </div>
          </div>

          <div className="p-5 rounded-2xl bg-slate-900/90 border border-slate-800">
            <div className="flex items-center justify-between text-slate-400 text-xs font-medium">
              <span>File Disk Database</span>
              <HardDrive className="w-4 h-4 text-blue-400" />
            </div>
            <div className="mt-2 text-sm font-mono font-bold text-white truncate">
              {status.dbFilePath}
            </div>
            <div className="mt-1 text-[11px] text-slate-400">
              Ukuran File: <strong className="text-blue-400 font-mono">{status.fileSizeKb} KB</strong>
            </div>
          </div>

          <div className="p-5 rounded-2xl bg-slate-900/90 border border-slate-800">
            <div className="flex items-center justify-between text-slate-400 text-xs font-medium">
              <span>Waktu Operasional Server</span>
              <Server className="w-4 h-4 text-purple-400" />
            </div>
            <div className="mt-2 text-base font-bold text-white font-mono">
              {Math.floor(status.uptimeSeconds / 60)} Menit {status.uptimeSeconds % 60} Detik
            </div>
            <div className="mt-1 text-[11px] text-slate-400">Express + Vite Middleware</div>
          </div>

          <div className="p-5 rounded-2xl bg-slate-900/90 border border-slate-800">
            <div className="flex items-center justify-between text-slate-400 text-xs font-medium">
              <span>Log Audit Keamanan</span>
              <History className="w-4 h-4 text-amber-400" />
            </div>
            <div className="mt-2 text-base font-bold text-white font-mono">
              {auditLogs.length} Catatan Aktivitas
            </div>
            <div className="mt-1 text-[11px] text-slate-400">Pencatatan CRUD & Login</div>
          </div>
        </div>
      )}

      {/* Table Record Counts */}
      {status?.tables && (
        <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-5 shadow-xl">
          <div className="flex items-center gap-2 mb-4 pb-3 border-b border-slate-800">
            <Table className="w-4 h-4 text-blue-400" />
            <h3 className="text-sm font-bold text-white">Jumlah Baris Data per Tabel SQLite</h3>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-7 gap-3">
            {Object.entries(status.tables).map(([tbl, count]) => (
              <div key={tbl} className="p-3 bg-slate-950/70 border border-slate-800 rounded-xl">
                <div className="text-[10px] text-slate-400 uppercase font-mono truncate">{tbl}</div>
                <div className="text-lg font-bold font-mono text-white mt-1">{count} baris</div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Company Profile Configuration */}
      <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-6 shadow-xl">
        <div className="flex items-center gap-2.5 mb-4 pb-3 border-b border-slate-800">
          <Building className="w-5 h-5 text-indigo-400" />
          <div>
            <h3 className="text-base font-bold text-white">Profil Resmi Badan Usaha</h3>
            <p className="text-xs text-slate-400">
              Informasi ini dicetak otomatis pada kop surat faktur, invoice, dan laporan keuangan
            </p>
          </div>
        </div>

        {profileMsg && (
          <div className="mb-4 p-3 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-300 text-xs flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 text-emerald-400" />
            <span>{profileMsg}</span>
          </div>
        )}

        <form onSubmit={handleSaveProfile} className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1">
                Nama Merek Dagang
              </label>
              <input
                type="text"
                value={compName}
                onChange={(e) => setCompName(e.target.value)}
                required
                className="w-full px-3 py-2 bg-slate-950 border border-slate-700 rounded-xl text-xs text-white"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1">
                Nama Badan Hukum Lengkap
              </label>
              <input
                type="text"
                value={compLegal}
                onChange={(e) => setCompLegal(e.target.value)}
                className="w-full px-3 py-2 bg-slate-950 border border-slate-700 rounded-xl text-xs text-white"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1">
                NPWP Perusahaan
              </label>
              <input
                type="text"
                value={compNpwp}
                onChange={(e) => setCompNpwp(e.target.value)}
                className="w-full px-3 py-2 bg-slate-950 border border-slate-700 rounded-xl text-xs text-white font-mono"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1">
                Email Perusahaan
              </label>
              <input
                type="email"
                value={compEmail}
                onChange={(e) => setCompEmail(e.target.value)}
                className="w-full px-3 py-2 bg-slate-950 border border-slate-700 rounded-xl text-xs text-white"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1">
                Nomor Telepon
              </label>
              <input
                type="text"
                value={compPhone}
                onChange={(e) => setCompPhone(e.target.value)}
                className="w-full px-3 py-2 bg-slate-950 border border-slate-700 rounded-xl text-xs text-white"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1">
              Alamat Kantor Pusat
            </label>
            <input
              type="text"
              value={compAddress}
              onChange={(e) => setCompAddress(e.target.value)}
              className="w-full px-3 py-2 bg-slate-950 border border-slate-700 rounded-xl text-xs text-white"
            />
          </div>

          <div className="flex justify-end pt-2">
            <button
              type="submit"
              disabled={isSavingProfile}
              className="py-2.5 px-4 rounded-xl bg-blue-600 hover:bg-blue-500 text-xs font-semibold text-white flex items-center gap-2 cursor-pointer shadow disabled:opacity-50"
            >
              <Save className="w-4 h-4" />
              <span>{isSavingProfile ? 'Menyimpan...' : 'Simpan Profil Perusahaan'}</span>
            </button>
          </div>
        </form>
      </div>

      {/* Audit Logs Table */}
      <div className="bg-slate-900/90 border border-slate-800 rounded-2xl overflow-hidden shadow-xl">
        <div className="p-5 border-b border-slate-800 flex items-center justify-between">
          <div>
            <h3 className="text-base font-bold text-white">Audit Trail Log (Aktivitas Sistem)</h3>
            <p className="text-xs text-slate-400">Pencatatan setiap operasi CRUD dan otentikasi login secara transparan</p>
          </div>
        </div>

        <div className="overflow-x-auto max-h-80">
          <table className="w-full text-left text-xs">
            <thead>
              <tr className="border-b border-slate-800 bg-slate-950/60 text-slate-400 font-semibold uppercase text-[10px]">
                <th className="py-2.5 px-4">Waktu</th>
                <th className="py-2.5 px-4">Pengguna</th>
                <th className="py-2.5 px-4">Aksi</th>
                <th className="py-2.5 px-4">Modul</th>
                <th className="py-2.5 px-4">Rincian Operasi</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60 font-mono text-[11px]">
              {auditLogs.map((log) => (
                <tr key={log.id} className="hover:bg-slate-800/40">
                  <td className="py-2.5 px-4 text-slate-400">{log.created_at}</td>
                  <td className="py-2.5 px-4 font-bold text-white">{log.user_name}</td>
                  <td className="py-2.5 px-4">
                    <span className={`px-1.5 py-0.5 rounded text-[10px] font-bold ${
                      log.action === 'CREATE' ? 'bg-emerald-500/20 text-emerald-400' :
                      log.action === 'UPDATE' ? 'bg-blue-500/20 text-blue-400' :
                      log.action === 'DELETE' ? 'bg-rose-500/20 text-rose-400' :
                      'bg-purple-500/20 text-purple-400'
                    }`}>
                      {log.action}
                    </span>
                  </td>
                  <td className="py-2.5 px-4 text-slate-300">{log.module}</td>
                  <td className="py-2.5 px-4 text-slate-300 font-sans text-xs">{log.details}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
