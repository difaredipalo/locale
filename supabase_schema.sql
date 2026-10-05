-- ====================================================================
-- SCHEMA COMPLETO DATABASE POSTGRESQL / SUPABASE PER "IL COVO"
-- Eseguire questo script nel "SQL Editor" della dashboard di Supabase.
-- ====================================================================

-- 1. ENUM DEI RUOLI
CREATE TYPE user_role_type AS ENUM ('admin', 'manager', 'user');

-- 2. TABELLA PROFILI UTENTE (collegata a auth.users)
CREATE TABLE public.profiles (
  id UUID REFERENCES auth.users(id) ON DELETE CASCADE PRIMARY KEY,
  email TEXT UNIQUE NOT NULL,
  username TEXT UNIQUE NOT NULL,
  first_name TEXT NOT NULL,
  last_name TEXT NOT NULL,
  role user_role_type DEFAULT 'user'::user_role_type NOT NULL,
  avatar_url TEXT,
  phone TEXT,
  is_active BOOLEAN DEFAULT true NOT NULL,
  created_at TIMESTAMPTZ DEFAULT timezone('utc'::text, now()) NOT NULL,
  last_login_at TIMESTAMPTZ
);

-- RLS Profilo
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Tutti i membri possono visualizzare i profili"
  ON public.profiles FOR SELECT
  USING (auth.role() = 'authenticated');

CREATE POLICY "L'utente può aggiornare il proprio profilo"
  ON public.profiles FOR UPDATE
  USING (auth.uid() = id);

CREATE POLICY "Gli amministratori possono gestire tutti i profili"
  ON public.profiles FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE profiles.id = auth.uid() AND profiles.role = 'admin'
    )
  );

-- 3. NOTIFICHE
CREATE TABLE public.notifications (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  title TEXT NOT NULL,
  content TEXT NOT NULL,
  category TEXT NOT NULL,
  priority TEXT DEFAULT 'normale' NOT NULL,
  is_pinned BOOLEAN DEFAULT false NOT NULL,
  is_archived BOOLEAN DEFAULT false NOT NULL,
  created_by_id UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
  created_by_name TEXT NOT NULL,
  expires_at TIMESTAMPTZ,
  read_by UUID[] DEFAULT '{}' NOT NULL,
  created_at TIMESTAMPTZ DEFAULT timezone('utc'::text, now()) NOT NULL
);

ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Membri autenticati possono leggere le notifiche"
  ON public.notifications FOR SELECT USING (auth.role() = 'authenticated');
CREATE POLICY "Admin e gestori possono inserire e gestire notifiche"
  ON public.notifications FOR ALL USING (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE profiles.id = auth.uid() AND profiles.role IN ('admin', 'manager')
    )
  );

-- 4. CALENDARIO ED EVENTI
CREATE TABLE public.events (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  title TEXT NOT NULL,
  description TEXT,
  date DATE NOT NULL,
  start_time TIME NOT NULL,
  end_time TIME NOT NULL,
  category TEXT NOT NULL,
  created_by_id UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
  created_by_name TEXT NOT NULL,
  participants TEXT[] DEFAULT '{}' NOT NULL,
  notes TEXT,
  status TEXT DEFAULT 'confirmed' NOT NULL,
  related_request_id UUID,
  created_at TIMESTAMPTZ DEFAULT timezone('utc'::text, now()) NOT NULL
);

ALTER TABLE public.events ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Membri autenticati possono leggere gli eventi"
  ON public.events FOR SELECT USING (auth.role() = 'authenticated');
CREATE POLICY "Admin e gestori possono gestire tutti gli eventi"
  ON public.events FOR ALL USING (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE profiles.id = auth.uid() AND profiles.role IN ('admin', 'manager')
    )
  );

-- 5. RICHIESTE DI UTILIZZO DEL LOCALE
CREATE TABLE public.venue_requests (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
  user_name TEXT NOT NULL,
  user_email TEXT NOT NULL,
  date DATE NOT NULL,
  start_time TIME NOT NULL,
  end_time TIME NOT NULL,
  reason TEXT NOT NULL,
  attendees_count INT DEFAULT 1 NOT NULL,
  notes TEXT,
  status TEXT DEFAULT 'pending' NOT NULL,
  rejection_reason TEXT,
  reviewed_by_id UUID REFERENCES public.profiles(id),
  reviewed_by_name TEXT,
  reviewed_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT timezone('utc'::text, now()) NOT NULL
);

