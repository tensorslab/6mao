import { useRef, useState } from 'react'
import { streamChat } from '../api/chat'
import { useChatStore } from '../store/chatHistory'

export function useStreamChat(petId: string) {
  const [streaming, setStreaming] = useState(false)
  const [currentReply, setCurrentReply] = useState('')
  const [error, setError] = useState<string | null>(null)
  const abortRef = useRef<AbortController | null>(null)
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
    window.electronAPI.notifyPetEmotion('talk')

    let fullReply = ''
    try {
      for await (const chunk of streamChat(petId, trimmed, controller.signal)) {
        fullReply += chunk
        setCurrentReply(fullReply)
      }

      addMessage(petId, { role: 'assistant', content: fullReply, timestamp: Date.now() })
      window.electronAPI.notifyPetEmotion('happy')
    } catch (caught) {
      const message = caught instanceof Error ? caught.message : '发送失败'
      setError(message)
      window.electronAPI.notifyPetEmotion('sad')
    } finally {
      setCurrentReply('')
      setStreaming(false)
      abortRef.current = null
    }
  }

  const stop = (): void => {
    abortRef.current?.abort()
    abortRef.current = null
    setStreaming(false)
    setCurrentReply('')
    window.electronAPI.notifyPetEmotion('idle')
  }

  return { sendMessage, stop, streaming, currentReply, error }
}
