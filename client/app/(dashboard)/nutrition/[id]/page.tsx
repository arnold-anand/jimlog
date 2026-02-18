'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import axios from '@/lib/axios';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { ChevronLeft, Utensils, Zap } from 'lucide-react';
import { toast } from 'sonner';

export default function MealDetailPage() {
    const { id } = useParams();
    const router = useRouter();
    const [meal, setMeal] = useState<any>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchMeal = async () => {
            try {
                const { data } = await axios.get(`/nutrition/${id}`);
                setMeal(data);
            } catch (error: any) {
                toast.error('Failed to fetch meal details');
                router.push('/nutrition');
            } finally {
                setLoading(false);
            }
        };

        if (id) fetchMeal();
    }, [id, router]);

    if (loading) return (
        <div className="flex items-center justify-center min-h-[50vh]">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
        </div>
    );

    if (!meal) return null;

    return (
        <div className="space-y-6">
            <Button
                variant="ghost"
                className="pl-0 hover:bg-transparent text-muted-foreground"
                onClick={() => router.back()}
            >
                <ChevronLeft className="h-4 w-4 mr-1" />
                Back to Nutrition
            </Button>

            <div className="flex items-center justify-between">
                <div>
                    <div className="flex items-center gap-3 mb-1">
                        <span className="py-1 px-3 bg-primary/10 text-primary rounded-full text-xs uppercase font-bold tracking-wider">
                            {meal.mealType}
                        </span>
                        {meal.time && <span className="text-sm text-muted-foreground font-medium">{meal.time}</span>}
                    </div>
                    <h1 className="text-3xl font-black tracking-tight">{meal.name}</h1>
                </div>
                <div className="text-right">
                    <span className="text-4xl font-black text-primary">{Math.round(meal.calories)}</span>
                    <span className="text-xs font-bold text-muted-foreground block uppercase tracking-tighter">Total Calories</span>
                </div>
            </div>

            <Card className="bg-primary/5 border-primary/10">
                <CardHeader className="pb-2">
                    <CardTitle className="text-sm font-bold uppercase tracking-widest text-muted-foreground">Total Macros</CardTitle>
                </CardHeader>
                <CardContent className="grid grid-cols-4 gap-4">
                    <div className="text-center">
                        <p className="text-xl font-bold">{Math.round(meal.protein)}g</p>
                        <p className="text-[10px] font-bold text-muted-foreground uppercase">Protein</p>
                    </div>
                    <div className="text-center">
                        <p className="text-xl font-bold">{Math.round(meal.carbs)}g</p>
                        <p className="text-[10px] font-bold text-muted-foreground uppercase">Carbs</p>
                    </div>
                    <div className="text-center">
                        <p className="text-xl font-bold">{Math.round(meal.fat)}g</p>
                        <p className="text-[10px] font-bold text-muted-foreground uppercase">Fat</p>
                    </div>
                    <div className="text-center">
                        <p className="text-xl font-bold">{Math.round(meal.fiber || 0)}g</p>
                        <p className="text-[10px] font-bold text-muted-foreground uppercase">Fibre</p>
                    </div>
                </CardContent>
            </Card>

            <div className="space-y-6">
                <h2 className="text-xl font-bold flex items-center gap-2">
                    <Utensils className="h-5 w-5 text-primary" />
                    Itemized Breakdown
                </h2>
                <div className="space-y-8 pl-1">
                    {meal.items && meal.items.length > 0 ? (
                        meal.items.map((item: any, index: number) => (
                            <div key={index} className="space-y-2">
                                <h3 className="text-lg font-bold text-foreground flex items-baseline gap-2">
                                    {item.name}
                                    {item.amount && <span className="text-muted-foreground font-medium text-sm">– {item.amount}</span>}
                                </h3>
                                <ul className="space-y-1.5 pl-6 list-disc text-sm font-medium text-muted-foreground">
                                    <li>
                                        <span className="text-foreground">Calories:</span> ~{Math.round(item.calories)} kcal
                                    </li>
                                    <li>
                                        <span className="text-foreground">Protein:</span> ~{Math.round(item.protein)} g
                                    </li>
                                    <li>
                                        <span className="text-foreground">Carbs:</span> ~{Math.round(item.carbs)} g
                                    </li>
                                    <li>
                                        <span className="text-foreground">Fat:</span> ~{Math.round(item.fat)} g
                                    </li>
                                    {item.fiber !== undefined && item.fiber > 0 && (
                                        <li>
                                            <span className="text-foreground">Fibre:</span> ~{Math.round(item.fiber)} g
                                        </li>
                                    )}
                                </ul>
                            </div>
                        ))
                    ) : (
                        <div className="p-8 text-center text-muted-foreground bg-muted/10 rounded-xl border border-dashed">
                            No individual items found for this meal.
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}
