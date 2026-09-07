-- Dados de demonstração: empresas e vagas publicadas
INSERT INTO public.companies (name, slug, description, location, industry, website, verified) VALUES
('Banco Horizonte', 'banco-horizonte', 'Banco moçambicano focado em soluções digitais para particulares e empresas.', 'Maputo', 'Banca e Finanças', 'https://exemplo.co.mz', true),
('TecnoMoz', 'tecnomoz', 'Empresa de tecnologia que desenvolve software para o mercado africano.', 'Maputo', 'Tecnologia', 'https://exemplo.co.mz', true),
('Costa Logística', 'costa-logistica', 'Operador logístico com presença nos principais portos do país.', 'Beira', 'Transportes e Logística', NULL, false),
('Rede Saúde Moçambique', 'rede-saude-mocambique', 'Rede de clínicas privadas com unidades em várias províncias.', 'Nampula', 'Saúde', NULL, true),
('Agro Zambeze', 'agro-zambeze', 'Produção e exportação agrícola no vale do Zambeze.', 'Tete', 'Agricultura', NULL, false);

INSERT INTO public.jobs (
  title, slug, company_id, company_name, location, category, job_type, experience_level,
  salary_min, salary_max, summary, description, responsibilities, requirements, benefits,
  how_to_apply, apply_email, is_featured, status, published_at
) VALUES
(
  'Programador Front-end React', 'programador-front-end-react-tecnomoz',
  (SELECT id FROM public.companies WHERE slug = 'tecnomoz'),
  'TecnoMoz', 'Maputo', 'Tecnologia da Informação', 'tempo_inteiro', 'intermedio',
  85000, 130000,
  'Desenvolvimento de interfaces web modernas em React para clientes nacionais e internacionais.',
  E'Procuramos um programador front-end para integrar a nossa equipa de produto em Maputo.\n\nVai trabalhar em aplicações web usadas por milhares de pessoas em Moçambique, em colaboração com designers e programadores back-end.',
  ARRAY['Desenvolver interfaces em React e TypeScript','Colaborar com a equipa de design na implementação de novos ecrãs','Escrever testes e participar em revisões de código'],
  ARRAY['2+ anos de experiência com React','Bom domínio de HTML, CSS e JavaScript','Português fluente e inglês técnico'],
  ARRAY['Seguro de saúde','Trabalho híbrido','Formação contínua'],
  'Envie o seu CV atualizado indicando a vaga no assunto.', 'recrutamento@tecnomoz.co.mz',
  true, 'publicada', now() - interval '1 day'
),
(
  'Gestor de Conta Empresarial', 'gestor-conta-empresarial-banco-horizonte',
  (SELECT id FROM public.companies WHERE slug = 'banco-horizonte'),
  'Banco Horizonte', 'Maputo', 'Banca e Finanças', 'tempo_inteiro', 'senior',
  120000, 180000,
  'Gestão da carteira de clientes empresariais e desenvolvimento de novas oportunidades de negócio.',
  E'O Banco Horizonte procura um gestor de conta empresarial para a sua direção comercial em Maputo.\n\nSerá responsável por acompanhar clientes corporativos e propor soluções financeiras adequadas.',
  ARRAY['Gerir uma carteira de clientes empresariais','Identificar novas oportunidades de negócio','Preparar propostas de crédito'],
  ARRAY['Licenciatura em Gestão, Economia ou área afim','5 anos de experiência em banca comercial','Boa capacidade de negociação'],
  ARRAY['Seguro de saúde familiar','Prémio anual de desempenho'],
  NULL, 'talentos@bancohorizonte.co.mz',
  true, 'publicada', now() - interval '3 days'
),
(
  'Técnico de Enfermagem', 'tecnico-enfermagem-rede-saude',
  (SELECT id FROM public.companies WHERE slug = 'rede-saude-mocambique'),
  'Rede Saúde Moçambique', 'Nampula', 'Saúde', 'tempo_inteiro', 'junior',
  35000, 50000,
  'Prestação de cuidados de enfermagem em regime de turnos numa clínica privada em Nampula.',
  E'A Rede Saúde Moçambique procura técnicos de enfermagem para a unidade de Nampula.\n\nO trabalho é realizado em regime de turnos, integrado numa equipa multidisciplinar.',
  ARRAY['Prestar cuidados de enfermagem a pacientes internados','Apoiar consultas e procedimentos médicos','Registar informação clínica'],
  ARRAY['Formação em enfermagem reconhecida','Registo profissional válido','Disponibilidade para turnos'],
  ARRAY['Subsídio de turno','Formação interna'],
  'Entregue a candidatura na receção da clínica ou envie por email.', 'rh@redesaude.co.mz',
  false, 'publicada', now() - interval '5 days'
),
(
  'Coordenador de Armazém', 'coordenador-armazem-costa-logistica',
  (SELECT id FROM public.companies WHERE slug = 'costa-logistica'),
  'Costa Logística', 'Beira', 'Transportes e Logística', 'contrato', 'intermedio',
  60000, 90000,
  'Coordenação das operações de armazém e gestão de uma equipa de 15 colaboradores na Beira.',
  E'Procuramos um coordenador de armazém para as nossas instalações na Beira.\n\nSerá responsável pela organização do espaço, controlo de stock e gestão da equipa operacional.',
  ARRAY['Coordenar entradas e saídas de mercadoria','Gerir inventário e reportar desvios','Liderar a equipa operacional'],
  ARRAY['Experiência em logística ou armazém','Conhecimentos de Excel','Capacidade de liderança'],
  ARRAY['Transporte assegurado','Refeição no local'],
  NULL, 'recrutamento@costalogistica.co.mz',
  false, 'publicada', now() - interval '8 days'
),
(
  'Estágio em Marketing Digital', 'estagio-marketing-digital-tecnomoz',
  (SELECT id FROM public.companies WHERE slug = 'tecnomoz'),
  'TecnoMoz', 'Maputo', 'Marketing e Comunicação', 'estagio', 'estagiario',
  NULL, 15000,
  'Estágio profissional de 6 meses na área de marketing digital e gestão de redes sociais.',
  E'Oportunidade de estágio para recém-licenciados em marketing, comunicação ou áreas afins.\n\nVai apoiar a criação de conteúdos e campanhas digitais.',
  ARRAY['Criar conteúdos para redes sociais','Apoiar campanhas de email marketing','Analisar métricas de desempenho'],
  ARRAY['Licenciatura concluída ou em fase final','Boa escrita em português','Interesse por marketing digital'],
  ARRAY['Subsídio de estágio','Possibilidade de efetivação'],
  NULL, 'estagios@tecnomoz.co.mz',
  false, 'publicada', now() - interval '2 days'
),
(
  'Engenheiro Agrónomo', 'engenheiro-agronomo-agro-zambeze',
  (SELECT id FROM public.companies WHERE slug = 'agro-zambeze'),
  'Agro Zambeze', 'Tete', 'Agricultura', 'tempo_inteiro', 'senior',
  90000, 140000,
  'Planeamento e acompanhamento técnico das campanhas agrícolas no vale do Zambeze.',
  E'A Agro Zambeze procura um engenheiro agrónomo para liderar a área técnica das suas explorações em Tete.',
  ARRAY['Planear campanhas de produção','Acompanhar equipas de campo','Controlar pragas e doenças'],
  ARRAY['Licenciatura em Engenharia Agronómica','5 anos de experiência em produção agrícola','Carta de condução'],
  ARRAY['Alojamento','Seguro de saúde'],
  NULL, 'rh@agrozambeze.co.mz',
  true, 'publicada', now() - interval '11 days'
),
(
  'Contabilista Sénior', 'contabilista-senior-banco-horizonte',
  (SELECT id FROM public.companies WHERE slug = 'banco-horizonte'),
  'Banco Horizonte', 'Matola', 'Contabilidade e Finanças', 'tempo_inteiro', 'senior',
  95000, 140000,
  'Responsável pelo fecho de contas mensal e reporte financeiro à direção.',
  E'Procuramos um contabilista sénior para a direção financeira, com base na Matola.',
  ARRAY['Fecho de contas mensal e anual','Preparar reportes fiscais','Apoiar auditorias externas'],
  ARRAY['Licenciatura em Contabilidade','Inscrição na OCAM valorizada','Experiência com SAF-T'],
  ARRAY['Seguro de saúde','Horário flexível'],
  NULL, 'talentos@bancohorizonte.co.mz',
  false, 'publicada', now() - interval '16 days'
),
(
  'Motorista de Pesados', 'motorista-pesados-costa-logistica',
  (SELECT id FROM public.companies WHERE slug = 'costa-logistica'),
  'Costa Logística', 'Beira', 'Transportes e Logística', 'tempo_inteiro', 'junior',
  28000, 40000,
  'Transporte de mercadoria entre a Beira e as províncias do centro do país.',
  E'A Costa Logística procura motoristas de pesados com carta profissional válida.',
  ARRAY['Transportar mercadoria em segurança','Verificar o estado do veículo','Cumprir prazos de entrega'],
  ARRAY['Carta de condução profissional','Experiência mínima de 2 anos','Disponibilidade para viajar'],
  ARRAY['Ajudas de custo','Seguro de acidentes de trabalho'],
  NULL, 'recrutamento@costalogistica.co.mz',
  false, 'publicada', now() - interval '20 days'
);