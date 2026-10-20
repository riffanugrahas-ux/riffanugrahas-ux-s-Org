import React, { useState } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { Building2, Lock, User, Eye, EyeOff, ShieldCheck, Database, ArrowRight, CheckCircle2 } from 'lucide-react';

export const LoginView: React.FC = () => {
  const { login } = useAuth();
  const [usernameOrEmail, setUsernameOrEmail] = useState('admin');
  const [password, setPassword] = useState('admin123');
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!usernameOrEmail || !password) {
      setErrorMsg('Harap isi username/email dan kata sandi.');
      return;
    }

    setIsLoading(true);
    setErrorMsg('');

    try {
      await login(usernameOrEmail, password);
    } catch (err: any) {
      setErrorMsg(err.message || 'Login gagal. Periksa kembali username dan kata sandi Anda.');
    } finally {
      setIsLoading(false);
    }
  };

  const setCredentials = (user: string, pass: string) => {
    setUsernameOrEmail(user);
    setPassword(pass);
    setErrorMsg('');
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col justify-center py-12 px-4 sm:px-6 lg:px-8 relative overflow-hidden">
      {/* Background Glow */}
      <div className="absolute top-1/4 left-1/2 -translate-x-1/2 w-[600px] h-[350px] bg-blue-600/10 blur-[130px] rounded-full pointer-events-none" />
      <div className="absolute -bottom-20 right-10 w-[400px] h-[300px] bg-indigo-600/10 blur-[120px] rounded-full pointer-events-none" />

      <div className="sm:mx-auto sm:w-full sm:max-w-md relative z-10">
        {/* Brand header */}
        <div className="text-center">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-gradient-to-tr from-blue-600 to-indigo-500 shadow-xl shadow-blue-500/20 mb-4 border border-blue-400/30">
            <Building2 className="w-9 h-9 text-white" />
          </div>
          <h2 className="text-3xl font-extrabold tracking-tight text-white">
            Sistem Manajemen Perusahaan
          </h2>
          <p className="mt-2 text-sm text-slate-400">
            Enterprise Resource Planning & Database Real Terintegrasi
          </p>
          <div className="mt-3 inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-medium bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
            <Database className="w-3.5 h-3.5" />
            <span>Terhubung ke Real Database SQLite (data/company.sqlite)</span>
          </div>
        </div>

        {/* Card */}
        <div className="mt-8 bg-slate-900/90 backdrop-blur-xl border border-slate-800 shadow-2xl rounded-2xl p-6 sm:p-8">
          <div className="mb-6 pb-4 border-b border-slate-800 flex items-center justify-between">
            <div>
              <h3 className="text-lg font-semibold text-white">Form Login Admin / Staf</h3>
              <p className="text-xs text-slate-400">Masukkan kredensial akun terdaftar</p>
            </div>
            <div className="p-2 rounded-lg bg-blue-500/10 text-blue-400">
              <ShieldCheck className="w-5 h-5" />
            </div>
          </div>

          {errorMsg && (
            <div className="mb-5 p-3.5 rounded-xl bg-rose-500/10 border border-rose-500/20 text-rose-300 text-xs flex items-start gap-2.5">
              <span className="font-semibold text-rose-400 mt-0.5">Peringatan:</span>
              <p className="flex-1">{errorMsg}</p>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-slate-300 mb-1.5">
                Username atau Email
              </label>
              <div className="relative rounded-xl shadow-sm">
                <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                  <User className="w-4 h-4" />
                </div>
                <input
                  type="text"
                  value={usernameOrEmail}
                  onChange={(e) => setUsernameOrEmail(e.target.value)}
                  placeholder="admin atau email@perusahaan.co.id"
                  required
                  className="block w-full pl-10 pr-3 py-2.5 text-sm bg-slate-950/70 border border-slate-700/80 rounded-xl text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-slate-300 mb-1.5">
                Kata Sandi (Password)
              </label>
              <div className="relative rounded-xl shadow-sm">
                <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                  <Lock className="w-4 h-4" />
                </div>
                <input
                  type={showPassword ? 'text' : 'password'}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  required
                  className="block w-full pl-10 pr-10 py-2.5 text-sm bg-slate-950/70 border border-slate-700/80 rounded-xl text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute inset-y-0 right-0 pr-3.5 flex items-center text-slate-400 hover:text-slate-200"
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            <button
              type="submit"
              disabled={isLoading}
              className="w-full mt-2 flex items-center justify-center gap-2 py-3 px-4 rounded-xl font-medium text-sm text-white bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 shadow-lg shadow-blue-600/30 disabled:opacity-50 transition-all cursor-pointer"
            >
              {isLoading ? (
                <>
                  <div className="w-4 h-4 border-2 border-white/20 border-t-white rounded-full animate-spin" />
                  <span>Memverifikasi akun ke database...</span>
                </>
              ) : (
                <>
                  <span>Masuk ke Dashboard ERP</span>
                  <ArrowRight className="w-4 h-4" />
                </>
              )}
            </button>
          </form>

          {/* Quick Login Helper */}
          <div className="mt-6 pt-5 border-t border-slate-800">
            <div className="flex items-center justify-between mb-3">
              <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">
                Akun Demo Cepat (1-Klik):
              </span>
              <span className="text-[11px] text-blue-400 font-mono">SQLite Seeder</span>
            </div>

            <div className="grid grid-cols-1 gap-2">
              <button
                type="button"
                onClick={() => setCredentials('admin', 'admin123')}
                className={`p-2.5 rounded-xl border text-left flex items-center justify-between transition-all ${
                  usernameOrEmail === 'admin'
                    ? 'bg-blue-600/20 border-blue-500/50 text-blue-200'
                    : 'bg-slate-950/60 border-slate-800/80 text-slate-300 hover:bg-slate-800/60'
                }`}
              >
                <div>
                  <div className="text-xs font-semibold flex items-center gap-1.5">
                    <span className="w-2 h-2 rounded-full bg-blue-500" />
                    Admin Utama (Akses Penuh CRUD)
                  </div>
                  <div className="text-[11px] text-slate-400 font-mono mt-0.5">
                    User: <strong className="text-slate-200">admin</strong> • Pass: <strong className="text-slate-200">admin123</strong>
                  </div>
                </div>
                {usernameOrEmail === 'admin' && <CheckCircle2 className="w-4 h-4 text-blue-400" />}
              </button>

              <button
                type="button"
                onClick={() => setCredentials('keuangan', 'keuangan123')}
                className={`p-2.5 rounded-xl border text-left flex items-center justify-between transition-all ${
                  usernameOrEmail === 'keuangan'
                    ? 'bg-emerald-600/20 border-emerald-500/50 text-emerald-200'
                    : 'bg-slate-950/60 border-slate-800/80 text-slate-300 hover:bg-slate-800/60'
                }`}
              >
                <div>
                  <div className="text-xs font-semibold flex items-center gap-1.5">
                    <span className="w-2 h-2 rounded-full bg-emerald-500" />
                    Manager Keuangan (Laporan & Transaksi)
                  </div>
                  <div className="text-[11px] text-slate-400 font-mono mt-0.5">
                    User: <strong className="text-slate-200">keuangan</strong> • Pass: <strong className="text-slate-200">keuangan123</strong>
                  </div>
                </div>
                {usernameOrEmail === 'keuangan' && <CheckCircle2 className="w-4 h-4 text-emerald-400" />}
              </button>

              <button
                type="button"
                onClick={() => setCredentials('staff', 'staff123')}
                className={`p-2.5 rounded-xl border text-left flex items-center justify-between transition-all ${
                  usernameOrEmail === 'staff'
                    ? 'bg-amber-600/20 border-amber-500/50 text-amber-200'
                    : 'bg-slate-950/60 border-slate-800/80 text-slate-300 hover:bg-slate-800/60'
                }`}
              >
                <div>
                  <div className="text-xs font-semibold flex items-center gap-1.5">
                    <span className="w-2 h-2 rounded-full bg-amber-500" />
                    Staf Operasional (Input Data Transaksi)
                  </div>
                  <div className="text-[11px] text-slate-400 font-mono mt-0.5">
                    User: <strong className="text-slate-200">staff</strong> • Pass: <strong className="text-slate-200">staff123</strong>
                  </div>
                </div>
                {usernameOrEmail === 'staff' && <CheckCircle2 className="w-4 h-4 text-amber-400" />}
              </button>
            </div>
          </div>
        </div>

        {/* Footer info */}
        <div className="text-center mt-6 text-xs text-slate-500">
          PT Nusantara Megah Perkasa &copy; 2026. Hak Cipta Dilindungi Undang-Undang.
        </div>
      </div>
    </div>
  );
};
