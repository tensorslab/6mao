import { FormEvent, useEffect, useRef, useState } from 'react'
import { Send, Trash2 } from 'lucide-react'
import type { ChatMessage, PetStatus } from '../api/types'
import { useChatStore } from '../store/chatHistory'
import { useStreamChat } from '../hooks/useStreamChat'
import { StatusPanel } from '../components/StatusPanel'

const EMPTY_MESSAGES: ChatMessage[] = []

export function ChatPage({
  petId,
  ownerId,
  status,
  statusLoading
}: {
  petId: string
  ownerId: string
  status?: PetStatus
  statusLoading: boolean
}) {
  const [input, setInput] = useState('')
  const scrollRef = useRef<HTMLDivElement | null>(null)
  const history = useChatStore((state) => state.histories[petId] ?? EMPTY_MESSAGES)
  const clearHistory = useChatStore((state) => state.clearHistory)
  const { sendMessage, streaming, currentReply, error } = useStreamChat(ownerId, petId)

  const messages: ChatMessage[] = currentReply
    ? [...history, { role: 'assistant', content: currentReply, timestamp: 0 }]
    : history

  useEffect(() => {
    const scroller = scrollRef.current
    if (!scroller) return
    scroller.scrollTo({ top: scroller.scrollHeight, behavior: 'smooth' })
  }, [messages.length, currentReply, streaming])

  const handleSubmit = (event: FormEvent): void => {
    event.preventDefault()
    const content = input
    setInput('')
    sendMessage(content)
  }

  return (
    <section className="flex h-full flex-col gap-4">
      <StatusPanel status={status} loading={statusLoading} />

      <div className="flex min-h-0 flex-1 flex-col rounded-[28px] border border-white/60 bg-white/70 shadow-xl shadow-[#2c2118]/10 backdrop-blur">
        <div className="flex items-center justify-between border-b border-[#2c2118]/10 px-4 py-3">
          <div>
            <p className="text-xs font-black uppercase tracking-[0.2em] text-[#f07f61]">Chat</p>
            <h2 className="font-black text-[#2c2118]">和猫咪说话</h2>
          </div>
          <button
            className="rounded-full bg-[#fff7e8] p-2 text-[#2c2118] transition hover:bg-[#f4b860] hover:text-white"
            onClick={() => clearHistory(petId)}
            aria-label="清空聊天历史"
          >
            <Trash2 size={16} />
          </button>
        </div>

        <div
          ref={scrollRef}
          className="min-h-0 flex-1 space-y-3 overflow-x-hidden overflow-y-auto p-4"
        >
          {messages.length === 0 ? (
            <div className="rounded-3xl bg-[#fff7e8] p-4 text-sm font-semibold text-[#2c2118]/65">
              先说点什么吧。猫咪正在假装没等你。
            </div>
          ) : null}

          {messages.map((message, index) => (
            <div
              key={`${message.timestamp}-${index}`}
              className={`flex min-w-0 ${message.role === 'user' ? 'justify-end' : 'justify-start'}`}
            >
              <div
                className={`min-w-0 max-w-[82%] whitespace-pre-wrap rounded-[24px] px-4 py-3 text-sm font-semibold leading-relaxed shadow [overflow-wrap:anywhere] ${
                  message.role === 'user'
                    ? 'rounded-br-md bg-[#2c2118] text-white'
                    : 'rounded-bl-md bg-[#fff7e8] text-[#2c2118]'
                }`}
              >
                {message.content}
                {streaming && index === messages.length - 1 ? (
                  <span className="animate-pulse"> |</span>
                ) : null}
              </div>
            </div>
          ))}
        </div>

        {error ? (
          <p className="mx-4 mb-2 rounded-2xl bg-[#f07f61]/15 px-3 py-2 text-xs font-bold text-[#9d2f1c]">
            {error}
          </p>
        ) : null}

        <form
          className="no-drag relative z-20 flex gap-2 border-t border-[#2c2118]/10 p-3"
          onSubmit={handleSubmit}
        >
          <textarea
            className="no-drag min-h-24 flex-1 resize-y rounded-2xl border border-white/70 bg-white/85 px-4 py-3 text-sm font-semibold leading-relaxed outline-none ring-[#f4b860] transition focus:ring-4"
            value={input}
            onChange={(event) => setInput(event.target.value)}
            onKeyDown={(event) => {
              if (event.key === 'Enter' && !event.shiftKey) {
                event.preventDefault()
                event.currentTarget.form?.requestSubmit()
              }
            }}
            placeholder="输入消息，Enter 发送"
          />
          <button
            className="no-drag grid h-11 w-11 place-items-center rounded-2xl bg-[#f07f61] text-white shadow-lg transition hover:scale-105 disabled:opacity-50"
            disabled={streaming || !input.trim()}
            aria-label="发送"
          >
            <Send size={18} />
          </button>
        </form>
      </div>
    </section>
  )
}
