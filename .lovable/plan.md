# Moza Empregos — app de vagas com criação de CV e pagamento NetShop

Este projecto está vazio (só o modelo em branco), e o ficheiro que enviou trazia apenas configurações, sem o código da app. Por isso vamos construir aqui a versão funcional, com prioridade absoluta ao que faz dinheiro: criar CV → pagar → descarregar.

## O que vai existir hoje

**Navegação de app (telemóvel e computador)**
Barra inferior fixa no telemóvel com: Início, Vagas, Criar CV, Pesquisar, Perfil. No computador, um cabeçalho com os mesmos destinos. Identidade visual própria de Moçambique (nada de cópias do LinkedIn), tipografia e cores originais.

**Início**
Pesquisa de vagas, categorias, vagas recentes e vagas recomendadas.

**Vagas**
Lista com filtros (categoria, província, tipo de contrato) e página de detalhe com botão de candidatura.

**Criar CV**
Formulário por passos (dados pessoais, resumo, experiência, formação, competências, idiomas), pré-visualização em tempo real, 2 modelos à escolha. Antes de pagar, a pré-visualização tem marca de água e o download está bloqueado.

**Perfil e conta**
Registo e início de sessão por email/palavra-passe, os CVs guardados e as compras do utilizador.

## Pagamento NetShop (o ponto central)

Fluxo, usando a API oficial (`https://www.netshop.co.mz/api/v1`, cabeçalhos `Authorization: Bearer <API Key>` e `X-Wallet-ID`):

```text
Utilizador escolhe pagar (M-Pesa / e-Mola / mKesh / Cartão)
   -> app cria a cobrança (POST /charges) com referência única e chave de idempotência
   -> carteira móvel: cliente confirma no telemóvel
      cartão: cliente vai para a página segura da NetShop e volta ao nosso site
   -> app confirma sempre com GET /charges/{id} (fonte de verdade)
   -> se "paid": desbloqueia o download sem marca de água
```

Detalhes que evitam falhas:
- Confirmação por consulta ao estado (a documentação diz que é a fonte de verdade), com verificação automática a cada poucos segundos e botão "Já paguei — verificar".
- Endereço de retorno para o cartão, que traz o cliente de volta à página do CV.
- Um endereço de webhook adicional para receber a confirmação da NetShop, com registo do evento e sem duplicar compras já pagas.
- Nunca se desbloqueia nada com base no que o navegador diz: só o servidor, depois de confirmar com a NetShop, e verificando que o valor pago corresponde ao preço.
- Verificação inicial da ligação com `GET /ping` para garantir que as credenciais e o endereço estão certos.
- Preço do download do CV: **150 MZN** (diga-me se quiser outro valor).

## Base de dados e contas

Vou activar a Lovable Cloud (base de dados, contas e ficheiros incluídos) para guardar: perfis, vagas, candidaturas, CVs e compras. Cada pessoa só vê os seus próprios dados. As vagas iniciais entram já com alguns exemplos reais de Moçambique para a app não abrir vazia.

## O que preciso de si

- A **API Key** (`ns_live_...`) e o **Wallet ID** (6 dígitos) — vou pedi-los num formulário seguro; não os escreva no chat.
- Confirmação do preço do download do CV.
- Depois de publicar, registar o endereço do webhook no painel NetShop (dou-lhe o endereço exacto).

## Notas técnicas

- Rotas TanStack Start: `/`, `/vagas`, `/vagas/$slug`, `/criar-cv`, `/pesquisar`, `/perfil`, `/auth`.
- `src/lib/payments.functions.ts`: `createCharge`, `getChargeStatus`, `getCvAccess` (server functions; credenciais lidas dentro do handler).
- `src/routes/api/public/netshop-webhook.ts`: recepção idempotente, validação do valor, reconciliação via `GET /charges/{id}`.
- Tabelas: `profiles`, `jobs`, `applications`, `cvs`, `purchases` — todas com RLS e GRANTs.
- Marca de água dentro da área de impressão do CV enquanto a compra não estiver paga.

## Depois de hoje (fora deste lote)

Painel de administração de vagas, notificações, importação de CV por ficheiro e melhorias de SEO das páginas de vagas.
