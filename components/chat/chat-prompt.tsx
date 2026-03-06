'use client'

import type { ChatStatus } from 'ai'

import {
  Attachment,
  AttachmentInfo,
  AttachmentPreview,
  AttachmentRemove,
  Attachments,
} from '@/components/ai-elements/attachments'
import {
  PromptInput,
  PromptInputActionAddAttachments,
  PromptInputActionMenu,
  PromptInputActionMenuContent,
  PromptInputActionMenuTrigger,
  PromptInputBody,
  PromptInputFooter,
  PromptInputHeader,
  type PromptInputMessage,
  PromptInputSubmit,
  PromptInputTextarea,
  PromptInputTools,
  usePromptInputAttachments,
} from '@/components/ai-elements/prompt-input'
import { useState } from 'react'

type ChatPromptProps = {
  status: ChatStatus
  onStop: () => void
  onSubmit: (message: PromptInputMessage) => Promise<void> | void
}

const PromptInputAttachmentsDisplay = () => {
  const attachments = usePromptInputAttachments()

  if (attachments.files.length === 0) {
    return null
  }

  return (
    <Attachments className="w-full" variant="inline">
      {attachments.files.map((attachment) => (
        <Attachment
          className="!rounded-none"
          data={attachment}
          key={attachment.id}
          onRemove={() => attachments.remove(attachment.id)}
        >
          <AttachmentPreview className="!rounded-none" />
          <AttachmentInfo />
          <AttachmentRemove className="!rounded-none" />
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

export const ChatPrompt = ({ status, onStop, onSubmit }: ChatPromptProps) => {
  const [input, setInput] = useState('')
  const isGenerating = status === 'submitted' || status === 'streaming'

  return (
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
          await onSubmit({ files, text: next })
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
          placeholder="Enter command or question..."
          value={input}
        />
      </PromptInputBody>
      <PromptInputFooter>
        <PromptInputTools>
          <PromptInputActionMenu>
            <PromptInputActionMenuTrigger className="!rounded-none" />
            <PromptInputActionMenuContent className="!rounded-none">
              <PromptInputActionAddAttachments />
            </PromptInputActionMenuContent>
          </PromptInputActionMenu>
        </PromptInputTools>
        <PromptInputSubmitControl disabled={!isGenerating && !input.trim()} onStop={onStop} status={status} />
      </PromptInputFooter>
    </PromptInput>
  )
}
