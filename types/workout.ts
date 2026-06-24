// ─── Split & Muscle Taxonomy ───────────────────────────────────

export type SplitDay = 'push' | 'pull' | 'legs';

// The weight unit the user logs in. We store this as a single
// global setting; toggling it relabels the UI (it does NOT convert
// existing numbers — that's a deliberate v1 simplification).
export type WeightUnit = 'lb' | 'kg';

export type MuscleGroup =
  // Push muscles
  | 'chest'
  | 'shoulders'
  | 'triceps'
  // Pull muscles
  | 'back'
  | 'biceps'
  | 'rear_delts'
  // Leg muscles
  | 'quads'
  | 'hamstrings'
  | 'glutes'
  | 'calves';

// ─── Exercise Definition ───────────────────────────────────────
// This is a *template* — "Bench Press exists and belongs to Push/Chest."
// It does NOT hold any data about a specific workout.

export type Exercise = {
  id: string;
  name: string;
  splitDay: SplitDay;
  muscleGroup: MuscleGroup;
};

// ─── Logging a Workout ─────────────────────────────────────────
// When the user actually lifts, they produce LoggedSets inside a WorkoutSession.

export type LoggedSet = {
  exerciseId: string;
  setNumber: number;       // 1, 2, 3, ...
  weight: number;          // in whatever unit the user prefers
  reps: number;
  completed: boolean;      // did they finish the set or bail?
};

export type WorkoutSession = {
  id: string;
  date: string;            // ISO date string, e.g. "2026-06-20"
  splitDay: SplitDay;
  sets: LoggedSet[];
};

// ─── User's Routine ────────────────────────────────────────────
// Which exercises the user plans to do on each split day,
// and how many sets they intend per exercise.

export type RoutineExercise = {
  exerciseId: string;
  targetSets: number;      // e.g. "do 3 sets of bench"
};

export type Routine = {
  push: RoutineExercise[];
  pull: RoutineExercise[];
  legs: RoutineExercise[];
};
