import React, { useState } from 'react';
import {
  ShoppingBag,
  Plus,
  ExternalLink,
  Tag,
  DollarSign,
  User,
  Trash2,
  Calendar,
  X,
  CheckCircle,
} from 'lucide-react';
import type { PurchaseItem, PurchaseCategory, PurchasePriority, PurchaseStatus } from '../types/database';
import { useAuth } from '../context/AuthContext';
import { api } from '../lib/api';

interface PurchasesPageProps {
  purchases: PurchaseItem[];
  onPurchaseCreated: (item: PurchaseItem) => void;
  onPurchaseUpdated: (item: PurchaseItem) => void;
  onPurchaseDeleted: (id: string) => void;
}

export const PurchasesPage: React.FC<PurchasesPageProps> = ({
  purchases,
  onPurchaseCreated,
  onPurchaseUpdated,
  onPurchaseDeleted,
}) => {
  const { currentUser, isManager } = useAuth();
  const [modalOpen, setModalOpen] = useState(false);
  const [filterCategory, setFilterCategory] = useState<string>('all');
  const [filterStatus, setFilterStatus] = useState<string>('all');

  // Form states
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [category, setCategory] = useState<PurchaseCategory>('Attrezzature');
  const [estimatedPrice, setEstimatedPrice] = useState<number>(50);
  const [priority, setPriority] = useState<PurchasePriority>('media');
  const [assigneeName, setAssigneeName] = useState('');
  const [externalLink, setExternalLink] = useState('');
  const [targetDate, setTargetDate] = useState('2026-11-15');
  const [notes, setNotes] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const categories: PurchaseCategory[] = [
    'Attrezzature',
    'Arredamento',
    'Elettrodomestici',
    'Svago & Audio',
    'Consumabili',
    'Altro',
  ];

  const statuses: { id: PurchaseStatus; label: string; icon: string }[] = [
    { id: 'proposto', label: 'Proposto', icon: '💡' },
    { id: 'da_valutare', label: 'Da valutare', icon: '🟡' },
    { id: 'da_acquistare', label: 'Da acquistare', icon: '🛒' },
    { id: 'ordinato', label: 'Ordinato', icon: '🔵' },
    { id: 'acquistato', label: 'Acquistato', icon: '🟢' },
    { id: 'annullato', label: 'Annullato', icon: '🔴' },
  ];

  const filtered = purchases.filter((item) => {
    if (filterCategory !== 'all' && item.category !== filterCategory) return false;
    if (filterStatus !== 'all' && item.status !== filterStatus) return false;
    return true;
  });

  const handleStatusChange = async (item: PurchaseItem, newStatus: PurchaseStatus) => {
    try {
      let actualPrice = item.actual_price;
      if (newStatus === 'acquistato' && !actualPrice) {
        const input = prompt(`Inserisci il prezzo effettivo speso per "${item.name}" (stimato €${item.estimated_price}):`, String(item.estimated_price));
        if (input) actualPrice = Number(input);
      }

      const updated = await api.updatePurchaseStatus(
        item.id,
        newStatus,
        actualPrice,
        `${currentUser?.first_name} ${currentUser?.last_name}`
      );
      onPurchaseUpdated(updated);
    } catch (err: any) {
      alert(err.message || 'Errore aggiornamento acquisto.');
    }
  };

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name || estimatedPrice === undefined) return;

    try {
      setSubmitting(true);
      const created = await api.createPurchase({
        name,
        description,
        category,
        estimated_price: Number(estimatedPrice),
        priority,
        status: 'proposto',
        assignee_name: assigneeName || undefined,
        external_link: externalLink || undefined,
        target_date: targetDate || undefined,
        notes: notes || undefined,
        created_by_id: currentUser?.id,
        created_by_name: `${currentUser?.first_name} ${currentUser?.last_name}`,
      });
      onPurchaseCreated(created);
      setModalOpen(false);
      setName('');
      setDescription('');
      setExternalLink('');
      setNotes('');
    } catch (err: any) {
      alert(err.message || 'Errore nella proposta acquisto.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* HEADER */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold text-white tracking-tight">Acquisti & Desideri</h1>
          <p className="text-xs text-slate-400">
            Proposte di acquisto per il locale condiviso: arredi, strumenti, giochi e attrezzature.
          </p>
        </div>

        <button
          onClick={() => setModalOpen(true)}
          className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold text-xs transition-colors self-start sm:self-auto"
        >
          <Plus className="w-4 h-4" />
          <span>+ Proponi Acquisto</span>
        </button>
      </div>

      {/* FILTERS */}
      <div className="flex flex-wrap items-center gap-2 text-xs">
        <select
          value={filterStatus}
          onChange={(e) => setFilterStatus(e.target.value)}
          className="bg-slate-900 border border-slate-800 rounded-lg p-2 text-slate-200"
        >
          <option value="all">Tutti gli stati</option>
          {statuses.map(s => (
            <option key={s.id} value={s.id}>{s.icon} {s.label}</option>
          ))}
        </select>

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
      </div>

      {/* PURCHASES LIST */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {filtered.length === 0 ? (
          <div className="md:col-span-3 p-8 text-center rounded-2xl bg-slate-900 border border-slate-800 text-slate-400 text-xs">
            Nessun acquisto trovato con i filtri correnti.
          </div>
        ) : (
          filtered.map((item) => {
            const currentStatusObj = statuses.find(s => s.id === item.status) || statuses[0];

            return (
              <div
                key={item.id}
                className="p-5 rounded-2xl bg-slate-900 border border-slate-800 shadow-md flex flex-col justify-between space-y-4"
              >
                <div className="space-y-3">
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <span className="text-[11px] text-amber-400 font-semibold">{item.category}</span>
                      <h3 className="text-base font-bold text-white mt-0.5">{item.name}</h3>
                    </div>

                    {/* STATUS SELECTOR (Only Managers/Admins or Proposer) */}
                    {isManager ? (
                      <select
                        value={item.status}
                        onChange={(e) => handleStatusChange(item, e.target.value as PurchaseStatus)}
                        className="bg-slate-800 border border-slate-700 rounded-md text-[11px] py-1 px-1.5 text-slate-200 focus:outline-none"
                      >
                        {statuses.map(s => (
                          <option key={s.id} value={s.id}>{s.icon} {s.label}</option>
                        ))}
                      </select>
                    ) : (
                      <span className="text-xs font-semibold text-slate-300">
                        {currentStatusObj.icon} {currentStatusObj.label}
                      </span>
                    )}
                  </div>

                  {item.description && (
                    <p className="text-xs text-slate-300 line-clamp-2">{item.description}</p>
                  )}

                  <div className="p-3 rounded-xl bg-slate-950/60 border border-slate-800/80 space-y-1.5 text-xs">
                    <div className="flex items-center justify-between">
                      <span className="text-slate-400">Prezzo stimato:</span>
                      <span className="font-bold font-mono text-white">€{item.estimated_price}</span>
                    </div>
                    {item.actual_price && (
                      <div className="flex items-center justify-between text-emerald-400">
                        <span>Prezzo effettivo:</span>
                        <span className="font-bold font-mono">€{item.actual_price}</span>
                      </div>
                    )}
                    <div className="flex items-center justify-between text-slate-400 pt-1 border-t border-slate-800/60 text-[11px]">
                      <span>Priorità:</span>
                      <span className="capitalize font-medium text-slate-200">{item.priority}</span>
                    </div>
                  </div>

                  <div className="space-y-1 text-[11px] text-slate-400">
                    {item.assignee_name && <div>Responsabile: <strong className="text-slate-200">{item.assignee_name}</strong></div>}
                    {item.target_date && <div>Previsto per: <span className="font-mono text-slate-300">{item.target_date}</span></div>}
                    {item.notes && <div className="italic text-slate-500">Note: {item.notes}</div>}
                  </div>
                </div>

                <div className="pt-3 border-t border-slate-800 flex items-center justify-between text-xs">
                  {item.external_link ? (
                    <a
                      href={item.external_link}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-1 text-amber-400 hover:text-amber-300 font-medium"
                    >
                      <ExternalLink className="w-3.5 h-3.5" />
                      <span>Link Prodotto</span>
                    </a>
                  ) : <div />}

                  {isManager && (
                    <button
                      onClick={async () => {
                        if (confirm(`Rimuovere "${item.name}" dalla lista acquisti?`)) {
                          await api.deletePurchase(item.id);
                          onPurchaseDeleted(item.id);
                        }
                      }}
                      className="text-slate-500 hover:text-red-400 p-1"
                      title="Elimina"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  )}
                </div>
              </div>
            );
          })
        )}
      </div>

      {/* PROPOSE MODAL */}
      {modalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
          <div className="w-full max-w-lg bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-2xl space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-slate-800">
              <h3 className="text-base font-bold text-white">Proponi Nuovo Acquisto</h3>
              <button onClick={() => setModalOpen(false)} className="p-1 text-slate-400 hover:text-white">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleCreate} className="space-y-4 text-xs">
              <div>
                <label className="block text-slate-300 font-medium mb-1">Nome Oggetto / Servizio *</label>
                <input
                  type="text"
                  required
                  placeholder="Es. Set bicchieri infrangibili, Proiettore portatile..."
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="w-full bg-slate-800 border border-slate-700 rounded-lg p-2.5 text-white focus:outline-none focus:border-amber-500"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-300 font-medium mb-1">Categoria *</label>
                  <select
                    value={category}
                    onChange={(e) => setCategory(e.target.value as PurchaseCategory)}
                    className="w-full bg-slate-800 border border-slate-700 rounded-lg p-2.5 text-white focus:outline-none focus:border-amber-500"
                  >
                    {categories.map(c => (
                      <option key={c} value={c}>{c}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-slate-300 font-medium mb-1">Prezzo Stimato (€) *</label>
                  <input
                    type="number"
                    required
                    min={1}
                    value={estimatedPrice}
                    onChange={(e) => setEstimatedPrice(Number(e.target.value))}
                    className="w-full bg-slate-800 border border-slate-700 rounded-lg p-2.5 text-white focus:outline-none focus:border-amber-500 font-mono"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-300 font-medium mb-1">Priorità</label>
                  <select
                    value={priority}
                    onChange={(e) => setPriority(e.target.value as PurchasePriority)}
                    className="w-full bg-slate-800 border border-slate-700 rounded-lg p-2.5 text-white focus:outline-none focus:border-amber-500"
                  >
                    <option value="bassa">Bassa</option>
                    <option value="media">Media</option>
                    <option value="alta">Alta</option>
                    <option value="urgente">Urgente</option>
                  </select>
                </div>
                <div>
                  <label className="block text-slate-300 font-medium mb-1">Membro Assegnato / Responsabile</label>
                  <input
                    type="text"
                    placeholder="Es. Marco o Gianluca"
                    value={assigneeName}
                    onChange={(e) => setAssigneeName(e.target.value)}
                    className="w-full bg-slate-800 border border-slate-700 rounded-lg p-2.5 text-white focus:outline-none focus:border-amber-500"
                  />
                </div>
              </div>

              <div>
                <label className="block text-slate-300 font-medium mb-1">Link Prodotto (Amazon, sito web, ecc.)</label>
                <input
                  type="url"
                  placeholder="https://..."
                  value={externalLink}
                  onChange={(e) => setExternalLink(e.target.value)}
                  className="w-full bg-slate-800 border border-slate-700 rounded-lg p-2.5 text-white focus:outline-none focus:border-amber-500"
                />
              </div>

              <div>
                <label className="block text-slate-300 font-medium mb-1">Descrizione & Motivazione</label>
                <textarea
                  rows={2}
                  placeholder="Spiega perché questo acquisto è utile per il gruppo..."
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
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
                  {submitting ? 'Invio...' : 'Proponi Acquisto'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
