# Expo Journey Recovery Standalone Example

A self-contained, fully runnable Expo application demonstrating **multi-step flight booking recovery** across process kills, crashes, and accidental dismissals.

## Getting Started

1. **Install dependencies:**
   ```bash
   cd examples/expo
   npm install
   ```

2. **Run in development:**
   ```bash
   # Start Expo CLI bundler
   npx expo start

   # Or launch directly in web
   npm run web

   # Or launch in iOS Simulator
   npm run ios

   # Or launch on Android Emulator
   npm run android
   ```

## Features Demonstrated

1. **`RecoveryProvider`**: Configures the recovery engine at the root of the app.
2. **`useJourney`**: Incrementally checkpoints flight selection and passenger information with automatic debouncing.
3. **`useRecovery`**: Detects unfinished booking flows on launch; the app renders its own prompt to resume or discard.
4. **`SecureStoreAdapter` (or `MemoryStorageAdapter` for testing)**: Persistent client-side storage without server data confusion.
5. **Clean Dismissal**: Clears storage using `journey.clear()` upon final booking confirmation.
