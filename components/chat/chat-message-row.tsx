'use client'

import type { ChatStatus, UIMessage } from 'ai'

import { Attachment, AttachmentInfo, AttachmentPreview, Attachments } from '@/components/ai-elements/attachments'
import { Message, MessageContent } from '@/components/ai-elements/message'
import { Persona, type PersonaState } from '@/components/ai-elements/persona'
import { Reasoning, ReasoningContent, ReasoningTrigger } from '@/components/ai-elements/reasoning'
import { cn } from '@/lib/utils'

import { ChatMessagePart } from './chat-message-part'
import { getMessageContentParts, getMessageFileParts, getMessageReasoningParts } from './chat-message-parts'

type ChatMessageRowProps = {
  message: UIMessage
  status: ChatStatus
  isLastAssistantMessage: boolean
}

const MessageFileAttachments = ({ files }: { files: ReturnType<typeof getMessageFileParts> }) => {
  if (files.length === 0) {
    return null
  }

  return (
    <Attachments className="mt-3 w-full" variant="list">
      {files.map((file) => (
        <Attachment className="rounded-2xl border-border/80 bg-background/70" data={file} key={file.id}>
          <AttachmentPreview className="rounded-xl" />
          <AttachmentInfo showMediaType />
        </Attachment>
      ))}
    </Attachments>
  )
}

export const ChatMessageRow = ({ message, status, isLastAssistantMessage }: ChatMessageRowProps) => {
  const fileParts = getMessageFileParts(message)
  const reasoningParts = getMessageReasoningParts(message)
  const contentParts = getMessageContentParts(message)
  const isAssistant = message.role !== 'user'
  const assistantPersonaState: PersonaState = status === 'streaming' && isLastAssistantMessage ? 'streaming' : 'idle'
  const reasoningText = reasoningParts.map((part) => part.text).join('\n\n')
  const isReasoningStreaming =
    isAssistant && isLastAssistantMessage && status === 'streaming' && reasoningParts.length > 0

  return (
    <div className={cn('flex gap-2', isAssistant ? 'items-start' : 'items-end justify-end')}>
      {isAssistant ? (
        isLastAssistantMessage ? (
          <Persona
            className={cn(
              'size-5 shrink-0 opacity-75 transition-transform duration-300 dark:opacity-90',
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
            isAssistant ? 'border-none bg-transparent px-0 py-0' : 'chat-user-bubble text-chat-user-foreground',
          )}
        >
          {isAssistant && reasoningText ? (
            <Reasoning className="w-full max-w-full" isStreaming={isReasoningStreaming}>
              <ReasoningTrigger />
              <ReasoningContent>{reasoningText}</ReasoningContent>
            </Reasoning>
          ) : null}
          {contentParts.map((part, index) => (
            <ChatMessagePart
              isAssistant={isAssistant}
              key={`${message.id}-${index}`}
              messageId={message.id}
              part={part}
            />
          ))}
          <MessageFileAttachments files={fileParts} />
        </MessageContent>
      </Message>
    </div>
  )
}
