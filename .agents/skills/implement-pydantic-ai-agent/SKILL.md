# Implement Pydantic AI Agent

Instructions for adding a new Python agent to this workshop project using Pydantic AI and FastAPI.

## Prerequisites

Before starting, you should know:

- What the agent should do at a high level (its purpose and domain)
- What external APIs or data sources it needs to access

## Architecture Overview

A Pydantic AI agent in this project consists of four parts:

1. **Agent module** (`agent/src/agent/<agent_name>.py`) — model, instructions, and tools
2. **Server registration** (`agent/src/agent/server.py`) — mounts the agent on a FastAPI route
3. **Frontend registry entry** (`lib/agents.ts`) — makes the agent visible in the UI and configures its endpoint and data panel
4. **Data types and panel component** (`lib/chat-types.ts` + `components/agent/`) — if the agent exposes structured data

The existing SQL analyst agent (`agent/src/agent/agent.py`, `agent/src/agent/server.py`) is the reference implementation.

## Step 1: Define the Agent Module

Create `agent/src/agent/<agent_name>.py`. A Pydantic AI agent combines a model, instructions, and tools.

```python
from __future__ import annotations

import pydantic_ai
from pydantic_ai.models.openai import OpenAIResponsesModel, OpenAIResponsesModelSettings

agent = pydantic_ai.Agent(
    model=OpenAIResponsesModel(
        model_name='gpt-5-mini',
        settings=OpenAIResponsesModelSettings(openai_reasoning_summary='auto'),
    ),
    instructions=(
        'You are a helpful assistant that specializes in ... '
        'Use the available tools to help the user.'
    ),
)
```

Key points:

- The agent is a module-level instance. The chat router imports it directly.
- `instructions` is a plain string that sets the system prompt.
- `OpenAIResponsesModelSettings(openai_reasoning_summary='auto')` enables reasoning summaries in the streamed output.

## Step 2: Implement Tools

Tools are decorated functions registered on the agent instance. Pydantic AI supports two kinds:

### Basic tool (returns text to the model)

Use `@agent.tool_plain` for tools that don't need the run context:

```python
@agent.tool_plain
def lookup(query: str) -> str:
    """Search for information on a topic and return a summary."""
    results = call_external_api(query)
    return f'Found {len(results)} results: {results[:3]}'
```

The docstring becomes the tool description the model sees. Parameter names and type annotations define the input schema automatically.

Use `@agent.tool` when you need access to the `RunContext` (for dependency injection):

```python
@agent.tool
async def lookup(ctx: RunContext[MyDeps], query: str) -> str:
    """Search for information on a topic."""
    results = await ctx.deps.client.search(query)
    return str(results)
```

### Tool that sends data to the frontend data panel

To send structured data to the UI, return a `pydantic_ai.ToolReturn` with `DataChunk` metadata:

```python
from pydantic_ai.ui.vercel_ai.response_types import DataChunk

@agent.tool_plain
def display(query: str) -> pydantic_ai.ToolReturn:
    """Run a query and display the results in the UI panel."""
    results = fetch_results(query)

    return pydantic_ai.ToolReturn(
        return_value='Results displayed to user',
        metadata=[
            DataChunk(
                type='data-my-results',
                data={
                    'items': [item.to_dict() for item in results],
                    'total': len(results),
                },
            ),
        ],
    )
```

Key details:

- `return_value` is what the model sees as the tool output. Keep it concise.
- `metadata` is a list of `DataChunk` objects. Each one is sent to the frontend as a data part.
- The `type` field must match `data-<key>` where `<key>` is registered in `WorkshopDataParts` on the frontend.
- The `data` field must be JSON-serializable.

### Error handling in tools

Use `pydantic_ai.ModelRetry` to tell the model to retry with a corrected input:

```python
@agent.tool_plain
def query(sql_query: str) -> str:
    """Run a query and return results."""
    try:
        result = execute_query(sql_query)
        return str(result)
    except Exception as e:
        raise pydantic_ai.ModelRetry(f'Query failed: {e}') from e
```

