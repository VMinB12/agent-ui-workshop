'use client'

import { AgentChatPane } from '@/components/agent/agent-chat-pane'
import { AgentDataPanel } from '@/components/agent/agent-data-panel'
import { AgentWorkspace } from '@/components/agent/agent-workspace'
import { ChatHeader } from '@/components/chat/chat-header'
import { useChatSession } from '@/hooks/use-chat-session'

export default function Home() {
  const {
    activeAgent,
    agentId,
    agents,
    dataPanel,
    endpoint,
    error,
    lastAssistantMessageId,
    messages,
    sendMessage,
    setAgentId,
    status,
    stop,
  } = useChatSession()

  const chatPane = (
    <AgentChatPane
      error={error}
      lastAssistantMessageId={lastAssistantMessageId}
      messages={messages}
      onStop={stop}
      onSubmit={sendMessage}
      status={status}
    />
  )

  return (
    <main className="chat-shell mx-auto flex min-h-screen w-full max-w-7xl flex-col p-4 sm:p-8">
      <ChatHeader agents={agents} endpoint={endpoint} onAgentSelect={setAgentId} selectedAgentId={agentId} />

      <AgentWorkspace
        chatPane={chatPane}
        dataPane={dataPanel.kind === 'none' ? null : <AgentDataPanel dataPanel={dataPanel} />}
        hasDataPanel={activeAgent.panelKind !== 'none'}
      />
    </main>
  )
}
