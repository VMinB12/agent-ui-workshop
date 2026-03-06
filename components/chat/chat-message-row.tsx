'use client'

import type { ChatStatus, UIMessage } from 'ai'

import { Attachment, AttachmentInfo, AttachmentPreview, Attachments } from '@/components/ai-elements/attachments'
import { Message, MessageContent } from '@/components/ai-elements/message'
import { Persona, type PersonaState } from '@/components/ai-elements/persona'
import { cn } from '@/lib/utils'

import { ChatMessagePart } from './chat-message-part'
import { getMessageContentParts, getMessageFileParts } from './chat-message-parts'

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
        <Attachment className="bg-background/55" data={file} key={file.id}>
          <AttachmentPreview />
          <AttachmentInfo showMediaType />
        </Attachment>
      ))}
    </Attachments>
  )
}

export const ChatMessageRow = ({ message, status, isLastAssistantMessage }: ChatMessageRowProps) => {
  const fileParts = getMessageFileParts(message)
  const contentParts = getMessageContentParts(message)
  const isAssistant = message.role !== 'user'
  const assistantPersonaState: PersonaState = status === 'streaming' && isLastAssistantMessage ? 'streaming' : 'idle'

  return (
    <div className={cn('flex gap-2', isAssistant ? 'items-start' : 'items-end justify-end')}>
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
            isAssistant ? 'border-none bg-transparent px-0 py-0' : 'chat-user-bubble text-chat-user-foreground',
          )}
        >
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
