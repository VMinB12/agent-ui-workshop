'use client'

type ChatHeaderProps = {
  endpoint: string
}

export const ChatHeader = ({ endpoint }: ChatHeaderProps) => (
  <header className="chat-header mb-6">
    <div className="group/title inline-flex flex-col">
      <h1 className="text-2xl font-semibold tracking-[-0.03em] sm:text-3xl">AI Chat</h1>
      <p className="mt-2 max-h-0 overflow-hidden text-xs text-muted-foreground opacity-0 transition-all duration-200 group-hover/title:max-h-10 group-hover/title:opacity-100">
        Endpoint: <code>{endpoint}</code>
      </p>
    </div>
  </header>
)
