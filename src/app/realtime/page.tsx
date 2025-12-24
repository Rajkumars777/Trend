'use client';

import { useEffect, useState, useCallback } from 'react';
import PostFeed from '@/components/PostFeed';
import { Loader2, Radio, Filter, Calendar, Twitter, MessageCircle, Youtube, Newspaper, Facebook, Instagram, Linkedin } from 'lucide-react';

export default function RealtimePage() {
    const [posts, setPosts] = useState<any[]>([]);
    const [counts, setCounts] = useState<Record<string, number>>({});

    // Filters
    const [filters, setFilters] = useState({
        platform: 'All',
        sentiment: 'All',
        startDate: '',
        endDate: ''
    });

    const [page, setPage] = useState(1);
    const [hasMore, setHasMore] = useState(true);
    const [loading, setLoading] = useState(true);
    const [loadingPosts, setLoadingPosts] = useState(false);

    const fetchPosts = useCallback(async (pageNum: number, currentFilters: typeof filters, reset: boolean = false) => {
        if (loadingPosts && !reset) return; // Allow overlapping requests if resetting (filtering)
        setLoadingPosts(true);
        try {
            const query = new URLSearchParams({
                page: pageNum.toString(),
                limit: '20',
                sentiment: currentFilters.sentiment,
                platform: currentFilters.platform,
                startDate: currentFilters.startDate,
                endDate: currentFilters.endDate
            });

            const res = await fetch(`/api/posts?${query}`);
            const data = await res.json();

            setCounts(data.counts || {});

            if (reset) {
                setPosts(data.posts || []);
            } else {
                setPosts(prev => [...prev, ...(data.posts || [])]);
            }

            if (data.pagination) {
                setHasMore(data.pagination.page < data.pagination.pages);
            } else {
                setHasMore(false);
            }
        } catch (e) {
            console.error("Failed to fetch posts", e);
        } finally {
            setLoadingPosts(false);
            setLoading(false);
        }
    }, []);

    // Initial Load & Auto-Refresh
    useEffect(() => {
        fetchPosts(1, filters, true);

        const interval = setInterval(() => {
            // Only auto-refresh filters are default to avoid jarring updates while searching
            if (filters.platform === 'All' && !filters.startDate) {
                console.log("Auto-refreshing feed...");
                fetchPosts(1, filters, true);
            }
        }, 30000);

        return () => clearInterval(interval);
    }, []); // Run once on mount

    // Trigger fetch when filters change
    useEffect(() => {
        setPage(1);
        fetchPosts(1, filters, true);
    }, [filters]);

    const handleLoadMore = () => {
        const nextPage = page + 1;
        setPage(nextPage);
        fetchPosts(nextPage, filters);
    };

    const handleFilterChange = (key: keyof typeof filters, value: string) => {
        setFilters(prev => ({ ...prev, [key]: value }));
    };

    const PlatformCard = ({ name, icon: Icon, color }: { name: string, icon: any, color: string }) => {
        const count = counts[name.toLowerCase()] || 0;
        return (
            <div
                onClick={() => handleFilterChange('platform', name)}
                className={`bg-white dark:bg-slate-900/50 backdrop-blur-md border border-slate-200 dark:border-slate-800 rounded-2xl p-5 flex items-center gap-5 cursor-pointer hover:bg-slate-50 dark:hover:bg-slate-800/60 hover:border-blue-500/50 hover:shadow-lg hover:shadow-blue-500/10 transition-all duration-300 group`}
            >
                <div className={`p-3.5 rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 group-hover:scale-110 group-hover:rotate-3 transition-transform duration-500 shadow-sm dark:shadow-inner`}>
                    <Icon className="" size={28} style={{ color: color }} />
                </div>
                <div>
                    <p className="text-slate-500 dark:text-slate-400 text-xs font-bold uppercase tracking-widest mb-1 group-hover:text-blue-500 dark:group-hover:text-blue-400 transition-colors">{name}</p>
                    <p className="text-3xl font-black text-slate-900 dark:text-white tracking-tight">{count.toLocaleString()}</p>
                </div>
            </div>
        );
    };

    if (loading) {
        return (
            <div className="flex h-full items-center justify-center">
                <Loader2 className="animate-spin text-blue-500" size={48} />
            </div>
        );
    }

    return (
        <div className="space-y-10 pb-12 w-full px-6">
            {/* Header */}
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                <div>
                    <h2 className="text-4xl font-black text-transparent bg-clip-text bg-gradient-to-r from-blue-600 to-emerald-600 dark:from-blue-400 dark:to-emerald-400 flex items-center gap-3">
                        <Radio className="text-red-500 animate-pulse" size={32} />
                        Real-time Intelligence
                    </h2>
                    <p className="text-slate-600 dark:text-slate-400 mt-2 text-lg font-light">Live stream of social media discussions, news, and market signals.</p>
                </div>
                <div className="flex items-center gap-2 text-sm text-emerald-600 dark:text-emerald-400 bg-emerald-100 dark:bg-emerald-500/10 px-4 py-1.5 rounded-full border border-emerald-200 dark:border-emerald-500/20 shadow-sm dark:shadow-[0_0_15px_rgba(16,185,129,0.2)]">
                    <span className="relative flex h-2 w-2">
                        <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-500 dark:bg-emerald-400 opacity-75"></span>
                        <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-600 dark:bg-emerald-500"></span>
                    </span>
                    <span className="font-semibold tracking-wide">LIVE FEED ACTIVE</span>
                </div>
            </div>

            {/* Platform Stats */}
            <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-6 gap-6">
                <PlatformCard name="Reddit" icon={MessageCircle} color="#FB923C" />
                <PlatformCard name="YouTube" icon={Youtube} color="#EF4444" />
                <PlatformCard name="News" icon={Newspaper} color="#A3A3A3" />
                <PlatformCard name="Facebook" icon={Facebook} color="#1877F2" />
                <PlatformCard name="Instagram" icon={Instagram} color="#E4405F" />
                <PlatformCard name="LinkedIn" icon={Linkedin} color="#0A66C2" />
            </div>

            {/* Filter Toolbar */}
            <div className="bg-white/80 dark:bg-slate-900/60 backdrop-blur-xl border border-slate-200 dark:border-slate-800 rounded-2xl p-4 md:p-2 flex flex-col md:flex-row gap-4 md:gap-3 items-stretch md:items-center shadow-lg dark:shadow-2xl sticky top-4 z-40 transition-colors">
                <div className="flex items-center justify-center md:justify-start gap-2 text-slate-700 dark:text-slate-300 font-bold px-4 py-2 border-b md:border-b-0 md:border-r border-slate-200 dark:border-slate-800 md:mr-2">
                    <Filter size={20} className="text-blue-500" />
                    Filters
                </div>

                <select
                    value={filters.platform}
                    onChange={(e) => handleFilterChange('platform', e.target.value)}
                    className="bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 text-slate-900 dark:text-slate-300 rounded-xl px-4 py-2.5 text-sm focus:ring-2 focus:ring-blue-500/50 focus:border-blue-500 transition-all outline-none hover:border-slate-300 dark:hover:border-slate-700 cursor-pointer w-full md:w-auto"
                >
                    <option value="All">All Platforms</option>
                    <option value="Reddit">Reddit</option>
                    <option value="YouTube">YouTube</option>
                    <option value="News">News</option>
                    <option value="Facebook">Facebook</option>
                    <option value="Instagram">Instagram</option>
                    <option value="LinkedIn">LinkedIn</option>
                </select>

                <select
                    value={filters.sentiment}
                    onChange={(e) => handleFilterChange('sentiment', e.target.value)}
                    className="bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 text-slate-900 dark:text-slate-300 rounded-xl px-4 py-2.5 text-sm focus:ring-2 focus:ring-blue-500/50 focus:border-blue-500 transition-all outline-none hover:border-slate-300 dark:hover:border-slate-700 cursor-pointer w-full md:w-auto"
                >
                    <option value="All">All Sentiments</option>
                    <option value="Positive">Positive</option>
                    <option value="Neutral">Neutral</option>
                    <option value="Negative">Negative</option>
                </select>

                <div className="flex items-center justify-between md:justify-start gap-2 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl px-4 py-2.5 hover:border-slate-300 dark:hover:border-slate-700 transition-colors w-full md:w-auto">
                    <Calendar size={16} className="text-slate-500 shrink-0" />
                    <input
                        type="date"
                        value={filters.startDate}
                        onChange={(e) => handleFilterChange('startDate', e.target.value)}
                        className="bg-transparent text-sm text-slate-900 dark:text-slate-300 focus:outline-none flex-1 min-w-0 md:w-32 dark:[color-scheme:dark]"
                    />
                    <span className="text-slate-400 dark:text-slate-600 shrink-0">-</span>
                    <input
                        type="date"
                        value={filters.endDate}
                        onChange={(e) => handleFilterChange('endDate', e.target.value)}
                        className="bg-transparent text-sm text-slate-900 dark:text-slate-300 focus:outline-none flex-1 min-w-0 md:w-32 dark:[color-scheme:dark]"
                    />
                </div>

                {/* Clear Filters */}
                {(filters.platform !== 'All' || filters.sentiment !== 'All' || filters.startDate) && (
                    <button
                        onClick={() => setFilters({ platform: 'All', sentiment: 'All', startDate: '', endDate: '' })}
                        className="text-xs text-red-500 dark:text-red-400 hover:text-red-600 dark:hover:text-red-300 hover:bg-red-50 dark:hover:bg-red-500/10 px-4 py-2 rounded-xl transition-all md:ml-auto font-bold border border-transparent hover:border-red-200 dark:hover:border-red-500/20 w-full md:w-auto"
                    >
                        Reset
                    </button>
                )}
            </div>

            <PostFeed posts={posts} onLoadMore={handleLoadMore} hasMore={hasMore} />
        </div>
    );
}

