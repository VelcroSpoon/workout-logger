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

// The headline muscle groups trained on each day (shown on the day cards).
export const SPLIT_MUSCLES: Record<SplitDay, string> = {
  push: 'Chest · Shoulders · Triceps',
  pull: 'Back · Biceps · Rear delts',
  legs: 'Quads · Hamstrings · Calves',
};

// PPL rotation: which day naturally follows each one. Used to highlight
// the "next up" card based on the most recent logged session.
export const NEXT_IN_ROTATION: Record<SplitDay, SplitDay> = {
  push: 'pull',
  pull: 'legs',
  legs: 'push',
};
