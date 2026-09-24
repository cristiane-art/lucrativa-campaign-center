# Campanhas

## Modelo de dados

`Campaign` (`prisma/schema.prisma`) é a entidade central — tudo (tarefas, pesquisa,
estratégia, conteúdo, criativos, tracking, leads, aprovações, log, custo de IA) carrega
`campaignId`. Ver `docs/architecture.md` para por que o briefing é dividido entre
colunas próprias e o campo `briefingExtra` (JSON).

Status de uma campanha: `DISCOVERY` (ainda no wizard, briefing incompleto) →
`PLANNING` (confirmada, pipeline de agentes rodando) → `ACTIVE` → `PAUSED` /
`COMPLETED` / `CANCELLED`.

## Modo de Descoberta (nunca assumir dado ausente)

Implementado em `src/lib/completeness.ts` + `src/components/discovery/`. Regras:

1. **Nada é inventado.** Cada campo obrigatório ausente aparece em
   `CompletenessResult.missing`; a confirmação da campanha fica bloqueada enquanto
   `missing.length > 0`.
2. **"Ainda não sei" é uma resposta válida**, não uma pendência bloqueante. Meta,
   orçamento e capacidade podem ser marcados como desconhecidos
   (`briefingExtra.unknownFields`) — entram em `CompletenessResult.recommended`, que
   não bloqueia a confirmação.
3. **Campos condicionais**: local só é obrigatório se o formato não for `online`;
   preço só se o evento for pago; região e canais sempre obrigatórios.
4. **Chat extrai e preenche**: `src/agents/chat.ts` lê a mensagem livre do usuário e
   devolve só os campos que tem certeza que foram informados — nunca reescreve um
   campo já preenchido com uma suposição.
5. **Resumo antes de executar**: a etapa "Revisão" do wizard (`StepRevisao.tsx`)
   mostra tudo o que foi coletado, a lista de pendências (com atalho para voltar à
   etapa certa) e só libera "Confirmar e criar campanha" quando não há pendência
   obrigatória.

Só depois da confirmação o `Orchestrator` roda os agentes — nunca antes.

## Tipos de campanha suportados

`evento`, `lancamento`, `promocao`, `institucional`, `geracao_leads`, `conteudo`,
`sazonal` (`CAMPAIGN_TYPES` em `src/lib/types.ts`). O wizard hoje tem campos
condicionais completos só para `evento` (data, local, formato, capacidade, gratuito/
pago) — os demais tipos usam os campos comuns (objetivo, público, orçamento, canais).

## Campanha inicial: Evento Lucrativa Agro

`prisma/seed.ts` cria o tenant Lucrattiva e uma campanha com **apenas** o que o
briefing original informou explicitamente: nome, data (14/10/2026), objetivo
(lotar o evento), público (produtores rurais e profissionais do agro) e região (Nova
Mutum e região). Local, capacidade, orçamento, canais e CTA ficam em aberto de
propósito — completar isso é o primeiro passo ao abrir a campanha no dashboard
(`/campanhas/<id>` cai automaticamente no wizard enquanto `status = DISCOVERY`).

Rodar: `npm run db:seed`.

## Dashboard

- **Visão geral** (`/campanhas/[id]`): funil real (leads → inscritos → confirmados →
  presentes, sempre dados do banco, nunca estimativa), dias restantes até o evento,
  "o que precisamos fazer" (tarefas), "aguardando sua aprovação", "o que o agente fez"
  (activity log) e o copiloto de chat.
- **Conteúdo** (`/conteudo`): filtro por status, aprovar/rejeitar/editar, mostra a
  imagem gerada (com aviso visual quando é `mock`).
- **Leads** (`/leads`): pipeline `NEW → INTERESTED → REGISTERED → CONFIRMED →
  ATTENDED`, adicionar lead manual, avançar etapa.
- **Divulgação** (`/tracking`): links UTM com cliques reais, QR Codes com download de
  PNG.
- **Tarefas** (`/tarefas`): lista completa, criar tarefa manual, trocar status.
- **Editar briefing** (`/editar`): os mesmos formulários do wizard, sem o fluxo de
  confirmação — para ajustar a campanha depois de ativa.

## Landing page pública

`/inscricao/[id]` é a página de inscrição gerada automaticamente para campanhas de
evento (usada como `destinationUrl` padrão do Tracking Agent quando a campanha não
informa um link de inscrição próprio). O formulário grava o mínimo de dado necessário
(nome + telefone ou e-mail, cidade opcional) — ver `docs/deployment.md` sobre LGPD.

## O que ainda é Fase 2/3 (não implementado nesta entrega)

Conforme priorização do próprio briefing (seção 40): integração real com Meta Ads,
envio de WhatsApp em massa, gestão de parceiros com UI própria, marketing físico com
checklist de materiais, check-in por QR Code no dia do evento, memória histórica entre
campanhas e o Optimization Agent. O schema já tem `Partner` e os campos de orçamento
por canal prontos para isso — falta o agente e a tela.
