import { convertToModelMessages, createUIMessageStream, createUIMessageStreamResponse } from 'ai'

import { createArxivAgent } from '@/lib/arxiv-agent'
import type { WorkshopUIMessage } from '@/lib/chat-types'

export async function POST(_request: Request) {
  const { messages }: { messages: WorkshopUIMessage[] } = await _request.json()

  const stream = createUIMessageStream<WorkshopUIMessage>({
    execute: async ({ writer }) => {
      const agent = createArxivAgent(writer)
      const result = await agent.stream({
        messages: await convertToModelMessages(messages, { tools: agent.tools }),
      })

      writer.merge(result.toUIMessageStream({ sendReasoning: true }))
    },
  })

  return createUIMessageStreamResponse({ stream })
}
