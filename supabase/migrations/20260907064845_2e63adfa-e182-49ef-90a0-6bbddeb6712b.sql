-- RESET: remove old incompatible tables
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
DROP TABLE IF EXISTS public.purchases CASCADE;
DROP TABLE IF EXISTS public.applications CASCADE;
DROP TABLE IF EXISTS public.cvs CASCADE;
DROP TABLE IF EXISTS public.jobs CASCADE;
DROP TABLE IF EXISTS public.profiles CASCADE;

DO $$ BEGIN CREATE TYPE public.app_role AS ENUM ('admin','employer','user'); EXCEPTION WHEN duplicate_object THEN NULL; END $$;
DO $$ BEGIN CREATE TYPE public.job_type AS ENUM ('tempo_inteiro','meio_periodo','contrato','estagio','temporario','freelance'); EXCEPTION WHEN duplicate_object THEN NULL; END $$;
DO $$ BEGIN CREATE TYPE public.experience_level AS ENUM ('estagiario','junior','intermedio','senior','gestor'); EXCEPTION WHEN duplicate_object THEN NULL; END $$;
DO $$ BEGIN CREATE TYPE public.job_status AS ENUM ('rascunho','publicada','fechada'); EXCEPTION WHEN duplicate_object THEN NULL; END $$;
DO $$ BEGIN CREATE TYPE public.application_status AS ENUM ('enviada','em_analise','entrevista','rejeitada','aceite'); EXCEPTION WHEN duplicate_object THEN NULL; END $$;

CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER LANGUAGE plpgsql SET search_path = public AS $$
BEGIN NEW.updated_at = now(); RETURN NEW; END; $$;

-- PROFILES
CREATE TABLE public.profiles (
  id UUID PRIMARY KEY REFERENCES auth.users ON DELETE CASCADE,
  full_name TEXT, headline TEXT, phone TEXT, location TEXT, avatar_url TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.profiles TO authenticated;
GRANT ALL ON public.profiles TO service_role;
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
CREATE POLICY "profiles_select_own" ON public.profiles FOR SELECT TO authenticated USING (auth.uid() = id);
CREATE POLICY "profiles_insert_own" ON public.profiles FOR INSERT TO authenticated WITH CHECK (auth.uid() = id);
CREATE POLICY "profiles_update_own" ON public.profiles FOR UPDATE TO authenticated USING (auth.uid() = id) WITH CHECK (auth.uid() = id);
CREATE TRIGGER profiles_updated_at BEFORE UPDATE ON public.profiles FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  INSERT INTO public.profiles (id, full_name, avatar_url)
  VALUES (NEW.id, COALESCE(NEW.raw_user_meta_data ->> 'full_name', NEW.raw_user_meta_data ->> 'name'), NEW.raw_user_meta_data ->> 'avatar_url')
  ON CONFLICT (id) DO NOTHING;
  RETURN NEW;
END; $$;
CREATE TRIGGER on_auth_user_created AFTER INSERT ON auth.users FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- USER ROLES
CREATE TABLE IF NOT EXISTS public.user_roles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users ON DELETE CASCADE,
  role public.app_role NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (user_id, role)
);
GRANT SELECT ON public.user_roles TO authenticated;
GRANT ALL ON public.user_roles TO service_role;
ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "user_roles_select_own" ON public.user_roles;
CREATE POLICY "user_roles_select_own" ON public.user_roles FOR SELECT TO authenticated USING (auth.uid() = user_id);

CREATE OR REPLACE FUNCTION public.has_role(_user_id UUID, _role public.app_role)
RETURNS BOOLEAN LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT EXISTS (SELECT 1 FROM public.user_roles WHERE user_id = _user_id AND role = _role)
$$;

-- Primeira conta admin (uma única vez)
CREATE OR REPLACE FUNCTION public.admin_exists()
RETURNS BOOLEAN LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT EXISTS (SELECT 1 FROM public.user_roles WHERE role = 'admin')
$$;

CREATE OR REPLACE FUNCTION public.claim_first_admin()
RETURNS BOOLEAN LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE _uid uuid := auth.uid();
BEGIN
  IF _uid IS NULL THEN RETURN false; END IF;
  IF EXISTS (SELECT 1 FROM public.user_roles WHERE role = 'admin') THEN RETURN false; END IF;
  INSERT INTO public.user_roles (user_id, role) VALUES (_uid, 'admin') ON CONFLICT DO NOTHING;
  RETURN true;
