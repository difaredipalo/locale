import React, { useState } from 'react';
import {
  BookOpen,
  Edit3,
  History,
  CheckCircle2,
  Calendar,
  User,
  X,
  FileText,
} from 'lucide-react';
import type { RegulationSection, RegulationVersion } from '../types/database';
import { useAuth } from '../context/AuthContext';
import { api } from '../lib/api';

interface RegulationsPageProps {
  sections: RegulationSection[];
  versions: RegulationVersion[];
  onSectionUpdated: (section: RegulationSection, version: RegulationVersion) => void;
}

export const RegulationsPage: React.FC<RegulationsPageProps> = ({
  sections,
  versions,
  onSectionUpdated,
}) => {
  const { currentUser, isAdmin } = useAuth();
  const [activeTab, setActiveTab] = useState<'current' | 'history'>('current');
  const [editModalOpen, setEditModalOpen] = useState(false);
  const [selectedSection, setSelectedSection] = useState<RegulationSection | null>(null);

  // Form states
  const [editTitle, setEditTitle] = useState('');
  const [editContent, setEditContent] = useState('');
  const [changeSummary, setChangeSummary] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const currentVersionNum = versions.length > 0 ? versions[0].version : 1;
  const lastUpdated = versions.length > 0 ? versions[0].created_at : '';
  const lastAuthor = versions.length > 0 ? versions[0].author_name : 'Amministrazione';

  const handleOpenEdit = (sec: RegulationSection) => {
    setSelectedSection(sec);
    setEditTitle(sec.title);
    setEditContent(sec.content);
    setChangeSummary('');
    setEditModalOpen(true);
  };

  const handleSaveSection = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedSection || !editContent.trim()) return;

    try {
      setSubmitting(true);
      const res = await api.updateRegulationSection(selectedSection.id, {
        title: editTitle,
        content: editContent,
        author_name: `${currentUser?.first_name} ${currentUser?.last_name}`,
        change_summary: changeSummary || `Aggiornamento sezione "${editTitle}"`,
      });

      onSectionUpdated(res.section, res.version);
      setEditModalOpen(false);
      setSelectedSection(null);
    } catch (err: any) {
      alert(err.message || 'Errore durante il salvataggio.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* HEADER */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold text-white tracking-tight">
            Regolamento Interno del Covo
          </h1>
          <p className="text-xs text-slate-400">
            Regole e convenzioni condivise per la buona convivenza, la cura dello spazio e la sicurezza.
          </p>
        </div>

        {/* VERSION PILL INFO */}
        <div className="flex items-center gap-3 bg-slate-900 border border-slate-800 p-2 rounded-xl text-xs">
          <div className="flex items-center gap-1.5">
            <span className="text-slate-400">Versione:</span>
            <span className="font-bold text-amber-400 font-mono">v{currentVersionNum}.0</span>
          </div>
          <span className="text-slate-600">·</span>
          <div className="text-[11px] text-slate-400">
            Aggiornato da <strong>{lastAuthor}</strong> {lastUpdated ? `il ${new Date(lastUpdated).toLocaleDateString('it-IT')}` : ''}
          </div>
        </div>
      </div>

      {/* VIEW TABS */}
      <div className="flex items-center gap-2 text-xs">
        <button
          onClick={() => setActiveTab('current')}
          className={`px-3 py-1.5 rounded-lg font-medium transition-colors ${
            activeTab === 'current'
              ? 'bg-slate-800 text-amber-400 border border-slate-700'
              : 'text-slate-400 hover:text-white'
          }`}
        >
          Regolamento Vigente
        </button>
        <button
          onClick={() => setActiveTab('history')}
          className={`px-3 py-1.5 rounded-lg font-medium transition-colors ${
            activeTab === 'history'
              ? 'bg-slate-800 text-amber-400 border border-slate-700'
              : 'text-slate-400 hover:text-white'
          }`}
        >
          Storico Modifiche ({versions.length})
        </button>
      </div>

      {activeTab === 'current' ? (
        /* CURRENT REGULATION ARTICLES */
        <div className="space-y-4">
          {sections.map((sec) => (
            <div
              key={sec.id}
              className="p-6 rounded-2xl bg-slate-900 border border-slate-800 shadow-md space-y-3"
            >
              <div className="flex items-start justify-between gap-4">
                <h3 className="text-base font-bold text-white tracking-tight">
                  {sec.title}
                </h3>
                {isAdmin && (
                  <button
                    onClick={() => handleOpenEdit(sec)}
                    className="inline-flex items-center gap-1.5 px-3 py-1 rounded-lg bg-slate-800 hover:bg-slate-700 text-amber-400 text-xs font-semibold border border-slate-700 transition-colors"
                  >
                    <Edit3 className="w-3.5 h-3.5" />
                    <span>Modifica CMS</span>
                  </button>
                )}
              </div>

              <p className="text-xs sm:text-sm text-slate-300 leading-relaxed whitespace-pre-line">
                {sec.content}
              </p>

              <div className="pt-2 flex items-center justify-between text-[11px] text-slate-500 border-t border-slate-800/60">
                <span>Ultima revisione: {new Date(sec.last_updated_at).toLocaleDateString('it-IT')}</span>
                <span>Modificato da: {sec.last_updated_by_name}</span>
              </div>
            </div>
          ))}
        </div>
      ) : (
        /* VERSION HISTORY */
        <div className="space-y-4">
          {versions.map((ver) => (
            <div
              key={ver.id}
              className="p-6 rounded-2xl bg-slate-900 border border-slate-800 space-y-3"
            >
              <div className="flex items-center justify-between pb-2 border-b border-slate-800">
                <div className="flex items-center gap-2">
                  <span className="px-2 py-0.5 rounded bg-amber-500/20 text-amber-400 font-bold font-mono text-xs">
                    Versione {ver.version}.0
                  </span>
                  <span className="text-slate-400 text-xs">
                    {new Date(ver.created_at).toLocaleDateString('it-IT', { day: 'numeric', month: 'long', year: 'numeric' })}
                  </span>
                </div>
                <span className="text-xs text-slate-300 font-medium">Autore: {ver.author_name}</span>
              </div>

              <div className="text-xs text-slate-300 bg-slate-950/60 p-3 rounded-xl border border-slate-800">
                <strong>Sommario delle modifiche:</strong> {ver.change_summary}
              </div>

              <div className="text-[11px] text-slate-500">
                Include {ver.sections_snapshot?.length || 9} sezioni archiviate in questo snapshot.
              </div>
            </div>
          ))}
        </div>
      )}

      {/* EDIT SECTION MODAL */}
      {editModalOpen && selectedSection && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
          <div className="w-full max-w-xl bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-2xl space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-slate-800">
              <h3 className="text-base font-bold text-white">Modifica Articolo Regolamento (CMS)</h3>
              <button onClick={() => setEditModalOpen(false)} className="p-1 text-slate-400 hover:text-white">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveSection} className="space-y-4 text-xs">
              <div>
                <label className="block text-slate-300 font-medium mb-1">Titolo Sezione *</label>
                <input
                  type="text"
                  required
                  value={editTitle}
                  onChange={(e) => setEditTitle(e.target.value)}
                  className="w-full bg-slate-800 border border-slate-700 rounded-lg p-2.5 text-white focus:outline-none focus:border-amber-500"
                />
              </div>

              <div>
                <label className="block text-slate-300 font-medium mb-1">Testo dell'Articolo *</label>
                <textarea
                  rows={6}
                  required
                  value={editContent}
                  onChange={(e) => setEditContent(e.target.value)}
                  className="w-full bg-slate-800 border border-slate-700 rounded-lg p-3 text-slate-200 focus:outline-none focus:border-amber-500 leading-relaxed font-sans"
                />
              </div>

              <div>
                <label className="block text-slate-300 font-medium mb-1">Motivazione o sommario della modifica *</label>
                <input
                  type="text"
                  required
                  placeholder="Es. Aggiornato orario limite silenzio notturno e chiusura porte"
                  value={changeSummary}
                  onChange={(e) => setChangeSummary(e.target.value)}
                  className="w-full bg-slate-800 border border-slate-700 rounded-lg p-2.5 text-white focus:outline-none focus:border-amber-500"
                />
              </div>

              <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-800">
                <button
                  type="button"
                  onClick={() => setEditModalOpen(false)}
                  className="px-4 py-2 rounded-lg bg-slate-800 text-slate-300 hover:text-white"
                >
                  Annulla
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="px-4 py-2 rounded-lg bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold"
                >
                  {submitting ? 'Salvataggio...' : 'Salva e Genera Nuova Versione'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
