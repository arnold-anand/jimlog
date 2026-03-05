'use client';

import { useEffect, useState } from 'react';
import axios from '@/lib/axios';
import { useCacheStore } from '@/store/useCacheStore';
import MuscleDistributionChart from '@/components/stats/MuscleDistributionChart';
import StatsSummaryCards from '@/components/stats/StatsSummaryCards';
import ActivityBarChart from '@/components/stats/ActivityBarChart';
import FoodAnalyticsBarChart from '@/components/stats/FoodAnalyticsBarChart';
import MacroProgressBars from '@/components/stats/MacroProgressBars';
import { Skeleton } from '@/components/ui/skeleton';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Flame, Settings2, Zap } from 'lucide-react';

type AnalyticsView = 'workout' | 'food';

export default function StatsPage() {
    const { getCache, setCache } = useCacheStore();
    const [view, setView] = useState<AnalyticsView>('workout');
    const [period, setPeriod] = useState<string>('30');

    // Workout stats
    const workoutCacheKey = `stats/${period}`;
    const workoutCached = getCache(workoutCacheKey);
    const [stats, setStats] = useState<any>(workoutCached ?? null);
    const [loadingWorkout, setLoadingWorkout] = useState(!workoutCached);

    // Food stats
    const foodCacheKey = `nutrition/stats/${period}`;
    const foodCached = getCache(foodCacheKey);
    const [foodStats, setFoodStats] = useState<any>(foodCached ?? null);
    const [loadingFood, setLoadingFood] = useState(!foodCached);

    // Today's nutrition stats
    const dailyCacheKey = 'nutrition/daily';
    const dailyCached = getCache(dailyCacheKey);
    const [dailyNutrition, setDailyNutrition] = useState<any>(dailyCached ?? null);

    // Fetch workout stats
    useEffect(() => {
        if (view !== 'workout') return;
        const fetchStats = async () => {
            const fresh = getCache(workoutCacheKey);
            if (fresh) {
                setStats(fresh);
                setLoadingWorkout(false);
                return;
            }
            setLoadingWorkout(true);
            try {
                const { data } = await axios.get(`/stats?period=${period}`);
                setStats(data);
                setCache(workoutCacheKey, data);
            } catch (error) {
                console.error('Failed to fetch stats', error);
            } finally {
                setLoadingWorkout(false);
            }
        };
        fetchStats();
    }, [period, view]);

    // Fetch food stats
    useEffect(() => {
        if (view !== 'food') return;

        const fetchDaily = async () => {
            try {
                const { data } = await axios.get('/nutrition/daily');
                setDailyNutrition(data);
                setCache(dailyCacheKey, data);
            } catch (err) {
                console.error('Failed to fetch daily nutrition', err);
            }
        };

        const fetchFoodStats = async () => {
            const fresh = getCache(foodCacheKey);
            if (fresh) {
                setFoodStats(fresh);
                setLoadingFood(false);
                return;
            }
            setLoadingFood(true);
            try {
                const { data } = await axios.get(`/nutrition/stats?period=${period}`);
                setFoodStats(data);
                setCache(foodCacheKey, data);
            } catch (error) {
                console.error('Failed to fetch food stats', error);
            } finally {
                setLoadingFood(false);
            }
        };

        fetchDaily();
        fetchFoodStats();
    }, [period, view]);

    const loading = view === 'workout' ? loadingWorkout : loadingFood;

    return (
        <div className="space-y-6 max-w-4xl mx-auto">
            <div className="flex items-center justify-between">
                <div>
                    {/* Analytics View Dropdown */}
                    <Select value={view} onValueChange={(v) => setView(v as AnalyticsView)}>
                        <SelectTrigger className="w-[210px] border-none shadow-none p-0 h-auto text-xl font-bold focus:ring-0 [&>svg]:ml-2">
                            <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                            <SelectItem value="workout">Workout Analytics</SelectItem>
                            <SelectItem value="food">Food Analytics</SelectItem>
                        </SelectContent>
                    </Select>
                    {view === 'workout' && stats && (
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
            ) : view === 'workout' ? (
                // --- Workout Analytics View ---
                stats?.current ? (
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
                )
            ) : (
                // --- Food Analytics View ---
                <>
                    {dailyNutrition?.targets && (
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 items-start">
                            {/* Daily Target Card - Moved from Profile */}
                            <Card className="border-primary bg-primary/5 shadow-lg shadow-primary/10 border-2">
                                <CardHeader className="pb-2">
                                    <div className="flex items-center justify-between">
                                        <CardTitle className="text-lg font-bold flex items-center gap-2">
                                            <Zap className="h-5 w-5 text-primary animate-pulse" />
                                            Daily Target
                                        </CardTitle>
                                        <CardDescription className="text-xs uppercase font-bold tracking-tight">Based on profile</CardDescription>
                                    </div>
                                </CardHeader>
                                <CardContent className="text-center space-y-4">
                                    <div className="py-2">
                                        <span className="text-4xl font-black text-primary">
                                            {Math.round(dailyNutrition.targets.targetCalories)}
                                        </span>
                                        <span className="text-xs font-bold text-muted-foreground block uppercase mt-1">kcal / day</span>
                                    </div>

                                    <div className="grid grid-cols-3 gap-2 py-4 border-t border-primary/10">
                                        <div>
                                            <p className="text-[10px] font-bold text-muted-foreground uppercase">Protein</p>
                                            <p className="text-sm font-black text-orange-500">{Math.round(dailyNutrition.targets.targetProtein)}g</p>
                                        </div>
                                        <div>
                                            <p className="text-[10px] font-bold text-muted-foreground uppercase">Carbs</p>
                                            <p className="text-sm font-black text-blue-500">{Math.round(dailyNutrition.targets.targetCarbs)}g</p>
                                        </div>
                                        <div>
                                            <p className="text-[10px] font-bold text-muted-foreground uppercase">Fat</p>
                                            <p className="text-sm font-black text-yellow-500">{Math.round(dailyNutrition.targets.targetFat)}g</p>
                                        </div>
                                    </div>
                                </CardContent>
                            </Card>

                            <div className="space-y-4">
                                <h3 className="text-lg font-bold">Today's Progress</h3>
                                <MacroProgressBars
                                    totals={dailyNutrition.totals || { calories: 0, protein: 0, carbs: 0, fat: 0, fiber: 0 }}
                                    targets={dailyNutrition.targets}
                                />
                            </div>
                        </div>
                    )}


                    <FoodAnalyticsBarChart
                        data={foodStats?.timeline || []}
                        targets={dailyNutrition?.targets || foodStats?.targets}
                    />
                </>
            )}
        </div>
    );
}
