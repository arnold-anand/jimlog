import { create } from 'zustand';
import { persist } from 'zustand/middleware';

interface Set {
    weight?: number;
    reps?: number;
    time?: number;
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
    workoutName: string | null;
    startTime: number | null;
    exercises: WorkoutExercise[];
    startWorkout: (id: string, name: string, exercises: any[]) => void;
    endWorkout: () => void;
    setStoreExercises: (exercises: WorkoutExercise[]) => void;
    setWorkoutData: (data: Partial<WorkoutState>) => void;
}

export const useWorkoutStore = create<WorkoutState>()(
    persist(
        (set) => ({
            activeWorkoutId: null,
            workoutName: null,
            startTime: null,
            exercises: [],
            startWorkout: (id, name, exercises) =>
                set({ activeWorkoutId: id, workoutName: name, startTime: Date.now(), exercises }),
            endWorkout: () => set({ activeWorkoutId: null, workoutName: null, startTime: null, exercises: [] }),
            setStoreExercises: (exercises) => set({ exercises }),
            setWorkoutData: (data) => set(data),
        }),
        {
            name: 'workout-storage',
        }
    )
);
