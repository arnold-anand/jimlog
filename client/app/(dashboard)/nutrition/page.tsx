'use client';

import { useState, useEffect } from 'react';
import axios from '@/lib/axios';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { toast } from 'sonner';
import { Utensils, Zap, Plus, Loader2 } from 'lucide-react';
import { Progress } from '@/components/ui/progress';
import Link from 'next/link';

export default function NutritionPage() {
    const [profile, setProfile] = useState<any>(null);
    const [loading, setLoading] = useState(true);
    const [mealText, setMealText] = useState('');
    const [mealType, setMealType] = useState('Breakfast');
    const [mealTime, setMealTime] = useState('');
    const [logging, setLogging] = useState(false);
    const [dailyStats, setDailyStats] = useState<any>(null);

    // Profile Form State
    const [formData, setFormData] = useState({
        age: '',
        gender: 'male',
        height: '',
        weight: '',
        activityLevel: 'sedentary',
        goal: 'maintain',
    });

    const fetchDaily = async () => {
        try {
            const { data } = await axios.get('/nutrition/daily');
            setDailyStats(data);
            if (data.targets && data.targets.targetCalories) {
                setProfile(data.targets);
            }
        } catch (error) {
            console.error('Failed to fetch nutrition data');
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchDaily();
    }, []);

    const handleProfileSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        try {
            const { data } = await axios.post('/nutrition/profile', {
                ...formData,
                age: Number(formData.age),
                height: Number(formData.height),
                weight: Number(formData.weight),
            });
            setProfile(data.nutritionProfile);
            fetchDaily(); // Refresh targets
        } catch (error: any) {
            toast.error(error.response?.data?.message || 'Failed to save profile');
        }
    };

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
            fetchDaily();
        } catch (error: any) {
            toast.error(error.response?.data?.message || 'Failed to log meal');
        } finally {
            setLogging(false);
        }
    };

    if (loading) return <div>Loading...</div>;

    if (!profile) {
        return (
            <div className="max-w-md mx-auto space-y-6">
                <div className="text-center">
                    <h2 className="text-2xl font-bold">Setup Nutrition Profile</h2>
                    <p className="text-gray-500">Let's calculate your calorie needs.</p>
                </div>
                <Card>
                    <CardContent className="pt-6">
                        <form onSubmit={handleProfileSubmit} className="space-y-4">
                            <div className="grid grid-cols-2 gap-4">
                                <div className="space-y-2">
                                    <Label>Age</Label>
                                    <Input type="number" required value={formData.age} onChange={e => setFormData({ ...formData, age: e.target.value })} />
                                </div>
                                <div className="space-y-2">
                                    <Label>Gender</Label>
                                    <Select value={formData.gender} onValueChange={v => setFormData({ ...formData, gender: v })}>
                                        <SelectTrigger><SelectValue /></SelectTrigger>
                                        <SelectContent>
                                            <SelectItem value="male">Male</SelectItem>
                                            <SelectItem value="female">Female</SelectItem>
                                        </SelectContent>
                                    </Select>
                                </div>
                            </div>
                            <div className="grid grid-cols-2 gap-4">
                                <div className="space-y-2">
                                    <Label>Height (cm)</Label>
                                    <Input type="number" required value={formData.height} onChange={e => setFormData({ ...formData, height: e.target.value })} />
                                </div>
                                <div className="space-y-2">
                                    <Label>Weight (kg)</Label>
                                    <Input type="number" required value={formData.weight} onChange={e => setFormData({ ...formData, weight: e.target.value })} />
                                </div>
                            </div>
                            <div className="space-y-2">
                                <Label>Activity Level</Label>
                                <Select value={formData.activityLevel} onValueChange={v => setFormData({ ...formData, activityLevel: v })}>
                                    <SelectTrigger><SelectValue /></SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="sedentary">Sedentary</SelectItem>
                                        <SelectItem value="lightly_active">Lightly Active</SelectItem>
                                        <SelectItem value="moderately_active">Moderately Active</SelectItem>
                                        <SelectItem value="very_active">Very Active</SelectItem>
                                        <SelectItem value="super_active">Super Active</SelectItem>
                                    </SelectContent>
                                </Select>
                            </div>
                            <div className="space-y-2">
                                <Label>Goal</Label>
                                <Select value={formData.goal} onValueChange={v => setFormData({ ...formData, goal: v })}>
                                    <SelectTrigger><SelectValue /></SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="maintain">Maintain Weight</SelectItem>
                                        <SelectItem value="mild_weight_loss">Mild Weight Loss</SelectItem>
                                        <SelectItem value="weight_loss">Weight Loss</SelectItem>
                                        <SelectItem value="muscle_gain">Muscle Gain</SelectItem>
                                    </SelectContent>
                                </Select>
                            </div>
                            <Button type="submit" className="w-full">Calculate & Save</Button>
                        </form>
                    </CardContent>
                </Card>
            </div>
        );
    }

    const { totals, targets } = dailyStats || { totals: {}, targets: {} };
    const calProgress = Math.min((totals.calories / targets.targetCalories) * 100, 100);

    return (
        <div className="space-y-6">
            <h2 className="text-2xl font-bold">Nutrition Tracker</h2>

            <div className="grid gap-4 md:grid-cols-2">
                <Card>
                    <CardHeader className="pb-2">
                        <CardTitle className="text-sm font-medium text-muted-foreground uppercase tracking-wider">Calories</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="flex justify-between items-end mb-2">
                            <span className="text-3xl font-bold">{Math.round(totals.calories)}</span>
                            <span className="text-sm text-muted-foreground">/ {Math.round(targets.targetCalories)} kcal</span>
                        </div>
                        <Progress value={calProgress} className="h-2" />
                    </CardContent>
                </Card>

                <Card>
                    <CardHeader className="pb-2">
                        <CardTitle className="text-sm font-medium text-muted-foreground uppercase tracking-wider">Macros</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-3">
                        <div className="space-y-1">
                            <div className="flex justify-between text-xs font-semibold uppercase tracking-tight">
                                <span>Protein</span>
                                <span>{Math.round(totals.protein)} / {Math.round(targets.targetProtein)}g</span>
                            </div>
                            <Progress value={Math.min((totals.protein / targets.targetProtein) * 100, 100)} className="h-1.5" />
                        </div>

                        <div className="space-y-1">
                            <div className="flex justify-between text-xs font-semibold uppercase tracking-tight">
                                <span>Carbs</span>
                                <span>{Math.round(totals.carbs)} / {Math.round(targets.targetCarbs)}g</span>
                            </div>
                            <Progress value={Math.min((totals.carbs / targets.targetCarbs) * 100, 100)} className="h-1.5" />
                        </div>

                        <div className="space-y-1">
                            <div className="flex justify-between text-xs font-semibold uppercase tracking-tight">
                                <span>Fat</span>
                                <span>{Math.round(totals.fat)} / {Math.round(targets.targetFat)}g</span>
                            </div>
                            <Progress value={Math.min((totals.fat / targets.targetFat) * 100, 100)} className="h-1.5" />
                        </div>

                        <div className="space-y-1">
                            <div className="flex justify-between text-xs font-semibold uppercase tracking-tight">
                                <span>Fiber</span>
                                <span>{Math.round(totals.fiber)}g</span>
                            </div>
                            <Progress value={Math.min((totals.fiber / 30) * 100, 100)} className="h-1.5" />
                        </div>
                    </CardContent>
                </Card>
            </div>

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

            <div className="space-y-4">
                <h3 className="font-semibold text-lg flex items-center gap-2">
                    <Utensils className="h-5 w-5 text-primary" />
                    Today's Meals
                </h3>
                {dailyStats?.meals?.length === 0 ? (
                    <div className="text-center py-10 border-2 border-dashed border-muted rounded">
                        <p className="text-muted-foreground text-sm uppercase font-semibold">No meals logged yet today</p>
                    </div>
                ) : (
                    <div className="space-y-3">
                        {dailyStats?.meals?.map((meal: any) => (
                            <Link
                                href={`/nutrition/${meal._id}`}
                                key={meal._id}
                                className="block"
                            >
                                <Card className="hover:border-primary/50 transition-colors">
                                    <CardContent className="p-4 flex justify-between items-center">
                                        <div>
                                            <div className="flex items-center gap-2 mb-0.5">
                                                <span className="text-xs font-bold uppercase py-0.5 px-2 bg-primary/10 text-primary rounded-full">
                                                    {meal.mealType}
                                                </span>
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
                )}
            </div>
        </div>
    );
}
