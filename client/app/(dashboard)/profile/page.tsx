'use client';

import { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import axios from '@/lib/axios';
import { useAuthStore } from '@/store/useAuthStore';
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
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { toast } from 'sonner';
import { User, Scale, Ruler, Activity, Target, Zap, Save, Edit2, X } from 'lucide-react';

const profileSchema = z.object({
    name: z.string().min(2, "Name must be at least 2 characters"),
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

export default function ProfilePage() {
    const { user, setAuth } = useAuthStore();
    const [isEditing, setIsEditing] = useState(false);
    const [loading, setLoading] = useState(false);
    const [calculatedCalories, setCalculatedCalories] = useState<number | null>(null);

    const form = useForm<ProfileFormValues>({
        resolver: zodResolver(profileSchema) as any,
        defaultValues: {
            name: user?.name || '',
            age: (user?.nutritionProfile?.age as number) || 25,
            gender: (user?.nutritionProfile?.gender as 'male' | 'female') || 'male',
            height: (user?.nutritionProfile?.height as number) || 170,
            weight: (user?.nutritionProfile?.weight as number) || 70,
            activityLevel: user?.nutritionProfile?.activityLevel || 'sedentary',
            goal: user?.nutritionProfile?.goal || 'maintain',
        },
    });

    const watchAllFields = form.watch();

    // Recalculate calories when inputs change
    useEffect(() => {
        const { weight, height, age, gender, activityLevel, goal } = watchAllFields;

        if (weight && height && age) {
            // Mifflin-St Jeor Formula
            let bmr = (10 * weight) + (6.25 * height) - (5 * age);
            bmr = gender === 'male' ? bmr + 5 : bmr - 161;

            const tdee = bmr * (ACTIVITY_MULTIPLIERS[activityLevel] || 1.2);

            let target = tdee;
            if (goal === 'weight_loss') target -= 500;
            if (goal === 'extreme_loss') target -= 1000;
            if (goal === 'weight_gain') target += 500;

            setCalculatedCalories(Math.round(target));
        }
    }, [watchAllFields]);

    async function onSubmit(values: ProfileFormValues) {
        setLoading(true);
        try {
            const proteinPerKg: Record<string, number> = {
                weight_loss: 1.8,
                mild_weight_loss: 1.6,
                maintain: 1.4,
                muscle_gain: 1.8,
                body_recomposition: 2.0,
            };
            const multiplier = proteinPerKg[values.goal] ?? 1.4;
            const targetProtein = Math.round(values.weight * multiplier);
            const targetFat = Math.round((calculatedCalories! * 0.25) / 9);
            const targetCarbs = Math.round((calculatedCalories! - targetProtein * 4 - targetFat * 9) / 4);

            const profileData = {
                name: values.name,
                nutritionProfile: {
                    ...values,
                    targetCalories: calculatedCalories,
                    targetProtein,
                    targetCarbs,
                    targetFat,
                }
            };

            const { data } = await axios.put('/auth/profile', profileData);
            setAuth(data, useAuthStore.getState().accessToken!);
            setIsEditing(false);
            toast.success('Profile updated successfully!');
        } catch (error: any) {
            toast.error(error.response?.data?.message || 'Failed to update profile');
        } finally {
            setLoading(false);
        }
    }

    if (!user) return null;

    return (
        <div className="max-w-4xl mx-auto space-y-6 pb-20">
            <header className="flex justify-between items-center bg-card p-6 rounded-2xl border border-primary/10 shadow-sm">
                <div className="flex items-center gap-4">
                    <div className="h-16 w-16 rounded-full bg-primary/20 flex items-center justify-center text-primary border-2 border-primary/30">
                        <User className="h-8 w-8" />
                    </div>
                    <div>
                        <h1 className="text-2xl font-black text-foreground">{user.name || 'Anonymous'}</h1>
                        <p className="text-muted-foreground font-medium">{user.email}</p>
                    </div>
                </div>
                {!isEditing && (
                    <Button onClick={() => setIsEditing(true)} variant="ghost" size="icon" className="text-primary hover:bg-primary/5">
                        <Edit2 className="h-5 w-5" />
                    </Button>
                )}
            </header>

            <div className="max-w-2xl mx-auto">
                {/* Stats Card */}
                <Card className="border-primary/10 bg-card/50 backdrop-blur-sm">
                    <CardHeader>
                        <CardTitle className="text-xl font-bold flex items-center gap-2">
                            <Activity className="h-5 w-5 text-primary" />
                            Personal Stats
                        </CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-6">
                        <div className="grid grid-cols-2 gap-6">
                            <div className="space-y-2">
                                <Label className="flex items-center gap-2 text-muted-foreground">
                                    <User className="h-4 w-4" /> Name
                                </Label>
                                {isEditing ? (
                                    <Input {...form.register('name')} className="bg-background" />
                                ) : (
                                    <p className="text-lg font-bold">{user.name || 'Anonymous'}</p>
                                )}
                            </div>
                            <div className="space-y-2">
                                <Label className="flex items-center gap-2 text-muted-foreground">
                                    <Scale className="h-4 w-4" /> Gender
                                </Label>
                                {isEditing ? (
                                    <Select value={form.watch('gender')} onValueChange={(val: 'male' | 'female') => form.setValue('gender', val)}>
                                        <SelectTrigger className="bg-background"><SelectValue /></SelectTrigger>
                                        <SelectContent>
                                            <SelectItem value="male">Male</SelectItem>
                                            <SelectItem value="female">Female</SelectItem>
                                        </SelectContent>
                                    </Select>
                                ) : (
                                    <p className="text-lg font-bold capitalize">{user.nutritionProfile?.gender || '—'}</p>
                                )}
                            </div>
                            <div className="space-y-2">
                                <Label className="flex items-center gap-2 text-muted-foreground">
                                    <Zap className="h-4 w-4" /> Age
                                </Label>
                                {isEditing ? (
                                    <Input type="number" {...form.register('age')} className="bg-background" />
                                ) : (
                                    <p className="text-lg font-bold">{user.nutritionProfile?.age || '—'} years</p>
                                )}
                            </div>
                            <div className="space-y-2">
                                <Label className="flex items-center gap-2 text-muted-foreground">
                                    <Scale className="h-4 w-4" /> Weight (kg)
                                </Label>
                                {isEditing ? (
                                    <Input type="number" step="0.1" {...form.register('weight')} className="bg-background" />
                                ) : (
                                    <p className="text-lg font-bold">{user.nutritionProfile?.weight || '—'} kg</p>
                                )}
                            </div>
                            <div className="space-y-2">
                                <Label className="flex items-center gap-2 text-muted-foreground">
                                    <Ruler className="h-4 w-4" /> Height (cm)
                                </Label>
                                {isEditing ? (
                                    <Input type="number" {...form.register('height')} className="bg-background" />
                                ) : (
                                    <p className="text-lg font-bold">{user.nutritionProfile?.height || '—'} cm</p>
                                )}
                            </div>
                            <div className="space-y-2">
                                <Label className="flex items-center gap-2 text-muted-foreground">
                                    <Activity className="h-4 w-4" /> Activity Level
                                </Label>
                                {isEditing ? (
                                    <Select value={form.watch('activityLevel')} onValueChange={(val) => form.setValue('activityLevel', val)}>
                                        <SelectTrigger className="bg-background"><SelectValue /></SelectTrigger>
                                        <SelectContent>
                                            <SelectItem value="sedentary">Sedentary (Office job)</SelectItem>
                                            <SelectItem value="light">Lightly Active</SelectItem>
                                            <SelectItem value="moderate">Moderately Active</SelectItem>
                                            <SelectItem value="active">Very Active</SelectItem>
                                            <SelectItem value="very_active">Extra Active</SelectItem>
                                        </SelectContent>
                                    </Select>
                                ) : (
                                    <p className="text-lg font-bold capitalize">{user.nutritionProfile?.activityLevel?.replace('_', ' ') || '—'}</p>
                                )}
                            </div>
                        </div>

                        <div className="space-y-2">
                            <Label className="flex items-center gap-2 text-muted-foreground">
                                <Target className="h-4 w-4" /> Goal
                            </Label>
                            {isEditing ? (
                                <Select value={form.watch('goal')} onValueChange={(val) => form.setValue('goal', val)}>
                                    <SelectTrigger className="bg-background"><SelectValue /></SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="extreme_loss">Extreme Weight Loss (-1000kcal)</SelectItem>
                                        <SelectItem value="weight_loss">Weight Loss (-500kcal)</SelectItem>
                                        <SelectItem value="maintain">Maintain Weight</SelectItem>
                                        <SelectItem value="weight_gain">Weight Gain (+500kcal)</SelectItem>
                                    </SelectContent>
                                </Select>
                            ) : (
                                <p className="text-lg font-bold capitalize">{user.nutritionProfile?.goal?.replace('_', ' ') || '—'}</p>
                            )}
                        </div>

                        {isEditing && (
                            <div className="flex justify-end gap-3 pt-4 border-t border-primary/10">
                                <Button onClick={() => setIsEditing(false)} variant="ghost" type="button" disabled={loading}>
                                    Cancel
                                </Button>
                                <Button onClick={form.handleSubmit(onSubmit)} className="gap-2 bg-primary text-primary-foreground hover:bg-primary/90" disabled={loading}>
                                    <Save className="h-4 w-4" /> {loading ? 'Saving...' : 'Save Changes'}
                                </Button>
                            </div>
                        )}
                    </CardContent>
                </Card>
            </div>
        </div>
    );
}
