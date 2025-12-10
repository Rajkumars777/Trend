'use client';

import { PieChart, Pie, Cell, ResponsiveContainer } from 'recharts';
import { Smile, Frown, Meh, Activity } from 'lucide-react';

interface SentimentPieChartProps {
    positive: number;
    negative: number;
    neutral: number;
    className?: string;
}

const COLORS = {
    Positive: '#22c55e', // Green-500
    Negative: '#ef4444', // Red-500
    Neutral: '#94a3b8',  // Slate-400
    Track: '#1e293b'     // Slate-800 for empty part
};

import clsx from 'clsx';

export default function SentimentPieChart({ positive, negative, neutral, className }: SentimentPieChartProps) {
    const total = positive + negative + neutral || 1; // Avoid divide by zero

    // Calculate percentages to 1 decimal place with residual adjustment
    const pPercent = Number(((positive / total) * 100).toFixed(1));
    const nPercent = Number(((negative / total) * 100).toFixed(1));
    const neuPercent = Number((100 - pPercent - nPercent).toFixed(1));

    const createData = (value: number) => [
        { name: 'Value', value: value },
        { name: 'Rest', value: total - value }
    ];

    const charts = [
        { label: 'Positive', value: positive, percent: pPercent, color: '#22c55e', gradientId: 'gradPositive', icon: Smile, data: createData(positive) },
        { label: 'Negative', value: negative, percent: nPercent, color: '#ef4444', gradientId: 'gradNegative', icon: Frown, data: createData(negative) },
        { label: 'Neutral', value: neutral, percent: neuPercent, color: '#94a3b8', gradientId: 'gradNeutral', icon: Meh, data: createData(neutral) },
    ];

    return (
        <div className={clsx(
            "border border-border rounded-[2rem] bg-card py-3 px-5 shadow-sm relative hover:shadow-md transition-all   justify-center",
            className
        )}>
            {/* Ambient Background Glow */}
            <div className="absolute -top-24 -right-24 w-80 h-80 bg-primary/5 rounded-full blur-[100px] transition-opacity duration-700 opacity-50 group-hover/card:opacity-80 -z-10" />
            <div className="absolute -bottom-24 -left-24 w-80 h-80 bg-accent/5 rounded-full blur-[100px] transition-opacity duration-700 opacity-30 group-hover/card:opacity-60 -z-10" />

            <div className="flex items-center justify-between mb-4 relative z-10">
                <div className="flex items-center gap-3">
                    <div className="p-2.5 bg-primary/10 rounded-xl border border-primary/20 shadow-sm">
                        <Activity size={20} className="text-primary" />
                    </div>
                    <div>
                        <h3 className="text-lg font-bold text-foreground tracking-tight leading-none">
                            Sentiment Intensity
                        </h3>
                        <p className="text-[10px] text-neutral font-medium uppercase tracking-widest mt-1">Real-time Analysis</p>
                    </div>
                </div>
                <div className="text-right">
                    <span className="block text-2xl font-bold text-foreground leading-none tracking-tight">
                        {total.toLocaleString()}
                    </span>
                    <span className="text-[10px] text-neutral font-medium uppercase tracking-wider">Analyzed Posts</span>
                </div>
            </div>

            <div className="grid grid-cols-3 gap-2 relative z-10">
                {charts.map((chart) => {
                    const Icon = chart.icon;

                    return (
                        <div key={chart.label} className="flex flex-col items-center justify-center group outline-none focus:outline-none focus:ring-0">
                            <div className="relative w-full aspect-square max-w-[140px] transition-all duration-500 transform group-hover:scale-110">
                                {/* Chart Glow Effect */}
                                <div
                                    className="absolute inset-0 rounded-full blur-xl transition-opacity duration-500 opacity-0 group-hover:opacity-20"
                                    style={{ backgroundColor: chart.color }}
                                />

                                <ResponsiveContainer width="100%" height="100%">
                                    <PieChart>
                                        <defs>
                                            <linearGradient id={chart.gradientId} x1="0" y1="0" x2="0" y2="1">
                                                <stop offset="0%" stopColor={chart.color} stopOpacity={1} />
                                                <stop offset="100%" stopColor={chart.color} stopOpacity={0.6} />
                                            </linearGradient>
                                        </defs>
                                        <Pie
                                            data={chart.data}
                                            cx="50%"
                                            cy="50%"
                                            innerRadius="70%"
                                            outerRadius="90%"
                                            startAngle={90}
                                            endAngle={-270}
                                            dataKey="value"
                                            stroke="none"
                                            cornerRadius={6}
                                            paddingAngle={4}
                                        >
                                            <Cell fill={`url(#${chart.gradientId})`} style={{ outline: 'none' }} />
                                            <Cell fill="var(--card)" stroke="var(--card-border)" strokeWidth={0} />
                                        </Pie>
                                    </PieChart>
                                </ResponsiveContainer>

                                {/* Center Icon and Percent */}
                                <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
                                    <Icon
                                        size={22}
                                        style={{ color: chart.color }}
                                        className="mb-1 transition-all duration-300 opacity-90 group-hover:opacity-100 group-hover:scale-110"
                                    />
                                    <span className="text-xl font-bold text-foreground tracking-tight">
                                        {chart.percent}%
                                    </span>
                                </div>
                            </div>

                            <div className="mt-2 text-center">
                                <p className="text-[11px] uppercase tracking-[0.2em] font-bold text-neutral group-hover:text-foreground transition-colors duration-300">
                                    {chart.label}
                                </p>
                            </div>
                        </div>
                    );
                })}
            </div>
        </div>
    );
}
