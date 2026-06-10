import { API_BASE_URL, apiFetch } from './client'
import type { ChatResponse } from './types'

export function sendChat(petId: string, message: string): Promise<ChatResponse> {
  return apiFetch<ChatResponse>(`/api/pet/${encodeURIComponent(petId)}/chat`, {
    method: 'POST',
    body: JSON.stringify({ message })
  })
}

export async function* streamChat(
  petId: string,
  message: string,
  signal?: AbortSignal
): AsyncGenerator<string> {
  const response = await fetch(`${API_BASE_URL}/api/pet/${encodeURIComponent(petId)}/chat/stream`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ message }),
    signal
  })

  if (!response.ok) {
    throw new Error((await response.text().catch(() => response.statusText)) || 'Stream failed')
  }

  if (!response.body) {
    throw new Error('Readable stream is not available')
  }

  const reader = response.body.getReader()
  const decoder = new TextDecoder()
  let buffer = ''

  while (true) {
    const { done, value } = await reader.read()
    if (done) break

    buffer += decoder.decode(value, { stream: true })
    const lines = buffer.split(/\r?\n/)
    buffer = lines.pop() ?? ''

    for (const line of lines) {
      const trimmed = line.trim()
      if (!trimmed.startsWith('data:')) continue

      const data = trimmed.slice(5).trim()
      if (!data) continue
      if (data === '[DONE]') return

      try {
        const parsed = JSON.parse(data) as { content?: string; delta?: string }
        yield parsed.content ?? parsed.delta ?? data
      } catch {
        yield data
      }
    }
  }
}
