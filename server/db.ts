import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import type {
  DatabaseState,
  UserProfile,
  CalendarEvent,
  VenueRequest,
  CleaningShift,
  NotificationItem,
  Poll,
  RegulationSection,
  RegulationVersion,
  PurchaseItem,
  FinancialGoal,
  FinancialTransaction,
  FinancialSummary,
  PresidentialElection,
  MultiChannelNotification,
  NotificationDelivery,
  UserNotificationPreference,
  PushSubscriptionRecord,
  TelegramConnection,
  WhatsAppConnection,
  NotificationChannelConfig,
  UserPresence,
  AuditLog,
} from '../src/types/database';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const DATA_DIR = path.resolve(__dirname, '../data');
const DB_FILE = path.join(DATA_DIR, 'covo_db.json');

// Ensure data folder exists
if (!fs.existsSync(DATA_DIR)) {
  fs.mkdirSync(DATA_DIR, { recursive: true });
}

export function getInitialDatabase(): DatabaseState {
  const users: UserProfile[] = [
    {
      id: 'usr_gianluca',
      email: 'gianlubusdeez@gmail.com',
      username: 'gianluca',
      first_name: 'Gianluca',
      last_name: 'Busdeez',
      role: 'admin',
      is_active: true,
      created_at: '2026-09-01T10:00:00.000Z',
      last_login_at: '2026-10-05T08:15:00.000Z',
    },
    {
      id: 'usr_marco',
      email: 'marco.rossi@covo.local',
      username: 'marco',
      first_name: 'Marco',
      last_name: 'Rossi',
      role: 'manager',
      is_active: true,
      created_at: '2026-09-02T14:30:00.000Z',
      last_login_at: '2026-10-04T19:20:00.000Z',
    },
    {
      id: 'usr_sofia',
      email: 'sofia.bianchi@covo.local',
      username: 'sofia',
      first_name: 'Sofia',
      last_name: 'Bianchi',
      role: 'user',
      is_active: true,
      created_at: '2026-09-05T11:00:00.000Z',
      last_login_at: '2026-10-03T16:45:00.000Z',
    },
    {
      id: 'usr_luca',
      email: 'luca.verdi@covo.local',
      username: 'luca',
      first_name: 'Luca',
      last_name: 'Verdi',
      role: 'user',
      is_active: true,
      created_at: '2026-09-08T09:15:00.000Z',
      last_login_at: '2026-10-02T21:10:00.000Z',
    },
  ];

  const notifications: NotificationItem[] = [
    {
      id: 'notif_1',
      title: 'Assemblea e pianificazione mensile',
      content: 'Domenica prossima alle 18:30 faremo una breve riunione per approvare i nuovi acquisti e verificare i turni del mese.',
      category: 'Importante',
      priority: 'alta',
      is_pinned: true,
      is_archived: false,
      created_by_id: 'usr_gianluca',
      created_by_name: 'Gianluca',
      created_at: '2026-10-04T12:00:00.000Z',
      read_by: ['usr_gianluca', 'usr_marco'],
    },
    {
      id: 'notif_2',
      title: 'Campagna Frigorifero Nuovo: superato il 65%!',
      content: 'Grazie ai recenti versamenti abbiamo raggiunto 650€ su 1.000€. Consultate la sezione Obiettivi per i dettagli.',
      category: 'Acquisti',
      priority: 'normale',
      is_pinned: false,
      is_archived: false,
      created_by_id: 'usr_gianluca',
      created_by_name: 'Gianluca',
      created_at: '2026-10-03T15:30:00.000Z',
      read_by: ['usr_gianluca'],
    },
    {
      id: 'notif_3',
      title: 'Regola differenziata e orari rumorosità',
      content: 'Si ricorda di smaltire sempre cartoni e vetro nell apposito contenitore esterno e abbassare il volume della musica dopo le 23:30.',
      category: 'Informazione',
      priority: 'normale',
      is_pinned: false,
      is_archived: false,
      created_by_id: 'usr_marco',
      created_by_name: 'Marco',
      created_at: '2026-10-01T10:00:00.000Z',
      read_by: ['usr_gianluca', 'usr_sofia'],
    },
  ];

  const events: CalendarEvent[] = [
    {
      id: 'evt_1',
      title: 'Cena al locale',
      description: 'Cena sociale con pizza e giochi da tavolo per tutti i soci.',
      date: '2026-10-10',
      start_time: '20:30',
      end_time: '01:00',
      category: '🎉 Evento',
      created_by_id: 'usr_gianluca',
      created_by_name: 'Gianluca',
      participants: ['Gianluca', 'Marco', 'Sofia', 'Luca'],
      notes: 'Ognuno porta bibite o dolce',
      status: 'confirmed',
    },
    {
      id: 'evt_2',
      title: 'Manutenzione impianto luci e scaffalatura',
      description: 'Sistemazione faretti LED e montaggio ripiano attrezzi.',
      date: '2026-10-14',
      start_time: '15:00',
      end_time: '18:00',
      category: '🔧 Manutenzione',
      created_by_id: 'usr_marco',
      created_by_name: 'Marco',
      participants: ['Marco', 'Luca'],
      status: 'confirmed',
    },
    {
      id: 'evt_3',
      title: 'Serata Champions League',
      description: 'Visione partita con proiettore per il gruppo.',
      date: '2026-10-21',
      start_time: '20:45',
      end_time: '23:30',
      category: '🏠 Utilizzo del locale',
      created_by_id: 'usr_sofia',
      created_by_name: 'Sofia',
      participants: ['Sofia', 'Gianluca', 'Marco', 'Luca'],
      status: 'confirmed',
    },
  ];

  const venue_requests: VenueRequest[] = [
    {
      id: 'req_1',
      user_id: 'usr_sofia',
      user_name: 'Sofia Bianchi',
      user_email: 'sofia.bianchi@covo.local',
      date: '2026-10-18',
      start_time: '16:00',
      end_time: '20:00',
      reason: 'Festa di compleanno in piccolo gruppo',
      attendees_count: 8,
      notes: 'Musica a volume moderato e lasceremo tutto pulito entro le 20:30',
      status: 'pending',
      created_at: '2026-10-04T16:00:00.000Z',
    },
    {
      id: 'req_2',
      user_id: 'usr_luca',
      user_name: 'Luca Verdi',
      user_email: 'luca.verdi@covo.local',
      date: '2026-10-10',
      start_time: '14:00',
      end_time: '18:00',
      reason: 'Registrazione podcast e montaggio video',
      attendees_count: 3,
      notes: 'Uso del tavolo grande e microfoni',
      status: 'approved',
      reviewed_by_id: 'usr_gianluca',
      reviewed_by_name: 'Gianluca',
      reviewed_at: '2026-10-03T18:00:00.000Z',
      created_at: '2026-10-02T11:20:00.000Z',
    },
  ];

  const cleaning_shifts: CleaningShift[] = [
    {
      id: 'clean_1',
      assigned_user_id: 'usr_marco',
      assigned_user_name: 'Marco',
      date: '2026-10-11',
      time: '10:00',
      notes: 'Pulizia approfondita post-cena del sabato sera',
      status: 'upcoming',
      created_at: '2026-10-01T10:00:00.000Z',
      checklist: [
        { id: 'chk_1', label: 'Spazzare accuratamente il pavimento', completed: false },
        { id: 'chk_2', label: 'Lavare pavimento con detergente igienizzante', completed: false },
        { id: 'chk_3', label: 'Pulire e igienizzare bagno e sanitari', completed: false },
        { id: 'chk_4', label: 'Svuotare tutti i cestini e rinnovare sacchi', completed: false },
        { id: 'chk_5', label: 'Sistemare e disinfettare tavoli e bancone', completed: false },
        { id: 'chk_6', label: 'Controllare frigorifero e rimuovere scadenze', completed: false },
        { id: 'chk_7', label: 'Portare i sacchi differenziata ai cassonetti', completed: false },
      ],
    },
    {
      id: 'clean_2',
      assigned_user_id: 'usr_sofia',
      assigned_user_name: 'Sofia',
      date: '2026-10-18',
      time: '11:00',
      notes: 'Turno ordinario settimanale',
      status: 'upcoming',
      created_at: '2026-10-01T10:00:00.000Z',
      checklist: [
        { id: 'chk_21', label: 'Spazzare pavimento', completed: false },
        { id: 'chk_22', label: 'Lavare pavimento', completed: false },
        { id: 'chk_23', label: 'Pulire bagno', completed: false },
        { id: 'chk_24', label: 'Svuotare cestini', completed: false },
        { id: 'chk_25', label: 'Sistemare tavoli', completed: false },
      ],
    },
    {
      id: 'clean_0',
      assigned_user_id: 'usr_gianluca',
      assigned_user_name: 'Gianluca',
      date: '2026-10-04',
      time: '10:30',
      notes: 'Pulizia generale inizio mese',
      status: 'completed',
      created_at: '2026-09-28T10:00:00.000Z',
      updated_at: '2026-10-04T12:00:00.000Z',
      checklist: [
        { id: 'chk_01', label: 'Spazzare pavimento', completed: true, completed_at: '2026-10-04T11:10:00.000Z', completed_by_name: 'Gianluca' },
        { id: 'chk_02', label: 'Lavare pavimento', completed: true, completed_at: '2026-10-04T11:30:00.000Z', completed_by_name: 'Gianluca' },
        { id: 'chk_03', label: 'Pulire bagno', completed: true, completed_at: '2026-10-04T11:45:00.000Z', completed_by_name: 'Gianluca' },
        { id: 'chk_04', label: 'Svuotare cestini', completed: true, completed_at: '2026-10-04T11:55:00.000Z', completed_by_name: 'Gianluca' },
      ],
    },
  ];

  const polls: Poll[] = [
    {
      id: 'poll_1',
      question: 'Quale acquisto facciamo questo mese per il locale?',
      description: 'Abbiamo un budget extra disponibile per migliorare il covo. Scegliete l opzione prioritaria!',
      opened_at: '2026-10-01T08:00:00.000Z',
      closes_at: '2026-10-15T23:59:59.000Z',
      is_closed: false,
      allow_change_vote: true,
      is_anonymous: false,
      created_by_id: 'usr_gianluca',
      created_by_name: 'Gianluca',
      created_at: '2026-10-01T08:00:00.000Z',
      options: [
        { id: 'opt_1', text: 'Frigorifero capiente No Frost', votes_count: 3 },
        { id: 'opt_2', text: 'Televisore smart 55" per film/partite', votes_count: 1 },
        { id: 'opt_3', text: 'Impianto audio Hi-Fi potenziato', votes_count: 0 },
        { id: 'opt_4', text: 'Tavolo nuovo allungabile in legno', votes_count: 1 },
      ],
      votes: [
        { user_id: 'usr_gianluca', user_name: 'Gianluca', option_id: 'opt_1', voted_at: '2026-10-01T09:30:00.000Z' },
        { user_id: 'usr_marco', user_name: 'Marco', option_id: 'opt_1', voted_at: '2026-10-01T11:00:00.000Z' },
        { user_id: 'usr_sofia', user_name: 'Sofia', option_id: 'opt_1', voted_at: '2026-10-02T14:15:00.000Z' },
        { user_id: 'usr_luca', user_name: 'Luca', option_id: 'opt_2', voted_at: '2026-10-02T19:00:00.000Z' },
      ],
    },
  ];

  const regulation_sections: RegulationSection[] = [
    {
      id: 'reg_1',
      order: 1,
      title: '1. Accesso al locale e custodia chiavi',
      content: 'Il locale è a disposizione esclusiva dei soci registrati. Ogni membro dotato di chiave fisica o codice di accesso è personalmente custode del proprio accesso. È severamente vietato cedere chiavi o codici a terzi non autorizzati.',
      last_updated_at: '2026-09-15T10:00:00.000Z',
      last_updated_by_name: 'Gianluca',
    },
    {
      id: 'reg_2',
      order: 2,
      title: '2. Utilizzo degli spazi e prenotazione',
      content: 'Gli spazi comuni possono essere occupati liberamente per studio e svago quando non riservati. Per eventi privati o utilizzi esclusivi oltre 4 persone è obbligatorio inviare richiesta sul portale con almeno 48 ore di anticipo e ottenere approvazione.',
      last_updated_at: '2026-09-15T10:00:00.000Z',
      last_updated_by_name: 'Gianluca',
    },
    {
      id: 'reg_3',
      order: 3,
      title: '3. Pulizia e igiene',
      content: 'Ognuno è tenuto a lasciare il locale nelle stesse condizioni (o migliori) in cui lo ha trovato. Le stoviglie devono essere lavate immediatamente. I turni di pulizia settimanale assegnati sul gestionale vanno rispettati con spunta delle relative checklist.',
      last_updated_at: '2026-09-15T10:00:00.000Z',
      last_updated_by_name: 'Gianluca',
    },
    {
      id: 'reg_4',
      order: 4,
      title: '4. Ospiti ed esterni',
      content: 'Ogni membro può invitare ospiti occasionali purché resti presente durante tutta la permanenza e ne assuma la piena responsabilità. Eventi con più di 10 persone totali richiedono l approvazione preventiva dei gestori.',
      last_updated_at: '2026-09-15T10:00:00.000Z',
      last_updated_by_name: 'Gianluca',
    },
    {
      id: 'reg_5',
      order: 5,
      title: '5. Sicurezza e rispetto del vicinato',
      content: 'Dopo le 23:00 è obbligatorio abbassare il volume della musica e chiudere porte e finestre per non disturbare i condomini. Prima di uscire è dovere dell ultimo socio verificare lo spegnimento di riscaldamento/clima, luci e chiusura sicura delle porte.',
      last_updated_at: '2026-09-20T18:00:00.000Z',
      last_updated_by_name: 'Marco',
    },
    {
      id: 'reg_6',
      order: 6,
      title: '6. Utilizzo attrezzature e strumenti',
      content: 'Attrezzature elettroniche, proiettore, diffusori e strumenti condivisi devono essere usati con cura. In caso di malfunzionamento o danneggiamento involontario, segnalare tempestivamente nel registro del gestionale.',
      last_updated_at: '2026-09-15T10:00:00.000Z',
      last_updated_by_name: 'Gianluca',
    },
    {
      id: 'reg_7',
      order: 7,
      title: '7. Fondo comune e quote',
      content: 'Le spese fisse (utenze, internet, canone) e le spese concordate vengono gestite tramite il fondo comune. Ogni versamento o spesa viene annotato sul libro mastro del portale con trasparenza totale.',
      last_updated_at: '2026-09-15T10:00:00.000Z',
      last_updated_by_name: 'Gianluca',
    },
    {
      id: 'reg_8',
      order: 8,
      title: '8. Comportamento e convivenza',
      content: 'Il locale è fondato su fiducia, rispetto reciproco e spirito comunitario. Qualsiasi violazione reiterata o comportamento irrispettoso potrà portare alla sospensione dell accesso da parte dell assemblea.',
      last_updated_at: '2026-09-15T10:00:00.000Z',
      last_updated_by_name: 'Gianluca',
    },
    {
      id: 'reg_9',
      order: 9,
      title: '9. Responsabilità e risarcimento danni',
      content: 'Eventuali danni materiali imputabili a negligenza grave o mancato rispetto del regolamento saranno a carico del responsabile identificato o del membro che ha introdotto gli ospiti responsabili.',
      last_updated_at: '2026-09-15T10:00:00.000Z',
      last_updated_by_name: 'Gianluca',
    },
  ];

  const regulation_versions: RegulationVersion[] = [
    {
      id: 'ver_1',
      version: 1,
      created_at: '2026-09-15T10:00:00.000Z',
      author_name: 'Gianluca',
      change_summary: 'Bozza iniziale approvata all unanimità dall assemblea soci.',
      sections_snapshot: regulation_sections,
    },
    {
      id: 'ver_2',
      version: 2,
      created_at: '2026-09-20T18:00:00.000Z',
      author_name: 'Marco',
      change_summary: 'Aggiornamento Articolo 5 su orari di rispetto quiete notturna e chiusura finestre.',
      sections_snapshot: regulation_sections,
    },
  ];

  const purchases: PurchaseItem[] = [
    {
      id: 'pur_1',
      name: 'Frigorifero combinato No Frost',
      description: 'Capiente, classe energetica C/D, ideale per bibite e cibo delle feste.',
      category: 'Elettrodomestici',
      estimated_price: 1000,
      actual_price: 950,
      priority: 'alta',
      status: 'da_acquistare',
      assignee_name: 'Marco',
      target_date: '2026-10-25',
      notes: 'Stiamo raccogliendo le quote nell obiettivo dedicato.',
      created_by_id: 'usr_gianluca',
      created_by_name: 'Gianluca',
      created_at: '2026-09-20T11:00:00.000Z',
    },
    {
      id: 'pur_2',
      name: 'Bersaglio freccette professionale in sisal + set freccette',
      description: 'Per le serate relax e tornei tra soci.',
      category: 'Svago & Audio',
      estimated_price: 90,
      actual_price: 85,
      priority: 'media',
      status: 'acquistato',
      assignee_name: 'Luca',
      notes: 'Installato sulla parete ovest con protezione salvamuro.',
      created_by_id: 'usr_luca',
      created_by_name: 'Luca',
      created_at: '2026-09-10T14:00:00.000Z',
    },
    {
      id: 'pur_3',
      name: 'Set 8 sedie pieghevoli robuste imbottite',
      description: 'Per avere posti a sedere sufficienti durante cene e assemblee.',
      category: 'Arredamento',
      estimated_price: 220,
      priority: 'media',
      status: 'da_valutare',
      created_by_id: 'usr_sofia',
      created_by_name: 'Sofia',
      created_at: '2026-09-28T16:30:00.000Z',
    },
  ];

  const goals: FinancialGoal[] = [
    {
      id: 'goal_frigo',
      title: 'Nuovo Frigorifero per il Covo',
      description: 'Sostituzione del vecchio frigo rumoroso con un moderno combinato capiente No Frost per bibite e provviste.',
      target_amount: 1000,
      collected_amount: 650,
      deadline: '2026-10-31',
      is_completed: false,
      created_by_name: 'Gianluca',
      created_at: '2026-09-15T12:00:00.000Z',
      contributions: [
        { id: 'cnt_1', amount: 200, date: '2026-09-18', user_name: 'Gianluca', notes: 'Quota versata in cassa', created_at: '2026-09-18T10:00:00.000Z' },
        { id: 'cnt_2', amount: 150, date: '2026-09-22', user_name: 'Marco', notes: 'Bonifico al conto del locale', created_at: '2026-09-22T14:00:00.000Z' },
        { id: 'cnt_3', amount: 150, date: '2026-09-28', user_name: 'Sofia', notes: 'Bonifico', created_at: '2026-09-28T16:00:00.000Z' },
        { id: 'cnt_4', amount: 150, date: '2026-10-02', user_name: 'Luca', notes: 'Versamento contanti', created_at: '2026-10-02T19:00:00.000Z' },
      ],
    },
    {
      id: 'goal_audio',
      title: 'Nuovo Impianto Diffusori Audio',
      description: 'Due casse attive con supporto bluetooth per eventi e serate cinema.',
      target_amount: 500,
      collected_amount: 120,
      deadline: '2026-11-30',
      is_completed: false,
      created_by_name: 'Marco',
      created_at: '2026-10-01T15:00:00.000Z',
      contributions: [
        { id: 'cnt_11', amount: 60, date: '2026-10-03', user_name: 'Marco', notes: 'Anticipo quota', created_at: '2026-10-03T11:00:00.000Z' },
        { id: 'cnt_12', amount: 60, date: '2026-10-04', user_name: 'Gianluca', notes: 'Anticipo quota', created_at: '2026-10-04T12:00:00.000Z' },
      ],
    },
  ];

  // Starting baselines and transactions designed so:
  // Saldo banca = 2.450 €
  // Fondo cassa = 380 €
  // Totale = 2.830 € (exactly matching prompt example!)
  const financial_accounts = {
    initial_bank: 2000,
    initial_cash: 300,
  };

  const financial_transactions: FinancialTransaction[] = [
    {
      id: 'tx_1',
      type: 'income',
      amount: 600,
      date: '2026-09-01',
      category: 'Quote Mensili',
      description: 'Quote soci settembre (Gianluca, Marco, Sofia, Luca)',
      method: 'bank',
      recorded_by_id: 'usr_gianluca',
      recorded_by_name: 'Gianluca',
      receipt_note: 'Bonifici cumulativi',
      created_at: '2026-09-01T10:00:00.000Z',
    },
    {
      id: 'tx_2',
      type: 'expense',
      amount: 150,
      date: '2026-09-12',
      category: 'Bollette',
      description: 'Bolletta luce bimestre agosto',
      method: 'bank',
      recorded_by_id: 'usr_gianluca',
      recorded_by_name: 'Gianluca',
      receipt_note: 'Fattura Enel Servizio Elettrico #44921',
      created_at: '2026-09-12T16:00:00.000Z',
    },
    {
      id: 'tx_3',
      type: 'expense',
      amount: 85,
      date: '2026-09-15',
      category: 'Acquisti',
      description: 'Bersaglio freccette e protezioni',
      method: 'cash',
      recorded_by_id: 'usr_luca',
      recorded_by_name: 'Luca',
      receipt_note: 'Scontrino Decathlon #882',
      created_at: '2026-09-15T14:00:00.000Z',
    },
    {
      id: 'tx_4',
      type: 'income',
      amount: 285,
      date: '2026-09-22',
      category: 'Contributi',
      description: 'Contributi straordinari e fondo bevande',
      method: 'cash',
      recorded_by_id: 'usr_marco',
      recorded_by_name: 'Marco',
      receipt_note: 'Busta cassa covo',
      created_at: '2026-09-22T19:00:00.000Z',
    },
    {
      id: 'tx_5',
      type: 'expense',
      amount: 120,
      date: '2026-10-05',
      category: 'Acquisti',
      description: 'Materiale pulizia e detergenti industriali per il covo',
      method: 'cash',
      recorded_by_id: 'usr_gianluca',
      recorded_by_name: 'Gianluca',
      receipt_note: 'Scontrino Leroy Merlin #3911',
      created_at: '2026-10-05T07:30:00.000Z',
    },
  ];

  const audit_logs: AuditLog[] = [
    {
      id: 'log_1',
      timestamp: '2026-10-05T07:30:00.000Z',
      user_id: 'usr_gianluca',
      user_name: 'Gianluca',
      category: 'finance',
      action: 'Aggiunta spesa',
      details: 'Ha aggiunto un uscita di €120. Categoria: Acquisti. Descrizione: Materiale pulizia e detergenti industriali',
    },
    {
      id: 'log_2',
      timestamp: '2026-10-03T18:00:00.000Z',
      user_id: 'usr_gianluca',
      user_name: 'Gianluca',
      category: 'venue',
      action: 'Approvazione richiesta locale',
      details: 'Ha approvato la richiesta di utilizzo di Luca per il giorno 10/10/2026 (14:00 - 18:00)',
    },
    {
      id: 'log_3',
      timestamp: '2026-10-01T08:00:00.000Z',
      user_id: 'usr_gianluca',
      user_name: 'Gianluca',
      category: 'poll',
      action: 'Creazione sondaggio',
      details: 'Ha creato il sondaggio "Quale acquisto facciamo questo mese per il locale?"',
    },
    {
      id: 'log_4',
      timestamp: '2026-09-20T18:00:00.000Z',
      user_id: 'usr_marco',
      user_name: 'Marco',
      category: 'regulation',
      action: 'Modifica regolamento',
      details: 'Ha aggiornato l articolo 5 (Sicurezza e rispetto del vicinato)',
    },
  ];

  const elections: PresidentialElection[] = [
    {
      id: 'elect_q4_2026',
      quarter: 'Q4 2026',
      title: 'Elezioni Presidenziali Trimestrali - Q4 2026',
      term_period: '1 Ottobre 2026 - 31 Dicembre 2026',
      description: 'Consultazione elettorale trimestrale per l elezione del Presidente del Locale de Il Covo. Il voto è personale, segreto e vincolante. Nessun campo di testo libero ammesso per i votanti: seleziona unicamente il tuo candidato o scheda bianca.',
      start_date: '2026-10-01',
      end_date: '2026-10-15',
      status: 'active',
      candidates: [
        {
          id: 'cand_gianluca',
          user_id: 'usr_gianluca',
          name: 'Gianluca Busdeez',
          manifesto_summary: 'Continuità gestionale, trasparenza del fondo cassa e completamento obiettivo frigorifero.',
          votes_count: 2,
        },
        {
          id: 'cand_marco',
          user_id: 'usr_marco',
          name: 'Marco Rossi',
          manifesto_summary: 'Potenziamento serate sociali, tornei di giochi e ammodernamento impianto audio.',
          votes_count: 1,
        },
        {
          id: 'cand_sofia',
          user_id: 'usr_sofia',
          name: 'Sofia Bianchi',
          manifesto_summary: 'Ottimizzazione turni di pulizia, accoglienza nuovi soci e sostenibilità delle bollette.',
          votes_count: 0,
        },
      ],
      blank_votes: 0,
      voter_ids: ['usr_marco', 'usr_sofia', 'usr_luca'],
      created_at: '2026-10-01T08:00:00.000Z',
    },
    {
      id: 'elect_q3_2026',
      quarter: 'Q3 2026',
      title: 'Elezioni Presidenziali Trimestrali - Q3 2026',
      term_period: '1 Luglio 2026 - 30 Settembre 2026',
      description: 'Scrutinio estivo del locale.',
      start_date: '2026-07-01',
      end_date: '2026-07-10',
      status: 'closed',
      candidates: [
        {
          id: 'cand_gianluca_q3',
          user_id: 'usr_gianluca',
          name: 'Gianluca Busdeez',
          votes_count: 3,
        },
        {
          id: 'cand_marco_q3',
          user_id: 'usr_marco',
          name: 'Marco Rossi',
          votes_count: 1,
        },
      ],
      blank_votes: 0,
      voter_ids: ['usr_gianluca', 'usr_marco', 'usr_sofia', 'usr_luca'],
      winner_candidate_id: 'cand_gianluca_q3',
      winner_name: 'Gianluca Busdeez',
      created_at: '2026-07-01T08:00:00.000Z',
      closed_at: '2026-07-11T12:00:00.000Z',
    },
  ];

  const notification_channel_configs: NotificationChannelConfig = {
    web_push: {
      enabled: true,
      public_key: 'BEl62iUYgUivxIkv69yViEuiBIa-Ib9-SkvMeAtA3LFgDzkrxZJjSgSnfckjxyWMWyZCE2_d_z5gP5VdJvQfK0w',
      private_key: 'mock_server_vapid_private_key_secured',
      subject: 'mailto:admin@covo.local',
    },
    telegram: {
      enabled: Boolean(process.env.TELEGRAM_BOT_TOKEN),
      bot_token: process.env.TELEGRAM_BOT_TOKEN || '',
      bot_username: 'IlCovoLocaleBot',
      webhook_active: true,
    },
    whatsapp: {
      enabled: Boolean(process.env.WHATSAPP_ACCESS_TOKEN && process.env.WHATSAPP_PHONE_NUMBER_ID),
      phone_number_id: process.env.WHATSAPP_PHONE_NUMBER_ID || '',
      business_account_id: process.env.WHATSAPP_BUSINESS_ACCOUNT_ID || '',
      access_token: process.env.WHATSAPP_ACCESS_TOKEN || '',
      default_template_name: 'covo_alert_v1',
    },
    email: {
      enabled: true,
      from_address: 'notifiche@covo.local',
      smtp_configured: false,
    },
  };

  const notification_preferences: UserNotificationPreference[] = [
    {
      id: 'pref_gianluca',
      user_id: 'usr_gianluca',
      channels: { in_app: true, web_push: true, telegram: true, whatsapp: true, email: true },
      categories: { presence: true, venue: true, cleaning: true, polls: true, purchases: true, calendar: true, finances: true, admin: true },
      critical_always_all: true,
      updated_at: new Date().toISOString(),
    },
    {
      id: 'pref_marco',
      user_id: 'usr_marco',
      channels: { in_app: true, web_push: true, telegram: true, whatsapp: false, email: true },
      categories: { presence: true, venue: true, cleaning: true, polls: true, purchases: true, calendar: true, finances: true, admin: true },
      critical_always_all: true,
      updated_at: new Date().toISOString(),
    },
    {
      id: 'pref_sofia',
      user_id: 'usr_sofia',
      channels: { in_app: true, web_push: true, telegram: false, whatsapp: false, email: true },
      categories: { presence: true, venue: true, cleaning: true, polls: true, purchases: true, calendar: true, finances: false, admin: true },
      critical_always_all: true,
      updated_at: new Date().toISOString(),
    },
    {
      id: 'pref_luca',
      user_id: 'usr_luca',
      channels: { in_app: true, web_push: false, telegram: false, whatsapp: false, email: true },
      categories: { presence: false, venue: true, cleaning: true, polls: true, purchases: true, calendar: true, finances: false, admin: true },
      critical_always_all: true,
      updated_at: new Date().toISOString(),
    },
  ];

  const push_subscriptions: PushSubscriptionRecord[] = [];

  const telegram_connections: TelegramConnection[] = [
    {
      id: 'tg_gianluca',
      user_id: 'usr_gianluca',
      telegram_user_id: '123456789',
      telegram_username: 'gianlubus',
      telegram_first_name: 'Gianluca',
      is_connected: true,
      connected_at: '2026-09-15T10:00:00.000Z',
    },
  ];

  const whatsapp_connections: WhatsAppConnection[] = [
    {
      id: 'wa_gianluca',
      user_id: 'usr_gianluca',
      phone_number: '+393331234567',
      is_opted_in: true,
      opted_in_at: '2026-09-15T10:00:00.000Z',
    },
  ];

  const user_presences: UserPresence[] = [
    {
      id: 'pres_gianluca',
      user_id: 'usr_gianluca',
      user_name: 'Gianluca Busdeez',
      status: 'active',
      started_at: new Date(Date.now() - 45 * 60 * 1000).toISOString(),
      expected_until: new Date(Date.now() + 90 * 60 * 1000).toISOString(),
      notes: 'Lavori di manutenzione e controllo cassa',
    },
  ];

  const notifications_multichannel: MultiChannelNotification[] = [
    {
      id: 'notif_mc_1',
      title: '🟢 Gianluca è al locale',
      message: 'Gianluca Busdeez ha confermato la sua presenza al locale con permanenza prevista fino alle 01:30.',
      category: 'presence',
      priority: 'normal',
      target_type: 'all',
      recipient_ids: ['usr_gianluca', 'usr_marco', 'usr_sofia', 'usr_luca'],
      channels: ['in_app', 'web_push', 'telegram'],
      status: 'sent',
      created_by_id: 'usr_gianluca',
      created_by_name: 'Gianluca Busdeez',
      created_at: new Date(Date.now() - 45 * 60 * 1000).toISOString(),
      sent_at: new Date(Date.now() - 44 * 60 * 1000).toISOString(),
    },
    {
      id: 'notif_mc_2',
      title: '🏠 Richiesta utilizzo locale approvata',
      message: 'La richiesta di prenotazione per la serata di sabato è stata ufficialmente approvata.',
      category: 'venue',
      priority: 'high',
      target_type: 'all',
      recipient_ids: ['usr_gianluca', 'usr_marco', 'usr_sofia', 'usr_luca'],
      channels: ['in_app', 'web_push', 'telegram', 'email'],
      status: 'sent',
      created_by_id: 'usr_gianluca',
      created_by_name: 'Gianluca Busdeez',
      created_at: '2026-10-02T14:30:00.000Z',
      sent_at: '2026-10-02T14:30:05.000Z',
    },
    {
      id: 'notif_mc_3',
      title: '⚠️ Importante: orario chiusura anticipato domenica',
      message: 'Domenica sera il locale dovrà essere lasciato libero e in ordine entro le ore 18:00 per sanificazione straordinaria.',
      category: 'admin',
      priority: 'critical',
      target_type: 'all',
      recipient_ids: ['usr_gianluca', 'usr_marco', 'usr_sofia', 'usr_luca'],
      channels: ['in_app', 'web_push', 'telegram', 'whatsapp', 'email'],
      status: 'sent',
      created_by_id: 'usr_gianluca',
      created_by_name: 'Gianluca Busdeez',
      created_at: '2026-10-03T09:00:00.000Z',
      sent_at: '2026-10-03T09:00:10.000Z',
    },
  ];

  const notification_deliveries: NotificationDelivery[] = [
    {
      id: 'deliv_1_inapp',
      notification_id: 'notif_mc_1',
      recipient_id: 'usr_marco',
      recipient_name: 'Marco Rossi',
      channel: 'in_app',
      status: 'sent',
      attempts: 1,
      max_attempts: 3,
      sent_at: new Date(Date.now() - 44 * 60 * 1000).toISOString(),
      created_at: new Date(Date.now() - 45 * 60 * 1000).toISOString(),
    },
    {
      id: 'deliv_1_tg',
      notification_id: 'notif_mc_1',
      recipient_id: 'usr_gianluca',
      recipient_name: 'Gianluca Busdeez',
      channel: 'telegram',
      status: 'sent',
      attempts: 1,
      max_attempts: 3,
      sent_at: new Date(Date.now() - 44 * 60 * 1000).toISOString(),
      created_at: new Date(Date.now() - 45 * 60 * 1000).toISOString(),
    },
    {
      id: 'deliv_3_wa',
      notification_id: 'notif_mc_3',
      recipient_id: 'usr_gianluca',
      recipient_name: 'Gianluca Busdeez',
      channel: 'whatsapp',
      status: 'sent',
      attempts: 1,
      max_attempts: 3,
      sent_at: '2026-10-03T09:00:08.000Z',
      created_at: '2026-10-03T09:00:00.000Z',
    },
  ];

  return {
    users,
    notifications,
    events,
    venue_requests,
    cleaning_shifts,
    polls,
    regulation_sections,
    regulation_versions,
    purchases,
    goals,
    elections,
    financial_accounts,
    financial_transactions,
    audit_logs,
    notifications_multichannel,
    notification_deliveries,
    notification_preferences,
    push_subscriptions,
    telegram_connections,
    whatsapp_connections,
    notification_channel_configs,
    user_presences,
  };
}

