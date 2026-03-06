'use client'

import { useChat } from '@ai-sdk/react'
import { DefaultChatTransport, type ChatStatus } from 'ai'
import {
  Attachment,
  AttachmentInfo,
  AttachmentPreview,
  AttachmentRemove,
  Attachments,
} from '@/components/ai-elements/attachments'
import {
  Conversation,
  ConversationContent,
  ConversationEmptyState,
  ConversationScrollButton,
} from '@/components/ai-elements/conversation'
import { Message, MessageContent, MessageResponse } from '@/components/ai-elements/message'
import { Persona, type PersonaState } from '@/components/ai-elements/persona'
import {
  PromptInput,
  PromptInputActionAddAttachments,
  PromptInputActionMenu,
  PromptInputActionMenuContent,
  PromptInputActionMenuTrigger,
  PromptInputBody,
  PromptInputFooter,
  PromptInputHeader,
  PromptInputSubmit,
  PromptInputTextarea,
  PromptInputTools,
  usePromptInputAttachments,
} from '@/components/ai-elements/prompt-input'
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

const isFilePart = (part: unknown): part is { type: 'file'; filename?: string; mediaType: string; url: string } =>
  isRecord(part) &&
  part.type === 'file' &&
  typeof part.mediaType === 'string' &&
  typeof part.url === 'string' &&
  (typeof part.filename === 'string' || typeof part.filename === 'undefined')

const isToolPart = (part: unknown): part is ToolPart =>
  isRecord(part) &&
  typeof part.type === 'string' &&
  (part.type.startsWith('tool-') || part.type === 'dynamic-tool') &&
  typeof part.state === 'string' &&
  TOOL_STATES.has(part.state as ToolPart['state']) &&
  'input' in part &&
  'output' in part &&
  'errorText' in part

const PromptInputAttachmentsDisplay = () => {
  const attachments = usePromptInputAttachments()

  if (attachments.files.length === 0) {
    return null
  }

  return (
    <Attachments className="w-full" variant="inline">
      {attachments.files.map((attachment) => (
        <Attachment data={attachment} key={attachment.id} onRemove={() => attachments.remove(attachment.id)}>
          <AttachmentPreview />
          <AttachmentInfo />
          <AttachmentRemove />
        </Attachment>
      ))}
    </Attachments>
  )
}

const PromptInputSubmitControl = ({
  disabled,
  status,
  onStop,
}: {
  disabled: boolean
  status: ChatStatus
  onStop: () => void
}) => {
  const attachments = usePromptInputAttachments()

  return (
    <PromptInputSubmit
      className="chat-send-button"
      disabled={disabled && attachments.files.length === 0}
      onStop={onStop}
      status={status}
    />
  )
}

const MessageFileAttachments = ({
  files,
}: {
  files: Array<{ id: string; type: 'file'; filename?: string; mediaType: string; url: string }>
}) => {
  if (files.length === 0) {
    return null
  }

  return (
    <Attachments className="mt-3 w-full" variant="list">
      {files.map((file) => (
        <Attachment className="bg-background/55" data={file} key={file.id}>
          <AttachmentPreview />
          <AttachmentInfo showMediaType />
        </Attachment>
      ))}
    </Attachments>
  )
}

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

  const { messages, sendMessage, stop, status, error } = useChat({
    id: conversationId,
    transport: new DefaultChatTransport({ api: endpoint }),
  })

  const isGenerating = status === 'submitted' || status === 'streaming'

  const lastAssistantMessageId = useMemo(() => {
    for (let i = messages.length - 1; i >= 0; i -= 1) {
      if (messages[i].role !== 'user') {
        return messages[i].id
      }
    }
    return null
  }, [messages])

  return (
    <main className="chat-shell mx-auto flex min-h-screen w-full max-w-5xl flex-col p-4 sm:p-8">
      <header className="chat-header mb-6">
        <div className="group/title inline-flex flex-col">
          <h1 className="text-2xl font-semibold tracking-[-0.03em] sm:text-3xl">AI Chat</h1>
          <p className="mt-2 max-h-0 overflow-hidden text-xs text-muted-foreground opacity-0 transition-all duration-200 group-hover/title:max-h-10 group-hover/title:opacity-100">
            Endpoint: <code>{endpoint}</code>
          </p>
        </div>
      </header>

      <section className="chat-panel min-h-0 flex-1 overflow-hidden rounded-[2rem]">
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
              const fileParts = message.parts
                .filter(isFilePart)
                .map((part, index) => ({ ...part, id: `${message.id}-file-${index}` }))
              const contentParts = message.parts.filter((part) => !isFilePart(part))
              const isAssistant = message.role !== 'user'
              const isLastAssistantMessage = isAssistant && message.id === lastAssistantMessageId
              const assistantPersonaState: PersonaState =
                status === 'streaming' && isLastAssistantMessage ? 'streaming' : 'idle'

              return (
                <div className={cn('flex items-end gap-2', isAssistant ? '' : 'justify-end')} key={message.id}>
                  {isAssistant ? (
                    isLastAssistantMessage ? (
                      <Persona
                        className={cn(
                          'size-5 shrink-0 brightness-[0.55] contrast-150 saturate-0 transition-transform duration-300 dark:brightness-125 dark:contrast-110',
                          assistantPersonaState === 'streaming' ? 'scale-110' : 'scale-100',
                        )}
                        state={assistantPersonaState}
                        variant="command"
                      />
                    ) : (
                      <div aria-hidden className="size-5 shrink-0" />
                    )
                  ) : null}

                  <Message from={message.role}>
                    <MessageContent
                      className={cn(
                        isAssistant
                          ? 'border-none bg-transparent px-0 py-0'
                          : 'chat-user-bubble text-chat-user-foreground',
                      )}
                    >
                      {contentParts.map((part, index) => {
                        const key = `${message.id}-${index}`

                        if (isTextPart(part)) {
                          return (
                            <MessageResponse className={cn(isAssistant ? 'chat-assistant-copy' : undefined)} key={key}>
                              {part.text}
                            </MessageResponse>
                          )
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
                      <MessageFileAttachments files={fileParts} />
                    </MessageContent>
                  </Message>
                </div>
              )
            })}
          </ConversationContent>
          <ConversationScrollButton />
        </Conversation>
      </section>

      <PromptInput
        className="chat-composer"
        multiple
        onSubmit={async ({ text, files }) => {
          const next = text.trim()
          if (!next && files.length === 0) {
            return
          }

          setInput('')

          try {
            await sendMessage({ files, text: next })
          } catch (submitError) {
            setInput(text)
            throw submitError
          }
        }}
      >
        <PromptInputHeader>
          <PromptInputAttachmentsDisplay />
        </PromptInputHeader>
        <PromptInputBody>
          <PromptInputTextarea
            className="min-h-12 text-sm placeholder:text-muted-foreground/80"
            disabled={isGenerating}
            onChange={(event) => setInput(event.target.value)}
            placeholder="Ask me anything..."
            value={input}
          />
        </PromptInputBody>
        <PromptInputFooter>
          <PromptInputTools>
            <PromptInputActionMenu>
              <PromptInputActionMenuTrigger />
              <PromptInputActionMenuContent>
                <PromptInputActionAddAttachments />
              </PromptInputActionMenuContent>
            </PromptInputActionMenu>
          </PromptInputTools>
          <PromptInputSubmitControl disabled={!isGenerating && !input.trim()} onStop={stop} status={status} />
        </PromptInputFooter>
      </PromptInput>
      {error ? <p className="mx-auto mt-2 w-full max-w-4xl text-sm text-destructive">{error.message}</p> : null}
    </main>
  )
}
