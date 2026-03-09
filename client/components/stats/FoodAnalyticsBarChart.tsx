'use client';

import { useState } from 'react';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, ReferenceLine } from 'recharts';
import { Calendar } from 'lucide-react';

interface FoodData {
    date: string;
    calories: number;
    protein: number;
    carbs: number;
    fat: number;
    fiber: number;
}

interface FoodAnalyticsBarChartProps {
    data: FoodData[];
    period: string;
    onPeriodChange: (val: string) => void;
    targets?: {
        targetCalories: number;
        targetProtein: number;
        targetCarbs: number;
        targetFat: number;
    } | null;
}

type FilterKey = 'calories' | 'protein' | 'carbs' | 'fat' | 'fiber';

const formatXAxis = (tickItem: string) => {
    if (tickItem.length === 7) {
        const [year, month] = tickItem.split('-');
        const date = new Date(parseInt(year), parseInt(month) - 1);
        return date.toLocaleDateString('default', { month: 'short' });
    } else {
        const [year, month, day] = tickItem.split('-');
        const date = new Date(parseInt(year), parseInt(month) - 1, parseInt(day));
        return date.toLocaleDateString('default', { day: 'numeric', month: 'short' });
    }
};

const filterLabels: Record<FilterKey, string> = {
    calories: 'Calories (kcal)',
    protein: 'Protein (g)',
    carbs: 'Carbs (g)',
    fat: 'Fat (g)',
    fiber: 'Fiber (g)',
};

const CustomTooltip = ({ active, payload, label, filter }: any) => {
    if (active && payload && payload.length) {
        return (
            <div className="bg-[#18181b] border border-[#27272a] p-3 rounded-lg shadow-xl">
                <p className="text-gray-400 text-sm mb-1">{formatXAxis(label)}</p>
                <p className="text-white font-medium">
                    <span className="text-green-500 mr-2">{filterLabels[filter as FilterKey]}:</span>
                    {payload[0].value}
                </p>
            </div>
        );
    }
    return null;
};

export default function FoodAnalyticsBarChart({ data, targets, period, onPeriodChange }: FoodAnalyticsBarChartProps) {
    const [filter, setFilter] = useState<FilterKey>('calories');

    const getTargetValue = () => {
        if (!targets) return null;
        let val = 0;
        switch (filter) {
            case 'calories': val = targets.targetCalories; break;
            case 'protein': val = targets.targetProtein; break;
            case 'carbs': val = targets.targetCarbs; break;
            case 'fat': val = targets.targetFat; break;
            case 'fiber': val = 30; break;
            default: return null;
        }
        return Math.round(val);
    };

    const targetValue = getTargetValue();



    const filters: { id: FilterKey; label: string }[] = [
        { id: 'calories', label: 'Calories' },
        { id: 'protein', label: 'Protein' },
        { id: 'fat', label: 'Fat' },
        { id: 'carbs', label: 'Carbs' },
        { id: 'fiber', label: 'Fiber' },
    ];

    return (
        <Card className="bg-[#18181b] border-[#27272a] text-white shadow-xl rounded-2xl overflow-hidden border-2">
            <CardHeader className="pb-4 border-b border-[#27272a]/50 bg-background/50 flex flex-row items-center justify-between">
                <div className="flex items-center gap-2">
                    <div className="p-1.5 rounded-lg bg-green-500/10 text-green-500">
                        <Calendar className="w-5 h-5" />
                    </div>
                    <CardTitle className="text-xl font-bold tracking-tight">Nutrition Overview</CardTitle>
                </div>

                <Select value={period} onValueChange={onPeriodChange}>
                    <SelectTrigger className="w-[130px] bg-[#27272a] border-none h-9 text-xs font-bold uppercase tracking-wider">
                        <SelectValue placeholder="Period" />
                    </SelectTrigger>
                    <SelectContent className="bg-[#18181b] border-[#27272a]">
                        <SelectItem value="7">Last 7 days</SelectItem>
                        <SelectItem value="30">Last 30 days</SelectItem>
                        <SelectItem value="365">This Year</SelectItem>
                    </SelectContent>
                </Select>
            </CardHeader>
            <CardContent className="pt-6">
                <div className="h-[300px] w-full" tabIndex={-1} style={{ outline: 'none' }}>
                    {data && data.length > 0 ? (
                        <ResponsiveContainer width="100%" height="100%">
                            <BarChart
                                data={data}
                                style={{ outline: 'none' }}
                                margin={{ right: 35 }}
                            >
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
                                    tickFormatter={(value) => value >= 1000 ? `${(value / 1000).toFixed(1)}k` : Math.round(value).toString()}
                                    domain={[0, (dataMax: number) => Math.ceil(Math.max(dataMax, targetValue || 0) * 1.1)]}
                                />
                                <Tooltip content={<CustomTooltip filter={filter} />} cursor={{ fill: '#27272a', opacity: 0.4 }} />
                                <Bar
                                    dataKey={filter}
                                    fill="#22c55e"
                                    radius={[4, 4, 0, 0]}
                                    maxBarSize={40}
                                />
                                {targetValue && (
                                    <ReferenceLine
                                        y={targetValue}
                                        stroke="#ef4444"
                                        strokeDasharray="3 3"
                                        strokeWidth={2}
                                        label={{
                                            value: `${targetValue}${filter === 'calories' ? ' kcal' : 'g'}`,
                                            position: 'right',
                                            fill: '#ef4444',
                                            fontSize: 10,
                                            fontWeight: 'bold',
                                            offset: 10
                                        }}
                                    />
                                )}
                            </BarChart>
                        </ResponsiveContainer>
                    ) : (
                        <div className="h-full flex items-center justify-center text-muted-foreground text-sm">
                            No nutrition data found for this period.
                        </div>
                    )}
                </div>

                <div className="flex justify-center mt-6">
                    <div className="flex flex-wrap justify-center bg-[#27272a] p-1 rounded-lg border border-[#3f3f46] gap-1">
                        {filters.map(f => (
                            <button
                                key={f.id}
                                onClick={() => setFilter(f.id)}
                                className={`px-3 py-1.5 text-xs font-medium rounded-md transition-colors ${filter === f.id ? 'bg-[#3f3f46] text-white shadow-sm' : 'text-gray-400 hover:text-gray-200 hover:bg-[#3f3f46]/50'
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
