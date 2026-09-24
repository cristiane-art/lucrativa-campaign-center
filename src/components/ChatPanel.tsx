"use client";

import { useEffect, useRef, useState } from "react";
import { Button, Card, CardHeader, Textarea } from "@/components/ui";
import type { SerializedCampaign } from "@/lib/serialize";

interface ChatMsg {
  id: string;
  role: string;
  content: string;
}

export function ChatPanel({
  campaignId,
  initialMessages = [],
  onCampaignUpdate,
  quickActions,
}: {
  campaignId: string;
  initialMessages?: ChatMsg[];
  onCampaignUpdate?: (campaign: SerializedCampaign) => void;
  quickActions?: { label: string; message: string }[];
}) {
  const [messages, setMessages] = useState<ChatMsg[]>(initialMessages);
  const [input, setInput] = useState("");
  const [sending, setSending] = useState(false);
  const bottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  async function send(text: string) {
    if (!text.trim() || sending) return;
    setSending(true);
    setMessages((prev) => [...prev, { id: `local-${Date.now()}`, role: "user", content: text }]);
    setInput("");
    try {
      const res = await fetch(`/api/campaigns/${campaignId}/chat`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ message: text }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Falha no chat");
      setMessages((prev) => [...prev, { id: `local-a-${Date.now()}`, role: "assistant", content: data.reply }]);
      if (data.campaign && onCampaignUpdate) onCampaignUpdate(data.campaign);
    } catch (err) {
      setMessages((prev) => [
        ...prev,
        { id: `local-e-${Date.now()}`, role: "assistant", content: `Erro: ${(err as Error).message}` },
      ]);
    } finally {
      setSending(false);
    }
  }

  return (
    <Card className="flex h-full flex-col">
      <CardHeader title="Copiloto da campanha" subtitle="Converse para configurar ou consultar a campanha" />
      <div className="flex-1 space-y-3 overflow-y-auto px-4 py-3" style={{ minHeight: 280, maxHeight: 420 }}>
        {messages.length === 0 && (
          <p className="text-sm text-muted">
            Escreva algo como &ldquo;Quero lotar o evento da Lucrattiva no dia 14/10 para produtores de Nova Mutum&rdquo; e eu
            preencho o briefing com você.
          </p>
        )}
        {messages.map((m) => (
          <div key={m.id} className={`flex ${m.role === "user" ? "justify-end" : "justify-start"}`}>
            <div
              className={`max-w-[85%] whitespace-pre-wrap rounded-xl px-3 py-2 text-sm ${
                m.role === "user" ? "bg-accent text-white" : "bg-surface-2 text-ink"
              }`}
            >
              {m.content}
            </div>
          </div>
        ))}
        <div ref={bottomRef} />
      </div>
      {quickActions && quickActions.length > 0 && (
        <div className="flex flex-wrap gap-2 border-t border-border px-4 py-2">
          {quickActions.map((qa) => (
            <button
              key={qa.label}
              onClick={() => send(qa.message)}
              disabled={sending}
              className="rounded-full border border-border px-3 py-1 text-xs text-accent hover:border-accent disabled:opacity-50"
            >
              {qa.label}
            </button>
          ))}
        </div>
      )}
      <form
        onSubmit={(e) => {
          e.preventDefault();
          send(input);
        }}
        className="flex items-end gap-2 border-t border-border p-3"
      >
        <Textarea
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter" && !e.shiftKey) {
              e.preventDefault();
              send(input);
            }
          }}
          rows={2}
          placeholder="Escreva sua mensagem..."
          className="flex-1"
        />
        <Button type="submit" disabled={sending || !input.trim()}>
          {sending ? "..." : "Enviar"}
        </Button>
      </form>
    </Card>
  );
}
