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
import {
  EMPTY_ARXIV_PANEL_STATE,
  isArxivPaperDataPart,
  isArxivSearchResultsDataPart,
  isSqlResultDataPart,
  mergeArxivPapers,
  type ArxivPanelState,
  type SqlResultData,
  type WorkshopDataPart,
  type WorkshopUIMessage,
} from '@/lib/chat-types'

type ConversationPanelState = {
  arxiv: ArxivPanelState
  sqlResult: SqlResultData | null
}

const createEmptyConversationPanelState = (): ConversationPanelState => ({
  arxiv: EMPTY_ARXIV_PANEL_STATE,
  sqlResult: null,
})

const applyDataPartToState = (state: ConversationPanelState, dataPart: WorkshopDataPart): ConversationPanelState => {
  if (isSqlResultDataPart(dataPart)) {
    return {
      ...state,
      sqlResult: dataPart.data,
    }
  }

  if (isArxivSearchResultsDataPart(dataPart)) {
    const papers = mergeArxivPapers(state.arxiv.papers, dataPart.data.papers)

    return {
      ...state,
      arxiv: {
        papers,
        selectedPaperId: state.arxiv.selectedPaperId ?? papers[0]?.id ?? null,
      },
    }
  }

  if (isArxivPaperDataPart(dataPart)) {
    const papers = mergeArxivPapers(state.arxiv.papers, [dataPart.data.paper])

    return {
      ...state,
      arxiv: {
        papers,
        selectedPaperId: dataPart.data.paper.id,
      },
    }
  }

  return state
}

export type ActiveDataPanelState =
  | { kind: 'none' }
  | { kind: 'sql'; title: string; result: SqlResultData | null }
  | { kind: 'arxiv'; title: string; onSelectPaper: (paperId: string) => void; state: ArxivPanelState }

export const useChatSession = () => {
  const [agentIdParam, setAgentIdParam] = useQueryState('agent')
  const [sqlConversationIdParam, setSqlConversationIdParam] = useQueryState(AGENT_CONVERSATION_QUERY_PARAMS.sql)
  const [arxivConversationIdParam, setArxivConversationIdParam] = useQueryState(AGENT_CONVERSATION_QUERY_PARAMS.arxiv)
  const [panelStateByConversation, setPanelStateByConversation] = useState<Record<string, ConversationPanelState>>({})

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
      setPanelStateByConversation((currentPanelState) => ({
        ...currentPanelState,
        [conversationKey]: applyDataPartToState(
          currentPanelState[conversationKey] ?? createEmptyConversationPanelState(),
          dataPart,
        ),
      }))
    },
    [conversationKey],
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

  const selectArxivPaper = useCallback(
    (paperId: string) => {
      setPanelStateByConversation((currentPanelState) => {
        const conversationPanelState = currentPanelState[conversationKey] ?? createEmptyConversationPanelState()

        return {
          ...currentPanelState,
          [conversationKey]: {
            ...conversationPanelState,
            arxiv: {
              ...conversationPanelState.arxiv,
              selectedPaperId: paperId,
            },
          },
        }
      })
    },
    [conversationKey],
  )

  const currentPanelState = panelStateByConversation[conversationKey] ?? createEmptyConversationPanelState()

  const dataPanel: ActiveDataPanelState = useMemo(() => {
    if (activeAgent.panelKind === 'sql') {
      return {
        kind: 'sql',
        title: 'Query Result',
        result: currentPanelState.sqlResult,
      }
    }

    if (activeAgent.panelKind === 'arxiv') {
      return {
        kind: 'arxiv',
        title: 'Paper Browser',
        onSelectPaper: selectArxivPaper,
        state: currentPanelState.arxiv,
      }
    }

    return { kind: 'none' }
  }, [activeAgent.panelKind, currentPanelState.arxiv, currentPanelState.sqlResult, selectArxivPaper])

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
    dataPanel,
    endpoint,
    error,
    lastAssistantMessageId,
    messages,
    sendMessage,
    setAgentId,
    status,
    stop,
  }
}
