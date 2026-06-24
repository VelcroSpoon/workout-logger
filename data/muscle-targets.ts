import type { MuscleGroup } from '@/types/workout';

// Weekly target sets per muscle group — the "planned" side of the
// planned-vs-actual volume view. These are sensible hypertrophy defaults
// (~10–16 sets/week for big movers, less for small ones). Later these
// could become user-editable; for now they're fixed defaults.
export const DEFAULT_MUSCLE_TARGETS: Record<MuscleGroup, number> = {
  chest: 14,
  back: 16,
  shoulders: 12,
  biceps: 10,
  triceps: 10,
  rear_delts: 8,
  quads: 14,
  hamstrings: 10,
  glutes: 10,
  calves: 10,
};

// The order muscles are listed on the Weekly Volume screen.
export const MUSCLE_ORDER: MuscleGroup[] = [
  'chest',
  'back',
  'shoulders',
  'biceps',
  'triceps',
  'rear_delts',
  'quads',
  'hamstrings',
  'glutes',
  'calves',
];

// "rear_delts" → "Rear Delts"
export function formatMuscle(muscle: string): string {
  return muscle
    .split('_')
    .map((word) => word[0].toUpperCase() + word.slice(1))
    .join(' ');
}
