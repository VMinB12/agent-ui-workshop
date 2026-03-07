'use client'

import type { ActiveDataPanelState } from '@/hooks/use-chat-session'

import { ArxivPaperPanel } from './arxiv-paper-panel'
import { SqlResultPanel } from './sql-result-panel'

export const AgentDataPanel = ({ dataPanel }: { dataPanel: ActiveDataPanelState }) => {
  if (dataPanel.kind === 'none') {
    return null
  }

  return (
    <div className="flex h-full min-h-0 flex-col">
      <div className="mb-3 px-1">
        <p className="font-mono text-[0.72rem] uppercase tracking-[0.22em] text-primary/80">Data Panel</p>
        <h2 className="mt-1 font-mono text-2xl uppercase tracking-[0.12em] text-primary">{dataPanel.title}</h2>
      </div>

      <div className="min-h-0 flex-1">
        {dataPanel.kind === 'sql' ? <SqlResultPanel result={dataPanel.result} /> : null}
        {dataPanel.kind === 'arxiv' ? (
          <ArxivPaperPanel onSelectPaper={dataPanel.onSelectPaper} state={dataPanel.state} />
        ) : null}
      </div>
    </div>
  )
}
