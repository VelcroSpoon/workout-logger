import type { SplitDay } from '@/types/workout';

// The split days in display order. Used anywhere we render a
// push/pull/legs picker so the order stays consistent.
export const SPLIT_DAYS: SplitDay[] = ['push', 'pull', 'legs'];

// Human-readable labels for each split day.
export const SPLIT_LABELS: Record<SplitDay, string> = {
  push: 'Push',
  pull: 'Pull',
  legs: 'Legs',
};
