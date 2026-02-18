'use client';

import {
    BarChart,
    Bar,
    XAxis,
    YAxis,
    CartesianGrid,
    Tooltip,
    ResponsiveContainer,
    Cell
} from 'recharts';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

export default function MuscleDistributionChart({ data }: { data: any[] }) {
    // Data: [{ _id: 'Chest', sets: 10, volume: 500 }, ...]

    const colors = ['#f97316', '#a1a1aa', '#71717a', '#52525b', '#3f3f46', '#27272a'];

    return (
        <Card className="col-span-1">
            <CardHeader>
                <CardTitle>Muscle Distribution (Sets)</CardTitle>
            </CardHeader>
            <CardContent className="h-[300px]">
                <ResponsiveContainer width="100%" height="100%">
                    <BarChart
                        data={data}
                        layout="vertical"
                        margin={{ top: 5, right: 30, left: 20, bottom: 5 }}
                    >
                        <CartesianGrid strokeDasharray="3 3" horizontal={false} />
                        <XAxis type="number" hide />
                        <YAxis dataKey="_id" type="category" width={80} tick={{ fontSize: 12 }} />
                        <Tooltip />
                        <Bar dataKey="sets" fill="#f97316" radius={[0, 4, 4, 0]}>
                            {data.map((entry, index) => (
                                <Cell key={`cell-${index}`} fill={colors[index % colors.length]} />
                            ))}
                        </Bar>
                    </BarChart>
                </ResponsiveContainer>
            </CardContent>
        </Card>
    );
}
