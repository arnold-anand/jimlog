'use client';

import { useEffect, useState } from 'react';
import axios from '@/lib/axios';
import { useCacheStore } from '@/store/useCacheStore';
import RoutineCard from '@/components/routine/RoutineCard';
import { Button } from '@/components/ui/button';
import Link from 'next/link';
import { Plus } from 'lucide-react';
import { Skeleton } from '@/components/ui/skeleton';

interface Routine {
    _id: string;
    name: string;
    exercises: any[];
    updatedAt: string;
}

const CACHE_KEY = 'routines';

export default function RoutinesPage() {
    const { getCache, setCache, invalidate } = useCacheStore();
    const cached = getCache(CACHE_KEY);
    const [routines, setRoutines] = useState<Routine[]>(cached ?? []);
    const [loading, setLoading] = useState(!cached);

    const fetchRoutines = async () => {
        try {
            const { data } = await axios.get('/routines');
            setRoutines(data);
            setCache(CACHE_KEY, data);
        } catch (error) {
            console.error('Failed to fetch routines', error);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        if (cached) return;
        fetchRoutines();
    }, []);

    const handleDelete = async (id: string) => {
        try {
            await axios.delete(`/routines/${id}`);
            invalidate(CACHE_KEY); // Bust cache so next visit is fresh
            fetchRoutines();
        } catch (error) {
            console.error('Failed to delete routine', error);
        }
    };

    return (
        <div className="space-y-6">
            <div className="flex justify-between items-center">
                <h2 className="text-2xl font-bold">My Routines</h2>
                <Button asChild size="sm">
                    <Link href="/routines/create">
                        <Plus className="h-4 w-4 mr-2" /> New Routine
                    </Link>
                </Button>
            </div>

            {loading ? (
                <div className="space-y-4">
                    {[1, 2, 3].map((i) => (
                        <Skeleton key={i} className="h-32 w-full rounded" />
                    ))}
                </div>
            ) : routines.length > 0 ? (
                <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                    {routines.map((routine) => (
                        <RoutineCard key={routine._id} routine={routine} onDelete={handleDelete} />
                    ))}
                </div>
            ) : (
                <div className="text-center py-12">
                    <p className="text-muted-foreground mb-4">No routines found. Create one to get started!</p>
                    <Button asChild variant="outline">
                        <Link href="/routines/create">Create Routine</Link>
                    </Button>
                </div>
            )}
        </div>
    );
}
