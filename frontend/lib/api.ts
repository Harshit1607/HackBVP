import type { SensingFrame, Session } from './types'

const API_BASE = process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:8000'

// GET /api/health → { status: string, has_data: boolean }
export async function getHealth(): Promise<{ status: string; has_data: boolean }> {
  const response = await fetch(`${API_BASE}/api/health`)
  if (!response.ok) throw new Error('API unreachable')
  return response.json()
}

// GET /api/sensing/latest → SensingFrame | null (null on 503)
export async function getLatestFrame(): Promise<SensingFrame | null> {
  try {
    const response = await fetch(`${API_BASE}/api/sensing/latest`, { cache: 'no-store' })
    if (response.status === 503) return null
    if (!response.ok) return null
    return response.json()
  } catch (err) {
    return null
  }
}

// GET /api/sessions → Session[]
export async function getSessions(): Promise<Session[]> {
  const response = await fetch(`${API_BASE}/api/sessions`)
  if (!response.ok) return []
  return response.json()
}

// POST /api/sessions/{filename}/play?speed=X → ok: boolean
export async function playSession(filename: string, speed: number): Promise<boolean> {
  const response = await fetch(`${API_BASE}/api/sessions/${filename}/play?speed=${speed}`, {
    method: 'POST',
  })
  return response.ok
}

// POST /api/sessions/stop → ok: boolean
export async function stopSession(): Promise<boolean> {
  const response = await fetch(`${API_BASE}/api/sessions/stop`, {
    method: 'POST',
  })
  return response.ok
}
