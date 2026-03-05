'use client';

import { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { useWorkoutStore } from '@/store/useWorkoutStore';
import { useCacheStore } from '@/store/useCacheStore';
import axios from '@/lib/axios';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Checkbox } from '@/components/ui/checkbox';
import { Badge } from '@/components/ui/badge';
import { toast } from 'sonner';
import {
    Clock,
    Play,
    Pause,
    RotateCcw,
    Plus,
    Trash2,
    Check,
    Save,
    MoreHorizontal,
    ChevronUp,
    ChevronDown,
    Search
} from 'lucide-react';
import { cn } from '@/lib/utils';
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
} from "@/components/ui/dialog";

interface Set {
    weight?: number;
    reps?: number;
    time?: number;
    completed: boolean;
}

interface WorkoutExercise {
    exercise: {
        _id: string;
        name: string;
        muscleGroups: string[];
        equipment?: string;
    };
    sets: Set[];
}

export default function ActiveWorkout({ workoutId }: { workoutId: string }) {
    const router = useRouter();
    const { exercises, setStoreExercises, endWorkout: clearStore, startTime, setWorkoutData } = useWorkoutStore();
    const { invalidate, invalidateMatching } = useCacheStore();
    const [elapsedTime, setElapsedTime] = useState(0);
    const [loading, setLoading] = useState(false);
    const [workoutName, setWorkoutName] = useState('Workout');
    const [allExercises, setAllExercises] = useState<any[]>([]);
    const [open, setOpen] = useState(false);
    const [finishDialogOpen, setFinishDialogOpen] = useState(false);
    const [shortWorkoutWarning, setShortWorkoutWarning] = useState(false);

    // Filtering states
    const [selectedMuscle, setSelectedMuscle] = useState<string>('');
    const [selectedEquipment, setSelectedEquipment] = useState<string>('');
    const [searchTerm, setSearchTerm] = useState('');

    // Fetch exercises function
    const fetchGlobalExercises = async () => {
        try {
            const params = new URLSearchParams();
            if (selectedMuscle) params.append('muscleGroup', selectedMuscle);
            if (selectedEquipment) params.append('equipment', selectedEquipment);

            const { data } = await axios.get(`/exercises?${params.toString()}`);
            setAllExercises(data);
        } catch (error) {
            console.error('Failed to fetch exercises');
        }
    };

    useEffect(() => {
        // Fetch global exercises for the "Add Exercise" modal
        fetchGlobalExercises();
    }, [selectedMuscle, selectedEquipment]);

    useEffect(() => {
        // Fetch workout if store is empty or mismatches (handling page reload)
        const fetchWorkout = async () => {
            try {
                const { data } = await axios.get('/workouts/active');
                if (data && data._id === workoutId) {
                    setWorkoutName(data.name);

                    // Sync store if empty or missing critical data
                    if (exercises.length === 0 || !startTime) {
                        setWorkoutData({
                            activeWorkoutId: data._id,
                            workoutName: data.name,
                            startTime: new Date(data.startedAt).getTime(),
                            exercises: data.exercises
                                .filter((e: any) => e.exercise != null)
                                .map((e: any) => ({
                                    exercise: e.exercise,
                                    sets: e.sets.length > 0 ? e.sets : [{ weight: 1, reps: 1, completed: false }]
                                }))
                        });
                    }
                }
            } catch (error) {
                console.error('Error fetching active workout', error);
            }
        };
        fetchWorkout();

        // Robust timer: calculate based on absolute start time
        const updateTimer = () => {
            if (startTime) {
                const now = Date.now();
                setElapsedTime(Math.floor((now - startTime) / 1000));
            }
        };

        updateTimer();
        const intervalId = setInterval(updateTimer, 1000);

        return () => clearInterval(intervalId);
    }, [workoutId, exercises.length, setWorkoutData, startTime]);

    const formatTime = (seconds: number) => {
        const mins = Math.floor(seconds / 60);
        const secs = seconds % 60;
        return `${mins}:${secs.toString().padStart(2, '0')}`;
    };

    const addSet = (exerciseIndex: number) => {
        const newExercises = [...exercises];
        const lastSet = newExercises[exerciseIndex].sets[newExercises[exerciseIndex].sets.length - 1];
        newExercises[exerciseIndex].sets.push({
            weight: lastSet?.weight,
            reps: lastSet?.reps,
            time: (lastSet as any)?.time,
            completed: false,
        });
        setStoreExercises(newExercises);
    };

    const moveExercise = (index: number, direction: 'up' | 'down') => {
        const newExercises = [...exercises];
        const newIndex = direction === 'up' ? index - 1 : index + 1;
        if (newIndex < 0 || newIndex >= newExercises.length) return;

        [newExercises[index], newExercises[newIndex]] = [newExercises[newIndex], newExercises[index]];
        setStoreExercises(newExercises);
    };

    const addExerciseToWorkout = (exercise: any) => {
        if (exercises.some(e => e.exercise._id === exercise._id)) {
            return;
        }
        const newExercises = [...exercises, {
            exercise: exercise,
            sets: [{ weight: 1, reps: 1, completed: false }]
        }];
        setStoreExercises(newExercises);
        setOpen(false);
    };

    const updateSet = (exerciseIndex: number, setIndex: number, field: keyof Set, value: any) => {
        const newExercises = [...exercises];
        newExercises[exerciseIndex].sets[setIndex] = {
            ...newExercises[exerciseIndex].sets[setIndex],
            [field]: value
        };
        setStoreExercises(newExercises);
        // Autosave? Could trigger debounced API call here
    };

    const toggleSetComplete = (exerciseIndex: number, setIndex: number) => {
        const newExercises = [...exercises];
        newExercises[exerciseIndex].sets[setIndex].completed = !newExercises[exerciseIndex].sets[setIndex].completed;
        setStoreExercises(newExercises);
    };

    const handleFinishClick = () => {
        // Check if workout is less than 3 minutes (180 seconds)
        if (elapsedTime < 180) {
            setFinishDialogOpen(false);
            setShortWorkoutWarning(true);
        } else {
            setFinishDialogOpen(true);
        }
    };

    const handleDiscardWorkout = async () => {
        setLoading(true);
        try {
            await axios.delete(`/workouts/${workoutId}`);
            clearStore();
            invalidate('workouts/history');
            invalidateMatching('stats/');
            router.push('/dashboard');
        } catch (error) {
        } finally {
            setLoading(false);
            setShortWorkoutWarning(false);
        }
    };

    const handleSaveAnyway = () => {
        setShortWorkoutWarning(false);
        setFinishDialogOpen(true);
    };

    const handleFinishWorkout = async () => {
        setLoading(true);
        try {
            await axios.put(`/workouts/${workoutId}`, { exercises });
            const { data } = await axios.post(`/workouts/${workoutId}/end`);

            localStorage.setItem('lastWorkoutSummary', JSON.stringify(data));

            clearStore();
            invalidate('workouts/history');
            invalidateMatching('stats/');
            router.push(`/workout/${workoutId}/summary`);
        } catch (error) {
        } finally {
            setLoading(false);
            setFinishDialogOpen(false);
        }
    };

    return (
        <div className="space-y-6 pb-20">
            <div className="flex items-center justify-between sticky top-14 bg-background z-30 py-4">
                <div>
                    <h2 className="text-xl font-bold">{workoutName}</h2>
                    <div className="flex items-center text-gray-500 text-sm">
                        <Clock className="h-4 w-4 mr-1" />
                        {formatTime(elapsedTime)}
                    </div>
                </div>
                <Button onClick={handleFinishClick} disabled={loading} size="sm" className="bg-orange-500 hover:bg-orange-600">
                    <Save className="h-4 w-4 mr-2" /> Finish
                </Button>
            </div>

            {exercises.map((exerciseData, exerciseIndex) => (
                <Card key={exerciseData.exercise?._id || exerciseIndex}>
                    <CardHeader className="pb-3">
                        <CardTitle className="text-lg flex justify-between items-center">
                            <span>{exerciseData.exercise?.name || 'Deleted Exercise'}</span>
                            <div className="flex gap-1" onClick={(e) => e.stopPropagation()}>
                                <Button
                                    size="icon"
                                    variant="ghost"
                                    className="h-8 w-8"
                                    onClick={() => moveExercise(exerciseIndex, 'up')}
                                    disabled={exerciseIndex === 0}
                                >
                                    <ChevronUp className="h-4 w-4" />
                                </Button>
                                <Button
                                    size="icon"
                                    variant="ghost"
                                    className="h-8 w-8"
                                    onClick={() => moveExercise(exerciseIndex, 'down')}
                                    disabled={exerciseIndex === exercises.length - 1}
                                >
                                    <ChevronDown className="h-4 w-4" />
                                </Button>
                            </div>
                        </CardTitle>
                        <div className="flex gap-1">
                            {exerciseData.exercise?.muscleGroups?.map((m: string) => (
                                <Badge key={m} variant="secondary" className="text-xs">{m}</Badge>
                            ))}
                        </div>
                    </CardHeader>
                    <CardContent>
                        <div className="space-y-2">
                            {(() => {
                                const isCardio = exerciseData.exercise?.muscleGroups?.includes('Cardio');
                                const isBodyweight = (exerciseData.exercise as any)?.equipment === 'Bodyweight';

                                if (isCardio) {
                                    return (
                                        <>
                                            <div className="grid grid-cols-10 gap-2 text-xs font-semibold text-muted-foreground mb-2 text-center">
                                                <div className="col-span-2">SET</div>
                                                <div className="col-span-6">TIME (MIN)</div>
                                                <div className="col-span-2">✓</div>
                                            </div>
                                            {exerciseData.sets.map((set, setIndex) => (
                                                <div key={setIndex} className={cn("grid grid-cols-10 gap-2 items-center mb-2", set.completed && "opacity-50 transition-opacity")}>
                                                    <div className="col-span-2 text-center bg-muted rounded py-2 font-medium">{setIndex + 1}</div>
                                                    <div className="col-span-6">
                                                        <Input
                                                            type="number"
                                                            className="text-center h-9"
                                                            value={(set as any).time ?? ''}
                                                            placeholder="1"
                                                            onChange={(e) => updateSet(exerciseIndex, setIndex, 'time', e.target.value === '' ? undefined : Number(e.target.value))}
                                                        />
                                                    </div>
                                                    <div className="col-span-2 flex justify-center">
                                                        <Button
                                                            size="sm"
                                                            variant={set.completed ? "default" : "outline"}
                                                            className={cn("h-9 w-9 p-0", set.completed ? "bg-orange-500 hover:bg-orange-600" : "")}
                                                            onClick={() => toggleSetComplete(exerciseIndex, setIndex)}
                                                        >
                                                            <Check className="h-4 w-4" />
                                                        </Button>
                                                    </div>
                                                </div>
                                            ))}
                                        </>
                                    );
                                }

                                if (isBodyweight) {
                                    return (
                                        <>
                                            <div className="grid grid-cols-10 gap-2 text-xs font-semibold text-muted-foreground mb-2 text-center">
                                                <div className="col-span-2">SET</div>
                                                <div className="col-span-6">REPS</div>
                                                <div className="col-span-2">✓</div>
                                            </div>
                                            {exerciseData.sets.map((set, setIndex) => (
                                                <div key={setIndex} className={cn("grid grid-cols-10 gap-2 items-center mb-2", set.completed && "opacity-50 transition-opacity")}>
                                                    <div className="col-span-2 text-center bg-muted rounded py-2 font-medium">{setIndex + 1}</div>
                                                    <div className="col-span-6">
                                                        <Input
                                                            type="number"
                                                            className="text-center h-9"
                                                            value={set.reps ?? ''}
                                                            placeholder="1"
                                                            onChange={(e) => updateSet(exerciseIndex, setIndex, 'reps', e.target.value === '' ? undefined : Number(e.target.value))}
                                                        />
                                                    </div>
                                                    <div className="col-span-2 flex justify-center">
                                                        <Button
                                                            size="sm"
                                                            variant={set.completed ? "default" : "outline"}
                                                            className={cn("h-9 w-9 p-0", set.completed ? "bg-orange-500 hover:bg-orange-600" : "")}
                                                            onClick={() => toggleSetComplete(exerciseIndex, setIndex)}
                                                        >
                                                            <Check className="h-4 w-4" />
                                                        </Button>
                                                    </div>
                                                </div>
                                            ))}
                                        </>
                                    );
                                }

                                return (
                                    <>
                                        <div className="grid grid-cols-10 gap-2 text-xs font-semibold text-muted-foreground mb-2 text-center">
                                            <div className="col-span-2">SET</div>
                                            <div className="col-span-3">KG</div>
                                            <div className="col-span-3">REPS</div>
                                            <div className="col-span-2">✓</div>
                                        </div>
                                        {exerciseData.sets.map((set, setIndex) => (
                                            <div key={setIndex} className={cn("grid grid-cols-10 gap-2 items-center mb-2", set.completed && "opacity-50 transition-opacity")}>
                                                <div className="col-span-2 text-center bg-muted rounded py-2 font-medium">{setIndex + 1}</div>
                                                <div className="col-span-3">
                                                    <Input
                                                        type="number"
                                                        className="text-center h-9"
                                                        value={set.weight ?? ''}
                                                        placeholder="1"
                                                        onChange={(e) => updateSet(exerciseIndex, setIndex, 'weight', e.target.value === '' ? undefined : Number(e.target.value))}
                                                    />
                                                </div>
                                                <div className="col-span-3">
                                                    <Input
                                                        type="number"
                                                        className="text-center h-9"
                                                        value={set.reps ?? ''}
                                                        placeholder="1"
                                                        onChange={(e) => updateSet(exerciseIndex, setIndex, 'reps', e.target.value === '' ? undefined : Number(e.target.value))}
                                                    />
                                                </div>
                                                <div className="col-span-2 flex justify-center">
                                                    <Button
                                                        size="sm"
                                                        variant={set.completed ? "default" : "outline"}
                                                        className={cn("h-9 w-9 p-0", set.completed ? "bg-orange-500 hover:bg-orange-600" : "")}
                                                        onClick={() => toggleSetComplete(exerciseIndex, setIndex)}
                                                    >
                                                        <Check className="h-4 w-4" />
                                                    </Button>
                                                </div>
                                            </div>
                                        ))}
                                    </>
                                );
                            })()}
                        </div>
                        <Button variant="ghost" size="sm" className="w-full mt-4 text-gray-500" onClick={() => addSet(exerciseIndex)}>
                            <Plus className="h-4 w-4 mr-2" /> Add Set
                        </Button>
                    </CardContent>
                </Card>
            ))}

            <div className="pt-4 text-center">
                <Dialog open={open} onOpenChange={setOpen}>
                    <DialogTrigger asChild>
                        <Button variant="outline" className="w-full">
                            <Plus className="h-4 w-4 mr-2" /> Add Exercise
                        </Button>
                    </DialogTrigger>
                    <DialogContent className="max-h-[80vh] overflow-y-auto">
                        <DialogHeader>
                            <DialogTitle>Select Exercise</DialogTitle>
                        </DialogHeader>
                        <div className="space-y-4 py-2">
                            <div className="space-y-1">
                                <label className="text-xs text-muted-foreground font-medium">Search</label>
                                <div className="relative">
                                    <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                                    <Input
                                        placeholder="Search exercises..."
                                        className="pl-9"
                                        value={searchTerm}
                                        onChange={(e) => setSearchTerm(e.target.value)}
                                    />
                                </div>
                            </div>
                            <div className="grid grid-cols-2 gap-2 mt-2">
                                <div className="space-y-1">
                                    <label className="text-xs text-muted-foreground">Muscle Group</label>
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
                                    <label className="text-xs text-muted-foreground">Equipment</label>
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
                            <div className="grid gap-2 mt-2 max-h-[300px] overflow-y-auto">
                                {allExercises
                                    .filter(ex => ex.name.toLowerCase().includes(searchTerm.toLowerCase()))
                                    .map((ex) => (
                                        <div
                                            key={ex._id}
                                            className="flex items-center justify-between p-2 border rounded hover:bg-accent cursor-pointer"
                                            onClick={() => addExerciseToWorkout(ex)}
                                        >
                                            <div>
                                                <p className="font-medium text-foreground">{ex.name}</p>
                                                <p className="text-xs text-muted-foreground">{ex.muscleGroups.join(', ')}</p>
                                            </div>
                                            <Plus className="h-4 w-4 text-muted-foreground" />
                                        </div>
                                    ))}
                            </div>
                        </div>
                    </DialogContent>
                </Dialog>
            </div>

            {/* Short Workout Warning Dialog */}
            <Dialog open={shortWorkoutWarning} onOpenChange={setShortWorkoutWarning}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>Short Workout Detected</DialogTitle>
                    </DialogHeader>
                    <div className="py-4">
                        <p className="text-muted-foreground">This workout is less than 3 minutes. Do you want to:</p>
                    </div>
                    <div className="flex flex-col gap-2">
                        <Button onClick={handleDiscardWorkout} disabled={loading} variant="destructive">
                            {loading ? 'Discarding...' : 'Discard Workout'}
                        </Button>
                        <Button onClick={handleSaveAnyway} disabled={loading} className="bg-orange-500 hover:bg-orange-600">
                            Save Anyway
                        </Button>
                        <Button variant="outline" onClick={() => setShortWorkoutWarning(false)}>
                            Continue Workout
                        </Button>
                    </div>
                </DialogContent>
            </Dialog>

            {/* Finish Workout Confirmation Dialog */}
            <Dialog open={finishDialogOpen} onOpenChange={setFinishDialogOpen}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>Finish Workout?</DialogTitle>
                    </DialogHeader>
                    <div className="py-4">
                        <p className="text-muted-foreground">Are you sure you want to finish this workout? Your progress will be saved.</p>
                    </div>
                    <div className="flex gap-2 justify-end">
                        <Button variant="outline" onClick={() => setFinishDialogOpen(false)}>
                            Cancel
                        </Button>
                        <Button onClick={handleFinishWorkout} disabled={loading} className="bg-orange-500 hover:bg-orange-600">
                            {loading ? 'Finishing...' : 'Finish Workout'}
                        </Button>
                    </div>
                </DialogContent>
            </Dialog>
        </div>
    );
}
