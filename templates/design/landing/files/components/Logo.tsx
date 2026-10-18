type LogoProps = {
  className?: string
}

/** Placeholder brand mark. Replace with your own SVG. */
export function Logo({ className = 'h-8 w-8' }: LogoProps) {
  return (
    <svg className={className} viewBox="0 0 32 32" fill="none" aria-hidden="true">
      <rect width="32" height="32" rx="8" className="fill-brand-600" />
      <path d="M9 21.5 16 9l7 12.5H9Z" className="fill-white" />
      <circle cx="16" cy="18" r="2.2" className="fill-brand-600" />
    </svg>
  )
}
