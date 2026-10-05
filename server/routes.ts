import { Router, Request, Response } from 'express';
import { db } from './db';
import type {
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
  UserProfile,
} from '../src/types/database';

export const apiRouter = Router();

// ==========================================
// 1. AUTH & USERS
// ==========================================

apiRouter.post('/auth/register', (req: Request, res: Response) => {
  const { email, username, first_name, last_name, password } = req.body;
  if (!email || !username || !first_name || !last_name) {
    return res.status(400).json({ error: 'Compila tutti i campi obbligatori.' });
  }

  const state = db.getState();
  const existingEmail = state.users.find(u => u.email.toLowerCase() === email.toLowerCase());
  if (existingEmail) {
    return res.status(400).json({ error: 'Un utente con questa email esiste già.' });
  }

  const existingUsername = state.users.find(u => u.username.toLowerCase() === username.toLowerCase());
  if (existingUsername) {
    return res.status(400).json({ error: 'Questo username è già in uso.' });
  }

  // First user or specific email can be admin, otherwise default 'user'
  const isFirstUser = state.users.length === 0;
  const role = isFirstUser || email.toLowerCase() === 'gianlubusdeez@gmail.com' ? 'admin' : 'user';

  const newUser: UserProfile = {
    id: `usr_${Date.now()}_${Math.random().toString(36).substr(2, 4)}`,
    email,
    username: username.toLowerCase().trim(),
    first_name,
    last_name,
    role,
    is_active: true,
    created_at: new Date().toISOString(),
    last_login_at: new Date().toISOString(),
  };

  state.users.push(newUser);
  db.save();

  db.addAuditLog({
    user_id: newUser.id,
    user_name: `${newUser.first_name} ${newUser.last_name}`,
    category: 'user',
    action: 'Registrazione nuovo utente',
    details: `Nuovo account registrato: ${newUser.username} (${newUser.email}) con ruolo ${newUser.role}`,
  });

  res.status(201).json({ user: newUser });
});

apiRouter.post('/auth/login', (req: Request, res: Response) => {
  const { identifier, password } = req.body;
  if (!identifier) {
    return res.status(400).json({ error: 'Inserisci username o email.' });
  }

  const state = db.getState();
  const lower = identifier.toLowerCase().trim();
  const user = state.users.find(
    u => u.email.toLowerCase() === lower || u.username.toLowerCase() === lower
  );

  if (!user) {
    return res.status(404).json({ error: 'Utente non trovato. Verifica le credenziali o registrati.' });
  }

  if (!user.is_active) {
    return res.status(403).json({ error: 'Questo account è stato disattivato da un amministratore.' });
  }

  user.last_login_at = new Date().toISOString();
  db.save();

  res.json({ user });
});

apiRouter.post('/auth/reset-password', (req: Request, res: Response) => {
  const { email } = req.body;
  const state = db.getState();
  const user = state.users.find(u => u.email.toLowerCase() === (email || '').toLowerCase());
  if (!user) {
    return res.status(404).json({ error: 'Nessun account associato a questo indirizzo email.' });
  }

  res.json({
    message: `Istruzioni di ripristino inviate a ${email}. Controlla la casella di posta per impostare la nuova password.`,
  });
});

apiRouter.put('/auth/profile', (req: Request, res: Response) => {
  const { id, first_name, last_name, phone, avatar_url } = req.body;
  const state = db.getState();
  const user = state.users.find(u => u.id === id);
  if (!user) {
    return res.status(404).json({ error: 'Utente non trovato.' });
  }

  if (first_name) user.first_name = first_name;
  if (last_name) user.last_name = last_name;
  if (phone !== undefined) user.phone = phone;
  if (avatar_url !== undefined) user.avatar_url = avatar_url;

  db.save();
  res.json({ user });
});

apiRouter.get('/users', (_req: Request, res: Response) => {
  const state = db.getState();
  res.json(state.users);
});

apiRouter.put('/users/:id/role', (req: Request, res: Response) => {
  const { id } = req.params;
  const { role, updated_by_name } = req.body;
  if (!['admin', 'manager', 'user'].includes(role)) {
    return res.status(400).json({ error: 'Ruolo non valido.' });
  }

  const state = db.getState();
  const user = state.users.find(u => u.id === id);
  if (!user) return res.status(404).json({ error: 'Utente non trovato.' });

  const oldRole = user.role;
  user.role = role;
  db.save();

  db.addAuditLog({
    user_id: id,
    user_name: updated_by_name || 'Amministratore',
    category: 'user',
    action: 'Modifica ruolo',
    details: `Ruolo dell'utente ${user.username} modificato da ${oldRole} a ${role}`,
  });

  res.json({ user });
});

