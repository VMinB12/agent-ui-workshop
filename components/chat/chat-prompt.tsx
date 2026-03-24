'use client'

import type { ChatStatus } from 'ai'
import { useCallback, useState } from 'react'

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
import { Suggestion, Suggestions } from '@/components/ai-elements/suggestion'

type ChatPromptProps = {
  isConversationEmpty: boolean
  status: ChatStatus
  onStop: () => void
  onSubmit: (message: PromptInputMessage) => Promise<void> | void
  starterSuggestions: string[]
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
          className="rounded-none!"
          data={attachment}
          key={attachment.id}
          onRemove={() => attachments.remove(attachment.id)}
        >
          <AttachmentPreview className="rounded-none!" />
          <AttachmentInfo />
          <AttachmentRemove className="rounded-none!" />
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

export const ChatPrompt = ({ isConversationEmpty, status, onStop, onSubmit, starterSuggestions }: ChatPromptProps) => {
  const [input, setInput] = useState('')
  const [hasDismissedSuggestions, setHasDismissedSuggestions] = useState(false)
  const isGenerating = status === 'submitted' || status === 'streaming'
  const shouldShowSuggestions = isConversationEmpty && starterSuggestions.length > 0 && !hasDismissedSuggestions

  const handleSuggestionClick = useCallback(
    (suggestion: string) => {
      if (isGenerating) {
        return
      }

      setInput(suggestion)
      setHasDismissedSuggestions(true)
    },
    [isGenerating],
  )

  const handleInputChange = useCallback((event: React.ChangeEvent<HTMLTextAreaElement>) => {
    const nextValue = event.target.value

    if (nextValue.trim() !== '') {
      setHasDismissedSuggestions(true)
    }

    setInput(nextValue)
  }, [])

  return (
    <div className="shrink-0">
      {shouldShowSuggestions ? (
        <Suggestions className="mb-3 flex-wrap px-1 pb-1">
          {starterSuggestions.map((suggestion) => (
            <Suggestion
              className="rounded-full border-border bg-card px-4 py-2 text-sm text-foreground shadow-sm hover:border-primary/35 hover:bg-accent"
              disabled={isGenerating}
              key={suggestion}
              onClick={handleSuggestionClick}
              suggestion={suggestion}
              variant="outline"
            />
          ))}
        </Suggestions>
      ) : null}

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
            className="min-h-12 text-sm leading-6 placeholder:text-muted-foreground/80"
            disabled={isGenerating}
            onChange={handleInputChange}
            placeholder="Ask a question or describe a task..."
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
          <PromptInputSubmitControl disabled={!isGenerating && !input.trim()} onStop={onStop} status={status} />
        </PromptInputFooter>
      </PromptInput>
    </div>
  )
}
