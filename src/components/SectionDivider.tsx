// Transição orgânica entre seções de cor sólida — evita a emenda reta que
// deixa uma landing page com cara de blocos empilhados. `flip` troca pra uma
// curva desenhada com os pontos espelhados (em vez de usar `transform:
// scaleY(-1)` em cima da mesma curva — isso causava um corte reto em alguns
// navegadores/dispositivos; duas curvas explícitas são mais previsíveis).
// Amplitude baixa de propósito: como o SVG usa preserveAspectRatio="none"
// (esticado só na largura, a altura da faixa é fixa), uma onda com muita
// variação vertical vira um "monte" inchado em telas estreitas — o
// achatamento horizontal exagera a curvatura. Uma onda suave se comporta
// bem em qualquer largura.
const WAVE = "M0,50 C 260,65 480,35 800,50 C 1120,65 1360,35 1600,50 L1600,120 L0,120 Z";
const WAVE_FLIPPED = "M0,70 C 260,55 480,85 800,70 C 1120,55 1360,85 1600,70 L1600,120 L0,120 Z";

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
