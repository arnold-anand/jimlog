'use client';

import { useEffect, useState } from 'react';
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
} from "@/components/ui/dialog";
import axios from '@/lib/axios';
import { Loader2 } from 'lucide-react';

interface PreviewExercise {
    exercise: {
        _id: string;
        name: string;
    };
    plannedSets: number;
}

interface RoutinePreviewProps {
    isOpen: boolean;
    onClose: () => void;
    routine: {
        _id: string;
        name: string;
        exercises: PreviewExercise[];
    } | null;
}

export default function WorkoutPreviewModal({ isOpen, onClose, routine }: RoutinePreviewProps) {
    const [prs, setPrs] = useState<Record<string, any>>({});
    const [loading, setLoading] = useState(false);

    useEffect(() => {
        if (isOpen && routine) {
            fetchPRs();
        }
    }, [isOpen, routine]);

    const fetchPRs = async () => {
        if (!routine) return;
        setLoading(true);
        const prData: Record<string, any> = {};

        try {
            // Fetch PRs for each exercise
            // Note: Parallel fetching for speed
            await Promise.all(
                routine.exercises.map(async (ex) => {
                    if (!ex.exercise?._id) return;
                    try {
                        const { data } = await axios.get(`/workouts/exercise/${ex.exercise._id}/pr`);
                        if (data) {
                            prData[ex.exercise._id] = data;
                        }
                    } catch (err) {
                        // Ignore errors for individual PRs
                    }
                })
            );
            setPrs(prData);
        } catch (error) {
            console.error('Failed to fetch PRs', error);
        } finally {
            setLoading(false);
        }
    };

    if (!routine) return null;

    return (
        <Dialog open={isOpen} onOpenChange={onClose}>
            <DialogContent className="max-w-md max-h-[80vh] overflow-y-auto">
                <DialogHeader>
                    <DialogTitle className="text-xl font-bold">{routine.name}</DialogTitle>
                </DialogHeader>

                {loading ? (
                    <div className="flex justify-center py-8">
                        <Loader2 className="h-8 w-8 animate-spin text-orange-500" />
                    </div>
                ) : (
                    <div className="space-y-8 mt-4">
                        {routine.exercises.map((ex, idx) => {
                            const pr = prs[ex.exercise?._id];
                            // Show PR if exists, otherwise 0/default
                            const weight = pr?.bestSet?.weight ?? 1;
                            const reps = pr?.bestSet?.reps ?? 1;

                            return (
                                <div key={idx} className="space-y-4">
                                    <h3 className="font-bold text-lg text-foreground border-l-4 border-orange-500 pl-3">
                                        {ex.exercise?.name || 'Unknown Exercise'}
                                    </h3>
                                    <div className="overflow-hidden border rounded-lg">
                                        <table className="w-full text-sm">
                                            <thead>
                                                <tr className="bg-muted/50 text-muted-foreground">
                                                    <th className="text-left px-4 py-2 font-bold text-[10px] uppercase tracking-wider">SET</th>
                                                    <th className="text-center px-4 py-2 font-bold text-[10px] uppercase tracking-wider">KG</th>
                                                    <th className="text-center px-4 py-2 font-bold text-[10px] uppercase tracking-wider">REPS</th>
                                                </tr>
                                            </thead>
                                            <tbody>
                                                {Array.from({ length: ex.plannedSets || 1 }).map((_, sIdx) => (
                                                    <tr key={sIdx} className="border-t border-border">
                                                        <td className="px-4 py-2.5 text-left font-medium text-muted-foreground">{sIdx + 1}</td>
                                                        <td className="px-4 py-2.5 text-center text-foreground font-semibold">
                                                            {weight}
                                                        </td>
                                                        <td className="px-4 py-2.5 text-center text-foreground font-semibold">
                                                            {reps}
                                                        </td>
                                                    </tr>
                                                ))}
                                            </tbody>
                                        </table>
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                )}
            </DialogContent>
        </Dialog>
    );
}
