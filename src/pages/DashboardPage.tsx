import React from 'react';
import {
  Calendar,
  Sparkles,
  Bell,
  Target,
  Wallet,
  Clock,
  ArrowRight,
  CheckCircle2,
  AlertTriangle,
  Plus,
  Award,
  Vote,
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import type {
  CalendarEvent,
  CleaningShift,
  NotificationItem,
  FinancialGoal,
  FinancialSummary,
  Poll,
  VenueRequest,
  PresidentialElection,
} from '../types/database';
import clubBanner from '../assets/images/covo_club_banner_1791184958054.jpg';

interface DashboardPageProps {
  events: CalendarEvent[];
  cleaningShifts: CleaningShift[];
  notifications: NotificationItem[];
  goals: FinancialGoal[];
  financialSummary: FinancialSummary | null;
  polls: Poll[];
  venueRequests: VenueRequest[];
  elections: PresidentialElection[];
  onNavigate: (tab: any) => void;
  onVotePoll: (pollId: string, optionId: string) => void;
}

export const DashboardPage: React.FC<DashboardPageProps> = ({
  events,
  cleaningShifts,
  notifications,
  goals,
  financialSummary,
  polls,
  venueRequests,
  elections,
  onNavigate,
  onVotePoll,
}) => {
  const { currentUser, isManager } = useAuth();

  // Find next confirmed event (sorted by date)
  const nextEvent = [...events]
    .filter(e => e.status === 'confirmed')
    .sort((a, b) => a.date.localeCompare(b.date))[0];

  // Find next upcoming cleaning shift
  const nextCleaning = [...cleaningShifts]
    .filter(s => s.status === 'upcoming')
    .sort((a, b) => a.date.localeCompare(b.date))[0];

  // Active top goal
  const primaryGoal = goals.find(g => !g.is_completed) || goals[0];
  const goalPercentage = primaryGoal
    ? Math.min(100, Math.round((primaryGoal.collected_amount / primaryGoal.target_amount) * 100))
    : 0;

  // Unread notifications
  const unreadNotifs = notifications.filter(
    n => !n.is_archived && (!currentUser || !n.read_by.includes(currentUser.id))
  );

  // Active poll
  const activePoll = polls.find(p => !p.is_closed) || polls[0];
  const userVote = activePoll?.votes.find(v => v.user_id === currentUser?.id);

  // Pending venue requests count
  const pendingRequests = venueRequests.filter(r => r.status === 'pending');

  // Active presidential election
  const activeElection = (elections || []).find(e => e.status === 'active');
  const hasVotedElection = activeElection && currentUser
    ? activeElection.voter_ids.includes(currentUser.id)
    : false;

  const formatDate = (dateStr: string) => {
    if (!dateStr) return '';
    try {
      const parts = dateStr.split('-');
      const d = new Date(Number(parts[0]), Number(parts[1]) - 1, Number(parts[2]));
      return d.toLocaleDateString('it-IT', { weekday: 'long', day: 'numeric', month: 'long' });
    } catch {
      return dateStr;
    }
  };

  return (
    <div className="space-y-6">
      {/* HERO WELCOME BANNER */}
      <div className="relative rounded-2xl overflow-hidden border border-slate-800 bg-slate-900 shadow-xl">
        <div className="absolute inset-0 z-0">
          <img
            src={clubBanner}
            alt="Il Covo Lounge"
            className="w-full h-full object-cover object-center opacity-25 filter brightness-75 contrast-125"
          />
          <div className="absolute inset-0 bg-gradient-to-r from-slate-950 via-slate-950/80 to-transparent" />
        </div>

        <div className="relative z-10 p-6 sm:p-8 flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
          <div className="max-w-xl space-y-2">
            <div className="inline-flex items-center gap-2 text-xs font-semibold text-amber-400">
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
              <span>Locale attivo & riservato ai soci</span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-white">
              Buongiorno, {currentUser?.first_name || 'Socio'} 👋
            </h1>
            <p className="text-xs sm:text-sm text-slate-300">
              Bentornato sul portale de Il Covo. Consulta il calendario, verifica i turni di pulizia o prenota l'utilizzo per la tua serata.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-3 shrink-0">
            <button
              onClick={() => onNavigate('venue-requests')}
              className="inline-flex items-center gap-2 px-4 py-2.5 rounded-lg bg-amber-500 hover:bg-amber-400 text-slate-950 font-semibold text-xs transition-colors shadow-sm"
            >
              <Plus className="w-4 h-4" />
              <span>Richiedi Utilizzo Locale</span>
            </button>
            <button
              onClick={() => onNavigate('calendar')}
              className="inline-flex items-center gap-2 px-4 py-2.5 rounded-lg bg-slate-800/80 hover:bg-slate-700 text-slate-200 text-xs font-medium border border-slate-700 transition-colors"
            >
              <Calendar className="w-4 h-4 text-slate-400" />
              <span>Vedi Calendario</span>
            </button>
          </div>
        </div>
      </div>

      {/* PENDING NOTIFICATION / ALERT BAR */}
      {pendingRequests.length > 0 && isManager && (
        <div className="flex items-center justify-between p-4 rounded-xl bg-amber-950/30 border border-amber-500/30 text-xs">
          <div className="flex items-center gap-3">
            <AlertTriangle className="w-4 h-4 text-amber-400 shrink-0" />
            <span className="text-amber-200">
              Ci sono <strong>{pendingRequests.length}</strong> richieste di utilizzo in attesa di approvazione.
            </span>
          </div>
          <button
            onClick={() => onNavigate('venue-requests')}
            className="text-amber-400 hover:text-amber-300 font-semibold inline-flex items-center gap-1"
          >
            <span>Gestisci</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </button>
        </div>
      )}

      {/* ACTIVE PRESIDENTIAL ELECTION BANNER */}
      {activeElection && (
        <div className="flex flex-col sm:flex-row sm:items-center justify-between p-4 rounded-xl bg-gradient-to-r from-amber-950/40 via-slate-900 to-slate-900 border border-amber-500/40 shadow-md gap-3 text-xs">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-lg bg-amber-500/20 border border-amber-500/30 flex items-center justify-center text-amber-400 shrink-0">
              <Award className="w-5 h-5" />
            </div>
            <div>
              <div className="font-bold text-white text-sm flex items-center gap-2">
                <span>{activeElection.title}</span>
                <span className={`text-[10px] px-2 py-0.5 rounded border font-semibold ${
                  hasVotedElection ? 'text-emerald-400 border-emerald-500/30 bg-emerald-500/10' : 'text-amber-400 border-amber-500/30 bg-amber-500/10'
                }`}>
                  {hasVotedElection ? '✓ Scheda Depositata' : '● Votazione in Corso'}
                </span>
              </div>
              <div className="text-slate-300 text-[11px] mt-0.5">
                Seggio aperto fino al {activeElection.end_date} · Solo voto diretto, nessun campo testuale ammesso.
              </div>
            </div>
          </div>

          <button
            onClick={() => onNavigate('elections')}
            className="inline-flex items-center gap-1.5 px-4 py-2 rounded-lg bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold text-xs transition-colors shrink-0 shadow-sm self-start sm:self-center"
          >
            <Vote className="w-4 h-4" />
            <span>{hasVotedElection ? 'Vedi Seggio & Affluenza' : 'Vota il Presidente'}</span>
          </button>
        </div>
      )}

      {/* KEY HIGHLIGHT WIDGETS GRID */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* WIDGET 1: PROSSIMO EVENTO */}
        <div className="p-4 rounded-xl bg-slate-900 border border-slate-800 flex flex-col justify-between">
          <div className="flex items-center justify-between mb-3">
            <span className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider">
              Prossimo Evento
            </span>
            <Calendar className="w-4 h-4 text-amber-400" />
          </div>
          {nextEvent ? (
            <div className="space-y-1">
              <div className="text-xs text-amber-400 capitalize font-medium">
                {formatDate(nextEvent.date)}
              </div>
              <div className="text-sm font-bold text-white truncate">
                {nextEvent.title}
              </div>
              <div className="text-xs text-slate-400 font-mono">
                {nextEvent.start_time} - {nextEvent.end_time}
              </div>
            </div>
          ) : (
            <div className="text-xs text-slate-500 italic">Nessun evento confermato</div>
          )}
          <button
            onClick={() => onNavigate('calendar')}
            className="mt-4 text-[11px] text-slate-400 hover:text-white inline-flex items-center gap-1 font-medium transition-colors"
          >
            <span>Tutti gli eventi</span>
            <ArrowRight className="w-3 h-3" />
          </button>
        </div>

        {/* WIDGET 2: PROSSIMO TURNO PULIZIA */}
        <div className="p-4 rounded-xl bg-slate-900 border border-slate-800 flex flex-col justify-between">
          <div className="flex items-center justify-between mb-3">
            <span className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider">
              Turno Pulizia
            </span>
            <Sparkles className="w-4 h-4 text-sky-400" />
          </div>
          {nextCleaning ? (
            <div className="space-y-1">
              <div className="text-xs text-sky-400 capitalize font-medium">
                {formatDate(nextCleaning.date)}
              </div>
              <div className="text-sm font-bold text-white truncate">
                Assegnato a: {nextCleaning.assigned_user_name}
              </div>
              <div className="text-xs text-slate-400 font-mono">
                Ore {nextCleaning.time} · {nextCleaning.checklist.filter(c => c.completed).length}/{nextCleaning.checklist.length} attività fatte
              </div>
            </div>
          ) : (
            <div className="text-xs text-slate-500 italic">Nessun turno assegnato</div>
          )}
          <button
            onClick={() => onNavigate('cleaning')}
            className="mt-4 text-[11px] text-slate-400 hover:text-white inline-flex items-center gap-1 font-medium transition-colors"
          >
            <span>Checklist e turni</span>
            <ArrowRight className="w-3 h-3" />
          </button>
        </div>

        {/* WIDGET 3: NOTIFICHE RECENTI */}
        <div className="p-4 rounded-xl bg-slate-900 border border-slate-800 flex flex-col justify-between">
          <div className="flex items-center justify-between mb-3">
            <span className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider">
              Comunicazioni
            </span>
            <Bell className="w-4 h-4 text-purple-400" />
          </div>
          <div className="space-y-1">
            <div className="text-sm font-bold text-white">
              {unreadNotifs.length} nuove comunicazioni
            </div>
            <div className="text-xs text-slate-400 truncate">
              {unreadNotifs[0]?.title || 'Tutti i messaggi sono stati letti'}
            </div>
          </div>
          <button
            onClick={() => onNavigate('notifications')}
            className="mt-4 text-[11px] text-slate-400 hover:text-white inline-flex items-center gap-1 font-medium transition-colors"
          >
            <span>Leggi bacheca</span>
            <ArrowRight className="w-3 h-3" />
          </button>
        </div>

        {/* WIDGET 4: OBIETTIVO CORRENTE */}
        <div className="p-4 rounded-xl bg-slate-900 border border-slate-800 flex flex-col justify-between">
          <div className="flex items-center justify-between mb-3">
            <span className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider">
              Obiettivo Fondi
            </span>
            <Target className="w-4 h-4 text-emerald-400" />
          </div>
          {primaryGoal ? (
            <div className="space-y-2">
              <div className="text-sm font-bold text-white truncate">
                {primaryGoal.title}
              </div>
              <div className="flex items-baseline justify-between text-xs font-mono tabular-nums">
                <span className="text-emerald-400 font-semibold">€{primaryGoal.collected_amount.toLocaleString('it-IT')}</span>
                <span className="text-slate-400">/ €{primaryGoal.target_amount.toLocaleString('it-IT')}</span>
              </div>
              <div className="w-full bg-slate-800 h-2 rounded-full overflow-hidden">
                <div
                  className="bg-emerald-500 h-full transition-all duration-500 rounded-full"
                  style={{ width: `${goalPercentage}%` }}
                />
              </div>
              <div className="text-[10px] text-right text-slate-400 font-mono">
                {goalPercentage}% raggiunto
              </div>
            </div>
          ) : (
            <div className="text-xs text-slate-500 italic">Nessun obiettivo attivo</div>
          )}
          <button
            onClick={() => onNavigate('goals')}
            className="mt-2 text-[11px] text-slate-400 hover:text-white inline-flex items-center gap-1 font-medium transition-colors"
          >
            <span>Dettagli raccolta</span>
            <ArrowRight className="w-3 h-3" />
          </button>
        </div>
      </div>

      {/* DETAILED SECTION ROWS */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* LEFT COLUMN: ACTIVE POLL (2 COLS) */}
        <div className="lg:col-span-2 space-y-6">
          {/* SONDAGGIO ATTIVO */}
          {activePoll && (
            <div className="p-6 rounded-2xl bg-slate-900 border border-slate-800">
              <div className="flex items-center justify-between pb-4 mb-4 border-b border-slate-800">
                <div>
                  <div className="text-xs text-amber-400 font-medium">Sondaggio della Community</div>
                  <h3 className="text-base font-bold text-white mt-0.5">{activePoll.question}</h3>
                </div>
                <button
                  onClick={() => onNavigate('polls')}
                  className="text-xs text-slate-400 hover:text-white inline-flex items-center gap-1"
                >
                  <span>Tutti i sondaggi</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </button>
              </div>

              {activePoll.description && (
                <p className="text-xs text-slate-400 mb-4">{activePoll.description}</p>
              )}

              <div className="space-y-2.5">
                {activePoll.options.map((opt) => {
                  const totalVotes = activePoll.votes.length || 1;
                  const pct = Math.round((opt.votes_count / totalVotes) * 100);
                  const isSelected = userVote?.option_id === opt.id;

                  return (
                    <button
                      key={opt.id}
                      onClick={() => onVotePoll(activePoll.id, opt.id)}
                      className={`w-full text-left p-3 rounded-xl border transition-all relative overflow-hidden ${
                        isSelected
                          ? 'border-amber-500/50 bg-amber-500/10'
                          : 'border-slate-800 bg-slate-800/40 hover:bg-slate-800/80 hover:border-slate-700'
                      }`}
                    >
                      {/* background progress indicator */}
                      <div
                        className="absolute inset-y-0 left-0 bg-slate-700/20 -z-0 transition-all duration-300"
                        style={{ width: `${pct}%` }}
                      />
                      <div className="relative z-10 flex items-center justify-between text-xs">
                        <div className="flex items-center gap-2">
                          <span
                            className={`w-4 h-4 rounded-full border flex items-center justify-center text-[9px] ${
                              isSelected
                                ? 'border-amber-400 bg-amber-500 text-slate-950 font-bold'
                                : 'border-slate-600'
                            }`}
                          >
                            {isSelected ? '✓' : ''}
                          </span>
                          <span className={`font-medium ${isSelected ? 'text-amber-200' : 'text-slate-200'}`}>
                            {opt.text}
                          </span>
                        </div>
                        <div className="flex items-center gap-2 font-mono tabular-nums text-slate-400">
                          <span>{opt.votes_count} voti</span>
                          <span className="font-semibold text-slate-300">({pct}%)</span>
                        </div>
                      </div>
                    </button>
                  );
                })}
              </div>

              <div className="mt-4 pt-3 border-t border-slate-800/60 flex items-center justify-between text-[11px] text-slate-500">
                <span>Voti totali: {activePoll.votes.length}</span>
                <span>{activePoll.is_anonymous ? 'Sondaggio anonimo' : 'Voto nominale'}</span>
              </div>
            </div>
          )}

          {/* PROSSIMI EVENTI COMPLETI */}
          <div className="p-6 rounded-2xl bg-slate-900 border border-slate-800">
            <div className="flex items-center justify-between pb-4 mb-4 border-b border-slate-800">
              <h3 className="text-sm font-bold text-white flex items-center gap-2">
                <Calendar className="w-4 h-4 text-amber-400" />
                <span>Programma del Locale</span>
              </h3>
              <button
                onClick={() => onNavigate('calendar')}
                className="text-xs text-amber-400 hover:text-amber-300 font-semibold"
              >
                Apri Calendario
              </button>
            </div>

            <div className="space-y-3">
              {events.slice(0, 3).map((evt) => (
                <div
                  key={evt.id}
                  className="flex items-start justify-between p-3.5 rounded-xl bg-slate-800/40 border border-slate-800"
                >
                  <div className="space-y-1">
                    <div className="flex items-center gap-2 text-xs">
                      <span className="font-semibold text-white">{evt.title}</span>
                      <span className="text-slate-500">·</span>
                      <span className="text-slate-400">{evt.category}</span>
                    </div>
                    {evt.description && (
                      <p className="text-xs text-slate-400 line-clamp-1">{evt.description}</p>
                    )}
                    <div className="text-[11px] text-slate-500">
                      Partecipanti: {evt.participants.join(', ') || 'Aperto'}
                    </div>
                  </div>
                  <div className="text-right shrink-0">
                    <div className="text-xs font-semibold text-amber-300">{evt.date}</div>
                    <div className="text-[11px] text-slate-400 font-mono">{evt.start_time} - {evt.end_time}</div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* RIGHT COLUMN: FINANCIAL WIDGET & QUICK NOTICES */}
        <div className="space-y-6">
          {/* SITUAZIONE ECONOMICA (Se autorizzato o visibile) */}
          {financialSummary && (
            <div className="p-6 rounded-2xl bg-slate-900 border border-slate-800 space-y-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Wallet className="w-4 h-4 text-emerald-400" />
                  <h3 className="text-sm font-bold text-white">Situazione Fondo Cassa</h3>
                </div>
                {isManager && (
                  <button
                    onClick={() => onNavigate('finances')}
                    className="text-xs text-amber-400 hover:text-amber-300 font-semibold"
                  >
                    Dettagli
                  </button>
                )}
              </div>

              <div className="p-4 rounded-xl bg-slate-950/60 border border-slate-800/80 space-y-3">
                <div>
                  <div className="text-[11px] text-slate-400 uppercase tracking-wider font-medium">
                    Totale Disponibile
                  </div>
                  <div className="text-2xl font-bold font-mono tabular-nums text-white mt-0.5">
                    €{financialSummary.total_balance.toLocaleString('it-IT')}
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-2 pt-3 border-t border-slate-800 text-xs">
                  <div>
                    <span className="text-[11px] text-slate-400 block">Conto Banca</span>
                    <span className="font-semibold font-mono tabular-nums text-slate-200">
                      €{financialSummary.bank_balance.toLocaleString('it-IT')}
                    </span>
                  </div>
                  <div>
                    <span className="text-[11px] text-slate-400 block">Fondo Cassa</span>
                    <span className="font-semibold font-mono tabular-nums text-emerald-400">
                      €{financialSummary.cash_balance.toLocaleString('it-IT')}
                    </span>
                  </div>
                </div>
              </div>

              <div className="text-[11px] text-slate-400 flex items-center justify-between px-1">
                <span>Entrate mese: <strong className="text-emerald-400 font-mono">+€{financialSummary.monthly_income}</strong></span>
                <span>Uscite mese: <strong className="text-red-400 font-mono">-€{financialSummary.monthly_expense}</strong></span>
              </div>
            </div>
          )}

          {/* BACHECA COMUNICAZIONI */}
          <div className="p-6 rounded-2xl bg-slate-900 border border-slate-800 space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Bell className="w-4 h-4 text-purple-400" />
                <h3 className="text-sm font-bold text-white">Bacheca Notifiche</h3>
              </div>
              <button
                onClick={() => onNavigate('notifications')}
                className="text-xs text-amber-400 hover:text-amber-300 font-semibold"
              >
                Vedi tutte
              </button>
            </div>

            <div className="space-y-3">
              {notifications.slice(0, 3).map((notif) => (
                <div
                  key={notif.id}
                  className="p-3 rounded-xl bg-slate-800/40 border border-slate-800 text-xs space-y-1"
                >
                  <div className="flex items-center justify-between">
                    <span className="font-semibold text-white truncate">{notif.title}</span>
                    <span className="text-[10px] text-amber-400 uppercase tracking-wider">{notif.category}</span>
                  </div>
                  <p className="text-slate-400 line-clamp-2">{notif.content}</p>
                  <div className="text-[10px] text-slate-500 pt-1">
                    Da {notif.created_by_name} · {new Date(notif.created_at).toLocaleDateString('it-IT')}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
