'use client';

import { Card, CardContent } from '@/components/ui/card';
import { ArrowUp, ArrowDown } from 'lucide-react';

interface Metrics {
    workouts: number;
    durationMinutes: number;
    volume: number;
    sets: number;
}

interface StatsSummaryCardsProps {
    current: Metrics;
    previous: Metrics;
}

export default function StatsSummaryCards({ current, previous }: StatsSummaryCardsProps) {
    const formatDuration = (mins: number) => {
        const hours = Math.floor(mins / 60);
        const remaining = mins % 60;
        if (hours > 0) return `${hours}h ${remaining}min`;
        return `${remaining}min`;
    };

    const formatVolume = (vol: number) => {
        if (vol >= 1000) return `${(vol / 1000).toFixed(1)}k kg`;
        return `${Math.round(vol)} kg`;
    };

    const renderCard = (title: string, currentVal: string, diff: number, isGoodIsUp: boolean = true) => {
        const isUp = diff > 0;
        const isGood = isUp === isGoodIsUp && diff !== 0;
        const isNeutral = diff === 0;

        return (
            <Card className="bg-[#222] border-[#27272a] text-white hover:border-[#3f3f46] transition-colors">
                <CardContent className="p-4 space-y-2">
                    <p className="text-[#a1a1aa] text-sm">{title}</p>
                    <p className="text-2xl font-bold">{currentVal}</p>
                    <div className="flex items-center gap-1 text-sm">
                        {!isNeutral && (
                            isUp ? <ArrowUp className="w-3 h-3" /> : <ArrowDown className="w-3 h-3" />
                        )}
                        <span className={isNeutral ? "text-[#71717a]" : isGood ? "text-green-500" : "text-red-500"}>
                            {Math.abs(diff)} {title === 'Volume' ? 'kg' : title === 'Duration' ? 'min' : ''}
                        </span>
                    </div>
                </CardContent>
            </Card>
        );
    };

    return (
        <div className="grid grid-cols-2 gap-4 mt-6">
            {renderCard('Workouts', current.workouts.toString(), current.workouts - previous.workouts)}
            {renderCard('Duration', formatDuration(current.durationMinutes), current.durationMinutes - previous.durationMinutes)}
            {renderCard('Volume', formatVolume(current.volume), current.volume - previous.volume)}
            {renderCard('Sets', current.sets.toString(), current.sets - previous.sets)}
        </div>
    );
}
