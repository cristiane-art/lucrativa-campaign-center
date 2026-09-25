# Execução e deploy

## Rodando localmente

O banco é Postgres (desde a migração para permitir hospedagem serverless — ver
"Publicar" abaixo). Você precisa de um Postgres acessível: local
(`postgresql://...@localhost:5432/...`) ou uma branch gratuita de um provedor
gerenciado (Neon, Vercel Postgres, Supabase).

```bash
npm install
cp .env.example .env        # ajuste DATABASE_POSTGRES_URL e ANTHROPIC_API_KEY
npm run db:push             # aplica o schema no Postgres apontado
npm run db:seed             # cria o tenant Lucrattiva + a campanha do evento
npm run dev                 # http://localhost:3000
```

Sem `ANTHROPIC_API_KEY`, o sistema funciona normalmente — wizard, dashboard, tarefas,
UTM/QR Code, leads e inscrição pública não dependem de IA. Os agentes de pesquisa,
estratégia, conteúdo e criativo ficam pausados (cada um vira uma tarefa "Configurar
ANTHROPIC_API_KEY" no dashboard, ver `docs/agents.md`).

## Variáveis de ambiente

Ver `.env.example` — todas documentadas ali. Nenhuma chave/segredo fica hardcoded no
código (REGRA 36 do briefing).

## Build de produção

```bash
npm run build
npm start
```

## Publicar: Vercel + Postgres (passo a passo)

Caminho recomendado para colocar o link de inscrição no ar. ~15-20 minutos.

**1. Crie o banco Postgres**

- No painel da [Vercel](https://vercel.com) → seu projeto (crie um projeto vazio se
  ainda não importou o repositório) → aba **Storage** → **Create Database** → escolha
  **Prisma Postgres** (plano gratuito).
- Ao conectar o banco ao projeto ("Connect to Project"), use o prefixo `DATABASE` em
  **Custom Environment Variable Prefix** — isso cria a variável `DATABASE_POSTGRES_URL`
  que o `schema.prisma` espera (ver tabela do passo 3).

**2. Importe o repositório**

- Na Vercel: **Add New → Project** → selecione `cristiane-art/lucrativa-campaign-center`
  → branch `main` (ou a que você quer publicar).
- Framework: a Vercel detecta Next.js sozinha. Não precisa mudar build command nem
  output directory.

**3. Configure as variáveis de ambiente**

Em **Settings → Environment Variables** do projeto na Vercel:

| Variável | De onde vem |
|---|---|
| `DATABASE_POSTGRES_URL` | Criada sozinha pela integração **Prisma Postgres** (Storage → Create Database → conecte ao projeto com o prefixo `DATABASE`). **Não** use a `DATABASE_URL` que a mesma integração cria — essa é a conexão via Prisma Accelerate (`prisma+postgres://...`), que exige o pacote `@prisma/extension-accelerate`; este projeto usa `PrismaClient` puro, então schema.prisma aponta para `DATABASE_POSTGRES_URL` (a conexão Postgres direta) tanto em `url` quanto em `directUrl` |
| `ANTHROPIC_API_KEY` | https://console.anthropic.com/settings/keys — opcional, sem ela os agentes de IA ficam pausados |
| `DASHBOARD_PASSWORD` | Escolha uma senha para proteger `/campanhas` — **obrigatório antes de divulgar o link**, já que o dashboard mostra dado pessoal de participante |
| `NEXT_PUBLIC_BASE_URL` | A URL final do projeto, ex: `https://evento-lucrattiva.vercel.app` (ou seu domínio próprio) — usada nos QR Codes e links curtos |
| `SEED_CLIENT_SLUG` / `SEED_CLIENT_NAME` | Pode deixar os valores padrão (`lucrattiva` / `Lucrattiva Contabilidade`) |
| `IMAGE_PROVIDER` / `IMAGE_PROVIDER_API_KEY` | Deixe em branco a menos que já tenha decidido usar geração de imagem real |

**4. Aplique o schema no banco de produção**

O `build` script do `package.json` já roda `prisma db push` + o seed automaticamente
a cada deploy (`prisma db push --accept-data-loss --skip-generate && tsx prisma/seed.ts
&& next build`) — não precisa rodar nada manualmente. Isso é temporário: depois de
confirmar que o primeiro deploy funcionou, o ideal é voltar o `build` script para só
`next build` e aplicar schema/seed manualmente quando necessário (evita rodar `db push`
em todo deploy).

**5. Deploy**

- Clique **Deploy** na Vercel (ou apenas dê `git push` na branch conectada — deploy
  automático a partir daí).
- Depois do primeiro deploy, toda vez que a branch `main` receber um push, a Vercel
  publica sozinha.

**6. Confira**

- Abra a URL do projeto → `/campanhas` deve pedir a senha do dashboard.
- Abra `/inscricao/<id-da-campanha>` (pegue o ID no dashboard) e confirme que a
  landing page carrega e o formulário envia.
- Se quiser um domínio próprio (ex: `evento.lucrattiva.com.br`), **Settings →
  Domains** no projeto da Vercel.

## Outras opções (Railway / Render)

Mesma ideia — conectar o repositório, adicionar um Postgres gerenciado, configurar as
mesmas variáveis de ambiente da tabela acima, rodar `prisma db push` + o seed uma vez
contra o banco novo. Essas plataformas também suportam disco persistente (o que
permitiria manter SQLite), mas Postgres continua sendo a escolha mais segura assim
que mais de uma pessoa for operar ao mesmo tempo (ex.: check-in simultâneo no dia do
evento).

## LGPD / dados pessoais

- A página de inscrição (`/inscricao/[id]`) só pede o que o formulário mostra —
  nenhum campo escondido, nenhum dado coletado sem o participante ver.
- **Consentimento nunca é assumido.** `marketingConsent` nasce `false`; a pessoa
  precisa marcar o checkbox explicitamente para receber comunicação futura. O
  consentimento operacional (credenciamento + lembretes deste evento) é um segundo
  checkbox, também explícito. Os dois ficam registrados com versão do texto
  (`CONSENT_VERSION` em `src/lib/types.ts`) e data/hora — mude a constante sempre que
  o texto do consentimento mudar, para saber qual versão cada pessoa aceitou.
- Leads e inscrições existem apenas vinculados a uma campanha (`campaignId`) — não há
  uma base de contatos "solta" fora do contexto de um evento/campanha específica.
- Nenhum dado pessoal aparece em URL — `/inscricao/[id]` e `/campanhas/[id]/*` usam só
  o ID da campanha (um `cuid`, não informação de ninguém).
- O `ActivityLog` nunca grava segredo/token/chave, só ações e IDs.

## Segurança

- **Dashboard protegido por senha compartilhada** (`DASHBOARD_PASSWORD`,
  `src/middleware.ts` + `src/lib/auth.ts`): todo `/campanhas/*` (páginas e as APIs
  internas — campanhas, conteúdo, leads, tarefas, aprovações) fica atrás de um login
  simples quando a variável está configurada. Em branco, a autenticação fica
  desligada (conveniente em desenvolvimento local — **configure antes de publicar**,
  já que o dashboard mostra dado pessoal real de participante). Não é um sistema de
  usuários — uma senha, um cookie httpOnly com o hash dela, sem banco de sessão. Isso
  é proposital: o MVP tem uma equipe pequena operando um evento, não múltiplos
  clientes com permissões diferentes.
- `/inscricao/[id]`, `/r/[code]` e `POST /api/registration` **nunca** ficam atrás
  dessa senha — são as páginas públicas do evento, de propósito.
- Autenticação **multi-cliente** (login por cliente, não uma senha única
  compartilhada) ainda não está implementada — o MVP resolve um único tenant
  (`getOrCreateDefaultClient()`). Antes de vender isso para mais de um cliente,
  trocar a resolução de tenant para vir da sessão logada.
- Toda API route que lê/escreve campanha já filtra por `campaignId` — ao adicionar
  autenticação multi-cliente, o ponto de entrada é validar que o `clientId` da
  campanha bate com o da sessão antes de qualquer leitura/escrita.
- CORS: as rotas de API não têm CORS aberto propositalmente — são para o próprio
  front-end. As únicas rotas públicas são `/api/registration` (inscrição) e
  `/r/[code]` (redirecionamento).

## Observabilidade

`ActivityLog` é o log de auditoria funcional (toda ação de agente/usuário). A própria
Vercel já dá logs de request/erro por padrão em **Deployments → [seu deploy] →
Logs**; nada adicional foi configurado nesta entrega.
