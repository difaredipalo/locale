import React, { useState } from 'react';
import {
  Bell,
  Plus,
  Pin,
  Archive,
  CheckCircle,
  AlertTriangle,
  X,
  Trash2,
  Tag,
} from 'lucide-react';
import type {
  NotificationItem,
  NotificationCategory,
  NotificationPriority,
} from '../types/database';
import { useAuth } from '../context/AuthContext';
import { api } from '../lib/api';

interface NotificationsPageProps {
  notifications: NotificationItem[];
  onNotificationCreated: (notif: NotificationItem) => void;
  onNotificationUpdated: (notif: NotificationItem) => void;
  onNotificationDeleted: (id: string) => void;
}

export const NotificationsPage: React.FC<NotificationsPageProps> = ({
  notifications,
  onNotificationCreated,
  onNotificationUpdated,
  onNotificationDeleted,
}) => {
  const { currentUser, isManager } = useAuth();
  const [modalOpen, setModalOpen] = useState(false);
  const [filterCategory, setFilterCategory] = useState<string>('all');
  const [showArchived, setShowArchived] = useState<boolean>(false);

  // Form states
  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [category, setCategory] = useState<NotificationCategory>('Informazione');
  const [priority, setPriority] = useState<NotificationPriority>('normale');
  const [isPinned, setIsPinned] = useState(false);
  const [expiresAt, setExpiresAt] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const categories: NotificationCategory[] = [
    'Informazione',
    'Importante',
    'Emergenza',
    'Acquisti',
    'Eventi',
    'Pulizie',
    'Economico',
  ];

  const filtered = notifications.filter((n) => {
    if (!showArchived && n.is_archived) return false;
    if (showArchived && !n.is_archived) return false;
    if (filterCategory !== 'all' && n.category !== filterCategory) return false;
    return true;
  });

  // Sort pinned first
  const sorted = [...filtered].sort((a, b) => {
    if (a.is_pinned && !b.is_pinned) return -1;
    if (!a.is_pinned && b.is_pinned) return 1;
    return b.created_at.localeCompare(a.created_at);
  });

  const handleToggleRead = async (notif: NotificationItem) => {
    if (!currentUser) return;
    try {
      const updated = await api.markNotificationAsRead(notif.id, currentUser.id);
      onNotificationUpdated(updated);
    } catch (err: any) {
      console.error(err);
    }
  };

  const handleTogglePin = async (id: string) => {
    try {
      const updated = await api.toggleNotificationPin(id);
      onNotificationUpdated(updated);
    } catch (err: any) {
      console.error(err);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Eliminare questa comunicazione?')) return;
    try {
      await api.deleteNotification(id);
      onNotificationDeleted(id);
    } catch (err: any) {
      alert(err.message || 'Errore');
    }
  };

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title || !content) return;

    try {
      setSubmitting(true);
      const newNotif = await api.createNotification({
        title,
        content,
        category,
        priority,
        is_pinned: isPinned,
        expires_at: expiresAt ? `${expiresAt}T23:59:59.000Z` : undefined,
        created_by_id: currentUser?.id,
        created_by_name: `${currentUser?.first_name} ${currentUser?.last_name}`,
      });
      onNotificationCreated(newNotif);
      setModalOpen(false);
      setTitle('');
      setContent('');
    } catch (err: any) {
      alert(err.message || 'Errore');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* HEADER */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold text-white tracking-tight">Bacheca Notifiche</h1>
          <p className="text-xs text-slate-400">
            Comunicazioni ufficiali, avvisi urgenti e aggiornamenti per la gestione del covo.
          </p>
        </div>

        {isManager && (
          <button
            onClick={() => setModalOpen(true)}
            className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold text-xs transition-colors self-start sm:self-auto"
          >
            <Plus className="w-4 h-4" />
            <span>Nuova Comunicazione</span>
          </button>
        )}
      </div>

      {/* FILTER & TOGGLES */}
      <div className="flex flex-wrap items-center justify-between gap-3 text-xs">
        <div className="flex items-center gap-2">
          <select
            value={filterCategory}
            onChange={(e) => setFilterCategory(e.target.value)}
            className="bg-slate-900 border border-slate-800 rounded-lg p-2 text-slate-200"
          >
            <option value="all">Tutte le categorie</option>
            {categories.map(c => (
              <option key={c} value={c}>{c}</option>
            ))}
          </select>

          <button
            onClick={() => setShowArchived(!showArchived)}
            className={`px-3 py-2 rounded-lg border transition-colors ${
              showArchived
                ? 'bg-slate-800 text-amber-400 border-slate-700'
                : 'bg-slate-900 text-slate-400 border-slate-800 hover:text-white'
            }`}
          >
            {showArchived ? 'Mostra Attive' : 'Mostra Archiviate'}
          </button>
        </div>
      </div>

      {/* NOTIFICATIONS LIST */}
      <div className="space-y-4">
        {sorted.length === 0 ? (
          <div className="p-8 text-center rounded-2xl bg-slate-900 border border-slate-800 text-slate-400 text-xs">
            Nessuna comunicazione presente.
          </div>
        ) : (
          sorted.map((notif) => {
            const isRead = currentUser && notif.read_by.includes(currentUser.id);

            return (
              <div
                key={notif.id}
                className={`p-5 rounded-2xl border transition-all space-y-3 ${
                  notif.is_pinned
                    ? 'bg-slate-900/90 border-amber-500/40 ring-1 ring-amber-500/20'
                    : isRead
                    ? 'bg-slate-900/50 border-slate-800/80 text-slate-300'
                    : 'bg-slate-900 border-slate-700/80 text-white'
                }`}
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="space-y-1">
                    <div className="flex items-center gap-2 text-xs">
                      {notif.is_pinned && (
                        <span className="inline-flex items-center gap-1 text-[11px] text-amber-400 font-bold">
                          <Pin className="w-3 h-3 fill-amber-400" />
                          Fissata in alto
                        </span>
                      )}
                      <span className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider">
                        {notif.category}
                      </span>
                      <span className="text-slate-500">·</span>
                      <span className={`text-[10px] uppercase font-bold ${
                        notif.priority === 'urgente'
                          ? 'text-red-400'
                          : notif.priority === 'alta'
                          ? 'text-amber-400'
                          : 'text-slate-400'
                      }`}>
                        Priorità {notif.priority}
                      </span>
                    </div>

                    <h3 className="text-base font-bold text-white">{notif.title}</h3>
                  </div>

                  <div className="flex items-center gap-2 shrink-0">
                    {!isRead && (
                      <button
                        onClick={() => handleToggleRead(notif)}
                        className="px-2.5 py-1 rounded bg-amber-500/15 hover:bg-amber-500/25 text-amber-300 text-[11px] font-semibold transition-colors"
                      >
                        Segna come letta
                      </button>
                    )}

                    {isManager && (
                      <>
                        <button
                          onClick={() => handleTogglePin(notif.id)}
                          className={`p-1.5 rounded hover:bg-slate-800 ${notif.is_pinned ? 'text-amber-400' : 'text-slate-500'}`}
                          title={notif.is_pinned ? 'Sblocca' : 'Fissa in alto'}
                        >
                          <Pin className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => handleDelete(notif.id)}
                          className="p-1.5 text-slate-500 hover:text-red-400 rounded"
                          title="Elimina"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </>
                    )}
                  </div>
                </div>

                <p className="text-xs sm:text-sm text-slate-300 whitespace-pre-line leading-relaxed">
                  {notif.content}
                </p>

                <div className="pt-2 flex items-center justify-between text-[11px] text-slate-500 border-t border-slate-800/60">
                  <span>Da <strong>{notif.created_by_name}</strong> il {new Date(notif.created_at).toLocaleDateString('it-IT')}</span>
                  {notif.expires_at && <span>Scade il {new Date(notif.expires_at).toLocaleDateString('it-IT')}</span>}
                </div>
              </div>
            );
          })
        )}
      </div>

      {/* CREATE NOTIFICATION MODAL */}
      {modalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
          <div className="w-full max-w-lg bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-2xl space-y-4 text-xs">
            <div className="flex items-center justify-between pb-3 border-b border-slate-800">
              <h3 className="text-base font-bold text-white">Nuova Notifica per i Soci</h3>
              <button onClick={() => setModalOpen(false)} className="p-1 text-slate-400 hover:text-white">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleCreate} className="space-y-4">
              <div>
                <label className="block text-slate-300 font-medium mb-1">Titolo Comunicazione *</label>
                <input
                  type="text"
                  required
                  placeholder="Es. Chiusura temporanea locale per sanificazione..."
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  className="w-full bg-slate-800 border border-slate-700 rounded-lg p-2.5 text-white focus:outline-none focus:border-amber-500"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-300 font-medium mb-1">Categoria *</label>
                  <select
                    value={category}
                    onChange={(e) => setCategory(e.target.value as NotificationCategory)}
                    className="w-full bg-slate-800 border border-slate-700 rounded-lg p-2.5 text-white focus:outline-none focus:border-amber-500"
                  >
                    {categories.map(c => (
                      <option key={c} value={c}>{c}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-slate-300 font-medium mb-1">Priorità *</label>
                  <select
                    value={priority}
                    onChange={(e) => setPriority(e.target.value as NotificationPriority)}
                    className="w-full bg-slate-800 border border-slate-700 rounded-lg p-2.5 text-white focus:outline-none focus:border-amber-500"
                  >
                    <option value="bassa">Bassa</option>
                    <option value="normale">Normale</option>
                    <option value="alta">Alta</option>
                    <option value="urgente">Urgente</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-slate-300 font-medium mb-1">Testo del Messaggio *</label>
                <textarea
                  rows={4}
                  required
                  placeholder="Scrivi qui il messaggio per tutti i membri..."
                  value={content}
                  onChange={(e) => setContent(e.target.value)}
                  className="w-full bg-slate-800 border border-slate-700 rounded-lg p-3 text-slate-200 focus:outline-none focus:border-amber-500"
                />
              </div>

              <div className="flex items-center gap-4">
                <label className="flex items-center gap-2 text-slate-300 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={isPinned}
                    onChange={(e) => setIsPinned(e.target.checked)}
                    className="rounded bg-slate-800 border-slate-700 text-amber-500 focus:ring-0"
                  />
                  <span>Fissa in alto nella bacheca</span>
                </label>
              </div>

              <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-800">
                <button
                  type="button"
                  onClick={() => setModalOpen(false)}
                  className="px-4 py-2 rounded-lg bg-slate-800 text-slate-300 hover:text-white"
                >
                  Annulla
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="px-4 py-2 rounded-lg bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold"
                >
                  {submitting ? 'Invio...' : 'Pubblica Notifica'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
