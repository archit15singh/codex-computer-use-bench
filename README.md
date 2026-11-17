# Codex Computer Use Benchmark

A macOS research project on reducing the time Codex takes to complete and verify recurring computer-use workflows.

This initial snapshot contains a runnable synthetic fixture. The benchmark runner, scored evaluation, and research paper are in progress.

## Try the fixture

From the project directory, run:

```sh
npm run fixture -- form
```

The fixture uses Node.js built-ins. It prints a loopback URL and a task goal. Open the URL, complete the task, then type `verify` and press Enter in the fixture terminal for a server-side check. Press Ctrl+C to stop the fixture. Start a fresh process for each manual trial.

| Task | Workflow |
| --- | --- |
| `navigate` | Open the workspace and reach the release notes |
| `form` | Submit a service request with the specified values |
| `setting` | Save a layout setting and verify it after reload |
| `bug` | Reproduce a saved-filter error and recover |
| `handoff` | Pass a generated code between two local web apps using the printed Inbox URL |

## Evaluation design

- **Execution overhead.** Compare identical Playwright actions run directly, through individual Qwen Node REPL calls, and through batched calls. Measure screenshot cost separately. Keep cold startup and warm execution distinct.
- **Native computer use.** Compare Codex's native integration with the pinned Qwen integration using the same model, task, target app, and independent verifier. Test sequential and adaptive observation policies where the capabilities overlap.
- **Workflow performance.** Compare a hybrid Codex policy using API, CLI, DOM, and native UI with a UI-only baseline.

The primary outcome is verified completion within a common time budget. Also record paired latency, tool calls, retries, manual interventions, and model usage when available. Before scored trials, tighten the prototype checks for reload, visible error, and receiver origin, and add a native fixture for desktop-specific claims.
