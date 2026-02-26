'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import axios from '@/lib/axios';
import { useCacheStore } from '@/store/useCacheStore';
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
    muscleGroups: string[];
    equipment: string;
}

export default function CreateRoutinePage() {
    const router = useRouter();
    const { invalidate } = useCacheStore();
    const [name, setName] = useState('');
    const [exercises, setExercises] = useState<Exercise[]>([]); // Global exercises
    const [selectedExercises, setSelectedExercises] = useState<RoutineExercise[]>([]);
    const [loading, setLoading] = useState(false);
    const [open, setOpen] = useState(false);

    // Filtering states
    const [selectedMuscle, setSelectedMuscle] = useState<string>('');
    const [selectedEquipment, setSelectedEquipment] = useState<string>('');

    // Fetch exercises function wrapping axios
    const fetchExercises = async () => {
        try {
            const params = new URLSearchParams();
            if (selectedMuscle) params.append('muscleGroup', selectedMuscle);
            if (selectedEquipment) params.append('equipment', selectedEquipment);

            const { data } = await axios.get(`/exercises?${params.toString()}`);
            setExercises(data);
        } catch (error) {
        }
    };

    useEffect(() => {
        fetchExercises();
    }, [selectedMuscle, selectedEquipment]);

    const addExercise = (exercise: Exercise) => {
        if (selectedExercises.some((e) => e.exerciseId === exercise._id)) {
            return;
        }
        setSelectedExercises([
            ...selectedExercises,
            {
                exerciseId: exercise._id,
                name: exercise.name,
                plannedSets: 3,
                muscleGroups: exercise.muscleGroups,
                equipment: exercise.equipment
            },
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
            invalidate('routines');
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
                                <div className="grid grid-cols-2 gap-2 mt-4">
                                    <div className="space-y-1">
                                        <Label className="text-xs text-muted-foreground">Muscle Group</Label>
                                        <select
                                            className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-sm transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:cursor-not-allowed disabled:opacity-50"
                                            value={selectedMuscle}
                                            onChange={(e) => setSelectedMuscle(e.target.value)}
                                        >
                                            <option value="">All Muscles</option>
                                            <option value="Abdominals">Abdominals</option>
                                            <option value="Biceps">Biceps</option>
                                            <option value="Calves">Calves</option>
                                            <option value="Cardio">Cardio</option>
                                            <option value="Chest">Chest</option>
                                            <option value="Core">Core</option>
                                            <option value="Forearms">Forearms</option>
                                            <option value="Full Body">Full Body</option>
                                            <option value="Glutes">Glutes</option>
                                            <option value="Hamstrings">Hamstrings</option>
                                            <option value="Lats">Lats</option>
                                            <option value="Lower Back">Lower Back</option>
                                            <option value="Neck">Neck</option>
                                            <option value="Obliques">Obliques</option>
                                            <option value="Quadriceps">Quadriceps</option>
                                            <option value="Shoulders">Shoulders</option>
                                            <option value="Traps">Traps</option>
                                            <option value="Triceps">Triceps</option>
                                            <option value="Upper Back">Upper Back</option>
                                        </select>
                                    </div>
                                    <div className="space-y-1">
                                        <Label className="text-xs text-muted-foreground">Equipment</Label>
                                        <select
                                            className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-sm transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:cursor-not-allowed disabled:opacity-50"
                                            value={selectedEquipment}
                                            onChange={(e) => setSelectedEquipment(e.target.value)}
                                        >
                                            <option value="">All Equipment</option>
                                            <option value="Ab Wheel">Ab Wheel</option>
                                            <option value="Band">Band</option>
                                            <option value="Barbell">Barbell</option>
                                            <option value="Bodyweight">Bodyweight</option>
                                            <option value="Box">Box</option>
                                            <option value="Cable">Cable</option>
                                            <option value="Dumbbell">Dumbbell</option>
                                            <option value="EZ Bar">EZ Bar</option>
                                            <option value="Kettlebell">Kettlebell</option>
                                            <option value="Machine">Machine</option>
                                            <option value="Medicine Ball">Medicine Ball</option>
                                            <option value="Plate">Plate</option>
                                            <option value="Rings">Rings</option>
                                            <option value="Rope">Rope</option>
                                            <option value="Suspension">Suspension</option>
                                            <option value="Trap Bar">Trap Bar</option>
                                            <option value="Weighted">Weighted</option>
                                        </select>
                                    </div>
                                </div>
                                <div className="grid gap-2 mt-2">
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
                                            <div className="flex gap-1 mt-1">
                                                {ex.muscleGroups?.includes('Cardio') && (
                                                    <span className="text-[10px] bg-blue-500/20 text-blue-400 px-1.5 py-0.5 rounded">Duration based</span>
                                                )}
                                                {ex.equipment === 'Bodyweight' && (
                                                    <span className="text-[10px] bg-green-500/20 text-green-400 px-1.5 py-0.5 rounded">Reps only</span>
                                                )}
                                            </div>
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
