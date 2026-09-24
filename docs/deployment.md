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

- A página de inscrição (`/inscricao/[id]`) coleta o mínimo: nome + (telefone OU
  e-mail), cidade opcional. Nenhum campo além disso.
- Leads e inscrições existem apenas vinculados a uma campanha (`campaignId`) — não há
  uma base de contatos "solta" fora do contexto de uma campanha específica.
- O `ActivityLog` nunca grava segredo/token/chave, só ações e IDs.

## Segurança

- Autenticação real (login por cliente) **não está implementada nesta entrega** — o
  MVP resolve um único tenant (`getOrCreateDefaultClient()`). Antes de expor isso
  publicamente para mais de um cliente, adicionar autenticação e trocar a resolução
  de tenant para vir da sessão logada, não de uma env var.
- Toda API route que lê/escreve campanha já filtra por `campaignId` — ao adicionar
  autenticação multi-cliente, o ponto de entrada é validar que o `clientId` da
  campanha bate com o da sessão antes de qualquer leitura/escrita.
- CORS: as rotas de API não têm CORS aberto propositalmente — são para o próprio
  front-end. A rota pública é só `/api/registration` (inscrição) e `/r/[code]`
  (redirecionamento).

## Observabilidade

`ActivityLog` é o log de auditoria funcional (toda ação de agente/usuário). Para logs
de infraestrutura (erros de request, latência), qualquer provedor de hospedagem que
capture stdout/stderr do processo Next.js já cobre o básico — nada adicional foi
configurado nesta entrega.
