// Package version
export const VERSION = '0.1.0';

// Core Engine
export * from './core/JourneyManager';
export * from './core/JourneyRegistry';
export * from './core/CheckpointManager';
export * from './core/RecoveryManager';
export * from './core/LifecycleManager';
export * from './core/SnapshotSerializer';
export * from './core/SnapshotValidator';
export * from './core/RecoveryDiagnostics';

// Storage Adapters
export * from './storage';

// Form Integration
export * from './forms';

// Testing Utilities
export * from './testing';

// React Integration
export * from './react';

// Errors & Utilities
export * from './utils/errors';
export * from './utils/checksum';
export * from './utils/debounce';

// Type Contracts
export * from './types';
