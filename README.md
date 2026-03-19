# Agent UI Workshop

Build and extend AI chat agents with a shared UI. This workshop includes:

- a Next.js frontend with Vercel AI SDK streaming
- a TypeScript agent example built with AI SDK
- a Python agent example built with Pydantic AI

## Getting Started

This repo works on macOS, Linux, and Windows.

Install these first:

- Node.js 20+ (includes `npm`)
- Python 3.12+
- `uv` for the Python environment
- an OpenAI API key
- `curl` available on your `PATH` for the preparation script

Create a `.env.local` file in the project root:

```env
OPENAI_API_KEY=your_key_here
```

Then run:

```bash
npm run setup
npm run prepare
npm run dev
```

`npm run setup` installs the frontend, shared JavaScript dependencies, and sets up the Python environment.
`npm run prepare` installs the git hooks and downloads the workshop data/docs.
`npm run dev` starts the Next.js app on `http://localhost:3000` and the Python API on `http://127.0.0.1:8000`.

## Build Your Own Agent

### TypeScript / AI SDK

Use the arXiv agent as the reference implementation.

1. Create a route in `app/api/agents/<your-agent>/[conversationId]/route.ts`.
2. In that route, convert incoming UI messages, create your agent, and return a streamed UI response.
3. Implement the agent itself in `lib/<your-agent>.ts` with its model, instructions, and tools.
4. Register the new agent in `lib/agents.ts` so it appears in the UI.
5. If your tools send structured data to the frontend, add the data part types and panel UI alongside the existing agent components.

Good starting points:

- `app/api/agents/arxiv/[conversationId]/route.ts`
- `lib/arxiv-agent.ts`
- `lib/agents.ts`

### Python / Pydantic AI

Use the SQL analyst as the reference implementation.

1. Define or update your Pydantic AI agent in `agent/src/agent/agent.py`.
2. Add tools there for the work your agent needs to do.
3. Reuse the FastAPI chat wiring in `agent/src/agent/chat_router.py` and `agent/src/agent/server.py`.
4. Point the frontend at your Python endpoint from `lib/agents.ts`.
5. If your tools need to update the UI with structured results, return `ToolReturn` metadata and render it in a frontend panel.

Good starting points:

- `agent/src/agent/agent.py`
- `agent/src/agent/chat_router.py`
- `agent/src/agent/server.py`
- `lib/agents.ts`

## What To Change During The Workshop

- Change the agent instructions.
- Add or remove tools.
- Swap the model.
- Add a new data panel for agent-specific output.

The quickest path is to copy one of the two existing agents, rename it, and then narrow it to your use case.

If you want extension ideas, see `INSPIRATION.md`.
