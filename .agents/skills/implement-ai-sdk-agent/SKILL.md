# Implement AI SDK Agent

Instructions for adding a new TypeScript agent to this workshop project using the Vercel AI SDK.

## Prerequisites

Before starting, you should know:

- What the agent should do at a high level (its purpose and domain)
- What external APIs or data sources it needs to access

## Architecture Overview

An AI SDK agent in this project consists of four parts:

1. **Agent module** (`lib/<agent-name>-agent.ts`) — model, instructions, and tools
2. **API route** (`app/api/agents/<agent-name>/route.ts`) — HTTP endpoint that streams responses
3. **Agent registry entry** (`lib/agents.ts`) — makes the agent visible in the UI and configures its data panel
4. **Data types and panel component** (`lib/chat-types.ts` + `components/agent/`) — if the agent exposes structured data

The existing arXiv agent (`lib/arxiv-agent.ts`, `app/api/agents/arxiv/route.ts`) is the reference implementation.

## Step 1: Define the Agent Module

Create `lib/<agent-name>-agent.ts`. The agent uses `ToolLoopAgent` from the AI SDK which handles multi-step tool calling automatically.

```ts
import { openai } from '@ai-sdk/openai'
import { ToolLoopAgent, stepCountIs, tool, type UIMessageStreamWriter } from 'ai'
import { z } from 'zod'

import type { WorkshopUIMessage } from '@/lib/chat-types'

const instructions = `You are a ... assistant.

Rules:
- Be concise and helpful.
- Use tools when the user asks for specific information.`

export const createMyAgent = (writer: UIMessageStreamWriter<WorkshopUIMessage>) =>
  new ToolLoopAgent({
    model: openai('gpt-5-mini'),
    instructions,
    stopWhen: stepCountIs(6),
    tools: {
      // tools go here — see Step 2
    },
  })
```

Key points:

- The function receives the `UIMessageStreamWriter` so tools can emit data parts to the frontend.
- `stopWhen: stepCountIs(6)` prevents runaway tool loops. Adjust as needed.
- Set `providerOptions` if you need reasoning summaries or other provider-specific features.

## Step 2: Implement Tools

Each tool is defined with `tool()` from the AI SDK. Tools have a description, an input schema (Zod), and an async `execute` function.

### Basic tool (returns text to the model)

```ts
tools: {
  lookup: tool({
    description: 'Look up information about a topic.',
    inputSchema: z.object({
      query: z.string().min(1).describe('The search query'),
    }),
    execute: async ({ query }) => {
      const results = await callExternalApi(query)
      return { results }  // returned to the model as tool output
    },
  }),
}
```

### Tool that sends data to the data panel

To send structured data that appears in the frontend data panel, use `writer.write()` inside the tool's execute function. The `type` field must follow the pattern `data-<key>` and match a key registered in `WorkshopDataParts`.

```ts
tools: {
  display: tool({
    description: 'Display results in the UI panel.',
    inputSchema: z.object({
      query: z.string().describe('What to display'),
    }),
    execute: async ({ query }) => {
      const data = await fetchData(query)

      // Send structured data to the frontend data panel
      writer.write({
        type: 'data-my-results',
        data: { items: data.items, total: data.total },
        transient: true,  // marks this as metadata, not persisted in chat
      })

      return { summary: `Found ${data.total} results` }
    },
  }),
}
```

### Tool with custom model output

If the raw tool output is large or contains binary data, use `toModelOutput` to control what the model sees:

```ts
tools: {
  fetchDocument: tool({
    description: 'Fetch and display a document.',
    inputSchema: z.object({
      id: z.string().describe('Document identifier'),
    }),
    execute: async ({ id }) => {
      const doc = await getDocument(id)

      writer.write({
        type: 'data-my-document',
        data: { document: doc },
        transient: true,
      })

      return { document: doc }
    },
    toModelOutput: ({ output }) => ({
      type: 'content',
      value: [
        {
          type: 'text',
          text: `Fetched document ${output.document.id}: ${output.document.title}`,
        },
      ],
    }),
  }),
}
```

### Tool design tips

- Give each tool a clear, specific `description`. The model uses this to decide when to call the tool.
- Use `.describe()` on each Zod field so the model understands what to pass.
- Keep tool outputs concise. If the raw data is large, use `toModelOutput` to summarize what the model sees while sending the full data to the UI via `writer.write()`.
- Separate "query" tools (return data to the model) from "display" tools (send data to the panel) when both use cases exist.
- Throw errors from tools to let the model retry or inform the user.

## Step 3: Create the API Route

Create `app/api/agents/<agent-name>/route.ts`:

```ts
import { convertToModelMessages, createUIMessageStream, createUIMessageStreamResponse } from 'ai'

import { createMyAgent } from '@/lib/my-agent'
import type { WorkshopUIMessage } from '@/lib/chat-types'

export async function POST(request: Request) {
  const { messages }: { messages: WorkshopUIMessage[] } = await request.json()

  return createUIMessageStreamResponse({
    stream: createUIMessageStream<WorkshopUIMessage>({
      execute: async ({ writer }) => {
        const agent = createMyAgent(writer)
        const result = await agent.stream({
          messages: await convertToModelMessages(messages, { tools: agent.tools }),
        })

        writer.merge(result.toUIMessageStream({ sendReasoning: true }))
      },
    }),
  })
}
```

