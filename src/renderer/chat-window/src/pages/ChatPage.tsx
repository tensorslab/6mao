import { FormEvent, useEffect, useRef, useState } from 'react'
import { Send, Trash2 } from 'lucide-react'
import type { ChatMessage, PetStatus } from '../api/types'
import { useChatStore } from '../store/chatHistory'
import { useStreamChat } from '../hooks/useStreamChat'
import { StatusPanel } from '../components/StatusPanel'

const EMPTY_MESSAGES: ChatMessage[] = []

// 扩展类型：兼容现有 ChatMessage，并允许携带可选的思考过程字段
type ExtendedChatMessage = ChatMessage & {
  thought?: { reason?: string } | string
}

// 大师工作状态（如果 useStreamChat / store 暂未提供，则默认 falsy 不渲染）
type MasterState = {
  active?: boolean
  name?: string
  artifact?: { content?: string; title?: string } | null
}

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
  const streamChatState = useStreamChat(ownerId, petId) as ReturnType<typeof useStreamChat> & {
    masterActive?: boolean
    masterName?: string
    artifact?: MasterState['artifact']
  }
  const { sendMessage, streaming, currentReply, error } = streamChatState

  // 大师状态：优先使用 hook 透出的状态，否则保持空（UI 用条件渲染兜底）
  const masterActive: boolean = Boolean(streamChatState.masterActive)
  const masterName: string = streamChatState.masterName ?? '喵大师'
  const artifact = streamChatState.artifact ?? null

  const messages: ExtendedChatMessage[] = currentReply
    ? [...history, { role: 'assistant', content: currentReply, timestamp: 0 }]
    : history

  useEffect(() => {
    const scroller = scrollRef.current
    if (!scroller) return
    scroller.scrollTo({ top: scroller.scrollHeight, behavior: 'smooth' })
  }, [messages.length, currentReply, streaming, masterActive, artifact])

  const handleSubmit = (event: FormEvent): void => {
    event.preventDefault()
    const content = input
    setInput('')
    sendMessage(content)
  }

  return (
    <section className="flex h-full flex-col gap-4">
      <StatusPanel status={status} loading={statusLoading} />

      <div className="flex min-h-0 flex-1 flex-col rounded-token-xl border border-white/60 bg-white/70 shadow-card backdrop-blur">
        <div className="flex items-center justify-between border-b border-[var(--ink-700)]/10 px-4 py-3">
          <div>
            <p className="text-xs font-black uppercase tracking-[0.2em] text-accent">Chat</p>
            <h2 className="font-black text-fg">和猫咪说话</h2>
          </div>
          <button
            className="no-drag rounded-full bg-[var(--washi-50)] p-2 text-fg transition hover:bg-accent hover:text-white"
            onClick={() => clearHistory(petId)}
            aria-label="清空聊天历史"
          >
            <Trash2 size={16} />
          </button>
        </div>

        <div ref={scrollRef} className="min-h-0 flex-1 space-y-3 overflow-y-auto p-4">
          {messages.length === 0 && !masterActive && !artifact ? (
            <div className="rounded-token-lg bg-[var(--washi-50)] p-4 text-sm font-semibold text-[var(--ink-700)]/65">
              先说点什么吧。猫咪正在假装没等你。
            </div>
          ) : null}

          {messages.map((message, index) => {
            const isUser = message.role === 'user'
            const thought =
              !isUser && message.thought
                ? typeof message.thought === 'string'
                  ? { reason: message.thought }
                  : message.thought
                : null

            return (
              <div
                key={`${message.timestamp}-${index}`}
                className={`flex flex-col ${isUser ? 'items-end' : 'items-start'}`}
              >
                {isUser ? (
                  <div className="max-w-[82%] rounded-token-lg rounded-br-md bg-[var(--ink-700)] px-4 py-3 text-sm font-semibold leading-relaxed text-white shadow-card">
                    {message.content}
                  </div>
                ) : (
                  <div className="max-w-[82%] rounded-token-lg bg-white/80 backdrop-blur-sm border-l-[3px] border-[var(--accent-current)] shadow-card p-3 text-sm font-semibold leading-relaxed text-fg">
                    {message.content}
                    {streaming && index === messages.length - 1 ? (
                      <span className="animate-pulse"> |</span>
                    ) : null}
                  </div>
                )}

                {thought && thought.reason ? (
                  <details className="mt-1 ml-3">
                    <summary className="text-xs text-[var(--ink-700)]/50 cursor-pointer hover:text-accent">
                      💭 思考过程
                    </summary>
                    <div className="mt-1 pl-2 border-l border-[var(--accent-current)]/20 text-xs text-[var(--ink-700)]/60">
                      {thought.reason}
                    </div>
                  </details>
                ) : null}
              </div>
            )
          })}

          {/* 大师正在工作 */}
          {masterActive ? (
            <div className="mx-1 my-2 rounded-token-lg bg-master-active border border-[var(--accent-current)]/20 p-3 animate-master-pulse">
              <div className="flex items-center gap-2">
                <span className="h-2 w-2 rounded-full bg-accent animate-pulse" />
                <span className="text-sm font-medium text-fg">
                  {masterName} · 正在工作中...
                </span>
              </div>
            </div>
          ) : null}

          {/* 大师结果卡片 */}
          {artifact && artifact.content ? (
            <div className="mx-1 my-2 rounded-token-lg bg-white/90 border border-[var(--accent-current)]/30 shadow-card p-4">
              <div className="text-xs text-accent font-medium mb-1">
                ✨ {artifact.title ?? `${masterName} 完成`}
              </div>
              <div className="text-sm text-fg whitespace-pre-wrap">{artifact.content}</div>
            </div>
          ) : null}
        </div>

        {error ? (
          <p className="mx-4 mb-2 rounded-token-md bg-accent-light px-3 py-2 text-xs font-bold text-[var(--kaki-700)]">
            {error}
          </p>
        ) : null}

        <form
          className="no-drag relative z-20 flex gap-2 border-t border-[var(--ink-700)]/10 p-3"
          onSubmit={handleSubmit}
        >
          <textarea
            className="no-drag min-h-24 flex-1 resize-y rounded-token-md border border-white/70 bg-white/85 px-4 py-3 text-sm font-semibold leading-relaxed text-fg outline-none transition focus:border-[var(--accent-current)] focus:ring-2 focus:ring-[var(--accent-current)]/40"
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
            className="no-drag grid h-11 w-11 place-items-center rounded-token-md bg-accent text-white shadow-card transition hover:scale-105 hover:opacity-90 disabled:opacity-50"
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
