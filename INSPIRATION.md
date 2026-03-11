# Inspiration

Here is a a list of ideas to get started on making this workshop app more interesting.
We added a prompt to each idea that you can try pasting into your coding agent to get started quickly.

## Easy

### Redesign The App

Idea: Change the look and feel of the chat app without changing the core behavior.

Prompt:

```text
Redesign this workshop app to feel more distinctive and polished while keeping the current functionality unchanged. Inspect the existing UI structure first, preserve the current agent flows, and update the visual design system, layout, typography, spacing, and chat styling. Keep the code readable and avoid unnecessary abstractions.
```

### Pirate Agent

Idea: Add a simple agent with no tools that answers entirely in pirate language.

Prompt:

```text
Add a new minimal agent called Pirate. It should not use any tools. It should answer every message in a pirate voice, but still remain helpful and concise. Follow the existing agent architecture in this repo, register it in the agent picker, and reuse the existing chat UI without adding new panels unless needed.
```

### Better Starter Prompts

Idea: Improve the built-in prompt suggestions for each existing agent.

Prompt:

```text
Review the current starter suggestions for all agents in this workshop app and replace them with stronger examples that better demonstrate each agent's capabilities. Keep the tone concise, practical, and workshop-friendly. Do not change backend behavior.
```

## Medium

### Weather Agent

Idea: Add an agent that can show the current weather for a city and render the result clearly in the UI.

Prompt:

```text
Add a new Weather agent to this workshop app. It should accept city names, call a weather API through a tool, and display the current weather in the data panel. Follow the existing agent patterns in this repo for endpoint wiring, tool execution, data parts, and frontend panel rendering. Keep the implementation simple and readable.
```

## Hard

### UI Builder Agent With JSXPreview And Sandbox

Idea: Add an agent that generates small React UI components and shows both the code and a live preview.

Prompt:

```text
Add a new UI Builder agent that generates small React components from natural language requests. Use AI Elements JSXPreview to render generated JSX and Sandbox to show the generated code and execution state. Inspect the existing chat rendering architecture first, then add the minimum backend and frontend changes required to support a safe, comprehensible prototype.
```

### Human-In-The-Loop Tool Approval

Idea: Require explicit user approval before sensitive tools are executed.

Prompt:

```text
Add human-in-the-loop tool approval to this workshop app. Certain tools should pause before execution, surface the pending action in the UI, and only continue if the user approves. Follow the existing message streaming patterns in the repo, keep the UX clear, and implement the smallest end-to-end version that demonstrates the concept well.
```

### Collaborative document writing agent

Idea: Add an agent that can help write a shared document collaboratively with the user.
Prompt:

```text
Add a new Writing Assistant agent to this workshop app. It should maintain a shared document state that both the user and agent can edit. The agent should have tools to read the current state of the document and edit the document. The UI should have a panel that displays the current document state and updates as both the user and agent make changes. Follow the existing agent patterns in this repo for endpoint wiring, tool execution, data parts, and frontend panel rendering. Keep the implementation simple and readable.
```

## Expert

### Secure Coding Agent Sandbox

Idea: Build a coding agent that can inspect and edit a user workspace through a safer execution boundary.

Prompt:

```text
Design and implement an expert-mode coding agent for this workshop app. The agent should operate on a user workspace through a secure sandbox boundary rather than full unrestricted host access. Start by proposing a minimal architecture, then implement a thin vertical slice that demonstrates safe file access, constrained command execution, and a clear UI for reviewing what the agent is doing.
```
