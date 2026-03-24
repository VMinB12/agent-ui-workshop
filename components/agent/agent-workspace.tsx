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
      <div className="grid h-full min-h-0 grid-rows-[minmax(0,1fr)_minmax(18rem,40vh)] gap-4 lg:hidden">
        <div className="min-h-0 overflow-hidden">{chatPane}</div>
        <div className="min-h-0 overflow-hidden">{dataPane}</div>
      </div>

      <div className="hidden h-full min-h-0 lg:block">
        <ResizablePanelGroup className="min-h-0" orientation="horizontal">
          <ResizablePanel defaultSize={56} minSize={36}>
            <div className="h-full min-h-0 overflow-hidden pr-3">{chatPane}</div>
          </ResizablePanel>
          <ResizableHandle withHandle />
          <ResizablePanel defaultSize={44} minSize={28}>
            <div className="h-full min-h-0 overflow-hidden pl-3">{dataPane}</div>
          </ResizablePanel>
        </ResizablePanelGroup>
      </div>
    </section>
  )
}
