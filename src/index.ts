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

// Storage Adapters
export * from './storage';

// React Integration
export * from './react';

// Errors & Utilities
export * from './utils/errors';
export * from './utils/checksum';
export * from './utils/debounce';

// Type Contracts
export * from './types';
