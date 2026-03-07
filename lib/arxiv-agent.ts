import { openai } from '@ai-sdk/openai'
import { ToolLoopAgent, stepCountIs, tool, type UIMessageStreamWriter } from 'ai'
import { z } from 'zod'

import { fetchArxivPaper, searchArxivPapers } from '@/lib/arxiv-api'
import type { WorkshopUIMessage } from '@/lib/chat-types'

type FetchedArxivPaper = Awaited<ReturnType<typeof fetchArxivPaper>>

type ArxivFetchResult = {
  paper: FetchedArxivPaper
  pdfDataUrl: string | null
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

const createPdfDataUrl = async (paper: FetchedArxivPaper) => {
  const pdfUrl = paper.pdfUrl ?? `https://arxiv.org/pdf/${paper.id}.pdf`

  try {
    const response = await fetch(pdfUrl)

    if (!response.ok) {
      return null
    }

    const bytes = await response.arrayBuffer()
    const base64 = Buffer.from(bytes).toString('base64')
    return `data:application/pdf;base64,${base64}`
  } catch {
    return null
  }
}

export const createArxivAgent = (writer: UIMessageStreamWriter<WorkshopUIMessage>) =>
  new ToolLoopAgent({
    model: openai('gpt-5-mini'),
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
          const pdfDataUrl = await createPdfDataUrl(paper)

          writer.write({
            type: 'data-arxiv-paper',
            data: { paper },
            transient: true,
          })

          return { paper, pdfDataUrl }
        },
        toModelOutput: ({ output }) => ({
          type: 'content',
          value: output.pdfDataUrl
            ? [
                {
                  type: 'text',
                  text: `Fetched arXiv paper ${output.paper.id}: ${output.paper.title}. Authors: ${output.paper.authors.join(', ')}. Abstract: ${output.paper.abstract}`,
                },
                {
                  type: 'file-data',
                  data: output.pdfDataUrl,
                  mediaType: 'application/pdf',
                  filename: `${output.paper.id}.pdf`,
                },
              ]
            : [
                {
                  type: 'text',
                  text: `Fetched arXiv paper ${output.paper.id}: ${output.paper.title}. Authors: ${output.paper.authors.join(', ')}. Abstract: ${output.paper.abstract}. The PDF could not be attached to this step, so answer from the metadata only.`,
                },
              ],
        }),
      }),
    },
  })
