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
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Flame, Settings2, Zap, Dumbbell, Utensils } from 'lucide-react';
import { useRef } from 'react';

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

    // Swipe detection
    const touchStartRef = useRef<number | null>(null);
    const touchEndRef = useRef<number | null>(null);
    const touchStartYRef = useRef<number | null>(null);
    const touchEndYRef = useRef<number | null>(null);

    const minSwipeDistance = 50;

    const onTouchStart = (e: React.TouchEvent) => {
        touchEndRef.current = null;
        touchEndYRef.current = null;
        touchStartRef.current = e.targetTouches[0].clientX;
        touchStartYRef.current = e.targetTouches[0].clientY;
    };

    const onTouchMove = (e: React.TouchEvent) => {
        touchEndRef.current = e.targetTouches[0].clientX;
        touchEndYRef.current = e.targetTouches[0].clientY;
    };

    const onTouchEnd = () => {
        if (!touchStartRef.current || !touchEndRef.current || !touchStartYRef.current || !touchEndYRef.current) return;

        const distanceX = touchStartRef.current - touchEndRef.current;
        const distanceY = touchStartYRef.current - touchEndYRef.current;

        const isHorizontal = Math.abs(distanceX) > Math.abs(distanceY) * 2;
        const isLeftSwipe = distanceX > minSwipeDistance;
        const isRightSwipe = distanceX < -minSwipeDistance;

        if (isHorizontal) {
            if (isLeftSwipe && view === 'workout') {
                setView('food');
            } else if (isRightSwipe && view === 'food') {
                setView('workout');
            }
        }
    };

    return (
        <div
            className="space-y-6 max-w-4xl mx-auto touch-pan-y"
            onTouchStart={onTouchStart}
            onTouchMove={onTouchMove}
            onTouchEnd={onTouchEnd}
        >
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <Tabs value={view} onValueChange={(v) => setView(v as AnalyticsView)} className="w-full sm:w-auto">
                    <TabsList className="grid w-full grid-cols-2 h-11 p-1 bg-[#18181b] border-[#27272a]">
                        <TabsTrigger value="workout" className="flex items-center gap-2 font-bold data-[state=active]:bg-primary data-[state=active]:text-primary-foreground">
                            <Dumbbell className="w-4 h-4" />
                            Workout
                        </TabsTrigger>
                        <TabsTrigger value="food" className="flex items-center gap-2 font-bold data-[state=active]:bg-primary data-[state=active]:text-primary-foreground">
                            <Utensils className="w-4 h-4" />
                            Food
                        </TabsTrigger>
                    </TabsList>
                </Tabs>

                <div className="flex items-center justify-between sm:justify-end gap-4">
                    {view === 'workout' && stats && (
                        <div className="flex items-center gap-1.5 text-orange-500 font-medium bg-orange-500/10 px-2 py-1.5 rounded-md text-sm border border-orange-500/20">
                            <Flame className="w-4 h-4" />
                            <span>{stats.streak} {stats.streak === 1 ? 'Day' : 'Days'} Streak</span>
                        </div>
                    )}

                    {view === 'workout' && (
                        <Select value={period} onValueChange={setPeriod} disabled={loading}>
                            <SelectTrigger className="w-[140px] bg-[#18181b] border-[#27272a] h-11 font-medium">
                                <SelectValue placeholder="Period" />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="7">Last 7 days</SelectItem>
                                <SelectItem value="30">Last 30 days</SelectItem>
                                <SelectItem value="365">This Year</SelectItem>
                            </SelectContent>
                        </Select>
                    )}
                </div>
            </div>

            {loading ? (
                <div className="space-y-4">
                    <Skeleton className="h-[400px] w-full rounded-xl" />
                    <div className="grid grid-cols-2 gap-4">
                        <Skeleton className="h-[120px] rounded-xl" />
                        <Skeleton className="h-[120px] rounded-xl" />
                        <Skeleton className="h-[120px] rounded-xl" />
                        <Skeleton className="h-[120px] rounded-xl" />
                    </div>
                </div>
            ) : (
                <Tabs value={view} className="w-full">
                    <TabsContent value="workout" className="mt-0 space-y-6 focus-visible:outline-none">
                        {stats?.current ? (
                            <>
                                <ActivityBarChart data={stats.current.activityTimeline} />
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
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
                            <div className="text-center py-20 bg-card rounded-2xl border border-dashed border-primary/20 text-muted-foreground">
                                <Dumbbell className="w-12 h-12 mx-auto mb-4 opacity-20" />
                                <p className="text-lg font-medium">No workout data available yet.</p>
                                <p className="text-sm">Start a workout to see your progress!</p>
                            </div>
                        )}
                    </TabsContent>

                    <TabsContent value="food" className="mt-0 space-y-6 focus-visible:outline-none">
                        {dailyNutrition?.targets ? (
                            <>
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 items-start">
                                    <Card className="border-primary/20 bg-primary/5 shadow-xl shadow-primary/5 border-2 rounded-2xl overflow-hidden">
                                        <CardHeader className="pb-2 border-b border-primary/10">
                                            <div className="flex items-center justify-between">
                                                <CardTitle className="text-lg font-bold flex items-center gap-2">
                                                    <Zap className="h-5 w-5 text-primary animate-pulse" />
                                                    Daily Target
                                                </CardTitle>
                                                <CardDescription className="text-[10px] uppercase font-black tracking-widest text-primary/70 bg-primary/10 px-2 py-0.5 rounded">Optimal</CardDescription>
                                            </div>
                                        </CardHeader>
                                        <CardContent className="text-center py-8">
                                            <div className="mb-6">
                                                <span className="text-5xl font-black text-primary tracking-tighter">
                                                    {Math.round(dailyNutrition.targets.targetCalories)}
                                                </span>
                                                <span className="text-xs font-black text-muted-foreground block uppercase mt-2 tracking-widest">Calories Per Day</span>
                                            </div>

                                            <div className="grid grid-cols-3 gap-4 p-4 bg-background/50 rounded-xl border border-primary/5">
                                                <div className="space-y-1">
                                                    <p className="text-[10px] font-black text-muted-foreground uppercase tracking-wider">Protein</p>
                                                    <p className="text-lg font-black text-orange-500">{Math.round(dailyNutrition.targets.targetProtein)}g</p>
                                                </div>
                                                <div className="space-y-1 border-x border-primary/10">
                                                    <p className="text-[10px] font-black text-muted-foreground uppercase tracking-wider">Carbs</p>
                                                    <p className="text-lg font-black text-blue-500">{Math.round(dailyNutrition.targets.targetCarbs)}g</p>
                                                </div>
                                                <div className="space-y-1">
                                                    <p className="text-[10px] font-black text-muted-foreground uppercase tracking-wider">Fat</p>
                                                    <p className="text-lg font-black text-yellow-500">{Math.round(dailyNutrition.targets.targetFat)}g</p>
                                                </div>
                                            </div>
                                        </CardContent>
                                    </Card>

                                    <div className="space-y-4">
                                        <h3 className="text-xl font-black tracking-tight">Today's Progress</h3>
                                        <MacroProgressBars
                                            totals={dailyNutrition.totals || { calories: 0, protein: 0, carbs: 0, fat: 0, fiber: 0 }}
                                            targets={dailyNutrition.targets}
                                        />
                                    </div>
                                </div>

                                <FoodAnalyticsBarChart
                                    data={foodStats?.timeline || []}
                                    targets={dailyNutrition?.targets || foodStats?.targets}
                                    period={period}
                                    onPeriodChange={setPeriod}
                                />
                            </>
                        ) : (
                            <div className="text-center py-20 bg-card rounded-2xl border border-dashed border-primary/20 text-muted-foreground">
                                <Utensils className="w-12 h-12 mx-auto mb-4 opacity-20" />
                                <p className="text-lg font-medium">No food data available yet.</p>
                                <p className="text-sm">Log your meals to track your nutrition!</p>
                            </div>
                        )}
                    </TabsContent>
                </Tabs>
            )}
        </div>
    );
}
