# Architecture

## System Overview

Agent UI Workshop is a fullstack chatbot platform that pairs a **Next.js/React frontend** with either a **Next.js API route** (TypeScript, AI SDK) or a **FastAPI server** (Python, Pydantic AI) as the agent backend. The two siddes communicate via the [Vercel AI streaming protocol](https://sdk.vercel.ai/docs/ai-sdk-ui/stream-protocol), which makes the frontend backend-agnostic.

The defining feature is the **live data panel**: agents can stream typed structured data alongside their text response. The panel subscribes to these data events and updates in real time without breaking the chat stream.

---

## Architecture Diagram

```
Browser
│
├── ChatMessageList          (renders chat messages)
│     └── ChatMessageRow → ChatMessageParts
│                             ├── text parts (ai-elements <Message>)
│                             └── tool-call parts (ai-elements <Tool>)
│
├── AgentDataPanel           (renders live structured data)
│     └── activeAgent.dataPanel.render(panelState)
│           ├── SqlResultPanel    (SQL results table)
│           └── ArxivPaperPanel   (paper browser shelf)
│
└── useChatSession (hook)
      ├── useChat (Vercel AI SDK)   ──POST──►  agent endpoint
      │     └── onData(dataPart)              │
      │           │                           │  SSE stream
      │           ▼                           │  (text + data parts)
      └── applyDataPart → panelState  ◄───────┘
```

---

## Data Flow

### 1. User submits a message

`ChatPrompt` calls `sendMessage()` from `useChatSession`. This delegates to `useChat` from `@ai-sdk/react`, which POSTs `{ messages }` to the active agent endpoint.

### 2. Backend streams response

Each agent backend receives the request, runs the agent loop, and streams an SSE response using the Vercel AI streaming protocol. The stream contains:

- **Text delta** chunks — incrementally rendered in the chat as the model writes.
- **Tool call / result** parts — rendered as collapsible tool cards.
- **Data parts** — typed structured payloads sent by agent tools (e.g., SQL rows, arXiv papers). These are **not** part of the model's text; they are app-level messages piggybacking on the stream.

### 3. Frontend receives data parts

`useChat` fires the `onData(dataPart)` callback for every data part it receives. `useChatSession` forwards each part to `activeDataPanel.applyDataPart(currentState, dataPart)`, which returns a new panel state. React re-renders the panel on each update.

### 4. Panel displays structured data

`AgentDataPanel` calls `activeAgent.dataPanel.render({ state, updateState })`. The panel component receives the accumulated state (e.g., all papers found so far) and renders it. User interactions inside the panel (e.g., selecting a paper) call `updateState()` to mutate local panel state without touching the chat.

---

## Key Components

| Component / Module  | Location                                | Responsibility                                                                |
| ------------------- | --------------------------------------- | ----------------------------------------------------------------------------- |
| `useChatSession`    | `hooks/use-chat-session.ts`             | Orchestrates `useChat`, panel state accumulation, and agent switching         |
| `agentDefinitions`  | `lib/agents.ts`                         | Registry of all agents — endpoint, data panel definition, starter suggestions |
| `WorkshopDataParts` | `lib/chat-types.ts`                     | TypeScript types for every data part shape; single source of truth            |
| `AgentWorkspace`    | `components/agent/agent-workspace.tsx`  | Split-pane layout: chat pane + optional data pane                             |
| `AgentDataPanel`    | `components/agent/agent-data-panel.tsx` | Renders the active agent's panel using its `render()` function                |
| `ChatMessageList`   | `components/chat/chat-message-list.tsx` | Scrollable message list, submit + stop controls                               |
| `ChatMessageRow`    | `components/chat/chat-message-row.tsx`  | Renders one message (user or assistant)                                       |
| `ChatHeader`        | `components/chat/chat-header.tsx`       | Agent switcher dropdown                                                       |

---

## How to Define an Agent

An agent is registered in `lib/agents.ts` as an `AgentDefinition` object:

```ts
{
  id: 'my-agent',           // unique slug, also used as useChat id and URL param
  name: 'My Agent',
  description: '...',
  starterSuggestions: ['Try this:', 'Or this:'],
  buildEndpoint: () => '/api/agents/my-agent',   // or a Python backend URL

  // Optional — omit if no structured data panel is needed
  dataPanel: defineAgentDataPanel<MyState>({
    title: 'My Panel',
    createState: () => initialState,
    applyDataPart: (state, dataPart) => { /* accumulate incoming data */ return newState },
    render: ({ state, updateState }) => <MyPanelComponent state={state} />,
  }),
}
```

The `AgentId` union type must also be updated to include the new id.

---

## Backend Patterns

### Pattern A — AI SDK (TypeScript, Next.js route)

```
app/api/agents/<name>/route.ts
```

- Uses `ToolLoopAgent` from the `ai` package.
- Tools call `writer.write({ type: 'data-<name>', data: { ... } })` to stream data parts.
- Returns a `createUIMessageStreamResponse()`.
- Reference: `app/api/agents/arxiv/route.ts` + `lib/arxiv-agent.ts`

### Pattern B — Pydantic AI (Python, FastAPI)

```
agent/src/agent/agent.py       — agent and tools
agent/src/agent/chat_router.py — FastAPI router wrapping the agent
agent/src/agent/server.py      — FastAPI app wiring
```

- Uses `pydantic_ai.Agent` and `@agent.tool_plain` decorators.
- Tools return `pydantic_ai.ToolReturn(return_value=..., metadata=[DataChunk(...)])` to stream data parts.
- `chat_router.py` wraps the agent in `VercelAIAdapter` to produce a compatible SSE stream.
- Reference: `agent/src/agent/agent.py`

Both patterns produce streams that the same frontend `useChat` hook can consume.

---

## Technology Stack

| Layer               | Technology                     | Rationale                                                       |
| ------------------- | ------------------------------ | --------------------------------------------------------------- |
| Frontend framework  | Next.js 15, React 19           | App Router, server components, API routes                       |
| Styling             | Tailwind CSS 4                 | Utility-first, semantic tokens                                  |
| AI SDK (frontend)   | `@ai-sdk/react` `useChat`      | Official Vercel hook; handles SSE, message state, streaming     |
| AI SDK (TS backend) | `ai` — `ToolLoopAgent`, `tool` | Agentic tool loop with streaming data parts                     |
| Python backend      | FastAPI + Pydantic AI          | Async-native, type-safe, Vercel AI compat via `VercelAIAdapter` |
| UI components       | ai-elements, shadcn/ui         | Pre-built chat and data display primitives                      |
| URL state           | nuqs                           | `?agent=` query param without boilerplate                       |

## Key Constraints & Trade-offs

- **No persistence by design.** Chat history and panel state are in-memory only. This keeps the codebase minimal and focused on the agent/UI interaction loop.
- **Two backend patterns in one project.** Trade-off: slightly more surface area to understand. Benefit: participants can pick the stack they prefer without switching projects.
- **File size cap (~100 lines).** Keeps each module focused and prevents abstraction creep. Encourages splitting rather than growing.
- **`WorkshopDataParts` is a shared contract.** Adding a new data part type requires editing this type and both the backend tool and the agent definition. This deliberate coupling makes the data flow explicit.

## Sub-documents

_(none yet — architecture fits in this single file)_
