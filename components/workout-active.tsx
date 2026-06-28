import { createContext, useContext, useState, useCallback, type ReactNode } from 'react';

// A tiny shared channel between the Today screen (which owns the workout)
// and the bottom nav (which the tab navigator renders separately):
//   - active / setActive: is a session in progress? The nav hides when true.
//   - startSignal / requestStart: the center "+" button bumps startSignal,
//     and the Today screen watches it to kick off the next-up workout.
type WorkoutActive = {
  active: boolean;
  setActive: (v: boolean) => void;
  startSignal: number;
  requestStart: () => void;
};

const WorkoutActiveContext = createContext<WorkoutActive>({
  active: false,
  setActive: () => {},
  startSignal: 0,
  requestStart: () => {},
});

export function WorkoutActiveProvider({ children }: { children: ReactNode }) {
  const [active, setActive] = useState(false);
  const [startSignal, setStartSignal] = useState(0);
  const requestStart = useCallback(() => setStartSignal((n) => n + 1), []);
  return (
    <WorkoutActiveContext.Provider value={{ active, setActive, startSignal, requestStart }}>
      {children}
    </WorkoutActiveContext.Provider>
  );
}

export function useWorkoutActive() {
  return useContext(WorkoutActiveContext);
}
