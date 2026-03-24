'use client'

import type { ReactNode } from 'react'

import { ResizableHandle, ResizablePanel, ResizablePanelGroup } from '@/components/ui/resizable'

type AgentWorkspaceProps = {
  chatPane: ReactNode
  dataPane?: ReactNode
  hasDataPanel: boolean
}

export const AgentWorkspace = ({ chatPane, dataPane, hasDataPanel }: AgentWorkspaceProps) => {
  if (!hasDataPanel || dataPane == null) {
    return <section className="min-h-0 flex-1 overflow-hidden">{chatPane}</section>
  }

  return (
    <section className="min-h-0 flex-1 overflow-hidden">
      <div className="grid h-full min-h-0 grid-rows-[minmax(18rem,40vh)_minmax(0,1fr)] gap-4 lg:hidden">
        <div className="min-h-0 overflow-hidden">{dataPane}</div>
        <div className="min-h-0 overflow-hidden">{chatPane}</div>
      </div>

      <div className="hidden h-full min-h-0 lg:block">
        <ResizablePanelGroup className="min-h-0" orientation="horizontal">
          <ResizablePanel defaultSize={40} minSize={28}>
            <div className="h-full min-h-0 overflow-hidden pr-3">{dataPane}</div>
          </ResizablePanel>
          <ResizableHandle withHandle />
          <ResizablePanel defaultSize={60} minSize={36}>
            <div className="h-full min-h-0 overflow-hidden pl-3">{chatPane}</div>
          </ResizablePanel>
        </ResizablePanelGroup>
      </div>
    </section>
  )
}
