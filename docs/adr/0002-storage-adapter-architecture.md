# ADR 0002: Storage Adapter Architecture

## Status
Accepted

## Context
React Native applications utilize a wide variety of persistent key-value storage mechanisms:
- `@react-native-async-storage/async-storage` (the community standard)
- `react-native-mmkv` (high-performance C++ JSI storage)
- In-memory storage (for unit tests and ephemeral flows)
- Custom secure storage or encrypted SQLite databases

Hard-coding any specific storage library inside `react-native-journey-recovery` would force unnecessary peer dependencies and prevent developers from using their existing storage layer.

## Decision
Abstract all persistence operations behind an asynchronous `StorageAdapter` interface:

```ts
export interface StorageAdapter {
  getItem(key: string): Promise<string | null>;
  setItem(key: string, value: string): Promise<void>;
  removeItem(key: string): Promise<void>;
  getAllKeys?(): Promise<string[]>;
}
```

Provide standard first-party adapters:
- `AsyncStorageAdapter`: Standard React Native storage.
- `MMKVStorageAdapter`: Fast MMKV storage.
- `MemoryStorageAdapter`: Zero-dependency testing adapter.

## Consequences
- **Positive:** Developers can bring any existing storage engine.
- **Positive:** Unit tests can run in memory in < 10ms without mocking disk operations.
- **Negative:** Storage operations remain asynchronous at the contract level (even for synchronous engines like MMKV) to maintain unified interface predictability.

