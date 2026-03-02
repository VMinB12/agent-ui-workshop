'use client'

import { useChat } from '@ai-sdk/react'
import { DefaultChatTransport } from 'ai'
import { Persona, type PersonaState } from '@/components/ai-elements/persona'
import { nanoid } from 'nanoid'
import { useQueryState } from 'nuqs'
import { useEffect, useMemo, useState } from 'react'

const CHAT_API_BASE = (process.env.NEXT_PUBLIC_CHAT_API_BASE_URL?.trim() || 'http://127.0.0.1:8000/api').replace(
  /\/$/,
  '',
)

const buildChatEndpoint = (conversationId: string): string => `${CHAT_API_BASE}/chat/${conversationId}`

const getMessageText = (parts: Array<{ type: string; text?: string }>): string =>
  parts
    .filter((part) => part.type === 'text' && typeof part.text === 'string')
    .map((part) => part.text)
    .join('')

export default function Home() {
  const [input, setInput] = useState('')
  const [conversationIdParam, setConversationIdParam] = useQueryState('conversationId')

  const conversationId = useMemo(() => conversationIdParam ?? `chat-${nanoid(8)}`, [conversationIdParam])

  useEffect(() => {
    if (!conversationIdParam) {
      void setConversationIdParam(conversationId, {
        history: 'replace',
      })
    }
  }, [conversationId, conversationIdParam, setConversationIdParam])

  const endpoint = useMemo(() => buildChatEndpoint(conversationId), [conversationId])

  const { messages, sendMessage, status, error } = useChat({
    id: conversationId,
    transport: new DefaultChatTransport({ api: endpoint }),
  })

  const lastAssistantMessageId = useMemo(() => {
    for (let i = messages.length - 1; i >= 0; i -= 1) {
      if (messages[i].role !== 'user') {
        return messages[i].id
      }
    }
    return null
  }, [messages])

  return (
    <main className="mx-auto flex min-h-screen w-full max-w-4xl flex-col p-4 sm:p-8">
      <header className="mb-6 border-b pb-4">
        <div className="group/title inline-flex flex-col">
          <h1 className="text-xl font-semibold">AI Chat</h1>
          <p className="max-h-0 overflow-hidden text-xs text-muted-foreground opacity-0 transition-all duration-200 group-hover/title:mt-1 group-hover/title:max-h-10 group-hover/title:opacity-100">
            Endpoint: <code>{endpoint}</code>
          </p>
        </div>
      </header>

      <section className="flex-1 space-y-4 overflow-y-auto pb-28">
        {messages.length === 0 ? (
          <p className="text-sm text-muted-foreground">Ask a question to start chatting.</p>
        ) : null}

        {messages.map((message) => {
          const text = getMessageText(message.parts)
          const isAssistant = message.role !== 'user'
          const isLastAssistantMessage = isAssistant && message.id === lastAssistantMessageId
          const assistantPersonaState: PersonaState =
            status === 'streaming' && isLastAssistantMessage ? 'thinking' : 'idle'

          return (
            <div key={message.id} className={`flex items-end gap-2 ${isAssistant ? '' : 'justify-end'}`}>
              {isLastAssistantMessage ? (
                <Persona
                  className={`size-10 shrink-0 rounded-full drop-shadow-sm brightness-[0.55] contrast-150 saturate-0 transition-transform duration-300 dark:brightness-125 dark:contrast-110 ${assistantPersonaState === 'thinking' ? 'persona-streaming scale-110' : 'scale-100'}`}
                  state={assistantPersonaState}
                  variant="command"
                />
              ) : null}
              <article
                className={`max-w-[85%] rounded-lg px-4 py-3 text-sm ${
                  isAssistant ? 'bg-secondary text-secondary-foreground' : 'bg-primary text-primary-foreground'
                }`}
              >
                {text}
              </article>
            </div>
          )
        })}
      </section>

      <form
        className="fixed inset-x-0 bottom-0 border-t bg-background/90 p-4 backdrop-blur"
        onSubmit={(event) => {
          event.preventDefault()
          const next = input.trim()
          if (!next) {
            return
          }

          sendMessage({ text: next })
          setInput('')
        }}
      >
        <div className="mx-auto flex w-full max-w-4xl gap-2">
          <input
            className="h-10 flex-1 rounded-md border bg-background px-3 text-sm"
            disabled={status === 'submitted' || status === 'streaming'}
            onChange={(event) => setInput(event.target.value)}
            placeholder="Ask about the Chinook database..."
            value={input}
          />
          <button
            className="h-10 rounded-md bg-primary px-4 text-sm font-medium text-primary-foreground disabled:opacity-50"
            disabled={!input.trim() || status === 'submitted' || status === 'streaming'}
            type="submit"
          >
            Send
          </button>
        </div>
        {error ? <p className="mx-auto mt-2 w-full max-w-4xl text-sm text-destructive">{error.message}</p> : null}
      </form>
    </main>
  )
}
