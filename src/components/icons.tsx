// Conjunto pequeno de ícones de linha (stroke, 24x24) na identidade visual —
// evita depender de um pacote de ícones externo só para uma dúzia de usos.
type IconProps = { className?: string };

const base = "h-5 w-5";

export function IconLeaf({ className = base }: IconProps) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" className={className}>
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        d="M4 20c8 0 13.5-4.5 15-13-8 0-13.5 4.5-15 13Z"
      />
      <path strokeLinecap="round" strokeLinejoin="round" d="M4 20c2-6 6-10 12-12" />
    </svg>
  );
}

export function IconCalendar({ className = base }: IconProps) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" className={className}>
      <rect x="3.5" y="5" width="17" height="16" rx="2.5" strokeLinecap="round" strokeLinejoin="round" />
      <path strokeLinecap="round" strokeLinejoin="round" d="M8 3v4M16 3v4M3.5 10h17" />
    </svg>
  );
}

export function IconClock({ className = base }: IconProps) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" className={className}>
      <circle cx="12" cy="12" r="8.5" />
      <path strokeLinecap="round" strokeLinejoin="round" d="M12 7.5V12l3 2" />
    </svg>
  );
}

export function IconPin({ className = base }: IconProps) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" className={className}>
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        d="M12 21s7-6.1 7-11.5A7 7 0 0 0 5 9.5C5 14.9 12 21 12 21Z"
      />
      <circle cx="12" cy="9.5" r="2.5" />
    </svg>
  );
}

export function IconCheck({ className = base }: IconProps) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.25" className={className}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M4.5 12.5 9.5 17.5 19.5 6.5" />
    </svg>
  );
}

export function IconMic({ className = base }: IconProps) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" className={className}>
      <rect x="9" y="3" width="6" height="11" rx="3" />
      <path strokeLinecap="round" strokeLinejoin="round" d="M5.5 11a6.5 6.5 0 0 0 13 0M12 17.5V21M9 21h6" />
    </svg>
  );
}

export function IconChat({ className = base }: IconProps) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" className={className}>
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        d="M4 12.5c0-4.4 3.6-8 8-8s8 3.6 8 8-3.6 8-8 8c-1.2 0-2.3-.25-3.3-.7L4 21l1.3-4.4A7.9 7.9 0 0 1 4 12.5Z"
      />
    </svg>
  );
}

export function IconFood({ className = base }: IconProps) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" className={className}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M6 3v7a2.5 2.5 0 0 0 5 0V3M8.5 3v18M17 3c-1.7 0-3 2-3 5s1.3 5 3 5v10" />
    </svg>
  );
}

export function IconUsers({ className = base }: IconProps) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" className={className}>
      <circle cx="9" cy="8.5" r="3" />
      <path strokeLinecap="round" strokeLinejoin="round" d="M3.5 20c.7-3.5 3-5.5 5.5-5.5S13.8 16.5 14.5 20" />
      <circle cx="17" cy="9.5" r="2.5" />
      <path strokeLinecap="round" strokeLinejoin="round" d="M16 14.3c2.1.4 3.6 2.2 4.1 5" />
    </svg>
  );
}

export function IconSparkle({ className = base }: IconProps) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" className={className}>
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        d="M12 3.5c.6 3.2 1.5 5 3 6.3s3.1 2 6 2.5c-2.9.5-4.5 1.2-6 2.5s-2.4 3.1-3 6.3c-.6-3.2-1.5-5-3-6.3s-3.1-2-6-2.5c2.9-.5 4.5-1.2 6-2.5s2.4-3.1 3-6.3Z"
      />
    </svg>
  );
}
