'use client'

import { useChat } from '@ai-sdk/react'
import { DefaultChatTransport } from 'ai'
import { nanoid } from 'nanoid'
import { useQueryState } from 'nuqs'
import { useCallback, useEffect, useMemo, useState } from 'react'

import {
  AGENT_CONVERSATION_QUERY_PARAMS,
  agentDefinitions,
  agentList,
  DEFAULT_AGENT_ID,
  isAgentId,
  type AgentId,
} from '@/lib/agents'
import type { WorkshopDataPart, WorkshopUIMessage } from '@/lib/chat-types'

export const useChatSession = () => {
  const [agentIdParam, setAgentIdParam] = useQueryState('agent')
  const [sqlConversationIdParam, setSqlConversationIdParam] = useQueryState(AGENT_CONVERSATION_QUERY_PARAMS.sql)
  const [arxivConversationIdParam, setArxivConversationIdParam] = useQueryState(AGENT_CONVERSATION_QUERY_PARAMS.arxiv)
  const [panelStateByConversation, setPanelStateByConversation] = useState<Record<string, unknown>>({})

  const agentId = isAgentId(agentIdParam) ? agentIdParam : DEFAULT_AGENT_ID
  const sqlConversationId = useMemo(() => sqlConversationIdParam ?? `sql-${nanoid(8)}`, [sqlConversationIdParam])
  const arxivConversationId = useMemo(
    () => arxivConversationIdParam ?? `arxiv-${nanoid(8)}`,
    [arxivConversationIdParam],
  )
  const activeAgent = agentDefinitions[agentId]
  const conversationId = agentId === 'sql' ? sqlConversationId : arxivConversationId
  const conversationKey = `${agentId}:${conversationId}`

  useEffect(() => {
    if (!isAgentId(agentIdParam)) {
      void setAgentIdParam(DEFAULT_AGENT_ID, {
        history: 'replace',
      })
    }
  }, [agentIdParam, setAgentIdParam])

  useEffect(() => {
    if (!sqlConversationIdParam) {
      void setSqlConversationIdParam(sqlConversationId, {
        history: 'replace',
      })
    }
  }, [sqlConversationId, sqlConversationIdParam, setSqlConversationIdParam])

  useEffect(() => {
    if (!arxivConversationIdParam) {
      void setArxivConversationIdParam(arxivConversationId, {
        history: 'replace',
      })
    }
  }, [arxivConversationId, arxivConversationIdParam, setArxivConversationIdParam])

  const endpoint = useMemo(() => activeAgent.buildEndpoint(conversationId), [activeAgent, conversationId])

  const updatePanelState = useCallback(
    (dataPart: WorkshopDataPart) => {
      const dataPanel = activeAgent.dataPanel

      if (!dataPanel) {
        return
      }

      setPanelStateByConversation((currentPanelState) => ({
        ...currentPanelState,
        [conversationKey]: dataPanel.applyDataPart(
          currentPanelState[conversationKey] ?? dataPanel.createState(),
          dataPart,
        ),
      }))
    },
    [activeAgent, conversationKey],
  )

  const { messages, sendMessage, stop, status, error } = useChat<WorkshopUIMessage>({
    id: conversationId,
    transport: new DefaultChatTransport({ api: endpoint }),
    onData: (dataPart) => updatePanelState(dataPart as WorkshopDataPart),
  })

  const lastAssistantMessageId = useMemo(() => {
    for (let i = messages.length - 1; i >= 0; i -= 1) {
      if (messages[i].role !== 'user') {
        return messages[i].id
      }
    }

    return null
  }, [messages])

  const activePanelState = useMemo(
    () =>
      activeAgent.dataPanel
        ? (panelStateByConversation[conversationKey] ?? activeAgent.dataPanel.createState())
        : null,
    [activeAgent, conversationKey, panelStateByConversation],
  )

  const setActivePanelState = useCallback(
    (updater: (state: unknown) => unknown) => {
      const dataPanel = activeAgent.dataPanel

      if (!dataPanel) {
        return
      }

      setPanelStateByConversation((currentPanelState) => ({
        ...currentPanelState,
        [conversationKey]: updater(currentPanelState[conversationKey] ?? dataPanel.createState()),
      }))
    },
    [activeAgent, conversationKey],
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
