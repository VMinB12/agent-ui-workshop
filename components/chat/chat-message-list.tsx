'use client'

import type { ChatStatus, UIMessage } from 'ai'

import { Conversation, ConversationContent, ConversationScrollButton } from '@/components/ai-elements/conversation'
import { MessageSquareIcon } from 'lucide-react'

import type { PromptInputMessage } from '@/components/ai-elements/prompt-input'
import { ChatPrompt } from './chat-prompt'
import { ChatMessageRow } from './chat-message-row'

type ChatMessageListProps = {
  error: Error | undefined
  messages: UIMessage[]
  lastAssistantMessageId: string | null
  onStop: () => void
  onSubmit: (message: PromptInputMessage) => Promise<void> | void
  starterSuggestions: string[]
  status: ChatStatus
}

export const ChatMessageList = ({
  error,
  messages,
  status,
  lastAssistantMessageId,
  onStop,
  onSubmit,
  starterSuggestions,
}: ChatMessageListProps) => (
  <div className="flex h-full min-h-0 flex-col">
    <Conversation>
      <ConversationContent className="gap-8 pt-6 sm:pt-8">
        {messages.length === 0 ? (
          <div className="flex flex-1 flex-col items-center justify-center gap-3 px-6 py-10 text-center">
            <div className="text-muted-foreground">
              <MessageSquareIcon className="size-9" />
            </div>
            <div className="space-y-2">
              <h3 className="text-base font-semibold tracking-[-0.02em] text-foreground">Start with a prompt</h3>
              <p className="max-w-md text-sm leading-6 text-muted-foreground">
                Use the composer below to explore the selected agent and its connected tools.
              </p>
            </div>
          </div>
        ) : null}

        {messages.map((message) => (
          <ChatMessageRow
            isLastAssistantMessage={message.role !== 'user' && message.id === lastAssistantMessageId}
            key={message.id}
            message={message}
            status={status}
          />
        ))}
      </ConversationContent>
      <ConversationScrollButton />
    </Conversation>

    <div className="chat-panel-footer shrink-0 px-4 pb-4 pt-3 sm:px-6 sm:pb-6 sm:pt-4">
      <ChatPrompt
        isConversationEmpty={messages.length === 0}
        onStop={onStop}
        onSubmit={onSubmit}
        starterSuggestions={starterSuggestions}
        status={status}
      />
      {error ? <p className="mt-3 px-1 text-sm text-destructive">{error.message}</p> : null}
    </div>
  </div>
)