ALTER TABLE public.venue_requests ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Tutti i membri possono visualizzare le richieste per evitare sovrapposizioni"
  ON public.venue_requests FOR SELECT USING (auth.role() = 'authenticated');
CREATE POLICY "I membri possono inviare richieste per se stessi"
  ON public.venue_requests FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Admin e gestori possono aggiornare e approvare richieste"
  ON public.venue_requests FOR UPDATE USING (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE profiles.id = auth.uid() AND profiles.role IN ('admin', 'manager')
    )
  );

-- 6. TURNI DI PULIZIA E CHECKLIST
CREATE TABLE public.cleaning_shifts (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  assigned_user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
  assigned_user_name TEXT NOT NULL,
  date DATE NOT NULL,
  time TIME NOT NULL,
  notes TEXT,
  status TEXT DEFAULT 'upcoming' NOT NULL,
  checklist JSONB DEFAULT '[]'::jsonb NOT NULL,
  created_at TIMESTAMPTZ DEFAULT timezone('utc'::text, now()) NOT NULL,
  updated_at TIMESTAMPTZ
);

ALTER TABLE public.cleaning_shifts ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Tutti possono vedere i turni di pulizia"
  ON public.cleaning_shifts FOR SELECT USING (auth.role() = 'authenticated');
CREATE POLICY "L'assegnatario o admin/gestore possono aggiornare la checklist"
  ON public.cleaning_shifts FOR UPDATE USING (
    auth.uid() = assigned_user_id OR EXISTS (
      SELECT 1 FROM public.profiles
      WHERE profiles.id = auth.uid() AND profiles.role IN ('admin', 'manager')
    )
  );

-- 7. SONDAGGI E VOTI
CREATE TABLE public.polls (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  question TEXT NOT NULL,
  description TEXT,
  options JSONB NOT NULL, -- [{ id, text, votes_count }]
  opened_at TIMESTAMPTZ DEFAULT timezone('utc'::text, now()) NOT NULL,
  closes_at TIMESTAMPTZ NOT NULL,
  is_closed BOOLEAN DEFAULT false NOT NULL,
  allow_change_vote BOOLEAN DEFAULT false NOT NULL,
  is_anonymous BOOLEAN DEFAULT false NOT NULL,
  created_by_id UUID REFERENCES public.profiles(id),
  created_by_name TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT timezone('utc'::text, now()) NOT NULL
);

CREATE TABLE public.poll_votes (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  poll_id UUID REFERENCES public.polls(id) ON DELETE CASCADE NOT NULL,
  user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
  user_name TEXT NOT NULL,
  option_id TEXT NOT NULL,
  voted_at TIMESTAMPTZ DEFAULT timezone('utc'::text, now()) NOT NULL,
  UNIQUE(poll_id, user_id)
);

ALTER TABLE public.polls ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.poll_votes ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Tutti possono leggere sondaggi e voti" ON public.polls FOR SELECT USING (auth.role() = 'authenticated');
CREATE POLICY "Tutti possono votare una volta" ON public.poll_votes FOR INSERT WITH CHECK (auth.uid() = user_id);

-- 8. REGOLAMENTO E VERSIONI
CREATE TABLE public.regulation_sections (
  id TEXT PRIMARY KEY,
  "order" INT NOT NULL,
  title TEXT NOT NULL,
  content TEXT NOT NULL,
  last_updated_at TIMESTAMPTZ DEFAULT timezone('utc'::text, now()) NOT NULL,
  last_updated_by_name TEXT NOT NULL
);

CREATE TABLE public.regulation_versions (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  version INT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT timezone('utc'::text, now()) NOT NULL,
  author_name TEXT NOT NULL,
  change_summary TEXT NOT NULL,
  sections_snapshot JSONB NOT NULL
);

