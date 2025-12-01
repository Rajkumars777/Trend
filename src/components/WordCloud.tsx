'use client';

import { Hash } from 'lucide-react';

const TOPICS = [
    { text: 'Climate Change', value: 100, color: 'text-rose-400', bg: 'bg-rose-500/10', border: 'border-rose-500/20' },
    { text: 'Sustainable Farming', value: 90, color: 'text-emerald-400', bg: 'bg-emerald-500/10', border: 'border-emerald-500/20' },
    { text: 'Crop Yield', value: 85, color: 'text-amber-400', bg: 'bg-amber-500/10', border: 'border-amber-500/20' },
    { text: 'Organic', value: 75, color: 'text-green-400', bg: 'bg-green-500/10', border: 'border-green-500/20' },
    { text: 'AgTech', value: 70, color: 'text-blue-400', bg: 'bg-blue-500/10', border: 'border-blue-500/20' },
    { text: 'Irrigation', value: 60, color: 'text-cyan-400', bg: 'bg-cyan-500/10', border: 'border-cyan-500/20' },
    { text: 'Pesticides', value: 55, color: 'text-red-400', bg: 'bg-red-500/10', border: 'border-red-500/20' },
    { text: 'Soil Health', value: 50, color: 'text-lime-400', bg: 'bg-lime-500/10', border: 'border-lime-500/20' },
    { text: 'Market Prices', value: 45, color: 'text-purple-400', bg: 'bg-purple-500/10', border: 'border-purple-500/20' },
    { text: 'Supply Chain', value: 40, color: 'text-orange-400', bg: 'bg-orange-500/10', border: 'border-orange-500/20' },
    { text: 'Drones', value: 35, color: 'text-sky-400', bg: 'bg-sky-500/10', border: 'border-sky-500/20' },
    { text: 'IoT', value: 30, color: 'text-indigo-400', bg: 'bg-indigo-500/10', border: 'border-indigo-500/20' },
    { text: 'Regenerative', value: 25, color: 'text-teal-400', bg: 'bg-teal-500/10', border: 'border-teal-500/20' },
];

export default function WordCloud() {
    return (
        <div className="bg-slate-900/50 backdrop-blur-md border border-slate-800 rounded-2xl p-6 shadow-xl h-full flex flex-col relative overflow-hidden group">
            {/* Background Glow */}
            <div className="absolute top-0 right-0 w-64 h-64 bg-emerald-500/5 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2 pointer-events-none" />

            <div className="flex items-center gap-2 mb-6 relative z-10">
                <div className="p-2 bg-slate-800 rounded-lg border border-slate-700">
                    <Hash size={20} className="text-emerald-400" />
                </div>
                <h3 className="text-xl font-bold text-white">Topic Clustering</h3>
            </div>

            <div className="flex flex-wrap gap-3 justify-center items-center flex-1 content-center relative z-10">
                {TOPICS.map((topic, i) => {
                    // Dynamic sizing based on value
                    const fontSize = Math.max(0.75, topic.value / 35);
                    const padding = Math.max(0.5, topic.value / 200);

                    return (
                        <div
                            key={i}
                            className={`
                                relative group/tag cursor-pointer transition-all duration-300 ease-out
                                ${topic.bg} ${topic.border} border
                                hover:scale-110 hover:shadow-lg hover:shadow-${topic.color.split('-')[1]}-500/20
                                rounded-full flex items-center justify-center
                            `}
                            style={{
                                padding: `${padding}rem ${padding * 2}rem`,
                                opacity: 0,
                                animation: `fadeIn 0.5s ease-out forwards ${i * 0.05}s`
                            }}
                        >
                            <span
                                className={`font-bold ${topic.color} whitespace-nowrap transition-colors`}
                                style={{ fontSize: `${fontSize}rem` }}
                            >
                                {topic.text}
                            </span>

                            {/* Tooltip-like value on hover */}
                            <div className="absolute -top-8 left-1/2 -translate-x-1/2 bg-slate-900 text-white text-xs py-1 px-2 rounded opacity-0 group-hover/tag:opacity-100 transition-opacity pointer-events-none border border-slate-700 whitespace-nowrap z-20">
                                {topic.value}% Volume
                            </div>
                        </div>
                    );
                })}
            </div>

            <style jsx>{`
                @keyframes fadeIn {
                    from { opacity: 0; transform: translateY(10px); }
                    to { opacity: 1; transform: translateY(0); }
                }
            `}</style>
        </div>
    );
}
