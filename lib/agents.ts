import { createElement, type ReactNode } from 'react'

import { ArxivPaperPanel } from '@/components/agent/arxiv-paper-panel'
import { SqlResultPanel } from '@/components/agent/sql-result-panel'
import {
  EMPTY_ARXIV_PANEL_STATE,
  isArxivPaperDataPart,
  isArxivSearchResultsDataPart,
  isSqlResultDataPart,
  mergeArxivPapers,
  type ArxivPanelState,
  type SqlResultData,
  type WorkshopDataPart,
} from '@/lib/chat-types'

const CHAT_API_BASE = (process.env.NEXT_PUBLIC_CHAT_API_BASE_URL?.trim() || 'http://127.0.0.1:8000/api').replace(
  /\/$/,
  '',
)

export type AgentId = 'sql' | 'arxiv'

type AgentDataPanelRenderProps<TState> = {
  state: TState
  updateState: (updater: (state: TState) => TState) => void
}

type AgentDataPanelDefinition<TState> = {
  title: string
  createState: () => TState
  applyDataPart: (state: TState, dataPart: WorkshopDataPart) => TState
  render: (props: AgentDataPanelRenderProps<TState>) => ReactNode
}

export type AgentDataPanelContract = {
  title: string
  createState: () => unknown
  applyDataPart: (state: unknown, dataPart: WorkshopDataPart) => unknown
  render: (props: { state: unknown; updateState: (updater: (state: unknown) => unknown) => void }) => ReactNode
}

const defineAgentDataPanel = <TState>(definition: AgentDataPanelDefinition<TState>): AgentDataPanelContract => ({
  title: definition.title,
  createState: () => definition.createState(),
  applyDataPart: (state, dataPart) => definition.applyDataPart(state as TState, dataPart),
  render: ({ state, updateState }) =>
    definition.render({
      state: state as TState,
      updateState: (updater) => updateState((currentState) => updater(currentState as TState)),
    }),
})

export interface AgentDefinition {
  id: AgentId
  name: string
  description: string
  starterSuggestions: string[]
  buildEndpoint: (conversationId: string) => string
  dataPanel?: AgentDataPanelContract
}

export const DEFAULT_AGENT_ID: AgentId = 'sql'

export const AGENT_CONVERSATION_QUERY_PARAMS: Record<AgentId, string> = {
  sql: 'sqlConversationId',
  arxiv: 'arxivConversationId',
}

export const agentDefinitions: Record<AgentId, AgentDefinition> = {
  sql: {
    id: 'sql',
    name: 'SQL Analyst',
    description: 'Query the Chinook sample database and inspect structured results.',
    starterSuggestions: [
      'Display the top 5 artists by sales.',
      'Who is the best rock artist and how many songs do they have?',
    ],
    buildEndpoint: (conversationId) => `${CHAT_API_BASE}/chat/${conversationId}`,
    dataPanel: defineAgentDataPanel<SqlResultData | null>({
      title: 'Query Result',
      createState: () => null,
      applyDataPart: (state, dataPart) => (isSqlResultDataPart(dataPart) ? dataPart.data : state),
      render: ({ state }) => createElement(SqlResultPanel, { result: state }),
    }),
  },
  arxiv: {
    id: 'arxiv',
    name: 'arXiv Researcher',
    description: 'Search papers, fetch PDFs, and keep a browsable paper shelf.',
    starterSuggestions: [
      'Find me an interesting paper on the attention mechanism',
      'What is the latest development on RAG systems?',
    ],
    buildEndpoint: (conversationId) => `/api/agents/arxiv/${conversationId}`,
    dataPanel: defineAgentDataPanel<ArxivPanelState>({
      title: 'Paper Browser',
      createState: () => ({ ...EMPTY_ARXIV_PANEL_STATE, papers: [] }),
      applyDataPart: (state, dataPart) => {
        if (isArxivSearchResultsDataPart(dataPart)) {
          const papers = mergeArxivPapers(state.papers, dataPart.data.papers)

          return {
            papers,
            selectedPaperId: state.selectedPaperId ?? papers[0]?.id ?? null,
          }
        }

        if (isArxivPaperDataPart(dataPart)) {
          const papers = mergeArxivPapers(state.papers, [dataPart.data.paper])

          return {
            papers,
            selectedPaperId: dataPart.data.paper.id,
          }
        }

        return state
      },
      render: ({ state, updateState }) =>
        createElement(ArxivPaperPanel, {
          onSelectPaper: (paperId: string) =>
            updateState((currentState) => ({ ...currentState, selectedPaperId: paperId })),
          state,
        }),
    }),
  },
}

export const agentList = Object.values(agentDefinitions)

export const isAgentId = (value: string | null | undefined): value is AgentId => value === 'sql' || value === 'arxiv'
