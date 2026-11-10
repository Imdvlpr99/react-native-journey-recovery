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

// Navigation Adapters
export * from './navigation';

// Form Integration Adapters
export * from './forms';

// State Management Integrations
export * from './integrations/zustand';
export * from './integrations/redux';
export * from './integrations/tanstack-query';

// UI Primitives
export * from './ui';

// Validation Helpers
export * from './validators';

// Testing Utilities
export * from './testing';

// React Integration
export * from './react';

// Errors & Utilities
export * from './utils/errors';
export * from './utils/checksum';
export * from './utils/debounce';
export * from './cli/inspect';

// Type Contracts
export * from './types';
