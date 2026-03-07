'use client'

import type { AgentDefinition } from '@/lib/agents'

export const AgentDataPanel = ({
  activeAgent,
  panelState,
  setPanelState,
}: {
  activeAgent: AgentDefinition
  panelState: unknown
  setPanelState: (updater: (state: unknown) => unknown) => void
}) => {
  if (!activeAgent.dataPanel) {
    return null
  }

  return (
    <div className="flex h-full min-h-0 flex-col overflow-hidden">
      <div className="mb-3 pl-5 pr-1">
        <p className="font-mono text-[0.72rem] uppercase tracking-[0.22em] text-primary/80">Data Panel</p>
        <h2 className="mt-1 font-mono text-2xl uppercase tracking-[0.12em] text-primary">
          {activeAgent.dataPanel.title}
        </h2>
      </div>

      <div className="min-h-0 flex-1 overflow-hidden">
        {activeAgent.dataPanel.render({ state: panelState, updateState: setPanelState })}
      </div>
    </div>
  )
}