apiRouter.put('/users/:id/status', (req: Request, res: Response) => {
  const { id } = req.params;
  const { is_active, updated_by_name } = req.body;
  const state = db.getState();
  const user = state.users.find(u => u.id === id);
  if (!user) return res.status(404).json({ error: 'Utente non trovato.' });

  user.is_active = Boolean(is_active);
  db.save();

  db.addAuditLog({
    user_id: id,
    user_name: updated_by_name || 'Amministratore',
    category: 'user',
    action: user.is_active ? 'Riattivazione utente' : 'Disattivazione utente',
    details: `Stato account di ${user.username} impostato su: ${user.is_active ? 'Attivo' : 'Disattivato'}`,
  });

  res.json({ user });
});

// ==========================================
// 2. NOTIFICATIONS
// ==========================================

apiRouter.get('/notifications', (_req: Request, res: Response) => {
  const state = db.getState();
  res.json(state.notifications);
});

apiRouter.post('/notifications', (req: Request, res: Response) => {
  const { title, content, category, priority, is_pinned, created_by_id, created_by_name, expires_at } = req.body;
  if (!title || !content || !category) {
    return res.status(400).json({ error: 'Titolo, contenuto e categoria sono obbligatori.' });
  }

  const newNotif: NotificationItem = {
    id: `notif_${Date.now()}_${Math.random().toString(36).substr(2, 4)}`,
    title,
    content,
    category,
    priority: priority || 'normale',
    is_pinned: Boolean(is_pinned),
    is_archived: false,
    created_by_id: created_by_id || 'usr_admin',
    created_by_name: created_by_name || 'Amministrazione',
    created_at: new Date().toISOString(),
    expires_at,
    read_by: [],
  };

  const state = db.getState();
  state.notifications.unshift(newNotif);
  db.save();

  db.addAuditLog({
    user_id: newNotif.created_by_id,
    user_name: newNotif.created_by_name,
    category: 'venue',
    action: 'Pubblicazione notifica',
    details: `Nuova comunicazione: "${newNotif.title}" [${newNotif.category}]`,
  });

  res.status(201).json(newNotif);
});

apiRouter.put('/notifications/:id/read', (req: Request, res: Response) => {
  const { id } = req.params;
  const { user_id } = req.body;
  const state = db.getState();
  const notif = state.notifications.find(n => n.id === id);
  if (!notif) return res.status(404).json({ error: 'Notifica non trovata.' });

  if (user_id && !notif.read_by.includes(user_id)) {
    notif.read_by.push(user_id);
    db.save();
  }
  res.json(notif);
});

apiRouter.put('/notifications/:id/pin', (req: Request, res: Response) => {
  const { id } = req.params;
  const state = db.getState();
  const notif = state.notifications.find(n => n.id === id);
  if (!notif) return res.status(404).json({ error: 'Notifica non trovata.' });

  notif.is_pinned = !notif.is_pinned;
  db.save();
  res.json(notif);
});

apiRouter.delete('/notifications/:id', (req: Request, res: Response) => {
  const { id } = req.params;
  const state = db.getState();
  const idx = state.notifications.findIndex(n => n.id === id);
  if (idx === -1) return res.status(404).json({ error: 'Notifica non trovata.' });

  state.notifications.splice(idx, 1);
  db.save();
  res.json({ success: true });
});

// ==========================================
// 3. CALENDAR & EVENTS
// ==========================================

apiRouter.get('/events', (_req: Request, res: Response) => {
  const state = db.getState();
  res.json(state.events);
});

apiRouter.post('/events', (req: Request, res: Response) => {
  const { title, description, date, start_time, end_time, category, created_by_id, created_by_name, participants, notes } = req.body;
  if (!title || !date || !start_time || !end_time || !category) {
    return res.status(400).json({ error: 'Campi obbligatori mancanti.' });
  }

  // Conflict checking
  const overlapCheck = db.checkOverlap(date, start_time, end_time);
  if (overlapCheck.hasConflict) {
    return res.status(409).json({ error: overlapCheck.conflictReason });
  }

  const newEvent: CalendarEvent = {
    id: `evt_${Date.now()}_${Math.random().toString(36).substr(2, 4)}`,
    title,
    description: description || '',
    date,
    start_time,
    end_time,
    category,
    created_by_id: created_by_id || 'usr_admin',
    created_by_name: created_by_name || 'Admin',
    participants: participants || [],
    notes,
    status: 'confirmed',
  };

  const state = db.getState();
  state.events.push(newEvent);
  db.save();

  db.addAuditLog({
    user_id: newEvent.created_by_id,
    user_name: newEvent.created_by_name,
    category: 'venue',
    action: 'Creazione evento calendario',
    details: `Evento creato: "${newEvent.title}" il ${newEvent.date} (${newEvent.start_time} - ${newEvent.end_time})`,
  });

  res.status(201).json(newEvent);
});

