'use client';

import { Database, TrendingUp, ThumbsUp, ThumbsDown, Sprout, ArrowUpRight, ArrowDownRight, Minus } from 'lucide-react';
import { LineChart, Line, ResponsiveContainer } from 'recharts';

interface TopStatsProps {
    totalRecords: number;
    positiveCount: number;
    negativeCount: number;
    topCrop: string;
    forecastIndex: string;
    forecastDirection: "up" | "down";
    dailyTrend: { date: string; value: number }[];
    neutralCount?: number;
}

export default function TopStatsRow({
    totalRecords = 0,
    positiveCount = 0,
    negativeCount = 0,
    topCrop = "Mixed",
    forecastIndex = "Stable",
    forecastDirection = "up",
    dailyTrend = [],
    neutralCount = 0
}: TopStatsProps) {

    // Sparkline configuration
    const renderSparkline = (color: string, dataKey: string = "value") => (
        <div className="h-10 w-24">
            <ResponsiveContainer width="100%" height="100%">
                <LineChart data={dailyTrend}>
                    <Line type="monotone" dataKey={dataKey} stroke={color} strokeWidth={2} dot={false} />
                </LineChart>
            </ResponsiveContainer>
        </div>
    );

    return (
        <div className="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-6 gap-4 mb-6">
            {/* 1. Total Records */}
            <div className="bg-card/60 backdrop-blur-xl border border-white/5 p-4 rounded-3xl flex flex-col justify-between shadow-lg hover:shadow-blue-500/10 hover:border-blue-500/30 transition-all duration-300 group relative overflow-hidden">
                <div className="absolute top-0 right-0 p-4 opacity-[0.05] group-hover:opacity-[0.1] transition-opacity scale-125">
                    <Database size={60} />
                </div>
                <div className="flex justify-between items-start relative z-10">
                    <div>
                        <div className="flex items-center gap-2 mb-2 text-blue-400">
                            <div className="p-1.5 rounded-lg bg-blue-500/10">
                                <Database size={14} />
                            </div>
                            <span className="text-[10px] font-bold uppercase tracking-widest">Total Data</span>
                        </div>
                        <span className="text-3xl font-black text-foreground tracking-tight">{totalRecords.toLocaleString()}</span>
                    </div>
                </div>
                <div className="mt-2 h-8 opacity-50 grayscale group-hover:grayscale-0 transition-all">
                    {dailyTrend.length > 0 && renderSparkline("#60A5FA")}
                </div>
            </div>

            {/* 2. Positive Sentiment */}
            <div className="bg-card/60 backdrop-blur-xl border border-white/5 p-4 rounded-3xl flex flex-col justify-between shadow-lg hover:shadow-green-500/10 hover:border-green-500/30 transition-all duration-300 group relative overflow-hidden">
                <div className="absolute top-0 right-0 p-4 opacity-[0.05] group-hover:opacity-[0.1] transition-opacity scale-125">
                    <ThumbsUp size={60} />
                </div>
                <div className="flex justify-between items-start relative z-10">
                    <div>
                        <div className="flex items-center gap-2 mb-2 text-green-400">
                            <div className="p-1.5 rounded-lg bg-green-500/10">
                                <ThumbsUp size={14} />
                            </div>
                            <span className="text-[10px] font-bold uppercase tracking-widest">Positive</span>
                        </div>
                        <span className="text-3xl font-black text-foreground tracking-tight">{positiveCount.toLocaleString()}</span>
                    </div>
                </div>
                <div className="mt-2 h-8 opacity-50 grayscale group-hover:grayscale-0 transition-all">
                    {dailyTrend.length > 0 && renderSparkline("#4ADE80")}
                </div>
            </div>

            {/* 3. Neutral Sentiment */}
            <div className="bg-card/60 backdrop-blur-xl border border-white/5 p-4 rounded-3xl flex flex-col justify-between shadow-lg hover:shadow-neutral-500/10 hover:border-neutral-500/30 transition-all duration-300 group relative overflow-hidden">
                <div className="absolute top-0 right-0 p-4 opacity-[0.05] group-hover:opacity-[0.1] transition-opacity scale-125">
                    <Minus size={60} />
                </div>
                <div className="flex justify-between items-start relative z-10">
                    <div>
                        <div className="flex items-center gap-2 mb-2 text-neutral-400">
                            <div className="p-1.5 rounded-lg bg-neutral-500/10">
                                <Minus size={14} />
                            </div>
                            <span className="text-[10px] font-bold uppercase tracking-widest">Neutral</span>
                        </div>
                        <span className="text-3xl font-black text-foreground tracking-tight">{neutralCount.toLocaleString()}</span>
                    </div>
                </div>
            </div>

            {/* 4. Negative Sentiment */}
            <div className="bg-card/60 backdrop-blur-xl border border-white/5 p-4 rounded-3xl flex flex-col justify-between shadow-lg hover:shadow-red-500/10 hover:border-red-500/30 transition-all duration-300 group relative overflow-hidden">
                <div className="absolute top-0 right-0 p-4 opacity-[0.05] group-hover:opacity-[0.1] transition-opacity scale-125">
                    <ThumbsDown size={60} />
                </div>
                <div className="flex justify-between items-start relative z-10">
                    <div>
                        <div className="flex items-center gap-2 mb-2 text-red-400">
                            <div className="p-1.5 rounded-lg bg-red-500/10">
                                <ThumbsDown size={14} />
                            </div>
                            <span className="text-[10px] font-bold uppercase tracking-widest">Negative</span>
                        </div>
                        <span className="text-3xl font-black text-foreground tracking-tight">{negativeCount.toLocaleString()}</span>
                    </div>
                </div>
                <div className="mt-2 h-8 opacity-50 grayscale group-hover:grayscale-0 transition-all">
                    {dailyTrend.length > 0 && renderSparkline("#F87171")}
                </div>
            </div>

            {/* 5. Top Trending Crop (Replaces Neutral) */}
            <div className="bg-gradient-to-br from-yellow-500/10 to-orange-500/5 backdrop-blur-xl border border-yellow-500/20 p-4 rounded-3xl flex flex-col justify-center items-center shadow-lg hover:border-yellow-500/40 hover:shadow-yellow-500/10 transition-all relative overflow-hidden group">
                <div className="absolute -top-10 -right-10 w-32 h-32 bg-yellow-500/10 blur-3xl rounded-full" />
                <div className="absolute top-2 right-2 p-1 opacity-50 group-hover:opacity-100 transition-opacity">
                    <Sprout className="text-yellow-500 animate-bounce-slow" size={20} />
                </div>
                <div className="flex items-center gap-2 mb-2 text-yellow-500 relative z-10">
                    <TrendingUp size={16} />
                    <span className="text-[10px] font-bold uppercase tracking-widest">Top Trending</span>
                </div>
                <span className="text-3xl font-black text-foreground uppercase tracking-tight relative z-10">{topCrop}</span>
            </div>

            {/* 6. Forecast Index (New) */}
            <div className={`col-span-1 border backdrop-blur-sm p-4 rounded-3xl flex flex-col justify-center items-center shadow-lg transition-all duration-300 group hover:shadow-2xl relative overflow-hidden
                ${forecastDirection === 'up'
                    ? 'bg-gradient-to-br from-green-500/20 to-teal-500/5 border-green-500/20 hover:border-green-500/40'
                    : 'bg-gradient-to-br from-red-500/20 to-orange-500/5 border-red-500/20 hover:border-red-500/40'}`}>

                {/* Background Glow */}
                <div className={`absolute inset-0 opacity-20 blur-2xl 
                    ${forecastDirection === 'up' ? 'bg-green-500/20' : 'bg-red-500/20'}`} />

                <div className="flex items-center gap-2 mb-2 text-neutral/60 relative z-10">
                    <span className="text-[10px] font-bold uppercase tracking-widest">Agri Forecast</span>
                </div>
                <div className="flex items-center gap-3 relative z-10">
                    <div className={`p-2 rounded-full ${forecastDirection === 'up' ? 'bg-green-500/20 text-green-400' : 'bg-red-500/20 text-red-400'}`}>
                        {forecastDirection === 'up' ? <ArrowUpRight size={24} /> : <ArrowDownRight size={24} />}
                    </div>
                    <span className={`text-3xl font-black ${forecastDirection === 'up' ? 'text-green-400' : 'text-red-400'}`}>
                        {forecastIndex.toUpperCase()}
                    </span>
                </div>
                <span className="text-[10px] text-neutral/50 mt-2 font-medium relative z-10">Based on 24h sentiment trend</span>
            </div>
        </div>
    );
}
