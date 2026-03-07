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
    return <section className="min-h-0 flex-1">{chatPane}</section>
  }

  return (
    <section className="min-h-0 flex-1">
      <div className="flex h-full min-h-0 flex-col gap-4 lg:hidden">
        <div className="min-h-[28rem] flex-1">{chatPane}</div>
        <div className="min-h-[24rem]">{dataPane}</div>
      </div>

      <div className="hidden h-full min-h-0 lg:block">
        <ResizablePanelGroup className="min-h-0" orientation="horizontal">
          <ResizablePanel defaultSize={56} minSize={36}>
            {chatPane}
          </ResizablePanel>
          <ResizableHandle withHandle />
          <ResizablePanel defaultSize={44} minSize={28}>
            {dataPane}
          </ResizablePanel>
        </ResizablePanelGroup>
      </div>
    </section>
  )
}