apiRouter.delete('/events/:id', (req: Request, res: Response) => {
  const { id } = req.params;
  const state = db.getState();
  const idx = state.events.findIndex(e => e.id === id);
  if (idx === -1) return res.status(404).json({ error: 'Evento non trovato.' });

  const [removed] = state.events.splice(idx, 1);
  db.save();

  db.addAuditLog({
    user_id: 'usr_admin',
    user_name: 'Amministratore',
    category: 'venue',
    action: 'Cancellazione evento',
    details: `Evento cancellato: "${removed.title}" del ${removed.date}`,
  });

  res.json({ success: true });
});

// ==========================================
// 4. VENUE REQUESTS (COLLISION DETECTION & APPROVAL)
// ==========================================

apiRouter.get('/venue-requests', (_req: Request, res: Response) => {
  const state = db.getState();
  res.json(state.venue_requests);
});

// Check availability pre-submission
apiRouter.get('/venue-requests/check-availability', (req: Request, res: Response) => {
  const { date, start_time, end_time } = req.query as { date: string; start_time: string; end_time: string };
  if (!date || !start_time || !end_time) {
    return res.status(400).json({ error: 'Parametri data e orari mancanti.' });
  }

  const check = db.checkOverlap(date, start_time, end_time);
  res.json({
    available: !check.hasConflict,
    conflictReason: check.conflictReason,
  });
});

apiRouter.post('/venue-requests', (req: Request, res: Response) => {
  const { user_id, user_name, user_email, date, start_time, end_time, reason, attendees_count, notes } = req.body;
  if (!user_id || !date || !start_time || !end_time || !reason) {
    return res.status(400).json({ error: 'Compila tutti i campi obbligatori per la richiesta.' });
  }

  // CRITICAL: Overlap / Collision verification
  const check = db.checkOverlap(date, start_time, end_time);
  if (check.hasConflict) {
    return res.status(409).json({ error: check.conflictReason });
  }

  const newRequest: VenueRequest = {
    id: `req_${Date.now()}_${Math.random().toString(36).substr(2, 4)}`,
    user_id,
    user_name: user_name || 'Membro',
    user_email: user_email || '',
    date,
    start_time,
    end_time,
    reason,
    attendees_count: Number(attendees_count) || 1,
    notes,
    status: 'pending',
    created_at: new Date().toISOString(),
  };

  const state = db.getState();
  state.venue_requests.unshift(newRequest);

  // Send a notification to administrators about new booking request
  state.notifications.unshift({
    id: `notif_${Date.now()}`,
    title: `Nuova richiesta locale da ${newRequest.user_name}`,
    content: `${newRequest.user_name} ha richiesto l'utilizzo del locale per il ${newRequest.date} dalle ${newRequest.start_time} alle ${newRequest.end_time} per: "${newRequest.reason}".`,
    category: 'Eventi',
    priority: 'normale',
    is_pinned: false,
    is_archived: false,
    created_by_id: newRequest.user_id,
    created_by_name: newRequest.user_name,
    created_at: new Date().toISOString(),
    read_by: [],
  });

  db.save();

  db.addAuditLog({
    user_id: newRequest.user_id,
    user_name: newRequest.user_name,
    category: 'venue',
    action: 'Nuova richiesta utilizzo locale',
    details: `Richiesta inviata per il ${newRequest.date} (${newRequest.start_time} - ${newRequest.end_time}): "${newRequest.reason}"`,
  });

  res.status(201).json(newRequest);
});

