'use client';

import { useState, useEffect } from 'react';
import axios from '@/lib/axios';
import { useCacheStore } from '@/store/useCacheStore';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Skeleton } from '@/components/ui/skeleton';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion';
import { toast } from 'sonner';
import { Utensils, Zap, Plus, Loader2 } from 'lucide-react';
import Link from 'next/link';

const CACHE_KEY = 'nutrition/daily';

export default function NutritionPage() {
    const { getCache, setCache, invalidate } = useCacheStore();
    const cached = getCache(CACHE_KEY);
    const [loading, setLoading] = useState(!cached);
    const [mealText, setMealText] = useState('');
    const [mealType, setMealType] = useState('Breakfast');
    const [mealTime, setMealTime] = useState('');
    const [logging, setLogging] = useState(false);
    const [dailyStats, setDailyStats] = useState<any>(cached ?? null);

    const fetchDaily = async () => {
        try {
            const { data } = await axios.get('/nutrition/daily');
            setDailyStats(data);
            setCache(CACHE_KEY, data);
        } catch (error) {
            console.error('Failed to fetch nutrition data');
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        if (!cached) {
            fetchDaily();
        }
    }, [cached]);

    const handleLogMeal = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!mealText) return;

        setLogging(true);
        try {
            await axios.post('/nutrition/meals', {
                text: mealText,
                mealType,
                time: mealTime
            });
            setMealText('');
            setMealTime('');
            toast.success('Meal logged successfully!');
            invalidate(CACHE_KEY);
            fetchDaily();
        } catch (error: any) {
            toast.error(error.response?.data?.message || 'Failed to log meal');
        } finally {
            setLogging(false);
        }
    };

    // --- Loading Skeleton ---
    if (loading) {
        return (
            <div className="space-y-6">
                <Skeleton className="h-8 w-48" />
                {/* Meal logger skeleton */}
                <Card className="border-primary/20 bg-primary/5">
                    <CardHeader><Skeleton className="h-6 w-36" /></CardHeader>
                    <CardContent className="space-y-4">
                        <div className="grid grid-cols-2 gap-4">
                            <Skeleton className="h-9 w-full" />
                            <Skeleton className="h-9 w-full" />
                        </div>
                        <Skeleton className="h-9 w-full" />
                        <Skeleton className="h-10 w-full" />
                    </CardContent>
                </Card>
                {/* Meals skeleton */}
                <div className="space-y-3">
                    <Skeleton className="h-6 w-32" />
                    <Skeleton className="h-16 w-full rounded" />
                    <Skeleton className="h-16 w-full rounded" />
                    <Skeleton className="h-16 w-full rounded" />
                </div>
            </div>
        );
    }

    const { totals = {}, targets = {} } = dailyStats || {};

    // Group meals by mealType
    const mealTypesList = ['Breakfast', 'Lunch', 'Dinner', 'Snack'];
    const groupedMeals: Record<string, any[]> = {};
    mealTypesList.forEach(type => { groupedMeals[type] = []; });
    dailyStats?.meals?.forEach((meal: any) => {
        if (groupedMeals[meal.mealType]) {
            groupedMeals[meal.mealType].push(meal);
        } else {
            groupedMeals[meal.mealType] = [meal];
        }
    });
    // Filter to only types that have meals
    const activeMealTypes = mealTypesList.filter(type => groupedMeals[type].length > 0);

    return (
        <div className="space-y-6">
            <h2 className="text-2xl font-bold">Nutrition Tracker</h2>

            {/* AI Meal Logger */}
            <Card className="border-primary/20 bg-primary/5">
                <CardHeader>
                    <CardTitle className="flex items-center gap-2 text-primary">
                        <Zap className="h-5 w-5" />
                        AI Meal Logger
                    </CardTitle>
                </CardHeader>
                <CardContent>
                    <form onSubmit={handleLogMeal} className="space-y-4">
                        <div className="grid grid-cols-2 gap-4">
                            <div className="space-y-2">
                                <Label>Meal Type</Label>
                                <Select value={mealType} onValueChange={setMealType}>
                                    <SelectTrigger className="bg-background border-primary/20"><SelectValue /></SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="Breakfast">Breakfast</SelectItem>
                                        <SelectItem value="Lunch">Lunch</SelectItem>
                                        <SelectItem value="Dinner">Dinner</SelectItem>
                                        <SelectItem value="Snack">Snack</SelectItem>
                                    </SelectContent>
                                </Select>
                            </div>
                            <div className="space-y-2">
                                <Label>Time (Optional)</Label>
                                <Input
                                    type="time"
                                    className="bg-background border-primary/20"
                                    value={mealTime}
                                    onChange={e => setMealTime(e.target.value)}
                                />
                            </div>
                        </div>
                        <div className="space-y-2">
                            <Label>Description</Label>
                            <Input
                                placeholder="e.g., 2 boiled eggs and a slice of toast"
                                className="bg-background border-primary/20"
                                value={mealText}
                                onChange={e => setMealText(e.target.value)}
                                required
                            />
                        </div>
                        <Button type="submit" disabled={logging} className="w-full">
                            {logging ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : <Plus className="h-4 w-4 mr-2" />}
                            Log {mealType}
                        </Button>
                    </form>
                </CardContent>
            </Card>

            {/* Today's Meals — Accordion grouped by type */}
            <div className="space-y-4">
                <h3 className="font-semibold text-lg flex items-center gap-2">
                    <Utensils className="h-5 w-5 text-primary" />
                    Today's Meals
                </h3>
                {activeMealTypes.length === 0 ? (
                    <div className="text-center py-10 border-2 border-dashed border-muted rounded">
                        <p className="text-muted-foreground text-sm uppercase font-semibold">No meals logged yet today</p>
                    </div>
                ) : (
                    <Accordion type="multiple" defaultValue={activeMealTypes} className="space-y-2">
                        {activeMealTypes.map(type => {
                            const meals = groupedMeals[type];
                            const typeCalories = meals.reduce((sum: number, m: any) => sum + (m.calories || 0), 0);
                            return (
                                <AccordionItem key={type} value={type} className="border rounded-lg px-4 bg-card">
                                    <AccordionTrigger className="hover:no-underline">
                                        <div className="flex items-center gap-3">
                                            <span className="text-xs font-bold uppercase py-0.5 px-2 bg-primary/10 text-primary rounded-full">
                                                {type}
                                            </span>
                                            <span className="text-sm text-muted-foreground">
                                                {meals.length} {meals.length === 1 ? 'meal' : 'meals'} • {Math.round(typeCalories)} kcal
                                            </span>
                                        </div>
                                    </AccordionTrigger>
                                    <AccordionContent>
                                        <div className="space-y-2">
                                            {meals.map((meal: any) => (
                                                <Link
                                                    href={`/nutrition/${meal._id}`}
                                                    key={meal._id}
                                                    className="block"
                                                >
                                                    <Card className="hover:border-primary/50 transition-colors">
                                                        <CardContent className="p-4 flex justify-between items-center">
                                                            <div>
                                                                <div className="flex items-center gap-2 mb-0.5">
                                                                    {meal.time && <span className="text-[10px] text-muted-foreground">{meal.time}</span>}
                                                                </div>
                                                                <p className="font-semibold">{meal.name}</p>
                                                                <p className="text-[10px] uppercase font-bold text-muted-foreground tracking-widest">
                                                                    {Math.round(meal.protein)}P • {Math.round(meal.carbs)}C • {Math.round(meal.fat)}F
                                                                </p>
                                                            </div>
                                                            <div className="text-right">
                                                                <span className="text-xl font-black">{Math.round(meal.calories)}</span>
                                                                <span className="text-[10px] font-bold text-muted-foreground block uppercase">kcal</span>
                                                            </div>
                                                        </CardContent>
                                                    </Card>
                                                </Link>
                                            ))}
                                        </div>
                                    </AccordionContent>
                                </AccordionItem>
                            );
                        })}
                    </Accordion>
                )}
            </div>
        </div>
    );
}
