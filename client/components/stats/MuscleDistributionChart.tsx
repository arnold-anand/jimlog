'use client';

import {
    Radar,
    RadarChart,
    PolarGrid,
    PolarAngleAxis,
    ResponsiveContainer,
} from 'recharts';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';

interface MuscleData {
    _id: string; // Muscle group name
    sets: number;
    volume: number;
}

interface MuscleDistributionChartProps {
    current: MuscleData[];
    previous: MuscleData[];
}

export default function MuscleDistributionChart({
    current,
    previous,
}: MuscleDistributionChartProps) {
    // We want exactly 6 axes: Back, Chest, Core, Shoulders, Arms, Legs
    // We need to map our specific muscles to these 6 broader categories
    const categoryMap: Record<string, string> = {
        'Lats': 'Back',
        'Upper Back': 'Back',
        'Lower Back': 'Back',
        'Traps': 'Back',

        'Chest': 'Chest',

        'Abdominals': 'Core',
        'Obliques': 'Core',
        'Core': 'Core',

        'Shoulders': 'Shoulders',

        'Biceps': 'Arms',
        'Triceps': 'Arms',
        'Forearms': 'Arms',

        'Quadriceps': 'Legs',
        'Hamstrings': 'Legs',
        'Calves': 'Legs',
        'Glutes': 'Legs',
    };

    const categories = ['Back', 'Chest', 'Core', 'Shoulders', 'Arms', 'Legs'];

    const processData = (dataList: MuscleData[]) => {
        const aggregated: Record<string, number> = {};
        categories.forEach(c => aggregated[c] = 0);

        dataList.forEach(m => {
            const mapped = categoryMap[m._id];
            if (mapped) {
                // The screenshot shows the size of the radar based on volume or sets. We will use sets as a more balanced metric across different muscles.
                aggregated[mapped] += m.sets;
            }
        });

        // Find max to normalize (Optional, Recharts autoscales, but we can do it to ensure shape)
        return aggregated;
    };

    const currentAgg = processData(current);
    const previousAgg = processData(previous);

    const chartData = categories.map(category => ({
        subject: category,
        A: currentAgg[category], // Current
        B: previousAgg[category], // Previous
    }));

    return (
        <Card className="bg-[#222] border-[#27272a] text-white">
            <CardHeader className="text-center pb-0 border-b border-[#27272a]/50">
                <CardTitle className="text-lg font-normal mb-4">Muscle distribution</CardTitle>
            </CardHeader>
            <CardContent className="pt-6">
                <div className="h-[300px] w-full">
                    <ResponsiveContainer width="100%" height="100%">
                        <RadarChart cx="50%" cy="50%" outerRadius="70%" data={chartData}>
                            <PolarGrid stroke="#27272a" />
                            <PolarAngleAxis
                                dataKey="subject"
                                tick={{ fill: '#71717a', fontSize: 12 }}
                            />
                            {/* Previous Period */}
                            <Radar
                                name="Previous"
                                dataKey="B"
                                stroke="#52525b"
                                fill="#52525b"
                                fillOpacity={0.3}
                            />
                            {/* Current Period */}
                            <Radar
                                name="Current"
                                dataKey="A"
                                stroke="#f97316"
                                fill="#f97316"
                                fillOpacity={0.5}
                            />
                        </RadarChart>
                    </ResponsiveContainer>
                </div>

                <div className="flex justify-center items-center gap-6 mt-4">
                    <div className="flex items-center gap-2 text-sm text-gray-300">
                        <div className="w-2.5 h-2.5 rounded-full bg-orange-500"></div>
                        Current
                    </div>
                    <div className="flex items-center gap-2 text-sm text-gray-300">
                        <div className="w-2.5 h-2.5 rounded-full bg-[#52525b]"></div>
                        Previous
                    </div>
                </div>
            </CardContent>
        </Card>
    );
}
