'use client'

import type { ChatStatus } from 'ai'

import type { PromptInputMessage } from '@/components/ai-elements/prompt-input'
import { ChatMessageList } from '@/components/chat/chat-message-list'
import { ChatPrompt } from '@/components/chat/chat-prompt'
import type { AgentDefinition } from '@/lib/agents'
import type { WorkshopUIMessage } from '@/lib/chat-types'

type AgentChatPaneProps = {
  activeAgent: AgentDefinition
  error: Error | undefined
  lastAssistantMessageId: string | null
  messages: WorkshopUIMessage[]
  onStop: () => void
  onSubmit: (message: PromptInputMessage) => Promise<void> | void
  status: ChatStatus
}

export const AgentChatPane = ({
  activeAgent,
  error,
  lastAssistantMessageId,
  messages,
  onStop,
  onSubmit,
  status,
}: AgentChatPaneProps) => (
  <div className="flex h-full min-h-0 flex-col gap-4">
    <section className="chat-panel min-h-0 flex-1 overflow-hidden">
      <ChatMessageList lastAssistantMessageId={lastAssistantMessageId} messages={messages} status={status} />
    </section>

    <ChatPrompt
      onStop={onStop}
      onSubmit={onSubmit}
      starterSuggestions={activeAgent.starterSuggestions}
      status={status}
    />
    {error ? <p className="px-1 text-sm text-destructive">{error.message}</p> : null}
  </div>
)
