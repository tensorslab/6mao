import { useRef, useState } from 'react'
import { streamChat } from '../api/chat'
import { useChatStore } from '../store/chatHistory'

export function useStreamChat(ownerId: string, petId: string) {
  const [streaming, setStreaming] = useState(false)
  const [currentReply, setCurrentReply] = useState('')
  const [error, setError] = useState<string | null>(null)
  const abortRef = useRef<AbortController | null>(null)
  // Track the latest accumulated reply so stop() can preserve partial text.
  const latestReplyRef = useRef('')
  const addMessage = useChatStore((state) => state.addMessage)

  const sendMessage = async (content: string): Promise<void> => {
    const trimmed = content.trim()
    if (!trimmed || streaming) return

    abortRef.current?.abort()
    const controller = new AbortController()
    abortRef.current = controller

    addMessage(petId, { role: 'user', content: trimmed, timestamp: Date.now() })
    setStreaming(true)
    setCurrentReply('')
    setError(null)
    latestReplyRef.current = ''
    window.electronAPI.notifyPetEmotion('talk')

    let fullReply = ''
    try {
      for await (const chunk of streamChat(ownerId, petId, trimmed, controller.signal)) {
        if (!chunk) continue
        fullReply += chunk
        latestReplyRef.current = fullReply
        setCurrentReply(fullReply)
      }

      addMessage(petId, { role: 'assistant', content: fullReply, timestamp: Date.now() })
      window.electronAPI.notifyPetEmotion('happy')
    } catch (caught) {
      // AbortError means user pressed stop — save whatever we have so far.
      if (caught instanceof DOMException && caught.name === 'AbortError') {
        if (fullReply.trim()) {
          addMessage(petId, { role: 'assistant', content: fullReply, timestamp: Date.now() })
        }
      } else {
        const message = caught instanceof Error ? caught.message : '发送失败'
        setError(message)
        window.electronAPI.notifyPetEmotion('sad')
      }
    } finally {
      setCurrentReply('')
      setStreaming(false)
      abortRef.current = null
    }
  }

  const stop = (): void => {
    abortRef.current?.abort()
    // Don't clear currentReply here — sendMessage's finally block handles cleanup.
  }

  return { sendMessage, stop, streaming, currentReply, error }
}