This route:

1. Reads the message history from the request body.
2. Creates a `UIMessageStream` that the frontend consumes via `useChat`.
3. Instantiates the agent with the stream writer so tools can emit data.
4. Converts UI messages to model messages and starts streaming.

## Step 4: Add Data Types (if using the data panel)

If your agent sends structured data to the frontend, add the types in `lib/chat-types.ts`.

### 4a. Define the data shape

```ts
// Add to lib/chat-types.ts

export interface MyResultData {
  items: Array<{ id: string; name: string; value: number }>
  total: number
}
```

### 4b. Register the data part type

Add your new type to `WorkshopDataParts`:

```ts
export type WorkshopDataParts = {
  'sql-result': SqlResultData
  'arxiv-search-results': ArxivSearchResultsData
  'arxiv-paper': ArxivPaperData
  'my-results': MyResultData  // <-- add here
}
```

The key `'my-results'` corresponds to the `type: 'data-my-results'` used in `writer.write()` — the `data-` prefix is added automatically by the framework.

### 4c. Add a type guard

```ts
export const isMyResultDataPart = (
  dataPart: WorkshopDataPart,
): dataPart is Extract<WorkshopDataPart, { type: 'data-my-results' }> =>
  dataPart.type === 'data-my-results'
```

## Step 5: Build the Data Panel Component (if using the data panel)

Create `components/agent/my-result-panel.tsx`:

```tsx
'use client'

import type { MyResultData } from '@/lib/chat-types'

const EmptyState = () => (
  <div className="flex h-full min-h-72 items-center justify-center rounded-3xl border border-border/80 bg-card px-6 text-center shadow-sm">
    <div className="max-w-sm space-y-2">
      <p className="text-lg font-semibold tracking-[-0.02em] text-foreground">
        Awaiting results
      </p>
      <p className="text-sm text-muted-foreground">
        Results will appear here when the agent runs a display tool.
      </p>
    </div>
  </div>
)

export const MyResultPanel = ({ data }: { data: MyResultData | null }) => {
  if (!data) {
    return <EmptyState />
  }

  return (
    <div className="flex min-w-0 flex-col gap-4 rounded-3xl border border-border/80 bg-card p-4 shadow-sm">
      <p className="text-sm text-muted-foreground">{data.total} results</p>
      {/* Render your data here */}
    </div>
  )
}
```

## Step 6: Register the Agent

Edit `lib/agents.ts` to add your agent to the registry.

### 6a. Add the agent ID to the `AgentId` union

```ts
export type AgentId = 'sql' | 'arxiv' | 'my-agent'
```

### 6b. Add the agent definition to `agentDefinitions`

For an agent **without** a data panel:

```ts
'my-agent': {
  id: 'my-agent',
  name: 'My Agent',
  description: 'A short description of what this agent does.',
  starterSuggestions: [
    'Example prompt that shows off the agent',
    'Another example prompt',
  ],
  buildEndpoint: () => '/api/agents/my-agent',
},
```

For an agent **with** a data panel:

```ts
'my-agent': {
  id: 'my-agent',
  name: 'My Agent',
  description: 'A short description of what this agent does.',
  starterSuggestions: [
    'Show me something interesting',
    'Display the top results for X',
  ],
  buildEndpoint: () => '/api/agents/my-agent',
  dataPanel: defineAgentDataPanel<MyResultData | null>({
    title: 'Results',
    createState: () => null,
    applyDataPart: (state, dataPart) =>
      isMyResultDataPart(dataPart) ? dataPart.data : state,
    render: ({ state }) => createElement(MyResultPanel, { data: state }),
  }),
},
```

The `dataPanel` configuration:

- `createState`: returns the initial panel state (often `null` or an empty object).
- `applyDataPart`: receives each data part from the stream and returns the next panel state. Only handle your own data part types; return `state` unchanged for unrecognized types.
- `render`: returns the React element for the panel. Use `createElement` to avoid JSX in a `.ts` file.

### 6c. Update the `isAgentId` type guard

```ts
export const isAgentId = (value: string | null | undefined): value is AgentId =>
  value === 'sql' || value === 'arxiv' || value === 'my-agent'
```

### 6d. Add necessary imports

Import your panel component and type guard at the top of `lib/agents.ts`:

```ts
import { MyResultPanel } from '@/components/agent/my-result-panel'
import { isMyResultDataPart, type MyResultData } from '@/lib/chat-types'
```

## Checklist

After completing all steps, verify:

- [ ] `lib/<agent-name>-agent.ts` exports a `create...Agent` function with model, instructions, and tools
- [ ] `app/api/agents/<agent-name>/route.ts` exports a `POST` handler that streams the agent response
- [ ] `lib/agents.ts` has the new agent in `AgentId`, `agentDefinitions`, and `isAgentId`
- [ ] The agent appears in the dropdown when running `npm run dev`
- [ ] If using a data panel: types are in `chat-types.ts`, panel component exists, and `dataPanel` is configured in the registry
- [ ] Tools use `writer.write()` with the correct `type` matching `data-<key>` from `WorkshopDataParts`
- [ ] The app builds without errors: `npm run build`