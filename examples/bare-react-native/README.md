# Bare React Native Journey Recovery Example

This example demonstrates how to integrate `react-native-journey-recovery` into a bare React Native project (iOS & Android) with AsyncStorage and user identity scoping.

## Key Concepts Demonstrated

1. **User Identity Scoping**:
   Using `options.userId` to isolate draft applications between logged-in users on shared mobile devices.
2. **`useJourney` & `useRecovery`**:
   Providing a multi-step KYC identity verification flow with resume prompts.
3. **`flushOnBackground`**:
   Leveraging AppState lifecycle listeners to flush pending form drafts when the user backgrounds the app.

