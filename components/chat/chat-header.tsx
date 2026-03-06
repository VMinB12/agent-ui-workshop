'use client'

type ChatHeaderProps = {
  endpoint: string
}

export const ChatHeader = ({ endpoint }: ChatHeaderProps) => (
  <header className="chat-header mb-6">
    <div className="group/title flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
      <div className="inline-flex flex-col">
        <span className="font-sans text-[0.68rem] tracking-[0.32em] text-primary/80">Node 01 / Agent Console</span>
        <h1 className="font-mono text-4xl leading-none tracking-[0.12em] text-primary sm:text-5xl">AI Chat</h1>
      </div>
      <p className="max-h-0 overflow-hidden font-sans text-[0.68rem] text-muted-foreground opacity-0 transition-all duration-200 group-hover/title:max-h-10 group-hover/title:opacity-100 sm:text-right">
        Endpoint:{' '}
        <code className="text-primary/85" suppressHydrationWarning>
          {endpoint}
        </code>
      </p>
    </div>
  </header>
)
