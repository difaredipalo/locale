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

  // Seed / Reset
  resetDatabase: () => fetchJson<{ message: string }>('/api/database/seed', { method: 'POST' }),
};
