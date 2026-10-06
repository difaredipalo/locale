import React, { useState } from 'react';
import {
  Vote,
  Award,
  CheckCircle2,
  Lock,
  Plus,
  Calendar,
  Users,
  ShieldCheck,
  AlertCircle,
  X,
  Crown,
} from 'lucide-react';
import type { PresidentialElection, ElectionCandidate } from '../types/database';
import { useAuth } from '../context/AuthContext';
import { api } from '../lib/api';

interface ElectionsPageProps {
  elections: PresidentialElection[];
  onElectionUpdated: (updated: PresidentialElection) => void;
  onElectionCreated: (created: PresidentialElection) => void;
}

export const ElectionsPage: React.FC<ElectionsPageProps> = ({
  elections,
  onElectionUpdated,
  onElectionCreated,
}) => {
  const { currentUser, isAdmin, users } = useAuth();

  // Selection states
  const [selectedCandidateId, setSelectedCandidateId] = useState<string>('');
  const [submittingVote, setSubmittingVote] = useState(false);
  const [voteSuccessMessage, setVoteSuccessMessage] = useState<string | null>(null);

  // Admin Modal state
  const [createModalOpen, setCreateModalOpen] = useState(false);
  const [quarter, setQuarter] = useState('Q1 2027');
  const [title, setTitle] = useState('Elezioni Presidenziali Trimestrali - Q1 2027');
  const [termPeriod, setTermPeriod] = useState('1 Gennaio 2027 - 31 Marzo 2027');
  const [description, setDescription] = useState('Elezione trimestrale per la presidenza del locale.');
  const [startDate, setStartDate] = useState('2027-01-01');
  const [endDate, setEndDate] = useState('2027-01-15');
  const [selectedCandidateUserIds, setSelectedCandidateUserIds] = useState<string[]>([]);
  const [submittingCreate, setSubmittingCreate] = useState(false);

  // Find active election or most recent
  const activeElection = elections.find(e => e.status === 'active') || elections[0];
  const pastElections = elections.filter(e => e.id !== activeElection?.id);

  const hasCurrentUserVoted = activeElection && currentUser
    ? activeElection.voter_ids.includes(currentUser.id)
    : false;

  const totalMembers = users.length || 1;
  const votesCast = activeElection ? activeElection.voter_ids.length : 0;
  const turnoutPercentage = Math.round((votesCast / totalMembers) * 100);

  const handleCastVote = async () => {
    if (!activeElection || !currentUser) return;
    if (!selectedCandidateId) {
      alert('Seleziona un candidato oppure la scheda bianca prima di procedere.');
      return;
    }

    const candidateName = selectedCandidateId === 'blank'
      ? 'Scheda Bianca'
      : activeElection.candidates.find(c => c.id === selectedCandidateId)?.name || 'Candidato';

    const confirmed = window.confirm(
      `Confermi di voler depositare la tua scheda per "${candidateName}"?\n\nIl voto è personale, segreto e non potrà essere modificato una volta inserito nell'urna.`
    );
    if (!confirmed) return;

    try {
      setSubmittingVote(true);
      const updated = await api.voteElection(activeElection.id, {
        user_id: currentUser.id,
        user_name: `${currentUser.first_name} ${currentUser.last_name}`,
        candidate_id: selectedCandidateId,
      });

      onElectionUpdated(updated);
      setSelectedCandidateId('');
      setVoteSuccessMessage('Voto registrato con successo! La tua scheda è stata depositata nell\'urna elettorale segreta.');
      setTimeout(() => setVoteSuccessMessage(null), 6000);
    } catch (err: any) {
      alert(err.message || 'Errore durante la registrazione del voto.');
    } finally {
      setSubmittingVote(false);
    }
  };

  const handleCloseElection = async (election: PresidentialElection) => {
    if (!isAdmin) return;
    const confirmed = window.confirm(
      `Sei sicuro di voler chiudere il seggio per "${election.title}" e proclamare il Presidente eletto?`
    );
    if (!confirmed) return;

    try {
      const updated = await api.closeElection(election.id, {
        closed_by_id: currentUser?.id || 'usr_admin',
        closed_by_name: `${currentUser?.first_name} ${currentUser?.last_name}`,
      });
      onElectionUpdated(updated);
    } catch (err: any) {
      alert(err.message || 'Errore durante la chiusura delle elezioni.');
    }
  };

  const handleCreateElection = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!quarter || !title || !termPeriod || selectedCandidateUserIds.length < 2) {
      alert('Inserisci tutte le informazioni e seleziona almeno 2 candidati.');
      return;
    }

    const candidatesPayload = selectedCandidateUserIds.map(uid => {
      const u = users.find(x => x.id === uid);
      return {
        user_id: uid,
        name: u ? `${u.first_name} ${u.last_name}` : 'Socio',
        manifesto_summary: `Candidatura ufficiale presentata per il trimestre ${quarter}.`,
      };
    });

    try {
      setSubmittingCreate(true);
      const created = await api.createElection({
        quarter,
        title,
        term_period: termPeriod,
        description,
        start_date: startDate,
        end_date: endDate,
        candidates: candidatesPayload,
        created_by_id: currentUser?.id,
        created_by_name: `${currentUser?.first_name} ${currentUser?.last_name}`,
      });
      onElectionCreated(created);
      setCreateModalOpen(false);
      setSelectedCandidateUserIds([]);
    } catch (err: any) {
      alert(err.message || 'Errore nella creazione dell elezione.');
    } finally {
      setSubmittingCreate(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* HEADER */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="inline-flex items-center gap-2 text-xs font-semibold text-amber-400 mb-1">
            <Award className="w-4 h-4 text-amber-400" />
            <span>Consultazione Istituzionale Trimestrale</span>
          </div>
          <h1 className="text-xl sm:text-2xl font-bold text-white tracking-tight">
            Elezioni del Presidente de Il Covo
          </h1>
          <p className="text-xs text-slate-400">
            Seggio elettorale ufficiale: gli utenti possono unicamente esprimere la propria preferenza con voto segreto certificato. Nessun campo testuale o commento consentito.
          </p>
        </div>

        {isAdmin && (
          <button
            onClick={() => setCreateModalOpen(true)}
            className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold text-xs transition-colors self-start sm:self-auto"
          >
            <Plus className="w-4 h-4" />
            <span>Indici Nuova Tornata Elettorale</span>
          </button>
        )}
      </div>

      {voteSuccessMessage && (
        <div className="p-4 rounded-xl bg-emerald-950/50 border border-emerald-500/50 text-emerald-200 text-xs flex items-center gap-3 shadow-lg">
          <CheckCircle2 className="w-5 h-5 text-emerald-400 shrink-0" />
          <span>{voteSuccessMessage}</span>
        </div>
      )}

      {/* ACTIVE ELECTION BALLOT */}
      {activeElection ? (
        <div className="p-6 rounded-2xl bg-slate-900 border border-slate-800 shadow-xl space-y-6">
          {/* Election Header Banner */}
          <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4 pb-5 border-b border-slate-800">
            <div className="space-y-1">
              <div className="flex items-center gap-2 text-xs">
                <span className={`px-2 py-0.5 rounded font-bold uppercase tracking-wider text-[10px] border ${
                  activeElection.status === 'active'
                    ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20'
                    : 'bg-slate-800 text-slate-400 border-slate-700'
                }`}>
                  {activeElection.status === 'active' ? '● Seggio Elettorale Aperto' : '● Scrutinio Concluso'}
                </span>
                <span className="text-slate-500">·</span>
                <span className="font-mono text-amber-300 font-semibold">{activeElection.quarter}</span>
                <span className="text-slate-500">·</span>
                <span className="text-slate-400 font-mono">Periodo di Mandato: {activeElection.term_period}</span>
              </div>
              <h2 className="text-lg font-bold text-white tracking-tight mt-1">{activeElection.title}</h2>
              <p className="text-xs text-slate-300 max-w-3xl leading-relaxed">{activeElection.description}</p>
            </div>

            {isAdmin && activeElection.status === 'active' && (
              <button
                onClick={() => handleCloseElection(activeElection)}
                className="px-3.5 py-1.5 rounded-lg bg-red-950/60 hover:bg-red-900/60 text-red-300 border border-red-500/40 font-bold text-xs transition-colors shrink-0"
              >
                Chiudi Seggio & Proclama Eletto
              </button>
            )}
          </div>

          {/* TURNOUT AND QUORUM STATS */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 p-4 rounded-xl bg-slate-950/60 border border-slate-800 text-xs">
            <div>
              <span className="text-slate-400 block text-[11px]">Affluenza alle Urne:</span>
              <span className="font-mono font-bold text-white text-sm">
                {votesCast} su {totalMembers} soci ({turnoutPercentage}%)
              </span>
            </div>
            <div>
              <span className="text-slate-400 block text-[11px]">Garanzia Segretezza:</span>
              <span className="font-semibold text-emerald-400 flex items-center gap-1">
                <ShieldCheck className="w-3.5 h-3.5" />
                Voto Personale Anonimizzato
              </span>
            </div>
            <div>
              <span className="text-slate-400 block text-[11px]">Tuo Stato Elettorale:</span>
              <span className={`font-semibold ${hasCurrentUserVoted ? 'text-emerald-400' : 'text-amber-400'}`}>
                {hasCurrentUserVoted ? '✓ Scheda già Depositata' : '● In Attesa del Tuo Voto'}
              </span>
            </div>
          </div>

          {/* OFFICIAL VOTING BALLOT (NO TEXT INPUT ALLOWED) */}
          {activeElection.status === 'active' && (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400">
                  {hasCurrentUserVoted ? 'Riepilogo Candidature Ufficiali' : 'Scheda Elettorale Ufficiale (Seleziona la tua scelta)'}
                </h3>
                <span className="text-[11px] text-slate-500">
                  {hasCurrentUserVoted ? 'Scrutinio in corso' : '1 sola scelta consentita · Nessun campo testo'}
                </span>
              </div>

              {/* CANDIDATES LIST */}
              <div className="space-y-2.5">
                {activeElection.candidates.map((cand) => {
                  const isSelected = selectedCandidateId === cand.id;
                  const isWinner = activeElection.winner_candidate_id === cand.id;

                  return (
                    <label
                      key={cand.id}
                      className={`block p-4 rounded-xl border transition-all ${
                        hasCurrentUserVoted
                          ? 'border-slate-800 bg-slate-800/30 cursor-default'
                          : 'cursor-pointer hover:border-slate-700 bg-slate-800/50'
                      } ${
                        isSelected && !hasCurrentUserVoted
                          ? 'border-amber-500 bg-amber-500/10 ring-1 ring-amber-500/30'
                          : ''
                      }`}
                    >
                      <div className="flex items-start justify-between gap-3 text-xs">
                        <div className="flex items-start gap-3">
                          {!hasCurrentUserVoted && (
                            <input
                              type="radio"
                              name="presidential_choice"
                              value={cand.id}
                              checked={isSelected}
                              onChange={() => setSelectedCandidateId(cand.id)}
                              className="mt-1 text-amber-500 focus:ring-0 focus:ring-offset-0 bg-slate-800 border-slate-700"
                            />
                          )}
                          <div className="w-8 h-8 rounded-full bg-slate-800 border border-slate-700 flex items-center justify-center font-bold text-amber-400 text-xs shrink-0">
                            {cand.name[0]}
                          </div>
                          <div className="space-y-1">
                            <div className="font-bold text-white text-sm flex items-center gap-2">
                              <span>{cand.name}</span>
                              {isWinner && (
                                <span className="inline-flex items-center gap-1 text-[10px] px-2 py-0.5 rounded bg-amber-500/20 text-amber-300 font-bold border border-amber-500/30">
                                  <Crown className="w-3 h-3 text-amber-400" />
                                  Eletto Presidente
                                </span>
                              )}
                            </div>
                            {cand.manifesto_summary && (
                              <p className="text-slate-300 text-xs leading-relaxed">
                                {cand.manifesto_summary}
                              </p>
                            )}
                          </div>
                        </div>

                        {/* Votes count (only shown if closed or voted) */}
                        {hasCurrentUserVoted && (
                          <div className="font-mono text-slate-400 text-xs tabular-nums text-right shrink-0">
                            <span>Voti parziali: </span>
                            <strong className="text-slate-200">{cand.votes_count}</strong>
                          </div>
                        )}
                      </div>
                    </label>
                  );
                })}

                {/* BLANK VOTE OPTION */}
                {!hasCurrentUserVoted && (
                  <label
                    className={`block p-4 rounded-xl border transition-all cursor-pointer hover:border-slate-700 bg-slate-800/30 ${
                      selectedCandidateId === 'blank'
                        ? 'border-slate-500 bg-slate-800/80 ring-1 ring-slate-500'
                        : 'border-slate-800'
                    }`}
                  >
                    <div className="flex items-center gap-3 text-xs">
                      <input
                        type="radio"
                        name="presidential_choice"
                        value="blank"
                        checked={selectedCandidateId === 'blank'}
                        onChange={() => setSelectedCandidateId('blank')}
                        className="text-amber-500 focus:ring-0 focus:ring-offset-0 bg-slate-800 border-slate-700"
                      />
                      <div>
                        <div className="font-semibold text-slate-300">Scheda Bianca / Astensione</div>
                        <div className="text-[11px] text-slate-500">
                          Deposita una scheda non espressa a favore di alcun candidato.
                        </div>
                      </div>
                    </div>
                  </label>
                )}
              </div>

              {/* ACTION BUTTON OR ALREADY VOTED NOTICE */}
              {!hasCurrentUserVoted ? (
                <div className="pt-3 flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-t border-slate-800">
                  <span className="text-[11px] text-slate-400">
                    Nessun campo digitabile: la tua preferenza è univoca e irrevocabile.
                  </span>
                  <button
                    onClick={handleCastVote}
                    disabled={!selectedCandidateId || submittingVote}
                    className="px-6 py-2.5 rounded-lg bg-amber-500 hover:bg-amber-400 disabled:opacity-40 text-slate-950 font-bold text-xs transition-colors shadow-md flex items-center justify-center gap-2"
                  >
                    <Vote className="w-4 h-4" />
                    <span>{submittingVote ? 'Deposito in corso...' : 'Deposita Voto nell\'Urna'}</span>
                  </button>
                </div>
              ) : (
                <div className="p-4 rounded-xl bg-slate-950 border border-slate-800 text-xs text-slate-400 flex items-center gap-3">
                  <CheckCircle2 className="w-5 h-5 text-emerald-400 shrink-0" />
                  <span>
                    Hai già votato per questa tornata elettorale. In ossequio allo statuto, il tuo voto è stato custodito nell'urna anonimizzata e potrai consultare la proclamazione ufficiale al termine dello scrutinio.
                  </span>
                </div>
              )}
            </div>
          )}

          {/* CLOSED ELECTION SUMMARY */}
          {activeElection.status === 'closed' && (
            <div className="p-5 rounded-xl bg-amber-500/10 border border-amber-500/30 text-xs space-y-3">
              <div className="flex items-center gap-2 text-amber-300 font-bold text-sm">
                <Crown className="w-5 h-5 text-amber-400" />
                <span>Proclamazione Ufficiale Presidente del Locale</span>
              </div>
              <p className="text-slate-200">
                Al termine dello scrutinio certificato, <strong>{activeElection.winner_name || 'N/A'}</strong> è proclamato Presidente de Il Covo per il trimestre <strong>{activeElection.quarter}</strong>.
              </p>
              <div className="pt-2 flex items-center gap-4 text-slate-400 font-mono text-[11px]">
                <span>Schede totali: {activeElection.voter_ids.length}</span>
                <span>Schede bianche: {activeElection.blank_votes}</span>
              </div>
            </div>
          )}
        </div>
      ) : (
        <div className="p-8 text-center rounded-2xl bg-slate-900 border border-slate-800 text-slate-400 text-xs">
          Nessuna elezione attiva al momento.
        </div>
      )}

      {/* PAST ELECTIONS ARCHIVE */}
      {pastElections.length > 0 && (
        <div className="space-y-4 pt-4">
          <h3 className="text-sm font-bold text-white flex items-center gap-2">
            <Award className="w-4 h-4 text-amber-400" />
            <span>Archivio Storico Scrutini Trimestrali</span>
          </h3>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {pastElections.map((elec) => (
              <div
                key={elec.id}
                className="p-5 rounded-2xl bg-slate-900 border border-slate-800 text-xs space-y-2.5"
              >
                <div className="flex items-center justify-between">
                  <span className="font-bold text-amber-400 font-mono">{elec.quarter}</span>
                  <span className="text-[10px] text-slate-500 font-mono">{elec.term_period}</span>
                </div>
                <div className="font-bold text-white text-sm">{elec.title}</div>
                <div className="p-2.5 rounded-lg bg-slate-950/60 border border-slate-800 flex items-center justify-between">
                  <span className="text-slate-400">Presidente Eletto:</span>
                  <span className="font-bold text-amber-300 flex items-center gap-1">
                    <Crown className="w-3.5 h-3.5" />
                    {elec.winner_name || 'N/A'}
                  </span>
                </div>
                <div className="text-[11px] text-slate-500">
                  Affluenza: {elec.voter_ids.length} votanti totali
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* CREATE ELECTION MODAL (ADMIN ONLY) */}
      {createModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
          <div className="w-full max-w-lg bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-2xl space-y-4 text-xs">
            <div className="flex items-center justify-between pb-3 border-b border-slate-800">
              <h3 className="text-base font-bold text-white">Indizione Nuove Elezioni Trimestrali</h3>
              <button onClick={() => setCreateModalOpen(false)} className="p-1 text-slate-400 hover:text-white">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleCreateElection} className="space-y-4">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-300 font-medium mb-1">Trimestre (Quarter) *</label>
                  <input
                    type="text"
                    required
                    placeholder="Es. Q1 2027"
                    value={quarter}
                    onChange={(e) => setQuarter(e.target.value)}
                    className="w-full bg-slate-800 border border-slate-700 rounded-lg p-2 text-white focus:outline-none focus:border-amber-500 font-mono"
                  />
                </div>
                <div>
                  <label className="block text-slate-300 font-medium mb-1">Periodo di Mandato *</label>
                  <input
                    type="text"
                    required
                    placeholder="1 Gennaio 2027 - 31 Marzo 2027"
                    value={termPeriod}
                    onChange={(e) => setTermPeriod(e.target.value)}
                    className="w-full bg-slate-800 border border-slate-700 rounded-lg p-2 text-white focus:outline-none focus:border-amber-500"
                  />
                </div>
              </div>

              <div>
                <label className="block text-slate-300 font-medium mb-1">Titolo Elezione *</label>
                <input
                  type="text"
                  required
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  className="w-full bg-slate-800 border border-slate-700 rounded-lg p-2 text-white focus:outline-none focus:border-amber-500"
                />
              </div>

              <div>
                <label className="block text-slate-300 font-medium mb-1">Seleziona Candidati Ammessi (min. 2 soci) *</label>
                <div className="grid grid-cols-2 gap-2 max-h-40 overflow-y-auto p-2 bg-slate-950 rounded-xl border border-slate-800">
                  {users.map((u) => {
                    const isChecked = selectedCandidateUserIds.includes(u.id);
                    return (
                      <label key={u.id} className="flex items-center gap-2 p-1.5 rounded hover:bg-slate-800 cursor-pointer">
                        <input
                          type="checkbox"
                          checked={isChecked}
                          onChange={(e) => {
                            if (e.target.checked) {
                              setSelectedCandidateUserIds([...selectedCandidateUserIds, u.id]);
                            } else {
                              setSelectedCandidateUserIds(selectedCandidateUserIds.filter(id => id !== u.id));
                            }
                          }}
                          className="rounded text-amber-500 bg-slate-800 border-slate-700"
                        />
                        <span className="text-white truncate">{u.first_name} {u.last_name}</span>
                      </label>
                    );
                  })}
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-300 font-medium mb-1">Data Inizio</label>
                  <input
                    type="date"
                    value={startDate}
                    onChange={(e) => setStartDate(e.target.value)}
                    className="w-full bg-slate-800 border border-slate-700 rounded-lg p-2 text-white font-mono"
                  />
                </div>
                <div>
                  <label className="block text-slate-300 font-medium mb-1">Data Chiusura</label>
                  <input
                    type="date"
                    value={endDate}
                    onChange={(e) => setEndDate(e.target.value)}
                    className="w-full bg-slate-800 border border-slate-700 rounded-lg p-2 text-white font-mono"
                  />
                </div>
              </div>

              <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-800">
                <button
                  type="button"
                  onClick={() => setCreateModalOpen(false)}
                  className="px-4 py-2 rounded-lg bg-slate-800 text-slate-300 hover:text-white"
                >
                  Annulla
                </button>
                <button
                  type="submit"
                  disabled={submittingCreate}
                  className="px-4 py-2 rounded-lg bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold"
                >
                  {submittingCreate ? 'Creazione...' : 'Indici Elezioni'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
