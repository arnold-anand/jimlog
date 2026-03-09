'use client';

import { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import axios from '@/lib/axios';
import { useAuthStore } from '@/store/useAuthStore';
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogHeader,
    DialogTitle,
    DialogFooter,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/components/ui/select';
import { toast } from 'sonner';
import { Scale, Ruler, Activity, Target, Zap, User } from 'lucide-react';

const profileSchema = z.object({
    age: z.coerce.number().min(13).max(120),
    gender: z.enum(['male', 'female']),
    height: z.coerce.number().min(50).max(300),
    weight: z.coerce.number().min(20).max(500),
    activityLevel: z.string(),
    goal: z.string(),
});

type ProfileFormValues = z.infer<typeof profileSchema>;

const ACTIVITY_MULTIPLIERS: Record<string, number> = {
    sedentary: 1.2,
    light: 1.375,
    moderate: 1.55,
    active: 1.725,
    very_active: 1.9,
};

interface PersonalStatsModalProps {
    isOpen: boolean;
    onClose: () => void;
}

export default function PersonalStatsModal({ isOpen, onClose }: PersonalStatsModalProps) {
    const { user, setAuth } = useAuthStore();
    const [loading, setLoading] = useState(false);
    const [calculatedStats, setCalculatedStats] = useState<{
        calories: number;
        protein: number;
        carbs: number;
        fat: number;
    } | null>(null);

    const form = useForm<ProfileFormValues>({
        resolver: zodResolver(profileSchema) as any,
        defaultValues: {
            age: 25,
            gender: 'male',
            height: 170,
            weight: 70,
            activityLevel: 'sedentary',
            goal: 'maintain',
        },
    });

    const { weight, height, age, gender, activityLevel, goal } = form.watch();

    // Recalculate macros when inputs change
    useEffect(() => {

        if (weight && height && age) {
            // Mifflin-St Jeor Formula
            let bmr = (10 * weight) + (6.25 * height) - (5 * age);
            bmr = gender === 'male' ? bmr + 5 : bmr - 161;

            const tdee = bmr * (ACTIVITY_MULTIPLIERS[activityLevel] || 1.2);

            let targetCalories = tdee;
            if (goal === 'weight_loss') targetCalories -= 500;
            if (goal === 'extreme_loss') targetCalories -= 1000;
            if (goal === 'weight_gain') targetCalories += 500;

            const proteinPerKg: Record<string, number> = {
                weight_loss: 1.8,
                mild_weight_loss: 1.6,
                maintain: 1.4,
                muscle_gain: 1.8,
                body_recomposition: 2.0,
                extreme_loss: 1.8,
            };

            const multiplier = proteinPerKg[goal] ?? 1.4;
            const protein = Math.round(weight * multiplier);
            const fat = Math.round((targetCalories * 0.25) / 9);
            const carbs = Math.round((targetCalories - protein * 4 - fat * 9) / 4);

            setCalculatedStats({
                calories: Math.round(targetCalories),
                protein,
                carbs,
                fat
            });
        }
    }, [weight, height, age, gender, activityLevel, goal, form.setValue]);

    async function onSubmit(values: ProfileFormValues) {
        if (!calculatedStats) return;
        setLoading(true);
        try {
            const profileData = {
                name: user?.name,
                nutritionProfile: {
                    ...values,
                    targetCalories: calculatedStats.calories,
                    targetProtein: calculatedStats.protein,
                    targetCarbs: calculatedStats.carbs,
                    targetFat: calculatedStats.fat,
                }
            };

            const { data } = await axios.put('/auth/profile', profileData);
            setAuth(data, useAuthStore.getState().accessToken!);
            toast.success('Stats updated! Your targets are set.', { duration: 3000 });
            onClose();
        } catch (error: any) {
            toast.error(error.response?.data?.message || 'Failed to save stats', { duration: 3000 });
        } finally {
            setLoading(false);
        }
    }

    return (
        <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
            <DialogContent className="sm:max-w-[500px] border-primary/20 bg-card/95 backdrop-blur-xl max-h-[90vh] overflow-y-auto">
                <DialogHeader>
                    <DialogTitle className="text-2xl font-black flex items-center gap-2">
                        <Activity className="h-6 w-6 text-primary" />
                        Set Your Personal Stats
                    </DialogTitle>
                    <DialogDescription className="font-medium text-muted-foreground">
                        We need a few details to calculate your daily calorie and macro targets.
                    </DialogDescription>
                </DialogHeader>

                <div className="grid grid-cols-2 gap-4 py-4">
                    <div className="space-y-2">
                        <Label className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-muted-foreground">
                            <Scale className="h-3 w-3" /> Gender
                        </Label>
                        <Select value={form.watch('gender')} onValueChange={(val: 'male' | 'female') => form.setValue('gender', val)}>
                            <SelectTrigger className="bg-background border-primary/10 h-11"><SelectValue /></SelectTrigger>
                            <SelectContent>
                                <SelectItem value="male">Male</SelectItem>
                                <SelectItem value="female">Female</SelectItem>
                            </SelectContent>
                        </Select>
                    </div>
                    <div className="space-y-2">
                        <Label className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-muted-foreground">
                            <Zap className="h-3 w-3" /> Age
                        </Label>
                        <Input type="number" {...form.register('age')} className="bg-background border-primary/10 h-11" />
                    </div>
                    <div className="space-y-2">
                        <Label className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-muted-foreground">
                            <Scale className="h-3 w-3" /> Weight (kg)
                        </Label>
                        <Input type="number" step="0.1" {...form.register('weight')} className="bg-background border-primary/10 h-11" />
                    </div>
                    <div className="space-y-2">
                        <Label className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-muted-foreground">
                            <Ruler className="h-3 w-3" /> Height (cm)
                        </Label>
                        <Input type="number" {...form.register('height')} className="bg-background border-primary/10 h-11" />
                    </div>
                    <div className="col-span-2 space-y-2">
                        <Label className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-muted-foreground">
                            <Activity className="h-3 w-3" /> Activity Level
                        </Label>
                        <Select value={form.watch('activityLevel')} onValueChange={(val) => form.setValue('activityLevel', val)}>
                            <SelectTrigger className="bg-background border-primary/10 h-11"><SelectValue /></SelectTrigger>
                            <SelectContent>
                                <SelectItem value="sedentary">Sedentary (Office job)</SelectItem>
                                <SelectItem value="light">Lightly Active (1-2 days/week)</SelectItem>
                                <SelectItem value="moderate">Moderately Active (3-5 days/week)</SelectItem>
                                <SelectItem value="active">Very Active (6-7 days/week)</SelectItem>
                                <SelectItem value="very_active">Extra Active (Athletic/Physical job)</SelectItem>
                            </SelectContent>
                        </Select>
                    </div>
                    <div className="col-span-2 space-y-2">
                        <Label className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-muted-foreground">
                            <Target className="h-3 w-3" /> Your Goal
                        </Label>
                        <Select value={form.watch('goal')} onValueChange={(val) => form.setValue('goal', val)}>
                            <SelectTrigger className="bg-background border-primary/10 h-11"><SelectValue /></SelectTrigger>
                            <SelectContent>
                                <SelectItem value="extreme_loss">Extreme Weight Loss</SelectItem>
                                <SelectItem value="weight_loss">Weight Loss</SelectItem>
                                <SelectItem value="maintain">Maintain Weight</SelectItem>
                                <SelectItem value="weight_gain">Weight Gain</SelectItem>
                            </SelectContent>
                        </Select>
                    </div>
                </div>

                {calculatedStats && (
                    <div className="bg-primary/5 rounded-2xl p-5 border border-primary/10 space-y-4 animate-in fade-in slide-in-from-bottom-2">
                        <div className="text-center">
                            <p className="text-xs font-black uppercase tracking-widest text-primary/70 mb-1">Estimated Daily Target</p>
                            <div className="flex items-baseline justify-center gap-1">
                                <span className="text-4xl font-black text-primary">{calculatedStats.calories}</span>
                                <span className="text-sm font-bold text-muted-foreground tracking-tight">kcal</span>
                            </div>
                        </div>
                        <div className="grid grid-cols-3 gap-2 pt-2 border-t border-primary/5">
                            <div className="text-center">
                                <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-tighter">Protein</p>
                                <p className="text-sm font-black text-orange-500">{calculatedStats.protein}g</p>
                            </div>
                            <div className="text-center border-x border-primary/10">
                                <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-tighter">Carbs</p>
                                <p className="text-sm font-black text-blue-500">{calculatedStats.carbs}g</p>
                            </div>
                            <div className="text-center">
                                <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-tighter">Fat</p>
                                <p className="text-sm font-black text-yellow-500">{calculatedStats.fat}g</p>
                            </div>
                        </div>
                    </div>
                )}

                <DialogFooter className="pt-4">
                    <Button
                        onClick={form.handleSubmit(onSubmit)}
                        className="w-full h-12 text-lg font-black bg-primary text-primary-foreground hover:bg-primary/90 rounded-xl"
                        disabled={loading}
                    >
                        {loading ? 'Saving...' : 'Confirm & Set Targets'}
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}
