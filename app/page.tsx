'use client'

import { useChat } from '@ai-sdk/react'
import { DefaultChatTransport } from 'ai'
import {
  Conversation,
  ConversationContent,
  ConversationEmptyState,
  ConversationScrollButton,
} from '@/components/ai-elements/conversation'
import { Message, MessageContent, MessageResponse } from '@/components/ai-elements/message'
import { Persona, type PersonaState } from '@/components/ai-elements/persona'
import { Tool, ToolContent, ToolHeader, ToolInput, ToolOutput, type ToolPart } from '@/components/ai-elements/tool'
import { cn } from '@/lib/utils'
import { MessageSquareIcon } from 'lucide-react'
import { nanoid } from 'nanoid'
import { useQueryState } from 'nuqs'
import { useEffect, useMemo, useState } from 'react'

const CHAT_API_BASE = (process.env.NEXT_PUBLIC_CHAT_API_BASE_URL?.trim() || 'http://127.0.0.1:8000/api').replace(
  /\/$/,
  '',
)

const buildChatEndpoint = (conversationId: string): string => `${CHAT_API_BASE}/chat/${conversationId}`

const TOOL_STATES: ReadonlySet<ToolPart['state']> = new Set([
  'approval-requested',
  'approval-responded',
  'input-available',
  'input-streaming',
  'output-available',
  'output-denied',
  'output-error',
])

const isRecord = (value: unknown): value is Record<string, unknown> => typeof value === 'object' && value !== null

const isTextPart = (part: unknown): part is { type: 'text'; text: string } =>
  isRecord(part) && part.type === 'text' && typeof part.text === 'string'

const isToolPart = (part: unknown): part is ToolPart =>
  isRecord(part) &&
  typeof part.type === 'string' &&
  (part.type.startsWith('tool-') || part.type === 'dynamic-tool') &&
  typeof part.state === 'string' &&
  TOOL_STATES.has(part.state as ToolPart['state']) &&
  'input' in part &&
  'output' in part &&
  'errorText' in part

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

      <section className="min-h-0 flex-1 overflow-hidden rounded-lg">
        <Conversation>
          <ConversationContent>
            {messages.length === 0 ? (
              <ConversationEmptyState
                description="Ask a question to begin chatting with the agent."
                icon={<MessageSquareIcon className="size-10" />}
                title="Start a conversation"
              />
            ) : null}

            {messages.map((message) => {
              const isAssistant = message.role !== 'user'
              const isLastAssistantMessage = isAssistant && message.id === lastAssistantMessageId
              const assistantPersonaState: PersonaState =
                status === 'streaming' && isLastAssistantMessage ? 'thinking' : 'idle'

              return (
                <div className={cn('flex items-end gap-2', isAssistant ? '' : 'justify-end')} key={message.id}>
                  {isAssistant ? (
                    isLastAssistantMessage ? (
                      <Persona
                        className={cn(
                          'size-10 shrink-0 rounded-full drop-shadow-sm brightness-[0.55] contrast-150 saturate-0 transition-transform duration-300 dark:brightness-125 dark:contrast-110',
                          assistantPersonaState === 'thinking' ? 'persona-streaming scale-110' : 'scale-100',
                        )}
                        state={assistantPersonaState}
                        variant="command"
                      />
                    ) : (
                      <div aria-hidden className="size-10 shrink-0" />
                    )
                  ) : null}

                  <Message from={message.role}>
                    <MessageContent
                      className={cn(
                        'group-[.is-user]:border group-[.is-user]:border-chat-user-border group-[.is-user]:bg-chat-user group-[.is-user]:text-chat-user-foreground',
                        'group-[.is-assistant]:border-none group-[.is-assistant]:bg-transparent group-[.is-assistant]:px-0 group-[.is-assistant]:py-0',
                      )}
                    >
                      {message.parts.map((part, index) => {
                        const key = `${message.id}-${index}`

                        if (isTextPart(part)) {
                          return <MessageResponse key={key}>{part.text}</MessageResponse>
                        }

                        if (!isToolPart(part)) {
                          return null
                        }

                        const isOpenByDefault = part.state === 'output-available' || part.state === 'output-error'

                        if (part.type === 'dynamic-tool') {
                          const dynamicToolName = typeof part.toolName === 'string' ? part.toolName : 'dynamic-tool'

                          return (
                            <Tool
                              className="border-chat-tool-border/70 bg-transparent"
                              defaultOpen={isOpenByDefault}
                              key={key}
                            >
                              <ToolHeader state={part.state} toolName={dynamicToolName} type={part.type} />
                              <ToolContent>
                                <ToolInput input={part.input} />
                                <ToolOutput errorText={part.errorText} output={part.output} />
                              </ToolContent>
                            </Tool>
                          )
                        }

                        return (
                          <Tool
                            className="border-chat-tool-border/70 bg-transparent"
                            defaultOpen={isOpenByDefault}
                            key={key}
                          >
                            <ToolHeader state={part.state} type={part.type} />
                            <ToolContent>
                              <ToolInput input={part.input} />
                              <ToolOutput errorText={part.errorText} output={part.output} />
                            </ToolContent>
                          </Tool>
                        )
                      })}
                    </MessageContent>
                  </Message>
                </div>
              )
            })}
          </ConversationContent>
          <ConversationScrollButton />
        </Conversation>
      </section>

      <form
        className="mt-4 border-t bg-background/90 pt-4"
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
        <div className="mx-auto flex w-full gap-2">
          <input
            className="h-10 flex-1 rounded-md border bg-background px-3 text-sm"
            disabled={status === 'submitted' || status === 'streaming'}
            onChange={(event) => setInput(event.target.value)}
            placeholder="Ask me anything..."
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
