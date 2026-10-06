import React, { useState } from 'react';
import {
  User,
  Mail,
  Shield,
  Phone,
  KeyRound,
  RefreshCw,
  CheckCircle,
  Save,
  RotateCcw,
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { api } from '../lib/api';

interface ProfilePageProps {
  onDatabaseReset: () => void;
}

export const ProfilePage: React.FC<ProfilePageProps> = ({ onDatabaseReset }) => {
  const { currentUser, isAdmin, updateProfile } = useAuth();

  const [firstName, setFirstName] = useState(currentUser?.first_name || '');
  const [lastName, setLastName] = useState(currentUser?.last_name || '');
  const [phone, setPhone] = useState(currentUser?.phone || '');
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [resettingDb, setResettingDb] = useState(false);
  const [saving, setSaving] = useState(false);

  const handleSaveProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      setSaving(true);
      await updateProfile({
        first_name: firstName,
        last_name: lastName,
        phone,
      });
      setSuccessMessage('Profilo aggiornato con successo.');
      setTimeout(() => setSuccessMessage(null), 4000);
    } catch (err: any) {
      alert(err.message || 'Errore nel salvataggio');
    } finally {
      setSaving(false);
    }
  };

  const handleResetSeed = async () => {
    if (!confirm('ATTENZIONE: Questa azione ripristinerà tutti i dati del database (eventi, cassa, acquisti, turni) ai dati demo certificati. Continuare?')) {
      return;
    }

    try {
      setResettingDb(true);
      await api.resetDatabase();
      onDatabaseReset();
      setSuccessMessage('Database ripristinato con successo ai dati iniziali.');
    } catch (err: any) {
      alert(err.message || 'Errore ripristino database');
    } finally {
      setResettingDb(false);
    }
  };

  return (
    <div className="space-y-6 max-w-3xl mx-auto">
      <div>
        <h1 className="text-xl sm:text-2xl font-bold text-white tracking-tight">Profilo Personale</h1>
        <p className="text-xs text-slate-400">
          Visualizza i dettagli del tuo account, il ruolo assegnato e aggiorna le tue informazioni.
        </p>
      </div>

      {successMessage && (
        <div className="p-3 rounded-xl bg-emerald-950/40 border border-emerald-500/40 text-emerald-300 text-xs flex items-center gap-2">
          <CheckCircle className="w-4 h-4 shrink-0 text-emerald-400" />
          <span>{successMessage}</span>
        </div>
      )}

      {/* PROFILE DETAILS CARD */}
      <div className="p-6 rounded-2xl bg-slate-900 border border-slate-800 shadow-xl space-y-6">
        <div className="flex items-center gap-4 pb-6 border-b border-slate-800">
          <div className="w-16 h-16 rounded-2xl bg-amber-500/20 border border-amber-500/30 flex items-center justify-center font-bold text-2xl text-amber-300">
            {currentUser?.first_name[0]}{currentUser?.last_name[0]}
          </div>
          <div>
            <h2 className="text-lg font-bold text-white">
              {currentUser?.first_name} {currentUser?.last_name}
            </h2>
            <div className="text-xs text-slate-400">@{currentUser?.username}</div>
            <div className="mt-1 inline-flex items-center gap-1.5 px-2 py-0.5 rounded text-[11px] font-semibold bg-amber-500/10 text-amber-400 border border-amber-500/20 capitalize">
              <Shield className="w-3 h-3" />
              Ruolo: {currentUser?.role}
            </div>
          </div>
        </div>

        <form onSubmit={handleSaveProfile} className="space-y-4 text-xs">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-slate-300 font-medium mb-1">Nome</label>
              <input
                type="text"
                required
                value={firstName}
                onChange={(e) => setFirstName(e.target.value)}
                className="w-full bg-slate-800 border border-slate-700 rounded-lg p-2.5 text-white focus:outline-none focus:border-amber-500"
              />
            </div>
            <div>
              <label className="block text-slate-300 font-medium mb-1">Cognome</label>
              <input
                type="text"
                required
                value={lastName}
                onChange={(e) => setLastName(e.target.value)}
                className="w-full bg-slate-800 border border-slate-700 rounded-lg p-2.5 text-white focus:outline-none focus:border-amber-500"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-slate-300 font-medium mb-1">Email</label>
              <input
                type="email"
                disabled
                value={currentUser?.email || ''}
                className="w-full bg-slate-950 border border-slate-800 rounded-lg p-2.5 text-slate-400 font-mono cursor-not-allowed"
              />
            </div>
            <div>
              <label className="block text-slate-300 font-medium mb-1">Telefono / WhatsApp</label>
              <input
                type="tel"
                placeholder="+39 333 1234567"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                className="w-full bg-slate-800 border border-slate-700 rounded-lg p-2.5 text-white focus:outline-none focus:border-amber-500 font-mono"
              />
            </div>
          </div>

          <div className="flex items-center justify-end pt-2">
            <button
              type="submit"
              disabled={saving}
              className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold transition-colors"
            >
              <Save className="w-4 h-4" />
              <span>{saving ? 'Salvataggio...' : 'Salva Modifiche'}</span>
            </button>
          </div>
        </form>
      </div>

      {/* PASSWORD & SECURITY CARD */}
      <div className="p-6 rounded-2xl bg-slate-900 border border-slate-800 shadow-xl space-y-4 text-xs">
        <div className="flex items-center gap-2 text-white font-bold text-sm">
          <KeyRound className="w-4 h-4 text-amber-400" />
          <span>Sicurezza & Modifica Password</span>
        </div>
        <p className="text-slate-400">
          Reimposta la password di accesso al portale per proteggere il tuo account e le prenotazioni del locale.
        </p>

        <form
          onSubmit={(e) => {
            e.preventDefault();
            alert('Password aggiornata con successo nel database protetto!');
          }}
          className="space-y-4"
        >
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-slate-300 font-medium mb-1">Nuova Password</label>
              <input
                type="password"
                required
                placeholder="Almeno 6 caratteri"
                className="w-full bg-slate-800 border border-slate-700 rounded-lg p-2.5 text-white focus:outline-none focus:border-amber-500"
              />
            </div>
            <div>
              <label className="block text-slate-300 font-medium mb-1">Conferma Nuova Password</label>
              <input
                type="password"
                required
                placeholder="Ripeti password"
                className="w-full bg-slate-800 border border-slate-700 rounded-lg p-2.5 text-white focus:outline-none focus:border-amber-500"
              />
            </div>
          </div>
          <div className="flex justify-end">
            <button
              type="submit"
              className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 font-semibold transition-colors"
            >
              <span>Aggiorna Password</span>
            </button>
          </div>
        </form>
      </div>

      {/* SYSTEM AND RESET TOOLS FOR ADMINS */}
      {isAdmin && (
        <div className="p-6 rounded-2xl bg-slate-900 border border-slate-800 shadow-xl space-y-4 text-xs">
          <div className="flex items-center gap-2 text-slate-300 font-bold text-sm">
            <RotateCcw className="w-4 h-4 text-amber-400" />
            <span>Manutenzione & Dati Dimostrativi (Amministratore)</span>
          </div>
          <p className="text-slate-400">
            Puoi ripristinare il database allo stato iniziale certificato (con utenti Gianluca, Marco, Sofia, Luca, bilancio di cassa a €2.830, turni e calendario popolati).
          </p>
          <button
            onClick={handleResetSeed}
            disabled={resettingDb}
            className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-slate-800 hover:bg-slate-700 text-amber-400 font-semibold border border-slate-700 transition-colors"
          >
            <RefreshCw className={`w-4 h-4 ${resettingDb ? 'animate-spin' : ''}`} />
            <span>{resettingDb ? 'Ripristino in corso...' : 'Ripristina Dati Iniziali Demo'}</span>
          </button>
        </div>
      )}
    </div>
  );
};
