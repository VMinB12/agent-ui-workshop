# Goals

## Success Metrics

| Metric                            | Target                                                    | How Measured                        |
| --------------------------------- | --------------------------------------------------------- | ----------------------------------- |
| Time to first working agent       | < 1 hour for a workshop participant                       | Observed in workshop sessions       |
| Time to add a second custom agent | < 30 minutes                                              | Observed or self-reported           |
| Code comprehension                | Participant can explain data flow after 30 min of reading | Workshop feedback / questions asked |
| TypeScript errors                 | Zero strict-mode errors                                   | `tsc --noEmit` in CI                |
| File size discipline              | No file exceeds ~100 lines                                | Code review                         |

## Milestones

| Milestone      | Description                                                                   | Target Date | Status      |
| -------------- | ----------------------------------------------------------------------------- | ----------- | ----------- |
| MVP            | Two working agents, streaming chat, live data panel, documented architecture  | 2026-04-15  | in-progress |
| Workshop-ready | README onboarding, `npm run dev` works end-to-end, architecture docs complete | 2026-04-30  | not started |
| Polish         | Agent switcher UX, starter suggestions, error states, accessibility pass      | 2026-05-15  | not started |
