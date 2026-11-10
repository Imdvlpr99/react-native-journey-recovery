# Expo Journey Recovery Example

This example demonstrates how to integrate `react-native-journey-recovery` into an Expo project to make multi-screen flight booking forms recoverable across app process restarts, crashes, and accidental dismissals.

## Key Concepts Demonstrated

1. **`RecoveryProvider`**: Configures the recovery engine at the root of the app.
2. **`useRecovery`**: Detects whether an unfinished booking journey exists on launch and presents a user recovery banner.
3. **`useJourney`**: Incrementally saves checkpoints at each step (`destination` -> `passengers` -> `review`).
4. **`journey.clear()`**: Clears the persisted checkpoint once the booking is confirmed.
