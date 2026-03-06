'use client'

import { ChatHeader } from '@/components/chat/chat-header'
import { ChatMessageList } from '@/components/chat/chat-message-list'
import { ChatPrompt } from '@/components/chat/chat-prompt'
import { useChatSession } from '@/hooks/use-chat-session'

export default function Home() {
  const { endpoint, error, lastAssistantMessageId, messages, sendMessage, status, stop } = useChatSession()

  return (
    <main className="chat-shell mx-auto flex min-h-screen w-full max-w-5xl flex-col p-4 sm:p-8">
      <ChatHeader endpoint={endpoint} />

      <section className="chat-panel min-h-0 flex-1 overflow-hidden rounded-[2rem]">
        <ChatMessageList lastAssistantMessageId={lastAssistantMessageId} messages={messages} status={status} />
      </section>

      <ChatPrompt onStop={stop} onSubmit={sendMessage} status={status} />
      {error ? <p className="mx-auto mt-2 w-full max-w-4xl text-sm text-destructive">{error.message}</p> : null}
    </main>
  )
}
