'use client';

import { useState } from 'react';
import {
    AreaChart, Area, XAxis, YAxis, Tooltip, ResponsiveContainer, Legend, CartesianGrid, BarChart, Bar, Cell
} from 'recharts';
import { Twitter, MessageCircle, Youtube, Newspaper, Heart, Users, Hash, Facebook, Instagram, Linkedin, BarChart2, BookOpen, Globe, Link2 } from 'lucide-react';
import clsx from 'clsx';

interface PlatformData {
    sentimentBreakdown: { positive: number; neutral: number; negative: number; };
    totalVolume: number;
    engagementFactor: number;
    topAuthors: { name: string; reach: number }[];
    hashtags: { text: string; value: number }[];
}

interface SentimentDetailsProps {
    data: {
        platforms: Record<string, PlatformData>;
        engagementTrend: any[];
    };
}

const PLATFORM_ICONS: Record<string, any> = {
    twitter: Twitter,
    reddit: MessageCircle,
    youtube: Youtube,
    news: Newspaper,
    facebook: Facebook,
    instagram: Instagram,
    linkedin: Linkedin,
    medium: BookOpen,
    mastodon: Globe,
    lemmy: Link2
};

const PLATFORM_COLORS: Record<string, string> = {
    twitter: '#38BDF8',
    reddit: '#FB923C',
    youtube: '#EF4444',
    news: '#A3A3A3',
    facebook: '#1877F2',
    instagram: '#E4405F',
    linkedin: '#0A66C2',
    medium: '#12100E',
    mastodon: '#6364FF',
    lemmy: '#000000'
};

const formatYAxis = (value: number) => {
    if (value >= 1000000) {
        const val = (value / 1000000).toFixed(1);
        return `${val.endsWith('.0') ? val.slice(0, -2) : val}M`;
    }
    if (value >= 1000) {
        const val = (value / 1000).toFixed(1);
        return `${val.endsWith('.0') ? val.slice(0, -2) : val}K`;
    }
    return value.toString();
};

const formatXAxis = (dateStr: string) => {
    const date = new Date(dateStr);
    return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
};