class DatabaseManager {
  private state: DatabaseState;

  constructor() {
    this.state = this.load();
  }

  private load(): DatabaseState {
    try {
      if (fs.existsSync(DB_FILE)) {
        const raw = fs.readFileSync(DB_FILE, 'utf-8');
        const parsed = JSON.parse(raw);
        if (parsed && Array.isArray(parsed.users)) {
          const init = getInitialDatabase();
          if (!parsed.elections || !Array.isArray(parsed.elections)) {
            parsed.elections = init.elections;
          }
          if (!parsed.notifications_multichannel) {
            parsed.notifications_multichannel = init.notifications_multichannel;
          }
          if (!parsed.notification_deliveries) {
            parsed.notification_deliveries = init.notification_deliveries;
          }
          if (!parsed.notification_preferences) {
            parsed.notification_preferences = init.notification_preferences;
          }
          if (!parsed.push_subscriptions) {
            parsed.push_subscriptions = init.push_subscriptions;
          }
          if (!parsed.telegram_connections) {
            parsed.telegram_connections = init.telegram_connections;
          }
          if (!parsed.whatsapp_connections) {
            parsed.whatsapp_connections = init.whatsapp_connections;
          }
          if (!parsed.notification_channel_configs) {
            parsed.notification_channel_configs = init.notification_channel_configs;
          }
          if (!parsed.user_presences) {
            parsed.user_presences = init.user_presences;
          }
          return parsed as DatabaseState;
        }
      }
    } catch (err) {
      console.error('Failed reading database file, resetting to initial seed:', err);
    }
    const initial = getInitialDatabase();
    this.saveDirect(initial);
    return initial;
  }

