'use client';

import { useEffect, useState } from 'react';
import axios from '@/lib/axios';
import MuscleDistributionChart from '@/components/stats/MuscleDistributionChart';
import StatsSummaryCards from '@/components/stats/StatsSummaryCards';
import ActivityBarChart from '@/components/stats/ActivityBarChart';
import { Skeleton } from '@/components/ui/skeleton';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Flame } from 'lucide-react';

export default function StatsPage() {
    const [stats, setStats] = useState<any>(null);
    const [loading, setLoading] = useState(true);
    const [period, setPeriod] = useState<string>('30'); // Default to 30 days

    useEffect(() => {
        const fetchStats = async () => {
            setLoading(true);
            try {
                const { data } = await axios.get(`/stats?period=${period}`);
                setStats(data);
            } catch (error) {
                console.error('Failed to fetch stats', error);
            } finally {
                setLoading(false);
            }
        };
        fetchStats();
    }, [period]);

    return (
        <div className="space-y-6 max-w-4xl mx-auto">
            <div className="flex items-center justify-between">
                <div>
                    <h2 className="text-2xl font-bold">Analytics</h2>
                    {stats && (
                        <div className="flex items-center gap-1.5 mt-1 text-orange-500 font-medium bg-orange-500/10 px-2 py-1 rounded w-fit text-sm">
                            <Flame className="w-4 h-4" />
                            <span>{stats.streak} {stats.streak === 1 ? 'Day' : 'Days'} Streak</span>
                        </div>
                    )}
                </div>

                <Select value={period} onValueChange={setPeriod} disabled={loading}>
                    <SelectTrigger className="w-[140px] bg-[#18181b] border-[#27272a]">
                        <SelectValue placeholder="Period" />
                    </SelectTrigger>
                    <SelectContent>
                        <SelectItem value="7">Last 7 days</SelectItem>
                        <SelectItem value="30">Last 30 days</SelectItem>
                        <SelectItem value="365">This Year</SelectItem>
                    </SelectContent>
                </Select>
            </div>

            {loading ? (
                <div className="space-y-4">
                    <Skeleton className="h-[400px] w-full rounded" />
                    <div className="grid grid-cols-2 gap-4">
                        <Skeleton className="h-[120px] rounded" />
                        <Skeleton className="h-[120px] rounded" />
                        <Skeleton className="h-[120px] rounded" />
                        <Skeleton className="h-[120px] rounded" />
                    </div>
                </div>
            ) : stats?.current ? (
                <>
                    <ActivityBarChart data={stats.current.activityTimeline} />
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-6">
                        <MuscleDistributionChart
                            current={stats.current.muscleDistribution}
                            previous={stats.previous.muscleDistribution}
                        />
                        <div className="space-y-6">
                            <StatsSummaryCards
                                current={stats.current}
                                previous={stats.previous}
                            />
                        </div>
                    </div>
                </>
            ) : (
                <div className="text-center py-10 text-muted-foreground">
                    Unable to load analytics.
                </div>
            )}
        </div>
    );
}
