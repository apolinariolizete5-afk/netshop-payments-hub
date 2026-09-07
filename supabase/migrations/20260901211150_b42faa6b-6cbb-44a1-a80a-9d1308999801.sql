
ALTER TABLE public.jobs ADD COLUMN IF NOT EXISTS image_url text;
ALTER TABLE public.jobs ADD COLUMN IF NOT EXISTS views_count integer NOT NULL DEFAULT 0;

DROP POLICY IF EXISTS "Admins manage jobs" ON public.jobs;
CREATE POLICY "Admins manage jobs" ON public.jobs FOR ALL TO authenticated
USING (public.has_role(auth.uid(), 'admin')) WITH CHECK (public.has_role(auth.uid(), 'admin'));

DROP POLICY IF EXISTS "Admins manage companies" ON public.companies;
CREATE POLICY "Admins manage companies" ON public.companies FOR ALL TO authenticated
USING (public.has_role(auth.uid(), 'admin')) WITH CHECK (public.has_role(auth.uid(), 'admin'));

DROP POLICY IF EXISTS "Admins view profiles" ON public.profiles;
CREATE POLICY "Admins view profiles" ON public.profiles FOR SELECT TO authenticated
USING (public.has_role(auth.uid(), 'admin'));

DROP POLICY IF EXISTS "Admins update profiles" ON public.profiles;
CREATE POLICY "Admins update profiles" ON public.profiles FOR UPDATE TO authenticated
USING (public.has_role(auth.uid(), 'admin')) WITH CHECK (public.has_role(auth.uid(), 'admin'));

DROP POLICY IF EXISTS "Admins manage roles" ON public.user_roles;
CREATE POLICY "Admins manage roles" ON public.user_roles FOR ALL TO authenticated
USING (public.has_role(auth.uid(), 'admin')) WITH CHECK (public.has_role(auth.uid(), 'admin'));

CREATE OR REPLACE FUNCTION public.increment_job_view(_slug text)
RETURNS void LANGUAGE sql SECURITY DEFINER SET search_path = public AS $$
  UPDATE public.jobs SET views_count = views_count + 1 WHERE slug = _slug AND status = 'publicada'::job_status;
$$;
GRANT EXECUTE ON FUNCTION public.increment_job_view(text) TO anon, authenticated;
