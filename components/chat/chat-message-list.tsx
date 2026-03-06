'use client'

import type { ChatStatus, UIMessage } from 'ai'

import {
  Conversation,
  ConversationContent,
  ConversationEmptyState,
  ConversationScrollButton,
} from '@/components/ai-elements/conversation'
import { MessageSquareIcon } from 'lucide-react'

import { ChatMessageRow } from './chat-message-row'

type ChatMessageListProps = {
  messages: UIMessage[]
  status: ChatStatus
  lastAssistantMessageId: string | null
}

export const ChatMessageList = ({ messages, status, lastAssistantMessageId }: ChatMessageListProps) => (
  <Conversation>
    <ConversationContent>
      {messages.length === 0 ? (
        <ConversationEmptyState
          description="Ask a question to begin chatting with the agent."
          icon={<MessageSquareIcon className="size-10" />}
          title="Start a conversation"
        />
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
)
