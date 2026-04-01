# Changelog

All notable changes to this project are documented here. Entries are in reverse chronological order.

## [Unreleased]

### Added

- Spec-driven methodology initialized (`specs/` folder, Vision, PRD, Goals, Architecture, Glossary)

## [0.1.0] — 2026-04-01

### Added

- Initial project scaffold: Next.js frontend, FastAPI Python backend
- SQL Analyst agent (Pydantic AI + DuckDB + Chinook database)
- arXiv Researcher agent (AI SDK `ToolLoopAgent`)
- Live data panel with per-agent typed state (`defineAgentDataPanel`)
- Agent switcher with URL-based routing (`?agent=`)
- `WorkshopDataParts` typed data contract
- `useChatSession` hook managing chat + panel state
- ai-elements and shadcn/ui component library integration
- Starter suggestions per agent
