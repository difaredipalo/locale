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
  Award,
  KeyRound,
  HelpCircle,
  CheckCircle2,
  Shield,
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import clubEmblem from '../../assets/images/covo_club_emblem_1791184967951.jpg';

export type ActiveTab =
  | 'dashboard'
  | 'calendar'
  | 'venue-requests'
  | 'cleaning'
  | 'notifications'
  | 'elections'
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
  const { currentUser, users, isAdmin, isManager, logout, switchUser, updateProfile } = useAuth();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [userMenuOpen, setUserMenuOpen] = useState(false);
  const [authGuideOpen, setAuthGuideOpen] = useState(false);
  const [quickProfileOpen, setQuickProfileOpen] = useState(false);
  const [editFirstName, setEditFirstName] = useState(currentUser?.first_name || '');
  const [editLastName, setEditLastName] = useState(currentUser?.last_name || '');
  const [editPhone, setEditPhone] = useState(currentUser?.phone || '');
  const [profileSaving, setProfileSaving] = useState(false);
  const [profileSuccess, setProfileSuccess] = useState<string | null>(null);

  const navItems: { id: ActiveTab; label: string; icon: React.ElementType; adminOnly?: boolean; managerOnly?: boolean; badge?: number }[] = [
    { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
    { id: 'calendar', label: 'Calendario', icon: Calendar },
    { id: 'venue-requests', label: 'Richiesta Locale', icon: Clock },
    { id: 'cleaning', label: 'Turni Pulizie', icon: Sparkles },
    { id: 'notifications', label: 'Notifiche', icon: Bell, badge: unreadCount },
    { id: 'elections', label: 'Elezioni Presidente', icon: Award },
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

      {/* MAIN VIEWPORT (No overflow-hidden on outer container to prevent clipping dropdowns) */}
      <div className="flex-1 flex flex-col min-w-0 h-screen relative">
        {/* TOP HEADER - z-[100] ensures dropdowns render above everything */}
        <header className="sticky top-0 z-[100] h-14 bg-slate-900 border-b border-slate-800 px-4 lg:px-6 flex items-center justify-between shrink-0 shadow-md">
          <div className="flex items-center gap-3">
            <button
              onClick={() => setMobileMenuOpen(true)}
              className="lg:hidden p-2 text-slate-400 hover:text-white"
              title="Apri menu"
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

          <div className="flex items-center gap-2 sm:gap-3">
            {/* Quick Action: Elezioni Presidente */}
            <button
              onClick={() => setActiveTab('elections')}
              className="hidden md:inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-amber-500/10 hover:bg-amber-500/20 text-amber-400 border border-amber-500/30 text-xs font-semibold transition-colors"
              title="Elezioni Trimestrali Presidente del Locale"
            >
              <Award className="w-3.5 h-3.5" />
              <span>Elezioni</span>
            </button>

            {/* Quick Action: Richiesta Locale */}
            <button
              onClick={() => setActiveTab('venue-requests')}
              className="hidden sm:inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-amber-500 text-slate-950 font-semibold text-xs hover:bg-amber-400 transition-colors shadow-sm"
            >
              <span>+ Richiedi Locale</span>
            </button>

            {/* Info Accesso & Login */}
            <button
              onClick={() => setAuthGuideOpen(true)}
              className="p-2 text-slate-400 hover:text-amber-300 hover:bg-slate-800 rounded-lg transition-colors"
              title="Come si fa l'accesso / Guida Login"
            >
              <KeyRound className="w-4 h-4" />
            </button>

            {/* Notification Bell */}
            <button
              onClick={() => setActiveTab('notifications')}
              className="relative p-2 text-slate-400 hover:text-white hover:bg-slate-800 rounded-lg transition-colors"
              title="Notifiche"
            >
              <Bell className="w-4 h-4" />
              {unreadCount > 0 && (
                <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-amber-500 rounded-full ring-2 ring-slate-900" />
              )}
            </button>

            {/* Direct Logout Button */}
            <button
              onClick={logout}
              className="hidden lg:inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg bg-red-950/40 hover:bg-red-900/60 border border-red-500/30 text-red-300 font-medium text-xs transition-colors"
              title="Disconnetti (Logout) e torna alla schermata di Login"
            >
              <LogOut className="w-3.5 h-3.5" />
              <span>Esci</span>
            </button>

            {/* User Dropdown Profile Menu */}
            <div className="relative z-[110]">
              <button
                type="button"
                onClick={() => setUserMenuOpen(!userMenuOpen)}
                className="flex items-center gap-2 py-1.5 px-2.5 rounded-xl bg-slate-800 hover:bg-slate-700/80 border border-slate-700 text-xs text-slate-200 transition-colors shadow-sm"
                aria-expanded={userMenuOpen}
              >
                <div className="w-6 h-6 rounded-lg bg-amber-500/20 text-amber-400 font-bold flex items-center justify-center text-[11px] shrink-0 border border-amber-500/30">
                  {currentUser?.first_name?.[0] || 'U'}
                </div>
                <span className="font-semibold text-slate-200 hidden sm:inline truncate max-w-[110px]">
                  {currentUser?.first_name}
                </span>
                <span className={`text-[10px] px-1.5 py-0.5 rounded font-bold uppercase tracking-wider border ${getRoleBadgeClass(currentUser?.role)}`}>
                  {currentUser?.role}
                </span>
                <ChevronDown className={`w-3.5 h-3.5 text-slate-400 transition-transform duration-200 ${userMenuOpen ? 'rotate-180' : ''}`} />
              </button>

              {userMenuOpen && (
                <>
                  {/* Backdrop */}
                  <div
                    className="fixed inset-0 z-[105] bg-black/40"
                    onClick={() => setUserMenuOpen(false)}
                  />
                  {/* Dropdown Menu Card */}
                  <div
                    className="absolute right-0 top-full mt-2 w-72 bg-slate-900 border border-slate-700 rounded-2xl shadow-2xl py-2 z-[110] text-xs text-slate-200 ring-1 ring-black/60 divide-y divide-slate-800"
                  >
                    {/* User Profile Header */}
                    <div className="px-4 py-3">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-xl bg-amber-500/20 border border-amber-500/30 flex items-center justify-center font-bold text-amber-400 text-sm shrink-0">
                          {currentUser?.first_name?.[0]}{currentUser?.last_name?.[0]}
                        </div>
                        <div className="min-w-0">
                          <div className="font-bold text-white text-sm truncate">
                            {currentUser?.first_name} {currentUser?.last_name}
                          </div>
                          <div className="text-[11px] text-slate-400 truncate">
                            @{currentUser?.username} · {currentUser?.email}
                          </div>
                          <div className="mt-1 inline-flex items-center gap-1 text-[10px] font-semibold text-emerald-400">
                            <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                            <span>Sessione Autenticata</span>
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* Navigation Actions */}
                    <div className="py-1.5">
                      <button
                        onClick={() => {
                          setUserMenuOpen(false);
                          setActiveTab('profile');
                        }}
                        className="w-full text-left px-4 py-2.5 text-slate-300 hover:bg-slate-800 hover:text-white flex items-center gap-2.5 transition-colors"
                      >
                        <User className="w-4 h-4 text-amber-400 shrink-0" />
                        <div>
                          <div className="font-semibold text-slate-200">Profilo Personale</div>
                          <div className="text-[10px] text-slate-400">Vedi dati account e stato ruolo</div>
                        </div>
                      </button>

                      <button
                        onClick={() => {
                          setUserMenuOpen(false);
                          setEditFirstName(currentUser?.first_name || '');
                          setEditLastName(currentUser?.last_name || '');
                          setEditPhone(currentUser?.phone || '');
                          setProfileSuccess(null);
                          setQuickProfileOpen(true);
                        }}
                        className="w-full text-left px-4 py-2 text-slate-300 hover:bg-slate-800 hover:text-white flex items-center gap-2.5 transition-colors"
                      >
                        <Shield className="w-4 h-4 text-sky-400 shrink-0" />
                        <span>Impostazioni & Modifica Rapida</span>
                      </button>

                      <button
                        onClick={() => {
                          setUserMenuOpen(false);
                          setActiveTab('elections');
                        }}
                        className="w-full text-left px-4 py-2.5 text-slate-300 hover:bg-slate-800 hover:text-white flex items-center gap-2.5 transition-colors"
                      >
                        <Award className="w-4 h-4 text-amber-400 shrink-0" />
                        <div>
                          <div className="font-semibold text-amber-300">Elezioni Presidente</div>
                          <div className="text-[10px] text-slate-400">Vota il Presidente trimestrale</div>
                        </div>
                      </button>

                      <button
                        onClick={() => {
                          setUserMenuOpen(false);
                          setAuthGuideOpen(true);
                        }}
                        className="w-full text-left px-4 py-2 text-slate-300 hover:bg-slate-800 hover:text-white flex items-center gap-2.5 transition-colors"
                      >
                        <KeyRound className="w-4 h-4 text-emerald-400 shrink-0" />
                        <span>Come Funziona l'Accesso / Login</span>
                      </button>

                      <button
                        onClick={() => {
                          setUserMenuOpen(false);
                          setActiveTab('supabase-guide');
                        }}
                        className="w-full text-left px-4 py-2 text-slate-300 hover:bg-slate-800 hover:text-white flex items-center gap-2.5 transition-colors"
                      >
                        <Database className="w-4 h-4 text-slate-400 shrink-0" />
                        <span>Guida Supabase & SQL</span>
                      </button>
                    </div>

                    {/* Simulator Quick User Switcher */}
                    <div className="p-3 bg-slate-950/50">
                      <div className="text-[11px] font-semibold text-slate-400 mb-1.5 flex items-center justify-between">
                        <span>Simula Altro Utente / Ruolo:</span>
                      </div>
                      <select
                        value={currentUser?.id || ''}
                        onChange={(e) => {
                          const u = users.find(x => x.id === e.target.value);
                          if (u) {
                            switchUser(u);
                            setUserMenuOpen(false);
                          }
                        }}
                        className="w-full bg-slate-800 border border-slate-700 rounded-lg text-xs py-1.5 px-2 text-slate-200 focus:outline-none focus:border-amber-500"
                      >
                        {users.map(u => (
                          <option key={u.id} value={u.id}>
                            {u.first_name} {u.last_name} ({getRoleLabel(u.role)})
                          </option>
                        ))}
                      </select>
                    </div>

                    {/* Disconnetti Button */}
                    <div className="p-2">
                      <button
                        onClick={() => {
                          setUserMenuOpen(false);
                          logout();
                        }}
                        className="w-full text-left px-3 py-2 text-red-400 hover:bg-red-950/40 rounded-lg flex items-center justify-between font-semibold transition-colors"
                      >
                        <span>Disconnetti (Logout)</span>
                        <LogOut className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                </>
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

      {/* MODAL: GUIDA ACCESSO & CREDENZIALI */}
      {authGuideOpen && (
        <div className="fixed inset-0 z-[120] flex items-center justify-center p-4 bg-black/75 backdrop-blur-sm">
          <div className="w-full max-w-lg bg-slate-900 border border-slate-700 rounded-2xl p-6 shadow-2xl space-y-4 text-xs text-slate-200">
            <div className="flex items-center justify-between pb-3 border-b border-slate-800">
              <div className="flex items-center gap-2 text-base font-bold text-white">
                <KeyRound className="w-5 h-5 text-amber-400" />
                <span>Come si fa l'accesso? Guida Login & Ruoli</span>
              </div>
              <button
                onClick={() => setAuthGuideOpen(false)}
                className="p-1 text-slate-400 hover:text-white"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-3 leading-relaxed">
              <p className="text-slate-300">
                L'applicazione è dotata di un vero sistema di autenticazione con <strong>Login, Registrazione, Recupero Password e Gestione Ruoli</strong>.
              </p>

              <div className="p-3.5 rounded-xl bg-slate-950 border border-slate-800 space-y-2">
                <div className="font-bold text-amber-300 text-xs">Come accedere alla schermata di Login:</div>
                <ul className="list-disc list-inside text-slate-400 space-y-1">
                  <li>Clicca su <strong className="text-red-400">"Esci"</strong> in alto a destra o su <strong className="text-red-400">"Disconnetti"</strong> nel menu profilo.</li>
                  <li>La schermata di login compare automaticamente ogni volta che non sei autenticato o dopo un logout.</li>
                </ul>
              </div>

              <div className="p-3.5 rounded-xl bg-slate-950 border border-slate-800 space-y-2">
                <div className="font-bold text-sky-300 text-xs">Utenti e Credenziali Demo Preconfigurate:</div>
                <div className="grid grid-cols-2 gap-2 text-[11px] font-mono">
                  <div className="p-2 rounded bg-slate-900 border border-slate-800">
                    <div className="text-amber-400 font-bold">Gianluca (Admin)</div>
                    <div className="text-slate-400">user: gianluca</div>
                    <div className="text-slate-500">pass: password123</div>
                  </div>
                  <div className="p-2 rounded bg-slate-900 border border-slate-800">
                    <div className="text-sky-400 font-bold">Marco (Gestore)</div>
                    <div className="text-slate-400">user: marco</div>
                    <div className="text-slate-500">pass: password123</div>
                  </div>
                  <div className="p-2 rounded bg-slate-900 border border-slate-800">
                    <div className="text-emerald-400 font-bold">Sofia (Membro)</div>
                    <div className="text-slate-400">user: sofia</div>
                    <div className="text-slate-500">pass: password123</div>
                  </div>
                  <div className="p-2 rounded bg-slate-900 border border-slate-800">
                    <div className="text-slate-300 font-bold">Luca (Membro)</div>
                    <div className="text-slate-400">user: luca</div>
                    <div className="text-slate-500">pass: password123</div>
                  </div>
                </div>
              </div>

              <div className="p-3 rounded-xl bg-amber-500/10 border border-amber-500/30 text-amber-200 text-[11px]">
                💡 Nella schermata di login troverai anche <strong>4 pulsanti di accesso rapido con 1 clic</strong> per testare istantaneamente i diversi ruoli e permessi senza digitare nulla.
              </div>
            </div>

            <div className="flex items-center justify-between pt-3 border-t border-slate-800">
              <button
                onClick={() => {
                  setAuthGuideOpen(false);
                  logout();
                }}
                className="px-3.5 py-2 rounded-lg bg-red-950/60 hover:bg-red-900/60 border border-red-500/40 text-red-300 font-bold"
              >
                Vai alla Schermata Login
              </button>
              <button
                onClick={() => setAuthGuideOpen(false)}
                className="px-4 py-2 rounded-lg bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold"
              >
                Ho Capito
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL: MODIFICA RAPIDA PROFILO & IMPOSTAZIONI */}
      {quickProfileOpen && (
        <div className="fixed inset-0 z-[120] flex items-center justify-center p-4 bg-black/75 backdrop-blur-sm">
          <div className="w-full max-w-md bg-slate-900 border border-slate-700 rounded-2xl p-6 shadow-2xl space-y-4 text-xs text-slate-200">
            <div className="flex items-center justify-between pb-3 border-b border-slate-800">
              <div className="flex items-center gap-2 text-base font-bold text-white">
                <User className="w-5 h-5 text-amber-400" />
                <span>Impostazioni Profilo Rapide</span>
              </div>
              <button
                onClick={() => setQuickProfileOpen(false)}
                className="p-1 text-slate-400 hover:text-white"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {profileSuccess && (
              <div className="p-3 rounded-xl bg-emerald-950/50 border border-emerald-500/50 text-emerald-300 flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                <span>{profileSuccess}</span>
              </div>
            )}

            <form
              onSubmit={async (e) => {
                e.preventDefault();
                try {
                  setProfileSaving(true);
                  await updateProfile({
                    first_name: editFirstName,
                    last_name: editLastName,
                    phone: editPhone,
                  });
                  setProfileSuccess('Dati profilo salvati con successo!');
                  setTimeout(() => {
                    setQuickProfileOpen(false);
                    setProfileSuccess(null);
                  }, 1500);
                } catch (err: any) {
                  alert(err.message || 'Errore salvataggio profilo');
                } finally {
                  setProfileSaving(false);
                }
              }}
              className="space-y-3.5"
            >
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-300 font-medium mb-1">Nome</label>
                  <input
                    type="text"
                    required
                    value={editFirstName}
                    onChange={(e) => setEditFirstName(e.target.value)}
                    className="w-full bg-slate-800 border border-slate-700 rounded-lg p-2.5 text-white focus:outline-none focus:border-amber-500"
                  />
                </div>
                <div>
                  <label className="block text-slate-300 font-medium mb-1">Cognome</label>
                  <input
                    type="text"
                    required
                    value={editLastName}
                    onChange={(e) => setEditLastName(e.target.value)}
                    className="w-full bg-slate-800 border border-slate-700 rounded-lg p-2.5 text-white focus:outline-none focus:border-amber-500"
                  />
                </div>
              </div>

              <div>
                <label className="block text-slate-300 font-medium mb-1">Email</label>
                <input
                  type="email"
                  disabled
                  value={currentUser?.email || ''}
                  className="w-full bg-slate-950 border border-slate-800 rounded-lg p-2.5 text-slate-400 font-mono cursor-not-allowed"
                />
              </div>

              <div>
                <label className="block text-slate-300 font-medium mb-1">Telefono / WhatsApp</label>
                <input
                  type="tel"
                  placeholder="+39 333 1234567"
                  value={editPhone}
                  onChange={(e) => setEditPhone(e.target.value)}
                  className="w-full bg-slate-800 border border-slate-700 rounded-lg p-2.5 text-white focus:outline-none focus:border-amber-500 font-mono"
                />
              </div>

              <div className="p-2.5 rounded-lg bg-slate-950 border border-slate-800 flex items-center justify-between text-[11px]">
                <span className="text-slate-400">Ruolo attuale:</span>
                <span className={`px-2 py-0.5 rounded font-bold uppercase ${getRoleBadgeClass(currentUser?.role)}`}>
                  {currentUser?.role}
                </span>
              </div>

              <div className="flex items-center justify-between pt-3 border-t border-slate-800">
                <button
                  type="button"
                  onClick={() => {
                    setQuickProfileOpen(false);
                    setActiveTab('profile');
                  }}
                  className="text-amber-400 hover:underline text-xs"
                >
                  Apri Pagina Profilo Completa →
                </button>
                <button
                  type="submit"
                  disabled={profileSaving}
                  className="px-4 py-2 rounded-lg bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold transition-colors shadow-sm"
                >
                  {profileSaving ? 'Salvataggio...' : 'Salva Modifiche'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
