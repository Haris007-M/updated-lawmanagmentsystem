'use client'

// Last-resort screen if the root layout itself fails. Inline styles: the stylesheet may be missing here.
export default function GlobalError({ reset }: { error: Error & { digest?: string }; reset: () => void }) {
  return (
    <html lang="en">
      <body style={{ margin: 0, fontFamily: 'system-ui, sans-serif', background: '#f8fafc', color: '#0f172a' }}>
        <main style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: 24, textAlign: 'center' }}>
          <h1 style={{ fontSize: 28, margin: 0 }}>Something went wrong / کچھ غلط ہو گیا</h1>
          <p style={{ maxWidth: 420, lineHeight: 1.6, color: '#475569' }}>
            The application hit an unexpected problem. Your data is safe. Please try again.
          </p>
          <button
            type="button"
            onClick={reset}
            style={{ marginTop: 12, background: '#c5a880', color: '#0f172a', border: 0, borderRadius: 8, padding: '10px 18px', fontWeight: 600, cursor: 'pointer' }}
          >
            Try again
          </button>
        </main>
      </body>
    </html>
  )
}