  private saveDirect(state: DatabaseState) {
    try {
      const tempPath = `${DB_FILE}.tmp`;
      fs.writeFileSync(tempPath, JSON.stringify(state, null, 2), 'utf-8');
      fs.renameSync(tempPath, DB_FILE);
    } catch (err) {
      console.error('Failed writing database file:', err);
    }
  }

  public save() {
    this.saveDirect(this.state);
  }

  public resetToSeed(): DatabaseState {
    this.state = getInitialDatabase();
    this.save();
    return this.state;
  }

  public getState(): DatabaseState {
    return this.state;
  }

  // --- Financial calculation helper ---
  public getFinancialSummary(): FinancialSummary {
    const { initial_bank, initial_cash } = this.state.financial_accounts;
    let bank_balance = initial_bank;
    let cash_balance = initial_cash;
    let monthly_income = 0;
    let monthly_expense = 0;

    // Filter for current month (October 2026 or dynamic)
    const now = new Date();
    const currentMonthPrefix = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;

    for (const tx of this.state.financial_transactions) {
      if (tx.type === 'income') {
        if (tx.method === 'bank') bank_balance += tx.amount;
        else cash_balance += tx.amount;

        if (tx.date.startsWith(currentMonthPrefix) || tx.date.startsWith('2026-10')) {
          monthly_income += tx.amount;
        }
      } else {
        if (tx.method === 'bank') bank_balance -= tx.amount;
        else cash_balance -= tx.amount;

        if (tx.date.startsWith(currentMonthPrefix) || tx.date.startsWith('2026-10')) {
          monthly_expense += tx.amount;
        }
      }
    }

    return {
      bank_balance,
      cash_balance,
      total_balance: bank_balance + cash_balance,
      monthly_income,
      monthly_expense,
      initial_bank_balance: initial_bank,
      initial_cash_balance: initial_cash,
    };
  }

