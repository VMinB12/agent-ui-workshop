---
applyTo: '**/*'
---

## Project Overview

A fullstack chatbot platform with Vercel's ai-sdk (`useChat`), ai-elements for the frontend and either ai-sdk or Pydantic AI for the backend.
The purpose of this project is to demonstrate how to build an AI chatbot with minimal boilerplate for maximum learning focus.
Developers can clone this project and quickly get started and iterate on the agent logic, frontend UI, or backend infrastructure without needing to set up complex environments or write scaffolding code.
The focus is on clear architecture, best practices, and a smooth development experience, rather than on specific agent capabilities or UI polish.
Avoid overly complex abstractions or optimizations that might obscure the core concepts of building an AI chatbot with Vercel's AI tools.
Keep file size to a minimum and prioritize readability and ease of understanding for developers new to this space.
If a file exceeds ~100 lines, consider whether it can be split into smaller, more focused modules.

## Out of scope

- Chat persistence and history management
- User authentication and multi-user support

## Best Practices

### Separation of Concerns

Each layer has a single, well-defined responsibility. Do not let concerns bleed across boundaries.

**Frontend layers:**

- **UI components** (`src/components/`): Purely presentational. Accept props, emit events. No direct API calls, no business logic, no global state reads. Stateless where possible.
- **Feature/page components** (`src/app/page.tsx`): Compose UI components, wire up hooks, handle interaction logic. Owns local UI state (open/close, hover, etc.) only.
- **Hooks** (`src/hooks/`): Encapsulate data-fetching, derived state, and side-effect logic. The only layer that calls SWR or `useChat`. Components should not call `fetch` directly.
- **API layer** (`src/lib/api.ts`): Raw HTTP calls. Functions that construct requests and parse responses. No React dependencies, no state — just `async` functions that return typed data. This is the only place `fetch` is called directly.
- **Types** (`src/types.ts`): All API response shapes and shared TypeScript interfaces. No runtime logic. Never define API response types inside component or hook files.

**Backend layers:**

- **Router/endpoint** (`server.py`, `chat_router.py`): HTTP boundary only. Validate inputs, delegate to services, return responses. No SQL, no agent logic inline. Route handler bodies should be short — if a handler exceeds ~15 lines, extract the orchestration into a service function.

### Classes vs Simple Functions

**Prefer plain functions by default.** Only introduce a class when there is genuine shared mutable state or lifecycle that a function cannot cleanly encapsulate.

- **Use functions for**: utilities, data transformations, API call wrappers, FastAPI route handlers, Pydantic AI tools, Taskiq task definitions, and any stateless operation.
- **Use classes for**: Pydantic `BaseModel`/`BaseSettings` subclasses (required by pydantic-settings), and objects with meaningful identity and state that outlive a single call (e.g. a stream consumer that holds a connection open across multiple reads).
- **Avoid class-based patterns** that are idiomatic in other languages but unnecessary in Python/TypeScript: service classes with only one instance, static-method-only classes, classes used purely as namespaces. Use a module instead.
- In React, always use function components. Never use class components.

### fetch vs SWR

**Use SWR (`useSWR`, `useSWRMutation`) for data fetching in React components** except for the AI streaming use case.

| Situation                                                         | Use                                                              |
| ----------------------------------------------------------------- | ---------------------------------------------------------------- |
| Read data from the API (e.g. `/api/configure`, chat history)      | `useSWR`                                                         |
| Trigger a mutation (create, delete, update)                       | `useSWRMutation` or `mutate` with a typed API helper             |
| AI chat streaming via Vercel AI SDK                               | `useChat` (wraps fetch internally; do not combine with `useSWR`) |
| One-shot fetch inside an event handler that does not need caching | raw `fetch` via a typed API helper function                      |
| Server-sent events / stream consumption                           | raw `fetch` with `ReadableStream` or `EventSource` in a hook     |

Rules:

- Never call `fetch` directly inside a component body. Put raw `fetch` calls in a dedicated API helper function and call that from a hook or SWR fetcher function.
- Do not duplicate SWR key logic. Define key builders as constants or factory functions and share them.
- Do not use SWR for the streaming chat turn — `useChat` from Vercel AI SDK owns that lifecycle.

