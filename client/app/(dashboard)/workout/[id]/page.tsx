'use client';

import { useParams } from 'next/navigation';
import ActiveWorkout from '@/components/workout/ActiveWorkout';

export default function WorkoutPage() {
    const params = useParams();
    const id = params.id as string;

    return (
        <div className="max-w-md mx-auto">
            <ActiveWorkout workoutId={id} />
        </div>
    );
}
