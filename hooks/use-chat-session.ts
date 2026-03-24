'use client'

import { useChat } from '@ai-sdk/react'
import { DefaultChatTransport } from 'ai'
import { useQueryState } from 'nuqs'
import { useCallback, useEffect, useMemo, useState } from 'react'

import { agentDefinitions, agentList, DEFAULT_AGENT_ID, isAgentId, type AgentId } from '@/lib/agents'
import type { WorkshopDataPart, WorkshopUIMessage } from '@/lib/chat-types'

export const useChatSession = () => {
  const [agentIdParam, setAgentIdParam] = useQueryState('agent')
  const [panelStateByAgent, setPanelStateByAgent] = useState<Partial<Record<AgentId, unknown>>>({})

  const agentId = isAgentId(agentIdParam) ? agentIdParam : DEFAULT_AGENT_ID
  const activeAgent = agentDefinitions[agentId]
  const activeDataPanel = activeAgent.dataPanel
  const endpoint = activeAgent.buildEndpoint()

  useEffect(() => {
    if (!isAgentId(agentIdParam)) {
      void setAgentIdParam(DEFAULT_AGENT_ID, {
        history: 'replace',
      })
    }
  }, [agentIdParam, setAgentIdParam])

  const updatePanelState = useCallback(
    (dataPart: WorkshopDataPart) => {
      if (!activeDataPanel) {
        return
      }

      setPanelStateByAgent((currentPanelState) => ({
        ...currentPanelState,
        [agentId]: activeDataPanel.applyDataPart(
          currentPanelState[agentId] ?? activeDataPanel.createState(),
          dataPart,
        ),
      }))
    },
    [activeDataPanel, agentId],
  )

  const { messages, sendMessage, stop, status, error } = useChat<WorkshopUIMessage>({
    id: agentId,
    transport: new DefaultChatTransport({ api: endpoint }),
    onData: (dataPart) => updatePanelState(dataPart as WorkshopDataPart),
  })

  const lastAssistantMessageId = messages.findLast((message) => message.role !== 'user')?.id ?? null

  const activePanelState = useMemo(
    () => (activeDataPanel ? (panelStateByAgent[agentId] ?? activeDataPanel.createState()) : null),
    [activeDataPanel, agentId, panelStateByAgent],
  )

  const setActivePanelState = useCallback(
    (updater: (state: unknown) => unknown) => {
      if (!activeDataPanel) {
        return
      }

      setPanelStateByAgent((currentPanelState) => ({
        ...currentPanelState,
        [agentId]: updater(currentPanelState[agentId] ?? activeDataPanel.createState()),
      }))
    },
    [activeDataPanel, agentId],
  )

  const setAgentId = useCallback(
    (nextAgentId: AgentId) => {
      void setAgentIdParam(nextAgentId, { history: 'push' })
    },
    [setAgentIdParam],
  )

  return {
    activeAgent,
    agentId,
    agents: agentList,
    activePanelState,
    endpoint,
    error,
    lastAssistantMessageId,
    messages,
    sendMessage,
    setActivePanelState,
    setAgentId,
    status,
    stop,
  }
}
