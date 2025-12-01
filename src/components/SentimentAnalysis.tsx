'use client';

import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip, Legend, BarChart, Bar, XAxis, YAxis, CartesianGrid } from 'recharts';
import { useState } from 'react';
import clsx from 'clsx';

interface SentimentAnalysisProps {
    distData: { name: string; value: number }[];
    platformData: { name: string; sentiment: number; count: number }[];
    categoryData: { name: string; sentiment: number; count: number }[];
    onFilter: (sentiment: string) => void;
    selectedSentiment: string | null;
}

const COLORS = {
    Positive: '#22c55e', // Green-500
    Neutral: '#64748b',  // Slate-500
    Negative: '#ef4444', // Red-500
};

export default function SentimentAnalysis({ distData, platformData, categoryData, onFilter, selectedSentiment }: SentimentAnalysisProps) {
    const [activeTab, setActiveTab] = useState<'overview' | 'platform' | 'category'>('overview');

    // Ensure data has colors
    const chartData = distData.map(d => ({
        ...d,
        color: COLORS[d.name as keyof typeof COLORS] || '#8884d8'
    }));

    return (
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-lg h-full flex flex-col">
            <div className="flex justify-between items-center mb-6">
                <h3 className="text-xl font-bold text-white">Sentiment Analysis</h3>
                <div className="flex bg-slate-800 rounded-lg p-1">
                    {['overview', 'platform', 'category'].map((tab) => (
                        <button
                            key={tab}
                            onClick={() => setActiveTab(tab as any)}
                            className={clsx(
                                "px-3 py-1 rounded-md text-xs font-bold capitalize transition-colors",
                                activeTab === tab ? "bg-slate-700 text-white" : "text-slate-400 hover:text-slate-200"
                            )}
                        >
                            {tab}
                        </button>
                    ))}
                </div>
            </div>

            <div className="flex-1 min-h-[300px]">
                <ResponsiveContainer width="100%" height="100%">
                    {activeTab === 'overview' ? (
                        <PieChart>
                            <Pie
                                data={chartData}
                                cx="50%"
                                cy="50%"
                                innerRadius={60}
                                outerRadius={80}
                                paddingAngle={5}
                                dataKey="value"
                                cursor="pointer"
                                onClick={(data) => {
                                    if (selectedSentiment === data.name) {
                                        onFilter('All');
                                    } else {
                                        onFilter(data.name);
                                    }
                                }}
                            >
                                {chartData.map((entry, index) => (
                                    <Cell
                                        key={`cell-${index}`}
                                        fill={entry.color}
                                        stroke={selectedSentiment === entry.name ? '#fff' : 'none'}
                                        strokeWidth={2}
                                        opacity={selectedSentiment && selectedSentiment !== entry.name ? 0.3 : 1}
                                    />
                                ))}
                            </Pie>
                            <Tooltip
                                contentStyle={{ backgroundColor: '#0f172a', borderColor: '#1e293b', color: '#fff' }}
                                itemStyle={{ color: '#fff' }}
                            />
                            <Legend verticalAlign="bottom" height={36} iconType="circle" />
                        </PieChart>
                    ) : activeTab === 'platform' ? (
                        <BarChart data={platformData} layout="vertical">
                            <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" horizontal={false} />
                            <XAxis type="number" stroke="#64748b" />
                            <YAxis dataKey="name" type="category" stroke="#94a3b8" width={80} />
                            <Tooltip
                                cursor={{ fill: '#1e293b' }}
                                contentStyle={{ backgroundColor: '#0f172a', borderColor: '#1e293b', color: '#fff' }}
                            />
                            <Bar dataKey="sentiment" name="Avg Sentiment" fill="#8b5cf6" radius={[0, 4, 4, 0]} />
                        </BarChart>
                    ) : (
                        <BarChart data={categoryData}>
                            <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" vertical={false} />
                            <XAxis dataKey="name" stroke="#64748b" />
                            <YAxis stroke="#64748b" />
                            <Tooltip
                                cursor={{ fill: '#1e293b' }}
                                contentStyle={{ backgroundColor: '#0f172a', borderColor: '#1e293b', color: '#fff' }}
                            />
                            <Bar dataKey="sentiment" name="Avg Sentiment" fill="#10B981" radius={[4, 4, 0, 0]} />
                        </BarChart>
                    )}
                </ResponsiveContainer>
            </div>

            {activeTab === 'overview' && (
                <p className="text-center text-slate-500 text-xs mt-4">Click a slice to filter the feed below.</p>
            )}
        </div>
    );
}