ALTER TABLE public.regulation_sections ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.regulation_versions ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Tutti possono leggere il regolamento" ON public.regulation_sections FOR SELECT USING (auth.role() = 'authenticated');
CREATE POLICY "Admin possono modificare il regolamento" ON public.regulation_sections FOR ALL USING (
  EXISTS (SELECT 1 FROM public.profiles WHERE profiles.id = auth.uid() AND profiles.role = 'admin')
);

-- 9. ACQUISTI
CREATE TABLE public.purchases (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  description TEXT,
  category TEXT NOT NULL,
  estimated_price NUMERIC(10,2) NOT NULL,
  actual_price NUMERIC(10,2),
  priority TEXT DEFAULT 'media' NOT NULL,
  status TEXT DEFAULT 'proposto' NOT NULL,
  assignee_name TEXT,
  external_link TEXT,
  image_url TEXT,
  target_date DATE,
  notes TEXT,
  created_by_id UUID REFERENCES public.profiles(id),
  created_by_name TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT timezone('utc'::text, now()) NOT NULL
);

ALTER TABLE public.purchases ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Tutti possono leggere gli acquisti" ON public.purchases FOR SELECT USING (auth.role() = 'authenticated');
CREATE POLICY "Tutti possono proporre acquisti" ON public.purchases FOR INSERT WITH CHECK (auth.role() = 'authenticated');
CREATE POLICY "Admin e gestori possono approvare e gestire acquisti" ON public.purchases FOR ALL USING (
  EXISTS (SELECT 1 FROM public.profiles WHERE profiles.id = auth.uid() AND profiles.role IN ('admin', 'manager'))
);

-- 10. OBIETTIVI ECONOMICI
CREATE TABLE public.goals (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  title TEXT NOT NULL,
  description TEXT,
  target_amount NUMERIC(10,2) NOT NULL,
  collected_amount NUMERIC(10,2) DEFAULT 0 NOT NULL,
  deadline DATE,
  is_completed BOOLEAN DEFAULT false NOT NULL,
  created_by_name TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT timezone('utc'::text, now()) NOT NULL
);

CREATE TABLE public.goal_contributions (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  goal_id UUID REFERENCES public.goals(id) ON DELETE CASCADE NOT NULL,
  amount NUMERIC(10,2) NOT NULL,
  date DATE NOT NULL,
  user_name TEXT NOT NULL,
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT timezone('utc'::text, now()) NOT NULL
);

ALTER TABLE public.goals ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.goal_contributions ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Tutti possono leggere gli obiettivi" ON public.goals FOR SELECT USING (auth.role() = 'authenticated');

-- 11. FINANZE (BANCA E FONDO CASSA)
CREATE TABLE public.financial_transactions (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  type TEXT NOT NULL, -- 'income' | 'expense'
  amount NUMERIC(10,2) NOT NULL,
  date DATE NOT NULL,
  category TEXT NOT NULL,
  description TEXT NOT NULL,
  method TEXT NOT NULL, -- 'bank' | 'cash'
  recorded_by_id UUID REFERENCES public.profiles(id),
  recorded_by_name TEXT NOT NULL,
  receipt_note TEXT,
  created_at TIMESTAMPTZ DEFAULT timezone('utc'::text, now()) NOT NULL
);

ALTER TABLE public.financial_transactions ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Solo Admin e Gestori possono visualizzare e inserire transazioni"
  ON public.financial_transactions FOR ALL USING (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE profiles.id = auth.uid() AND profiles.role IN ('admin', 'manager')
    )
  );

-- 12. AUDIT LOGS (REGISTRO ATTIVITÀ)
CREATE TABLE public.audit_logs (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  timestamp TIMESTAMPTZ DEFAULT timezone('utc'::text, now()) NOT NULL,
  user_id UUID,
  user_name TEXT NOT NULL,
  category TEXT NOT NULL,
  action TEXT NOT NULL,
  details TEXT NOT NULL
);

ALTER TABLE public.audit_logs ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Solo Admin e Gestori possono leggere i log di audit"
  ON public.audit_logs FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE profiles.id = auth.uid() AND profiles.role IN ('admin', 'manager')
    )
  );
