"use client";

import { useState } from "react";

export function ConfirmButtons({ leadId, initialStatus }: { leadId: string; initialStatus: string }) {
  const [status, setStatus] = useState(initialStatus);
  const [loading, setLoading] = useState<"confirm" | "decline" | null>(null);

  async function respond(action: "confirm" | "decline") {
    setLoading(action);
    try {
      const res = await fetch(`/api/confirmar/${leadId}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action }),
      });
      if (res.ok) {
        const data = await res.json();
        setStatus(data.status);
      }
    } finally {
      setLoading(null);
    }
  }

  if (status === "CONFIRMED") {
    return (
      <p className="mt-6 rounded-lg border border-accent bg-accent-soft px-4 py-3 text-sm font-medium text-accent-strong">
        Presença confirmada! Te esperamos lá. 🌾
      </p>
    );
  }

  if (status === "CANCELLED") {
    return (
      <div className="mt-6 rounded-lg border border-border bg-surface-2 px-4 py-3 text-sm text-muted">
        <p>Tudo bem, obrigado por avisar.</p>
        <button onClick={() => respond("confirm")} className="mt-2 text-xs font-medium text-accent hover:underline">
          Mudei de ideia, vou participar
        </button>
      </div>
    );
  }

  return (
    <div className="mt-6 flex flex-col gap-3 sm:flex-row">
      <button
        onClick={() => respond("confirm")}
        disabled={loading !== null}
        className="flex-1 rounded-lg bg-amber px-6 py-3 text-sm font-semibold uppercase tracking-wide text-[#12301c] shadow-md transition-transform hover:scale-[1.01] disabled:opacity-60"
      >
        {loading === "confirm" ? "Confirmando..." : "Vou participar"}
      </button>
      <button
        onClick={() => respond("decline")}
        disabled={loading !== null}
        className="flex-1 rounded-lg border border-border px-6 py-3 text-sm font-semibold text-muted transition-colors hover:bg-surface-2 disabled:opacity-60"
      >
        {loading === "decline" ? "Enviando..." : "Não vou poder ir"}
      </button>
    </div>
  );
}