END; $$;

CREATE OR REPLACE FUNCTION public.grant_admin_by_email(_email text)
RETURNS BOOLEAN LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE _target uuid;
BEGIN
  IF NOT public.has_role(auth.uid(), 'admin') THEN RETURN false; END IF;
  SELECT id INTO _target FROM auth.users WHERE lower(email) = lower(_email) LIMIT 1;
  IF _target IS NULL THEN RETURN false; END IF;
  INSERT INTO public.user_roles (user_id, role) VALUES (_target, 'admin') ON CONFLICT DO NOTHING;
  RETURN true;
END; $$;

CREATE OR REPLACE FUNCTION public.revoke_admin(_user_id uuid)
RETURNS BOOLEAN LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  IF NOT public.has_role(auth.uid(), 'admin') THEN RETURN false; END IF;
  IF _user_id = auth.uid() THEN RETURN false; END IF;
  DELETE FROM public.user_roles WHERE user_id = _user_id AND role = 'admin';
  RETURN true;
END; $$;

CREATE OR REPLACE FUNCTION public.list_admins()
RETURNS TABLE (user_id uuid, email text, created_at timestamptz)
LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT ur.user_id, u.email::text, ur.created_at
  FROM public.user_roles ur JOIN auth.users u ON u.id = ur.user_id
  WHERE ur.role = 'admin' AND public.has_role(auth.uid(), 'admin')
  ORDER BY ur.created_at
$$;

