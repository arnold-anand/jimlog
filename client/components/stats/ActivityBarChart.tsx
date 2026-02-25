'use client';

import { useState } from 'react';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer } from 'recharts';

interface ActivityData {
    date: string;
    workouts: number;
    duration: number;
    reps: number;
    volume: number;
}

interface ActivityBarChartProps {
    data: ActivityData[];
}

export default function ActivityBarChart({ data }: ActivityBarChartProps) {
    const [filter, setFilter] = useState<'duration' | 'reps' | 'volume'>('duration');

    const formatXAxis = (tickItem: string) => {
        // format based on string length. YYYY-MM-DD vs YYYY-MM
        if (tickItem.length === 7) {
            // YYYY-MM
            const [year, month] = tickItem.split('-');
            const date = new Date(parseInt(year), parseInt(month) - 1);
            return date.toLocaleDateString('default', { month: 'short' });
        } else {
            // YYYY-MM-DD
            const [year, month, day] = tickItem.split('-');
            const date = new Date(parseInt(year), parseInt(month) - 1, parseInt(day));
            return date.toLocaleDateString('default', { day: 'numeric', month: 'short' });
        }
    };

    const CustomTooltip = ({ active, payload, label }: any) => {
        if (active && payload && payload.length) {
            let valueLabel = '';
            switch (filter) {
                case 'duration': valueLabel = 'Duration (min)'; break;
                case 'reps': valueLabel = 'Reps'; break;
                case 'volume': valueLabel = 'Volume (kg)'; break;
            }

            return (
                <div className="bg-[#18181b] border border-[#27272a] p-3 rounded-lg shadow-xl">
                    <p className="text-gray-400 text-sm mb-1">{formatXAxis(label)}</p>
                    <p className="text-white font-medium">
                        <span className="text-orange-500 mr-2">{valueLabel}:</span>
                        {payload[0].value}
                    </p>
                </div>
            );
        }
        return null;
    };

    return (
        <Card className="bg-[#222] border-[#27272a] text-white">
            <CardHeader className="pb-2 border-b border-[#27272a]/50">
                <CardTitle className="text-lg font-normal">Activity Overview</CardTitle>
            </CardHeader>
            <CardContent className="pt-6">
                <div className="h-[300px] w-full" tabIndex={-1} style={{ outline: 'none' }}>
                    {data && data.length > 0 ? (
                        <ResponsiveContainer width="100%" height="100%">
                            <BarChart data={data} style={{ outline: 'none' }}>
                                <XAxis
                                    dataKey="date"
                                    tickFormatter={formatXAxis}
                                    stroke="#52525b"
                                    tick={{ fill: '#71717a', fontSize: 12 }}
                                    axisLine={false}
                                    tickLine={false}
                                />
                                <YAxis
                                    stroke="#52525b"
                                    tick={{ fill: '#71717a', fontSize: 12 }}
                                    axisLine={false}
                                    tickLine={false}
                                    tickFormatter={(value) => value >= 1000 ? `${(value / 1000).toFixed(1)}k` : value}
                                />
                                <Tooltip content={<CustomTooltip />} cursor={{ fill: '#27272a', opacity: 0.4 }} />
                                <Bar
                                    dataKey={filter}
                                    fill="#f97316"
                                    radius={[4, 4, 0, 0]}
                                    maxBarSize={40}
                                />
                            </BarChart>
                        </ResponsiveContainer>
                    ) : (
                        <div className="h-full flex items-center justify-center text-muted-foreground text-sm">
                            No activity data found for this period.
                        </div>
                    )}
                </div>

                <div className="flex justify-center mt-6">
                    <div className="flex flex-wrap justify-center bg-[#27272a] p-1 rounded-lg border border-[#3f3f46] gap-1">
                        {[
                            { id: 'duration', label: 'Duration' },
                            { id: 'reps', label: 'Reps' },
                            { id: 'volume', label: 'Volume' }
                        ].map(f => (
                            <button
                                key={f.id}
                                onClick={() => setFilter(f.id as any)}
                                className={`px-4 py-1.5 text-xs font-medium rounded-md transition-colors ${filter === f.id ? 'bg-[#3f3f46] text-white shadow-sm' : 'text-gray-400 hover:text-gray-200 hover:bg-[#3f3f46]/50'
                                    }`}
                            >
                                {f.label}
                            </button>
                        ))}
                    </div>
                </div>
            </CardContent>
        </Card>
    );
}
