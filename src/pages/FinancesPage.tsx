import React, { useState } from 'react';
import {
  Wallet,
  Building2,
  Coins,
  ArrowUpRight,
  ArrowDownRight,
  Plus,
  Filter,
  FileSpreadsheet,
  Receipt,
  Calendar,
  X,
  ShieldAlert,
} from 'lucide-react';
import type {
  FinancialSummary,
  FinancialTransaction,
  TransactionType,
  TransactionMethod,
  TransactionCategory,
} from '../types/database';
import { useAuth } from '../context/AuthContext';
import { api } from '../lib/api';

interface FinancesPageProps {
  summary: FinancialSummary | null;
  transactions: FinancialTransaction[];
  onTransactionCreated: (tx: FinancialTransaction, newSummary: FinancialSummary) => void;
}

export const FinancesPage: React.FC<FinancesPageProps> = ({
  summary,
  transactions,
  onTransactionCreated,
}) => {
  const { currentUser, isManager } = useAuth();
  const [modalOpen, setModalOpen] = useState(false);
  const [filterType, setFilterType] = useState<string>('all');
  const [filterMethod, setFilterMethod] = useState<string>('all');
  const [filterCategory, setFilterCategory] = useState<string>('all');

  // Form states
  const [type, setType] = useState<TransactionType>('expense');
  const [amount, setAmount] = useState<number>(50);
  const [date, setDate] = useState('2026-10-05');
  const [category, setCategory] = useState<TransactionCategory>('Acquisti');
  const [description, setDescription] = useState('');
  const [method, setMethod] = useState<TransactionMethod>('cash');
  const [receiptNote, setReceiptNote] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const categories: TransactionCategory[] = [
    'Acquisti',
    'Bollette',
    'Manutenzione',
    'Eventi',
    'Pulizie',
    'Contributi',
    'Quote Mensili',
    'Altro',
  ];

  if (!isManager) {
    return (
      <div className="p-8 rounded-2xl bg-slate-900 border border-slate-800 text-center space-y-3">
        <ShieldAlert className="w-10 h-10 text-amber-400 mx-auto" />
        <h2 className="text-lg font-bold text-white">Accesso Riservato</h2>
        <p className="text-xs text-slate-400 max-w-md mx-auto">
          La sezione contabile e finanziaria dettagliata è accessibile esclusivamente ai gestori e amministratori del locale.
        </p>
      </div>
    );
  }

  const filteredTransactions = transactions.filter((tx) => {
    if (filterType !== 'all' && tx.type !== filterType) return false;
    if (filterMethod !== 'all' && tx.method !== filterMethod) return false;
    if (filterCategory !== 'all' && tx.category !== filterCategory) return false;
    return true;
  });

  const handleCreateTx = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!amount || !description) return;

    try {
      setSubmitting(true);
      const res = await api.createFinancialTransaction({
        type,
        amount: Number(amount),
        date,
        category,
        description,
        method,
        recorded_by_id: currentUser?.id,
        recorded_by_name: `${currentUser?.first_name} ${currentUser?.last_name}`,
        receipt_note: receiptNote || undefined,
      });

      onTransactionCreated(res.transaction, res.summary);
      setModalOpen(false);
      setDescription('');
      setReceiptNote('');
    } catch (err: any) {
      alert(err.message || 'Errore nella registrazione della transazione.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* HEADER */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold text-white tracking-tight">Finanze & Cassa</h1>
          <p className="text-xs text-slate-400">
            Libro mastro trasparente per la gestione del conto bancario e del fondo cassa contanti.
          </p>
        </div>

        <button
          onClick={() => setModalOpen(true)}
          className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold text-xs transition-colors self-start sm:self-auto"
        >
          <Plus className="w-4 h-4" />
          <span>+ Registra Movimento</span>
        </button>
      </div>

      {/* SUMMARY STATS TILES */}
      {summary && (
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          {/* TOTAL */}
          <div className="p-5 rounded-2xl bg-slate-900 border border-slate-800 shadow-md flex flex-col justify-between">
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider">
                Totale Disponibile
              </span>
              <Wallet className="w-4 h-4 text-amber-400" />
            </div>
            <div className="text-2xl sm:text-3xl font-bold font-mono tabular-nums text-white my-2">
              €{summary.total_balance.toLocaleString('it-IT')}
            </div>
            <div className="text-[11px] text-slate-400 flex items-center justify-between pt-2 border-t border-slate-800/80">
              <span>Banca + Cassa</span>
              <span className="text-emerald-400 font-mono">Aggiornato in tempo reale</span>
            </div>
          </div>

          {/* BANCA */}
          <div className="p-5 rounded-2xl bg-slate-900 border border-slate-800 shadow-md flex flex-col justify-between">
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider">
                Conto Bancario
              </span>
              <Building2 className="w-4 h-4 text-sky-400" />
            </div>
            <div className="text-2xl sm:text-3xl font-bold font-mono tabular-nums text-sky-400 my-2">
              €{summary.bank_balance.toLocaleString('it-IT')}
            </div>
            <div className="text-[11px] text-slate-400 flex items-center justify-between pt-2 border-t border-slate-800/80">
              <span>Bonifici e quote</span>
              <span className="font-mono text-slate-300">IBAN condiviso soci</span>
            </div>
          </div>

          {/* CASSA */}
          <div className="p-5 rounded-2xl bg-slate-900 border border-slate-800 shadow-md flex flex-col justify-between">
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider">
                Fondo Cassa Contanti
              </span>
              <Coins className="w-4 h-4 text-emerald-400" />
            </div>
            <div className="text-2xl sm:text-3xl font-bold font-mono tabular-nums text-emerald-400 my-2">
              €{summary.cash_balance.toLocaleString('it-IT')}
            </div>
            <div className="text-[11px] text-slate-400 flex items-center justify-between pt-2 border-t border-slate-800/80">
              <span>Cassaforte del covo</span>
              <span className="font-mono text-slate-300">Spese ordinarie</span>
            </div>
          </div>
        </div>
      )}

      {/* MONTHLY SUMMARY METRICS */}
      {summary && (
        <div className="grid grid-cols-2 gap-4">
          <div className="p-4 rounded-xl bg-emerald-950/20 border border-emerald-500/20 flex items-center justify-between">
            <div>
              <span className="text-xs text-emerald-300">Entrate Mese Corrente</span>
              <div className="text-xl font-bold font-mono text-emerald-400 mt-0.5">
                +€{summary.monthly_income.toLocaleString('it-IT')}
              </div>
            </div>
            <ArrowUpRight className="w-6 h-6 text-emerald-400" />
          </div>

          <div className="p-4 rounded-xl bg-red-950/20 border border-red-500/20 flex items-center justify-between">
            <div>
              <span className="text-xs text-red-300">Uscite Mese Corrente</span>
              <div className="text-xl font-bold font-mono text-red-400 mt-0.5">
                -€{summary.monthly_expense.toLocaleString('it-IT')}
              </div>
            </div>
            <ArrowDownRight className="w-6 h-6 text-red-400" />
          </div>
        </div>
      )}

      {/* TRANSACTIONS TABLE SECTION */}
      <div className="p-6 rounded-2xl bg-slate-900 border border-slate-800 shadow-lg space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-3 border-b border-slate-800">
          <h3 className="text-base font-bold text-white">Registro Movimenti Finanziari</h3>

          {/* Table Filters */}
          <div className="flex flex-wrap items-center gap-2 text-xs">
            <select
              value={filterType}
              onChange={(e) => setFilterType(e.target.value)}
              className="bg-slate-800 border border-slate-700 rounded-lg p-1.5 text-slate-200"
            >
              <option value="all">Tutti i tipi</option>
              <option value="income">Solo Entrate (+)</option>
              <option value="expense">Solo Uscite (-)</option>
            </select>

            <select
              value={filterMethod}
              onChange={(e) => setFilterMethod(e.target.value)}
              className="bg-slate-800 border border-slate-700 rounded-lg p-1.5 text-slate-200"
            >
              <option value="all">Tutti i metodi</option>
              <option value="bank">Conto Bancario</option>
              <option value="cash">Fondo Cassa</option>
            </select>

            <select
              value={filterCategory}
              onChange={(e) => setFilterCategory(e.target.value)}
              className="bg-slate-800 border border-slate-700 rounded-lg p-1.5 text-slate-200"
            >
              <option value="all">Tutte le categorie</option>
              {categories.map(c => (
                <option key={c} value={c}>{c}</option>
              ))}
            </select>
          </div>
        </div>

        {/* Responsive Table */}
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="text-[11px] text-slate-400 uppercase tracking-wider border-b border-slate-800 bg-slate-950/40">
              <tr>
                <th className="py-2.5 px-3">Data</th>
                <th className="py-2.5 px-3">Descrizione</th>
                <th className="py-2.5 px-3">Categoria</th>
                <th className="py-2.5 px-3">Metodo</th>
                <th className="py-2.5 px-3">Registrato da</th>
                <th className="py-2.5 px-3 text-right">Importo</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60 font-medium">
              {filteredTransactions.length === 0 ? (
                <tr>
                  <td colSpan={6} className="py-6 text-center text-slate-500">
                    Nessun movimento trovato per i filtri selezionati.
                  </td>
                </tr>
              ) : (
                filteredTransactions.map((tx) => (
                  <tr key={tx.id} className="hover:bg-slate-800/30 transition-colors">
                    <td className="py-3 px-3 font-mono text-slate-400 whitespace-nowrap">
                      {tx.date}
                    </td>
                    <td className="py-3 px-3">
                      <div className="text-white font-semibold">{tx.description}</div>
                      {tx.receipt_note && (
                        <div className="text-[10px] text-slate-400 italic">
                          Ricevuta: {tx.receipt_note}
                        </div>
                      )}
                    </td>
                    <td className="py-3 px-3 text-slate-300">
                      {tx.category}
                    </td>
                    <td className="py-3 px-3">
                      <span className={`px-2 py-0.5 rounded text-[10px] font-semibold ${
                        tx.method === 'bank'
                          ? 'bg-sky-500/15 text-sky-300 border border-sky-500/20'
                          : 'bg-emerald-500/15 text-emerald-300 border border-emerald-500/20'
                      }`}>
                        {tx.method === 'bank' ? 'Banca' : 'Cassa'}
                      </span>
                    </td>
                    <td className="py-3 px-3 text-slate-400 whitespace-nowrap">
                      {tx.recorded_by_name}
                    </td>
                    <td className="py-3 px-3 text-right font-mono font-bold text-sm whitespace-nowrap">
                      <span className={tx.type === 'income' ? 'text-emerald-400' : 'text-red-400'}>
                        {tx.type === 'income' ? '+' : '-'}€{tx.amount.toLocaleString('it-IT')}
                      </span>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* CREATE TRANSACTION MODAL */}
      {modalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
          <div className="w-full max-w-md bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-2xl space-y-4 text-xs">
            <div className="flex items-center justify-between pb-3 border-b border-slate-800">
              <h3 className="text-base font-bold text-white">Registra Movimento Finanziario</h3>
              <button onClick={() => setModalOpen(false)} className="p-1 text-slate-400 hover:text-white">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleCreateTx} className="space-y-4">
              {/* Type Switcher */}
              <div className="grid grid-cols-2 gap-2 p-1 bg-slate-950 rounded-xl border border-slate-800">
                <button
                  type="button"
                  onClick={() => setType('expense')}
                  className={`py-2 rounded-lg font-bold transition-colors ${
                    type === 'expense'
                      ? 'bg-red-500 text-white shadow-sm'
                      : 'text-slate-400 hover:text-white'
                  }`}
                >
                  Uscita / Spesa (-)
                </button>
                <button
                  type="button"
                  onClick={() => setType('income')}
                  className={`py-2 rounded-lg font-bold transition-colors ${
                    type === 'income'
                      ? 'bg-emerald-500 text-slate-950 shadow-sm'
                      : 'text-slate-400 hover:text-white'
                  }`}
                >
                  Entrata / Quota (+)
                </button>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-300 font-medium mb-1">Importo (€) *</label>
                  <input
                    type="number"
                    step="0.01"
                    min="0.01"
                    required
                    value={amount}
                    onChange={(e) => setAmount(Number(e.target.value))}
                    className="w-full bg-slate-800 border border-slate-700 rounded-lg p-2.5 text-white focus:outline-none focus:border-amber-500 font-mono text-sm font-bold"
                  />
                </div>
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
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-300 font-medium mb-1">Metodo *</label>
                  <select
                    value={method}
                    onChange={(e) => setMethod(e.target.value as TransactionMethod)}
                    className="w-full bg-slate-800 border border-slate-700 rounded-lg p-2.5 text-white focus:outline-none focus:border-amber-500"
                  >
                    <option value="cash">Fondo Cassa (Contanti)</option>
                    <option value="bank">Conto Bancario (Bonifico/POS)</option>
                  </select>
                </div>
                <div>
                  <label className="block text-slate-300 font-medium mb-1">Categoria *</label>
                  <select
                    value={category}
                    onChange={(e) => setCategory(e.target.value as TransactionCategory)}
                    className="w-full bg-slate-800 border border-slate-700 rounded-lg p-2.5 text-white focus:outline-none focus:border-amber-500"
                  >
                    {categories.map(c => (
                      <option key={c} value={c}>{c}</option>
                    ))}
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-slate-300 font-medium mb-1">Descrizione *</label>
                <input
                  type="text"
                  required
                  placeholder="Es. Ricarica detersivi, Bolletta luce, Quota pizza..."
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  className="w-full bg-slate-800 border border-slate-700 rounded-lg p-2.5 text-white focus:outline-none focus:border-amber-500"
                />
              </div>

              <div>
                <label className="block text-slate-300 font-medium mb-1">Nota Scontrino / Ricevuta</label>
                <input
                  type="text"
                  placeholder="Es. Scontrino Leroy Merlin #4928"
                  value={receiptNote}
                  onChange={(e) => setReceiptNote(e.target.value)}
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
                  {submitting ? 'Salvataggio...' : 'Registra nel Registro'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
