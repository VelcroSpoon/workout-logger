import {
  createContext,
  useContext,
  useState,
  useEffect,
  useCallback,
  useMemo,
  type ReactNode,
} from 'react';
import type { Exercise, MuscleGroup, SplitDay } from '@/types/workout';
import { DEFAULT_EXERCISES, EXERCISE_MAP } from '@/data/exercises';
import { loadCustomExercises, saveCustomExercises } from '@/storage/workout-storage';

// The exercise library used to be a static constant. Custom exercises
// the user creates need to merge into it so every screen (active workout,
// volume tally, history) can resolve their names/muscles. So we expose the
// library through context: built-in exercises + the user's custom ones.
type ExercisesContextValue = {
  allExercises: Exercise[]; // built-ins + custom
  exerciseMap: Record<string, Exercise>; // id → exercise
  addCustomExercise: (
    name: string,
    muscleGroup: MuscleGroup,
    splitDay: SplitDay,
  ) => Exercise;
};

const ExercisesContext = createContext<ExercisesContextValue>({
  allExercises: DEFAULT_EXERCISES,
  exerciseMap: EXERCISE_MAP,
  addCustomExercise: () => ({ id: '', name: '', muscleGroup: 'chest', splitDay: 'push' }),
});

export function ExercisesProvider({ children }: { children: ReactNode }) {
  const [custom, setCustom] = useState<Exercise[]>([]);

  useEffect(() => {
    loadCustomExercises().then(setCustom);
  }, []);

  const allExercises = useMemo(() => [...DEFAULT_EXERCISES, ...custom], [custom]);
  const exerciseMap = useMemo(
    () => Object.fromEntries(allExercises.map((e) => [e.id, e])),
    [allExercises],
  );

  const addCustomExercise = useCallback(
    (name: string, muscleGroup: MuscleGroup, splitDay: SplitDay) => {
      const exercise: Exercise = {
        id: `custom_${Date.now()}`,
        name: name.trim(),
        muscleGroup,
        splitDay,
      };
      setCustom((prev) => {
        const next = [...prev, exercise];
        saveCustomExercises(next); // persist alongside the state update
        return next;
      });
      return exercise;
    },
    [],
  );

  const value = useMemo(
    () => ({ allExercises, exerciseMap, addCustomExercise }),
    [allExercises, exerciseMap, addCustomExercise],
  );

  return <ExercisesContext.Provider value={value}>{children}</ExercisesContext.Provider>;
}

export function useExercises() {
  return useContext(ExercisesContext);
}
