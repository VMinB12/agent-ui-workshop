'use client'

import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuLabel,
  DropdownMenuRadioGroup,
  DropdownMenuRadioItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { ChevronDownIcon } from 'lucide-react'

import { isAgentId, type AgentDefinition, type AgentId } from '@/lib/agents'

type ChatHeaderProps = {
  endpoint: string
  agents: AgentDefinition[]
  selectedAgentId: AgentId
  onAgentSelect: (agentId: AgentId) => void
}

export const ChatHeader = ({ endpoint, agents, selectedAgentId, onAgentSelect }: ChatHeaderProps) => {
  const selectedAgent = agents.find((agent) => agent.id === selectedAgentId) ?? agents[0]

  return (
    <header className="chat-header mb-6">
      <div className="group/title flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div className="inline-flex flex-col gap-2">
          <span className="text-xs font-medium tracking-[0.14em] text-muted-foreground">Workshop agent</span>

          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <button
                className="inline-flex items-center gap-3 text-left text-foreground transition-colors hover:text-primary"
                type="button"
              >
                <span className="text-3xl font-semibold leading-none tracking-[-0.03em] sm:text-4xl">
                  {selectedAgent.name}
                </span>
                <span className="inline-flex items-center gap-1 rounded-full border border-border bg-card px-3 py-1 text-xs font-medium text-muted-foreground shadow-sm">
                  Change
                  <ChevronDownIcon className="size-3.5" />
                </span>
              </button>
            </DropdownMenuTrigger>

            <DropdownMenuContent
              align="start"
              className="w-88 border-border/80 bg-card/95 p-2 shadow-xl shadow-black/5"
            >
              <DropdownMenuLabel className="px-2 py-2 text-xs font-medium tracking-[0.08em] text-muted-foreground">
                Select Agent
              </DropdownMenuLabel>
              <DropdownMenuSeparator className="bg-border/80" />
              <DropdownMenuRadioGroup
                onValueChange={(value) => {
                  if (isAgentId(value)) {
                    onAgentSelect(value)
                  }
                }}
                value={selectedAgentId}
              >
                {agents.map((agent) => (
                  <DropdownMenuRadioItem className="items-start gap-3 py-3" key={agent.id} value={agent.id}>
                    <div className="space-y-1">
                      <p className="text-sm font-semibold text-foreground">{agent.name}</p>
                      <p className="max-w-[16rem] text-xs leading-relaxed text-muted-foreground">
                        {agent.description}
                      </p>
                    </div>
                  </DropdownMenuRadioItem>
                ))}
              </DropdownMenuRadioGroup>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>

        <div className="max-w-xl space-y-2 sm:text-right">
          <p className="text-sm leading-6 text-muted-foreground">{selectedAgent.description}</p>
          <p className="max-h-0 overflow-hidden text-xs text-muted-foreground opacity-0 transition-all duration-200 group-hover/title:max-h-10 group-hover/title:opacity-100">
            Endpoint:{' '}
            <code className="font-mono text-primary/85" suppressHydrationWarning>
              {endpoint}
            </code>
          </p>
        </div>
      </div>
    </header>
  )
}
