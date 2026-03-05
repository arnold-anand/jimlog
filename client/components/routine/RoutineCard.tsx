import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
} from "@/components/ui/dialog";
import Link from 'next/link';
import { Calendar, Dumbbell, Play, Edit, Trash2 } from 'lucide-react';
import WorkoutPreviewModal from '@/components/workout/WorkoutPreviewModal';

interface RoutineProps {
    _id: string;
    name: string;
    exercises: {
        exercise: {
            _id: string;
            name: string;
            muscleGroups: string[];
        };
        plannedSets: number;
    }[];
    updatedAt: string;
}

export default function RoutineCard({ routine, onDelete }: { routine: RoutineProps; onDelete: (id: string) => void }) {
    const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
    const [previewOpen, setPreviewOpen] = useState(false);
    const [deleting, setDeleting] = useState(false);

    const muscleGroups = Array.from(
        new Set(routine.exercises.flatMap((e) => e.exercise?.muscleGroups || []))
    ).slice(0, 3);

    const handleDelete = async () => {
        setDeleting(true);
        await onDelete(routine._id);
        setDeleting(false);
        setDeleteDialogOpen(false);
    };

    return (
        <>
            <Card
                className="hover:shadow-md transition-shadow cursor-pointer relative overflow-hidden group"
                onClick={() => setPreviewOpen(true)}
            >
                <CardHeader className="pb-2">
                    <div className="flex justify-between items-start">
                        <CardTitle className="text-lg">{routine.name}</CardTitle>
                        <div className="flex gap-1 relative z-10" onClick={(e) => e.stopPropagation()}>
                            <Button size="icon" variant="ghost" asChild>
                                <Link href={`/routines/${routine._id}/edit`}>
                                    <Edit className="h-4 w-4 text-muted-foreground" />
                                </Link>
                            </Button>
                            <Button size="icon" variant="ghost" onClick={() => setDeleteDialogOpen(true)}>
                                <Trash2 className="h-4 w-4 text-destructive" />
                            </Button>
                            <Button size="icon" variant="ghost" asChild>
                                <Link href={`/workout/start?routineId=${routine._id}`}>
                                    <Play className="h-5 w-5 text-orange-500" />
                                </Link>
                            </Button>
                        </div>
                    </div>
                    <div className="flex flex-wrap gap-1 mt-1">
                        {muscleGroups.map((muscle) => (
                            <Badge key={muscle} variant="secondary" className="text-xs">
                                {muscle}
                            </Badge>
                        ))}
                    </div>
                </CardHeader>
                <CardContent>
                    <div className="text-sm text-muted-foreground flex items-center gap-4">
                        <div className="flex items-center gap-1">
                            <Dumbbell className="h-4 w-4" />
                            <span>{routine.exercises.length} Exercises</span>
                        </div>
                        <div className="flex items-center gap-1">
                            <Calendar className="h-4 w-4" />
                            <span>{new Date(routine.updatedAt).toLocaleDateString()}</span>
                        </div>
                    </div>
                    <div className="mt-4 text-xs text-orange-500 font-medium opacity-0 group-hover:opacity-100 transition-opacity">
                        Tap to preview exercises →
                    </div>
                </CardContent>
            </Card>

            <WorkoutPreviewModal
                isOpen={previewOpen}
                onClose={() => setPreviewOpen(false)}
                routine={routine}
            />

            {/* Delete Confirmation Dialog */}
            <Dialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
                <DialogContent onClick={(e) => e.stopPropagation()}>
                    <DialogHeader>
                        <DialogTitle>Delete Routine?</DialogTitle>
                    </DialogHeader>
                    <div className="py-4">
                        <p className="text-muted-foreground">Are you sure you want to delete "{routine.name}"? This action cannot be undone.</p>
                    </div>
                    <div className="flex gap-2 justify-end">
                        <Button variant="outline" onClick={() => setDeleteDialogOpen(false)}>
                            Cancel
                        </Button>
                        <Button onClick={handleDelete} disabled={deleting} variant="destructive">
                            {deleting ? 'Deleting...' : 'Delete'}
                        </Button>
                    </div>
                </DialogContent>
            </Dialog>
        </>
    );
}
