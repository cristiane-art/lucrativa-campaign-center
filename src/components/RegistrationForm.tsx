"use client";

import { useState } from "react";
import { Card, Label, Input, Button } from "@/components/ui";

export function RegistrationForm({ campaignId, ctaLabel }: { campaignId: string; ctaLabel: string }) {
  const [form, setForm] = useState({ name: "", phone: "", email: "", city: "" });
  const [status, setStatus] = useState<"idle" | "sending" | "done" | "error">("idle");
  const [error, setError] = useState<string | null>(null);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setStatus("sending");
    setError(null);
    try {
      const res = await fetch("/api/registration", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          campaignId,
          ...form,
          source: new URLSearchParams(window.location.search).get("utm_source") || "landing_page",
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      setStatus("done");
    } catch (err) {
      setStatus("error");
      setError((err as Error).message);
    }
  }

  if (status === "done") {
    return (
      <Card className="p-6 text-center">
        <p className="font-display text-lg font-semibold text-accent-strong">Inscrição confirmada!</p>
        <p className="mt-1 text-sm text-muted">Em breve você recebe mais detalhes.</p>
      </Card>
    );
  }

  return (
    <Card className="p-6">
      <form onSubmit={submit} className="space-y-4">
        <div>
          <Label>Nome</Label>
          <Input required value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} />
        </div>
        <div>
          <Label>WhatsApp</Label>
          <Input value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} placeholder="(00) 00000-0000" />
        </div>
        <div>
          <Label>E-mail (opcional)</Label>
          <Input type="email" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} />
        </div>
        <div>
          <Label>Cidade</Label>
          <Input value={form.city} onChange={(e) => setForm({ ...form, city: e.target.value })} />
        </div>
        {error && <p className="text-sm text-red">{error}</p>}
        <Button type="submit" disabled={status === "sending"} className="w-full">
          {status === "sending" ? "Enviando..." : ctaLabel}
        </Button>
      </form>
    </Card>
  );
}
