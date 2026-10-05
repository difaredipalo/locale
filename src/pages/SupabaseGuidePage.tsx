import React, { useState } from 'react';
import {
  Database,
  Check,
  Copy,
  Terminal,
  Key,
  ShieldCheck,
  Server,
  CloudUpload,
  HardDriveDownload,
  BookOpen,
} from 'lucide-react';
import { isSupabaseConfigured } from '../lib/supabase';

export const SupabaseGuidePage: React.FC = () => {
  const [copiedSection, setCopiedSection] = useState<string | null>(null);

  const copyToClipboard = (text: string, sectionId: string) => {
    navigator.clipboard.writeText(text);
    setCopiedSection(sectionId);
    setTimeout(() => setCopiedSection(null), 3000);
  };

  const envSnippet = `# Variabili d'ambiente per connettere Supabase (facoltativo se usi il backend Express integrato)
VITE_SUPABASE_URL="https://tuo-progetto.supabase.co"
VITE_SUPABASE_ANON_KEY="eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
`;

  const sqlQuickSnippet = `-- Esegui lo script completo presente nel file /supabase_schema.sql
-- Contiene tutte le 12 tabelle relazionali, tipi ENUM, vincoli e Row Level Security (RLS).
SELECT 'Consulta il file /supabase_schema.sql nella root del progetto' AS messaggio;`;

  return (
    <div className="space-y-6 max-w-4xl mx-auto">
      {/* HEADER */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold text-white tracking-tight">
            Guida Operativa Configurazione Supabase & Database
          </h1>
          <p className="text-xs text-slate-400">
            Guida passo-passo pensata per chi non è un programmatore esperto: 10 passi per configurare, avviare e fare backup del database PostgreSQL.
          </p>
        </div>

        <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-lg border text-xs font-semibold bg-slate-900 border-slate-800 self-start sm:self-auto">
          <Database className="w-4 h-4 text-amber-400" />
          <span>Stato: </span>
          <span className={isSupabaseConfigured ? 'text-emerald-400' : 'text-amber-300'}>
            {isSupabaseConfigured ? 'Supabase Connesso' : 'Database Locale Express Attivo (100% Persistente)'}
          </span>
        </div>
      </div>

      {/* 10 STEPS ACCORDION / CARDS */}
      <div className="space-y-4 text-xs">
        {/* PASSO 1 */}
        <div className="p-5 rounded-2xl bg-slate-900 border border-slate-800 space-y-2">
          <div className="flex items-center gap-2.5 font-bold text-sm text-amber-400">
            <span className="w-6 h-6 rounded-full bg-amber-500/20 flex items-center justify-center text-xs font-mono">1</span>
            <h3>Come creare il progetto su Supabase</h3>
          </div>
          <p className="text-slate-300 leading-relaxed">
            1. Vai sul sito ufficiale <strong>https://supabase.com</strong> e clicca su <em>"Start your project"</em> (puoi accedere gratuitamente con GitHub o Google).<br />
            2. Clicca sul pulsante verde <strong>"New project"</strong>.<br />
            3. Assegna un nome al progetto (es. <code>il-covo-gestionale</code>), imposta una <strong>Password del Database</strong> sicura (segnala da parte) e seleziona la regione più vicina (es. <code>West Europe (Frankfurt)</code>).<br />
            4. Clicca su <strong>"Create new project"</strong> e attendi circa 1-2 minuti che il database PostgreSQL venga preparato.
          </p>
        </div>

        {/* PASSO 2 & 3 */}
        <div className="p-5 rounded-2xl bg-slate-900 border border-slate-800 space-y-3">
          <div className="flex items-center gap-2.5 font-bold text-sm text-amber-400">
            <span className="w-6 h-6 rounded-full bg-amber-500/20 flex items-center justify-center text-xs font-mono">2 & 3</span>
            <h3>Creazione del Database e SQL da eseguire</h3>
          </div>
          <p className="text-slate-300 leading-relaxed">
            Nella dashboard di Supabase, clicca nel menu laterale a sinistra su <strong>SQL Editor</strong> (icona terminale con cursore). Clicca su <strong>"New query"</strong> e incolla tutto il codice contenuto nel file <code>/supabase_schema.sql</code> fornito in questo progetto, quindi premi <strong>"RUN"</strong>.
          </p>
          <div className="relative p-3 bg-slate-950 rounded-xl border border-slate-800 font-mono text-[11px] text-slate-300 overflow-x-auto">
            <button
              onClick={() => copyToClipboard(sqlQuickSnippet, 'sql')}
              className="absolute right-2 top-2 p-1.5 rounded bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white"
              title="Copia"
            >
              {copiedSection === 'sql' ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
            </button>
            <pre>{sqlQuickSnippet}</pre>
          </div>
          <p className="text-slate-400 text-[11px]">
            Lo script crea automaticamente: tabelle <code>profiles</code>, <code>events</code>, <code>venue_requests</code>, <code>cleaning_shifts</code>, <code>polls</code>, <code>regulations</code>, <code>purchases</code>, <code>goals</code>, <code>financial_transactions</code>, <code>audit_logs</code> e abilita le Row Level Security (RLS) con ruoli Amministratore, Gestore e Utente.
          </p>
        </div>

        {/* PASSO 4 */}
        <div className="p-5 rounded-2xl bg-slate-900 border border-slate-800 space-y-2">
          <div className="flex items-center gap-2.5 font-bold text-sm text-amber-400">
            <span className="w-6 h-6 rounded-full bg-amber-500/20 flex items-center justify-center text-xs font-mono">4</span>
            <h3>Come configurare l'Autenticazione (Auth)</h3>
          </div>
          <p className="text-slate-300 leading-relaxed">
            1. Nel menu laterale di Supabase clicca su <strong>Authentication</strong> &gt; <strong>Providers</strong>.<br />
            2. Assicurati che il provider <strong>Email</strong> sia abilitato.<br />
            3. In <em>Authentication &gt; Email Templates</em> puoi personalizzare il testo dell'email di benvenuto e di recupero password in italiano.<br />
            4. Se desideri permettere registrazioni immediate senza attendere la conferma email, puoi disattivare la spunta <em>"Confirm email"</em> in <em>Authentication &gt; URL Configuration &gt; Email Auth</em>.
          </p>
        </div>

        {/* PASSO 5 & 6 */}
        <div className="p-5 rounded-2xl bg-slate-900 border border-slate-800 space-y-3">
          <div className="flex items-center gap-2.5 font-bold text-sm text-amber-400">
            <span className="w-6 h-6 rounded-full bg-amber-500/20 flex items-center justify-center text-xs font-mono">5 & 6</span>
            <h3>Variabili d'ambiente e collegamento al Frontend</h3>
          </div>
          <p className="text-slate-300 leading-relaxed">
            Su Supabase, vai in <strong>Project Settings</strong> (icona ingranaggio) &gt; <strong>API</strong>. Copia <strong>Project URL</strong> e <strong>anon / public key</strong>, quindi inseriscile nel file <code>.env</code>:
          </p>
          <div className="relative p-3 bg-slate-950 rounded-xl border border-slate-800 font-mono text-[11px] text-emerald-400 overflow-x-auto">
            <button
              onClick={() => copyToClipboard(envSnippet, 'env')}
              className="absolute right-2 top-2 p-1.5 rounded bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white"
              title="Copia"
            >
              {copiedSection === 'env' ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
            </button>
            <pre>{envSnippet}</pre>
          </div>
        </div>

        {/* PASSO 7 */}
        <div className="p-5 rounded-2xl bg-slate-900 border border-slate-800 space-y-2">
          <div className="flex items-center gap-2.5 font-bold text-sm text-amber-400">
            <span className="w-6 h-6 rounded-full bg-amber-500/20 flex items-center justify-center text-xs font-mono">7</span>
            <h3>Come creare il primo Amministratore</h3>
          </div>
          <p className="text-slate-300 leading-relaxed">
            Nel nostro backend il primo utente o chi si registra con l'email <code>gianlubusdeez@gmail.com</code> viene nominato automaticamente <strong>Amministratore</strong>.<br />
            Se invece usi Supabase direttamente, dopo che ti sei registrato dall'app, entra nel <strong>Table Editor</strong> di Supabase &gt; tabella <code>profiles</code>, trova la riga con la tua email e modifica il campo <code>role</code> impostandolo da <code>user</code> a <code>admin</code>. Salva la modifica.
          </p>
        </div>

        {/* PASSO 8 */}
        <div className="p-5 rounded-2xl bg-slate-900 border border-slate-800 space-y-2">
          <div className="flex items-center gap-2.5 font-bold text-sm text-amber-400">
            <span className="w-6 h-6 rounded-full bg-amber-500/20 flex items-center justify-center text-xs font-mono">8</span>
            <h3>Come avviare il progetto in locale</h3>
          </div>
          <p className="text-slate-300 leading-relaxed">
            Apri il terminale nella cartella del progetto ed esegui i seguenti comandi:
          </p>
          <div className="p-2.5 bg-slate-950 rounded-lg border border-slate-800 font-mono text-[11px] text-slate-200">
            npm install<br />
            npm run dev
          </div>
          <p className="text-slate-400 text-[11px]">
            L'applicazione si aprirà su <code>http://localhost:3000</code> con il backend Express e il frontend Vite perfettamente sincronizzati.
          </p>
        </div>

        {/* PASSO 9 */}
        <div className="p-5 rounded-2xl bg-slate-900 border border-slate-800 space-y-2">
          <div className="flex items-center gap-2.5 font-bold text-sm text-amber-400">
            <span className="w-6 h-6 rounded-full bg-amber-500/20 flex items-center justify-center text-xs font-mono">9</span>
            <h3>Come effettuare il Deploy in produzione</h3>
          </div>
          <p className="text-slate-300 leading-relaxed">
            Puoi effettuare il deploy in un clic su piattaforme come <strong>Render</strong>, <strong>Railway</strong>, <strong>Fly.io</strong> o <strong>Cloud Run</strong>:<br />
            1. Collega il tuo repository GitHub.<br />
            2. Build Command: <code>npm run build</code><br />
            3. Start Command: <code>npm start</code> (che avvia <code>server.ts</code> servendo API e frontend su porta 3000).<br />
            4. Imposta le variabili d'ambiente nel pannello di configurazione dell'host.
          </p>
        </div>

        {/* PASSO 10 */}
        <div className="p-5 rounded-2xl bg-slate-900 border border-slate-800 space-y-2">
          <div className="flex items-center gap-2.5 font-bold text-sm text-amber-400">
            <span className="w-6 h-6 rounded-full bg-amber-500/20 flex items-center justify-center text-xs font-mono">10</span>
            <h3>Come fare il Backup del Database</h3>
          </div>
          <p className="text-slate-300 leading-relaxed">
            - <strong>Su Supabase</strong>: I backup automatici giornalieri sono inclusi. Puoi eseguire un dump manuale in ogni momento andando in <em>Database &gt; Backups</em> oppure eseguendo via CLI: <code>supabase db dump -f backup_covo.sql</code>.<br />
            - <strong>Nel backend Express</strong>: I dati persistono sul file <code>/data/covo_db.json</code>. È sufficiente copiare quel file per avere un'istantanea completa e sicura di tutti gli utenti, saldi e registri.
          </p>
        </div>
      </div>
    </div>
  );
};