export default function SentimentPlatformDetails({ data }: SentimentDetailsProps) {
    const [selectedPlatform, setSelectedPlatform] = useState<string | null>(null);

    if (!data || !data.platforms) return null;

    const platforms = Object.keys(data.platforms).filter(p => p !== 'twitter');

    return (
        <div className="space-y-8">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                {platforms.map(platform => {
                    const stats = data.platforms[platform];
                    const Icon = PLATFORM_ICONS[platform] || MessageCircle;
                    const color = PLATFORM_COLORS[platform] || '#fff';
                    const mainSentiment =
                        stats.sentimentBreakdown.positive >= 50 ? 'Positive' :
                            stats.sentimentBreakdown.negative >= 40 ? 'Negative' : 'Neutral';

                    return (
                        <div key={platform} className="bg-card from-card/50 to-card/10 border border-border/50 rounded-[2rem] p-6 shadow-sm hover:shadow-xl transition-all duration-500 flex flex-col gap-6 group relative overflow-hidden">
                            {/* Decorative Background Blur */}
                            <div className="absolute -top-10 -right-10 w-32 h-32 bg-primary/5 rounded-full blur-3xl transition-opacity duration-700 opacity-0 group-hover:opacity-100" />

                            {/* Header */}
                            <div className="flex justify-between items-center">
                                <div className="flex items-center gap-3">
                                    <div className="p-2.5 rounded-2xl bg-neutral-100 dark:bg-neutral-800 text-foreground">
                                        <Icon size={22} style={{ color }} />
                                    </div>
                                    <span className="font-bold capitalize text-lg text-foreground">{platform}</span>
                                </div>
                                <span className={clsx(
                                    "text-xs font-bold px-3 py-1.5 rounded-full border",
                                    mainSentiment === 'Positive' ? "bg-emerald-500/10 text-emerald-600 border-emerald-500/20" :
                                        mainSentiment === 'Negative' ? "bg-red-500/10 text-red-600 border-red-500/20" :
                                            "bg-slate-500/10 text-slate-600 border-slate-500/20"
                                )}>
                                    {stats.sentimentBreakdown.positive}% Pos
                                </span>
                            </div>

                            {/* Metrics Row */}
                            <div className="grid grid-cols-2 gap-4">
                                <div className="bg-neutral-50 dark:bg-white/5 p-4 rounded-2xl border border-neutral-100 dark:border-white/5">
                                    <span className="text-xs text-muted-foreground font-medium uppercase tracking-wider block mb-1">Volume</span>
                                    <span className="text-xl font-bold text-foreground">{stats.totalVolume.toLocaleString()}</span>
                                </div>
                                <div className="bg-neutral-50 dark:bg-white/5 p-4 rounded-2xl border border-neutral-100 dark:border-white/5">
                                    <span className="text-xs text-muted-foreground font-medium uppercase tracking-wider block mb-1">Eng. Rate</span>
                                    <div className="flex items-center gap-1.5">
                                        <Heart size={14} className="text-pink-500 fill-pink-500" />
                                        <span className="text-xl font-bold text-foreground">{stats.engagementFactor}</span>
                                    </div>
                                </div>
                            </div>

                            {/* Sentiment Distribution Bar */}
                            <div className="space-y-2">
                                <div className="flex justify-between text-xs text-muted-foreground font-medium px-1">
                                    <span>Pos</span>
                                    <span>Neu</span>
                                    <span>Neg</span>
                                </div>
                                <div className="h-4 w-full rounded-full overflow-hidden flex bg-neutral-100 dark:bg-neutral-800">
                                    <div style={{ width: `${stats.sentimentBreakdown.positive}%` }} className="h-full bg-emerald-500 transition-all duration-500" />
                                    <div style={{ width: `${stats.sentimentBreakdown.neutral}%` }} className="h-full bg-slate-400 transition-all duration-500" />
                                    <div style={{ width: `${stats.sentimentBreakdown.negative}%` }} className="h-full bg-red-500 transition-all duration-500" />
                                </div>
                            </div>

                            {/* Top Voice */}
                            {stats.topAuthors.length > 0 && (
                                <div className="bg-slate-900/5 dark:bg-slate-800/50 p-3 rounded-xl border border-slate-200 dark:border-slate-700/50 flex items-center gap-3">
                                    <div className="p-1.5 bg-sky-500/10 rounded-lg">
                                        <Users size={14} className="text-sky-500" />
                                    </div>
                                    <div className="overflow-hidden">
                                        <span className="text-[10px] text-muted-foreground font-bold uppercase tracking-wider block">Top Voice</span>
                                        <div className="font-semibold truncate text-sky-600 dark:text-sky-400 text-sm">
                                            {stats.topAuthors[0].name}
                                        </div>
                                    </div>
                                </div>
                            )}

                            {/* Hashtags */}
                            <div className="flex flex-wrap gap-2 mt-auto pt-2">
                                {stats.hashtags.slice(0, 3).map((tag, i) => (
                                    <span key={i} className="text-[11px] font-medium bg-neutral-100 dark:bg-neutral-800 px-2.5 py-1 rounded-md text-muted-foreground transition-colors hover:bg-primary/10 hover:text-primary cursor-default">
                                        #{tag.text}
                                    </span>
                                ))}
                            </div>
                        </div>
                    );
                })}
            </div>

            {/* Engagement Trend Area Chart */}
            {/* Total Posts & Interactive Sentiment Breakdown */}
            <div className="bg-card from-card/50 to-card/10 rounded-[2.5rem] p-8 shadow-sm hover:shadow-xl transition-all duration-500">
                <div className="flex items-center gap-3 mb-8">
                    <div className="p-2 bg-primary/10 rounded-xl text-primary">
                        <BarChart2 />
                    </div>
                    <div>
                        <h3 className="text-xl font-bold text-foreground">Total Posts by Platform</h3>
                        <p className="text-sm text-muted-foreground">Click a bar to see sentiment breakdown</p>
                    </div>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 items-center">
                    {/* Left: Interactive Bar Chart */}
                    <div className="h-[350px] w-full">
                        <ResponsiveContainer width="100%" height="100%">
                            <BarChart
                                data={platforms.map(p => ({
                                    name: p,
                                    count: data.platforms[p]?.totalVolume || 0,
                                    fill: PLATFORM_COLORS[p] || '#888'
                                }))}
                                margin={{ top: 10, right: 10, left: 0, bottom: 0 }}
                                onClick={(state: any) => {
                                    if (state && state.activeLabel) {
                                        setSelectedPlatform(state.activeLabel);
                                    }
                                }}
                            >
                                <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" vertical={false} opacity={0.3} />
                                <XAxis dataKey="name" stroke="var(--muted-foreground)" fontSize={12} tickLine={false} axisLine={false} dy={10} tickFormatter={(val) => val.charAt(0).toUpperCase() + val.slice(1)} />
                                <YAxis stroke="var(--muted-foreground)" fontSize={12} tickLine={false} axisLine={false} tickFormatter={formatYAxis} width={50} />
                                <Tooltip
                                    cursor={{ fill: 'var(--primary)', opacity: 0.1, radius: 8 }}
                                    contentStyle={{ backgroundColor: 'rgb(255 255 255 / 0.9)', backdropFilter: 'blur(10px)', border: 'none', borderRadius: '16px', boxShadow: '0 10px 40px -10px rgba(0,0,0,0.2)', color: '#000', padding: '12px' }}
                                    formatter={(value: number) => [value.toLocaleString(), 'Total Posts']}
                                />
                                <Bar dataKey="count" radius={[8, 8, 8, 8]} barSize={50} animationDuration={1000}>
                                    {platforms.map((p, i) => (
                                        <Cell key={i} fill={PLATFORM_COLORS[p] || '#888'} cursor="pointer" opacity={selectedPlatform === p ? 1 : selectedPlatform ? 0.3 : 1} />
                                    ))}
                                </Bar>
                            </BarChart>
                        </ResponsiveContainer>
                    </div>

                    {/* Right: Selected Platform Details */}
                    <div className="bg-neutral-50 dark:bg-slate-900/50 rounded-[2rem] p-8 border border-neutral-100 dark:border-white/5 flex flex-col justify-center h-full min-h-[350px]">
                        {selectedPlatform ? (
                            <div className="space-y-6 animate-in fade-in slide-in-from-right-4 duration-500">
                                <div className="flex items-center gap-4 border-b border-border/50 pb-4">
                                    <div className="p-3 rounded-2xl bg-white dark:bg-slate-800 shadow-sm text-foreground">
                                        {(() => {
                                            const Icon = PLATFORM_ICONS[selectedPlatform] || MessageCircle;
                                            return <Icon size={32} style={{ color: PLATFORM_COLORS[selectedPlatform] }} />;
                                        })()}
                                    </div>
                                    <div>
                                        <h4 className="text-2xl font-bold text-foreground capitalize">{selectedPlatform}</h4>
                                        <p className="text-muted-foreground">Sentiment Breakdown</p>
                                    </div>
                                </div>

                                <div className="space-y-4">
                                    {/* Sentiment Bars */}
                                    {[
                                        { label: 'Positive', key: 'positive', color: 'bg-emerald-500', text: 'text-emerald-600' },
                                        { label: 'Neutral', key: 'neutral', color: 'bg-slate-400', text: 'text-slate-500' },
                                        { label: 'Negative', key: 'negative', color: 'bg-red-500', text: 'text-red-500' },
                                    ].map((item) => {
                                        const stats = data.platforms[selectedPlatform];
                                        const pct = stats.sentimentBreakdown[item.key as keyof typeof stats.sentimentBreakdown];
                                        const count = Math.round((pct / 100) * stats.totalVolume);

                                        return (
                                            <div key={item.key}>
                                                <div className="flex justify-between text-sm font-medium mb-1.5">
                                                    <span className={item.text}>{item.label}</span>
                                                    <span className="text-foreground font-bold">{count.toLocaleString()} <span className="text-xs text-muted-foreground font-normal">({pct}%)</span></span>
                                                </div>
                                                <div className="h-3 w-full bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden">
                                                    <div style={{ width: `${pct}%` }} className={clsx("h-full transition-all duration-1000 ease-out", item.color)} />
                                                </div>
                                            </div>
                                        );
                                    })}
                                </div>

                                <div className="mt-4 pt-4 border-t border-border/50 grid grid-cols-2 gap-4">
                                    <div className="text-center">
                                        <span className="text-xs text-muted-foreground uppercase tracking-wider">Total Volume</span>
                                        <p className="text-2xl font-black text-foreground">{data.platforms[selectedPlatform].totalVolume.toLocaleString()}</p>
                                    </div>
                                    <div className="text-center">
                                        <span className="text-xs text-muted-foreground uppercase tracking-wider">Engagement</span>
                                        <p className="text-2xl font-black text-foreground">{data.platforms[selectedPlatform].engagementFactor}</p>
                                    </div>
                                </div>
                            </div>
                        ) : (
                            <div className="text-center space-y-4 opacity-50">
                                <BarChart2 size={48} className="mx-auto text-muted-foreground" />
                                <p className="text-lg font-medium text-muted-foreground">Select a platform from the chart to view detailed sentiment breakdown.</p>
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
}

function TrendingUpIcon() {
    return (
        <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-primary">
            <polyline points="23 6 13.5 15.5 8.5 10.5 1 18"></polyline>
            <polyline points="17 6 23 6 23 12"></polyline>
        </svg>
    );
}