apiRouter.put('/venue-requests/:id/review', (req: Request, res: Response) => {
  const { id } = req.params;
  const { action, rejection_reason, reviewer_id, reviewer_name } = req.body;
  if (!['approve', 'reject', 'cancel'].includes(action)) {
    return res.status(400).json({ error: 'Azione non valida.' });
  }

  const state = db.getState();
  const request = state.venue_requests.find(r => r.id === id);
  if (!request) return res.status(404).json({ error: 'Richiesta non trovata.' });

  if (action === 'approve') {
    // Re-verify no conflict was approved in the meantime
    const check = db.checkOverlap(request.date, request.start_time, request.end_time, request.id);
    if (check.hasConflict) {
      return res.status(409).json({ error: `Impossibile approvare: ${check.conflictReason}` });
    }

    request.status = 'approved';
    request.reviewed_by_id = reviewer_id;
    request.reviewed_by_name = reviewer_name || 'Amministratore';
    request.reviewed_at = new Date().toISOString();

    // Automatically create confirmed calendar event!
    const autoEvent: CalendarEvent = {
      id: `evt_req_${request.id}`,
      title: `Prenotazione: ${request.reason} (${request.user_name})`,
      description: `Utilizzo locale approvato per ${request.user_name}. Partecipanti previsti: ~${request.attendees_count}. ${request.notes ? `Note: ${request.notes}` : ''}`,
      date: request.date,
      start_time: request.start_time,
      end_time: request.end_time,
      category: '🏠 Utilizzo del locale',
      created_by_id: request.user_id,
      created_by_name: request.user_name,
      participants: [request.user_name],
      notes: request.notes,
      status: 'confirmed',
      related_request_id: request.id,
    };
    state.events.push(autoEvent);

    // Notify the user
    state.notifications.unshift({
      id: `notif_${Date.now()}`,
      title: 'Richiesta locale approvata! 🎉',
      content: `La tua richiesta di utilizzo per il ${request.date} (${request.start_time} - ${request.end_time}) è stata approvata da ${reviewer_name}. L'evento è ora presente in calendario.`,
      category: 'Eventi',
      priority: 'alta',
      is_pinned: false,
      is_archived: false,
      created_by_id: reviewer_id || 'usr_admin',
      created_by_name: reviewer_name || 'Admin',
      created_at: new Date().toISOString(),
      read_by: [],
    });

    db.addAuditLog({
      user_id: reviewer_id || 'usr_admin',
      user_name: reviewer_name || 'Amministratore',
      category: 'venue',
      action: 'Approvazione utilizzo locale',
      details: `Approvata richiesta di ${request.user_name} per il ${request.date} (${request.start_time}-${request.end_time})`,
    });
  } else if (action === 'reject') {
    request.status = 'rejected';
    request.rejection_reason = rejection_reason || 'Nessuna motivazione specificata';
    request.reviewed_by_id = reviewer_id;
    request.reviewed_by_name = reviewer_name || 'Amministratore';
    request.reviewed_at = new Date().toISOString();

    // Notify the user
    state.notifications.unshift({
      id: `notif_${Date.now()}`,
      title: 'Richiesta locale non approvata',
      content: `La tua richiesta per il ${request.date} non è stata accettata. Motivo: ${request.rejection_reason}`,
      category: 'Eventi',
      priority: 'normale',
      is_pinned: false,
      is_archived: false,
      created_by_id: reviewer_id || 'usr_admin',
      created_by_name: reviewer_name || 'Admin',
      created_at: new Date().toISOString(),
      read_by: [],
    });

    db.addAuditLog({
      user_id: reviewer_id || 'usr_admin',
      user_name: reviewer_name || 'Amministratore',
      category: 'venue',
      action: 'Rifiuto utilizzo locale',
      details: `Rifiutata richiesta di ${request.user_name} del ${request.date}. Motivo: ${request.rejection_reason}`,
    });
  } else {
    request.status = 'cancelled';
  }

  db.save();
  res.json({ request });
});

// ==========================================
// 5. CLEANING SHIFTS & CHECKLIST
// ==========================================

apiRouter.get('/cleaning-shifts', (_req: Request, res: Response) => {
  const state = db.getState();
  res.json(state.cleaning_shifts);
});

