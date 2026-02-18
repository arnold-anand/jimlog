'use client';

import { useEffect, useState } from 'react';
import axios from '@/lib/axios';
import MuscleDistributionChart from '@/components/stats/MuscleDistributionChart';
import WeeklyActivityChart from '@/components/stats/WeeklyActivityChart';
import { Skeleton } from '@/components/ui/skeleton';

export default function StatsPage() {
    const [stats, setStats] = useState<any>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchStats = async () => {
            try {
                const { data } = await axios.get('/stats');
                setStats(data);
            } catch (error) {
                console.error('Failed to fetch stats');
            } finally {
                setLoading(false);
            }
        };
        fetchStats();
    }, []);

    if (loading) {
        return (
            <div className="space-y-6">
                <h2 className="text-2xl font-bold">Analytics</h2>
                <div className="grid gap-4 md:grid-cols-2">
                    <Skeleton className="h-[350px] w-full rounded" />
                    <Skeleton className="h-[350px] w-full rounded" />
                </div>
            </div>
        );
    }

    return (
        <div className="space-y-6">
            <h2 className="text-2xl font-bold">Analytics</h2>

            <div className="grid gap-4 md:grid-cols-2">
                {stats?.weeklyActivity && <WeeklyActivityChart data={stats.weeklyActivity} />}
                {stats?.muscleDistribution && <MuscleDistributionChart data={stats.muscleDistribution} />}
            </div>
        </div>
    );
}
