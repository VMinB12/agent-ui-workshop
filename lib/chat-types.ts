import type { DataUIPart, UIMessage } from 'ai'

export type SqlResultRow = Record<string, unknown>

export interface SqlResultData {
  sql_query: string
  columns: string[]
  rows: SqlResultRow[]
  row_count: number
  column_count: number
}

export interface ArxivPaper {
  id: string
  title: string
  authors: string[]
  abstract: string
  published: string
  year: string
  pdfUrl: string | null
  entryUrl: string | null
  wasFetched?: boolean
}

export interface ArxivSearchResultsData {
  papers: ArxivPaper[]
}

export interface ArxivPaperData {
  paper: ArxivPaper
}

export type WorkshopDataParts = {
  'sql-result': SqlResultData
  'arxiv-search-results': ArxivSearchResultsData
  'arxiv-paper': ArxivPaperData
}

export type WorkshopUIMessage = UIMessage<never, WorkshopDataParts>
export type WorkshopDataPart = DataUIPart<WorkshopDataParts>

export interface ArxivPanelState {
  papers: ArxivPaper[]
  selectedPaperId: string | null
}

export const EMPTY_ARXIV_PANEL_STATE: ArxivPanelState = {
  papers: [],
  selectedPaperId: null,
}

export const mergeArxivPapers = (existingPapers: ArxivPaper[], incomingPapers: ArxivPaper[]): ArxivPaper[] => {
  const existingPaperById = new Map(existingPapers.map((paper) => [paper.id, paper]))
  const mergedPapers = new Map(existingPaperById)

  for (const paper of incomingPapers) {
    const existingPaper = mergedPapers.get(paper.id)

    mergedPapers.set(paper.id, {
      ...existingPaper,
      ...paper,
      authors: paper.authors.length > 0 ? paper.authors : (existingPaper?.authors ?? []),
      abstract: paper.abstract || existingPaper?.abstract || '',
      pdfUrl: paper.pdfUrl ?? existingPaper?.pdfUrl ?? null,
      entryUrl: paper.entryUrl ?? existingPaper?.entryUrl ?? null,
      wasFetched: paper.wasFetched ?? existingPaper?.wasFetched,
    })
  }

  return [...existingPapers]
    .map((paper) => mergedPapers.get(paper.id) ?? paper)
    .concat(incomingPapers.filter((paper) => !existingPaperById.has(paper.id)))
}

export const isSqlResultDataPart = (
  dataPart: WorkshopDataPart,
): dataPart is Extract<WorkshopDataPart, { type: 'data-sql-result' }> => dataPart.type === 'data-sql-result'

export const isArxivSearchResultsDataPart = (
  dataPart: WorkshopDataPart,
): dataPart is Extract<WorkshopDataPart, { type: 'data-arxiv-search-results' }> =>
  dataPart.type === 'data-arxiv-search-results'

export const isArxivPaperDataPart = (
  dataPart: WorkshopDataPart,
): dataPart is Extract<WorkshopDataPart, { type: 'data-arxiv-paper' }> => dataPart.type === 'data-arxiv-paper'