### Additional Best Practices

**Design:**

- Do not produce "ai-slop" UI. Avoid generic, templated layouts that feel interchangeable.
- Aim for sleek, modern interfaces that still have personality and visual interest.
- Prioritize UX first: clear hierarchy, readable typography, strong contrast, and obvious interaction affordances.
- Keep flows simple and intuitive on both desktop and mobile.
- Prefer intentional spacing, color, and motion choices over decorative clutter.
- In chat UIs, keep assistant text visually light (no filled bubble or heavy border), use a warm semantic token set for user bubbles, and keep tool/result containers on subtle low-contrast borders.
- Use semantic design tokens for colors, spacing, and typography. Avoid hardcoded values in components.
- Use Tailwind's `@apply` to create reusable utility classes for common patterns (e.g. chat bubbles, tool containers) to keep JSX clean.

**UI component installation:**

- For ai-elements and shadcn/ui, always use their official `npx` install/add commands to bring prebuilt components into the project.
- Do not hand-write or reimplement ai-elements/shadcn prebuilt UI components from scratch.

**TypeScript:**

- Enable strict mode. Never use `any` — use `unknown` and narrow it, or define a proper type.
- Define API response shapes as TypeScript interfaces in `src/types.ts`. Parse and validate at the API boundary, not deep in components.
- Prefer `type` for aliases and unions; use `interface` for object shapes that may be extended.

**React:**

- Keep components small and focused. If a component renders differently based on more than 2–3 conditions, split it.
- Avoid `useEffect` for data fetching — use SWR. Reserve `useEffect` for true side-effects (DOM interaction, subscriptions, third-party integrations).
- Do not use `useEffect` to derive or initialize state from query or prop values. Compute derived values with `useMemo`, or pass the derived value as the initial `useState` argument.
- Colocate state as close as possible to where it is used. Lift only when multiple sibling components genuinely need it.
- Avoid prop drilling more than 2 levels. Use context or a hook for shared UI state.

**Python/FastAPI:**

- Use `async def` for all route handlers and any I/O-bound work (database, Redis, external APIs).
- Validate all external inputs with Pydantic models at the route handler boundary. Do not pass raw dicts into services.
- Keep route handler bodies short — delegate to service functions immediately. A handler should be readable in a few lines.
- Use dependency injection (`Depends`) for sessions, settings, and auth — never import globals into business logic.
- Never access `_`-prefixed (private) symbols from a module you don't own. If you need them, promote them to a public API in the owning module.
- Avoid module-level singleton state for infrastructure (database sessions, Redis clients). Initialise through dependency injection or explicit passing so they can be replaced in tests.

**Error handling:**

- Surface meaningful errors at the right layer. API handlers return appropriate HTTP status codes with structured error bodies. Services raise domain-specific exceptions; routers catch and translate them.
- Frontend: SWR error states should be surfaced in the UI, not silently swallowed. Streaming errors should show a user-visible message.

**Testing (when tests are added):**

- Unit-test pure functions and service logic in isolation, mocking I/O boundaries.
- Integration-test route handlers against a real (in-memory/SQLite) database.
- Do not test implementation details of UI components — test behaviour from the user's perspective.

## Configuration

- **TypeScript paths**: `@/*` maps to `./src/*`
- **pydantic-settings**: Used for environment variable management in the backend

## Tech Stack

- React 19, TypeScript, Vite, Tailwind CSS 4
- Vercel AI SDK (`@ai-sdk/react`, `ai`)
- Vercel AI Elements and shadcn/ui
- Radix UI primitives
- FastAPI, Pydantic AI, SQLModel, Taskiq
- SQLite (development), PostgreSQL (production), Redis (development and production broker/stream transport)
- ESLint (neostandard), Prettier

## Docs

We keep several documentation files for the main libraries we use:

- Pydantic AI: docs/pydantic-ai.md

Consider reading these to get a better understanding of the libraries we use. These files can be large, so you may want to grep to find relevant sections.
Prefer the skill or MCP tool for these libraries if it is available.
