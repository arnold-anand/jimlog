'use client';

import { useEffect, useState } from 'react';
import { useAuthStore } from '@/store/useAuthStore';
import { useCacheStore } from '@/store/useCacheStore';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import Link from 'next/link';
import { Dumbbell, Plus, Clock, Calendar } from 'lucide-react';
import axios from '@/lib/axios';

interface Workout {
    _id: string;
    name: string;
    createdAt: string;
    endedAt: string;
    exercises: {
        exercise: {
            name: string;
            equipment: string;
        };
        sets: {
            weight: number;
            reps: number;
            completed: boolean;
        }[];
    }[];
}

const CACHE_KEY = 'workouts/history';

export default function DashboardPage() {
    const user = useAuthStore((state) => state.user);
    const { getCache, setCache } = useCacheStore();
    const cached = getCache(CACHE_KEY);
    const [workouts, setWorkouts] = useState<Workout[]>(cached ?? []);
    const [loading, setLoading] = useState(!cached);

    useEffect(() => {
        if (cached) return; // Already have fresh data
        const fetchWorkouts = async () => {
            try {
                const { data } = await axios.get('/workouts/history');
                setWorkouts(data);
                setCache(CACHE_KEY, data);
            } catch (error) {
                console.error("Failed to fetch workouts", error);
            } finally {
                setLoading(false);
            }
        };
        fetchWorkouts();
    }, []);

    const formatDuration = (start: string, end: string) => {
        const startTime = new Date(start).getTime();
        const endTime = new Date(end).getTime();
        const diffInMinutes = Math.floor((endTime - startTime) / 60000);
        return `${diffInMinutes} min`;
    };

    const formatDate = (dateStr: string) => {
        return new Date(dateStr).toLocaleDateString('en-US', {
            weekday: 'short',
            month: 'short',
            day: 'numeric'
        });
    };

    return (
        <div className="space-y-6">
            <div>
                <h2 className="text-2xl font-bold">Hello, {user?.name || 'Anonymous'} 👋</h2>
                <p className="text-gray-500">Ready to crush your workout?</p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <Card className="bg-gradient-to-br from-orange-500 to-red-600 text-white border-none shadow-lg">
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2">
                            <Dumbbell className="h-6 w-6" />
                            Quick Start
                        </CardTitle>
                    </CardHeader>
                    <CardContent>
                        <p className="mb-4 text-orange-100">Start an empty workout or choose a routine.</p>
                        <div className="flex gap-2">
                            <Button asChild variant="secondary" className="w-full">
                                <Link href="/workout/start">Start Empty Workout</Link>
                            </Button>
                        </div>
                    </CardContent>
                </Card>

                <Card className="md:col-span-2">
                    <CardHeader>
                        <CardTitle>Recent Workouts</CardTitle>
                    </CardHeader>
                    <CardContent>
                        {loading ? (
                            <p className="text-gray-500 text-sm">Loading history...</p>
                        ) : workouts.length === 0 ? (
                            <div className="text-center py-6 border border-dashed rounded text-muted-foreground">
                                <p className="mb-4">You haven't logged any workouts yet.</p>
                                <Button asChild variant="outline">
                                    <Link href="/workout/start">
                                        <Plus className="h-4 w-4 mr-2" /> Start a Workout
                                    </Link>
                                </Button>
                            </div>
                        ) : (
                            <div className="space-y-4">
                                {workouts.slice(0, 5).map((workout) => (
                                    <div key={workout._id} className="p-4 rounded-lg border bg-card text-card-foreground shadow-sm">
                                        <div className="flex justify-between items-start mb-2">
                                            <div>
                                                <h3 className="font-semibold">{workout.name}</h3>
                                                <div className="flex items-center text-xs text-muted-foreground gap-3 mt-1">
                                                    <span className="flex items-center gap-1">
                                                        <Calendar className="h-3 w-3" />
                                                        {formatDate(workout.createdAt)}
                                                    </span>
                                                    <span className="flex items-center gap-1">
                                                        <Clock className="h-3 w-3" />
                                                        {formatDuration(workout.createdAt, workout.endedAt)}
                                                    </span>
                                                </div>
                                            </div>
                                        </div>
                                        <div className="mt-3 text-sm space-y-1">
                                            {workout.exercises.map((ex, i) => {
                                                const completedSets = ex.sets.filter(s => s.completed).length;
                                                if (completedSets === 0) return null;
                                                return (
                                                    <p key={i} className="text-muted-foreground">
                                                        {completedSets} {completedSets === 1 ? 'set' : 'sets'} {ex.exercise?.name} ({ex.exercise?.equipment})
                                                    </p>
                                                );
                                            })}
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )}
                    </CardContent>
                </Card>
            </div>
        </div>
    );
}
