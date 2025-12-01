'use client';

import { useEffect, useState, useCallback } from 'react';
import PostFeed from '@/components/PostFeed';
import { Loader2, Radio } from 'lucide-react';

export default function RealtimePage() {
    const [posts, setPosts] = useState<any[]>([]);
    const [page, setPage] = useState(1);
    const [hasMore, setHasMore] = useState(true);
    const [loading, setLoading] = useState(true);
    const [loadingPosts, setLoadingPosts] = useState(false);

    const fetchPosts = useCallback(async (pageNum: number, reset: boolean = false) => {
        if (loadingPosts) return;
        setLoadingPosts(true);
        try {
            const query = new URLSearchParams({
                page: pageNum.toString(),
                limit: '20', // Larger batch for realtime feed
                sentiment: 'All'
            });

            const res = await fetch(`/api/posts?${query}`);
            const data = await res.json();

            if (reset) {
                setPosts(data.posts || []);
            } else {
                setPosts(prev => [...prev, ...(data.posts || [])]);
            }

            setHasMore(data.pagination.page < data.pagination.pages);
        } catch (e) {
            console.error("Failed to fetch posts", e);
        } finally {
            setLoadingPosts(false);
            setLoading(false);
        }
    }, []);

    // Initial Load
    useEffect(() => {
        fetchPosts(1, true);

        // Auto-refresh every 30 seconds
        const interval = setInterval(() => {
            console.log("Auto-refreshing feed...");
            fetchPosts(1, true);
        }, 30000);

        return () => clearInterval(interval);
    }, []);

    const handleLoadMore = () => {
        const nextPage = page + 1;
        setPage(nextPage);
        fetchPosts(nextPage);
    };

    if (loading) {
        return (
            <div className="flex h-full items-center justify-center">
                <Loader2 className="animate-spin text-green-500" size={48} />
            </div>
        );
    }

    return (
        <div className="space-y-8">
            <div className="flex justify-between items-center">
                <div>
                    <h2 className="text-3xl font-bold text-white flex items-center gap-3">
                        <Radio className="text-red-500 animate-pulse" />
                        Real-time Intelligence Feed
                    </h2>
                    <p className="text-slate-400 mt-2">Live stream of social media discussions, news, and market signals.</p>
                </div>
                <div className="flex items-center gap-2 text-sm text-green-400 bg-green-500/10 px-3 py-1 rounded-full border border-green-500/20">
                    <span className="relative flex h-2 w-2">
                        <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75"></span>
                        <span className="relative inline-flex rounded-full h-2 w-2 bg-green-500"></span>
                    </span>
                    Live Connection Active
                </div>
            </div>

            <PostFeed posts={posts} onLoadMore={handleLoadMore} hasMore={hasMore} />
        </div>
    );
}
