# Moza Empregos — versão completa a partir do ficheiro enviado

O ficheiro que enviou já traz uma versão bem mais avançada da app (área de administração, empresas, notificações, política de privacidade, upload de imagens, webhook de pagamentos e toda a base de dados). Vou passar a trabalhar sobre essa versão em vez da reconstrução parcial que estava aqui, e depois acrescento tudo o que pediu.

## 1. Trazer o conteúdo do ficheiro enviado

- Substituir as páginas e componentes actuais pelos do ficheiro (início, vagas, detalhe de vaga, pesquisa, empresas, notificações, perfil, entrada/registo, criador de CV, administração, privacidade).
- Recriar na base de dados desta app a mesma estrutura do ficheiro: perfis, funções de utilizador (admin), empresas, vagas com imagem e contador de visualizações, vagas guardadas, candidaturas, notificações, definições da app e compras de CV, com as devidas regras de acesso.
- As vagas de exemplo actuais são substituídas pelas do ficheiro (mesma estrutura), para tudo ficar coerente.
- Criar o espaço de ficheiros para as imagens das vagas e fotos.

## 2. Área de administração

- Registo de administrador **uma única vez**: enquanto não existir nenhum administrador, a primeira conta que use o registo de administração fica com esse papel; a partir daí a página deixa de aceitar novos registos e só quem já é admin pode criar/remover outros.
- Painel com números de visualizações (por vaga e total), candidaturas e vagas publicadas.
- Criar/editar vaga com todos os campos: título, empresa, categoria, província, tipo de contrato, nível, salário, descrição, requisitos, benefícios, prazo, estado (rascunho/publicada/fechada), imagem e **email para candidaturas**.
- Editor de texto que permite transformar uma palavra em link.
- Upload de imagens (vaga, empresa, foto de perfil) com pré-visualização.
- Gestão de administradores (adicionar/remover).
- Verificação de email desactivada — a conta funciona logo após o registo.

## 3. Vagas e candidaturas

- Endereço próprio por vaga no formato `/vaga-para-adm.html` (ligação simpática gerada a partir do título) — as ligações antigas continuam a funcionar.
- Cada vaga mostra imagem no anúncio e a mesma imagem em pré-visualização no cartão da lista.
- Lista com **10 vagas por página** e numeração 1 2 3 4 5… em baixo.
- Botão **"ENVIAR CANDIDATURA"** no anúncio: abre um formulário com nome, contacto, mensagem e anexos (CV, BI, NUIT e outros). Ao submeter, abre a aplicação de email do telemóvel/computador já preenchida para o email indicado na vaga.
  - Nota importante: o email do dispositivo não consegue anexar ficheiros automaticamente. Solução: os ficheiros são carregados para a app e o email sai com as ligações de descarga de cada documento, mais um resumo dos dados. Fica tudo funcional a partir do telemóvel.

## 4. Rodapé e páginas legais

- Ícones das redes sociais no fundo do site (Facebook, WhatsApp, Instagram, LinkedIn, TikTok) — preciso que me envie os endereços.
- Página de política de privacidade ligada no rodapé, mais termos e contacto.

## 5. Pagamentos NetShop

- Fluxo completo: criar CV → pagar 150 MZN por M-Pesa, e-Mola, mKesh ou cartão → descarregar sem marca de água.
- Confirmação real do pagamento: consulta ao NetShop + notificação automática (webhook) com verificação de assinatura e do valor, sem duplicações.
- **Para funcionar hoje** preciso de guardar em segredo: chave da API NetShop, Wallet ID e o segredo do webhook. Vou pedir por um formulário seguro — basta aprovar e colar os valores.

## 6. Publicação no Render

- Ficheiro de configuração do Render pronto, com a lista de variáveis a preencher lá, e instruções passo a passo.

## 7. Verificação final

- Testar no navegador: entrada, criar vaga como admin, ver vaga, candidatar, pagar e descarregar CV, paginação e rodapé.

## Sugestões minhas (incluídas)

- Pesquisa e filtros no topo da lista de vagas, com contagem de resultados.
- Partilha directa da vaga por WhatsApp.
- Aviso ao admin quando uma vaga expira.

## Detalhes técnicos

- Fonte: `moza-career-craft-corrigido.zip` (`src/`, `supabase/migrations/`, `render.yaml`), sem `.git`.
- Migrações reaplicadas no projecto Cloud actual: `app_role`/`job_type`/`experience_level`/`job_status`/`application_status`, `profiles`, `user_roles` + `has_role`, `companies`, `jobs` (com `image_url`, `views_count`, `apply_email`, `slug`), `saved_jobs`, `applications`, `notifications`, `app_settings`, `cv_purchases`, `increment_job_view`, `netshop_apply_payment`, bucket `uploads` com políticas.
- As tabelas actuais incompatíveis (`jobs`, `applications`, `purchases`, `cvs`) são recriadas segundo o esquema do ficheiro.
- Rota `/$slug.html` para as ligações tipo `vaga-para-adm.html`, com `head()` próprio (título, descrição, og:image).
- Candidaturas: upload para o bucket `uploads` + `mailto:` com corpo pré-preenchido e ligações públicas dos anexos.
- Pagamentos: `src/lib/payments.functions.ts` + `src/routes/api/public/netshop-webhook.ts`; segredos `NETSHOP_API_KEY`, `NETSHOP_WALLET_ID`, `NETSHOP_WEBHOOK_SECRET`.
