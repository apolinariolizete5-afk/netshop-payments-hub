-- profiles
CREATE TABLE public.profiles (
  id UUID PRIMARY KEY REFERENCES auth.users ON DELETE CASCADE,
  full_name TEXT,
  phone TEXT,
  province TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.profiles TO authenticated;
GRANT ALL ON public.profiles TO service_role;
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
CREATE POLICY "profiles_own" ON public.profiles FOR ALL TO authenticated USING (auth.uid() = id) WITH CHECK (auth.uid() = id);

-- jobs
CREATE TABLE public.jobs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  slug TEXT NOT NULL UNIQUE,
  title TEXT NOT NULL,
  company TEXT NOT NULL,
  description TEXT NOT NULL,
  requirements TEXT,
  category TEXT NOT NULL,
  province TEXT NOT NULL,
  employment_type TEXT NOT NULL DEFAULT 'Tempo inteiro',
  salary_range TEXT,
  apply_url TEXT,
  apply_email TEXT,
  is_published BOOLEAN NOT NULL DEFAULT true,
  is_featured BOOLEAN NOT NULL DEFAULT false,
  views INTEGER NOT NULL DEFAULT 0,
  expires_at DATE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
GRANT SELECT ON public.jobs TO anon;
GRANT SELECT ON public.jobs TO authenticated;
GRANT ALL ON public.jobs TO service_role;
ALTER TABLE public.jobs ENABLE ROW LEVEL SECURITY;
CREATE POLICY "jobs_public_read" ON public.jobs FOR SELECT TO anon, authenticated USING (is_published = true);
CREATE INDEX jobs_created_idx ON public.jobs (created_at DESC);

-- applications
CREATE TABLE public.applications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users ON DELETE CASCADE,
  job_id UUID NOT NULL REFERENCES public.jobs ON DELETE CASCADE,
  message TEXT,
  status TEXT NOT NULL DEFAULT 'enviada',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (user_id, job_id)
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.applications TO authenticated;
GRANT ALL ON public.applications TO service_role;
ALTER TABLE public.applications ENABLE ROW LEVEL SECURITY;
CREATE POLICY "applications_own" ON public.applications FOR ALL TO authenticated USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

-- cvs
CREATE TABLE public.cvs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users ON DELETE CASCADE,
  title TEXT NOT NULL DEFAULT 'O meu CV',
  template TEXT NOT NULL DEFAULT 'moderno',
  data JSONB NOT NULL DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.cvs TO authenticated;
GRANT ALL ON public.cvs TO service_role;
ALTER TABLE public.cvs ENABLE ROW LEVEL SECURITY;
CREATE POLICY "cvs_own" ON public.cvs FOR ALL TO authenticated USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

-- purchases
CREATE TABLE public.purchases (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users ON DELETE CASCADE,
  cv_id UUID REFERENCES public.cvs ON DELETE SET NULL,
  reference TEXT NOT NULL UNIQUE,
  charge_id TEXT,
  method TEXT NOT NULL,
  msisdn TEXT,
  amount INTEGER NOT NULL,
  currency TEXT NOT NULL DEFAULT 'MZN',
  status TEXT NOT NULL DEFAULT 'pending',
  provider_payload JSONB,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  paid_at TIMESTAMPTZ
);
GRANT SELECT ON public.purchases TO authenticated;
GRANT ALL ON public.purchases TO service_role;
ALTER TABLE public.purchases ENABLE ROW LEVEL SECURITY;
CREATE POLICY "purchases_own_read" ON public.purchases FOR SELECT TO authenticated USING (auth.uid() = user_id);
CREATE INDEX purchases_user_idx ON public.purchases (user_id, status);

-- updated_at helper
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER LANGUAGE plpgsql SET search_path = public AS $$
BEGIN NEW.updated_at = now(); RETURN NEW; END; $$;
CREATE TRIGGER cvs_updated_at BEFORE UPDATE ON public.cvs FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER profiles_updated_at BEFORE UPDATE ON public.profiles FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- profile on signup
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  INSERT INTO public.profiles (id, full_name)
  VALUES (NEW.id, COALESCE(NEW.raw_user_meta_data->>'full_name', ''))
  ON CONFLICT (id) DO NOTHING;
  RETURN NEW;
END; $$;
CREATE TRIGGER on_auth_user_created AFTER INSERT ON auth.users FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- seed jobs
INSERT INTO public.jobs (slug, title, company, description, requirements, category, province, employment_type, salary_range, apply_email, is_featured) VALUES
('tecnico-de-contabilidade-maputo','Técnico de Contabilidade','Grupo Zambeze','Responsável pelo registo de operações contabilísticas, conciliações bancárias e apoio ao fecho mensal.','Licenciatura em Contabilidade e Auditoria; 2 anos de experiência; domínio de Primavera.','Contabilidade e Finanças','Maputo Cidade','Tempo inteiro','35.000 – 50.000 MZN','recrutamento@grupozambeze.co.mz',true),
('enfermeiro-geral-beira','Enfermeiro Geral','Clínica Sol Nascente','Prestação de cuidados de enfermagem em regime de turnos na unidade de internamento.','Curso de Enfermagem Geral; inscrição válida na Ordem; disponibilidade para turnos.','Saúde','Sofala','Turnos','28.000 – 40.000 MZN','rh@solnascente.co.mz',true),
('electricista-industrial-tete','Electricista Industrial','Moza Energia','Manutenção preventiva e correctiva de instalações eléctricas industriais.','Curso técnico em Electricidade; 3 anos de experiência industrial; carta de condução.','Engenharia e Indústria','Tete','Tempo inteiro','30.000 – 45.000 MZN','vagas@mozaenergia.co.mz',false),
('gestor-de-loja-nampula','Gestor de Loja','Retail Norte','Gestão diária da loja, equipa de vendas, stocks e cumprimento de metas comerciais.','Experiência em retalho; liderança de equipas; conhecimentos de gestão de stock.','Comércio e Vendas','Nampula','Tempo inteiro','40.000 – 60.000 MZN','recrutamento@retailnorte.co.mz',false),
('programador-web-maputo','Programador Web','Nhambavale Tech','Desenvolvimento e manutenção de aplicações web para clientes nacionais.','JavaScript/React; APIs REST; Git; portefólio de projectos.','Tecnologias de Informação','Maputo Cidade','Tempo inteiro','55.000 – 85.000 MZN','jobs@nhambavale.tech',true),
('professor-de-matematica-quelimane','Professor de Matemática','Escola Secundária Horizonte','Leccionar Matemática ao 2.º ciclo do ensino secundário.','Licenciatura em Ensino de Matemática; experiência mínima de 1 ano.','Educação','Zambézia','Tempo parcial','22.000 – 30.000 MZN','direccao@horizonte.ac.mz',false),
('motorista-de-pesados-matola','Motorista de Pesados','Transportes Limpopo','Transporte de carga nacional e regional com veículos pesados.','Carta de condução categoria C+E; certificado de motorista profissional; 3 anos de experiência.','Transportes e Logística','Maputo Província','Tempo inteiro','25.000 – 35.000 MZN','rh@translimpopo.co.mz',false),
('assistente-administrativa-pemba','Assistente Administrativa','Costa Norte Serviços','Apoio administrativo, atendimento e organização documental do escritório.','12.ª classe concluída; domínio de Excel e Word; boa comunicação.','Administração','Cabo Delgado','Tempo inteiro','18.000 – 26.000 MZN','geral@costanorte.co.mz',false),
('tecnico-agronomo-chimoio','Técnico Agrónomo','AgroManica','Acompanhamento técnico a produtores e gestão de campos de demonstração.','Curso médio ou superior em Agronomia; disponibilidade para deslocações rurais.','Agricultura','Manica','Tempo inteiro','30.000 – 42.000 MZN','recrutamento@agromanica.co.mz',false),
('recepcionista-hotel-inhambane','Recepcionista de Hotel','Hotel Baía Azul','Check-in/check-out, reservas e atendimento a hóspedes nacionais e estrangeiros.','Inglês fluente; experiência em hotelaria; disponibilidade para fins-de-semana.','Turismo e Hotelaria','Inhambane','Turnos','20.000 – 28.000 MZN','reservas@baiaazul.co.mz',false),
('operador-de-caixa-xai-xai','Operador de Caixa','Supermercado Gaza Mais','Atendimento em caixa, controlo de valores e apoio ao cliente.','12.ª classe; boa capacidade de cálculo; simpatia no atendimento.','Comércio e Vendas','Gaza','Tempo inteiro','12.000 – 18.000 MZN','rh@gazamais.co.mz',false),
('tecnico-de-redes-lichinga','Técnico de Redes','Niassa Connect','Instalação e manutenção de redes e equipamentos de internet.','Conhecimentos de redes TCP/IP; instalação de fibra e rádio; disponibilidade para trabalho de campo.','Tecnologias de Informação','Niassa','Tempo inteiro','25.000 – 38.000 MZN','suporte@niassaconnect.co.mz',false);