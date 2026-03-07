'use client'

import { AgentChatPane } from '@/components/agent/agent-chat-pane'
import { AgentDataPanel } from '@/components/agent/agent-data-panel'
import { AgentWorkspace } from '@/components/agent/agent-workspace'
import { ChatHeader } from '@/components/chat/chat-header'
import { useChatSession } from '@/hooks/use-chat-session'

export default function Home() {
  const {
    activeAgent,
    activePanelState,
    agentId,
    agents,
    endpoint,
    error,
    lastAssistantMessageId,
    messages,
    sendMessage,
    setActivePanelState,
    setAgentId,
    status,
    stop,
  } = useChatSession()

  const chatPane = (
    <AgentChatPane
      activeAgent={activeAgent}
      error={error}
      lastAssistantMessageId={lastAssistantMessageId}
      messages={messages}
      onStop={stop}
      onSubmit={sendMessage}
      status={status}
    />
  )

  return (
    <main className="chat-shell mx-auto flex h-[100dvh] w-full max-w-7xl flex-col overflow-hidden p-4 sm:p-8">
      <ChatHeader agents={agents} endpoint={endpoint} onAgentSelect={setAgentId} selectedAgentId={agentId} />

      <AgentWorkspace
        chatPane={chatPane}
        dataPane={
          activeAgent.dataPanel ? (
            <AgentDataPanel
              activeAgent={activeAgent}
              panelState={activePanelState}
              setPanelState={setActivePanelState}
            />
          ) : null
        }
        hasDataPanel={activeAgent.dataPanel != null}
      />
    </main>
  )
}
