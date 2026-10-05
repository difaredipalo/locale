import React, { useState } from 'react';
import {
  FileText,
  Search,
  Filter,
  ShieldCheck,
  Calendar,
  User,
} from 'lucide-react';
import type { AuditLog, AuditLogCategory } from '../types/database';

interface AuditLogPageProps {
  logs: AuditLog[];
}

export const AuditLogPage: React.FC<AuditLogPageProps> = ({ logs }) => {
  const [search, setSearch] = useState('');
  const [filterCategory, setFilterCategory] = useState<string>('all');

  const categories: { id: AuditLogCategory | 'all'; label: string }[] = [
    { id: 'all', label: 'Tutte le categorie' },
    { id: 'finance', label: 'Finanze & Cassa' },
    { id: 'venue', label: 'Prenotazioni Locale' },
    { id: 'cleaning', label: 'Turni Pulizie' },
    { id: 'regulation', label: 'Regolamento' },
    { id: 'user', label: 'Gestione Utenti' },
    { id: 'poll', label: 'Sondaggi' },
    { id: 'purchase', label: 'Acquisti' },
    { id: 'goal', label: 'Obiettivi' },
  ];

  const filtered = logs.filter((log) => {
    if (filterCategory !== 'all' && log.category !== filterCategory) return false;
    if (search.trim()) {
      const q = search.toLowerCase();
      return (
        log.details.toLowerCase().includes(q) ||
        log.action.toLowerCase().includes(q) ||
        log.user_name.toLowerCase().includes(q)
      );
    }
    return true;
  });

  const getCategoryColor = (cat: AuditLogCategory) => {
    switch (cat) {
      case 'finance':
        return 'text-emerald-400 bg-emerald-500/10 border-emerald-500/20';
      case 'venue':
        return 'text-amber-400 bg-amber-500/10 border-amber-500/20';
      case 'regulation':
        return 'text-purple-400 bg-purple-500/10 border-purple-500/20';
      case 'user':
        return 'text-sky-400 bg-sky-500/10 border-sky-500/20';
      default:
        return 'text-slate-400 bg-slate-800 border-slate-700';
    }
  };

  return (
    <div className="space-y-6">
      {/* HEADER */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold text-white tracking-tight">Registro Attività (Audit Log)</h1>
          <p className="text-xs text-slate-400">
            Tracciamento inalterabile di tutte le operazioni critiche: movimenti economici, approvazioni e modifiche.
          </p>
        </div>
      </div>

      {/* SEARCH AND FILTERS */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs">
        <div className="relative flex-1 max-w-sm">
          <Search className="w-4 h-4 absolute left-3 top-2.5 text-slate-500" />
          <input
            type="text"
            placeholder="Cerca per testo, azione o utente..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full bg-slate-900 border border-slate-800 rounded-lg pl-9 pr-3 py-2 text-white focus:outline-none focus:border-amber-500"
          />
        </div>

        <select
          value={filterCategory}
          onChange={(e) => setFilterCategory(e.target.value)}
          className="bg-slate-900 border border-slate-800 rounded-lg p-2 text-slate-200"
        >
          {categories.map((c) => (
            <option key={c.id} value={c.id}>{c.label}</option>
          ))}
        </select>
      </div>

      {/* LOG ENTRIES LIST */}
      <div className="p-6 rounded-2xl bg-slate-900 border border-slate-800 shadow-lg space-y-3">
        {filtered.length === 0 ? (
          <div className="text-center py-8 text-xs text-slate-500">
            Nessuna voce di log trovata con i filtri applicati.
          </div>
        ) : (
          filtered.map((log) => (
            <div
              key={log.id}
              className="p-3.5 rounded-xl bg-slate-800/40 border border-slate-800 flex flex-col sm:flex-row sm:items-start justify-between gap-3 text-xs hover:border-slate-700 transition-colors"
            >
              <div className="space-y-1">
                <div className="flex items-center gap-2">
                  <span className={`px-2 py-0.5 rounded text-[10px] font-bold border uppercase tracking-wider ${getCategoryColor(log.category)}`}>
                    {log.category}
                  </span>
                  <span className="font-semibold text-white">{log.action}</span>
                  <span className="text-slate-500">·</span>
                  <span className="text-slate-300 font-medium">da {log.user_name}</span>
                </div>
                <p className="text-slate-300 font-mono text-[11px] leading-relaxed">
                  {log.details}
                </p>
              </div>

              <div className="text-right shrink-0 text-[11px] text-slate-500 font-mono">
                {new Date(log.timestamp).toLocaleString('it-IT', {
                  day: '2-digit',
                  month: '2-digit',
                  year: 'numeric',
                  hour: '2-digit',
                  minute: '2-digit',
                })}
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
};
