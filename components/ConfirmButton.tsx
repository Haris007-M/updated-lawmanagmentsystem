'use client'

// A submit button that asks "are you sure?" first (native dialog: accessible and works everywhere).
export default function ConfirmButton({
  message,
  className,
  children,
  ariaLabel,
}: {
  message: string
  className?: string
  children: React.ReactNode
  ariaLabel?: string
}) {
  return (
    <button
      type="submit"
      className={className}
      aria-label={ariaLabel}
      onClick={(e) => {
        if (!window.confirm(message)) e.preventDefault()
      }}
    >
      {children}
    </button>
  )
}
