import React, { useState } from 'react';
import {
  MapPin,
  Clock,
  Plus,
  Users,
  X,
  CheckCircle2,
  LogOut,
  ChevronRight,
  Sparkles,
} from 'lucide-react';
import type { UserPresence } from '../../types/database';
import { useAuth } from '../../context/AuthContext';
import { api } from '../../lib/api';

interface PresenceWidgetProps {
  presences: UserPresence[];
  onPresencesUpdated: (presences: UserPresence[]) => void;
}

export const PresenceWidget: React.FC<PresenceWidgetProps> = ({
  presences,
  onPresencesUpdated,
}) => {
  const { currentUser } = useAuth();
  const [modalOpen, setModalOpen] = useState(false);
  const [durationHours, setDurationHours] = useState('2');
  const [notes, setNotes] = useState('');
  const [loading, setLoading] = useState(false);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  // Check if current user is currently active at the venue
  const myPresence = presences.find(
    p => p.user_id === currentUser?.id && p.status !== 'ended' && new Date(p.expected_until) > new Date()
  );

  const activePresences = presences.filter(
    p => p.status !== 'ended' && new Date(p.expected_until) > new Date()
  );

  const handleConfirmPresence = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentUser) return;
    try {
      setLoading(true);
      const hours = Number(durationHours) || 2;
      const expectedUntil = new Date(Date.now() + hours * 60 * 60 * 1000).toISOString();
      const created = await api.startPresence({
        user_id: currentUser.id,
        user_name: `${currentUser.first_name} ${currentUser.last_name}`,
        expected_hours: hours,
        expected_until: expectedUntil,
        notes: notes.trim() || undefined,
      });

      const updated = [created, ...presences.filter(p => p.user_id !== currentUser.id)];
      onPresencesUpdated(updated);
      setModalOpen(false);
      setNotes('');
      setSuccessMessage('Presenza registrata! I soci sono stati avvisati tramite notifica.');
      setTimeout(() => setSuccessMessage(null), 5000);
    } catch (err: any) {
      alert(err.message || 'Errore nella registrazione della presenza');
    } finally {
      setLoading(false);
    }
  };

  const handleExtend = async () => {
    if (!myPresence) return;
    try {
      setLoading(true);
      const updated = await api.extendPresence(myPresence.id, { extra_hours: 1 });
      onPresencesUpdated(presences.map(p => (p.id === updated.id ? updated : p)));
      setSuccessMessage('Permanenza prolungata di 1 ora. Notifica inviata ai soci.');
      setTimeout(() => setSuccessMessage(null), 4000);
    } catch (err: any) {
      alert(err.message || 'Errore prolungamento presenza');
    } finally {
      setLoading(false);
    }
  };

  const handleEnd = async () => {
    if (!myPresence) return;
    try {
      setLoading(true);
      const updated = await api.endPresence(myPresence.id);
      onPresencesUpdated(presences.filter(p => p.id !== updated.id));
      setSuccessMessage('Hai lasciato il locale. Stato aggiornato.');
      setTimeout(() => setSuccessMessage(null), 4000);
    } catch (err: any) {
      alert(err.message || 'Errore termine presenza');
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <div className="p-3.5 sm:p-4 rounded-2xl bg-gradient-to-r from-slate-900 via-slate-900 to-slate-950 border border-slate-800 shadow-md flex flex-col md:flex-row md:items-center justify-between gap-3 text-xs">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-emerald-500/15 border border-emerald-500/30 flex items-center justify-center text-emerald-400 shrink-0 shadow-inner">
            <MapPin className="w-5 h-5 animate-bounce" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="font-bold text-white text-sm">Chi c'è al Locale Adesso?</span>
              <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 flex items-center gap-1">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                <span>{activePresences.length} {activePresences.length === 1 ? 'socio presente' : 'soci presenti'}</span>
              </span>
            </div>

            {activePresences.length > 0 ? (
              <div className="flex flex-wrap items-center gap-2 mt-1">
                {activePresences.map((p) => {
                  const untilTime = new Date(p.expected_until).toLocaleTimeString('it-IT', {
                    hour: '2-digit',
                    minute: '2-digit',
                  });
                  const isMe = p.user_id === currentUser?.id;
                  return (
                    <span
                      key={p.id}
                      className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg border text-[11px] ${
                        isMe
                          ? 'bg-amber-500/15 text-amber-300 border-amber-500/30 font-semibold'
                          : 'bg-slate-800/80 text-slate-200 border-slate-700'
                      }`}
                      title={p.notes ? `Note: ${p.notes}` : undefined}
                    >
                      <span className="font-bold">{p.user_name}</span>
                      <span className="text-slate-400 font-mono text-[10px]">fino alle {untilTime}</span>
                      {p.notes && <span className="text-slate-400 italic text-[10px]">({p.notes})</span>}
                    </span>
                  );
                })}
              </div>
            ) : (
              <p className="text-slate-400 text-xs mt-0.5">
                Il locale è attualmente libero. Sei al locale? Conferma la tua presenza per avvisare gli altri soci.
              </p>
            )}
          </div>
        </div>

        {/* ACTIONS */}
        <div className="flex items-center gap-2 self-start md:self-center shrink-0">
          {myPresence ? (
            <div className="flex items-center gap-2">
              <button
                onClick={handleExtend}
                disabled={loading}
                className="px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-amber-300 border border-amber-500/30 font-semibold text-xs transition-colors flex items-center gap-1.5 shadow-sm"
                title="Prolunga la tua presenza di 1 ora"
              >
                <Clock className="w-3.5 h-3.5" />
                <span>+1h Prolunga</span>
              </button>
              <button
                onClick={handleEnd}
                disabled={loading}
                className="px-3 py-1.5 rounded-lg bg-red-950/60 hover:bg-red-900/60 text-red-300 border border-red-500/40 font-semibold text-xs transition-colors flex items-center gap-1.5"
                title="Conferma di aver lasciato il locale"
              >
                <LogOut className="w-3.5 h-3.5" />
                <span>Lascio il locale</span>
              </button>
            </div>
          ) : (
            <button
              onClick={() => setModalOpen(true)}
              className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold text-xs transition-all shadow-md active:scale-95"
            >
              <MapPin className="w-4 h-4" />
              <span>Sono al Locale!</span>
            </button>
          )}
        </div>
      </div>

      {successMessage && (
        <div className="p-3 rounded-xl bg-emerald-950/50 border border-emerald-500/50 text-emerald-200 text-xs flex items-center gap-2 shadow-sm">
          <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
          <span>{successMessage}</span>
        </div>
      )}

      {/* MODAL: REGISTRA PRESENZA */}
      {modalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-sm">
          <div className="w-full max-w-md bg-slate-900 border border-slate-700 rounded-3xl p-6 shadow-2xl space-y-4 text-xs">
            <div className="flex items-center justify-between pb-3 border-b border-slate-800">
              <div className="flex items-center gap-2 text-base font-bold text-white">
                <MapPin className="w-5 h-5 text-emerald-400" />
                <span>Conferma Presenza al Locale</span>
              </div>
              <button onClick={() => setModalOpen(false)} className="p-1 text-slate-400 hover:text-white">
                <X className="w-5 h-5" />
              </button>
            </div>

            <p className="text-slate-300 leading-relaxed">
              Registra la tua permanenza per far sapere agli amici che il locale è aperto e frequentato. Il sistema invierà automaticamente una notifica sui canali scelti dai soci (App, Web Push, Telegram, WhatsApp).
            </p>

            <form onSubmit={handleConfirmPresence} className="space-y-4">
              <div>
                <label className="block text-slate-300 font-medium mb-1.5">Quanto prevedi di restare?</label>
                <div className="grid grid-cols-4 gap-2 font-semibold">
                  {['1', '2', '4', '6'].map((hrs) => (
                    <button
                      key={hrs}
                      type="button"
                      onClick={() => setDurationHours(hrs)}
                      className={`p-2 rounded-xl border text-center transition-all ${
                        durationHours === hrs
                          ? 'bg-emerald-500 text-slate-950 border-emerald-400 font-bold shadow-sm'
                          : 'bg-slate-800/80 text-slate-300 border-slate-700 hover:bg-slate-700'
                      }`}
                    >
                      {hrs} {hrs === '1' ? 'ora' : 'ore'}
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label className="block text-slate-300 font-medium mb-1">Cosa fai al locale? (Opzionale)</label>
                <input
                  type="text"
                  placeholder="Es. Studio, partita a freccette, aperitivo..."
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  className="w-full bg-slate-800 border border-slate-700 rounded-xl p-2.5 text-white focus:outline-none focus:border-emerald-500 placeholder:text-slate-500"
                />
              </div>

              <div className="p-3 rounded-xl bg-slate-950 border border-slate-800 space-y-1 text-[11px] text-slate-400">
                <div className="font-semibold text-slate-200 flex items-center gap-1.5">
                  <Sparkles className="w-3.5 h-3.5 text-amber-400" />
                  <span>Evento generato: USER_PRESENCE_STARTED</span>
                </div>
                <p>Verrà creata una notifica multi-canale: <em>"🟢 {currentUser?.first_name} è al locale"</em>.</p>
              </div>

              <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-800">
                <button
                  type="button"
                  onClick={() => setModalOpen(false)}
                  className="px-4 py-2 rounded-xl bg-slate-800 text-slate-300 hover:text-white"
                >
                  Annulla
                </button>
                <button
                  type="submit"
                  disabled={loading}
                  className="px-5 py-2.5 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold transition-colors shadow-md"
                >
                  {loading ? 'Registrazione...' : 'Conferma Presenza'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </>
  );
};
