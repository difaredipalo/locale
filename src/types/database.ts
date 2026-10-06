export type UserRole = 'admin' | 'manager' | 'user';

export interface UserProfile {
  id: string;
  email: string;
  username: string;
  first_name: string;
  last_name: string;
  role: UserRole;
  avatar_url?: string;
  is_active: boolean;
  phone?: string;
  created_at: string;
  last_login_at?: string;
}

export type NoticeboardCategory =
  | 'Informazione'
  | 'Importante'
  | 'Emergenza'
  | 'Acquisti'
  | 'Eventi'
  | 'Pulizie'
  | 'Economico';

export type NoticeboardPriority = 'bassa' | 'normale' | 'alta' | 'urgente';

export interface NotificationItem {
  id: string;
  title: string;
  content: string;
  category: NoticeboardCategory;
  priority: NoticeboardPriority;
  is_pinned: boolean;
  is_archived: boolean;
  created_by_id: string;
  created_by_name: string;
  created_at: string;
  expires_at?: string;
  read_by: string[]; // user IDs who have read this
}

export type EventCategory =
  | '🎉 Evento'
  | '🏠 Utilizzo del locale'
  | '🧹 Pulizia'
  | '🔧 Manutenzione'
  | '💰 Pagamento/scadenza'
  | '📌 Altro';

export type EventStatus = 'confirmed' | 'pending' | 'cancelled';

export interface CalendarEvent {
  id: string;
  title: string;
  description: string;
  date: string; // YYYY-MM-DD
  start_time: string; // HH:mm
  end_time: string; // HH:mm
  category: EventCategory;
  created_by_id: string;
  created_by_name: string;
  participants: string[];
  notes?: string;
  status: EventStatus;
  related_request_id?: string;
}

export type RequestStatus = 'pending' | 'approved' | 'rejected' | 'cancelled';

export interface VenueRequest {
  id: string;
  user_id: string;
  user_name: string;
  user_email: string;
  date: string; // YYYY-MM-DD
  start_time: string; // HH:mm
  end_time: string; // HH:mm
  reason: string;
  attendees_count: number;
  notes?: string;
  status: RequestStatus;
  rejection_reason?: string;
  reviewed_by_id?: string;
  reviewed_by_name?: string;
  reviewed_at?: string;
  created_at: string;
}

export interface CleaningChecklistItem {
  id: string;
  label: string;
  completed: boolean;
  completed_at?: string;
  completed_by_name?: string;
}

export type CleaningShiftStatus = 'upcoming' | 'completed' | 'missed';

export interface CleaningShift {
  id: string;
  assigned_user_id: string;
  assigned_user_name: string;
  date: string; // YYYY-MM-DD
  time: string; // HH:mm
  notes?: string;
  status: CleaningShiftStatus;
  checklist: CleaningChecklistItem[];
  created_at: string;
  updated_at?: string;
}

export interface PollOption {
  id: string;
  text: string;
  votes_count: number;
}

export interface PollVote {
  user_id: string;
  user_name: string;
  option_id: string;
  voted_at: string;
}

export interface Poll {
  id: string;
  question: string;
  description?: string;
  options: PollOption[];
  opened_at: string;
  closes_at: string;
  is_closed: boolean;
  allow_change_vote: boolean;
  is_anonymous: boolean;
  created_by_id: string;
  created_by_name: string;
  created_at: string;
  votes: PollVote[];
}

export interface RegulationSection {
  id: string;
  order: number;
  title: string;
  content: string;
  last_updated_at: string;
  last_updated_by_name: string;
}

export interface RegulationVersion {
  id: string;
  version: number;
  created_at: string;
  author_name: string;
  change_summary: string;
  sections_snapshot: RegulationSection[];
}

export type PurchaseCategory =
  | 'Attrezzature'
  | 'Arredamento'
  | 'Elettrodomestici'
  | 'Svago & Audio'
  | 'Consumabili'
  | 'Altro';

export type PurchasePriority = 'bassa' | 'media' | 'alta' | 'urgente';

export type PurchaseStatus =
  | 'proposto'
  | 'da_valutare'
  | 'da_acquistare'
  | 'ordinato'
  | 'acquistato'
  | 'annullato';

export interface PurchaseItem {
  id: string;
  name: string;
  description?: string;
  category: PurchaseCategory;
  estimated_price: number;
  actual_price?: number;
  priority: PurchasePriority;
  status: PurchaseStatus;
  assignee_name?: string;
  external_link?: string;
  image_url?: string;
  target_date?: string;
  notes?: string;
  created_by_id: string;
  created_by_name: string;
  created_at: string;
}

export interface GoalContribution {
  id: string;
  amount: number;
  date: string;
  user_name: string;
  notes?: string;
  created_at: string;
}

export interface FinancialGoal {
  id: string;
  title: string;
  description?: string;
  target_amount: number;
  collected_amount: number;
  deadline?: string;
  is_completed: boolean;
  created_by_name: string;
  created_at: string;
  contributions: GoalContribution[];
}

export type TransactionType = 'income' | 'expense';
export type TransactionMethod = 'bank' | 'cash';
export type TransactionCategory =
  | 'Acquisti'
  | 'Bollette'
  | 'Manutenzione'
  | 'Eventi'
  | 'Pulizie'
  | 'Contributi'
  | 'Quote Mensili'
  | 'Altro';

export interface FinancialTransaction {
  id: string;
  type: TransactionType;
  amount: number;
  date: string;
  category: TransactionCategory;
  description: string;
  method: TransactionMethod;
  recorded_by_id: string;
  recorded_by_name: string;
  receipt_note?: string;
  created_at: string;
}

export interface FinancialSummary {
  bank_balance: number;
  cash_balance: number;
  total_balance: number;
  monthly_income: number;
  monthly_expense: number;
  initial_bank_balance: number;
  initial_cash_balance: number;
}