-- COMPANIES
CREATE TABLE public.companies (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL, slug TEXT NOT NULL UNIQUE, logo_url TEXT, description TEXT,
  location TEXT, industry TEXT, website TEXT, verified BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(), updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
GRANT SELECT ON public.companies TO anon;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.companies TO authenticated;
GRANT ALL ON public.companies TO service_role;
ALTER TABLE public.companies ENABLE ROW LEVEL SECURITY;
CREATE POLICY "companies_public_read" ON public.companies FOR SELECT USING (true);
CREATE POLICY "companies_admin_write" ON public.companies FOR ALL TO authenticated
  USING (public.has_role(auth.uid(),'admin')) WITH CHECK (public.has_role(auth.uid(),'admin'));
CREATE TRIGGER companies_updated_at BEFORE UPDATE ON public.companies FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- JOBS
CREATE TABLE public.jobs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title TEXT NOT NULL, slug TEXT NOT NULL UNIQUE,
  company_id UUID REFERENCES public.companies(id) ON DELETE SET NULL,
  company_name TEXT NOT NULL, location TEXT NOT NULL, category TEXT NOT NULL,
  job_type public.job_type NOT NULL DEFAULT 'tempo_inteiro',
  experience_level public.experience_level NOT NULL DEFAULT 'junior',
  salary_min INTEGER, salary_max INTEGER, salary_currency TEXT NOT NULL DEFAULT 'MZN',
  summary TEXT NOT NULL, description TEXT NOT NULL,
  responsibilities TEXT[] NOT NULL DEFAULT '{}',
  requirements TEXT[] NOT NULL DEFAULT '{}',
  benefits TEXT[] NOT NULL DEFAULT '{}',
  how_to_apply TEXT, apply_url TEXT, apply_email TEXT, image_url TEXT,
  views_count INTEGER NOT NULL DEFAULT 0,
  is_featured BOOLEAN NOT NULL DEFAULT false,
  status public.job_status NOT NULL DEFAULT 'rascunho',
  published_at TIMESTAMPTZ NOT NULL DEFAULT now(), expires_at TIMESTAMPTZ,
  created_by UUID REFERENCES auth.users ON DELETE SET NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(), updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX jobs_status_published_idx ON public.jobs (status, published_at DESC);
CREATE INDEX jobs_category_idx ON public.jobs (category);
CREATE INDEX jobs_location_idx ON public.jobs (location);
GRANT SELECT ON public.jobs TO anon;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.jobs TO authenticated;
GRANT ALL ON public.jobs TO service_role;
ALTER TABLE public.jobs ENABLE ROW LEVEL SECURITY;
CREATE POLICY "jobs_public_read_published" ON public.jobs FOR SELECT USING (status = 'publicada');
CREATE POLICY "jobs_admin_read_all" ON public.jobs FOR SELECT TO authenticated USING (public.has_role(auth.uid(),'admin'));
CREATE POLICY "jobs_admin_write" ON public.jobs FOR ALL TO authenticated
  USING (public.has_role(auth.uid(),'admin')) WITH CHECK (public.has_role(auth.uid(),'admin'));
CREATE TRIGGER jobs_updated_at BEFORE UPDATE ON public.jobs FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE OR REPLACE FUNCTION public.increment_job_view(_slug text)
RETURNS void LANGUAGE sql SECURITY DEFINER SET search_path = public AS $$
  UPDATE public.jobs SET views_count = views_count + 1 WHERE slug = _slug AND status = 'publicada'::job_status;
$$;
GRANT EXECUTE ON FUNCTION public.increment_job_view(text) TO anon, authenticated;

-- SAVED JOBS
CREATE TABLE public.saved_jobs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users ON DELETE CASCADE,
  job_id UUID NOT NULL REFERENCES public.jobs(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(), UNIQUE (user_id, job_id)
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.saved_jobs TO authenticated;
GRANT ALL ON public.saved_jobs TO service_role;
ALTER TABLE public.saved_jobs ENABLE ROW LEVEL SECURITY;
CREATE POLICY "saved_jobs_own" ON public.saved_jobs FOR ALL TO authenticated USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

-- APPLICATIONS
CREATE TABLE public.applications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users ON DELETE CASCADE,
  job_id UUID NOT NULL REFERENCES public.jobs(id) ON DELETE CASCADE,
  status public.application_status NOT NULL DEFAULT 'enviada',
  cover_message TEXT, full_name TEXT, email TEXT, phone TEXT,
  documents JSONB NOT NULL DEFAULT '[]'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(), updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (user_id, job_id)
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.applications TO authenticated;
GRANT ALL ON public.applications TO service_role;
ALTER TABLE public.applications ENABLE ROW LEVEL SECURITY;
CREATE POLICY "applications_own" ON public.applications FOR ALL TO authenticated USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
CREATE POLICY "applications_admin_read" ON public.applications FOR SELECT TO authenticated USING (public.has_role(auth.uid(),'admin'));
CREATE TRIGGER applications_updated_at BEFORE UPDATE ON public.applications FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- NOTIFICATIONS
CREATE TABLE public.notifications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users ON DELETE CASCADE,
  title TEXT NOT NULL, body TEXT, type TEXT NOT NULL DEFAULT 'geral', link TEXT,
  read BOOLEAN NOT NULL DEFAULT false, created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX notifications_user_idx ON public.notifications (user_id, created_at DESC);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.notifications TO authenticated;
GRANT ALL ON public.notifications TO service_role;
ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;
CREATE POLICY "notifications_own" ON public.notifications FOR ALL TO authenticated USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

-- CVS
CREATE TABLE public.cvs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users ON DELETE CASCADE,
  title TEXT NOT NULL DEFAULT 'O meu CV',
  template TEXT NOT NULL DEFAULT 'moderno',
  data JSONB NOT NULL DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(), updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.cvs TO authenticated;
GRANT ALL ON public.cvs TO service_role;
ALTER TABLE public.cvs ENABLE ROW LEVEL SECURITY;
CREATE POLICY "cvs_own" ON public.cvs FOR ALL TO authenticated USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
CREATE TRIGGER cvs_updated_at BEFORE UPDATE ON public.cvs FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- APP SETTINGS
CREATE TABLE IF NOT EXISTS public.app_settings (
  key text PRIMARY KEY, value text NOT NULL, updated_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT ON public.app_settings TO anon, authenticated;
GRANT ALL ON public.app_settings TO service_role;
ALTER TABLE public.app_settings ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "app_settings public read" ON public.app_settings;
CREATE POLICY "app_settings public read" ON public.app_settings FOR SELECT TO anon, authenticated USING (true);
DROP POLICY IF EXISTS "admins manage settings" ON public.app_settings;
CREATE POLICY "admins manage settings" ON public.app_settings FOR ALL TO authenticated USING (public.has_role(auth.uid(),'admin')) WITH CHECK (public.has_role(auth.uid(),'admin'));
INSERT INTO public.app_settings (key, value) VALUES
  ('cv_price_mzn','150'),
  ('social_facebook',''),('social_whatsapp',''),('social_instagram',''),('social_linkedin',''),('social_tiktok','')
ON CONFLICT (key) DO NOTHING;

-- CV PURCHASES
CREATE TABLE IF NOT EXISTS public.cv_purchases (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE,
  reference text NOT NULL UNIQUE, provider_id text, method text,
  amount numeric NOT NULL DEFAULT 0, status text NOT NULL DEFAULT 'pending',
  created_at timestamptz NOT NULL DEFAULT now(), paid_at timestamptz
);
GRANT SELECT, INSERT, UPDATE ON public.cv_purchases TO authenticated;
GRANT ALL ON public.cv_purchases TO service_role;
ALTER TABLE public.cv_purchases ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "own purchases select" ON public.cv_purchases;
CREATE POLICY "own purchases select" ON public.cv_purchases FOR SELECT TO authenticated USING (auth.uid() = user_id);
DROP POLICY IF EXISTS "own purchases insert" ON public.cv_purchases;
CREATE POLICY "own purchases insert" ON public.cv_purchases FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);
DROP POLICY IF EXISTS "own purchases update" ON public.cv_purchases;
CREATE POLICY "own purchases update" ON public.cv_purchases FOR UPDATE TO authenticated USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

CREATE OR REPLACE FUNCTION public.netshop_apply_payment(_reference text, _status text, _method text DEFAULT NULL, _provider_id text DEFAULT NULL)
RETURNS boolean LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE _updated int;
BEGIN
  IF _status NOT IN ('paid','failed') THEN RETURN false; END IF;
  UPDATE public.cv_purchases
     SET status = _status, method = COALESCE(_method, method), provider_id = COALESCE(_provider_id, provider_id),
         paid_at = CASE WHEN _status = 'paid' THEN COALESCE(paid_at, now()) ELSE paid_at END
   WHERE reference = _reference AND status = 'pending';
  GET DIAGNOSTICS _updated = ROW_COUNT;
  RETURN _updated > 0;
END; $$;
REVOKE ALL ON FUNCTION public.netshop_apply_payment(text,text,text,text) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.netshop_apply_payment(text,text,text,text) TO service_role;

REVOKE ALL ON FUNCTION public.handle_new_user() FROM PUBLIC, anon, authenticated;
REVOKE ALL ON FUNCTION public.update_updated_at_column() FROM PUBLIC, anon, authenticated;
REVOKE ALL ON FUNCTION public.has_role(uuid, public.app_role) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.has_role(uuid, public.app_role) TO authenticated;
REVOKE ALL ON FUNCTION public.claim_first_admin() FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.claim_first_admin() TO authenticated;
REVOKE ALL ON FUNCTION public.admin_exists() FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.admin_exists() TO anon, authenticated;
REVOKE ALL ON FUNCTION public.grant_admin_by_email(text) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.grant_admin_by_email(text) TO authenticated;
REVOKE ALL ON FUNCTION public.revoke_admin(uuid) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.revoke_admin(uuid) TO authenticated;
REVOKE ALL ON FUNCTION public.list_admins() FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.list_admins() TO authenticated;

-- DEMO DATA
INSERT INTO public.companies (name, slug, description, location, industry, website, verified) VALUES
('Banco Horizonte','banco-horizonte','Banco moçambicano focado em soluções digitais.','Maputo','Banca e Finanças','https://exemplo.co.mz',true),
('TecnoMoz','tecnomoz','Empresa de tecnologia que desenvolve software para o mercado africano.','Maputo','Tecnologia','https://exemplo.co.mz',true),
('Costa Logística','costa-logistica','Operador logístico com presença nos principais portos do país.','Beira','Transportes e Logística',NULL,false),
('Rede Saúde Moçambique','rede-saude-mocambique','Rede de clínicas privadas com unidades em várias províncias.','Nampula','Saúde',NULL,true),
('Agro Zambeze','agro-zambeze','Produção e exportação agrícola no vale do Zambeze.','Tete','Agricultura',NULL,false);

INSERT INTO public.jobs (title, slug, company_id, company_name, location, category, job_type, experience_level, salary_min, salary_max, summary, description, responsibilities, requirements, benefits, how_to_apply, apply_email, is_featured, status, published_at) VALUES
('Programador Front-end React','programador-front-end-react-tecnomoz',(SELECT id FROM public.companies WHERE slug='tecnomoz'),'TecnoMoz','Maputo','Tecnologia da Informação','tempo_inteiro','intermedio',85000,130000,'Desenvolvimento de interfaces web modernas em React.',E'Procuramos um programador front-end para integrar a nossa equipa de produto em Maputo.',ARRAY['Desenvolver interfaces em React e TypeScript','Colaborar com a equipa de design','Escrever testes'],ARRAY['2+ anos de experiência com React','Bom domínio de HTML, CSS e JavaScript','Português fluente'],ARRAY['Seguro de saúde','Trabalho híbrido'],'Envie o seu CV atualizado indicando a vaga no assunto.','recrutamento@tecnomoz.co.mz',true,'publicada',now() - interval '1 day'),
('Gestor de Conta Empresarial','gestor-conta-empresarial-banco-horizonte',(SELECT id FROM public.companies WHERE slug='banco-horizonte'),'Banco Horizonte','Maputo','Banca e Finanças','tempo_inteiro','senior',120000,180000,'Gestão da carteira de clientes empresariais.',E'O Banco Horizonte procura um gestor de conta empresarial para a direção comercial em Maputo.',ARRAY['Gerir carteira de clientes empresariais','Identificar novas oportunidades','Preparar propostas de crédito'],ARRAY['Licenciatura em Gestão ou Economia','5 anos em banca comercial','Capacidade de negociação'],ARRAY['Seguro de saúde familiar','Prémio anual'],NULL,'talentos@bancohorizonte.co.mz',true,'publicada',now() - interval '3 days'),
('Técnico de Enfermagem','tecnico-enfermagem-rede-saude',(SELECT id FROM public.companies WHERE slug='rede-saude-mocambique'),'Rede Saúde Moçambique','Nampula','Saúde','tempo_inteiro','junior',35000,50000,'Cuidados de enfermagem em regime de turnos.',E'A Rede Saúde Moçambique procura técnicos de enfermagem para a unidade de Nampula.',ARRAY['Prestar cuidados de enfermagem','Apoiar consultas','Registar informação clínica'],ARRAY['Formação em enfermagem','Registo profissional válido','Disponibilidade para turnos'],ARRAY['Subsídio de turno','Formação interna'],'Entregue a candidatura na receção ou envie por email.','rh@redesaude.co.mz',false,'publicada',now() - interval '5 days'),
('Coordenador de Armazém','coordenador-armazem-costa-logistica',(SELECT id FROM public.companies WHERE slug='costa-logistica'),'Costa Logística','Beira','Transportes e Logística','contrato','intermedio',60000,90000,'Coordenação das operações de armazém na Beira.',E'Procuramos um coordenador de armazém para as instalações da Beira.',ARRAY['Coordenar entradas e saídas','Gerir inventário','Liderar equipa operacional'],ARRAY['Experiência em logística','Conhecimentos de Excel','Liderança'],ARRAY['Transporte assegurado','Refeição no local'],NULL,'recrutamento@costalogistica.co.mz',false,'publicada',now() - interval '8 days'),
('Estágio em Marketing Digital','estagio-marketing-digital-tecnomoz',(SELECT id FROM public.companies WHERE slug='tecnomoz'),'TecnoMoz','Maputo','Marketing e Comunicação','estagio','estagiario',NULL,15000,'Estágio de 6 meses em marketing digital.',E'Oportunidade de estágio para recém-licenciados em marketing ou comunicação.',ARRAY['Criar conteúdos para redes sociais','Apoiar campanhas','Analisar métricas'],ARRAY['Licenciatura concluída ou final','Boa escrita em português','Interesse por marketing'],ARRAY['Subsídio de estágio','Possibilidade de efetivação'],NULL,'estagios@tecnomoz.co.mz',false,'publicada',now() - interval '2 days'),
('Engenheiro Agrónomo','engenheiro-agronomo-agro-zambeze',(SELECT id FROM public.companies WHERE slug='agro-zambeze'),'Agro Zambeze','Tete','Agricultura','tempo_inteiro','senior',90000,140000,'Acompanhamento técnico das campanhas agrícolas.',E'A Agro Zambeze procura um engenheiro agrónomo para liderar a área técnica em Tete.',ARRAY['Planear campanhas de produção','Acompanhar equipas de campo','Controlar pragas'],ARRAY['Licenciatura em Agronomia','5 anos de experiência','Carta de condução'],ARRAY['Alojamento','Seguro de saúde'],NULL,'rh@agrozambeze.co.mz',true,'publicada',now() - interval '11 days'),
('Contabilista Sénior','contabilista-senior-banco-horizonte',(SELECT id FROM public.companies WHERE slug='banco-horizonte'),'Banco Horizonte','Matola','Contabilidade e Finanças','tempo_inteiro','senior',95000,140000,'Fecho de contas mensal e reporte financeiro.',E'Procuramos um contabilista sénior para a direção financeira, com base na Matola.',ARRAY['Fecho de contas','Preparar reportes fiscais','Apoiar auditorias'],ARRAY['Licenciatura em Contabilidade','Inscrição na OCAM valorizada','Experiência com SAF-T'],ARRAY['Seguro de saúde','Horário flexível'],NULL,'talentos@bancohorizonte.co.mz',false,'publicada',now() - interval '16 days'),
('Motorista de Pesados','motorista-pesados-costa-logistica',(SELECT id FROM public.companies WHERE slug='costa-logistica'),'Costa Logística','Beira','Transportes e Logística','tempo_inteiro','junior',28000,40000,'Transporte de mercadoria no centro do país.',E'A Costa Logística procura motoristas de pesados com carta profissional válida.',ARRAY['Transportar mercadoria em segurança','Verificar o veículo','Cumprir prazos'],ARRAY['Carta profissional','2 anos de experiência','Disponibilidade para viajar'],ARRAY['Ajudas de custo','Seguro de acidentes'],NULL,'recrutamento@costalogistica.co.mz',false,'publicada',now() - interval '20 days'),
('Assistente Administrativo','assistente-administrativo-tecnomoz',(SELECT id FROM public.companies WHERE slug='tecnomoz'),'TecnoMoz','Maputo','Administração','tempo_inteiro','junior',25000,38000,'Apoio administrativo ao escritório de Maputo.',E'Procuramos assistente administrativo para apoio geral ao escritório.',ARRAY['Organizar documentação','Atender chamadas','Apoiar a equipa financeira'],ARRAY['12ª classe concluída','Conhecimentos de Word e Excel','Boa comunicação'],ARRAY['Subsídio de transporte'],NULL,'recrutamento@tecnomoz.co.mz',false,'publicada',now() - interval '4 days'),
('Electricista Industrial','electricista-industrial-agro-zambeze',(SELECT id FROM public.companies WHERE slug='agro-zambeze'),'Agro Zambeze','Tete','Engenharia e Indústria','contrato','intermedio',45000,70000,'Manutenção eléctrica das instalações agrícolas.',E'Vaga para electricista industrial nas explorações de Tete.',ARRAY['Manutenção preventiva','Reparar avarias','Cumprir normas de segurança'],ARRAY['Curso técnico de electricidade','3 anos de experiência','Disponibilidade imediata'],ARRAY['Alojamento','Refeição'],NULL,'rh@agrozambeze.co.mz',false,'publicada',now() - interval '6 days'),
('Recepcionista de Clínica','rececionista-clinica-rede-saude',(SELECT id FROM public.companies WHERE slug='rede-saude-mocambique'),'Rede Saúde Moçambique','Beira','Saúde','meio_periodo','junior',20000,30000,'Atendimento ao público numa clínica na Beira.',E'Procuramos recepcionista para a unidade da Beira, em meio período.',ARRAY['Receber pacientes','Marcar consultas','Gerir pagamentos'],ARRAY['12ª classe','Boa apresentação','Experiência em atendimento'],ARRAY['Formação interna'],NULL,'rh@redesaude.co.mz',false,'publicada',now() - interval '9 days'),
('Analista de Dados','analista-dados-banco-horizonte',(SELECT id FROM public.companies WHERE slug='banco-horizonte'),'Banco Horizonte','Maputo','Tecnologia da Informação','tempo_inteiro','intermedio',80000,120000,'Análise de dados e relatórios para a direção.',E'O Banco Horizonte procura analista de dados para apoiar decisões de negócio.',ARRAY['Construir relatórios','Analisar indicadores','Automatizar processos'],ARRAY['Licenciatura em área quantitativa','SQL avançado','Power BI ou similar'],ARRAY['Seguro de saúde','Formação'],NULL,'talentos@bancohorizonte.co.mz',true,'publicada',now() - interval '7 days');