import React, { useState } from 'react';
import {
  LayoutDashboard,
  Calendar,
  Clock,
  Sparkles,
  Bell,
  BarChart3,
  BookOpen,
  ShoppingBag,
  Target,
  Wallet,
  Users,
  FileText,
  Database,
  Menu,
  X,
  LogOut,
  User,
  ShieldAlert,
  ChevronDown,
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import clubEmblem from '../../assets/images/covo_club_emblem_1791184967951.jpg';

export type ActiveTab =
  | 'dashboard'
  | 'calendar'
  | 'venue-requests'
  | 'cleaning'
  | 'notifications'
  | 'polls'
  | 'regulations'
  | 'purchases'
  | 'goals'
  | 'finances'
  | 'users'
  | 'audit-logs'
  | 'profile'
  | 'supabase-guide';

interface AppLayoutProps {
  activeTab: ActiveTab;
  setActiveTab: (tab: ActiveTab) => void;
  unreadCount: number;
  children: React.ReactNode;
}

export const AppLayout: React.FC<AppLayoutProps> = ({
  activeTab,
  setActiveTab,
  unreadCount,
  children,
}) => {
  const { currentUser, users, isAdmin, isManager, logout, switchUser } = useAuth();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [userMenuOpen, setUserMenuOpen] = useState(false);

  const navItems: { id: ActiveTab; label: string; icon: React.ElementType; adminOnly?: boolean; managerOnly?: boolean; badge?: number }[] = [
    { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
    { id: 'calendar', label: 'Calendario', icon: Calendar },
    { id: 'venue-requests', label: 'Richiesta Locale', icon: Clock },
    { id: 'cleaning', label: 'Turni Pulizie', icon: Sparkles },
    { id: 'notifications', label: 'Notifiche', icon: Bell, badge: unreadCount },
    { id: 'polls', label: 'Sondaggi', icon: BarChart3 },
    { id: 'regulations', label: 'Regolamento', icon: BookOpen },
    { id: 'purchases', label: 'Acquisti', icon: ShoppingBag },
    { id: 'goals', label: 'Obiettivi', icon: Target },
    { id: 'finances', label: 'Finanze & Cassa', icon: Wallet, managerOnly: true },
    { id: 'users', label: 'Gestione Utenti', icon: Users, managerOnly: true },
    { id: 'audit-logs', label: 'Log Attività', icon: FileText, managerOnly: true },
    { id: 'supabase-guide', label: 'Guida Supabase', icon: Database },
  ];

  const handleNavClick = (tab: ActiveTab) => {
    setActiveTab(tab);
    setMobileMenuOpen(false);
  };

  const getRoleLabel = (role?: string) => {
    switch (role) {
      case 'admin':
        return 'Amministratore';
      case 'manager':
        return 'Gestore';
      default:
        return 'Membro';
    }
  };

  const getRoleBadgeClass = (role?: string) => {
    switch (role) {
      case 'admin':
        return 'text-amber-400 bg-amber-400/10 border-amber-400/20';
      case 'manager':
        return 'text-sky-400 bg-sky-400/10 border-sky-400/20';
      default:
        return 'text-emerald-400 bg-emerald-400/10 border-emerald-400/20';
    }
  };

  return (
    <div className="flex h-screen w-full bg-slate-950 text-slate-100 overflow-hidden">
      {/* DESKTOP SIDEBAR */}
      <aside className="hidden lg:flex flex-col w-64 bg-slate-900 border-r border-slate-800 shrink-0">
        {/* Brand Lockup */}
        <div className="flex items-center gap-3 px-5 py-5 border-b border-slate-800">
          <img
            src={clubEmblem}
            alt="Il Covo Emblem"
            className="w-9 h-9 rounded-lg object-cover ring-1 ring-amber-500/30"
          />
          <div className="flex flex-col">
            <span className="font-bold tracking-tight text-white text-base">Il Covo</span>
            <span className="text-xs text-slate-400">Gestionale Locale Condiviso</span>
          </div>
        </div>

        {/* Quick User Switcher for Testing Roles */}
        <div className="px-4 py-3 border-b border-slate-800/60 bg-slate-900/50">
          <div className="text-[11px] font-medium text-slate-400 uppercase tracking-wider mb-1.5 flex items-center justify-between">
            <span>Utente Attivo (Simulatore)</span>
            <span className={`text-[10px] px-1.5 py-0.5 rounded border ${getRoleBadgeClass(currentUser?.role)}`}>
              {getRoleLabel(currentUser?.role)}
            </span>
          </div>
          <select
            value={currentUser?.id || ''}
            onChange={(e) => {
              const u = users.find(x => x.id === e.target.value);
              if (u) switchUser(u);
            }}
            className="w-full bg-slate-800 border border-slate-700 rounded-md text-xs py-1.5 px-2.5 text-slate-200 focus:outline-none focus:border-amber-500"
          >
            {users.map(u => (
              <option key={u.id} value={u.id}>
                {u.first_name} {u.last_name} ({getRoleLabel(u.role)})
              </option>
            ))}
          </select>
        </div>

        {/* Nav Links */}
        <nav className="flex-1 overflow-y-auto p-3 space-y-1">
          {navItems.map((item) => {
            if (item.adminOnly && !isAdmin) return null;
            if (item.managerOnly && !isManager) return null;

            const isActive = activeTab === item.id;
            const Icon = item.icon;

            return (
              <button
                key={item.id}
                onClick={() => handleNavClick(item.id)}
                className={`w-full flex items-center justify-between px-3 py-2 rounded-lg text-xs font-medium transition-colors ${
                  isActive
                    ? 'bg-amber-500/15 text-amber-300 font-semibold border-l-2 border-amber-500'
                    : 'text-slate-300 hover:text-white hover:bg-slate-800/60'
                }`}
              >
                <div className="flex items-center gap-3">
                  <Icon className={`w-4 h-4 ${isActive ? 'text-amber-400' : 'text-slate-400'}`} />
                  <span>{item.label}</span>
                </div>
                {item.badge && item.badge > 0 ? (
                  <span className="font-mono text-[10px] bg-amber-500 text-slate-950 font-bold px-1.5 py-0.5 rounded-full">
                    {item.badge}
                  </span>
                ) : null}
              </button>
            );
          })}
        </nav>

        {/* User Profile Footer */}
        <div className="p-3 border-t border-slate-800">
          <div className="flex items-center justify-between p-2 rounded-lg bg-slate-800/50">
            <button
              onClick={() => setActiveTab('profile')}
              className="flex items-center gap-2.5 text-left flex-1 min-w-0"
            >
              <div className="w-8 h-8 rounded-full bg-amber-600/30 text-amber-300 flex items-center justify-center font-semibold text-xs shrink-0 border border-amber-500/30">
                {currentUser ? `${currentUser.first_name[0]}${currentUser.last_name[0]}` : 'U'}
              </div>
              <div className="truncate">
                <div className="text-xs font-semibold text-white truncate">
                  {currentUser?.first_name} {currentUser?.last_name}
                </div>
                <div className="text-[11px] text-slate-400 truncate">
                  @{currentUser?.username}
                </div>
              </div>
            </button>
            <button
              onClick={logout}
              title="Disconnetti"
              className="p-1.5 text-slate-400 hover:text-red-400 transition-colors"
            >
              <LogOut className="w-4 h-4" />
            </button>
          </div>
        </div>
      </aside>

      {/* MOBILE DRAWER OVERLAY */}
      {mobileMenuOpen && (
        <div className="lg:hidden fixed inset-0 z-50 flex">
          <div
            className="fixed inset-0 bg-black/60 backdrop-blur-sm"
            onClick={() => setMobileMenuOpen(false)}
          />
          <div className="relative flex flex-col w-72 max-w-full bg-slate-900 border-r border-slate-800 z-10">
            <div className="flex items-center justify-between p-4 border-b border-slate-800">
              <div className="flex items-center gap-2.5">
                <img src={clubEmblem} alt="Logo" className="w-7 h-7 rounded-md" />
                <span className="font-bold text-white text-sm">Il Covo</span>
              </div>
              <button
                onClick={() => setMobileMenuOpen(false)}
                className="p-1.5 text-slate-400 hover:text-white"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-3 border-b border-slate-800 bg-slate-900/60">
              <div className="text-[11px] text-slate-400 mb-1">Simula Ruolo:</div>
              <select
                value={currentUser?.id || ''}
                onChange={(e) => {
                  const u = users.find(x => x.id === e.target.value);
                  if (u) switchUser(u);
                }}
                className="w-full bg-slate-800 border border-slate-700 rounded text-xs py-1.5 px-2 text-slate-200"
              >
                {users.map(u => (
                  <option key={u.id} value={u.id}>
                    {u.first_name} {u.last_name} ({getRoleLabel(u.role)})
                  </option>
                ))}
              </select>
            </div>

            <nav className="flex-1 overflow-y-auto p-3 space-y-1">
              {navItems.map((item) => {
                if (item.adminOnly && !isAdmin) return null;
                if (item.managerOnly && !isManager) return null;

                const isActive = activeTab === item.id;
                const Icon = item.icon;

                return (
                  <button
                    key={item.id}
                    onClick={() => handleNavClick(item.id)}
                    className={`w-full flex items-center justify-between px-3 py-2.5 rounded-lg text-sm font-medium ${
                      isActive
                        ? 'bg-amber-500/15 text-amber-300 font-semibold'
                        : 'text-slate-300 hover:bg-slate-800'
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      <Icon className="w-4 h-4" />
                      <span>{item.label}</span>
                    </div>
                    {item.badge && item.badge > 0 ? (
                      <span className="text-xs bg-amber-500 text-slate-950 font-bold px-2 py-0.5 rounded-full">
                        {item.badge}
                      </span>
                    ) : null}
                  </button>
                );
              })}
            </nav>

            <div className="p-3 border-t border-slate-800">
              <button
                onClick={() => {
                  handleNavClick('profile');
                }}
                className="w-full flex items-center gap-2 p-2 rounded text-xs text-slate-300 hover:bg-slate-800"
              >
                <User className="w-4 h-4" />
                <span>Mio Profilo</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MAIN VIEWPORT */}
      <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
        {/* TOP HEADER */}
        <header className="h-14 bg-slate-900/90 border-b border-slate-800 backdrop-blur-sm px-4 lg:px-6 flex items-center justify-between shrink-0">
          <div className="flex items-center gap-3">
            <button
              onClick={() => setMobileMenuOpen(true)}
              className="lg:hidden p-2 text-slate-400 hover:text-white"
            >
              <Menu className="w-5 h-5" />
            </button>
            <div className="flex items-center gap-2 text-xs lg:text-sm">
              <span className="font-semibold text-white">Il Covo</span>
              <span className="text-slate-500">/</span>
              <span className="text-amber-400 font-medium capitalize">
                {navItems.find(i => i.id === activeTab)?.label || activeTab}
              </span>
            </div>
          </div>

          <div className="flex items-center gap-3">
            {/* Quick Action: Richiesta Locale */}
            <button
              onClick={() => setActiveTab('venue-requests')}
              className="hidden sm:inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-amber-500 text-slate-950 font-semibold text-xs hover:bg-amber-400 transition-colors shadow-sm"
            >
              <span>+ Richiedi Locale</span>
            </button>

            {/* Notification Bell */}
            <button
              onClick={() => setActiveTab('notifications')}
              className="relative p-2 text-slate-400 hover:text-white transition-colors"
              title="Notifiche"
            >
              <Bell className="w-4 h-4" />
              {unreadCount > 0 && (
                <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-amber-500 rounded-full ring-2 ring-slate-900" />
              )}
            </button>

            {/* User Dropdown */}
            <div className="relative">
              <button
                onClick={() => setUserMenuOpen(!userMenuOpen)}
                className="flex items-center gap-2 py-1 px-2 rounded-lg hover:bg-slate-800 transition-colors text-xs"
              >
                <span className="font-medium text-slate-200 hidden sm:inline">
                  {currentUser?.first_name}
                </span>
                <span className={`text-[10px] px-1.5 py-0.5 rounded border ${getRoleBadgeClass(currentUser?.role)}`}>
                  {currentUser?.role}
                </span>
                <ChevronDown className="w-3.5 h-3.5 text-slate-400" />
              </button>

              {userMenuOpen && (
                <div
                  className="absolute right-0 mt-2 w-48 bg-slate-900 border border-slate-700 rounded-lg shadow-xl py-1 z-50 text-xs"
                  onClick={() => setUserMenuOpen(false)}
                >
                  <div className="px-3 py-2 border-b border-slate-800">
                    <div className="font-semibold text-white">
                      {currentUser?.first_name} {currentUser?.last_name}
                    </div>
                    <div className="text-[11px] text-slate-400">{currentUser?.email}</div>
                  </div>
                  <button
                    onClick={() => setActiveTab('profile')}
                    className="w-full text-left px-3 py-2 text-slate-300 hover:bg-slate-800 hover:text-white"
                  >
                    Profilo Personale
                  </button>
                  <button
                    onClick={() => setActiveTab('supabase-guide')}
                    className="w-full text-left px-3 py-2 text-slate-300 hover:bg-slate-800 hover:text-white"
                  >
                    Guida Supabase & SQL
                  </button>
                  <button
                    onClick={logout}
                    className="w-full text-left px-3 py-2 text-red-400 hover:bg-red-950/30"
                  >
                    Logout
                  </button>
                </div>
              )}
            </div>
          </div>
        </header>

        {/* CONTENT CANVAS */}
        <main className="flex-1 overflow-y-auto p-4 sm:p-6 lg:p-8 bg-slate-950">
          <div className="max-w-6xl mx-auto space-y-6">
            {children}
          </div>
        </main>
      </div>
    </div>
  );
};
