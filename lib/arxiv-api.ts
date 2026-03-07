import { XMLParser } from 'fast-xml-parser'

import type { ArxivPaper } from '@/lib/chat-types'

const ARXIV_API_URL = 'https://export.arxiv.org/api/query'
const parser = new XMLParser({
  ignoreAttributes: false,
  parseAttributeValue: false,
  parseTagValue: false,
  trimValues: true,
})

type ArxivEntry = {
  author?: { name?: string } | Array<{ name?: string }>
  id?: string
  link?:
    | { href?: string; rel?: string; title?: string; type?: string }
    | Array<{ href?: string; rel?: string; title?: string; type?: string }>
  published?: string
  summary?: string
  title?: string
}

const toArray = <T>(value: T | T[] | undefined): T[] => {
  if (value == null) {
    return []
  }

  return Array.isArray(value) ? value : [value]
}

const normalizeWhitespace = (value: string | undefined) => (value ?? '').replace(/\s+/g, ' ').trim()

const extractPaperId = (entryId: string | undefined) => {
  if (!entryId) {
    return null
  }

  const match = entryId.match(/\/([^/]+)$/)
  return match?.[1] ?? null
}

const entryToPaper = (entry: ArxivEntry): ArxivPaper | null => {
  const id = extractPaperId(entry.id)

  if (!id) {
    return null
  }

  const links = toArray(entry.link)
  const pdfUrl =
    links.find((link) => link.title === 'pdf' || link.type === 'application/pdf')?.href ??
    `https://arxiv.org/pdf/${id}.pdf`
  const entryUrl = links.find((link) => link.rel === 'alternate')?.href ?? entry.id ?? null
  const published = entry.published ?? ''
  const year = published ? String(new Date(published).getUTCFullYear()) : ''

  return {
    id,
    title: normalizeWhitespace(entry.title),
    authors: toArray(entry.author)
      .map((author) => normalizeWhitespace(author.name))
      .filter(Boolean),
    abstract: normalizeWhitespace(entry.summary),
    published,
    year,
    pdfUrl,
    entryUrl,
  }
}

const parseFeed = (xml: string): ArxivPaper[] => {
  const document = parser.parse(xml) as { feed?: { entry?: ArxivEntry | ArxivEntry[] } }
  return toArray(document.feed?.entry)
    .map(entryToPaper)
    .filter((paper): paper is ArxivPaper => paper != null)
}

const fetchFeed = async (searchParams: Record<string, string>) => {
  const url = new URL(ARXIV_API_URL)

  for (const [key, value] of Object.entries(searchParams)) {
    url.searchParams.set(key, value)
  }

  const response = await fetch(url, {
    headers: {
      'User-Agent': 'agent-ui-workshop/0.1',
    },
  })

  if (!response.ok) {
    throw new Error(`arXiv request failed with status ${response.status}`)
  }

  return parseFeed(await response.text())
}

export const searchArxivPapers = async (query: string, maxResults = 8): Promise<ArxivPaper[]> =>
  fetchFeed({
    search_query: `all:${query}`,
    sortBy: 'relevance',
    sortOrder: 'descending',
    max_results: String(maxResults),
  })

export const fetchArxivPaper = async (arxivId: string): Promise<ArxivPaper> => {
  const [paper] = await fetchFeed({ id_list: arxivId.trim() })

  if (!paper) {
    throw new Error(`No arXiv paper found for id \"${arxivId}\"`)
  }

  return {
    ...paper,
    wasFetched: true,
  }
}
