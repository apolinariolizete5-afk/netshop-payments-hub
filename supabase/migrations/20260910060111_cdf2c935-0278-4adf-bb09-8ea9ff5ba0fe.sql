
-- 1. Nova vaga publicada -> notifica todos os utilizadores
CREATE OR REPLACE FUNCTION public.notify_job_published()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF NEW.status = 'publicada'::job_status
     AND (TG_OP = 'INSERT' OR OLD.status IS DISTINCT FROM 'publicada'::job_status) THEN
    INSERT INTO public.notifications (user_id, title, body, type, link)
    SELECT p.id,
           'Nova vaga: ' || NEW.title,
           NEW.company_name || ' - ' || NEW.location,
           'vaga',
           '/vagas/' || NEW.slug || '.html'
    FROM public.profiles p;
  END IF;
  RETURN NEW;
END; $$;

DROP TRIGGER IF EXISTS jobs_notify_published ON public.jobs;
CREATE TRIGGER jobs_notify_published
AFTER INSERT OR UPDATE OF status ON public.jobs
FOR EACH ROW EXECUTE FUNCTION public.notify_job_published();

-- 2. Candidatura enviada -> confirma ao candidato
CREATE OR REPLACE FUNCTION public.notify_application_created()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE _title text; _slug text;
BEGIN
  SELECT title, slug INTO _title, _slug FROM public.jobs WHERE id = NEW.job_id;
  INSERT INTO public.notifications (user_id, title, body, type, link)
  VALUES (NEW.user_id, 'Candidatura enviada',
          'A sua candidatura para "' || COALESCE(_title, 'a vaga') || '" foi registada.',
          'candidatura',
          CASE WHEN _slug IS NULL THEN NULL ELSE '/vagas/' || _slug || '.html' END);
  RETURN NEW;
END; $$;

DROP TRIGGER IF EXISTS applications_notify_created ON public.applications;
CREATE TRIGGER applications_notify_created
AFTER INSERT ON public.applications
FOR EACH ROW EXECUTE FUNCTION public.notify_application_created();

-- 3. Estado da candidatura alterado
CREATE OR REPLACE FUNCTION public.notify_application_status()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE _title text; _slug text;
BEGIN
  IF NEW.status IS DISTINCT FROM OLD.status THEN
    SELECT title, slug INTO _title, _slug FROM public.jobs WHERE id = NEW.job_id;
    INSERT INTO public.notifications (user_id, title, body, type, link)
    VALUES (NEW.user_id, 'Candidatura actualizada',
            '"' || COALESCE(_title, 'A vaga') || '": estado agora ' || replace(NEW.status::text, '_', ' ') || '.',
            'candidatura',
            CASE WHEN _slug IS NULL THEN NULL ELSE '/vagas/' || _slug || '.html' END);
  END IF;
  RETURN NEW;
END; $$;

DROP TRIGGER IF EXISTS applications_notify_status ON public.applications;
CREATE TRIGGER applications_notify_status
AFTER UPDATE OF status ON public.applications
FOR EACH ROW EXECUTE FUNCTION public.notify_application_status();

-- 4. Pagamento do CV concluido
CREATE OR REPLACE FUNCTION public.notify_purchase_paid()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF NEW.status = 'paid' AND OLD.status IS DISTINCT FROM 'paid' AND NEW.user_id IS NOT NULL THEN
    INSERT INTO public.notifications (user_id, title, body, type, link)
    VALUES (NEW.user_id, 'Pagamento confirmado',
            'O seu pagamento de ' || NEW.amount || ' MZN foi confirmado. Já pode transferir o seu CV.',
            'pagamento', '/criar-cv');
  END IF;
  RETURN NEW;
END; $$;

DROP TRIGGER IF EXISTS cv_purchases_notify_paid ON public.cv_purchases;
CREATE TRIGGER cv_purchases_notify_paid
AFTER UPDATE OF status ON public.cv_purchases
FOR EACH ROW EXECUTE FUNCTION public.notify_purchase_paid();
