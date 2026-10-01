// lucide-react removed brand glyphs (Instagram/Youtube) from its icon set —
// small inline SVGs here instead of pulling in a whole extra icon package.
export function InstagramIcon({ size = 16, className = '' }: { size?: number; className?: string }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" className={className}>
      <rect x="2" y="2" width="20" height="20" rx="5" stroke="currentColor" strokeWidth="2" />
      <circle cx="12" cy="12" r="4.5" stroke="currentColor" strokeWidth="2" />
      <circle cx="17.5" cy="6.5" r="1.2" fill="currentColor" />
    </svg>
  )
}

export function YoutubeIcon({ size = 16, className = '' }: { size?: number; className?: string }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" className={className}>
      <rect x="2" y="5" width="20" height="14" rx="4" stroke="currentColor" strokeWidth="2" />
      <path d="M10 9.5L15 12L10 14.5V9.5Z" fill="currentColor" />
    </svg>
  )
}

export function WhatsappIcon({ size = 16, className = '' }: { size?: number; className?: string }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="currentColor" className={className}>
      <path d="M12 2a10 10 0 0 0-8.6 15.1L2 22l5.06-1.33A10 10 0 1 0 12 2zm0 18.2a8.17 8.17 0 0 1-4.17-1.14l-.3-.18-3.1.81.83-3-.2-.31A8.2 8.2 0 1 1 12 20.2zm4.49-6.13c-.24-.12-1.44-.71-1.66-.79s-.38-.12-.54.12-.62.79-.76.95-.28.18-.52.06a6.7 6.7 0 0 1-1.97-1.22 7.4 7.4 0 0 1-1.36-1.7c-.14-.24 0-.37.11-.49.11-.11.24-.28.36-.42a1.6 1.6 0 0 0 .24-.4.44.44 0 0 0 0-.42c-.06-.12-.54-1.3-.74-1.78s-.4-.4-.54-.41h-.46a.9.9 0 0 0-.64.3 2.7 2.7 0 0 0-.84 2 4.7 4.7 0 0 0 1 2.5 10.8 10.8 0 0 0 4.13 3.65c.58.25 1.03.4 1.38.51a3.3 3.3 0 0 0 1.53.1 2.5 2.5 0 0 0 1.64-1.16 2 2 0 0 0 .14-1.16c-.06-.1-.22-.16-.46-.28z" />
    </svg>
  )
}

// Ícone do Google Meet (câmera facetada nas 4 cores da marca) — usado no
// botão "Entrar na chamada" dos plantões.
export function GoogleMeetIcon({ size = 16, className = '' }: { size?: number; className?: string }) {
  return (
    <svg width={size} height={size} viewBox="0 0 36 36" className={className}>
      <path fill="#00832d" d="M16 15h6v6h-6z" />
      <path fill="#0066da" d="M10 9v6h6V9a2 2 0 0 0-2-2h-4a2 2 0 0 0 0 4z" />
      <path fill="#e94235" d="M16 9h6a2 2 0 0 1 2 2v4h-8z" />
      <path fill="#2684fc" d="M24 15h4a2 2 0 0 1 2 2v2a2 2 0 0 1-2 2h-4z" />
      <path fill="#00ac47" d="M10 21v4a2 2 0 0 0 2 2h4v-6z" />
      <path fill="#ffba00" d="M16 21h8v6h-6a2 2 0 0 1-2-2z" />
      <path fill="#00832d" d="M4 13a2 2 0 0 1 2-2h4v12H6a2 2 0 0 1-2-2z" />
    </svg>
  )
}
