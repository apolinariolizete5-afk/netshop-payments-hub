# Acesso de administração, convites e capas das vagas

## 1. Entrada de administrador pelo login normal

- O login continua único em `/auth`. Depois de entrar, se a conta for administradora, o utilizador é levado directamente para o painel; caso contrário vai para o perfil, como hoje.
- Nada de credenciais fixas ou escondidas no código: o acesso passa a depender apenas da conta e da permissão guardada no sistema.
- Limpeza: remover do projecto qualquer atalho/menção de credenciais de administração e a referência residual à chave de serviço que já não é usada.

## 2. Primeiro administrador uma única vez, depois só por convite

- Enquanto não existir nenhum administrador, a página de login mostra uma opção "Tornar-me administrador" para quem acabou de entrar. Assim que existir um, essa opção desaparece para sempre.
- No painel, um administrador convida outro escrevendo o email da pessoa (a conta tem de já existir). O convidado passa a entrar pelo mesmo login e vê o painel.
- Um administrador pode retirar a permissão a outro, mas nunca a si próprio.

## 3. Capas e endereços próprios das vagas

- Cada vaga na lista mostra sempre uma capa: a imagem carregada ou, na falta dela, uma capa gerada com o nome da empresa e a categoria — o visitante vê a pré-visualização antes de clicar.
- Cada vaga passa a ter endereço próprio no formato `/vagas/vaga-detalhe-card.html`. Os endereços antigos sem `.html` continuam a funcionar.
- A partilha nas redes sociais usa a imagem de capa da própria vaga.

## 4. Sugestões de melhoria (sem custo extra agora)

Apresento a lista no fim, para decidir depois: alertas de novas vagas por email, filtro por salário, candidaturas geridas dentro do painel, e estatísticas por vaga com gráfico simples.

## Detalhes técnicos

- `src/routes/auth.tsx`: após `signIn`/`signUp`/Google, chamar `amIAdmin` e navegar para `/admin` ou `/perfil`; mostrar o botão de reivindicação só quando `admin_exists()` devolver falso.
- Novas server functions em `src/lib/admin.functions.ts`: `publicAdminExists` (cliente público), `claimFirstAdmin` (RPC `claim_first_admin`) e `adminInviteByEmail` (RPC `grant_admin_by_email`). Reaproveitar `adminSetRole` para revogar.
- `src/routes/admin.tsx`: separador Utilizadores ganha campo de email + botão "Convidar administrador"; o painel deixa de expor atribuição livre de roles.
- Slugs `.html`: `src/lib/jobs.functions.ts` normaliza o parâmetro removendo o sufixo `.html`; `JobCard`, pesquisa e página de empresa passam `slug: `${job.slug}.html``; `src/routes/vagas.$slug.tsx` continua a resolver ambos e define `og:image` a partir de `image_url` absoluto.
- `JobCard`: bloco de capa com fallback (gradiente + iniciais da empresa) quando `image_url` está vazio.
- Remover `src/integrations/supabase/client.server.ts` (única referência a `SUPABASE_SERVICE_ROLE_KEY`) se nada o importar.
- Validação: `bunx tsgo --noEmit` e verificação das rotas `/`, `/vagas`, `/vagas/<slug>.html`, `/auth`, `/admin`.

## Orçamento

Trabalho concentrado em 6 ficheiros e uma única ronda de validação, para caber nos créditos existentes. As sugestões do ponto 4 ficam por implementar até haver novo pedido.
