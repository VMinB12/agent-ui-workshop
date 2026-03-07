# Agent Surfaces And arXiv Agent

## Goals

- Capture custom data chunks emitted by chat backends through `useChat` `onData`.
- Introduce a reusable page-level abstraction that supports:
  - chat-only agents
  - chat-plus-data-panel agents
- Render SQL query results in a dedicated data panel using a resizable split layout and TanStack Table.
- Add a second agent implemented with the AI SDK in a Next.js `route.ts` endpoint.
- Let users switch agents from the main page header.
- Let the arXiv agent accumulate searched/fetched papers in its data panel and preview the selected PDF in an iframe.

## Constraints

- Keep chat rendering logic reusable and separate from agent-specific data panels.
- Do not show a resizable layout for agents that do not define a data panel.
- The data panel must be driven by `onData` payloads rather than by parsing chat message text.
- Preserve the current terminal-inspired visual language.
- Keep files small and focused where possible.

## Proposed Architecture

### 1. Shared Agent Registry

Create a small registry that defines each agent in one place.

Each agent definition should include:

- `id`
- `name`
- `description`
- `transport` details or API endpoint builder
- whether it supports a data panel
- data-panel-specific parser / renderer key

Initial agents:

- `sql`
  - backend: existing FastAPI endpoint
  - data panel: SQL result table
- `arxiv`
  - backend: Next.js route handler
  - data panel: paper list plus PDF iframe preview

### 2. Shared Frontend Session Hook

Refactor `useChatSession` into a generic hook that:

- accepts an agent definition
- keeps the current `conversationId` query param behavior
- namespaces conversation ids by agent to avoid collisions
- configures `useChat` transport from the selected agent
- captures `onData` payloads and routes them through an agent-specific handler
- returns chat state plus agent-specific data panel state

### 3. Agent Surface Components

Split the page into reusable shells:

- `AgentChatPane`
  - header
  - conversation list
  - prompt
  - error display
- `AgentWorkspace`
  - renders chat-only layout when no data panel is defined
  - renders `ResizablePanelGroup` when a data panel exists
- `AgentDataPanel`
  - generic wrapper for title, empty state, and agent-specific content

This keeps page composition stable while allowing future agents to plug in iframe, canvas, PDF, or table panels.

### 4. SQL Data Panel

Add SQL-specific types and components:

- typed shape for `data-sql-result`
- parser that validates incoming data chunk payloads
- table component backed by TanStack Table
- empty state shown before the first SQL result arrives

The SQL panel should display:

- executed SQL
- row and column counts
- scrollable table content

### 5. arXiv Agent

Add `app/api/agents/arxiv/[conversationId]/route.ts` that:

- accepts UI messages
- validates message history if needed
- uses `streamText`
- uses GPT-5 Mini
- defines two tools:
  - `search(query)` for arXiv metadata lookup
  - `fetch(arxiv_id)` for obtaining the PDF URL and exposing it to the model as a PDF file part

Implementation notes:

- use the arXiv API feed for search results
- normalize tool outputs into compact structured JSON for the model
- for `fetch`, retrieve the canonical PDF URL for the requested paper
- feed the PDF back to the model as a `file` content part with `mediaType: 'application/pdf'`
- emit data-panel updates for both searched papers and fetched papers so the client can keep a running paper library for the current session

### 6. arXiv Data Panel

Add an arXiv-specific data panel driven by `onData` payloads.

The panel should:

- keep a deduplicated list of papers encountered through `search` or `fetch`
- show title, authors, year, and arXiv id in a selectable list
- automatically attach a PDF URL when `fetch` succeeds
- allow the user to select any previously seen paper
- render the selected paper PDF in an iframe when a PDF URL is available
- show a meaningful empty state before any papers are discovered

Expected data flow:

- `search` emits a data chunk containing the normalized paper results
- `fetch` emits a data chunk for the fetched paper and its resolved PDF URL
- the frontend merges both chunk types into a single arXiv panel state

### 7. Agent Switching

Update the page header so the current agent name is the main title and clearly selectable.

Behavior:

- clicking the title opens an agent picker
- changing agents updates the active agent query param
- switching agents resets panel state to that agent session while preserving per-agent conversation ids via query params

## Implementation Order

1. Add shared agent config and types.
2. Refactor the chat hook to be agent-aware and data-aware.
3. Add reusable workspace/chat-pane/data-panel components.
4. Implement SQL result parsing and table rendering.
5. Add the arXiv route handler and arXiv data-panel events.
6. Implement the arXiv paper browser and iframe preview.
7. Update the page/header to use the agent selector.
8. Verify both agents in the browser and run static checks.

## Verification

- `sql` agent still streams chat correctly.
- SQL tool `display` updates the right panel through `onData`.
- Resizable split only appears for agents with a data panel.
- `arxiv` agent can search papers.
- `arxiv` agent can fetch a paper and answer questions using the PDF.
- `arxiv` data panel accumulates searched and fetched papers for the active conversation.
- selecting a fetched paper shows its PDF in an iframe.
- agent switching is visible and intuitive.
- `npm run lint` and `npm run typecheck` pass.
