import { BRAND } from "@/lib/brand";

// Banner gerado para a hero da landing page de evento — sem foto real do
// evento, usa um cenário abstrato de "pôr do sol sobre a lavoura" na
// identidade visual da Lucrattiva (verde institucional + dourado). Quando
// `bannerImageUrl` está configurado na campanha, a página usa a imagem real
// no lugar deste componente (ver `src/app/inscricao/[id]/page.tsx`).
export function EventBanner({ className = "" }: { className?: string }) {
  return (
    <svg
      className={className}
      viewBox="0 0 1600 900"
      preserveAspectRatio="xMidYMid slice"
      xmlns="http://www.w3.org/2000/svg"
      aria-hidden="true"
    >
      <defs>
        <linearGradient id="sky" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#0c2015" />
          <stop offset="45%" stopColor="#12301c" />
          <stop offset="100%" stopColor={BRAND.colors.accent} />
        </linearGradient>
        <radialGradient id="sun" cx="50%" cy="38%" r="42%">
          <stop offset="0%" stopColor="#f4d999" stopOpacity="0.9" />
          <stop offset="45%" stopColor={BRAND.colors.amber} stopOpacity="0.35" />
          <stop offset="100%" stopColor={BRAND.colors.amber} stopOpacity="0" />
        </radialGradient>
        <linearGradient id="field1" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#1a3a24" />
          <stop offset="100%" stopColor="#12301c" />
        </linearGradient>
        <linearGradient id="field2" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#0f2718" />
          <stop offset="100%" stopColor="#0a1f13" />
        </linearGradient>
        <linearGradient id="fade" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#0a1710" stopOpacity="0" />
          <stop offset="100%" stopColor="#0a1710" stopOpacity="0.92" />
        </linearGradient>
      </defs>

      <rect width="1600" height="900" fill="url(#sky)" />
      <rect width="1600" height="900" fill="url(#sun)" />

      {/* linha do horizonte, dourada e fina */}
      <rect x="0" y="560" width="1600" height="2" fill={BRAND.colors.amber} opacity="0.55" />

      {/* camadas de lavoura, sugeridas por curvas suaves */}
      <path
        d="M0,600 C 220,560 420,640 700,600 C 980,560 1180,640 1600,590 L1600,900 L0,900 Z"
        fill="url(#field1)"
      />
      <path
        d="M0,680 C 260,650 520,710 820,670 C 1100,635 1340,700 1600,660 L1600,900 L0,900 Z"
        fill="url(#field2)"
      />

      {/* fileiras de plantação — traços finos e repetidos, evocando sulcos */}
      <g stroke={BRAND.colors.amber} strokeOpacity="0.18" strokeWidth="2">
        {Array.from({ length: 14 }).map((_, i) => {
          const x = 60 + i * 115;
          return <path key={i} d={`M${x},900 L${x + 260},640`} />;
        })}
      </g>

      {/* espigas estilizadas nas bordas */}
      <g fill={BRAND.colors.amber} opacity="0.5">
        <ellipse cx="90" cy="760" rx="5" ry="16" />
        <ellipse cx="105" cy="740" rx="5" ry="16" />
        <ellipse cx="75" cy="742" rx="5" ry="16" />
        <ellipse cx="1500" cy="780" rx="5" ry="16" />
        <ellipse cx="1515" cy="758" rx="5" ry="16" />
        <ellipse cx="1485" cy="760" rx="5" ry="16" />
      </g>

      {/* desvanece para o rodapé, garante contraste pro texto sobreposto */}
      <rect width="1600" height="900" fill="url(#fade)" />
    </svg>
  );
}
