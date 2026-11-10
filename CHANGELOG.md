# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [0.1.0] - 2026-11-10

### Added
- Core journey lifecycle: registration, checkpoint persistence, recovery, and cleanup.
- Concurrency control: per-journey promise queue serializing all writes to prevent race conditions.
- Failure resilience: preservation of the last committed checkpoint if a subsequent write fails.
- Data integrity: FNV-1a deterministic checksum validation to detect data tampering or disk corruption.
- Schema versioning: automatic migration pipeline via `migrate(oldData, oldVersion)` handler.
- Expiration policy: automatic rejection and status reporting for expired checkpoints.
- Safe serialization: exclusion of sensitive fields (`exclude: string[]`) and safe error trapping.
- Storage adapters: `AsyncStorageAdapter` and `MemoryStorageAdapter`.
- React integration: `RecoveryProvider`, `useJourney`, `useRecovery`, `useRecoveryStatus`, and `useRecoveryContext`.
- Lifecycle events: `onRecovery` hooks for observing status transitions.
- Multi-step checkout workflow example.
