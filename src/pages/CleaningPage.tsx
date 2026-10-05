import React, { useState } from 'react';
import {
  Sparkles,
  Plus,
  CheckCircle2,
  Clock,
  Calendar,
  User,
  AlertCircle,
  X,
  CheckSquare,
  Square,
} from 'lucide-react';
import type { CleaningShift, CleaningChecklistItem, CleaningShiftStatus } from '../types/database';
import { useAuth } from '../context/AuthContext';
import { api } from '../lib/api';

interface CleaningPageProps {
  shifts: CleaningShift[];
  onShiftCreated: (newShift: CleaningShift) => void;
  onChecklistToggled: (shiftId: string, updatedShift: CleaningShift) => void;
}

export const CleaningPage: React.FC<CleaningPageProps> = ({
  shifts,
  onShiftCreated,
  onChecklistToggled,
}) => {
  const { currentUser, isManager, users } = useAuth();
  const [activeTab, setActiveTab] = useState<'upcoming' | 'completed' | 'all'>('upcoming');
  const [modalOpen, setModalOpen] = useState(false);

  // Form states
  const [assignedUserId, setAssignedUserId] = useState(currentUser?.id || '');
  const [date, setDate] = useState('2026-10-25');
  const [time, setTime] = useState('10:00');
  const [notes, setNotes] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const filteredShifts = shifts.filter((s) => {
    if (activeTab === 'upcoming') return s.status === 'upcoming';
    if (activeTab === 'completed') return s.status === 'completed';
    return true;
  });

  const handleToggleChecklist = async (shift: CleaningShift, item: CleaningChecklistItem) => {
    try {
      const updated = await api.toggleChecklistItem(
        shift.id,
        item.id,
        !item.completed,
        `${currentUser?.first_name} ${currentUser?.last_name}`
      );
      onChecklistToggled(shift.id, updated);
    } catch (err: any) {
      alert(err.message || 'Errore nell aggiornamento checklist.');
    }
  };

  const handleCreateShift = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!assignedUserId || !date || !time) return;

    const assignedUser = users.find(u => u.id === assignedUserId);
    try {
      setSubmitting(true);
      const newShift = await api.createCleaningShift({
        assigned_user_id: assignedUserId,
        assigned_user_name: assignedUser ? `${assignedUser.first_name} ${assignedUser.last_name}` : 'Socio',
        date,
        time,
        notes,
      });
      onShiftCreated(newShift);
      setModalOpen(false);
      setNotes('');
    } catch (err: any) {
      alert(err.message || 'Errore nella creazione turno.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* HEADER */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold text-white tracking-tight">Turni di Pulizia</h1>
          <p className="text-xs text-slate-400">
            Organizzazione e checklist operative per mantenere il locale sempre pulito e accogliente.
          </p>
        </div>

        {isManager && (
          <button
            onClick={() => setModalOpen(true)}
            className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold text-xs transition-colors self-start sm:self-auto"
          >
            <Plus className="w-4 h-4" />
            <span>Assegna Turno</span>
          </button>
        )}
      </div>

      {/* FILTER TABS */}
      <div className="flex items-center gap-2 text-xs">
        <button
          onClick={() => setActiveTab('upcoming')}
          className={`px-3 py-1.5 rounded-lg font-medium transition-colors ${
            activeTab === 'upcoming'
              ? 'bg-slate-800 text-amber-400 border border-slate-700'
              : 'text-slate-400 hover:text-white'
          }`}
        >
          Turni Futuri ({shifts.filter(s => s.status === 'upcoming').length})
        </button>
        <button
          onClick={() => setActiveTab('completed')}
          className={`px-3 py-1.5 rounded-lg font-medium transition-colors ${
            activeTab === 'completed'
              ? 'bg-slate-800 text-amber-400 border border-slate-700'
              : 'text-slate-400 hover:text-white'
          }`}
        >
          Completati ({shifts.filter(s => s.status === 'completed').length})
        </button>
        <button
          onClick={() => setActiveTab('all')}
          className={`px-3 py-1.5 rounded-lg font-medium transition-colors ${
            activeTab === 'all'
              ? 'bg-slate-800 text-amber-400 border border-slate-700'
              : 'text-slate-400 hover:text-white'
          }`}
        >
          Tutti / Storico ({shifts.length})
        </button>
      </div>

      {/* SHIFTS GRID */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {filteredShifts.length === 0 ? (
          <div className="md:col-span-2 p-8 text-center rounded-2xl bg-slate-900 border border-slate-800 text-slate-400 text-xs">
            Nessun turno trovato per la selezione attuale.
          </div>
        ) : (
          filteredShifts.map((shift) => {
            const completedCount = shift.checklist.filter(c => c.completed).length;
            const totalCount = shift.checklist.length;
            const isAssignedToCurrent = shift.assigned_user_id === currentUser?.id;
            const canEditChecklist = isAssignedToCurrent || isManager;

            return (
              <div
                key={shift.id}
                className={`p-6 rounded-2xl bg-slate-900 border transition-all flex flex-col justify-between ${
                  shift.status === 'completed'
                    ? 'border-emerald-500/30'
                    : isAssignedToCurrent
                    ? 'border-amber-500/50 ring-1 ring-amber-500/20'
                    : 'border-slate-800'
                }`}
              >
                <div className="space-y-4">
                  {/* Shift Header */}
                  <div className="flex items-start justify-between">
                    <div>
                      <div className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider">
                        Turno Pulizia
                      </div>
                      <h3 className="text-base font-bold text-white mt-0.5">
                        {shift.assigned_user_name}
                      </h3>
                      {isAssignedToCurrent && (
                        <span className="text-[10px] text-amber-400 font-semibold">
                          (Assegnato a te)
                        </span>
                      )}
                    </div>

                    <div className="text-right">
                      <div className="text-xs font-bold text-amber-300 font-mono">{shift.date}</div>
                      <div className="text-[11px] text-slate-400 font-mono">Ore {shift.time}</div>
                    </div>
                  </div>

                  {shift.notes && (
                    <p className="text-xs text-slate-400 bg-slate-950/40 p-2.5 rounded-lg border border-slate-800">
                      {shift.notes}
                    </p>
                  )}

                  {/* Checklist Section */}
                  <div className="space-y-2 pt-2">
                    <div className="flex items-center justify-between text-xs font-semibold">
                      <span className="text-slate-300">Checklist operativa:</span>
                      <span className="font-mono text-slate-400">
                        {completedCount}/{totalCount} completate
                      </span>
                    </div>

                    {/* Progress Bar */}
                    <div className="w-full bg-slate-800 h-1.5 rounded-full overflow-hidden">
                      <div
                        className={`h-full transition-all duration-300 ${
                          completedCount === totalCount ? 'bg-emerald-500' : 'bg-amber-500'
                        }`}
                        style={{ width: `${(completedCount / totalCount) * 100}%` }}
                      />
                    </div>

                    {/* Checklist Items */}
                    <div className="space-y-1.5 pt-2">
                      {shift.checklist.map((item) => (
                        <button
                          key={item.id}
                          disabled={!canEditChecklist}
                          onClick={() => handleToggleChecklist(shift, item)}
                          className={`w-full text-left p-2 rounded-lg text-xs flex items-center gap-2.5 transition-colors ${
                            item.completed
                              ? 'bg-slate-950/60 text-slate-400 line-through'
                              : 'bg-slate-800/60 text-slate-200 hover:bg-slate-800'
                          } ${!canEditChecklist ? 'cursor-default' : 'cursor-pointer'}`}
                        >
                          {item.completed ? (
                            <CheckSquare className="w-4 h-4 text-emerald-400 shrink-0" />
                          ) : (
                            <Square className="w-4 h-4 text-slate-500 shrink-0" />
                          )}
                          <span className="flex-1 truncate">{item.label}</span>
                          {item.completed_by_name && (
                            <span className="text-[10px] text-slate-500 not-italic">
                              ({item.completed_by_name})
                            </span>
                          )}
                        </button>
                      ))}
                    </div>
                  </div>
                </div>

                <div className="mt-5 pt-3 border-t border-slate-800 flex items-center justify-between text-[11px] text-slate-500">
                  <span>Stato: <strong className={shift.status === 'completed' ? 'text-emerald-400' : 'text-amber-400 capitalize'}>{shift.status}</strong></span>
                  {shift.status === 'completed' && <span className="text-emerald-400 font-semibold">Tutte le attività completate!</span>}
                </div>
              </div>
            );
          })
        )}
      </div>

      {/* CREATE SHIFT MODAL */}
      {modalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
          <div className="w-full max-w-md bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-2xl space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-slate-800">
              <h3 className="text-base font-bold text-white">Assegna Nuovo Turno Pulizia</h3>
              <button onClick={() => setModalOpen(false)} className="p-1 text-slate-400 hover:text-white">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleCreateShift} className="space-y-4 text-xs">
              <div>
                <label className="block text-slate-300 font-medium mb-1">Membro Assegnato *</label>
                <select
                  value={assignedUserId}
                  onChange={(e) => setAssignedUserId(e.target.value)}
                  className="w-full bg-slate-800 border border-slate-700 rounded-lg p-2.5 text-white focus:outline-none focus:border-amber-500"
                >
                  {users.map((u) => (
                    <option key={u.id} value={u.id}>
                      {u.first_name} {u.last_name} (@{u.username})
                    </option>
                  ))}
                </select>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-300 font-medium mb-1">Data *</label>
                  <input
                    type="date"
                    required
                    value={date}
                    onChange={(e) => setDate(e.target.value)}
                    className="w-full bg-slate-800 border border-slate-700 rounded-lg p-2.5 text-white focus:outline-none focus:border-amber-500 font-mono"
                  />
                </div>
                <div>
                  <label className="block text-slate-300 font-medium mb-1">Ora *</label>
                  <input
                    type="time"
                    required
                    value={time}
                    onChange={(e) => setTime(e.target.value)}
                    className="w-full bg-slate-800 border border-slate-700 rounded-lg p-2.5 text-white focus:outline-none focus:border-amber-500 font-mono"
                  />
                </div>
              </div>

              <div>
                <label className="block text-slate-300 font-medium mb-1">Note specifiche per il turno</label>
                <textarea
                  rows={2}
                  placeholder="Es. Svuotare anche i bidoni esterni e cambiare sacchi..."
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  className="w-full bg-slate-800 border border-slate-700 rounded-lg p-2.5 text-white focus:outline-none focus:border-amber-500"
                />
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
                  {submitting ? 'Assegnazione...' : 'Conferma Turno'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
