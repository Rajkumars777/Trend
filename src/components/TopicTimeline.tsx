'use client';

import { useState, useMemo } from 'react';
import {
    AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend
} from 'recharts';
import { Filter } from 'lucide-react';
import clsx from 'clsx';

interface TopicTimelineProps {
    data: { date: string; topic: string; count: number }[];
}

export default function TopicTimeline({ data = [] }: TopicTimelineProps) {
    const [selectedTopic, setSelectedTopic] = useState<string>('All');

    // Extract unique topics for filter
    const topics = useMemo(() => {
        return Array.from(new Set(data.map(d => d.topic))).sort();
    }, [data]);

    // Transform data for Recharts (pivot by date)
    const chartData = useMemo(() => {
        const dateMap = new Map<string, any>();

        data.forEach(item => {
            if (!dateMap.has(item.date)) {
                dateMap.set(item.date, { date: item.date });
            }
            const entry = dateMap.get(item.date);
            entry[item.topic] = item.count;
        });

        return Array.from(dateMap.values()).sort((a, b) => a.date.localeCompare(b.date));
    }, [data]);

    const filteredTopics = selectedTopic === 'All' ? topics : [selectedTopic];

    // Theme-aware colors
    const COLORS = ['#38BDF8', '#818CF8', '#34D399', '#F472B6', '#FBBF24', '#A78BFA'];

    return (
        <div className="bg-card/80 backdrop-blur-sm border border-neutral/20 rounded-xl p-6 shadow-lg h-full flex flex-col">
            <div className="flex justify-between items-center mb-6">
                <div>
                    <h2 className="text-xl font-bold text-foreground flex items-center gap-2">
                        Topic Frequency Over Time
                    </h2>
                    <p className="text-xs text-neutral-400 mt-1">Last 7 Days Trend via DistilBERT</p>
                </div>

                <div className="relative group">
                    <Filter size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-neutral-400 group-hover:text-primary transition-colors" />
                    <select
                        value={selectedTopic}
                        onChange={(e) => setSelectedTopic(e.target.value)}
                        className="pl-9 pr-4 py-2 bg-slate-900/50 border border-neutral/30 rounded-lg text-sm focus:outline-none focus:border-primary/50 focus:ring-1 focus:ring-primary text-foreground appearance-none cursor-pointer"
                    >
                        <option value="All">All Topics</option>
                        {topics.map(t => (
                            <option key={t} value={t}>{t}</option>
                        ))}
                    </select>
                </div>
            </div>

            <div className="flex-1 w-full min-h-[300px]">
                <ResponsiveContainer width="100%" height="100%">
                    <AreaChart data={chartData} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
                        <defs>
                            {filteredTopics.map((topic, index) => (
                                <linearGradient key={topic} id={`color-${index}`} x1="0" y1="0" x2="0" y2="1">
                                    <stop offset="5%" stopColor={COLORS[index % COLORS.length]} stopOpacity={0.3} />
                                    <stop offset="95%" stopColor={COLORS[index % COLORS.length]} stopOpacity={0} />
                                </linearGradient>
                            ))}
                        </defs>
                        <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" vertical={false} />
                        <XAxis
                            dataKey="date"
                            stroke="#64748B"
                            fontSize={12}
                            tickLine={false}
                            axisLine={false}
                            tickFormatter={(val) => {
                                const d = new Date(val);
                                return `${d.getDate()}/${d.getMonth() + 1}`;
                            }}
                        />
                        <YAxis stroke="#64748B" fontSize={12} tickLine={false} axisLine={false} />
                        <Tooltip
                            contentStyle={{
                                backgroundColor: 'rgba(15, 23, 42, 0.9)',
                                borderColor: 'rgba(148, 163, 184, 0.2)',
                                borderRadius: '8px',
                                color: '#F1F5F9'
                            }}
                            itemStyle={{ color: '#E2E8F0' }}
                        />
                        <Legend iconType="circle" wrapperStyle={{ paddingTop: '20px' }} />
                        {filteredTopics.map((topic, index) => (
                            <Area
                                key={topic}
                                type="monotone"
                                dataKey={topic}
                                stroke={COLORS[index % COLORS.length]}
                                fillOpacity={1}
                                fill={`url(#color-${index})`}
                                strokeWidth={2}
                                name={topic.charAt(0).toUpperCase() + topic.slice(1)}
                            />
                        ))}
                    </AreaChart>
                </ResponsiveContainer>
            </div>
        </div>
    );
}
