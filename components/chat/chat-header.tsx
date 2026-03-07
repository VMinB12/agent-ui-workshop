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
          <span className="font-sans text-[0.68rem] tracking-[0.32em] text-primary/80">Node 01 / Agent Console</span>

          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <button
                className="inline-flex items-center gap-3 text-left text-primary transition-colors hover:text-primary/85"
                type="button"
              >
                <span className="font-mono text-4xl leading-none tracking-[0.12em] sm:text-5xl">
                  {selectedAgent.name}
                </span>
                <span className="inline-flex items-center gap-1 border border-primary/35 px-2 py-1 font-sans text-[0.68rem] uppercase tracking-[0.22em] text-primary/80">
                  Switch
                  <ChevronDownIcon className="size-3.5" />
                </span>
              </button>
            </DropdownMenuTrigger>

            <DropdownMenuContent align="start" className="w-88 rounded-none! border-border/80 bg-card/95 p-2">
              <DropdownMenuLabel className="px-2 py-2 font-mono text-xs uppercase tracking-[0.18em] text-primary/85">
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
                      <p className="font-mono text-sm uppercase tracking-[0.14em] text-foreground">{agent.name}</p>
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
          <p className="text-sm text-muted-foreground">{selectedAgent.description}</p>
          <p className="max-h-0 overflow-hidden font-sans text-[0.68rem] text-muted-foreground opacity-0 transition-all duration-200 group-hover/title:max-h-10 group-hover/title:opacity-100">
            Endpoint:{' '}
            <code className="text-primary/85" suppressHydrationWarning>
              {endpoint}
            </code>
          </p>
        </div>
      </div>
    </header>
  )
}