### Tool design tips

- Write clear docstrings — the model uses them to decide when and how to call each tool.
- Use descriptive parameter names and type annotations. Pydantic AI generates the JSON schema from them.
- Separate "query" tools (return data to the model for reasoning) from "display" tools (send structured data to the UI panel) when both use cases exist.
- Keep `return_value` short when using `ToolReturn`. The model doesn't need the full dataset — just a confirmation or summary.

## Step 3: Wire the Agent into the Server

The project uses a reusable chat router factory. Edit `agent/src/agent/server.py` to mount your new agent.

### 3a. Import your agent

```python
from .my_agent import agent as my_agent
```

### 3b. Mount it with a route prefix

```python
app.include_router(
    create_chat_router(agent=my_agent),
    prefix='/api/my-agent',
)
```

The full server file looks like this after adding a second agent:

```python
import os

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from .agent import agent as sql_agent
from .my_agent import agent as my_agent
from .chat_router import create_chat_router

app = FastAPI(title='AI Chat API')

default_origins = 'http://localhost:3000,http://127.0.0.1:3000'
allowed_origins = [
    origin.strip()
    for origin in os.getenv('ALLOWED_ORIGINS', default_origins).split(',')
    if origin.strip()
]

app.add_middleware(
    CORSMiddleware,
    allow_origins=allowed_origins,
    allow_credentials=True,
    allow_methods=['*'],
    allow_headers=['*'],
)

app.include_router(
    create_chat_router(agent=sql_agent),
    prefix='/api/sql',
)

app.include_router(
    create_chat_router(agent=my_agent),
    prefix='/api/my-agent',
)
```

The `create_chat_router` factory handles all the streaming plumbing. It converts the incoming request into a Pydantic AI conversation and streams the response using the Vercel AI protocol via `VercelAIAdapter`. You do not need to modify `chat_router.py`.

## Step 4: Add Data Types on the Frontend (if using the data panel)

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

The key `'my-results'` corresponds to the `type: 'data-my-results'` used in `DataChunk(type='data-my-results', ...)` on the Python side.

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

## Step 6: Register the Agent in the Frontend

Edit `lib/agents.ts` to add your agent to the registry.

### 6a. Add the agent ID to the `AgentId` union

```ts
export type AgentId = 'sql' | 'arxiv' | 'my-agent'
```

### 6b. Add the agent definition to `agentDefinitions`

The `buildEndpoint` must point to your Python backend route. The Python backend is served from a separate origin, configured via `NEXT_PUBLIC_CHAT_API_BASE_URL` (defaults to `http://127.0.0.1:8000/api`). The existing `CHAT_API_BASE` constant in `lib/agents.ts` handles this.

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
  buildEndpoint: () => `${CHAT_API_BASE}/my-agent/chat`,
},
```

Note: Python agents use `${CHAT_API_BASE}/my-agent/chat` because the FastAPI router mounts at `/api/my-agent` and the chat endpoint is `/chat`. TypeScript agents use Next.js API routes like `/api/agents/my-agent` instead.

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
  buildEndpoint: () => `${CHAT_API_BASE}/my-agent/chat`,
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

- [ ] `agent/src/agent/<agent_name>.py` defines an `agent` instance with model, instructions, and tools
- [ ] `agent/src/agent/server.py` mounts the agent with `create_chat_router` and a unique prefix
- [ ] `lib/agents.ts` has the new agent in `AgentId`, `agentDefinitions`, and `isAgentId`
- [ ] `buildEndpoint` uses `${CHAT_API_BASE}/<agent-name>/chat` (not a Next.js route)
- [ ] The agent appears in the dropdown when running `npm run dev`
- [ ] If using a data panel: types are in `chat-types.ts`, panel component exists, and `dataPanel` is configured in the registry
- [ ] `DataChunk` types match `data-<key>` from `WorkshopDataParts`
- [ ] The app builds without errors: `npm run build`
- [ ] The Python backend starts without errors: `npm run dev` (starts both frontend and backend)