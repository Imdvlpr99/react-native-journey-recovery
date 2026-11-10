# Contributing to react-native-journey-recovery

Thank you for your interest in contributing to `react-native-journey-recovery`!

This library is built with reliability as its highest priority. Before submitting contributions, please read through the guidelines below.

---

## Development Workflow

### Requirements
- Node.js >= 20.0.0
- npm or pnpm

### Getting Started

1. **Clone the repository:**
   ```bash
   git clone https://github.com/Imdvlpr99/react-native-journey-recovery.git
   cd react-native-journey-recovery
   ```

2. **Install dependencies:**
   ```bash
   npm install
   ```

3. **Run tests with coverage:**
   ```bash
   npm run test:coverage
   # or with live watch mode:
   npm run test:watch
   ```

4. **Run TypeScript check & benchmarks:**
   ```bash
   npm run typecheck
   npm run bench
   ```

5. **Start local documentation & simulator:**
   ```bash
   npm run dev:docs
   ```

6. **Run complete verification pipeline:**
   ```bash
   npm run verify
   ```

---

## Code Guidelines

1. **Pure TypeScript Core:** The core engine must remain free of native Android (Kotlin) or iOS (Swift) modules in v0.1.0 to ensure zero-overhead adoption across Bare React Native and Expo projects.
2. **Framework-Agnostic Core:** Core recovery logic must never hard-depend on a specific navigation or form library. Use pluggable adapters.
3. **Write Failure Resilience:** Any new persistence behavior must guarantee that a failed write never overwrites or destroys the previous committed checkpoint.
4. **Never Blind-Restore:** Always validate data structure, checksums, schema version, and expiry before restoring state.
5. **Privacy by Default:** Never persist passwords, payment credentials, or authentication tokens. All field captures must be developer-specified.

---

## Submitting Pull Requests

1. Create a feature branch from `master`:
   ```bash
   git checkout -b feat/your-feature-name
   ```
2. Write unit and integration tests covering your changes in `tests/`.
3. Verify that all checks pass cleanly:
   ```bash
   npm run verify
   ```
4. Commit your changes using conventional commit messages (e.g. `feat:`, `fix:`, `docs:`, `test:`).
5. Push to your fork and submit a Pull Request with a clear description of the problem solved and testing performed.

---

## License

By contributing, you agree that your contributions will be licensed under the [MIT License](LICENSE).

