'use client'

import { Tool, ToolContent, ToolHeader, ToolInput, ToolOutput, type ToolPart } from '@/components/ai-elements/tool'

type ChatToolPartProps = {
  part: ToolPart
}

export const ChatToolPart = ({ part }: ChatToolPartProps) => {
  const isOpenByDefault = part.state === 'output-available' || part.state === 'output-error'

  if (part.type === 'dynamic-tool') {
    const dynamicToolName = typeof part.toolName === 'string' ? part.toolName : 'dynamic-tool'

    return (
      <Tool className="border-chat-tool-border/70 bg-transparent" defaultOpen={isOpenByDefault}>
        <ToolHeader state={part.state} toolName={dynamicToolName} type={part.type} />
        <ToolContent>
          <ToolInput input={part.input} />
          <ToolOutput errorText={part.errorText} output={part.output} />
        </ToolContent>
      </Tool>
    )
  }

  return (
    <Tool className="border-chat-tool-border/70 bg-transparent" defaultOpen={isOpenByDefault}>
      <ToolHeader state={part.state} type={part.type} />
      <ToolContent>
        <ToolInput input={part.input} />
        <ToolOutput errorText={part.errorText} output={part.output} />
      </ToolContent>
    </Tool>
  )
}
