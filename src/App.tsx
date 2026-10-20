/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { AuthProvider, useAuth } from './contexts/AuthContext';
import { LoginView } from './components/LoginView';
import { Navbar } from './components/Navbar';
import { Sidebar } from './components/Sidebar';
import { DashboardView } from './views/DashboardView';
import { EmployeesView } from './views/EmployeesView';
import { ProductsView } from './views/ProductsView';
import { DepartmentsView } from './views/DepartmentsView';
import { ClientsView } from './views/ClientsView';
import { SuppliersView } from './views/SuppliersView';
import { TransactionsView } from './views/TransactionsView';
import { ReportsView } from './views/ReportsView';
import { DatabaseStatusView } from './views/DatabaseStatusView';
import { Menu, Database } from 'lucide-react';

function AppContent() {
  const { isAuthenticated, loading } = useAuth();
  const [currentView, setCurrentView] = useState<string>('dashboard');
  const [sidebarOpen, setSidebarOpen] = useState(false);

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-950 flex flex-col items-center justify-center gap-3 text-slate-300">
        <div className="w-10 h-10 border-3 border-blue-500/20 border-t-blue-500 rounded-full animate-spin" />
        <div className="flex items-center gap-2 text-xs font-medium text-slate-400">
          <Database className="w-4 h-4 text-emerald-400" />
          <span>Memeriksa koneksi ke real database SQLite...</span>
        </div>
      </div>
    );
  }

  if (!isAuthenticated) {
    return <LoginView />;
  }

  const renderView = () => {
    switch (currentView) {
      case 'dashboard':
        return <DashboardView onNavigate={setCurrentView} />;
      case 'employees':
        return <EmployeesView />;
      case 'products':
        return <ProductsView />;
      case 'departments':
        return <DepartmentsView />;
      case 'clients':
        return <ClientsView />;
      case 'suppliers':
        return <SuppliersView />;
      case 'transactions':
        return <TransactionsView />;
      case 'sales':
        return <TransactionsView initialType="PENJUALAN" />;
      case 'purchases':
        return <TransactionsView initialType="PENGADAAN" />;
      case 'payroll':
        return <TransactionsView initialType="PENGGAJIAN" />;
      case 'reports':
        return <ReportsView />;
      case 'database':
      case 'audit':
      case 'company':
        return <DatabaseStatusView />;
      default:
        return <DashboardView onNavigate={setCurrentView} />;
    }
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col font-sans selection:bg-blue-600 selection:text-white">
      {/* Top Navbar */}
      <Navbar onNavigate={setCurrentView} currentView={currentView} />

      <div className="flex flex-1 relative">
        {/* Navigation Sidebar */}
        <Sidebar
          currentView={currentView}
          onNavigate={setCurrentView}
          isOpen={sidebarOpen}
          onClose={() => setSidebarOpen(false)}
        />

        {/* Main Content Area */}
        <main className="flex-1 min-w-0 p-4 sm:p-6 lg:p-8 overflow-y-auto">
          {/* Mobile menu toggle bar */}
          <div className="lg:hidden flex items-center justify-between pb-4 mb-4 border-b border-slate-800">
            <button
              type="button"
              onClick={() => setSidebarOpen(true)}
              className="p-2 rounded-xl bg-slate-900 border border-slate-800 text-slate-300 hover:text-white flex items-center gap-2 text-xs"
            >
              <Menu className="w-4 h-4" />
              <span>Menu Navigasi ERP</span>
            </button>
            <div className="flex items-center gap-1.5 text-[11px] font-mono text-emerald-400">
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
              <span>SQLite Connected</span>
            </div>
          </div>

          {/* Active View */}
          {renderView()}
        </main>
      </div>
    </div>
  );
}

export default function App() {
  return (
    <AuthProvider>
      <AppContent />
    </AuthProvider>
  );
}
