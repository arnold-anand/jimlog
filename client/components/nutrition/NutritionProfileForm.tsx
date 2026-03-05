'use client';

import { useState, useEffect } from 'react';
import axios from '@/lib/axios';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { toast } from 'sonner';
import { Settings2 } from 'lucide-react';

interface NutritionProfileFormProps {
    initialData?: any;
    onSuccess: (profile: any) => void;
}

export default function NutritionProfileForm({ initialData, onSuccess }: NutritionProfileFormProps) {
    const [formData, setFormData] = useState({
        age: initialData?.age?.toString() || '',
        gender: initialData?.gender || 'male',
        height: initialData?.height?.toString() || '',
        weight: initialData?.weight?.toString() || '',
        activityLevel: initialData?.activityLevel || 'sedentary',
        goal: initialData?.goal || 'maintain',
    });

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        try {
            const { data } = await axios.post('/nutrition/profile', {
                ...formData,
                age: Number(formData.age),
                height: Number(formData.height),
                weight: Number(formData.weight),
            });
            toast.success('Nutrition profile updated!');
            onSuccess(data.nutritionProfile);
        } catch (error: any) {
            toast.error(error.response?.data?.message || 'Failed to save profile');
        }
    };

    return (
        <Card className="border-primary/20 bg-primary/5">
            <CardHeader className="pb-3">
                <CardTitle className="text-lg flex items-center gap-2">
                    <Settings2 className="h-5 w-5" />
                    Nutrition Profile & Goals
                </CardTitle>
            </CardHeader>
            <CardContent>
                <form onSubmit={handleSubmit} className="space-y-4">
                    <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-2">
                            <Label>Age</Label>
                            <Input
                                type="number"
                                required
                                value={formData.age}
                                onChange={e => setFormData({ ...formData, age: e.target.value })}
                                className="bg-background"
                            />
                        </div>
                        <div className="space-y-2">
                            <Label>Gender</Label>
                            <Select value={formData.gender} onValueChange={v => setFormData({ ...formData, gender: v })}>
                                <SelectTrigger className="bg-background"><SelectValue /></SelectTrigger>
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
                            <Input
                                type="number"
                                required
                                value={formData.height}
                                onChange={e => setFormData({ ...formData, height: e.target.value })}
                                className="bg-background"
                            />
                        </div>
                        <div className="space-y-2">
                            <Label>Weight (kg)</Label>
                            <Input
                                type="number"
                                required
                                value={formData.weight}
                                onChange={e => setFormData({ ...formData, weight: e.target.value })}
                                className="bg-background"
                            />
                        </div>
                    </div>
                    <div className="space-y-2">
                        <Label>Activity Level</Label>
                        <Select value={formData.activityLevel} onValueChange={v => setFormData({ ...formData, activityLevel: v })}>
                            <SelectTrigger className="bg-background"><SelectValue /></SelectTrigger>
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
                            <SelectTrigger className="bg-background"><SelectValue /></SelectTrigger>
                            <SelectContent>
                                <SelectItem value="maintain">Maintain Weight</SelectItem>
                                <SelectItem value="mild_weight_loss">Mild Weight Loss</SelectItem>
                                <SelectItem value="weight_loss">Weight Loss</SelectItem>
                                <SelectItem value="muscle_gain">Muscle Gain</SelectItem>
                                <SelectItem value="body_recomposition">Body Recomposition</SelectItem>
                            </SelectContent>
                        </Select>
                    </div>
                    <Button type="submit" className="w-full">Recalculate & Save Targets</Button>
                </form>
            </CardContent>
        </Card>
    );
}
