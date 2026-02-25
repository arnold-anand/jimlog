'use client';

import { useState, useEffect } from 'react';
import { useRouter, useParams } from 'next/navigation';
import axios from '@/lib/axios';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent } from '@/components/ui/card';
import { Trash2, Plus, Save, Loader2 } from 'lucide-react';
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
    exerciseId: string;
    name: string;
    plannedSets: number;
    muscleGroups: string[];
    equipment: string;
}

export default function EditRoutinePage() {
    const router = useRouter();
    const params = useParams();
    const routineId = params.id as string;

    const [name, setName] = useState('');
    const [exercises, setExercises] = useState<Exercise[]>([]);
    const [selectedExercises, setSelectedExercises] = useState<RoutineExercise[]>([]);
    const [loading, setLoading] = useState(false);
    const [fetchingRoutine, setFetchingRoutine] = useState(true);
    const [open, setOpen] = useState(false);

    // Filtering states
    const [selectedMuscle, setSelectedMuscle] = useState<string>('');
    const [selectedEquipment, setSelectedEquipment] = useState<string>('');

    // Fetch routine data
    useEffect(() => {
        const fetchRoutineData = async () => {
            try {
                const { data: routineData } = await axios.get(`/routines/${routineId}`);
                setName(routineData.name);
                setSelectedExercises(
                    routineData.exercises
                        .filter((e: any) => e.exercise != null)
                        .map((e: any) => ({
                            exerciseId: e.exercise._id,
                            name: e.exercise.name,
                            plannedSets: e.plannedSets,
                            muscleGroups: e.exercise.muscleGroups || [],
                            equipment: e.exercise.equipment || '',
                        }))
                );
            } catch (error) {
                console.error('Failed to fetch data', error);
            } finally {
                setFetchingRoutine(false);
            }
        };
        fetchRoutineData();
    }, [routineId]);

    // Fetch exercises based on filters
    useEffect(() => {
        const fetchExercises = async () => {
            try {
                const params = new URLSearchParams();
                if (selectedMuscle) params.append('muscleGroup', selectedMuscle);
                if (selectedEquipment) params.append('equipment', selectedEquipment);

                const { data: exercisesData } = await axios.get(`/exercises?${params.toString()}`);
                setExercises(exercisesData);
            } catch (error) {
                console.error('Failed to fetch exercises', error);
            }
        };
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
        setOpen(false);
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

            await axios.put(`/routines/${routineId}`, payload);
            router.push('/routines');
        } catch (error) {
            console.error('Failed to update routine', error);
        } finally {
            setLoading(false);
        }
    };

    if (fetchingRoutine) {
        return (
            <div className="flex items-center justify-center min-h-screen">
                <Loader2 className="h-8 w-8 animate-spin text-primary" />
            </div>
        );
    }

    return (
        <div className="max-w-2xl mx-auto space-y-6">
            <div>
                <h2 className="text-2xl font-bold">Edit Routine</h2>
                <p className="text-muted-foreground">Update your workout routine</p>
            </div>

            <form onSubmit={handleSubmit} className="space-y-6">
                <div className="space-y-2">
                    <Label>Routine Name</Label>
                    <Input
                        placeholder="e.g., Push Day"
                        value={name}
                        onChange={(e) => setName(e.target.value)}
                        required
                    />
                </div>

                <div className="space-y-4">
                    <div className="flex justify-between items-center">
                        <Label>Exercises</Label>
                        <Dialog open={open} onOpenChange={setOpen}>
                            <DialogTrigger asChild>
                                <Button type="button" variant="outline" size="sm">
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
                                <div className="space-y-2 mt-2">
                                    {exercises.map((ex) => (
                                        <div
                                            key={ex._id}
                                            onClick={() => addExercise(ex)}
                                            className="flex items-center justify-between p-2 border rounded hover:bg-accent cursor-pointer"
                                        >
                                            <div>
                                                <p className="font-medium">{ex.name}</p>
                                                <p className="text-xs text-muted-foreground">{ex.muscleGroups.join(', ')}</p>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </DialogContent>
                        </Dialog>
                    </div>

                    {selectedExercises.length === 0 ? (
                        <p className="text-sm text-muted-foreground">No exercises added yet</p>
                    ) : (
                        <div className="space-y-2">
                            {selectedExercises.map((ex, index) => (
                                <Card key={index}>
                                    <CardContent className="p-4 flex items-center justify-between">
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
                                        <div className="flex items-center gap-4">
                                            <div className="flex items-center gap-2">
                                                <Label className="text-xs">Sets:</Label>
                                                <Input
                                                    type="number"
                                                    min="1"
                                                    value={ex.plannedSets}
                                                    onChange={(e) => updateSets(index, e.target.value)}
                                                    className="w-16 h-8"
                                                />
                                            </div>
                                            <Button
                                                type="button"
                                                variant="ghost"
                                                size="icon"
                                                onClick={() => removeExercise(index)}
                                                className="text-destructive hover:text-destructive hover:bg-destructive/10"
                                            >
                                                <Trash2 className="h-4 w-4" />
                                            </Button>
                                        </div>
                                    </CardContent>
                                </Card>
                            ))}
                        </div>
                    )}
                </div>

                <div className="flex gap-2">
                    <Button type="button" variant="outline" onClick={() => router.push('/routines')}>
                        Cancel
                    </Button>
                    <Button type="submit" disabled={loading} className="flex-1">
                        {loading ? (
                            <>
                                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                                Updating...
                            </>
                        ) : (
                            <>
                                <Save className="h-4 w-4 mr-2" />
                                Update Routine
                            </>
                        )}
                    </Button>
                </div>
            </form>
        </div>
    );
}
