# ADR 0003: Write Serialization and Atomic Failure Safety

## Status
Accepted

## Context
When users rapidly type into multi-step forms or trigger multiple screen transitions concurrently, multiple calls to `checkpoint()` can be in flight simultaneously.

In asynchronous systems, if save operations run uncoordinated:
1. An earlier checkpoint call that completes slowly can overwrite a newer checkpoint (race condition).
2. If a new checkpoint write throws an error (e.g. disk full or corrupted JSON), it can wipe or corrupt the previously valid stored checkpoint.

## Decision
1. **Per-Journey Promise Mutex:** `CheckpointManager` maintains an internal promise chain per `journeyId`. All asynchronous checkpoint saves, deletions, and restorations are serialized in strict chronological order.
2. **Preservation of Previous Checkpoint:** The previous snapshot is never removed or overwritten until the new serialized snapshot is safely written. If an underlying `setItem` call rejects, the previous checkpoint remains intact in storage, and a typed `STORAGE_UNAVAILABLE` error is raised.

## Consequences
- **Positive:** Race conditions are mathematically prevented per journey.
- **Positive:** Data loss during failed disk writes is eliminated.
- **Positive:** Different journeys (e.g. `checkout` and `profile`) can write in parallel without blocking each other.

