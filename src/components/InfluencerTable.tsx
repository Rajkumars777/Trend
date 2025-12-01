'use client';

import { User, Twitter, MessageCircle, Trophy, TrendingUp, ExternalLink } from 'lucide-react';

const INFLUENCERS = [
    { name: 'AgriTech Daily', handle: '@agritech_daily', platform: 'Twitter', reach: '1.2M', sentiment: 'Positive', engagement: 92 },
    { name: 'Farming Future', handle: '@farming_future', platform: 'Reddit', reach: '850K', sentiment: 'Neutral', engagement: 78 },
    { name: 'Green Growth', handle: '@greengrowth', platform: 'Twitter', reach: '500K', sentiment: 'Very Positive', engagement: 88 },
    { name: 'Crop Watch', handle: '@cropwatch_org', platform: 'Reddit', reach: '320K', sentiment: 'Negative', engagement: 65 },
    { name: 'Sustainable Life', handle: '@sust_life', platform: 'Twitter', reach: '210K', sentiment: 'Positive', engagement: 72 },
];

export default function InfluencerTable() {
    return (
        <div className="bg-slate-900/50 backdrop-blur-md border border-slate-800 rounded-2xl p-6 shadow-xl h-full flex flex-col relative overflow-hidden">
            {/* Background Glow */}
            <div className="absolute top-0 left-0 w-64 h-64 bg-blue-500/5 rounded-full blur-3xl -translate-y-1/2 -translate-x-1/2 pointer-events-none" />

            <div className="flex items-center justify-between mb-6 relative z-10">
                <div className="flex items-center gap-2">
                    <div className="p-2 bg-slate-800 rounded-lg border border-slate-700">
                        <Trophy size={20} className="text-yellow-400" />
                    </div>
                    <h3 className="text-xl font-bold text-white">Top Influencers</h3>
                </div>
                <button className="text-xs text-slate-400 hover:text-white flex items-center gap-1 transition-colors">
                    View All <ExternalLink size={12} />
                </button>
            </div>

            <div className="flex-1 overflow-y-auto pr-2 custom-scrollbar relative z-10">
                <div className="space-y-3">
                    {INFLUENCERS.map((inf, i) => (
                        <div
                            key={i}
                            className="group flex items-center gap-4 p-3 rounded-xl bg-slate-800/30 border border-slate-700/50 hover:bg-slate-800/80 hover:border-slate-600 transition-all duration-300"
                        >
                            {/* Rank */}
                            <div className={`
                                w-8 h-8 rounded-lg flex items-center justify-center font-bold text-sm
                                ${i === 0 ? 'bg-yellow-500/20 text-yellow-400 border border-yellow-500/30' :
                                    i === 1 ? 'bg-slate-400/20 text-slate-300 border border-slate-400/30' :
                                        i === 2 ? 'bg-orange-700/20 text-orange-400 border border-orange-700/30' :
                                            'bg-slate-800 text-slate-500'}
                            `}>
                                #{i + 1}
                            </div>

                            {/* Avatar & Info */}
                            <div className="flex items-center gap-3 flex-1 min-w-0">
                                <div className="w-10 h-10 rounded-full bg-gradient-to-br from-slate-700 to-slate-800 flex items-center justify-center text-slate-300 ring-2 ring-slate-800 group-hover:ring-blue-500/30 transition-all">
                                    <User size={18} />
                                </div>
                                <div className="min-w-0">
                                    <p className="font-bold text-white truncate group-hover:text-blue-400 transition-colors">{inf.name}</p>
                                    <div className="flex items-center gap-2 text-xs text-slate-500">
                                        {inf.platform === 'Twitter' ? (
                                            <span className="flex items-center gap-1"><Twitter size={10} className="text-blue-400" /> {inf.handle}</span>
                                        ) : (
                                            <span className="flex items-center gap-1"><MessageCircle size={10} className="text-orange-400" /> {inf.handle}</span>
                                        )}
                                    </div>
                                </div>
                            </div>

                            {/* Stats */}
                            <div className="text-right min-w-[80px]">
                                <div className="text-sm font-bold text-white">{inf.reach}</div>
                                <div className="text-xs text-slate-500 flex items-center justify-end gap-1">
                                    <TrendingUp size={10} className={inf.engagement > 80 ? 'text-green-400' : 'text-slate-400'} />
                                    {inf.engagement}% Eng.
                                </div>
                                {/* Mini Progress Bar */}
                                <div className="w-full h-1 bg-slate-700 rounded-full mt-1 overflow-hidden">
                                    <div
                                        className="h-full bg-blue-500 rounded-full"
                                        style={{ width: `${inf.engagement}%` }}
                                    />
                                </div>
                            </div>

                            {/* Action */}
                            <button className="px-3 py-1.5 rounded-lg bg-blue-500/10 text-blue-400 text-xs font-bold hover:bg-blue-500 hover:text-white transition-all opacity-0 group-hover:opacity-100 transform translate-x-2 group-hover:translate-x-0">
                                Follow
                            </button>
                        </div>
                    ))}
                </div>
            </div>
        </div>
    );
}
