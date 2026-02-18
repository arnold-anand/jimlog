import { create } from 'zustand';
import { persist } from 'zustand/middleware';

interface Set {
    weight: number;
    reps: number;
    completed: boolean;
}

interface WorkoutExercise {
    exercise: {
        _id: string;
        name: string;
        muscleGroups: string[];
    };
    sets: Set[];
}

interface WorkoutState {
    activeWorkoutId: string | null;
    startTime: number | null;
    exercises: WorkoutExercise[];
    startWorkout: (id: string, exercises: any[]) => void;
    endWorkout: () => void;
    updateExercises: (exercises: WorkoutExercise[]) => void;
}

export const useWorkoutStore = create<WorkoutState>()(
    persist(
        (set) => ({
            activeWorkoutId: null,
            startTime: null,
            exercises: [],
            startWorkout: (id, exercises) =>
                set({ activeWorkoutId: id, startTime: Date.now(), exercises }),
            endWorkout: () => set({ activeWorkoutId: null, startTime: null, exercises: [] }),
            updateExercises: (exercises) => set({ exercises }),
        }),
        {
            name: 'workout-storage',
        }
    )
);