apiRouter.post('/cleaning-shifts', (req: Request, res: Response) => {
  const { assigned_user_id, assigned_user_name, date, time, notes, checklist } = req.body;
  if (!assigned_user_id || !date || !time) {
    return res.status(400).json({ error: 'Persona, data e orario sono obbligatori.' });
  }

  const defaultChecklist = [
    { id: 'chk_1', label: 'Spazzare accuratamente il pavimento', completed: false },
    { id: 'chk_2', label: 'Lavare pavimento con detergente igienizzante', completed: false },
    { id: 'chk_3', label: 'Pulire e igienizzare bagno e sanitari', completed: false },
    { id: 'chk_4', label: 'Svuotare tutti i cestini e rinnovare sacchi', completed: false },
    { id: 'chk_5', label: 'Sistemare e disinfettare tavoli e bancone', completed: false },
    { id: 'chk_6', label: 'Controllare frigorifero e rimuovere scadenze', completed: false },
    { id: 'chk_7', label: 'Portare i sacchi differenziata ai cassonetti', completed: false },
  ];

  const newShift: CleaningShift = {
    id: `clean_${Date.now()}_${Math.random().toString(36).substr(2, 4)}`,
    assigned_user_id,
    assigned_user_name: assigned_user_name || 'Socio',
    date,
    time,
    notes,
    status: 'upcoming',
    checklist: Array.isArray(checklist) && checklist.length > 0 ? checklist : defaultChecklist,
    created_at: new Date().toISOString(),
  };

  const state = db.getState();
  state.cleaning_shifts.push(newShift);

  // Add a calendar event for cleaning shift
  state.events.push({
    id: `evt_clean_${newShift.id}`,
    title: `Pulizia locale (${newShift.assigned_user_name})`,
    description: `Turno di pulizia programmato. Note: ${notes || 'Checklist standard'}`,
    date,
    start_time: time,
    end_time: '12:00',
    category: '🧹 Pulizia',
    created_by_id: assigned_user_id,
    created_by_name: assigned_user_name,
    participants: [assigned_user_name],
    status: 'confirmed',
  });

  db.save();

  db.addAuditLog({
    user_id: assigned_user_id,
    user_name: assigned_user_name,
    category: 'cleaning',
    action: 'Assegnazione turno pulizia',
    details: `Turno di pulizia assegnato a ${assigned_user_name} per il giorno ${date} alle ${time}`,
  });

  res.status(201).json(newShift);
});

apiRouter.put('/cleaning-shifts/:id/checklist/:itemId', (req: Request, res: Response) => {
  const { id, itemId } = req.params;
  const { completed, user_name } = req.body;
  const state = db.getState();
  const shift = state.cleaning_shifts.find(s => s.id === id);
  if (!shift) return res.status(404).json({ error: 'Turno non trovato.' });

  const item = shift.checklist.find(i => i.id === itemId);
  if (!item) return res.status(404).json({ error: 'Attività non trovata.' });

  item.completed = Boolean(completed);
  if (item.completed) {
    item.completed_at = new Date().toISOString();
    item.completed_by_name = user_name || shift.assigned_user_name;
  } else {
    item.completed_at = undefined;
    item.completed_by_name = undefined;
  }

  // If all items are completed, mark shift as completed!
  const allDone = shift.checklist.every(i => i.completed);
  if (allDone) {
    shift.status = 'completed';
    shift.updated_at = new Date().toISOString();
  }

  db.save();
  res.json(shift);
});

apiRouter.put('/cleaning-shifts/:id/status', (req: Request, res: Response) => {
  const { id } = req.params;
  const { status, notes } = req.body;
  if (!['upcoming', 'completed', 'missed'].includes(status)) {
    return res.status(400).json({ error: 'Stato non valido.' });
  }

  const state = db.getState();
  const shift = state.cleaning_shifts.find(s => s.id === id);
  if (!shift) return res.status(404).json({ error: 'Turno non trovato.' });

  shift.status = status;
  if (notes !== undefined) shift.notes = notes;
  shift.updated_at = new Date().toISOString();

  db.save();
  res.json(shift);
});

// ==========================================
// 6. POLLS (SONDAGGI)
// ==========================================

apiRouter.get('/polls', (_req: Request, res: Response) => {
  const state = db.getState();
  res.json(state.polls);
});

apiRouter.post('/polls', (req: Request, res: Response) => {
  const { question, description, options, closes_at, allow_change_vote, is_anonymous, created_by_id, created_by_name } = req.body;
  if (!question || !Array.isArray(options) || options.length < 2) {
    return res.status(400).json({ error: 'Domanda e almeno 2 opzioni di risposta richieste.' });
  }

  const newPoll: Poll = {
    id: `poll_${Date.now()}_${Math.random().toString(36).substr(2, 4)}`,
    question,
    description,
    options: options.map((opt: string, idx: number) => ({
      id: `opt_${idx + 1}`,
      text: opt,
      votes_count: 0,
    })),
    opened_at: new Date().toISOString(),
    closes_at: closes_at || new Date(Date.now() + 14 * 86400000).toISOString(),
    is_closed: false,
    allow_change_vote: Boolean(allow_change_vote),
    is_anonymous: Boolean(is_anonymous),
    created_by_id: created_by_id || 'usr_admin',
    created_by_name: created_by_name || 'Admin',
    created_at: new Date().toISOString(),
    votes: [],
  };

  const state = db.getState();
  state.polls.unshift(newPoll);

  // Notify group
  state.notifications.unshift({
    id: `notif_${Date.now()}`,
    title: 'Nuovo sondaggio aperto 📊',
    content: `È disponibile un nuovo sondaggio: "${newPoll.question}". Partecipa per decidere insieme!`,
    category: 'Informazione',
    priority: 'normale',
    is_pinned: false,
    is_archived: false,
    created_by_id: newPoll.created_by_id,
    created_by_name: newPoll.created_by_name,
    created_at: new Date().toISOString(),
    read_by: [],
  });

  db.save();

  db.addAuditLog({
    user_id: newPoll.created_by_id,
    user_name: newPoll.created_by_name,
    category: 'poll',
    action: 'Creazione sondaggio',
    details: `Sondaggio creato: "${newPoll.question}"`,
  });

  res.status(201).json(newPoll);
});

