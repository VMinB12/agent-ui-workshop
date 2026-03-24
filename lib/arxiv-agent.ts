import { openai, type OpenAILanguageModelResponsesOptions } from '@ai-sdk/openai'
import { ToolLoopAgent, stepCountIs, tool, type UIMessageStreamWriter } from 'ai'
import { z } from 'zod'

import { fetchArxivPaper, searchArxivPapers } from '@/lib/arxiv-api'
import type { WorkshopUIMessage } from '@/lib/chat-types'

type FetchedArxivPaper = Awaited<ReturnType<typeof fetchArxivPaper>>

type ArxivFetchResult = {
  paper: FetchedArxivPaper
}

const instructions = `You are an arXiv research assistant.

Help the user find relevant papers, summarize them faithfully, and fetch PDFs when deeper inspection is needed.

Rules:
- Prefer searching before fetching unless the user gives a specific arXiv id.
- When you cite a paper, mention its arXiv id.
- Use the fetched PDF when the user asks detailed questions about a paper.
- Do not claim to have read a PDF unless you actually fetched it in the current turn.
- Keep answers concise but useful.
- Make no more than 3 searches in parallel and no more than 2 fetches in parallel.`

export const createArxivAgent = (writer: UIMessageStreamWriter<WorkshopUIMessage>) =>
  new ToolLoopAgent({
    model: openai('gpt-5-mini'),
    providerOptions: {
      openai: {
        reasoningSummary: 'auto',
      } satisfies OpenAILanguageModelResponsesOptions,
    },
    instructions,
    stopWhen: stepCountIs(6),
    tools: {
      search: tool({
        description: 'Search arXiv for relevant papers by topic, method, author, or title keywords.',
        inputSchema: z.object({
          query: z.string().min(2).describe('The search query to run against arXiv'),
        }),
        execute: async ({ query }) => {
          const papers = await searchArxivPapers(query)

          writer.write({
            type: 'data-arxiv-search-results',
            data: { papers },
            transient: true,
          })

          return {
            papers: papers.map((paper) => ({
              id: paper.id,
              title: paper.title,
              authors: paper.authors,
              abstract: paper.abstract,
              year: paper.year,
              pdfUrl: paper.pdfUrl,
            })),
          }
        },
      }),
      fetch: tool<{ arxiv_id: string }, ArxivFetchResult>({
        description: 'Fetch a specific arXiv paper PDF and make it available for detailed question answering.',
        inputSchema: z.object({
          arxiv_id: z.string().min(3).describe('The arXiv identifier, for example 1706.03762 or 1706.03762v7'),
        }),
        execute: async ({ arxiv_id }) => {
          const paper = await fetchArxivPaper(arxiv_id)

          writer.write({
            type: 'data-arxiv-paper',
            data: { paper },
            transient: true,
          })

          return { paper }
        },
        toModelOutput: ({ output }) => {
          const pdfUrl = output.paper.pdfUrl ?? `https://arxiv.org/pdf/${output.paper.id}.pdf`

          return {
            type: 'content',
            value: [
              {
                type: 'text',
                text: `Fetched arXiv paper ${output.paper.id}: ${output.paper.title}. Authors: ${output.paper.authors.join(', ')}. Abstract: ${output.paper.abstract}`,
              },
              {
                data: pdfUrl,
                filename: `${output.paper.id}.pdf`,
                mediaType: 'application/pdf',
                type: 'file',
              } as unknown as {
                type: 'file-data'
                data: string
                mediaType: string
                filename?: string
              },
            ],
          }
        },
      }),
    },
  })