  // --- Overlap / collision detection for Venue Requests ---
  public checkOverlap(
    date: string,
    startTime: string,
    endTime: string,
    excludeRequestId?: string
  ): { hasConflict: boolean; conflictReason?: string } {
    const toMinutes = (timeStr: string) => {
      const [h, m] = timeStr.split(':').map(Number);
      return h * 60 + (m || 0);
    };

    const newStart = toMinutes(startTime);
    const newEnd = toMinutes(endTime);

    if (newStart >= newEnd) {
      return {
        hasConflict: true,
        conflictReason: "L'orario di fine deve essere successivo all'orario di inizio.",
      };
    }

    // 1. Check approved venue requests
    for (const req of this.state.venue_requests) {
      if (req.id === excludeRequestId) continue;
      if (req.date === date && req.status === 'approved') {
        const reqStart = toMinutes(req.start_time);
        const reqEnd = toMinutes(req.end_time);

        if (newStart < reqEnd && newEnd > reqStart) {
          return {
            hasConflict: true,
            conflictReason: `Conflitto di orario: locale già prenotato da ${req.user_name} (${req.start_time} - ${req.end_time}) per "${req.reason}".`,
          };
        }
      }
    }

    // 2. Check active calendar events that occupy the space
    for (const evt of this.state.events) {
      if (evt.date === date && evt.status === 'confirmed') {
        const evtStart = toMinutes(evt.start_time);
        const evtEnd = toMinutes(evt.end_time);

        if (newStart < evtEnd && newEnd > evtStart) {
          return {
            hasConflict: true,
            conflictReason: `Conflitto con evento in calendario: "${evt.title}" (${evt.start_time} - ${evt.end_time}).`,
          };
        }
      }
    }

    return { hasConflict: false };
  }

  public addAuditLog(log: Omit<AuditLog, 'id' | 'timestamp'>) {
    const fullLog: AuditLog = {
      ...log,
      id: `log_${Date.now()}_${Math.random().toString(36).substr(2, 4)}`,
      timestamp: new Date().toISOString(),
    };
    this.state.audit_logs.unshift(fullLog);
    // keep maximum 500 audit entries
    if (this.state.audit_logs.length > 500) {
      this.state.audit_logs.pop();
    }
    this.save();
  }
}

export const db = new DatabaseManager();
