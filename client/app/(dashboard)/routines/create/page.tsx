'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import axios from '@/lib/axios';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent } from '@/components/ui/card';
import { Checkbox } from '@/components/ui/checkbox';
import { toast } from 'sonner';
import { Trash2, Plus, Save } from 'lucide-react';
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
} from "@/components/ui/dialog";

interface Exercise {
    _id: string;
    name: string;
    muscleGroups: string[];
    equipment: string;
}

interface RoutineExercise {
    exerciseId: string; // Changed to match backend expectation, but we need exercise details for UI
    name: string; // Helper for UI
    plannedSets: number;
}

export default function CreateRoutinePage() {
    const router = useRouter();
    const [name, setName] = useState('');
    const [exercises, setExercises] = useState<Exercise[]>([]); // Global exercises
    const [selectedExercises, setSelectedExercises] = useState<RoutineExercise[]>([]);
    const [loading, setLoading] = useState(false);
    const [open, setOpen] = useState(false);

    useEffect(() => {
        const fetchExercises = async () => {
            try {
                const { data } = await axios.get('/exercises');
                setExercises(data);
            } catch (error) {
            }
        };
        fetchExercises();
    }, []);

    const addExercise = (exercise: Exercise) => {
        if (selectedExercises.some((e) => e.exerciseId === exercise._id)) {
            return;
        }
        setSelectedExercises([
            ...selectedExercises,
            { exerciseId: exercise._id, name: exercise.name, plannedSets: 3 },
        ]);
        setOpen(false); // Close dialog
    };

    const removeExercise = (index: number) => {
        const newExercises = [...selectedExercises];
        newExercises.splice(index, 1);
        setSelectedExercises(newExercises);
    };

    const updateSets = (index: number, sets: string) => {
        const newExercises = [...selectedExercises];
        newExercises[index].plannedSets = parseInt(sets) || 0;
        setSelectedExercises(newExercises);
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!name) return;
        if (selectedExercises.length === 0) return;

        setLoading(true);
        try {
            const payload = {
                name,
                exercises: selectedExercises.map((e, index) => ({
                    exercise: e.exerciseId,
                    plannedSets: e.plannedSets,
                    orderIndex: index,
                })),
            };

            await axios.post('/routines', payload);
            router.push('/routines');
        } catch (error) {
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="max-w-2xl mx-auto space-y-6">
            <div className="flex items-center justify-between">
                <h2 className="text-2xl font-bold">Create Routine</h2>
            </div>

            <form onSubmit={handleSubmit} className="space-y-6">
                <div className="space-y-2">
                    <Label htmlFor="name">Routine Name</Label>
                    <Input
                        id="name"
                        placeholder="e.g., Push Day"
                        value={name}
                        onChange={(e) => setName(e.target.value)}
                    />
                </div>

                <div className="space-y-4">
                    <div className="flex items-center justify-between">
                        <Label>Exercises</Label>
                        <Dialog open={open} onOpenChange={setOpen}>
                            <DialogTrigger asChild>
                                <Button variant="outline" size="sm">
                                    <Plus className="h-4 w-4 mr-2" /> Add Exercise
                                </Button>
                            </DialogTrigger>
                            <DialogContent className="max-h-[80vh] overflow-y-auto">
                                <DialogHeader>
                                    <DialogTitle>Select Exercise</DialogTitle>
                                </DialogHeader>
                                <div className="grid gap-2">
                                    {exercises.map((ex) => (
                                        <div
                                            key={ex._id}
                                            className="flex items-center justify-between p-2 border rounded hover:bg-accent cursor-pointer"
                                            onClick={() => addExercise(ex)}
                                        >
                                            <div>
                                                <p className="font-medium text-foreground">{ex.name}</p>
                                                <p className="text-xs text-muted-foreground">{ex.muscleGroups.join(', ')}</p>
                                            </div>
                                            <Plus className="h-4 w-4 text-muted-foreground" />
                                        </div>
                                    ))}
                                </div>
                            </DialogContent>
                        </Dialog>
                    </div>

                    {selectedExercises.length === 0 ? (
                        <div className="text-center p-8 border border-dashed rounded text-muted-foreground">
                            No exercises added yet.
                        </div>
                    ) : (
                        <div className="space-y-2">
                            {selectedExercises.map((ex, index) => (
                                <Card key={index}>
                                    <CardContent className="p-4 flex items-center justify-between gap-4">
                                        <div className="flex-1">
                                            <p className="font-medium">{ex.name}</p>
                                        </div>
                                        <div className="flex items-center gap-2">
                                            <Label className="text-xs">Sets</Label>
                                            <Input
                                                type="number"
                                                className="w-16 h-8"
                                                value={ex.plannedSets}
                                                onChange={(e) => updateSets(index, e.target.value)}
                                            />
                                        </div>
                                        <Button
                                            variant="ghost"
                                            size="icon"
                                            type="button"
                                            onClick={() => removeExercise(index)}
                                            className="text-destructive hover:text-destructive hover:bg-destructive/10"
                                        >
                                            <Trash2 className="h-4 w-4" />
                                        </Button>
                                    </CardContent>
                                </Card>
                            ))}
                        </div>
                    )}
                </div>

                <Button type="submit" className="w-full" disabled={loading}>
                    {loading ? 'Creating...' : 'Save Routine'}
                </Button>
            </form>
        </div>
    );
}
