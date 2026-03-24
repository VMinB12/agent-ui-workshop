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
      <div className="min-h-0 min-w-0 flex-1 overflow-auto">
        {activeAgent.dataPanel.render({ state: panelState, updateState: setPanelState })}
      </div>
    </div>
  )
}
