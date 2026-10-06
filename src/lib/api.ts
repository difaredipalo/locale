import type {
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
  AuditLog,
  UserRole,
  PresidentialElection,
  MultiChannelNotification,
  NotificationDelivery,
  UserNotificationPreference,
  NotificationChannelConfig,
  UserPresence,
  NotificationChannel,
} from '../types/database';

async function fetchJson<T>(url: string, options?: RequestInit): Promise<T> {
  const res = await fetch(url, {
    headers: {
      'Content-Type': 'application/json',
      ...options?.headers,
    },
    ...options,
  });

  if (!res.ok) {
    let errMsg = `Errore di rete (${res.status})`;
    try {
      const data = await res.json();
      if (data?.error) errMsg = data.error;
    } catch {
      // fallback
    }
    throw new Error(errMsg);
  }

  return res.json();
}

export const api = {
  // Auth & Profile
  login: (identifier: string) =>
    fetchJson<{ user: UserProfile }>('/api/auth/login', {
      method: 'POST',
      body: JSON.stringify({ identifier }),
    }),

  register: (payload: { email: string; username: string; first_name: string; last_name: string }) =>
    fetchJson<{ user: UserProfile }>('/api/auth/register', {
      method: 'POST',
      body: JSON.stringify(payload),
    }),

  resetPassword: (email: string) =>
    fetchJson<{ message: string }>('/api/auth/reset-password', {
      method: 'POST',
      body: JSON.stringify({ email }),
    }),

  updateProfile: (payload: { id: string; first_name: string; last_name: string; phone?: string; avatar_url?: string }) =>
    fetchJson<{ user: UserProfile }>('/api/auth/profile', {
      method: 'PUT',
      body: JSON.stringify(payload),
    }),

  // Users
  getUsers: () => fetchJson<UserProfile[]>('/api/users'),

  updateUserRole: (id: string, role: UserRole, updated_by_name: string) =>
    fetchJson<{ user: UserProfile }>(`/api/users/${id}/role`, {
      method: 'PUT',
      body: JSON.stringify({ role, updated_by_name }),
    }),

  toggleUserStatus: (id: string, is_active: boolean, updated_by_name: string) =>
    fetchJson<{ user: UserProfile }>(`/api/users/${id}/status`, {
      method: 'PUT',
      body: JSON.stringify({ is_active, updated_by_name }),
    }),

  // Notifications
  getNotifications: () => fetchJson<NotificationItem[]>('/api/notifications'),

  createNotification: (payload: Partial<NotificationItem>) =>
    fetchJson<NotificationItem>('/api/notifications', {
      method: 'POST',
      body: JSON.stringify(payload),
    }),

  markNotificationAsRead: (id: string, user_id: string) =>
    fetchJson<NotificationItem>(`/api/notifications/${id}/read`, {
      method: 'PUT',
      body: JSON.stringify({ user_id }),
    }),

  toggleNotificationPin: (id: string) =>
    fetchJson<NotificationItem>(`/api/notifications/${id}/pin`, {
      method: 'PUT',
    }),

  deleteNotification: (id: string) =>
    fetchJson<{ success: boolean }>(`/api/notifications/${id}`, {
      method: 'DELETE',
    }),

  // Events & Calendar
  getEvents: () => fetchJson<CalendarEvent[]>('/api/events'),

  createEvent: (payload: Partial<CalendarEvent>) =>
    fetchJson<CalendarEvent>('/api/events', {
      method: 'POST',
      body: JSON.stringify(payload),
    }),

  deleteEvent: (id: string) =>
    fetchJson<{ success: boolean }>(`/api/events/${id}`, {
      method: 'DELETE',
    }),

  // Venue Requests
  getVenueRequests: () => fetchJson<VenueRequest[]>('/api/venue-requests'),

  checkAvailability: (date: string, start_time: string, end_time: string) =>
    fetchJson<{ available: boolean; conflictReason?: string }>(
      `/api/venue-requests/check-availability?date=${encodeURIComponent(date)}&start_time=${encodeURIComponent(start_time)}&end_time=${encodeURIComponent(end_time)}`
    ),

  createVenueRequest: (payload: Partial<VenueRequest>) =>
    fetchJson<VenueRequest>('/api/venue-requests', {
      method: 'POST',
      body: JSON.stringify(payload),
    }),

  reviewVenueRequest: (id: string, action: 'approve' | 'reject' | 'cancel', rejection_reason?: string, reviewer_id?: string, reviewer_name?: string) =>
    fetchJson<{ request: VenueRequest }>(`/api/venue-requests/${id}/review`, {
      method: 'PUT',
      body: JSON.stringify({ action, rejection_reason, reviewer_id, reviewer_name }),
    }),

  // Cleaning Shifts
  getCleaningShifts: () => fetchJson<CleaningShift[]>('/api/cleaning-shifts'),

  createCleaningShift: (payload: Partial<CleaningShift>) =>
    fetchJson<CleaningShift>('/api/cleaning-shifts', {
      method: 'POST',
      body: JSON.stringify(payload),
    }),

  toggleChecklistItem: (shiftId: string, itemId: string, completed: boolean, user_name?: string) =>
    fetchJson<CleaningShift>(`/api/cleaning-shifts/${shiftId}/checklist/${itemId}`, {
      method: 'PUT',
      body: JSON.stringify({ completed, user_name }),
    }),

  updateCleaningStatus: (shiftId: string, status: string, notes?: string) =>
    fetchJson<CleaningShift>(`/api/cleaning-shifts/${shiftId}/status`, {
      method: 'PUT',
      body: JSON.stringify({ status, notes }),
    }),

  // Polls
  getPolls: () => fetchJson<Poll[]>('/api/polls'),

  createPoll: (payload: { question: string; description?: string; options: string[]; closes_at?: string; allow_change_vote?: boolean; is_anonymous?: boolean; created_by_id?: string; created_by_name?: string }) =>
    fetchJson<Poll>('/api/polls', {
      method: 'POST',
      body: JSON.stringify(payload),
    }),

  votePoll: (pollId: string, option_id: string, user_id: string, user_name: string) =>
    fetchJson<Poll>(`/api/polls/${pollId}/vote`, {
      method: 'POST',
      body: JSON.stringify({ option_id, user_id, user_name }),
    }),

  toggleClosePoll: (pollId: string) =>
    fetchJson<Poll>(`/api/polls/${pollId}/close`, {
      method: 'PUT',
    }),

  // Regulations
  getRegulations: () =>
    fetchJson<{ sections: RegulationSection[]; versions: RegulationVersion[] }>('/api/regulations'),

  updateRegulationSection: (id: string, payload: { title?: string; content: string; author_name: string; change_summary: string }) =>
    fetchJson<{ section: RegulationSection; version: RegulationVersion }>(`/api/regulations/${id}`, {
      method: 'PUT',
      body: JSON.stringify(payload),
    }),

  // Purchases
  getPurchases: () => fetchJson<PurchaseItem[]>('/api/purchases'),

  createPurchase: (payload: Partial<PurchaseItem>) =>
    fetchJson<PurchaseItem>('/api/purchases', {
      method: 'POST',
      body: JSON.stringify(payload),
    }),

  updatePurchaseStatus: (id: string, status: string, actual_price?: number, user_name?: string) =>
    fetchJson<PurchaseItem>(`/api/purchases/${id}/status`, {
      method: 'PUT',
      body: JSON.stringify({ status, actual_price, user_name }),
    }),

  deletePurchase: (id: string) =>
    fetchJson<{ success: boolean }>(`/api/purchases/${id}`, {
      method: 'DELETE',
    }),

  // Goals
  getGoals: () => fetchJson<FinancialGoal[]>('/api/goals'),

  createGoal: (payload: Partial<FinancialGoal>) =>
    fetchJson<FinancialGoal>('/api/goals', {
      method: 'POST',
      body: JSON.stringify(payload),
    }),

  contributeToGoal: (id: string, payload: { amount: number; user_name: string; notes?: string; register_financial_tx?: boolean; method?: 'bank' | 'cash' }) =>
    fetchJson<FinancialGoal>(`/api/goals/${id}/contribute`, {
      method: 'POST',
      body: JSON.stringify(payload),
    }),

  // Finances
  getFinancialSummary: () => fetchJson<FinancialSummary>('/api/finances/summary'),

  getFinancialTransactions: () => fetchJson<FinancialTransaction[]>('/api/finances/transactions'),

  createFinancialTransaction: (payload: Partial<FinancialTransaction>) =>
    fetchJson<{ transaction: FinancialTransaction; summary: FinancialSummary }>('/api/finances/transactions', {
      method: 'POST',
      body: JSON.stringify(payload),
    }),

  // Audit Logs
  getAuditLogs: () => fetchJson<AuditLog[]>('/api/audit-logs'),

  // Presidential Elections
  getElections: () => fetchJson<PresidentialElection[]>('/api/elections'),

  createElection: (payload: {
    quarter: string;
    title: string;
    term_period: string;
    description?: string;
    start_date?: string;
    end_date?: string;
    candidates: { user_id: string; name: string; manifesto_summary?: string }[];
    created_by_id?: string;
    created_by_name?: string;
  }) =>
    fetchJson<PresidentialElection>('/api/elections', {
      method: 'POST',
      body: JSON.stringify(payload),
    }),

  voteElection: (electionId: string, payload: { user_id: string; user_name: string; candidate_id: string }) =>
    fetchJson<PresidentialElection>(`/api/elections/${electionId}/vote`, {
      method: 'POST',
      body: JSON.stringify(payload),
    }),

  closeElection: (electionId: string, payload: { closed_by_id: string; closed_by_name: string }) =>
    fetchJson<PresidentialElection>(`/api/elections/${electionId}/close`, {
      method: 'PUT',
      body: JSON.stringify(payload),
    }),

  // Multi-Channel Notification Center
  getNotificationCenterData: () =>
    fetchJson<{
      notifications: MultiChannelNotification[];
      deliveries: NotificationDelivery[];
      stats: { total_notifications: number; sent_deliveries: number; failed_deliveries: number; pending_deliveries: number };
    }>('/api/notifications/center'),

  broadcastNotification: (payload: {
    title: string;
    message: string;
    category: string;
    priority: string;
    target_type: string;
    target_role?: string;
    target_user_ids?: string[];
    channels?: NotificationChannel[];
    scheduled_at?: string;
    actor_id?: string;
    actor_name?: string;
  }) =>
    fetchJson<MultiChannelNotification>('/api/notifications/center/broadcast', {
      method: 'POST',
      body: JSON.stringify(payload),
    }),

  retryDelivery: (deliveryId: string) =>
    fetchJson<NotificationDelivery>(`/api/notifications/deliveries/${deliveryId}/retry`, {
      method: 'POST',
    }),

  getUserNotificationPreferences: (userId: string) =>
    fetchJson<UserNotificationPreference>(`/api/notifications/preferences/${userId}`),

  updateUserNotificationPreferences: (userId: string, payload: Partial<UserNotificationPreference>) =>
    fetchJson<UserNotificationPreference>(`/api/notifications/preferences/${userId}`, {
      method: 'PUT',
      body: JSON.stringify(payload),
    }),

  getNotificationChannelConfig: () =>
    fetchJson<{
      web_push: { enabled: boolean; public_key: string; subject: string; has_private_key: boolean };
      telegram: { enabled: boolean; bot_username: string; webhook_active: boolean; has_bot_token: boolean };
      whatsapp: { enabled: boolean; phone_number_id: string; business_account_id: string; default_template_name: string; has_access_token: boolean };
      email: { enabled: boolean; from_address: string; smtp_configured: boolean };
    }>('/api/notifications/config'),

  updateNotificationChannelConfig: (payload: any) =>
    fetchJson<{ message: string }>('/api/notifications/config', {
      method: 'PUT',
      body: JSON.stringify(payload),
    }),

  testNotificationChannel: (channel: NotificationChannel, recipient_id: string) =>
    fetchJson<{ message: string; notification: MultiChannelNotification }>('/api/notifications/test-channel', {
      method: 'POST',
      body: JSON.stringify({ channel, recipient_id }),
    }),

  // Web Push
  getWebPushPublicKey: () => fetchJson<{ publicKey: string }>('/api/notifications/web-push/public-key'),

  subscribeWebPush: (user_id: string, subscription: any, user_agent?: string) =>
    fetchJson<{ success: boolean; message: string }>('/api/notifications/web-push/subscribe', {
      method: 'POST',
      body: JSON.stringify({ user_id, subscription, user_agent }),
    }),

  unsubscribeWebPush: (endpoint: string) =>
    fetchJson<{ success: boolean }>('/api/notifications/web-push/unsubscribe', {
      method: 'DELETE',
      body: JSON.stringify({ endpoint }),
    }),

  // Telegram Linking
  getTelegramToken: (user_id: string) =>
    fetchJson<{ token: string; deepLink: string; botUsername: string }>('/api/notifications/telegram/token', {
      method: 'POST',
      body: JSON.stringify({ user_id }),
    }),

  simulateTelegramLink: (user_id: string, telegram_username?: string) =>
    fetchJson<{ success: boolean; connection: any }>('/api/notifications/telegram/simulate-link', {
      method: 'POST',
      body: JSON.stringify({ user_id, telegram_username }),
    }),

  disconnectTelegram: (user_id: string) =>
    fetchJson<{ success: boolean; message: string }>('/api/notifications/telegram/disconnect', {
      method: 'POST',
      body: JSON.stringify({ user_id }),
    }),

  // WhatsApp Opt-in
  optInWhatsApp: (user_id: string, phone_number: string, is_opted_in: boolean) =>
    fetchJson<{ success: boolean; connection: any }>('/api/notifications/whatsapp/opt-in', {
      method: 'POST',
      body: JSON.stringify({ user_id, phone_number, is_opted_in }),
    }),

  // Presences ("Sono al Locale")
  getPresences: () => fetchJson<UserPresence[]>('/api/presences'),

  startPresence: (payload: { user_id: string; user_name: string; expected_hours?: number; expected_until?: string; notes?: string }) =>
    fetchJson<UserPresence>('/api/presences', {
      method: 'POST',
      body: JSON.stringify(payload),
    }),

  extendPresence: (id: string, payload: { extra_hours?: number; new_expected_until?: string }) =>
    fetchJson<UserPresence>(`/api/presences/${id}/extend`, {
      method: 'PUT',
      body: JSON.stringify(payload),
    }),

  endPresence: (id: string) =>
    fetchJson<UserPresence>(`/api/presences/${id}/end`, {
      method: 'PUT',
    }),

  // Seed / Reset
  resetDatabase: () => fetchJson<{ message: string }>('/api/database/seed', { method: 'POST' }),
};