apiRouter.post('/polls/:id/vote', (req: Request, res: Response) => {
  const { id } = req.params;
  const { option_id, user_id, user_name } = req.body;
  if (!option_id || !user_id) {
    return res.status(400).json({ error: 'Opzione e utente obbligatori.' });
  }

  const state = db.getState();
  const poll = state.polls.find(p => p.id === id);
  if (!poll) return res.status(404).json({ error: 'Sondaggio non trovato.' });

  if (poll.is_closed) {
    return res.status(400).json({ error: 'Questo sondaggio è chiuso.' });
  }

  const existingVoteIndex = poll.votes.findIndex(v => v.user_id === user_id);
  if (existingVoteIndex !== -1) {
    if (!poll.allow_change_vote) {
      return res.status(400).json({ error: 'Hai già espresso il tuo voto per questo sondaggio.' });
    }
    // Decrement previous option vote count
    const oldOptionId = poll.votes[existingVoteIndex].option_id;
    const oldOpt = poll.options.find(o => o.id === oldOptionId);
    if (oldOpt && oldOpt.votes_count > 0) {
      oldOpt.votes_count -= 1;
    }
    poll.votes.splice(existingVoteIndex, 1);
  }

  const targetOpt = poll.options.find(o => o.id === option_id);
  if (!targetOpt) return res.status(404).json({ error: 'Opzione non valida.' });

  targetOpt.votes_count += 1;
  poll.votes.push({
    user_id,
    user_name: poll.is_anonymous ? 'Anonimo' : user_name || 'Socio',
    option_id,
    voted_at: new Date().toISOString(),
  });

  db.save();
  res.json(poll);
});

apiRouter.put('/polls/:id/close', (req: Request, res: Response) => {
  const { id } = req.params;
  const state = db.getState();
  const poll = state.polls.find(p => p.id === id);
  if (!poll) return res.status(404).json({ error: 'Sondaggio non trovato.' });

  poll.is_closed = !poll.is_closed;
  db.save();
  res.json(poll);
});

// ==========================================
// 7. REGULATIONS (REGOLAMENTO & VERSIONI)
// ==========================================

apiRouter.get('/regulations', (_req: Request, res: Response) => {
  const state = db.getState();
  res.json({
    sections: state.regulation_sections,
    versions: state.regulation_versions,
  });
});

apiRouter.put('/regulations/:id', (req: Request, res: Response) => {
  const { id } = req.params;
  const { title, content, author_name, change_summary } = req.body;
  if (!content) return res.status(400).json({ error: 'Il testo della sezione non può essere vuoto.' });

  const state = db.getState();
  const section = state.regulation_sections.find(s => s.id === id);
  if (!section) return res.status(404).json({ error: 'Sezione non trovata.' });

  if (title) section.title = title;
  section.content = content;
  section.last_updated_at = new Date().toISOString();
  section.last_updated_by_name = author_name || 'Amministratore';

  // Create new version entry
  const newVersionNum = state.regulation_versions.length + 1;
  const newVersion: RegulationVersion = {
    id: `ver_${newVersionNum}`,
    version: newVersionNum,
    created_at: new Date().toISOString(),
    author_name: author_name || 'Amministratore',
    change_summary: change_summary || `Modifica sezione "${section.title}"`,
    sections_snapshot: JSON.parse(JSON.stringify(state.regulation_sections)),
  };
  state.regulation_versions.unshift(newVersion);

  db.save();

  db.addAuditLog({
    user_id: 'usr_admin',
    user_name: author_name || 'Amministratore',
    category: 'regulation',
    action: 'Aggiornamento regolamento',
    details: `Modificata sezione "${section.title}": ${change_summary || 'Nessun sommario fornito'} (Versione ${newVersionNum})`,
  });

  res.json({
    section,
    version: newVersion,
  });
});

