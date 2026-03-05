'use client';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';

interface MacroProgressBarsProps {
    totals: {
        calories: number;
        protein: number;
        carbs: number;
        fat: number;
        fiber: number;
    };
    targets: {
        targetCalories: number;
        targetProtein: number;
        targetCarbs: number;
        targetFat: number;
    };
}

export default function MacroProgressBars({ totals, targets }: MacroProgressBarsProps) {
    if (!totals || !targets) return null;

    return (
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
                    <Progress value={Math.min((totals.calories / targets.targetCalories) * 100, 100)} className="h-2" />
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
    );
}
