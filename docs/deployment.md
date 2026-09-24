# Execução e deploy

## Rodando localmente

```bash
npm install
cp .env.example .env        # ajuste ANTHROPIC_API_KEY se quiser os agentes de IA ativos
npm run db:push             # cria o SQLite local (prisma/dev.db)
npm run db:seed             # cria o tenant Lucrattiva + a campanha "Evento Lucrativa Agro"
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

## Banco de dados

MVP roda em SQLite (zero-config, arquivo único). Para produção com mais de um
operador editando ao mesmo tempo, trocar `datasource.provider` em
`prisma/schema.prisma` de `sqlite` para `postgresql` e apontar `DATABASE_URL` para o
Postgres — nenhuma query da aplicação usa SQL específico de SQLite, então a migração é
só isso mais rodar `prisma db push` (ou `migrate deploy`, se preferir migrations
versionadas) contra o banco novo.

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

## Publicar (colocar no ar)

Ver a mensagem da sessão que gerou este módulo para a comparação completa de
opções — resumo:

- **SQLite (`prisma/dev.db`) não sobrevive a hospedagem serverless** (Vercel,
  Netlify): cada invocação pode rodar num filesystem efêmero, então dado gravado
  numa requisição pode não estar lá na próxima. Antes de publicar em qualquer
  plataforma serverless, trocar `datasource.provider` para `postgresql` (ver seção
  acima) e apontar `DATABASE_URL` para um Postgres hospedado (Vercel Postgres, Neon,
  Supabase, Railway, etc.) — é a mesma migração de uma linha descrita acima.
- Plataformas com disco persistente (Railway, Render, uma VPS) podem rodar com
  SQLite sem essa migração, mas Postgres continua sendo a escolha mais segura assim
  que mais de uma pessoa vai editar ao mesmo tempo (ex.: equipe fazendo check-in
  simultâneo no dia do evento).
- Configure `DASHBOARD_PASSWORD` e `NEXT_PUBLIC_BASE_URL` (para os links curtos e QR
  Codes apontarem para o domínio real, não `localhost`) antes de divulgar o link de
  inscrição.

## Observabilidade

`ActivityLog` é o log de auditoria funcional (toda ação de agente/usuário). Para logs
de infraestrutura (erros de request, latência), qualquer provedor de hospedagem que
capture stdout/stderr do processo Next.js já cobre o básico — nada adicional foi
configurado nesta entrega.
