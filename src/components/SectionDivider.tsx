// Transição orgânica entre seções de cor sólida — evita a emenda reta que
// deixa uma landing page com cara de blocos empilhados. `flip` troca pra uma
// curva desenhada com os pontos espelhados (em vez de usar `transform:
// scaleY(-1)` em cima da mesma curva — isso causava um corte reto em alguns
// navegadores/dispositivos; duas curvas explícitas são mais previsíveis).
const WAVE = "M0,40 C 260,90 480,10 800,50 C 1120,90 1360,20 1600,55 L1600,120 L0,120 Z";
const WAVE_FLIPPED = "M0,80 C 260,30 480,110 800,70 C 1120,30 1360,100 1600,65 L1600,120 L0,120 Z";

export function SectionDivider({
  fromColor,
  toColor,
  flip = false,
}: {
  fromColor: string;
  toColor: string;
  flip?: boolean;
}) {
  return (
    <div
      className="relative -my-px h-14 w-full overflow-hidden sm:h-20"
      style={{ backgroundColor: fromColor }}
    >
      <svg
        viewBox="0 0 1600 120"
        preserveAspectRatio="none"
        className="absolute -inset-y-px inset-x-0 h-[calc(100%+2px)] w-full"
        aria-hidden="true"
      >
        <path d={flip ? WAVE_FLIPPED : WAVE} fill={toColor} />
      </svg>
    </div>
  );
}
