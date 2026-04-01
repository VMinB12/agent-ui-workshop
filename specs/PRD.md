# Product Requirements Document

## Functional Requirements

### FR-1: Streaming chat interface

The frontend must display assistant responses as they stream in, using Vercel AI SDK's `useChat` hook. Users must be able to send messages, see responses stream in real time, and stop a generation in progress.

### FR-2: Agent switcher

Users must be able to switch between multiple configured agents. Each agent has its own name, description, backend endpoint, starter suggestions, and optional data panel. The active agent is reflected in the URL (`?agent=<id>`) so links are shareable.

### FR-3: Live data panel

Agents may stream typed data alongside their text response. When they do, a side panel opens automatically and updates in real time. Each agent defines its own panel state, state reducer, and render function. The panel persists its state for the duration of the session even while the user browses other agents.

### FR-4: Two backend patterns

The project ships two working agent implementations that workshop participants can use as reference:

- **AI SDK agent** (`ToolLoopAgent`, TypeScript, Next.js route) — arXiv researcher
- **Pydantic AI agent** (`pydantic_ai.Agent`, Python, FastAPI) — SQL analyst

Both use the same Vercel AI streaming protocol so the frontend is backend-agnostic.

### FR-5: Adding a new agent

A participant should be able to add a new agent by:

1. Defining the agent logic (backend file or route)
2. Registering it in `lib/agents.ts` with `AgentDefinition`
3. Optionally defining a `dataPanel` with `defineAgentDataPanel`

No changes to shared infrastructure (router, layout, hooks) should be required.

### FR-6: Typed data part contracts

Data emitted by agent tools must be typed end-to-end. The `WorkshopDataParts` type in `lib/chat-types.ts` is the single source of truth for data part shapes. Frontend panels and backend tools must both reference these types.

## Non-Functional Requirements

### Performance

- Chat responses must begin streaming within 2 seconds of submission under normal network conditions.
- Panel state updates must not cause full-page re-renders; only the panel component re-renders.

### Developer experience

- The project must run locally with a single `npm run dev` (frontend) and `uv run` / `uvicorn` (Python backend) command.
- All TypeScript must pass strict type checking (`tsc --noEmit`).
- Code must be readable without prior AI SDK or Pydantic AI knowledge.

### Security

- Backend CORS is restricted to configured origins via `ALLOWED_ORIGINS` env var.
- No user data is persisted (no database writes for chat history).
- External API calls (arXiv, OpenAI) use server-side credentials; no API keys are exposed to the client.

### Accessibility

- The chat interface must be keyboard-navigable.
- Text contrast must meet WCAG AA.

## Scope

### In Scope

- A single-page React chat application
- Two reference agent implementations (SQL analyst, arXiv researcher)
- Live data panel with per-agent typed state
- Agent switcher with URL-based routing
- TypeScript, Next.js, Tailwind, Vercel AI SDK on the frontend
- FastAPI + Pydantic AI for the Python backend agent
- Starter suggestions per agent

### Out of Scope

- Chat history persistence across sessions
- User authentication or multi-user support
- Deployment infrastructure or CI/CD configuration
- Mobile-native applications
- Agent-to-agent communication

## Assumptions & Constraints

- Participants have Node.js ≥ 20 and Python ≥ 3.11 installed.
- An OpenAI API key is required (`OPENAI_API_KEY`).
- The Chinook sample database must be downloaded separately (`npm run download:chinook`).
- The project intentionally keeps file sizes small (target: under ~100 lines per file) to aid readability.
