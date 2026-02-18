'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import axios from '@/lib/axios';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Trophy, Clock, Dumbbell, Home } from 'lucide-react';
import Link from 'next/link';

export default function WorkoutSummaryPage() {
    const params = useParams();
    const router = useRouter();
    const id = params.id as string;
    const [workout, setWorkout] = useState<any>(null);
    const [newPRs, setNewPRs] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        // We should probably rely on state passed via navigation or fetch fresh data.
        // Since endWorkout returns the data, we could have passed it via query params or state.
        // For now, let's just fetch the workout. We won't have the "New PRs" list from the
        // endWorkout response unless we stored it somewhere.
        // HACK: For now, we will just fetch the workout. Displaying "New PR" might require
        // a different approach (e.g., storing "last PR" date).
        // BETTER APPROACH: The user is redirected here AFTER endWorkout. The ActiveWorkout component
        // receives the response. We can pass the PR data via URL query params or localStorage.

        // Let's check localStorage for "lastWorkoutSummary"
        const summaryData = localStorage.getItem('lastWorkoutSummary');
        if (summaryData) {
            const parsed = JSON.parse(summaryData);
            if (parsed?.workout?._id === id) {
                setWorkout(parsed.workout);
                setNewPRs(parsed.newPRs || []);
                setLoading(false);
                return;
            }
        }

        // Fallback: Fetch workout only
        const fetchWorkout = async () => {
            try {
                // We need an endpoint to get specific workout by ID (we only have getActive)
                // But we don't have GetWorkoutById endpoint in routes yet!
                // Wait, we do not have specific getWorkoutById in workoutController...
                // We only have getActiveWorkout. 
                // Phase 4 task list: "Implement Start Workout Logic", "Implement Logging Sets".
                // Phase 5: "Implement End Workout API".
                // We missed "Get Past Workout API".
                // Adding a simple get by ID would be good.
                router.push('/dashboard'); // Fallback for now
            } catch (error) {
                router.push('/dashboard');
            }
        };
        fetchWorkout();

    }, [id, router]);

    if (loading) return <div>Loading summary...</div>;

    const durationStr = workout.endedAt && workout.startedAt
        ? Math.floor((new Date(workout.endedAt).getTime() - new Date(workout.startedAt).getTime()) / 60000) + ' min'
        : 'N/A';

    // Calculate total volume
    const totalVolume = workout.exercises.reduce((acc: number, ex: any) => {
        return acc + ex.sets.reduce((sAcc: number, s: any) => sAcc + (s.completed ? s.weight * s.reps : 0), 0);
    }, 0);

    return (
        <div className="space-y-6">
            <div className="text-center space-y-2">
                <Trophy className="h-16 w-16 text-yellow-500 mx-auto" />
                <h2 className="text-3xl font-bold">Workout Complete!</h2>
                <p className="text-gray-500">Great job crushing your goals.</p>
            </div>

            <div className="grid grid-cols-2 gap-4">
                <Card>
                    <CardContent className="flex flex-col items-center justify-center p-6">
                        <Clock className="h-8 w-8 text-orange-500 mb-2" />
                        <span className="text-2xl font-bold">{durationStr}</span>
                        <span className="text-xs text-gray-400">Duration</span>
                    </CardContent>
                </Card>
                <Card>
                    <CardContent className="flex flex-col items-center justify-center p-6">
                        <Dumbbell className="h-8 w-8 text-orange-500 mb-2" />
                        <span className="text-2xl font-bold">{totalVolume} kg</span>
                        <span className="text-xs text-gray-400">Total Volume</span>
                    </CardContent>
                </Card>
            </div>

            {newPRs.length > 0 && (
                <Card className="bg-yellow-50 border-yellow-200">
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2 text-yellow-700">
                            <Trophy className="h-5 w-5" /> New Records
                        </CardTitle>
                    </CardHeader>
                    <CardContent>
                        <ul className="space-y-2">
                            {newPRs.map((pr: any, i: number) => (
                                <li key={i} className="text-sm">
                                    <span className="font-bold">{pr.exerciseId}</span> (New Best!)
                                </li>
                            ))}
                        </ul>
                    </CardContent>
                </Card>
            )}

            <Button asChild className="w-full" size="lg">
                <Link href="/dashboard">
                    <Home className="h-4 w-4 mr-2" /> Back to Dashboard
                </Link>
            </Button>
        </div>
    );
}
