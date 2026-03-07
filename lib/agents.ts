import type { AgentPanelKind } from '@/lib/chat-types'

const CHAT_API_BASE = (process.env.NEXT_PUBLIC_CHAT_API_BASE_URL?.trim() || 'http://127.0.0.1:8000/api').replace(
  /\/$/,
  '',
)

export type AgentId = 'sql' | 'arxiv'

export interface AgentDefinition {
  id: AgentId
  name: string
  description: string
  panelKind: AgentPanelKind
  buildEndpoint: (conversationId: string) => string
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
    panelKind: 'sql',
    buildEndpoint: (conversationId) => `${CHAT_API_BASE}/chat/${conversationId}`,
  },
  arxiv: {
    id: 'arxiv',
    name: 'arXiv Researcher',
    description: 'Search papers, fetch PDFs, and keep a browsable paper shelf.',
    panelKind: 'arxiv',
    buildEndpoint: (conversationId) => `/api/agents/arxiv/${conversationId}`,
  },
}

export const agentList = Object.values(agentDefinitions)

export const isAgentId = (value: string | null | undefined): value is AgentId => value === 'sql' || value === 'arxiv'
