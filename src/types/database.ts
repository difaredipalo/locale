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

export type NotificationCategory =
  | 'Informazione'
  | 'Importante'
  | 'Emergenza'
  | 'Acquisti'
  | 'Eventi'
  | 'Pulizie'
  | 'Economico';

export type NotificationPriority = 'bassa' | 'normale' | 'alta' | 'urgente';

export interface NotificationItem {
  id: string;
  title: string;
  content: string;
  category: NotificationCategory;
  priority: NotificationPriority;
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
  | 'goal';

export interface AuditLog {
  id: string;
  timestamp: string;
  user_id: string;
  user_name: string;
  category: AuditLogCategory;
  action: string;
  details: string;
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
  financial_accounts: {
    initial_bank: number;
    initial_cash: number;
  };
  financial_transactions: FinancialTransaction[];
  audit_logs: AuditLog[];
}
