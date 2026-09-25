// Transição orgânica entre seções de cor sólida — evita a emenda reta que
// deixa uma landing page com cara de blocos empilhados. `flip` espelha a
// curva verticalmente (usado quando a seção de baixo, não a de cima, é quem
// "avança" sobre a outra).
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
    <div className="relative h-14 w-full overflow-hidden sm:h-20" style={{ backgroundColor: fromColor }}>
      <svg
        viewBox="0 0 1600 120"
        preserveAspectRatio="none"
        className="absolute inset-0 h-full w-full"
        style={{ transform: flip ? "scaleY(-1)" : undefined }}
        aria-hidden="true"
      >
        <path
          d="M0,40 C 260,90 480,10 800,50 C 1120,90 1360,20 1600,55 L1600,120 L0,120 Z"
          fill={toColor}
        />
      </svg>
    </div>
  );
}
