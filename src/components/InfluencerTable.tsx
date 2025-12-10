'use client';

import { User, Twitter, MessageCircle, Trophy, TrendingUp, ExternalLink } from 'lucide-react';

const INFLUENCERS = [
    { name: 'AgriTech Daily', handle: '@agritech_daily', platform: 'twitter', reach: '1.2M', sentiment: 'Positive', engagement: 92, profileUrl: 'https://twitter.com/agritech_daily' },
    { name: 'Farming Future', handle: '@farming_future', platform: 'reddit', reach: '850K', sentiment: 'Neutral', engagement: 78, profileUrl: 'https://www.reddit.com/user/farming_future' },
    { name: 'Green Growth', handle: '@greengrowth', platform: 'twitter', reach: '500K', sentiment: 'Very Positive', engagement: 88, profileUrl: 'https://twitter.com/greengrowth' },
    { name: 'Crop Watch', handle: '@cropwatch_org', platform: 'reddit', reach: '320K', sentiment: 'Negative', engagement: 65, profileUrl: 'https://www.reddit.com/user/cropwatch_org' },
    { name: 'Sustainable Life', handle: '@sust_life', platform: 'twitter', reach: '210K', sentiment: 'Positive', engagement: 72, profileUrl: 'https://twitter.com/sust_life' },
];

export default function InfluencerTable({ influencers = INFLUENCERS }: { influencers?: any[] }) {
    const displayData = influencers.length > 0 ? influencers : INFLUENCERS;

    return (
        <div className="bg-card text-foreground border border-border rounded-2xl p-6 shadow-xl h-full flex flex-col relative overflow-hidden">
            {/* Background Glow */}
            <div className="absolute top-0 left-0 w-64 h-64 bg-primary/5 rounded-full blur-3xl -translate-y-1/2 -translate-x-1/2 pointer-events-none" />

            <div className="flex items-center justify-between mb-6 relative z-10">
                <div className="flex items-center gap-2">
                    <div className="p-2 bg-muted rounded-lg border border-border">
                        <Trophy size={20} className="text-primary" />
                    </div>
                    <h3 className="text-xl font-bold text-foreground">Top Influencers</h3>
                </div>

            </div>

            <div className="overflow-x-auto custom-scrollbar">
                <table className="w-full min-w-[600px] text-left">
                    <thead>
                        <tr className="text-xs text-muted-foreground uppercase tracking-wider border-b border-border">
                            <th className="py-2">Rank</th>
                            <th className="py-2">Influencer</th>
                            <th className="py-2 text-right">Reach</th>
                            <th className="py-2 text-center">Sentiment</th>
                            <th className="py-2 text-center">Profile</th>
                        </tr>
                    </thead>
                    <tbody>
                        {displayData.map((influencer, i) => (
                            <tr
                                key={i}
                                className="group border-b border-border/50 last:border-b-0 hover:bg-muted/30 transition-colors duration-200"
                            >
                                <td className="py-3">
                                    <div className={`
                                        w-8 h-8 rounded-lg flex items-center justify-center font-bold text-sm
                                        ${i === 0 ? 'bg-primary/10 text-primary border border-primary/20' :
                                            i === 1 ? 'bg-secondary/10 text-secondary-foreground border border-secondary/20' :
                                                i === 2 ? 'bg-orange-500/10 text-orange-500 border border-orange-500/20' :
                                                    'bg-muted text-muted-foreground'}
                                    `}>
                                        #{i + 1}
                                    </div>
                                </td>
                                <td className="py-3">
                                    <div className="flex items-center gap-3">
                                        <div className="w-8 h-8 rounded-full bg-gradient-to-tr from-primary to-blue-500 flex items-center justify-center text-xs font-bold text-white relative overflow-hidden group-hover:scale-110 transition-transform">
                                            {influencer.name.charAt(0)}
                                            {/* Platform Indicator Dot */}
                                            <div className={`absolute bottom-0 right-0 w-2.5 h-2.5 rounded-full border-2 border-card ${influencer.platform === 'twitter' ? 'bg-sky-500' :
                                                influencer.platform === 'youtube' ? 'bg-destructive' :
                                                    influencer.platform === 'reddit' ? 'bg-orange-600' : 'bg-muted-foreground'
                                                }`}></div>
                                        </div>
                                        <div className="flex flex-col min-w-0">
                                            <span className="text-sm font-semibold text-foreground truncate max-w-[120px]">{influencer.name}</span>
                                            <span className="text-xs text-muted-foreground truncate max-w-[120px] opacity-70 group-hover:opacity-100 transition-opacity">{influencer.handle}</span>
                                        </div>
                                    </div>
                                </td>
                                <td className="py-3 text-right text-sm text-foreground font-mono">{influencer.reach}</td>
                                <td className="py-3 text-center">
                                    <span className={`px-2 py-0.5 rounded-full text-[10px] uppercase font-bold tracking-wide border ${influencer.sentiment === 'Positive' || influencer.sentiment === 'Very Positive' ? 'bg-green-500/10 text-green-500 border-green-500/20' :
                                        influencer.sentiment === 'Negative' ? 'bg-destructive/10 text-destructive border-destructive/20' :
                                            'bg-muted/50 text-muted-foreground border-border'
                                        }`}>
                                        {influencer.sentiment}
                                    </span>
                                </td>
                                <td className="py-3 text-center">
                                    <a
                                        href={influencer.profileUrl || '#'}
                                        target="_blank"
                                        rel="noopener noreferrer"
                                        className="inline-flex items-center justify-center w-8 h-8 rounded-lg bg-primary/10 text-primary hover:bg-primary hover:text-white transition-all transform hover:scale-105"
                                        title="View Profile"
                                    >
                                        <ExternalLink size={14} />
                                    </a>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>

            <div className="mt-4 pt-4 border-t border-border flex justify-between items-center">
                <span className="text-xs text-muted-foreground">Based on recent activity</span>

            </div>
        </div>
    );
}
