import React from 'react';
import {
  LayoutDashboard,
  Users,
  Package,
  Layers,
  Briefcase,
  Truck,
  Receipt,
  ShoppingCart,
  TrendingDown,
  CircleDollarSign,
  PieChart,
  Database,
  History,
  Building,
} from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';

interface SidebarProps {
  currentView: string;
  onNavigate: (view: string) => void;
  isOpen: boolean;
  onClose: () => void;
}

interface MenuItem {
  id: string;
  label: string;
  icon: React.ComponentType<{ className?: string }>;
  badge?: string;
  highlight?: boolean;
}

interface MenuSection {
  title: string;
  items: MenuItem[];
}

export const Sidebar: React.FC<SidebarProps> = ({ currentView, onNavigate, isOpen, onClose }) => {
  const { user } = useAuth();

  const menuSections: MenuSection[] = [
    {
      title: 'IKHTISAR',
      items: [
        { id: 'dashboard', label: 'Dashboard Eksekutif', icon: LayoutDashboard },
      ],
    },
    {
      title: 'MASTER DATA',
      items: [
        { id: 'employees', label: 'Data Karyawan', icon: Users, badge: 'SDM' },
        { id: 'products', label: 'Produk & Stok', icon: Package, badge: 'Aset' },
        { id: 'departments', label: 'Departemen', icon: Layers },
        { id: 'clients', label: 'Klien & Pelanggan', icon: Briefcase },
        { id: 'suppliers', label: 'Supplier & Vendor', icon: Truck },
      ],
    },
    {
      title: 'TRANSAKSI DATA',
      items: [
        { id: 'transactions', label: 'Semua Transaksi', icon: Receipt },
        { id: 'sales', label: 'Penjualan (Sales)', icon: ShoppingCart },
        { id: 'purchases', label: 'Pengadaan (PO)', icon: TrendingDown },
        { id: 'payroll', label: 'Penggajian (Payroll)', icon: CircleDollarSign },
      ],
    },
    {
      title: 'LAPORAN & ANALISIS',
      items: [
        { id: 'reports', label: 'Pusat Laporan & Laba', icon: PieChart },
      ],
    },
    {
      title: 'DATABASE & SISTEM',
      items: [
        { id: 'database', label: 'Real SQLite Database', icon: Database, highlight: true },
        { id: 'audit', label: 'Riwayat Audit Trail', icon: History },
        { id: 'company', label: 'Profil Perusahaan', icon: Building },
      ],
    },
  ];

  const handleItemClick = (id: string) => {
    onNavigate(id);
    if (window.innerWidth < 1024) {
      onClose();
    }
  };

  return (
    <>
      {/* Mobile Backdrop */}
      {isOpen && (
        <div
          onClick={onClose}
          className="fixed inset-0 z-40 bg-black/60 backdrop-blur-sm lg:hidden"
        />
      )}

      {/* Sidebar Container */}
      <aside
        className={`fixed lg:sticky top-0 lg:top-16 z-40 lg:z-10 h-screen lg:h-[calc(100vh-4rem)] w-64 bg-slate-900 border-r border-slate-800 flex flex-col justify-between transition-transform duration-300 ease-in-out ${
          isOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'
        }`}
      >
        <div className="flex-1 overflow-y-auto py-5 px-3 space-y-6">
          {menuSections.map((section, idx) => (
            <div key={idx} className="space-y-1">
              <div className="px-3 text-[11px] font-bold tracking-wider text-slate-400 uppercase">
                {section.title}
              </div>
              <div className="space-y-0.5 pt-1">
                {section.items.map((item) => {
                  const Icon = item.icon;
                  const isActive = currentView === item.id;
                  return (
                    <button
                      key={item.id}
                      type="button"
                      onClick={() => handleItemClick(item.id)}
                      className={`w-full flex items-center justify-between px-3 py-2 rounded-xl text-xs font-medium transition-all cursor-pointer ${
                        isActive
                          ? 'bg-blue-600 text-white shadow-md shadow-blue-600/30 font-semibold'
                          : 'text-slate-300 hover:bg-slate-800/70 hover:text-white'
                      }`}
                    >
                      <div className="flex items-center gap-2.5">
                        <Icon className={`w-4 h-4 ${isActive ? 'text-white' : 'text-slate-400'}`} />
                        <span>{item.label}</span>
                      </div>
                      {item.badge && (
                        <span
                          className={`text-[10px] px-1.5 py-0.2 rounded font-mono ${
                            isActive
                              ? 'bg-blue-700 text-white'
                              : 'bg-slate-800 text-slate-400'
                          }`}
                        >
                          {item.badge}
                        </span>
                      )}
                      {item.highlight && !isActive && (
                        <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
                      )}
                    </button>
                  );
                })}
              </div>
            </div>
          ))}
        </div>

        {/* Database Live Footnote */}
        <div className="p-3 border-t border-slate-800/80 bg-slate-950/40">
          <div className="p-2.5 rounded-xl bg-slate-900 border border-slate-800 flex items-center gap-2.5 text-xs">
            <div className="p-1.5 rounded-lg bg-emerald-500/10 text-emerald-400">
              <Database className="w-4 h-4" />
            </div>
            <div className="flex-1 truncate">
              <div className="text-[11px] font-semibold text-slate-200">SQLite Engine</div>
              <div className="text-[10px] text-slate-400 truncate">data/company.sqlite</div>
            </div>
          </div>
        </div>
      </aside>
    </>
  );
};
