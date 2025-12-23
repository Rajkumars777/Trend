'use client';

import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip, Legend, BarChart, Bar, XAxis, YAxis, CartesianGrid, ReferenceLine } from 'recharts';
import clsx from 'clsx';

interface SentimentAnalysisProps {
    distData: { name: string; value: number }[];
    platformData: { name: string; sentiment: number; count: number }[];
    categoryData: { name: string; sentiment: number; count: number }[];
    onFilter: (sentiment: string) => void;
    selectedSentiment: string | null;
}

const COLORS = {
    Positive: '#10B981', // Emerald-500
    Neutral: '#64748B',  // Slate-500
    Negative: '#EF4444', // Red-500
};

export default function SentimentAnalysis({ distData, platformData, categoryData, onFilter, selectedSentiment }: SentimentAnalysisProps) {
    // Aggregation and Normalization for Platform Data
    const processPlatformData = () => {
        if (!platformData) return [];

        const map = new Map<string, { totalSentiment: number; count: number; originalName: string }>();

        platformData.forEach(p => {
            if (!p.name) return;
            // Normalize: lowercase, trim
            const key = p.name.trim().toLowerCase();
            if (key === 'twitter') return; // Filter out twitter as per original logic

            if (!map.has(key)) {
                map.set(key, { totalSentiment: p.sentiment * p.count, count: p.count, originalName: p.name.trim() });
            } else {
                const existing = map.get(key)!;
                existing.totalSentiment += p.sentiment * p.count;
                existing.count += p.count;
                // Keep the capitalization of the first occurrence or most frequent? Let's check if we want "FaceBook" or "facebook".
                // Let's rely on the first one or just capitalize the first letter for display.
            }
        });

        // Helper to capitalization
        const toTitleCase = (str: string) => {
            return str.replace(/\w\S*/g, (txt) => {
                return txt.charAt(0).toUpperCase() + txt.substr(1).toLowerCase();
            });
        };

        return Array.from(map.entries()).map(([key, val]) => ({
            name: toTitleCase(val.originalName),
            sentiment: val.count > 0 ? parseFloat((val.totalSentiment / val.count).toFixed(2)) : 0,
            count: val.count
        })).sort((a, b) => b.count - a.count); // Sort by significance
    };

    const filteredPlatformData = processPlatformData();

    // Filter out generic categories
    const filteredCategoryData = categoryData.filter(c => {
        const name = c.name.toLowerCase();
        return name !== 'uncategorized' && name !== 'general';
    });

    const chartData = distData.map(d => ({
        ...d,
        color: COLORS[d.name as keyof typeof COLORS] || COLORS.Neutral
    }));

    // Common styling for charts
    const CardHeader = ({ title, subtitle }: { title: string, subtitle?: string }) => (
        <div className="mb-6">
            <h3 className="text-xl font-bold text-foreground">{title}</h3>
            {subtitle && <p className="text-sm text-neutral mt-1">{subtitle}</p>}
        </div>
    );

    // Helper for bar color
    const getSentimentColor = (val: number) => {
        if (val > 0) return COLORS.Positive;
        if (val < 0) return COLORS.Negative;
        return COLORS.Neutral;
    };

    return (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6 h-full">
            {/* 1. Overview (Pie Chart) - Key Interaction Point */}
            <div className="bg-card from-card/50 to-card/10 border border-border/50 rounded-[2.5rem] p-6 shadow-sm hover:shadow-xl transition-all duration-500 flex flex-col items-center justify-between relative overflow-hidden group">
                <div className="absolute top-0 right-0 w-64 h-64 bg-primary/5 rounded-full blur-3xl -z-10 transition-opacity duration-700 opacity-0 group-hover:opacity-100" />

                <div className="w-full mb-2">
                    <CardHeader title="Sentiment Overview" subtitle="Click slices to filter feed" />
                </div>

                <div className="flex-1 w-full min-h-[220px] relative">
                    <ResponsiveContainer width="100%" height="100%">
                        <PieChart margin={{ top: 0, bottom: 0, left: 0, right: 0 }}>
                            <Pie
                                data={chartData}
                                cx="50%"
                                cy="50%"
                                innerRadius={75}
                                outerRadius={95}
                                paddingAngle={6}
                                dataKey="value"
                                cursor="pointer"
                                onClick={(data) => {
                                    if (selectedSentiment === data.name) {
                                        onFilter('All');
                                    } else {
                                        onFilter(data.name);
                                    }
                                }}
                                stroke="none"
                            >
                                {chartData.map((entry, index) => (
                                    <Cell
                                        key={`cell-${index}`}
                                        fill={entry.color}
                                        opacity={selectedSentiment && selectedSentiment !== entry.name ? 0.3 : 1}
                                        style={{ outline: 'none', transition: 'all 0.3s' }}
                                    />
                                ))}
                            </Pie>
                            <Tooltip
                                contentStyle={{ backgroundColor: 'rgb(255 255 255 / 0.9)', backdropFilter: 'blur(10px)', border: 'none', borderRadius: '16px', boxShadow: '0 10px 40px -10px rgba(0,0,0,0.2)', color: '#000', padding: '12px' }}
                                itemStyle={{ color: '#000', fontWeight: 600 }}
                                cursor={false}
                            />
                            <Legend
                                verticalAlign="bottom"
                                height={24}
                                iconType="circle"
                                iconSize={8}
                                wrapperStyle={{ bottom: 0 }}
                                formatter={(value) => <span className="text-sm font-medium text-muted-foreground ml-1">{value}</span>}
                            />
                        </PieChart>
                    </ResponsiveContainer>

                    {/* Center Text for Donut */}
                    <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none pb-6">
                        {selectedSentiment ? (
                            <>
                                <span className="text-3xl font-bold text-foreground transition-all duration-300 animate-in fade-in zoom-in">{selectedSentiment}</span>
                            </>
                        ) : (
                            <div className="text-center">
                                <span className="text-xs font-bold text-muted-foreground uppercase tracking-widest">Total</span>
                            </div>
                        )}
                    </div>
                </div>
            </div>

            {/* 2. Platform Breakdown (Bar Chart) */}
            <div className="bg-card from-card/50 to-card/10 border border-border/50 rounded-[2.5rem] p-6 shadow-sm hover:shadow-xl transition-all duration-500 flex flex-col group relative overflow-hidden">
                <div className="absolute bottom-0 left-0 w-64 h-64 bg-blue-500/5 rounded-full blur-3xl -z-10 transition-opacity duration-700 opacity-0 group-hover:opacity-100" />
                <div className="mb-2">
                    <CardHeader title="Platform Sentiment" subtitle="Average sentiment score by source" />
                </div>
                <div className="flex-1 min-h-[220px]">
                    <ResponsiveContainer width="100%" height="100%">
                        <BarChart data={filteredPlatformData} layout="vertical" margin={{ left: 0, right: 10, top: 0, bottom: 0 }} barCategoryGap={12}>
                            <defs>
                                <linearGradient id="gradPositive" x1="0" y1="0" x2="1" y2="0">
                                    <stop offset="0%" stopColor="#10B981" stopOpacity={0.8} />
                                    <stop offset="100%" stopColor="#34D399" stopOpacity={1} />
                                </linearGradient>
                                <linearGradient id="gradNeutral" x1="0" y1="0" x2="1" y2="0">
                                    <stop offset="0%" stopColor="#64748B" stopOpacity={0.8} />
                                    <stop offset="100%" stopColor="#94A3B8" stopOpacity={1} />
                                </linearGradient>
                                <linearGradient id="gradNegative" x1="0" y1="0" x2="1" y2="0">
                                    <stop offset="0%" stopColor="#EF4444" stopOpacity={0.8} />
                                    <stop offset="100%" stopColor="#F87171" stopOpacity={1} />
                                </linearGradient>
                            </defs>
                            <CartesianGrid strokeDasharray="3 3" stroke={COLORS.Neutral} opacity={0.1} horizontal={false} />
                            <XAxis type="number" stroke={COLORS.Neutral} hide domain={[-1, 1]} />
                            <YAxis
                                dataKey="name"
                                type="category"
                                stroke="var(--foreground)"
                                fontSize={13}
                                fontWeight={600}
                                width={95}
                                tickLine={false}
                                axisLine={false}
                                interval={0}
                                tick={{ fill: 'currentColor', opacity: 0.9 }}
                            />
                            <Tooltip
                                cursor={{ fill: 'var(--primary)', opacity: 0.1, radius: 8 }}
                                contentStyle={{
                                    backgroundColor: 'rgba(255, 255, 255, 0.8)',
                                    backdropFilter: 'blur(12px)',
                                    border: '1px solid rgba(255,255,255,0.3)',
                                    borderRadius: '16px',
                                    boxShadow: '0 8px 32px rgba(0,0,0,0.1)',
                                    color: '#1E293B',
                                    padding: '12px 16px'
                                }}
                                itemStyle={{ fontWeight: 600, color: '#0F172A' }}
                                formatter={(value: number) => [value.toFixed(2), 'Sentiment Score']}
                            />
                            {/* Reference line at 0 */}
                            <ReferenceLine x={0} stroke={COLORS.Neutral} strokeOpacity={0.3} strokeWidth={2} />
                            <Bar dataKey="sentiment" name="Sentiment" radius={[0, 6, 6, 0]} barSize={24} animationDuration={1500}>
                                {filteredPlatformData.map((entry, index) => {
                                    const val = entry.sentiment;
                                    let fillUrl = "url(#gradNeutral)";
                                    if (val > 0) fillUrl = "url(#gradPositive)";
                                    if (val < 0) fillUrl = "url(#gradNegative)";

                                    return <Cell key={`cell-${index}`} fill={fillUrl} strokeWidth={0} />;
                                })}
                            </Bar>
                        </BarChart>
                    </ResponsiveContainer>
                </div>
            </div>

            {/* 3. Category Breakdown (Bar Chart) */}
            <div className="bg-card from-card/50 to-card/10 border border-border/50 rounded-[2.5rem] p-6 shadow-sm hover:shadow-xl transition-all duration-500 flex flex-col group relative overflow-hidden">
                <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-64 h-64 bg-emerald-500/5 rounded-full blur-3xl -z-10 transition-opacity duration-700 opacity-0 group-hover:opacity-100" />
                <div className="mb-2">
                    <CardHeader title="Category Analysis" subtitle="Sentiment across key topics" />
                </div>
                <div className="flex-1 min-h-[220px]">
                    <ResponsiveContainer width="100%" height="100%">
                        <BarChart data={filteredCategoryData} layout="vertical" margin={{ top: 0, right: 10, left: 0, bottom: 0 }} barCategoryGap={12}>
                            <defs>
                                <linearGradient id="gradPositiveCat" x1="0" y1="0" x2="1" y2="0">
                                    <stop offset="0%" stopColor="#10B981" stopOpacity={0.8} />
                                    <stop offset="100%" stopColor="#34D399" stopOpacity={1} />
                                </linearGradient>
                                <linearGradient id="gradNeutralCat" x1="0" y1="0" x2="1" y2="0">
                                    <stop offset="0%" stopColor="#64748B" stopOpacity={0.8} />
                                    <stop offset="100%" stopColor="#94A3B8" stopOpacity={1} />
                                </linearGradient>
                                <linearGradient id="gradNegativeCat" x1="0" y1="0" x2="1" y2="0">
                                    <stop offset="0%" stopColor="#EF4444" stopOpacity={0.8} />
                                    <stop offset="100%" stopColor="#F87171" stopOpacity={1} />
                                </linearGradient>
                            </defs>
                            <CartesianGrid strokeDasharray="3 3" stroke={COLORS.Neutral} opacity={0.1} horizontal={false} />
                            <XAxis type="number" stroke={COLORS.Neutral} hide domain={[-1, 1]} />
                            <YAxis
                                dataKey="name"
                                type="category"
                                stroke="var(--foreground)"
                                fontSize={12}
                                fontWeight={600}
                                width={115}
                                tickLine={false}
                                axisLine={false}
                                interval={0}
                                tick={{ fill: 'currentColor', opacity: 0.9 }}
                            />
                            <Tooltip
                                cursor={{ fill: 'var(--primary)', opacity: 0.1, radius: 8 }}
                                contentStyle={{
                                    backgroundColor: 'rgba(255, 255, 255, 0.8)',
                                    backdropFilter: 'blur(12px)',
                                    border: '1px solid rgba(255,255,255,0.3)',
                                    borderRadius: '16px',
                                    boxShadow: '0 8px 32px rgba(0,0,0,0.1)',
                                    color: '#1E293B',
                                    padding: '12px 16px'
                                }}
                                itemStyle={{ fontWeight: 600, color: '#0F172A' }}
                                formatter={(value: number) => [value.toFixed(2), 'Sentiment Score']}
                            />
                            {/* Visual baseline */}
                            <ReferenceLine x={0} stroke={COLORS.Neutral} strokeOpacity={0.3} strokeWidth={2} />

                            <Bar dataKey="sentiment" name="Sentiment" radius={[0, 6, 6, 0]} barSize={24} animationDuration={1500}>
                                {categoryData.map((entry, index) => {
                                    const val = entry.sentiment;
                                    let fillUrl = "url(#gradNeutralCat)";
                                    if (val > 0) fillUrl = "url(#gradPositiveCat)";
                                    if (val < 0) fillUrl = "url(#gradNegativeCat)";

                                    return <Cell key={`cell-${index}`} fill={fillUrl} strokeWidth={0} />;
                                })}
                            </Bar>
                        </BarChart>
                    </ResponsiveContainer>
                </div>
            </div>
        </div>
    );
}
