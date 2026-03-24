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
      <div className="mb-3 px-1">
        <p className="text-xs font-medium tracking-[0.08em] text-muted-foreground">Supporting panel</p>
        <h2 className="mt-1 text-2xl font-semibold tracking-[-0.02em] text-foreground">
          {activeAgent.dataPanel.title}
        </h2>
      </div>

      <div className="min-h-0 min-w-0 flex-1 overflow-auto">
        {activeAgent.dataPanel.render({ state: panelState, updateState: setPanelState })}
      </div>
    </div>
  )
}
