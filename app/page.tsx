'use client'

import { useChat } from '@ai-sdk/react'
import { DefaultChatTransport } from 'ai'
import { useId, useMemo, useState } from 'react'

const CHAT_API_BASE_PATH = process.env.NEXT_PUBLIC_CHAT_API_BASE_PATH ?? '/api/chat'
const CHAT_ROUTE_PATH = process.env.NEXT_PUBLIC_CHAT_ROUTE_PATH ?? '/chat'

const normalizePath = (value: string): string => {
  if (!value.startsWith('/')) {
    return `/${value}`
  }
  return value
}

const stripTrailingSlash = (value: string): string => (value.endsWith('/') ? value.slice(0, -1) : value)

const buildChatEndpoint = (conversationId: string): string => {
  const base = stripTrailingSlash(normalizePath(CHAT_API_BASE_PATH))
  const route = normalizePath(CHAT_ROUTE_PATH)
  return `${base}${route}/${conversationId}`
}

const getMessageText = (parts: Array<{ type: string; text?: string }>): string =>
  parts
    .filter((part) => part.type === 'text' && typeof part.text === 'string')
    .map((part) => part.text)
    .join('')

export default function Home() {
  const [input, setInput] = useState('')
  const reactId = useId()

  const conversationId = useMemo(() => `chat-${reactId.replaceAll(':', '')}`, [reactId])
  const endpoint = useMemo(() => buildChatEndpoint(conversationId), [conversationId])

  const { messages, sendMessage, status, error } = useChat({
    id: conversationId,
    transport: new DefaultChatTransport({ api: endpoint }),
  })

  return (
    <main className="mx-auto flex min-h-screen w-full max-w-4xl flex-col p-4 sm:p-8">
      <header className="mb-6 border-b pb-4">
        <h1 className="text-xl font-semibold">AI Chat</h1>
        <p className="text-sm text-muted-foreground">
          Endpoint: <code>{endpoint}</code>
        </p>
      </header>

      <section className="flex-1 space-y-4 overflow-y-auto pb-28">
        {messages.length === 0 ? (
          <p className="text-sm text-muted-foreground">Ask a question to start chatting.</p>
        ) : null}

        {messages.map((message) => {
          const text = getMessageText(message.parts)
          return (
            <article
              key={message.id}
              className={`max-w-[85%] rounded-lg px-4 py-3 text-sm ${
                message.role === 'user'
                  ? 'ml-auto bg-primary text-primary-foreground'
                  : 'bg-secondary text-secondary-foreground'
              }`}
            >
              {text || <span className="opacity-70">(no text content)</span>}
            </article>
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
