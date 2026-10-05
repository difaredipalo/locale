import React, { useState } from 'react';
import {
  BarChart3,
  Plus,
  Clock,
  CheckCircle2,
  Lock,
  Unlock,
  Eye,
  EyeOff,
  X,
  Users,
} from 'lucide-react';
import type { Poll } from '../types/database';
import { useAuth } from '../context/AuthContext';
import { api } from '../lib/api';

interface PollsPageProps {
  polls: Poll[];
  onPollCreated: (newPoll: Poll) => void;
  onPollUpdated: (updatedPoll: Poll) => void;
}

export const PollsPage: React.FC<PollsPageProps> = ({
  polls,
  onPollCreated,
  onPollUpdated,
}) => {
  const { currentUser, isManager } = useAuth();
  const [modalOpen, setModalOpen] = useState(false);

  // Form states
  const [question, setQuestion] = useState('');
  const [description, setDescription] = useState('');
  const [options, setOptions] = useState<string[]>(['', '']);
  const [closesAt, setClosesAt] = useState('2026-10-31');
  const [allowChangeVote, setAllowChangeVote] = useState(true);
  const [isAnonymous, setIsAnonymous] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [filterActive, setFilterActive] = useState<'all' | 'open' | 'closed'>('all');

  const filteredPolls = polls.filter((p) => {
    if (filterActive === 'open') return !p.is_closed;
    if (filterActive === 'closed') return p.is_closed;
    return true;
  });

  const handleVote = async (pollId: string, optionId: string) => {
    if (!currentUser) return;
    try {
      const updated = await api.votePoll(
        pollId,
        optionId,
        currentUser.id,
        `${currentUser.first_name} ${currentUser.last_name}`
      );
      onPollUpdated(updated);
    } catch (err: any) {
      alert(err.message || 'Errore durante la votazione.');
    }
  };

  const handleToggleClose = async (pollId: string) => {
    try {
      const updated = await api.toggleClosePoll(pollId);
      onPollUpdated(updated);
    } catch (err: any) {
      alert(err.message || 'Errore nella chiusura del sondaggio.');
    }
  };

  const handleAddOptionField = () => {
    setOptions([...options, '']);
  };

  const handleOptionChange = (idx: number, val: string) => {
    const next = [...options];
    next[idx] = val;
    setOptions(next);
  };

  const handleRemoveOptionField = (idx: number) => {
    if (options.length <= 2) return;
    setOptions(options.filter((_, i) => i !== idx));
  };

  const handleCreatePoll = async (e: React.FormEvent) => {
    e.preventDefault();
    const validOptions = options.map(o => o.trim()).filter(Boolean);
    if (!question || validOptions.length < 2) {
      alert('Inserisci la domanda e almeno 2 opzioni valide.');
      return;
    }

    try {
      setSubmitting(true);
      const newPoll = await api.createPoll({
        question,
        description,
        options: validOptions,
        closes_at: `${closesAt}T23:59:59.000Z`,
        allow_change_vote: allowChangeVote,
        is_anonymous: isAnonymous,
        created_by_id: currentUser?.id,
        created_by_name: `${currentUser?.first_name} ${currentUser?.last_name}`,
      });
      onPollCreated(newPoll);
      setModalOpen(false);
      setQuestion('');
      setDescription('');
      setOptions(['', '']);
    } catch (err: any) {
      alert(err.message || 'Errore nella creazione del sondaggio.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* HEADER */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold text-white tracking-tight">Sondaggi & Decisioni</h1>
          <p className="text-xs text-slate-400">
            Partecipa alle votazioni della community per decidere acquisti, eventi e novità del locale.
          </p>
        </div>

        {isManager && (
          <button
            onClick={() => setModalOpen(true)}
            className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold text-xs transition-colors self-start sm:self-auto"
          >
            <Plus className="w-4 h-4" />
            <span>Nuovo Sondaggio</span>
          </button>
        )}
      </div>

      {/* FILTER */}
      <div className="flex items-center gap-2 text-xs">
        <button
          onClick={() => setFilterActive('all')}
          className={`px-3 py-1.5 rounded-lg font-medium transition-colors ${
            filterActive === 'all'
              ? 'bg-slate-800 text-amber-400 border border-slate-700'
              : 'text-slate-400 hover:text-white'
          }`}
        >
          Tutti i sondaggi ({polls.length})
        </button>
        <button
          onClick={() => setFilterActive('open')}
          className={`px-3 py-1.5 rounded-lg font-medium transition-colors ${
            filterActive === 'open'
              ? 'bg-slate-800 text-amber-400 border border-slate-700'
              : 'text-slate-400 hover:text-white'
          }`}
        >
          Aperti ({polls.filter(p => !p.is_closed).length})
        </button>
        <button
          onClick={() => setFilterActive('closed')}
          className={`px-3 py-1.5 rounded-lg font-medium transition-colors ${
            filterActive === 'closed'
              ? 'bg-slate-800 text-amber-400 border border-slate-700'
              : 'text-slate-400 hover:text-white'
          }`}
        >
          Chiusi ({polls.filter(p => p.is_closed).length})
        </button>
      </div>

      {/* POLLS LIST */}
      <div className="space-y-6">
        {filteredPolls.length === 0 ? (
          <div className="p-8 text-center rounded-2xl bg-slate-900 border border-slate-800 text-slate-400 text-xs">
            Nessun sondaggio presente per questa categoria.
          </div>
        ) : (
          filteredPolls.map((poll) => {
            const userVote = poll.votes.find(v => v.user_id === currentUser?.id);
            const totalVotes = poll.votes.length || 0;

            return (
              <div
                key={poll.id}
                className="p-6 rounded-2xl bg-slate-900 border border-slate-800 shadow-lg space-y-4"
              >
                {/* Header */}
                <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-3 pb-3 border-b border-slate-800">
                  <div className="space-y-1">
                    <div className="flex items-center gap-3 text-xs">
                      <span className={`font-semibold ${poll.is_closed ? 'text-red-400' : 'text-emerald-400'}`}>
                        {poll.is_closed ? '● Sondaggio Chiuso' : '● Votazione Aperta'}
                      </span>
                      <span className="text-slate-500">·</span>
                      <span className="text-slate-400">
                        {poll.is_anonymous ? 'Voto anonimo' : 'Voto nominale'}
                      </span>
                      <span className="text-slate-500">·</span>
                      <span className="text-slate-400">
                        {poll.allow_change_vote ? 'Modifica voto consentita' : 'Voto definitivo'}
                      </span>
                    </div>
                    <h3 className="text-base font-bold text-white mt-1">{poll.question}</h3>
                    {poll.description && (
                      <p className="text-xs text-slate-400">{poll.description}</p>
                    )}
                  </div>

                  {isManager && (
                    <button
                      onClick={() => handleToggleClose(poll.id)}
                      className={`px-3 py-1.5 rounded-lg text-xs font-medium border transition-colors ${
                        poll.is_closed
                          ? 'border-emerald-500/40 text-emerald-400 hover:bg-emerald-950/30'
                          : 'border-red-500/40 text-red-400 hover:bg-red-950/30'
                      }`}
                    >
                      {poll.is_closed ? 'Riapri Sondaggio' : 'Chiudi Votazione'}
                    </button>
                  )}
                </div>

                {/* Options with Visual Percentage Charts */}
                <div className="space-y-3 pt-1">
                  {poll.options.map((opt) => {
                    const isSelected = userVote?.option_id === opt.id;
                    const pct = totalVotes > 0 ? Math.round((opt.votes_count / totalVotes) * 100) : 0;
                    const canVote = !poll.is_closed && (poll.allow_change_vote || !userVote);

                    return (
                      <div
                        key={opt.id}
                        onClick={() => {
                          if (canVote) handleVote(poll.id, opt.id);
                        }}
                        className={`relative overflow-hidden p-3.5 rounded-xl border transition-all ${
                          canVote ? 'cursor-pointer hover:border-slate-600' : 'cursor-default'
                        } ${
                          isSelected
                            ? 'border-amber-500/60 bg-amber-500/10'
                            : 'border-slate-800 bg-slate-800/40'
                        }`}
                      >
                        {/* Dynamic Bar Chart Fill */}
                        <div
                          className="absolute inset-y-0 left-0 bg-slate-800/80 -z-0 transition-all duration-500 rounded-l-xl"
                          style={{ width: `${pct}%` }}
                        />

                        <div className="relative z-10 flex items-center justify-between text-xs">
                          <div className="flex items-center gap-3">
                            <span
                              className={`w-4 h-4 rounded-full border flex items-center justify-center text-[9px] ${
                                isSelected
                                  ? 'border-amber-400 bg-amber-500 text-slate-950 font-bold'
                                  : 'border-slate-600'
                              }`}
                            >
                              {isSelected ? '✓' : ''}
                            </span>
                            <span className={`font-semibold ${isSelected ? 'text-amber-200' : 'text-slate-100'}`}>
                              {opt.text}
                            </span>
                          </div>

                          <div className="flex items-center gap-3 font-mono tabular-nums">
                            <span className="text-slate-400">{opt.votes_count} voti</span>
                            <span className="text-slate-200 font-bold">{pct}%</span>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>

                {/* Footer Metadata & Voters List (if nominal) */}
                <div className="pt-2 flex flex-col sm:flex-row sm:items-center justify-between text-[11px] text-slate-500 gap-2 border-t border-slate-800/60">
                  <div>
                    Partecipanti: <strong>{totalVotes}</strong> voti registrati · Creato da {poll.created_by_name}
                  </div>
                  <div>
                    Scadenza: <span className="font-mono text-slate-400">{new Date(poll.closes_at).toLocaleDateString('it-IT')}</span>
                  </div>
                </div>

                {!poll.is_anonymous && poll.votes.length > 0 && (
                  <div className="pt-2 text-[11px] text-slate-400">
                    Votanti: {poll.votes.map(v => v.user_name).join(', ')}
                  </div>
                )}
              </div>
            );
          })
        )}
      </div>

      {/* CREATE POLL MODAL */}
      {modalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
          <div className="w-full max-w-lg bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-2xl space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-slate-800">
              <h3 className="text-base font-bold text-white">Crea Nuovo Sondaggio</h3>
              <button onClick={() => setModalOpen(false)} className="p-1 text-slate-400 hover:text-white">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleCreatePoll} className="space-y-4 text-xs">
              <div>
                <label className="block text-slate-300 font-medium mb-1">Domanda del Sondaggio *</label>
                <input
                  type="text"
                  required
                  placeholder="Es. Quale acquisto facciamo questo mese per il locale?"
                  value={question}
                  onChange={(e) => setQuestion(e.target.value)}
                  className="w-full bg-slate-800 border border-slate-700 rounded-lg p-2.5 text-white focus:outline-none focus:border-amber-500"
                />
              </div>

              <div>
                <label className="block text-slate-300 font-medium mb-1">Descrizione / Note</label>
                <textarea
                  rows={2}
                  placeholder="Fornisci contesto aggiuntivo..."
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  className="w-full bg-slate-800 border border-slate-700 rounded-lg p-2.5 text-white focus:outline-none focus:border-amber-500"
                />
              </div>

              {/* Options fields */}
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <label className="block text-slate-300 font-medium">Opzioni di Risposta *</label>
                  <button
                    type="button"
                    onClick={handleAddOptionField}
                    className="text-amber-400 hover:text-amber-300 font-semibold text-xs"
                  >
                    + Aggiungi opzione
                  </button>
                </div>
                {options.map((opt, idx) => (
                  <div key={idx} className="flex items-center gap-2">
                    <input
                      type="text"
                      required
                      placeholder={`Opzione ${idx + 1}`}
                      value={opt}
                      onChange={(e) => handleOptionChange(idx, e.target.value)}
                      className="flex-1 bg-slate-800 border border-slate-700 rounded-lg p-2.5 text-white focus:outline-none focus:border-amber-500"
                    />
                    {options.length > 2 && (
                      <button
                        type="button"
                        onClick={() => handleRemoveOptionField(idx)}
                        className="p-2 text-slate-500 hover:text-red-400"
                      >
                        <X className="w-4 h-4" />
                      </button>
                    )}
                  </div>
                ))}
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2">
                <div>
                  <label className="block text-slate-300 font-medium mb-1">Data Chiusura</label>
                  <input
                    type="date"
                    value={closesAt}
                    onChange={(e) => setClosesAt(e.target.value)}
                    className="w-full bg-slate-800 border border-slate-700 rounded-lg p-2 text-white focus:outline-none focus:border-amber-500 font-mono"
                  />
                </div>
                <div className="space-y-2 pt-4">
                  <label className="flex items-center gap-2 text-slate-300 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={allowChangeVote}
                      onChange={(e) => setAllowChangeVote(e.target.checked)}
                      className="rounded bg-slate-800 border-slate-700 text-amber-500 focus:ring-0"
                    />
                    <span>Permetti di modificare il voto</span>
                  </label>
                  <label className="flex items-center gap-2 text-slate-300 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={isAnonymous}
                      onChange={(e) => setIsAnonymous(e.target.checked)}
                      className="rounded bg-slate-800 border-slate-700 text-amber-500 focus:ring-0"
                    />
                    <span>Voto anonimo</span>
                  </label>
                </div>
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
                  {submitting ? 'Creazione...' : 'Pubblica Sondaggio'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
