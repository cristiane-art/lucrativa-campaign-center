"use client";

export function FunnelChart({ counts }: { counts: { leads: number; registered: number; confirmed: number; attended: number } }) {
  const stages = [
    { label: "Leads", value: counts.leads },
    { label: "Inscritos", value: counts.registered },
    { label: "Confirmados", value: counts.confirmed },
    { label: "Presentes", value: counts.attended },
  ];
  const max = Math.max(1, ...stages.map((s) => s.value));

  return (
    <div className="space-y-3">
      {stages.map((s) => (
        <div key={s.label}>
          <div className="mb-1 flex justify-between text-sm">
            <span className="text-ink">{s.label}</span>
            <span className="font-medium text-accent-strong">{s.value}</span>
          </div>
          <div className="h-3 w-full overflow-hidden rounded-full bg-surface-2">
            <div
              className="h-full rounded-full bg-accent transition-all"
              style={{ width: `${Math.max(4, (s.value / max) * 100)}%` }}
            />
          </div>
        </div>
      ))}
      <p className="pt-1 text-xs text-muted">Dados reais do banco — nenhum número aqui é estimado.</p>
    </div>
  );
}
