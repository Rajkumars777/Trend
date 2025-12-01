'use client';

import { Database, TrendingUp, ThumbsUp, ThumbsDown, Minus, Hash } from 'lucide-react';
import { useState, useEffect } from 'react';

interface TopStatsProps {
    totalRecords: number;
    positiveCount: number;
    negativeCount: number;
    neutralCount: number;
    trendingTopics: string[];
}

export default function TopStatsRow({
    totalRecords = 0,
    positiveCount = 0,
    negativeCount = 0,
    neutralCount = 0,
    trendingTopics = ["Agriculture", "Sustainability"]
}: TopStatsProps) {
    const [currentTopicIndex, setCurrentTopicIndex] = useState(0);

    useEffect(() => {
        if (trendingTopics.length <= 1) return;
        const interval = setInterval(() => {
            setCurrentTopicIndex((prev) => (prev + 1) % trendingTopics.length);
        }, 3000);
        return () => clearInterval(interval);
    }, [trendingTopics]);

    return (
        <div className="grid grid-cols-1 md:grid-cols-5 gap-4 mb-6">
            {/* Total Records */}
            <div className="bg-slate-900/80 backdrop-blur-sm border border-slate-800 p-4 rounded-xl flex flex-col items-center justify-center shadow-lg group hover:border-blue-500/50 transition-all">
                <div className="flex items-center gap-2 mb-1 text-blue-400">
                    <Database size={20} />
                    <span className="text-sm font-bold uppercase tracking-wider">Total Records</span>
                </div>
                <span className="text-3xl font-black text-white group-hover:scale-110 transition-transform duration-300">
                    {totalRecords.toLocaleString()}
                </span>
            </div>

            {/* Positive */}
            <div className="bg-slate-900/80 backdrop-blur-sm border border-slate-800 p-4 rounded-xl flex flex-col items-center justify-center shadow-lg group hover:border-green-500/50 transition-all">
                <div className="flex items-center gap-2 mb-1 text-green-400">
                    <ThumbsUp size={20} />
                    <span className="text-sm font-bold uppercase tracking-wider">Positive</span>
                </div>
                <span className="text-3xl font-black text-white group-hover:scale-110 transition-transform duration-300">
                    {positiveCount.toLocaleString()}
                </span>
            </div>

            {/* Negative */}
            <div className="bg-slate-900/80 backdrop-blur-sm border border-slate-800 p-4 rounded-xl flex flex-col items-center justify-center shadow-lg group hover:border-red-500/50 transition-all">
                <div className="flex items-center gap-2 mb-1 text-red-400">
                    <ThumbsDown size={20} />
                    <span className="text-sm font-bold uppercase tracking-wider">Negative</span>
                </div>
                <span className="text-3xl font-black text-white group-hover:scale-110 transition-transform duration-300">
                    {negativeCount.toLocaleString()}
                </span>
            </div>

            {/* Neutral */}
            <div className="bg-slate-900/80 backdrop-blur-sm border border-slate-800 p-4 rounded-xl flex flex-col items-center justify-center shadow-lg group hover:border-slate-500/50 transition-all">
                <div className="flex items-center gap-2 mb-1 text-slate-400">
                    <Minus size={20} />
                    <span className="text-sm font-bold uppercase tracking-wider">Neutral</span>
                </div>
                <span className="text-3xl font-black text-white group-hover:scale-110 transition-transform duration-300">
                    {neutralCount.toLocaleString()}
                </span>
            </div>

            {/* Trending Topics (Cycling) */}
            <div className="bg-gradient-to-br from-orange-500/10 to-red-500/10 backdrop-blur-sm border border-orange-500/20 p-4 rounded-xl flex flex-col items-center justify-center shadow-lg group hover:border-orange-500/50 transition-all relative overflow-hidden">
                <div className="absolute top-0 right-0 p-1">
                    <span className="flex h-2 w-2">
                        <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-orange-400 opacity-75"></span>
                        <span className="relative inline-flex rounded-full h-2 w-2 bg-orange-500"></span>
                    </span>
                </div>
                <div className="flex items-center gap-2 mb-1 text-orange-400">
                    <TrendingUp size={20} />
                    <span className="text-sm font-bold uppercase tracking-wider">Trending Now</span>
                </div>
                <div className="h-8 flex items-center justify-center overflow-hidden w-full">
                    <span key={currentTopicIndex} className="text-2xl font-black text-white uppercase tracking-tight truncate max-w-full px-2 animate-in slide-in-from-bottom-2 fade-in duration-300">
                        #{trendingTopics[currentTopicIndex]}
                    </span>
                </div>
            </div>
        </div>
    );
}
