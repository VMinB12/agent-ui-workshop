'use client'

import { useChat } from '@ai-sdk/react'
import { DefaultChatTransport } from 'ai'
import { nanoid } from 'nanoid'
import { useQueryState } from 'nuqs'
import { useEffect, useMemo } from 'react'

const CHAT_API_BASE = (process.env.NEXT_PUBLIC_CHAT_API_BASE_URL?.trim() || 'http://127.0.0.1:8000/api').replace(
  /\/$/,
  '',
)

const buildChatEndpoint = (conversationId: string): string => `${CHAT_API_BASE}/chat/${conversationId}`

export const useChatSession = () => {
  const [conversationIdParam, setConversationIdParam] = useQueryState('conversationId')

  const conversationId = useMemo(() => conversationIdParam ?? `chat-${nanoid(8)}`, [conversationIdParam])

  useEffect(() => {
    if (!conversationIdParam) {
      void setConversationIdParam(conversationId, {
        history: 'replace',
      })
    }
  }, [conversationId, conversationIdParam, setConversationIdParam])

  const endpoint = useMemo(() => buildChatEndpoint(conversationId), [conversationId])

  const { messages, sendMessage, stop, status, error } = useChat({
    id: conversationId,
    transport: new DefaultChatTransport({ api: endpoint }),
  })

  const lastAssistantMessageId = useMemo(() => {
    for (let i = messages.length - 1; i >= 0; i -= 1) {
      if (messages[i].role !== 'user') {
        return messages[i].id
      }
    }

    return null
  }, [messages])

  return {
    endpoint,
    error,
    lastAssistantMessageId,
    messages,
    sendMessage,
    status,
    stop,
  }
}
