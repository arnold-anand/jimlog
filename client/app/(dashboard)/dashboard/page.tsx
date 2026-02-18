'use client';

import { useAuthStore } from '@/store/useAuthStore';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import Link from 'next/link';
import { Dumbbell, Plus } from 'lucide-react';

export default function DashboardPage() {
    const user = useAuthStore((state) => state.user);

    return (
        <div className="space-y-6">
            <div>
                <h2 className="text-2xl font-bold">Hello, {user?.email?.split('@')[0]} 👋</h2>
                <p className="text-gray-500">Ready to crush your workout?</p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <Card className="bg-gradient-to-br from-orange-500 to-red-600 text-white border-none shadow-lg">
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2">
                            <Dumbbell className="h-6 w-6" />
                            Quick Start
                        </CardTitle>
                    </CardHeader>
                    <CardContent>
                        <p className="mb-4 text-orange-100">Start an empty workout or choose a routine.</p>
                        <div className="flex gap-2">
                            <Button asChild variant="secondary" className="w-full">
                                <Link href="/workout/start">Start Empty Workout</Link>
                            </Button>
                        </div>
                    </CardContent>
                </Card>

                <Card>
                    <CardHeader>
                        <CardTitle>Recent Routines</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <p className="text-gray-500 text-sm mb-4">You haven't created any routines yet.</p>
                        <Button asChild variant="outline" className="w-full">
                            <Link href="/routines/create">
                                <Plus className="h-4 w-4 mr-2" /> Create Routine
                            </Link>
                        </Button>
                    </CardContent>
                </Card>
            </div>
        </div>
    );
}