// ==========================================
// 8. PURCHASES (ACQUISTI)
// ==========================================

apiRouter.get('/purchases', (_req: Request, res: Response) => {
  const state = db.getState();
  res.json(state.purchases);
});

apiRouter.post('/purchases', (req: Request, res: Response) => {
  const { name, description, category, estimated_price, actual_price, priority, status, assignee_name, external_link, target_date, notes, created_by_id, created_by_name } = req.body;
  if (!name || !category || estimated_price === undefined) {
    return res.status(400).json({ error: 'Nome, categoria e prezzo stimato sono obbligatori.' });
  }

  const newItem: PurchaseItem = {
    id: `pur_${Date.now()}_${Math.random().toString(36).substr(2, 4)}`,
    name,
    description,
    category,
    estimated_price: Number(estimated_price),
    actual_price: actual_price ? Number(actual_price) : undefined,
    priority: priority || 'media',
    status: status || 'proposto',
    assignee_name,
    external_link,
    target_date,
    notes,
    created_by_id: created_by_id || 'usr_user',
    created_by_name: created_by_name || 'Membro',
    created_at: new Date().toISOString(),
  };

  const state = db.getState();
  state.purchases.unshift(newItem);
  db.save();

  db.addAuditLog({
    user_id: newItem.created_by_id,
    user_name: newItem.created_by_name,
    category: 'purchase',
    action: 'Proposta nuovo acquisto',
    details: `Inserito acquisto: "${newItem.name}" (€${newItem.estimated_price}) [${newItem.status}]`,
  });

  res.status(201).json(newItem);
});

apiRouter.put('/purchases/:id/status', (req: Request, res: Response) => {
  const { id } = req.params;
  const { status, actual_price, user_name } = req.body;
  const state = db.getState();
  const item = state.purchases.find(p => p.id === id);
  if (!item) return res.status(404).json({ error: 'Acquisto non trovato.' });

  const oldStatus = item.status;
  item.status = status;
  if (actual_price !== undefined) item.actual_price = Number(actual_price);

  db.save();

  db.addAuditLog({
    user_id: 'usr_admin',
    user_name: user_name || 'Amministratore',
    category: 'purchase',
    action: 'Aggiornamento stato acquisto',
    details: `Acquisto "${item.name}" aggiornato da ${oldStatus} a ${status}`,
  });

  res.json(item);
});

apiRouter.delete('/purchases/:id', (req: Request, res: Response) => {
  const { id } = req.params;
  const state = db.getState();
  const idx = state.purchases.findIndex(p => p.id === id);
  if (idx === -1) return res.status(404).json({ error: 'Acquisto non trovato.' });

  const [removed] = state.purchases.splice(idx, 1);
  db.save();

  db.addAuditLog({
    user_id: 'usr_admin',
    user_name: 'Amministratore',
    category: 'purchase',
    action: 'Rimozione acquisto',
    details: `Rimosso acquisto: "${removed.name}"`,
  });

  res.json({ success: true });
});

// ==========================================
// 9. FINANCIAL GOALS (OBIETTIVI)
// ==========================================

apiRouter.get('/goals', (_req: Request, res: Response) => {
  const state = db.getState();
  res.json(state.goals);
});

apiRouter.post('/goals', (req: Request, res: Response) => {
  const { title, description, target_amount, deadline, created_by_name } = req.body;
  if (!title || !target_amount) {
    return res.status(400).json({ error: 'Titolo e importo obiettivo sono obbligatori.' });
  }

  const newGoal: FinancialGoal = {
    id: `goal_${Date.now()}_${Math.random().toString(36).substr(2, 4)}`,
    title,
    description,
    target_amount: Number(target_amount),
    collected_amount: 0,
    deadline,
    is_completed: false,
    created_by_name: created_by_name || 'Amministrazione',
    created_at: new Date().toISOString(),
    contributions: [],
  };

  const state = db.getState();
  state.goals.unshift(newGoal);
  db.save();

  db.addAuditLog({
    user_id: 'usr_admin',
    user_name: newGoal.created_by_name,
    category: 'goal',
    action: 'Creazione obiettivo economico',
    details: `Nuovo obiettivo lanciato: "${newGoal.title}" con target di €${newGoal.target_amount}`,
  });

  res.status(201).json(newGoal);
});

