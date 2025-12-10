'use client';

import { MessageCircle, Hash, Map, ThumbsUp, ThumbsDown } from 'lucide-react';
import clsx from 'clsx';

interface SocialSentimentProps {
    data: any;
    loading: boolean;
}

export default function SocialSentiment({ data, loading }: SocialSentimentProps) {
    if (loading) {
        return <div className="animate-pulse bg-white dark:bg-slate-900 p-6 rounded-xl border border-slate-200 dark:border-slate-800 h-[200px] flex items-center justify-center text-slate-400 dark:text-slate-500">Loading Social Signals...</div>;
    }

    if (!data) return null;

    return (
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-6 shadow-sm transition-all duration-300">
            <h3 className="text-xl font-bold text-slate-900 dark:text-white mb-6 flex items-center gap-2 transition-colors duration-300">
                <MessageCircle className="text-pink-600" />
                Social & Policy Sentiment
            </h3>

            {/* Regional Sentiment Map (List Representation) */}
            <div className="mb-6">
                <p className="text-slate-500 dark:text-slate-400 text-xs font-bold uppercase tracking-wider mb-3 flex items-center gap-2 transition-colors duration-300">
                    <Map size={14} /> Regional Hotspots
                </p>
                <div className="space-y-2">
                    {data.social.sentimentByRegion.map((region: any, i: number) => {
                        const sentimentColor = region.sentiment > 0 ? 'bg-emerald-500' : region.sentiment < -0.3 ? 'bg-red-500' : 'bg-amber-500';
                        const wPercent = Math.min(100, Math.abs(region.sentiment) * 100 + 20); // visual width
                        return (
                            <div key={i} className="flex items-center gap-3">
                                <div className="w-24 text-xs font-bold text-slate-700 dark:text-slate-300 truncate transition-colors duration-300">{region.region}</div>
                                <div className="flex-1 h-2 bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden relative transition-colors duration-300">
                                    <div
                                        className={clsx("h-full absolute top-0", sentimentColor)}
                                        style={{
                                            width: `${wPercent}%`,
                                            left: region.sentiment < 0 ? undefined : '0',
                                            right: region.sentiment < 0 ? '0' : undefined // if negative, align right? actually standard bar is fine
                                        }}
                                    ></div>
                                    {/* Simplified bar: just show magnitude and color */}
                                    <div className={clsx("h-full transition-all duration-500", sentimentColor)} style={{ width: `${Math.abs(region.sentiment * 100)}%` }}></div>
                                </div>
                                <div className="w-8 text-right text-xs font-mono text-slate-500 dark:text-slate-400 transition-colors duration-300">{region.sentiment > 0 ? '+' : ''}{region.sentiment}</div>
                            </div>
                        );
                    })}
                </div>
            </div>

            {/* Trending Hashtags */}
            <div>
                <p className="text-slate-500 dark:text-slate-400 text-xs font-bold uppercase tracking-wider mb-3 flex items-center gap-2 transition-colors duration-300">
                    <Hash size={14} /> Trending Conversations
                </p>
                <div className="flex flex-wrap gap-2">
                    {data.social.hashtags.map((tag: string, i: number) => (
                        <span key={i} className="px-3 py-1 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 text-slate-500 dark:text-slate-400 text-xs rounded-full hover:border-pink-500/50 hover:text-pink-600 transition cursor-pointer duration-300">
                            {tag}
                        </span>
                    ))}
                </div>
            </div>
        </div>
    );
}
