"use client";

import { useState } from "react";
import { Label, Textarea, Input, Button } from "@/components/ui";
import type { StepProps } from "./types";
import type { Speaker } from "@/lib/types";

export function StepConteudo({ campaign, patch }: StepProps) {
  const [topicsText, setTopicsText] = useState(campaign.briefingExtra.topics.join(", "));
  const [speakers, setSpeakers] = useState<Speaker[]>(campaign.briefingExtra.speakers);
  const [newSpeaker, setNewSpeaker] = useState({ name: "", role: "", company: "" });

  function saveTopics() {
    const topics = topicsText
      .split(",")
      .map((t) => t.trim())
      .filter(Boolean);
    patch({ briefingExtra: { topics } });
  }

  function addSpeaker() {
    if (!newSpeaker.name.trim()) return;
    const updated = [...speakers, newSpeaker];
    setSpeakers(updated);
    setNewSpeaker({ name: "", role: "", company: "" });
    patch({ briefingExtra: { speakers: updated } });
  }

  function removeSpeaker(i: number) {
    const updated = speakers.filter((_, idx) => idx !== i);
    setSpeakers(updated);
    patch({ briefingExtra: { speakers: updated } });
  }

  return (
    <div className="space-y-5">
      <div>
        <Label>Quais assuntos serão abordados? (separe por vírgula)</Label>
        <Textarea rows={2} value={topicsText} onChange={(e) => setTopicsText(e.target.value)} onBlur={saveTopics} />
      </div>

      <div>
        <Label>Palestrantes/convidados (opcional)</Label>
        <div className="space-y-2">
          {speakers.map((s, i) => (
            <div key={i} className="flex items-center justify-between rounded-lg bg-surface-2 px-3 py-2 text-sm">
              <span>
                <strong>{s.name}</strong>
                {s.role ? ` — ${s.role}` : ""}
                {s.company ? ` (${s.company})` : ""}
              </span>
              <button onClick={() => removeSpeaker(i)} className="text-muted hover:text-red">
                remover
              </button>
            </div>
          ))}
        </div>
        <div className="mt-2 grid grid-cols-3 gap-2">
          <Input placeholder="Nome" value={newSpeaker.name} onChange={(e) => setNewSpeaker({ ...newSpeaker, name: e.target.value })} />
          <Input placeholder="Profissão" value={newSpeaker.role} onChange={(e) => setNewSpeaker({ ...newSpeaker, role: e.target.value })} />
          <Input placeholder="Empresa" value={newSpeaker.company} onChange={(e) => setNewSpeaker({ ...newSpeaker, company: e.target.value })} />
        </div>
        <Button variant="secondary" size="sm" className="mt-2" onClick={addSpeaker}>
          + Adicionar palestrante
        </Button>
      </div>
    </div>
  );
}
