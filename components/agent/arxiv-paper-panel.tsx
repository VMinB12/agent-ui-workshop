'use client'

import { ExternalLinkIcon, FileTextIcon } from 'lucide-react'

import type { ArxivPanelState } from '@/lib/chat-types'
import { cn } from '@/lib/utils'

const EmptyState = () => (
  <div className="flex h-full min-h-[18rem] items-center justify-center border border-border/80 bg-card/70 px-6 text-center">
    <div className="max-w-sm space-y-2">
      <p className="font-mono text-lg uppercase tracking-[0.18em] text-primary/90">Paper Shelf Is Empty</p>
      <p className="text-sm text-muted-foreground">
        Search for papers with the arXiv agent and they will collect here for quick PDF preview.
      </p>
    </div>
  </div>
)

export const ArxivPaperPanel = ({
  onSelectPaper,
  state,
}: {
  onSelectPaper: (paperId: string) => void
  state: ArxivPanelState
}) => {
  if (state.papers.length === 0) {
    return <EmptyState />
  }

  const selectedPaper = state.papers.find((paper) => paper.id === state.selectedPaperId) ?? state.papers[0]

  return (
    <div className="grid h-full min-h-0 gap-4 lg:grid-cols-[minmax(18rem,24rem)_1fr]">
      <div className="flex min-h-[16rem] flex-col border border-border/80 bg-card/70">
        <div className="border-b border-border/80 px-4 py-3">
          <p className="font-mono text-sm uppercase tracking-[0.18em] text-primary/90">Paper Shelf</p>
          <p className="mt-1 text-xs text-muted-foreground">{state.papers.length} papers discovered in this session</p>
        </div>
        <div className="min-h-0 flex-1 overflow-auto p-2">
          <div className="flex flex-col gap-2">
            {state.papers.map((paper) => {
              const isSelected = paper.id === selectedPaper.id

              return (
                <button
                  className={cn(
                    'w-full border px-3 py-3 text-left transition-colors',
                    isSelected
                      ? 'border-primary/80 bg-primary/10 text-foreground'
                      : 'border-border/70 bg-background/45 text-foreground/90 hover:border-primary/45 hover:bg-background/75',
                  )}
                  key={paper.id}
                  onClick={() => onSelectPaper(paper.id)}
                  type="button"
                >
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <p className="font-mono text-xs uppercase tracking-[0.16em] text-primary/80">{paper.id}</p>
                      <h3 className="mt-1 text-sm leading-snug">{paper.title}</h3>
                    </div>
                    {paper.wasFetched ? <FileTextIcon className="mt-0.5 size-4 shrink-0 text-primary/80" /> : null}
                  </div>
                  <p className="mt-2 line-clamp-2 text-xs text-muted-foreground">{paper.authors.join(', ')}</p>
                  <p className="mt-2 text-[0.68rem] uppercase tracking-[0.16em] text-muted-foreground">{paper.year}</p>
                </button>
              )
            })}
          </div>
        </div>
      </div>

      <div className="flex min-h-[24rem] min-w-0 flex-col border border-border/80 bg-card/70">
        <div className="border-b border-border/80 px-4 py-3">
          <div className="flex items-start justify-between gap-4">
            <div>
              <p className="font-mono text-xs uppercase tracking-[0.16em] text-primary/80">Selected Paper</p>
              <h3 className="mt-1 text-base leading-snug">{selectedPaper.title}</h3>
              <p className="mt-1 text-sm text-muted-foreground">{selectedPaper.authors.join(', ')}</p>
            </div>
            {selectedPaper.entryUrl ? (
              <a
                className="inline-flex items-center gap-1 text-xs uppercase tracking-[0.16em] text-primary/85 hover:text-primary"
                href={selectedPaper.entryUrl}
                rel="noreferrer"
                target="_blank"
              >
                Open Entry
                <ExternalLinkIcon className="size-3.5" />
              </a>
            ) : null}
          </div>
        </div>

        {selectedPaper.pdfUrl ? (
          <iframe
            className="min-h-0 flex-1 bg-background"
            src={selectedPaper.pdfUrl}
            title={`PDF preview for ${selectedPaper.id}`}
          />
        ) : (
          <div className="flex min-h-0 flex-1 items-center justify-center px-6 text-center text-sm text-muted-foreground">
            PDF preview is not available for the selected paper yet.
          </div>
        )}
      </div>
    </div>
  )
}
