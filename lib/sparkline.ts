// Pure geometry for the background charts (viewBox 0 0 100 40). No dependencies.
export const VB_W = 100
export const VB_H = 40

const r = (n: number) => Math.round(n * 100) / 100

// Smooth line + filled area under it.
export function areaPaths(data: number[]): { line: string; area: string } | null {
  const n = data.length
  if (n < 2) return null
  const max = Math.max(...data, 0)
  const pts = data.map((v, i) => [
    (i / (n - 1)) * VB_W,
    max > 0 ? VB_H - 6 - (v / max) * 24 : VB_H - 6, // flat baseline when everything is zero
  ])
  let line = `M ${r(pts[0][0])} ${r(pts[0][1])}`
  for (let i = 1; i < n; i++) {
    const [x0, y0] = pts[i - 1]
    const [x1, y1] = pts[i]
    const xm = (x0 + x1) / 2 // horizontal tangents = smooth, never overshoots
    line += ` C ${r(xm)} ${r(y0)} ${r(xm)} ${r(y1)} ${r(x1)} ${r(y1)}`
  }
  return { line, area: `${line} L ${VB_W} ${VB_H} L 0 ${VB_H} Z` }
}

export type Bar = { x: number; y: number; w: number; h: number; filled: boolean }

export function barRects(data: number[]): Bar[] {
  const n = data.length
  if (n < 1) return []
  const max = Math.max(...data, 0)
  const slot = VB_W / n
  return data.map((v, i) => {
    const h = max > 0 ? Math.max((v / max) * 26, v > 0 ? 4 : 1.5) : 1.5
    return { x: r(i * slot + slot * 0.2), y: r(VB_H - 3 - h), w: r(slot * 0.6), h: r(h), filled: v > 0 }
  })
}
