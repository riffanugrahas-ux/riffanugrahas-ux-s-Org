import React, { useState } from 'react';
import { useAuth } from '../contexts/AuthContext';
import {
  Building2,
  Database,
  LogOut,
  User,
  KeyRound,
  Shield,
  Check,
  X,
  AlertCircle
} from 'lucide-react';
import { api } from '../services/api';

interface NavbarProps {
  onNavigate: (view: string) => void;
  currentView: string;
}

export const Navbar: React.FC<NavbarProps> = ({ onNavigate }) => {
  const { user, logout } = useAuth();
  const [showProfileModal, setShowProfileModal] = useState(false);
  const [showPasswordModal, setShowPasswordModal] = useState(false);
  const [oldPassword, setOldPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [passwordMsg, setPasswordMsg] = useState<{ type: 'success' | 'error'; text: string } | null>(null);
  const [isUpdatingPassword, setIsUpdatingPassword] = useState(false);

  const handlePasswordSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!oldPassword || !newPassword) return;
    setIsUpdatingPassword(true);
    setPasswordMsg(null);
    try {
      await api.changePassword(oldPassword, newPassword);
      setPasswordMsg({ type: 'success', text: 'Kata sandi berhasil diperbarui.' });
      setOldPassword('');
      setNewPassword('');
      setTimeout(() => setShowPasswordModal(false), 1500);
    } catch (err: any) {
      setPasswordMsg({ type: 'error', text: err.message || 'Gagal mengubah kata sandi.' });
    } finally {
      setIsUpdatingPassword(false);
    }
  };

  return (
    <>
      <header className="sticky top-0 z-30 bg-slate-900/90 backdrop-blur-md border-b border-slate-800 text-white">
        <div className="px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          {/* Logo & Company Name */}
          <div className="flex items-center gap-3">
            <div className="flex items-center justify-center w-10 h-10 rounded-xl bg-gradient-to-tr from-blue-600 to-indigo-600 shadow-md shadow-blue-500/20 border border-blue-400/30">
              <Building2 className="w-5 h-5 text-white" />
            </div>
            <div>
              <div className="font-bold text-sm sm:text-base leading-tight tracking-tight flex items-center gap-2">
                <span>PT Nusantara Megah Perkasa</span>
                <span className="hidden md:inline-block px-2 py-0.5 text-[10px] uppercase font-semibold rounded bg-blue-500/10 text-blue-400 border border-blue-500/20">
                  ERP Enterprise
                </span>
              </div>
              <div className="text-xs text-slate-400 hidden sm:block">
                Sistem Manajemen Terpadu Perusahaan
              </div>
            </div>
          </div>

          {/* Right Status & User */}
          <div className="flex items-center gap-3 sm:gap-4">
            {/* Real DB Status indicator */}
            <button
              type="button"
              onClick={() => onNavigate('database')}
              className="hidden sm:flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs font-medium bg-emerald-950/60 text-emerald-400 border border-emerald-500/30 hover:bg-emerald-900/40 transition-colors cursor-pointer"
              title="Klik untuk melihat Status & Skema Real Database SQLite"
            >
              <span className="relative flex h-2 w-2">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
              </span>
              <Database className="w-3.5 h-3.5 text-emerald-400" />
              <span>Real DB: SQLite Aktif</span>
            </button>

            {/* User Profile dropdown button */}
            <div className="flex items-center gap-2 pl-2 border-l border-slate-800">
              <button
                type="button"
                onClick={() => setShowProfileModal(true)}
                className="flex items-center gap-2 text-left p-1.5 rounded-lg hover:bg-slate-800/60 transition-colors"
              >
                <div className="w-8 h-8 rounded-full bg-gradient-to-tr from-indigo-500 to-purple-600 flex items-center justify-center text-xs font-bold text-white shadow-inner">
                  {user?.full_name ? user.full_name.charAt(0) : 'A'}
                </div>
                <div className="hidden md:block">
                  <div className="text-xs font-semibold text-white leading-tight">
                    {user?.full_name || user?.username}
                  </div>
                  <div className="text-[10px] text-slate-400 flex items-center gap-1 font-mono">
                    <Shield className="w-3 h-3 text-blue-400" />
                    <span>{user?.role}</span>
                  </div>
                </div>
              </button>

              {/* Logout Button */}
              <button
                type="button"
                onClick={logout}
                className="p-2 text-slate-400 hover:text-rose-400 hover:bg-rose-500/10 rounded-lg transition-colors cursor-pointer"
                title="Keluar (Logout)"
              >
                <LogOut className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>
      </header>

      {/* User Profile Modal */}
      {showProfileModal && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl max-w-md w-full p-6 shadow-2xl relative">
            <button
              onClick={() => setShowProfileModal(false)}
              className="absolute top-4 right-4 p-1 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800"
            >
              <X className="w-5 h-5" />
            </button>

            <div className="flex items-center gap-3.5 mb-6">
              <div className="w-14 h-14 rounded-2xl bg-gradient-to-tr from-indigo-500 to-blue-600 flex items-center justify-center text-xl font-bold text-white shadow-lg">
                {user?.full_name?.charAt(0) || 'U'}
              </div>
              <div>
                <h3 className="text-lg font-bold text-white">{user?.full_name}</h3>
                <p className="text-xs text-slate-400">{user?.email}</p>
                <div className="mt-1 inline-flex items-center gap-1 px-2 py-0.5 rounded text-[11px] font-semibold bg-blue-500/10 text-blue-400 border border-blue-500/20">
                  <Shield className="w-3 h-3" /> Peran: {user?.role}
                </div>
              </div>
            </div>

            <div className="space-y-3 bg-slate-950/60 p-4 rounded-xl border border-slate-800 text-xs">
              <div className="flex justify-between py-1 border-b border-slate-800">
                <span className="text-slate-400">Username:</span>
                <span className="font-mono text-slate-200">{user?.username}</span>
              </div>
              <div className="flex justify-between py-1 border-b border-slate-800">
                <span className="text-slate-400">Nomor Telepon:</span>
                <span className="text-slate-200">{user?.phone || '-'}</span>
              </div>
              <div className="flex justify-between py-1 border-b border-slate-800">
                <span className="text-slate-400">Sesi Login:</span>
                <span className="text-emerald-400 flex items-center gap-1">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" /> Aktif
                </span>
              </div>
            </div>

            <div className="mt-6 flex flex-col sm:flex-row gap-2.5">
              <button
                type="button"
                onClick={() => {
                  setShowProfileModal(false);
                  setShowPasswordModal(true);
                }}
                className="flex-1 py-2.5 px-4 rounded-xl bg-slate-800 hover:bg-slate-700 text-xs font-semibold text-white flex items-center justify-center gap-2 transition-colors cursor-pointer"
              >
                <KeyRound className="w-4 h-4 text-amber-400" />
                <span>Ubah Password</span>
              </button>
              <button
                type="button"
                onClick={logout}
                className="py-2.5 px-4 rounded-xl bg-rose-600/20 hover:bg-rose-600/30 text-rose-300 border border-rose-500/30 text-xs font-semibold flex items-center justify-center gap-2 transition-colors cursor-pointer"
              >
                <LogOut className="w-4 h-4" />
                <span>Keluar</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Change Password Modal */}
      {showPasswordModal && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl max-w-sm w-full p-6 shadow-2xl relative">
            <button
              onClick={() => setShowPasswordModal(false)}
              className="absolute top-4 right-4 p-1 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800"
            >
              <X className="w-5 h-5" />
            </button>

            <div className="flex items-center gap-2 mb-4">
              <div className="p-2 rounded-xl bg-amber-500/10 text-amber-400">
                <KeyRound className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-base font-bold text-white">Ganti Kata Sandi</h3>
                <p className="text-xs text-slate-400">Perbarui kata sandi akun Anda</p>
              </div>
            </div>

            {passwordMsg && (
              <div
                className={`mb-4 p-3 rounded-xl text-xs flex items-center gap-2 ${
                  passwordMsg.type === 'success'
                    ? 'bg-emerald-500/10 border border-emerald-500/30 text-emerald-300'
                    : 'bg-rose-500/10 border border-rose-500/30 text-rose-300'
                }`}
              >
                {passwordMsg.type === 'success' ? (
                  <Check className="w-4 h-4 text-emerald-400" />
                ) : (
                  <AlertCircle className="w-4 h-4 text-rose-400" />
                )}
                <span>{passwordMsg.text}</span>
              </div>
            )}

            <form onSubmit={handlePasswordSubmit} className="space-y-3.5">
              <div>
                <label className="block text-xs font-medium text-slate-300 mb-1">
                  Kata Sandi Lama
                </label>
                <input
                  type="password"
                  value={oldPassword}
                  onChange={(e) => setOldPassword(e.target.value)}
                  required
                  placeholder="Masukkan password lama"
                  className="w-full px-3 py-2 bg-slate-950 border border-slate-700 rounded-xl text-sm text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-300 mb-1">
                  Kata Sandi Baru
                </label>
                <input
                  type="password"
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  required
                  minLength={6}
                  placeholder="Minimal 6 karakter"
                  className="w-full px-3 py-2 bg-slate-950 border border-slate-700 rounded-xl text-sm text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div className="pt-2 flex gap-2">
                <button
                  type="button"
                  onClick={() => setShowPasswordModal(false)}
                  className="flex-1 py-2 px-3 rounded-xl bg-slate-800 text-slate-300 text-xs font-medium hover:bg-slate-700"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  disabled={isUpdatingPassword}
                  className="flex-1 py-2 px-3 rounded-xl bg-blue-600 hover:bg-blue-500 text-white text-xs font-medium disabled:opacity-50"
                >
                  {isUpdatingPassword ? 'Menyimpan...' : 'Simpan Sandi'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </>
  );
};
