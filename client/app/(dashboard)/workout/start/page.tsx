'use client';

import { Suspense, useEffect, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import axios from '@/lib/axios';
import { useWorkoutStore } from '@/store/useWorkoutStore';
import { Loader2 } from 'lucide-react';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

function StartWorkoutContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const routineId = searchParams.get('routineId');
  const startWorkout = useWorkoutStore((state) => state.startWorkout);
  const [started, setStarted] = useState(false);
  const [showConfirmDialog, setShowConfirmDialog] = useState(false);

  useEffect(() => {
    if (started) return;

    if (routineId) {
      // If we have a routine, start immediately
      initWorkout();
    } else {
      // Show confirmation dialog for empty workout
      setShowConfirmDialog(true);
    }
  }, [routineId, started]);

  const initWorkout = async () => {
    try {
      const payload = routineId ? { routineId } : { name: 'Empty Workout' };
      setStarted(true);

      const { data } = await axios.post('/workouts', payload);

      startWorkout(data._id, data.exercises);
      router.replace(`/workout/${data._id}`);
    } catch (error) {
      router.push('/dashboard');
    }
  };

  const handleConfirm = () => {
    setShowConfirmDialog(false);
    initWorkout();
  };

  const handleCancel = () => {
    setShowConfirmDialog(false);
    router.push('/dashboard');
  };

  if (showConfirmDialog) {
    return (
      <Dialog open={showConfirmDialog} onOpenChange={(open) => !open && handleCancel()}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Start Empty Workout?</DialogTitle>
          </DialogHeader>
          <div className="py-4">
            <p className="text-muted-foreground">You're about to start a workout without a routine. You can add exercises during the workout.</p>
          </div>
          <div className="flex gap-2 justify-end">
            <Button variant="outline" onClick={handleCancel}>
              Cancel
            </Button>
            <Button onClick={handleConfirm}>
              Start Workout
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    );
  }

  return (
    <div className="flex flex-col items-center justify-center min-h-screen">
      <Loader2 className="h-8 w-8 animate-spin text-primary mb-4" />
      <p className="text-muted-foreground">Starting workout...</p>
    </div>
  );
}

export default function StartWorkoutPage() {
  return (
    <Suspense fallback={
      <div className="flex flex-col items-center justify-center min-h-screen">
        <Loader2 className="h-8 w-8 animate-spin text-primary mb-4" />
        <p className="text-muted-foreground">Loading...</p>
      </div>
    }>
      <StartWorkoutContent />
    </Suspense>
  );
}
