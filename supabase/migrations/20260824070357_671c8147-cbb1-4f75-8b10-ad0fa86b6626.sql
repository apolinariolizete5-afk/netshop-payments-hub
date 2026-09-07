CREATE TABLE public.cv_purchases (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users(id) on delete cascade,
  reference text not null unique,
  provider_id text,
  method text,
  amount numeric not null default 0,
  status text not null default 'pending',
  created_at timestamptz not null default now(),
  paid_at timestamptz
);
GRANT SELECT ON public.cv_purchases TO authenticated;
GRANT ALL ON public.cv_purchases TO service_role;
ALTER TABLE public.cv_purchases ENABLE ROW LEVEL SECURITY;
CREATE POLICY "own purchases" ON public.cv_purchases FOR SELECT TO authenticated USING (auth.uid() = user_id);

CREATE TABLE public.app_settings (
  key text primary key,
  value text not null,
  updated_at timestamptz not null default now()
);
GRANT SELECT ON public.app_settings TO anon, authenticated;
GRANT ALL ON public.app_settings TO service_role;
ALTER TABLE public.app_settings ENABLE ROW LEVEL SECURITY;
CREATE POLICY "settings readable" ON public.app_settings FOR SELECT USING (true);
CREATE POLICY "admins manage settings" ON public.app_settings FOR ALL TO authenticated USING (public.has_role(auth.uid(),'admin')) WITH CHECK (public.has_role(auth.uid(),'admin'));

INSERT INTO public.app_settings (key, value) VALUES ('cv_price_mzn','150');