export type AuditLogCategory =
  | 'finance'
  | 'venue'
  | 'cleaning'
  | 'regulation'
  | 'user'
  | 'poll'
  | 'purchase'
  | 'goal'
  | 'election';

export interface AuditLog {
  id: string;
  timestamp: string;
  user_id: string;
  user_name: string;
  category: AuditLogCategory;
  action: string;
  details: string;
}

export type ElectionStatus = 'upcoming' | 'active' | 'closed';

export interface ElectionCandidate {
  id: string;
  user_id: string;
  name: string;
  manifesto_summary?: string;
  votes_count: number;
}

export interface PresidentialElection {
  id: string;
  quarter: string; // e.g. "Q4 2026"
  title: string;
  term_period: string; // e.g. "1 Ottobre 2026 - 31 Dicembre 2026"
  description: string;
  start_date: string;
  end_date: string;
  status: ElectionStatus;
  candidates: ElectionCandidate[];
  blank_votes: number; // schede bianche
  voter_ids: string[]; // IDs of users who cast their vote
  winner_candidate_id?: string;
  winner_name?: string;
  created_at: string;
  closed_at?: string;
}

// ==========================================
// MULTI-CHANNEL NOTIFICATION SYSTEM
// ==========================================

export type NotificationChannel = 'in_app' | 'web_push' | 'telegram' | 'whatsapp' | 'email';

export type NotificationCategory =
  | 'presence'
  | 'venue'
  | 'cleaning'
  | 'polls'
  | 'purchases'
  | 'finances'
  | 'calendar'
  | 'admin';

export type NotificationPriority = 'low' | 'normal' | 'high' | 'critical';

export type NotificationStatus = 'pending' | 'processing' | 'sent' | 'failed' | 'cancelled';

export type DeliveryStatus = 'pending' | 'sent' | 'failed' | 'skipped';

export interface NotificationDelivery {
  id: string;
  notification_id: string;
  recipient_id: string;
  recipient_name: string;
  channel: NotificationChannel;
  status: DeliveryStatus;
  attempts: number;
  max_attempts: number;
  last_error?: string;
  sent_at?: string;
  created_at: string;
}

export interface MultiChannelNotification {
  id: string;
  title: string;
  message: string;
  category: NotificationCategory;
  priority: NotificationPriority;
  target_type: 'all' | 'role' | 'users';
  target_role?: UserRole;
  recipient_ids: string[];
  channels: NotificationChannel[];
  status: NotificationStatus;
  created_by_id?: string;
  created_by_name?: string;
  created_at: string;
  scheduled_at?: string;
  sent_at?: string;
  metadata?: Record<string, any>;
  deliveries?: NotificationDelivery[];
}

export interface UserNotificationPreference {
  id: string;
  user_id: string;
  channels: {
    in_app: boolean;
    web_push: boolean;
    telegram: boolean;
    whatsapp: boolean;
    email: boolean;
  };
  categories: {
    presence: boolean;
    venue: boolean;
    cleaning: boolean;
    polls: boolean;
    purchases: boolean;
    calendar: boolean;
    finances: boolean;
    admin: boolean;
  };
  critical_always_all: boolean;
  updated_at: string;
}

export interface PushSubscriptionRecord {
  id: string;
  user_id: string;
  endpoint: string;
  keys: {
    p256dh: string;
    auth: string;
  };
  user_agent?: string;
  created_at: string;
}

export interface TelegramConnection {
  id: string;
  user_id: string;
  telegram_user_id?: string;
  telegram_username?: string;
  telegram_first_name?: string;
  verification_token?: string;
  is_connected: boolean;
  connected_at?: string;
}

export interface WhatsAppConnection {
  id: string;
  user_id: string;
  phone_number: string;
  is_opted_in: boolean;
  opted_in_at?: string;
}

export interface NotificationChannelConfig {
  web_push: {
    enabled: boolean;
    public_key: string;
    private_key: string;
    subject: string;
  };
  telegram: {
    enabled: boolean;
    bot_token: string;
    bot_username: string;
    webhook_active: boolean;
  };
  whatsapp: {
    enabled: boolean;
    phone_number_id: string;
    business_account_id: string;
    access_token: string;
    default_template_name: string;
  };
  email: {
    enabled: boolean;
    from_address: string;
    smtp_host?: string;
    smtp_user?: string;
    smtp_configured: boolean;
  };
}

export interface UserPresence {
  id: string;
  user_id: string;
  user_name: string;
  avatar_url?: string;
  status: 'active' | 'extended' | 'ended';
  started_at: string;
  expected_until: string;
  ended_at?: string;
  notes?: string;
}

export interface DatabaseState {
  users: UserProfile[];
  notifications: NotificationItem[];
  events: CalendarEvent[];
  venue_requests: VenueRequest[];
  cleaning_shifts: CleaningShift[];
  polls: Poll[];
  regulation_sections: RegulationSection[];
  regulation_versions: RegulationVersion[];
  purchases: PurchaseItem[];
  goals: FinancialGoal[];
  elections: PresidentialElection[];
  financial_accounts: {
    initial_bank: number;
    initial_cash: number;
  };
  financial_transactions: FinancialTransaction[];
  audit_logs: AuditLog[];
  // Multi-channel notification entities
  notifications_multichannel: MultiChannelNotification[];
  notification_deliveries: NotificationDelivery[];
  notification_preferences: UserNotificationPreference[];
  push_subscriptions: PushSubscriptionRecord[];
  telegram_connections: TelegramConnection[];
  whatsapp_connections: WhatsAppConnection[];
  notification_channel_configs: NotificationChannelConfig;
  user_presences: UserPresence[];
}