apiRouter.post('/goals/:id/contribute', (req: Request, res: Response) => {
  const { id } = req.params;
  const { amount, user_name, notes, register_financial_tx, method } = req.body;
  const val = Number(amount);
  if (!val || val <= 0) return res.status(400).json({ error: 'Importo non valido.' });

  const state = db.getState();
  const goal = state.goals.find(g => g.id === id);
  if (!goal) return res.status(404).json({ error: 'Obiettivo non trovato.' });

  const contribution = {
    id: `cnt_${Date.now()}_${Math.random().toString(36).substr(2, 4)}`,
    amount: val,
    date: new Date().toISOString().split('T')[0],
    user_name: user_name || 'Socio',
    notes,
    created_at: new Date().toISOString(),
  };

  goal.contributions.push(contribution);
  goal.collected_amount += val;
  if (goal.collected_amount >= goal.target_amount) {
    goal.is_completed = true;
  }

  // Optionally record as incoming financial transaction
  if (register_financial_tx) {
    state.financial_transactions.unshift({
      id: `tx_${Date.now()}`,
      type: 'income',
      amount: val,
      date: new Date().toISOString().split('T')[0],
      category: 'Contributi',
      description: `Contributo obiettivo "${goal.title}" (${user_name})`,
      method: method === 'cash' ? 'cash' : 'bank',
      recorded_by_id: 'usr_admin',
      recorded_by_name: user_name || 'Socio',
      receipt_note: notes,
      created_at: new Date().toISOString(),
    });
  }

  db.save();

  db.addAuditLog({
    user_id: 'usr_member',
    user_name: user_name || 'Socio',
    category: 'goal',
    action: 'Versamento quota obiettivo',
    details: `Versati €${val} per "${goal.title}" da parte di ${user_name}. Totale raccolto: €${goal.collected_amount}/${goal.target_amount}`,
  });

  res.json(goal);
});

// ==========================================
// 10. FINANCES (BANCA, FONDO CASSA, TRANSAZIONI)
// ==========================================

apiRouter.get('/finances/summary', (_req: Request, res: Response) => {
  const summary = db.getFinancialSummary();
  res.json(summary);
});

apiRouter.get('/finances/transactions', (_req: Request, res: Response) => {
  const state = db.getState();
  res.json(state.financial_transactions);
});

apiRouter.post('/finances/transactions', (req: Request, res: Response) => {
  const { type, amount, date, category, description, method, recorded_by_id, recorded_by_name, receipt_note } = req.body;
  const numAmount = Number(amount);
  if (!type || !numAmount || numAmount <= 0 || !category || !description) {
    return res.status(400).json({ error: 'Compila tutti i dati obbligatori della transazione.' });
  }

  const newTx: FinancialTransaction = {
    id: `tx_${Date.now()}_${Math.random().toString(36).substr(2, 4)}`,
    type: type === 'income' ? 'income' : 'expense',
    amount: numAmount,
    date: date || new Date().toISOString().split('T')[0],
    category,
    description,
    method: method === 'cash' ? 'cash' : 'bank',
    recorded_by_id: recorded_by_id || 'usr_admin',
    recorded_by_name: recorded_by_name || 'Amministratore',
    receipt_note,
    created_at: new Date().toISOString(),
  };

  const state = db.getState();
  state.financial_transactions.unshift(newTx);
  db.save();

  db.addAuditLog({
    user_id: newTx.recorded_by_id,
    user_name: newTx.recorded_by_name,
    category: 'finance',
    action: newTx.type === 'income' ? 'Registrazione entrata' : 'Registrazione uscita',
    details: `Ha registrato un'${newTx.type === 'income' ? 'entrata' : 'uscita'} di €${newTx.amount}. Categoria: ${newTx.category}. Metodo: ${newTx.method === 'bank' ? 'Banca' : 'Cassa'}. Descrizione: ${newTx.description}`,
  });

  res.status(201).json({
    transaction: newTx,
    summary: db.getFinancialSummary(),
  });
});

// ==========================================
// 11. AUDIT LOGS
// ==========================================

apiRouter.get('/audit-logs', (_req: Request, res: Response) => {
  const state = db.getState();
  res.json(state.audit_logs);
});

// ==========================================
// 12. DATABASE SEED / RESET
// ==========================================

apiRouter.post('/database/seed', (_req: Request, res: Response) => {
  const fresh = db.resetToSeed();
  res.json({ message: 'Database ripristinato con successo ai dati iniziali certificati.', state: fresh });
});
