// Small duotone illustrations for empty states. Pure SVG, theme-aware (uses the slate/gold tokens).
export type IllustrationKind =
  | 'cases' | 'documents' | 'calendar' | 'invoices' | 'clients' | 'time' | 'search' | 'tasks' | 'team' | 'templates' | 'generic'

const S = 'var(--color-slate-300)'      // outlines
const F = 'var(--color-slate-100)'      // soft fills
const F2 = 'var(--color-slate-200)'
const G = 'var(--color-gold-400)'       // accent
const GS = 'var(--color-gold-200)'

function Frame({ children }: { children: React.ReactNode }) {
  return (
    <svg viewBox="0 0 160 120" className="h-28 w-auto" fill="none" aria-hidden strokeLinecap="round" strokeLinejoin="round">
      <ellipse cx="80" cy="108" rx="52" ry="6" fill={F2} opacity=".7" />
      {children}
    </svg>
  )
}

export default function Illustration({ kind = 'generic' }: { kind?: IllustrationKind }) {
  switch (kind) {
    case 'cases':
      return (
        <Frame>
          <path d="M28 40a6 6 0 0 1 6-6h30l10 10h52a6 6 0 0 1 6 6v46a6 6 0 0 1-6 6H34a6 6 0 0 1-6-6V40Z" fill={F} stroke={S} strokeWidth="2" />
          <rect x="40" y="56" width="80" height="34" rx="5" fill="var(--color-surface)" stroke={S} strokeWidth="2" />
          <path d="M52 68h38M52 77h24" stroke={S} strokeWidth="2" />
          <circle cx="112" cy="70" r="9" fill={GS} stroke={G} strokeWidth="2" />
          <path d="m108 70 3 3 5-6" stroke={G} strokeWidth="2.2" />
        </Frame>
      )
    case 'documents':
      return (
        <Frame>
          <rect x="44" y="22" width="62" height="78" rx="6" fill={F} stroke={S} strokeWidth="2" transform="rotate(-6 75 61)" />
          <rect x="52" y="20" width="62" height="78" rx="6" fill="var(--color-surface)" stroke={S} strokeWidth="2" />
          <path d="M63 40h40M63 51h40M63 62h26" stroke={S} strokeWidth="2" />
          <rect x="63" y="73" width="22" height="9" rx="3" fill={GS} stroke={G} strokeWidth="1.6" />
        </Frame>
      )
    case 'calendar':
      return (
        <Frame>
          <rect x="34" y="26" width="92" height="74" rx="8" fill="var(--color-surface)" stroke={S} strokeWidth="2" />
          <path d="M34 44h92" stroke={S} strokeWidth="2" />
          <path d="M54 20v12M106 20v12" stroke={G} strokeWidth="3" />
          {[0, 1, 2, 3].map((i) => <rect key={i} x={46 + i * 20} y="54" width="12" height="9" rx="2" fill={F2} />)}
          {[0, 1, 2].map((i) => <rect key={i} x={46 + i * 20} y="72" width="12" height="9" rx="2" fill={i === 1 ? G : F2} />)}
        </Frame>
      )
    case 'invoices':
      return (
        <Frame>
          <path d="M42 20h76v78l-10-6-9 6-9-6-9 6-9-6-9 6-10-6-10 6V20Z" fill="var(--color-surface)" stroke={S} strokeWidth="2" transform="translate(-4 0)" />
          <path d="M56 40h40M56 52h28" stroke={S} strokeWidth="2" />
          <circle cx="104" cy="70" r="11" fill={GS} stroke={G} strokeWidth="2" />
          <path d="M104 64v12M100 68h6a2.5 2.5 0 0 1 0 5h-5" stroke={G} strokeWidth="1.8" />
        </Frame>
      )
    case 'clients':
      return (
        <Frame>
          <circle cx="62" cy="48" r="15" fill={F} stroke={S} strokeWidth="2" />
          <path d="M34 98c0-16 12-26 28-26s28 10 28 26" fill={F} stroke={S} strokeWidth="2" />
          <circle cx="106" cy="54" r="12" fill={GS} stroke={G} strokeWidth="2" />
          <path d="M88 98c1-13 9-21 20-21 8 0 14 4 17 11" stroke={G} strokeWidth="2" />
        </Frame>
      )
    case 'team':
      return (
        <Frame>
          <circle cx="80" cy="44" r="14" fill={GS} stroke={G} strokeWidth="2" />
          <path d="M54 96c0-15 11-24 26-24s26 9 26 24" fill={F} stroke={G} strokeWidth="2" />
          <circle cx="40" cy="58" r="10" fill={F} stroke={S} strokeWidth="2" />
          <circle cx="120" cy="58" r="10" fill={F} stroke={S} strokeWidth="2" />
        </Frame>
      )
    case 'time':
      return (
        <Frame>
          <circle cx="80" cy="60" r="36" fill="var(--color-surface)" stroke={S} strokeWidth="2" />
          <circle cx="80" cy="60" r="28" fill={F} />
          <path d="M80 42v19l13 8" stroke={G} strokeWidth="3.5" />
          <path d="M72 18h16" stroke={S} strokeWidth="3" />
        </Frame>
      )
    case 'search':
      return (
        <Frame>
          <circle cx="72" cy="54" r="26" fill="var(--color-surface)" stroke={S} strokeWidth="2.5" />
          <path d="m92 74 24 24" stroke={G} strokeWidth="6" />
          <path d="M60 50h24M60 60h14" stroke={S} strokeWidth="2.5" />
        </Frame>
      )
    case 'tasks':
      return (
        <Frame>
          <rect x="40" y="22" width="80" height="78" rx="8" fill="var(--color-surface)" stroke={S} strokeWidth="2" />
          {[0, 1, 2].map((i) => (
            <g key={i}>
              <rect x="52" y={36 + i * 20} width="12" height="12" rx="3" fill={i === 0 ? GS : F} stroke={i === 0 ? G : S} strokeWidth="1.8" />
              {i === 0 && <path d="m55 42 3 3 5-6" stroke={G} strokeWidth="2" />}
              <path d={`M74 ${42 + i * 20}h32`} stroke={S} strokeWidth="2" />
            </g>
          ))}
        </Frame>
      )
    case 'templates':
      return (
        <Frame>
          <rect x="38" y="22" width="84" height="78" rx="7" fill="var(--color-surface)" stroke={S} strokeWidth="2" />
          <rect x="48" y="32" width="64" height="14" rx="3" fill={GS} stroke={G} strokeWidth="1.6" />
          <path d="M48 58h64M48 68h64M48 78h40" stroke={S} strokeWidth="2" />
        </Frame>
      )
    default:
      return (
        <Frame>
          <path d="M36 52 80 30l44 22v38L80 112 36 90V52Z" fill={F} stroke={S} strokeWidth="2" transform="translate(0 -12)" />
          <path d="M36 52 80 74l44-22M80 74v38" stroke={S} strokeWidth="2" transform="translate(0 -12)" />
          <circle cx="116" cy="34" r="8" fill={GS} stroke={G} strokeWidth="2" />
        </Frame>
      )
  }
}
