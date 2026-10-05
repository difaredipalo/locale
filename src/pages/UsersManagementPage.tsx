import React, { useState } from 'react';
import {
  Users,
  Search,
  Shield,
  UserCheck,
  UserX,
  Mail,
  KeyRound,
  Calendar,
  Clock,
  CheckCircle,
  AlertTriangle,
} from 'lucide-react';
import type { UserProfile, UserRole } from '../types/database';
import { useAuth } from '../context/AuthContext';
import { api } from '../lib/api';

interface UsersManagementPageProps {
  users: UserProfile[];
  onUserUpdated: () => void;
}

export const UsersManagementPage: React.FC<UsersManagementPageProps> = ({
  users,
  onUserUpdated,
}) => {
  const { currentUser, isAdmin } = useAuth();
  const [search, setSearch] = useState('');
  const [roleFilter, setRoleFilter] = useState<string>('all');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [resetMessage, setResetMessage] = useState<string | null>(null);

  const filtered = users.filter((u) => {
    if (roleFilter !== 'all' && u.role !== roleFilter) return false;
    if (statusFilter === 'active' && !u.is_active) return false;
    if (statusFilter === 'inactive' && u.is_active) return false;

    if (search.trim()) {
      const q = search.toLowerCase();
      const matchName = `${u.first_name} ${u.last_name}`.toLowerCase().includes(q);
      const matchUsername = u.username.toLowerCase().includes(q);
      const matchEmail = u.email.toLowerCase().includes(q);
      return matchName || matchUsername || matchEmail;
    }
    return true;
  });

  const handleRoleChange = async (user: UserProfile, newRole: UserRole) => {
    if (!isAdmin) {
      alert('Solo gli amministratori possono modificare i ruoli utente.');
      return;
    }
    try {
      await api.updateUserRole(user.id, newRole, `${currentUser?.first_name} ${currentUser?.last_name}`);
      onUserUpdated();
    } catch (err: any) {
      alert(err.message || 'Errore modifica ruolo');
    }
  };

  const handleToggleStatus = async (user: UserProfile) => {
    if (!isAdmin) {
      alert('Solo gli amministratori possono abilitare/disabilitare account.');
      return;
    }
    if (user.id === currentUser?.id) {
      alert('Non puoi disattivare il tuo stesso account amministratore.');
      return;
    }

    try {
      await api.toggleUserStatus(user.id, !user.is_active, `${currentUser?.first_name} ${currentUser?.last_name}`);
      onUserUpdated();
    } catch (err: any) {
      alert(err.message || 'Errore');
    }
  };

  const handleSendPasswordReset = async (email: string) => {
    try {
      const res = await api.resetPassword(email);
      setResetMessage(res.message);
      setTimeout(() => setResetMessage(null), 5000);
    } catch (err: any) {
      alert(err.message || 'Errore reset password');
    }
  };

  return (
    <div className="space-y-6">
      {/* HEADER */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold text-white tracking-tight">Gestione Utenti & Ruoli</h1>
          <p className="text-xs text-slate-400">
            Controllo accessi RBAC: Amministratori, Gestori e Utenti con tracciamento stato e attività.
          </p>
        </div>
      </div>

      {resetMessage && (
        <div className="p-3 rounded-xl bg-emerald-950/40 border border-emerald-500/40 text-emerald-300 text-xs flex items-center gap-2">
          <CheckCircle className="w-4 h-4 shrink-0 text-emerald-400" />
          <span>{resetMessage}</span>
        </div>
      )}

      {/* SEARCH AND FILTERS */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs">
        <div className="relative flex-1 max-w-sm">
          <Search className="w-4 h-4 absolute left-3 top-2.5 text-slate-500" />
          <input
            type="text"
            placeholder="Cerca per nome, username o email..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full bg-slate-900 border border-slate-800 rounded-lg pl-9 pr-3 py-2 text-white focus:outline-none focus:border-amber-500"
          />
        </div>

        <div className="flex items-center gap-2">
          <select
            value={roleFilter}
            onChange={(e) => setRoleFilter(e.target.value)}
            className="bg-slate-900 border border-slate-800 rounded-lg p-2 text-slate-200"
          >
            <option value="all">Tutti i ruoli</option>
            <option value="admin">Amministratori</option>
            <option value="manager">Gestori</option>
            <option value="user">Membri</option>
          </select>

          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="bg-slate-900 border border-slate-800 rounded-lg p-2 text-slate-200"
          >
            <option value="all">Tutti gli stati</option>
            <option value="active">Solo Attivi</option>
            <option value="inactive">Solo Disattivati</option>
          </select>
        </div>
      </div>

      {/* USERS TABLE */}
      <div className="p-6 rounded-2xl bg-slate-900 border border-slate-800 shadow-lg overflow-x-auto">
        <table className="w-full text-left text-xs">
          <thead className="text-[11px] text-slate-400 uppercase tracking-wider border-b border-slate-800 bg-slate-950/40">
            <tr>
              <th className="py-2.5 px-3">Membro</th>
              <th className="py-2.5 px-3">Email</th>
              <th className="py-2.5 px-3">Ruolo Permessi</th>
              <th className="py-2.5 px-3">Stato</th>
              <th className="py-2.5 px-3">Registrazione</th>
              <th className="py-2.5 px-3">Ultimo Accesso</th>
              <th className="py-2.5 px-3 text-right">Azioni</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-800/60 font-medium">
            {filtered.map((user) => (
              <tr key={user.id} className="hover:bg-slate-800/30 transition-colors">
                <td className="py-3 px-3">
                  <div className="flex items-center gap-2.5">
                    <div className="w-7 h-7 rounded-full bg-slate-800 border border-slate-700 flex items-center justify-center font-bold text-[11px] text-amber-300">
                      {user.first_name[0]}{user.last_name[0]}
                    </div>
                    <div>
                      <div className="font-semibold text-white">{user.first_name} {user.last_name}</div>
                      <div className="text-[11px] text-slate-500">@{user.username}</div>
                    </div>
                  </div>
                </td>
                <td className="py-3 px-3 font-mono text-slate-300">
                  {user.email}
                </td>
                <td className="py-3 px-3">
                  {isAdmin ? (
                    <select
                      value={user.role}
                      onChange={(e) => handleRoleChange(user, e.target.value as UserRole)}
                      className="bg-slate-800 border border-slate-700 rounded p-1 text-[11px] font-semibold text-slate-200"
                    >
                      <option value="admin">Amministratore</option>
                      <option value="manager">Gestore</option>
                      <option value="user">Utente</option>
                    </select>
                  ) : (
                    <span className="capitalize font-semibold text-slate-300">
                      {user.role}
                    </span>
                  )}
                </td>
                <td className="py-3 px-3">
                  <span className={`inline-flex items-center gap-1 text-[11px] font-semibold px-2 py-0.5 rounded border ${
                    user.is_active
                      ? 'text-emerald-400 bg-emerald-500/10 border-emerald-500/20'
                      : 'text-red-400 bg-red-500/10 border-red-500/20'
                  }`}>
                    {user.is_active ? 'Attivo' : 'Disattivato'}
                  </span>
                </td>
                <td className="py-3 px-3 text-slate-400 font-mono text-[11px] whitespace-nowrap">
                  {new Date(user.created_at).toLocaleDateString('it-IT')}
                </td>
                <td className="py-3 px-3 text-slate-400 font-mono text-[11px] whitespace-nowrap">
                  {user.last_login_at ? new Date(user.last_login_at).toLocaleDateString('it-IT') : 'Mai'}
                </td>
                <td className="py-3 px-3 text-right whitespace-nowrap">
                  <div className="inline-flex items-center gap-2">
                    <button
                      onClick={() => handleSendPasswordReset(user.email)}
                      className="p-1 text-slate-400 hover:text-amber-400"
                      title="Invia email di reset password"
                    >
                      <KeyRound className="w-4 h-4" />
                    </button>
                    {isAdmin && (
                      <button
                        onClick={() => handleToggleStatus(user)}
                        className={`p-1 ${user.is_active ? 'text-slate-400 hover:text-red-400' : 'text-emerald-400 hover:text-emerald-300'}`}
                        title={user.is_active ? 'Disattiva account' : 'Riattiva account'}
                      >
                        {user.is_active ? <UserX className="w-4 h-4" /> : <UserCheck className="w-4 h-4" />}
                      </button>
                    )}
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};
