import React, { useState } from 'react';
import {
  Target,
  Plus,
  DollarSign,
  TrendingUp,
  User,
  Calendar,
  CheckCircle2,
  X,
  CreditCard,
} from 'lucide-react';
import type { FinancialGoal } from '../types/database';
import { useAuth } from '../context/AuthContext';
import { api } from '../lib/api';

interface GoalsPageProps {
  goals: FinancialGoal[];
  onGoalCreated: (goal: FinancialGoal) => void;
  onGoalUpdated: (goal: FinancialGoal) => void;
}

export const GoalsPage: React.FC<GoalsPageProps> = ({
  goals,
  onGoalCreated,
  onGoalUpdated,
}) => {
  const { currentUser, isManager, users } = useAuth();
  const [goalModalOpen, setGoalModalOpen] = useState(false);
  const [contribModalOpen, setContribModalOpen] = useState(false);
  const [selectedGoal, setSelectedGoal] = useState<FinancialGoal | null>(null);

  // Create Goal form
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [targetAmount, setTargetAmount] = useState<number>(1000);
  const [deadline, setDeadline] = useState('2026-11-30');

  // Contribute form
  const [contribAmount, setContribAmount] = useState<number>(50);
  const [contribUser, setContribUser] = useState(currentUser?.first_name || 'Gianluca');
  const [contribNotes, setContribNotes] = useState('');
  const [registerInLedger, setRegisterInLedger] = useState(true);
  const [paymentMethod, setPaymentMethod] = useState<'bank' | 'cash'>('cash');
  const [submitting, setSubmitting] = useState(false);

  const handleCreateGoal = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title || !targetAmount) return;

    try {
      setSubmitting(true);
      const newGoal = await api.createGoal({
        title,
        description,
        target_amount: Number(targetAmount),
        deadline,
        created_by_name: `${currentUser?.first_name} ${currentUser?.last_name}`,
      });
      onGoalCreated(newGoal);
      setGoalModalOpen(false);
      setTitle('');
      setDescription('');
    } catch (err: any) {
      alert(err.message || 'Errore nella creazione obiettivo.');
    } finally {
      setSubmitting(false);
    }
  };

  const handleAddContribution = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedGoal || !contribAmount || contribAmount <= 0) return;

    try {
      setSubmitting(true);
      const updated = await api.contributeToGoal(selectedGoal.id, {
        amount: Number(contribAmount),
        user_name: contribUser,
        notes: contribNotes,
        register_financial_tx: registerInLedger,
        method: paymentMethod,
      });

      onGoalUpdated(updated);
      setContribModalOpen(false);
      setSelectedGoal(null);
      setContribNotes('');
    } catch (err: any) {
      alert(err.message || 'Errore nella registrazione versamento.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* HEADER */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold text-white tracking-tight">Obiettivi Economici</h1>
          <p className="text-xs text-slate-400">
            Campagne di crowdfunding interno per gli investimenti principali del locale con calcolo quote automatico.
          </p>
        </div>

        {isManager && (
          <button
            onClick={() => setGoalModalOpen(true)}
            className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold text-xs transition-colors self-start sm:self-auto"
          >
            <Plus className="w-4 h-4" />
            <span>+ Nuovo Obiettivo</span>
          </button>
        )}
      </div>

      {/* GOALS CARDS */}
      <div className="space-y-6">
        {goals.map((goal) => {
          const percentage = Math.min(100, Math.round((goal.collected_amount / goal.target_amount) * 100));
          const remaining = Math.max(0, goal.target_amount - goal.collected_amount);

          return (
            <div
              key={goal.id}
              className="p-6 rounded-2xl bg-slate-900 border border-slate-800 shadow-xl space-y-5"
            >
              {/* Goal Title & Summary */}
              <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4">
                <div className="space-y-1">
                  <div className="flex items-center gap-2 text-xs">
                    <span className="font-semibold text-emerald-400">
                      {goal.is_completed ? 'Completato 🎉' : 'Raccolta in Corso'}
                    </span>
                    {goal.deadline && (
                      <>
                        <span className="text-slate-500">·</span>
                        <span className="text-slate-400 font-mono">Scadenza: {goal.deadline}</span>
                      </>
                    )}
                  </div>
                  <h3 className="text-lg font-bold text-white tracking-tight">{goal.title}</h3>
                  {goal.description && (
                    <p className="text-xs text-slate-300 max-w-2xl">{goal.description}</p>
                  )}
                </div>

                {isManager && (
                  <button
                    onClick={() => {
                      setSelectedGoal(goal);
                      setContribModalOpen(true);
                    }}
                    className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white font-semibold text-xs transition-colors shadow-sm self-start sm:self-auto"
                  >
                    <Plus className="w-3.5 h-3.5" />
                    <span>Registra Versamento</span>
                  </button>
                )}
              </div>

              {/* PROGRESS BAR & AMOUNTS */}
              <div className="space-y-2 bg-slate-950/60 p-4 rounded-xl border border-slate-800/80">
                <div className="flex items-baseline justify-between text-xs">
                  <div>
                    <span className="text-slate-400">Raccolto finora: </span>
                    <strong className="text-emerald-400 font-mono text-base">
                      €{goal.collected_amount.toLocaleString('it-IT')}
                    </strong>
                  </div>
                  <div className="text-right">
                    <span className="text-slate-400">Target totale: </span>
                    <strong className="text-white font-mono text-base">
                      €{goal.target_amount.toLocaleString('it-IT')}
                    </strong>
                  </div>
                </div>

                {/* VISUAL BAR */}
                <div className="w-full bg-slate-800 h-3 rounded-full overflow-hidden p-0.5">
                  <div
                    className="bg-gradient-to-r from-amber-500 to-emerald-400 h-full rounded-full transition-all duration-700"
                    style={{ width: `${percentage}%` }}
                  />
                </div>

                <div className="flex items-center justify-between text-[11px] text-slate-400 font-mono">
                  <span className="text-amber-300 font-bold">{percentage}% completato</span>
                  <span>Mancano €{remaining.toLocaleString('it-IT')}</span>
                </div>
              </div>

              {/* CONTRIBUTIONS LIST */}
              <div className="space-y-2 pt-1">
                <h4 className="text-xs font-bold text-slate-300 flex items-center gap-1.5">
                  <span>Storico Versamenti & Quote ({goal.contributions.length})</span>
                </h4>

                {goal.contributions.length === 0 ? (
                  <div className="text-xs text-slate-500 italic p-3 bg-slate-950/30 rounded-lg">
                    Nessun versamento registrato al momento.
                  </div>
                ) : (
                  <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-2.5">
                    {goal.contributions.map((cnt) => (
                      <div
                        key={cnt.id}
                        className="p-3 rounded-xl bg-slate-800/40 border border-slate-800 flex items-center justify-between text-xs"
                      >
                        <div className="space-y-0.5">
                          <div className="font-semibold text-white">{cnt.user_name}</div>
                          <div className="text-[10px] text-slate-500 font-mono">{cnt.date}</div>
                          {cnt.notes && <div className="text-[10px] text-slate-400 line-clamp-1">{cnt.notes}</div>}
                        </div>
                        <div className="font-bold font-mono text-emerald-400 text-sm">
                          +€{cnt.amount}
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {/* CREATE GOAL MODAL */}
      {goalModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
          <div className="w-full max-w-md bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-2xl space-y-4 text-xs">
            <div className="flex items-center justify-between pb-3 border-b border-slate-800">
              <h3 className="text-base font-bold text-white">Nuovo Obiettivo di Spesa</h3>
              <button onClick={() => setGoalModalOpen(false)} className="p-1 text-slate-400 hover:text-white">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleCreateGoal} className="space-y-4">
              <div>
                <label className="block text-slate-300 font-medium mb-1">Nome Obiettivo *</label>
                <input
                  type="text"
                  required
                  placeholder="Es. Nuovo Frigorifero capiente"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  className="w-full bg-slate-800 border border-slate-700 rounded-lg p-2.5 text-white focus:outline-none focus:border-amber-500"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-300 font-medium mb-1">Costo Obiettivo (€) *</label>
                  <input
                    type="number"
                    required
                    min={10}
                    value={targetAmount}
                    onChange={(e) => setTargetAmount(Number(e.target.value))}
                    className="w-full bg-slate-800 border border-slate-700 rounded-lg p-2.5 text-white focus:outline-none focus:border-amber-500 font-mono"
                  />
                </div>
                <div>
                  <label className="block text-slate-300 font-medium mb-1">Scadenza Prevista</label>
                  <input
                    type="date"
                    value={deadline}
                    onChange={(e) => setDeadline(e.target.value)}
                    className="w-full bg-slate-800 border border-slate-700 rounded-lg p-2.5 text-white focus:outline-none focus:border-amber-500 font-mono"
                  />
                </div>
              </div>

              <div>
                <label className="block text-slate-300 font-medium mb-1">Descrizione & Obiettivi</label>
                <textarea
                  rows={2}
                  placeholder="Dettagli sulle specifiche dell'acquisto..."
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  className="w-full bg-slate-800 border border-slate-700 rounded-lg p-2.5 text-white focus:outline-none focus:border-amber-500"
                />
              </div>

              <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-800">
                <button
                  type="button"
                  onClick={() => setGoalModalOpen(false)}
                  className="px-4 py-2 rounded-lg bg-slate-800 text-slate-300 hover:text-white"
                >
                  Annulla
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="px-4 py-2 rounded-lg bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold"
                >
                  {submitting ? 'Creazione...' : 'Crea Obiettivo'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* CONTRIBUTE MODAL */}
      {contribModalOpen && selectedGoal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
          <div className="w-full max-w-md bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-2xl space-y-4 text-xs">
            <div className="flex items-center justify-between pb-3 border-b border-slate-800">
              <h3 className="text-base font-bold text-white">Registra Versamento Quota</h3>
              <button onClick={() => setContribModalOpen(false)} className="p-1 text-slate-400 hover:text-white">
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-3 rounded-lg bg-slate-950/60 border border-slate-800">
              <div className="text-slate-400">Obiettivo:</div>
              <div className="font-bold text-white text-sm">{selectedGoal.title}</div>
            </div>

            <form onSubmit={handleAddContribution} className="space-y-4">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-300 font-medium mb-1">Importo Versato (€) *</label>
                  <input
                    type="number"
                    required
                    min={1}
                    value={contribAmount}
                    onChange={(e) => setContribAmount(Number(e.target.value))}
                    className="w-full bg-slate-800 border border-slate-700 rounded-lg p-2.5 text-white focus:outline-none focus:border-amber-500 font-mono"
                  />
                </div>
                <div>
                  <label className="block text-slate-300 font-medium mb-1">Chi Versa *</label>
                  <input
                    type="text"
                    required
                    value={contribUser}
                    onChange={(e) => setContribUser(e.target.value)}
                    className="w-full bg-slate-800 border border-slate-700 rounded-lg p-2.5 text-white focus:outline-none focus:border-amber-500"
                  />
                </div>
              </div>

              <div>
                <label className="block text-slate-300 font-medium mb-1">Note / Riferimento</label>
                <input
                  type="text"
                  placeholder="Es. Bonifico quota ottobre o contanti in cassa"
                  value={contribNotes}
                  onChange={(e) => setContribNotes(e.target.value)}
                  className="w-full bg-slate-800 border border-slate-700 rounded-lg p-2.5 text-white focus:outline-none focus:border-amber-500"
                />
              </div>

              <div className="p-3 bg-slate-950/40 rounded-xl border border-slate-800 space-y-2">
                <label className="flex items-center gap-2 text-slate-300 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={registerInLedger}
                    onChange={(e) => setRegisterInLedger(e.target.checked)}
                    className="rounded bg-slate-800 border-slate-700 text-amber-500 focus:ring-0"
                  />
                  <span>Registra anche nel libro cassa / finanze</span>
                </label>

                {registerInLedger && (
                  <div className="flex items-center gap-4 pt-1 text-slate-400">
                    <label className="flex items-center gap-1.5 cursor-pointer">
                      <input
                        type="radio"
                        name="method"
                        value="cash"
                        checked={paymentMethod === 'cash'}
                        onChange={() => setPaymentMethod('cash')}
                        className="text-amber-500"
                      />
                      <span>Fondo Cassa</span>
                    </label>
                    <label className="flex items-center gap-1.5 cursor-pointer">
                      <input
                        type="radio"
                        name="method"
                        value="bank"
                        checked={paymentMethod === 'bank'}
                        onChange={() => setPaymentMethod('bank')}
                        className="text-amber-500"
                      />
                      <span>Conto Bancario</span>
                    </label>
                  </div>
                )}
              </div>

              <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-800">
                <button
                  type="button"
                  onClick={() => setContribModalOpen(false)}
                  className="px-4 py-2 rounded-lg bg-slate-800 text-slate-300 hover:text-white"
                >
                  Annulla
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="px-4 py-2 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white font-bold"
                >
                  {submitting ? 'Registrazione...' : 'Conferma Quota'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
