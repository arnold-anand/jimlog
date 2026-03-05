'use client';

import { useState, useEffect } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import { useWorkoutStore } from '@/store/useWorkoutStore';
import { useCacheStore } from '@/store/useCacheStore';
import axios from '@/lib/axios';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Clock, ChevronUp, Trash2 } from 'lucide-react';
import Link from 'next/link';

export default function FloatingWorkoutWidget() {
    const pathname = usePathname();
    const router = useRouter();
    const { activeWorkoutId, workoutName, startTime, endWorkout } = useWorkoutStore();
    const { invalidate, invalidateMatching } = useCacheStore();
    const [elapsedTime, setElapsedTime] = useState(0);

    // Hide if no active workout
    // Using a simple conditional render to avoid SSR/hydration issues if possible
    // but pathname check is client-side anyway.
    const isWorkoutPage = pathname?.includes('/workout/') && !pathname?.endsWith('/summary');

    useEffect(() => {
        if (!startTime || !activeWorkoutId || isWorkoutPage) return;

        const updateTimer = () => {
            const now = Date.now();
            setElapsedTime(Math.floor((now - startTime) / 1000));
        };

        updateTimer(); // Initial call
        const intervalId = setInterval(updateTimer, 1000);

        return () => clearInterval(intervalId);
    }, [startTime, activeWorkoutId, isWorkoutPage]);

    if (!activeWorkoutId || isWorkoutPage) return null;

    const formatTime = (seconds: number) => {
        const mins = Math.floor(seconds / 60);
        const secs = seconds % 60;
        return `${mins}:${secs.toString().padStart(2, '0')}`;
    };

    const handleDiscard = async () => {
        if (!window.confirm('Discard workout?')) return;
        try {
            await axios.delete(`/workouts/${activeWorkoutId}`);
            endWorkout();
            invalidate('workouts/history');
            invalidateMatching('stats/');
            router.push('/dashboard');
        } catch (error) {
            console.error('Failed to discard workout');
        }
    };

    return (
        <div className="fixed bottom-[72px] left-4 right-4 z-[40] pointer-events-none">
            <Card className="p-3 bg-card/95 backdrop-blur-md border-orange-500/50 shadow-xl shadow-orange-500/10 pointer-events-auto">
                <div className="flex items-center justify-between gap-4">
                    <div className="flex flex-col min-w-0">
                        <span className="text-sm font-bold truncate text-foreground">
                            {workoutName || 'Workout'}
                        </span>
                        <div className="flex items-center text-orange-500 text-xs font-mono">
                            <Clock className="h-3 w-3 mr-1" />
                            {formatTime(elapsedTime)}
                        </div>
                    </div>
                    <div className="flex items-center gap-2">
                        <Button
                            variant="ghost"
                            size="icon"
                            className="h-8 w-8 text-muted-foreground hover:text-destructive hover:bg-destructive/10"
                            onClick={handleDiscard}
                        >
                            <Trash2 className="h-4 w-4" />
                        </Button>
                        <Link href={`/workout/${activeWorkoutId}`}>
                            <Button size="icon" className="h-8 w-8 bg-orange-500 hover:bg-orange-600 text-white shadow-lg shadow-orange-500/20">
                                <ChevronUp className="h-4 w-4" />
                            </Button>
                        </Link>
                    </div>
                </div>
            </Card>
        </div>
    );
}
