import React from 'react';

export const Hero: React.FC = () => {
  return (
    <div className="space-y-3 pb-8 border-b border-slate-200/60 dark:border-slate-800/60">
      {/* Breadcrumb */}
      <div className="flex items-center gap-2 text-xs">
        <span className="font-semibold text-sky-600 dark:text-sky-400">Documentation</span>
        <span className="text-slate-300 dark:text-slate-700">/</span>
        <span className="text-slate-500 dark:text-slate-400">Getting Started</span>
        <span className="ml-auto text-xs font-mono text-slate-400 dark:text-slate-500">
          v0.1.0 · Zero Native Deps
        </span>
      </div>

      {/* Title & Description */}
      <div className="space-y-3">
        <h1 className="text-3xl sm:text-4xl font-bold tracking-tight text-slate-900 dark:text-slate-100">
          react-native-journey-recovery
        </h1>
        <p className="text-base sm:text-lg text-slate-500 dark:text-slate-400 leading-relaxed max-w-3xl">
          A developer-first checkpoint recovery engine for React Native and Expo. Checkpoint multi-screen forms, eliminate concurrent write races with a Promise FIFO mutex, and automatically restore in-flight progress after Android LMK and iOS Jetsam memory terminations.
        </p>
      </div>
    </div>
  );
};
