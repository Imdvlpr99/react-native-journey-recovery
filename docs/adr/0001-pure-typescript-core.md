# ADR 0001: Pure TypeScript Core Engine

## Status
Accepted

## Context
Mobile recovery engines often debate whether to include native platform modules (written in Kotlin for Android and Swift for iOS) to listen for low-level process termination callbacks.

However:
1. Neither Android nor iOS guarantees that an app termination callback will reliably execute or complete disk writes before process death.
2. Native code modules require native linking, custom CocoaPods/Gradle setup, and prevent direct zero-config adoption in Expo Go and managed Expo workflows.
3. The actual requirement is capturing client UI progress at explicit checkpoints and persisting snapshots safely.

## Decision
Implement the entire v0.1.0 recovery engine in pure TypeScript.
- Rely on incremental persistence at explicit transitions and debounced changes, rather than a speculative shutdown hook.
- Integrate with React Native's JS-level `AppState` listener for best-effort flushing on background transitions.
- Maintain zero native build dependencies.

## Consequences
- **Positive:** Works out of the box with bare React Native, Expo Go, Expo managed, and web without native configuration.
- **Positive:** Fast development and test cycles with Node.js test runners (Vitest).
- **Negative:** Cannot execute code if the OS terminates the process instantaneously while a debounced timer is still ticking (mitigated by explicit checkpointing and background flush).

