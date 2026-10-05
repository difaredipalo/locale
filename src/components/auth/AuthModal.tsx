import React, { useState } from 'react';
import {
  Lock,
  Mail,
  User,
  KeyRound,
  Shield,
  ArrowRight,
  Sparkles,
  CheckCircle,
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import clubEmblem from '../../assets/images/covo_club_emblem_1791184967951.jpg';
import { api } from '../../lib/api';

export const AuthModal: React.FC = () => {
  const { login, register } = useAuth();
  const [tab, setTab] = useState<'login' | 'register' | 'forgot'>('login');

  // Form states
  const [emailOrUsername, setEmailOrUsername] = useState('gianluca');
  const [password, setPassword] = useState('password123');

  // Register states
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [regUsername, setRegUsername] = useState('');
  const [regEmail, setRegEmail] = useState('');
  const [regPassword, setRegPassword] = useState('');

  // Forgot password
  const [forgotEmail, setForgotEmail] = useState('');
  const [forgotSuccess, setForgotSuccess] = useState<string | null>(null);

  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    try {
      setLoading(true);
      await login(emailOrUsername);
    } catch (err: any) {
      setError(err.message || 'Errore durante l accesso.');
    } finally {
      setLoading(false);
    }
  };

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    if (!firstName || !lastName || !regUsername || !regEmail) {
      setError('Tutti i campi sono obbligatori.');
      return;
    }
    try {
      setLoading(true);
      await register({
        first_name: firstName,
        last_name: lastName,
        username: regUsername,
        email: regEmail,
      });
    } catch (err: any) {
      setError(err.message || 'Errore durante la registrazione.');
    } finally {
      setLoading(false);
    }
  };

  const handleForgot = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    try {
      setLoading(true);
      const res = await api.resetPassword(forgotEmail);
      setForgotSuccess(res.message);
    } catch (err: any) {
      setError(err.message || 'Errore durante la richiesta di recupero.');
    } finally {
      setLoading(false);
    }
  };

  const quickLoginAs = async (identifier: string) => {
    setError(null);
    try {
      setLoading(true);
      await login(identifier);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/90 backdrop-blur-md">
      <div className="w-full max-w-md bg-slate-900 border border-slate-800 rounded-3xl p-6 sm:p-8 shadow-2xl space-y-6">
        {/* BRAND & HEADER */}
        <div className="flex flex-col items-center text-center space-y-2">
          <img
            src={clubEmblem}
            alt="Il Covo Emblem"
            className="w-14 h-14 rounded-2xl object-cover ring-2 ring-amber-500/40 shadow-lg"
          />
          <h1 className="text-2xl font-bold tracking-tight text-white mt-1">Il Covo</h1>
          <p className="text-xs text-slate-400">
            Portale Gestionale Privato per l'Organizzazione del Locale
          </p>
        </div>

        {/* TABS SELECTOR */}
        <div className="grid grid-cols-3 p-1 bg-slate-950 rounded-xl border border-slate-800 text-xs">
          <button
            onClick={() => { setTab('login'); setError(null); }}
            className={`py-2 rounded-lg font-semibold transition-colors ${
              tab === 'login' ? 'bg-amber-500 text-slate-950 shadow-sm' : 'text-slate-400 hover:text-white'
            }`}
          >
            Accedi
          </button>
          <button
            onClick={() => { setTab('register'); setError(null); }}
            className={`py-2 rounded-lg font-semibold transition-colors ${
              tab === 'register' ? 'bg-amber-500 text-slate-950 shadow-sm' : 'text-slate-400 hover:text-white'
            }`}
          >
            Registrati
          </button>
          <button
            onClick={() => { setTab('forgot'); setError(null); }}
            className={`py-2 rounded-lg font-semibold transition-colors ${
              tab === 'forgot' ? 'bg-amber-500 text-slate-950 shadow-sm' : 'text-slate-400 hover:text-white'
            }`}
          >
            Password
          </button>
        </div>

        {error && (
          <div className="p-3 rounded-xl bg-red-950/40 border border-red-500/40 text-red-300 text-xs leading-relaxed">
            {error}
          </div>
        )}

        {forgotSuccess && (
          <div className="p-3 rounded-xl bg-emerald-950/40 border border-emerald-500/40 text-emerald-300 text-xs leading-relaxed flex items-start gap-2">
            <CheckCircle className="w-4 h-4 shrink-0 text-emerald-400 mt-0.5" />
            <span>{forgotSuccess}</span>
          </div>
        )}

        {/* LOGIN FORM */}
        {tab === 'login' && (
          <form onSubmit={handleLogin} className="space-y-4 text-xs">
            <div>
              <label className="block text-slate-300 font-medium mb-1">Username o Email</label>
              <div className="relative">
                <User className="w-4 h-4 absolute left-3 top-2.5 text-slate-500" />
                <input
                  type="text"
                  required
                  placeholder="Es. gianluca o email@esempio.it"
                  value={emailOrUsername}
                  onChange={(e) => setEmailOrUsername(e.target.value)}
                  className="w-full bg-slate-800 border border-slate-700 rounded-lg pl-9 pr-3 py-2 text-white focus:outline-none focus:border-amber-500 font-medium"
                />
              </div>
            </div>

            <div>
              <label className="block text-slate-300 font-medium mb-1">Password</label>
              <div className="relative">
                <Lock className="w-4 h-4 absolute left-3 top-2.5 text-slate-500" />
                <input
                  type="password"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full bg-slate-800 border border-slate-700 rounded-lg pl-9 pr-3 py-2 text-white focus:outline-none focus:border-amber-500"
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full py-2.5 rounded-lg bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold text-xs transition-colors shadow-md flex items-center justify-center gap-1.5"
            >
              <span>{loading ? 'Accesso in corso...' : 'Entra nel Portale'}</span>
              <ArrowRight className="w-4 h-4" />
            </button>

            {/* Quick Demo Logins for Fast Role Evaluation */}
            <div className="pt-3 border-t border-slate-800/80 space-y-2">
              <div className="text-[11px] text-slate-400 text-center font-medium">
                Accesso Rapido Demo Soci:
              </div>
              <div className="grid grid-cols-2 gap-2 text-[11px]">
                <button
                  type="button"
                  onClick={() => quickLoginAs('gianluca')}
                  className="p-2 rounded-lg bg-slate-800/80 hover:bg-slate-700 border border-slate-700 text-amber-300 font-semibold text-left truncate"
                >
                  Gianluca (Admin)
                </button>
                <button
                  type="button"
                  onClick={() => quickLoginAs('marco')}
                  className="p-2 rounded-lg bg-slate-800/80 hover:bg-slate-700 border border-slate-700 text-sky-300 font-semibold text-left truncate"
                >
                  Marco (Gestore)
                </button>
                <button
                  type="button"
                  onClick={() => quickLoginAs('sofia')}
                  className="p-2 rounded-lg bg-slate-800/80 hover:bg-slate-700 border border-slate-700 text-emerald-300 font-semibold text-left truncate"
                >
                  Sofia (Membro)
                </button>
                <button
                  type="button"
                  onClick={() => quickLoginAs('luca')}
                  className="p-2 rounded-lg bg-slate-800/80 hover:bg-slate-700 border border-slate-700 text-slate-300 font-semibold text-left truncate"
                >
                  Luca (Membro)
                </button>
              </div>
            </div>
          </form>
        )}

        {/* REGISTER FORM */}
        {tab === 'register' && (
          <form onSubmit={handleRegister} className="space-y-3.5 text-xs">
            <div className="grid grid-cols-2 gap-2.5">
              <div>
                <label className="block text-slate-300 font-medium mb-1">Nome *</label>
                <input
                  type="text"
                  required
                  placeholder="Mario"
                  value={firstName}
                  onChange={(e) => setFirstName(e.target.value)}
                  className="w-full bg-slate-800 border border-slate-700 rounded-lg p-2 text-white focus:outline-none focus:border-amber-500"
                />
              </div>
              <div>
                <label className="block text-slate-300 font-medium mb-1">Cognome *</label>
                <input
                  type="text"
                  required
                  placeholder="Rossi"
                  value={lastName}
                  onChange={(e) => setLastName(e.target.value)}
                  className="w-full bg-slate-800 border border-slate-700 rounded-lg p-2 text-white focus:outline-none focus:border-amber-500"
                />
              </div>
            </div>

            <div>
              <label className="block text-slate-300 font-medium mb-1">Username *</label>
              <input
                type="text"
                required
                placeholder="mariorossi"
                value={regUsername}
                onChange={(e) => setRegUsername(e.target.value)}
                className="w-full bg-slate-800 border border-slate-700 rounded-lg p-2 text-white focus:outline-none focus:border-amber-500"
              />
            </div>

            <div>
              <label className="block text-slate-300 font-medium mb-1">Email *</label>
              <input
                type="email"
                required
                placeholder="mario@esempio.it"
                value={regEmail}
                onChange={(e) => setRegEmail(e.target.value)}
                className="w-full bg-slate-800 border border-slate-700 rounded-lg p-2 text-white focus:outline-none focus:border-amber-500 font-mono"
              />
            </div>

            <div>
              <label className="block text-slate-300 font-medium mb-1">Password *</label>
              <input
                type="password"
                required
                placeholder="Almeno 6 caratteri"
                value={regPassword}
                onChange={(e) => setRegPassword(e.target.value)}
                className="w-full bg-slate-800 border border-slate-700 rounded-lg p-2 text-white focus:outline-none focus:border-amber-500"
              />
            </div>

            <p className="text-[11px] text-slate-400">
              Il nuovo account verrà creato con ruolo predefinito <strong>Utente / Membro</strong>.
            </p>

            <button
              type="submit"
              disabled={loading}
              className="w-full py-2.5 rounded-lg bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold text-xs transition-colors shadow-md"
            >
              {loading ? 'Registrazione...' : 'Completa Registrazione'}
            </button>
          </form>
        )}

        {/* FORGOT PASSWORD FORM */}
        {tab === 'forgot' && (
          <form onSubmit={handleForgot} className="space-y-4 text-xs">
            <p className="text-slate-300 leading-relaxed">
              Inserisci l'indirizzo email associato al tuo profilo per ricevere le istruzioni di reimpostazione sicura della password.
            </p>

            <div>
              <label className="block text-slate-300 font-medium mb-1">Email</label>
              <div className="relative">
                <Mail className="w-4 h-4 absolute left-3 top-2.5 text-slate-500" />
                <input
                  type="email"
                  required
                  placeholder="latua@email.it"
                  value={forgotEmail}
                  onChange={(e) => setForgotEmail(e.target.value)}
                  className="w-full bg-slate-800 border border-slate-700 rounded-lg pl-9 pr-3 py-2 text-white focus:outline-none focus:border-amber-500 font-mono"
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full py-2.5 rounded-lg bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold text-xs transition-colors shadow-md"
            >
              {loading ? 'Invio in corso...' : 'Invia Istruzioni di Reset'}
            </button>
          </form>
        )}
      </div>
    </div>
  );
};
