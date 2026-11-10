# Interactive Journey Recovery Simulator

A browser-based interactive visual simulator showcasing the core principles and failure-resilience mechanisms of `react-native-journey-recovery`.

## Features Demonstrated

1. **Active Checkpoint Persistence:**
   - Real-time debounced state capture.
   - Automatic sensitive field exclusion (`ccNumber` password/credit card is never persisted).
   - Real-time FNV-1a checksum calculation and byte size metering.
2. **Process Death & Crash Simulation:**
   - Simulate operating system process kill (`SIGKILL` / background memory reclamation).
   - Test application re-launch and automatic recoverable session detection.
3. **Storage Corruption & Tamper Detection:**
   - Directly tamper with stored payload data to trigger FNV-1a integrity checksum failure.
   - Verify that corrupted snapshots are safely rejected without crashing the app.
4. **Time-to-Live (TTL) Expiration:**
   - Simulate expired checkpoints and verify expiration policy enforcement.
5. **Server Cache Coordination:**
   - Simulate TanStack Query invalidation and revalidation alongside client state restoration.

## How to Run

Simply open `index.html` in any modern web browser:

```bash
# Open directly in default browser (Windows)
start examples/simulator/index.html

# Or on macOS
open examples/simulator/index.html

# Or serve via any local HTTP server
npx serve examples/simulator
```
