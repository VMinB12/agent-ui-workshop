'use client'

import { MessageResponse } from '@/components/ai-elements/message'
import { cn } from '@/lib/utils'

import { getMessageContentParts, isTextPart, isToolPart } from './chat-message-parts'
import { ChatToolPart } from './chat-tool-part'

type ChatMessagePartProps = {
  messageId: string
  part: ReturnType<typeof getMessageContentParts>[number]
  isAssistant: boolean
}

export const ChatMessagePart = ({ messageId, part, isAssistant }: ChatMessagePartProps) => {
  if (isTextPart(part)) {
    return (
      <MessageResponse className={cn(isAssistant ? 'chat-assistant-copy' : undefined)}>{part.text}</MessageResponse>
    )
  }

  if (!isToolPart(part)) {
    return null
  }

  return <ChatToolPart part={part} key={`${messageId}-${part.type}`} />
}
