'use client';

import { useEffect, useState, useCallback } from 'react';
import PostFeed from '@/components/PostFeed';
import SentimentAnalysis from '@/components/SentimentAnalysis';
import SentimentPlatformDetails from '@/components/SentimentPlatformDetails';
import { Loader2 } from 'lucide-react';

export default function SentimentPage() {
    const [stats, setStats] = useState<{ sentimentDist: any[], sentimentByPlatform: any[], sentimentByCategory: any[] }>({
        sentimentDist: [],
        sentimentByPlatform: [],
        sentimentByCategory: []
    });

    const [platformDetails, setPlatformDetails] = useState<any>(null);

    // Feed State
    const [posts, setPosts] = useState<any[]>([]);
    const [page, setPage] = useState(1);
    const [hasMore, setHasMore] = useState(true);
    const [selectedSentiment, setSelectedSentiment] = useState<string | null>(null);
    const [loading, setLoading] = useState(true);
    const [loadingPosts, setLoadingPosts] = useState(false);

    useEffect(() => {
        async function fetchStats() {
            try {
                // Fetch Overview Stats
                const trendsRes = await fetch('/api/trends');
                const trendsData = await trendsRes.json();
                setStats({
                    sentimentDist: trendsData.sentimentDist || [],
                    sentimentByPlatform: trendsData.sentimentByPlatform || [],
                    sentimentByCategory: trendsData.sentimentByCategory || []
                });

                // Fetch Detailed Platform Stats
                const detailsRes = await fetch('/api/sentiment-details');
                const detailsData = await detailsRes.json();
                setPlatformDetails(detailsData);

            } catch (e) {
                console.error("Failed to fetch stats", e);
            } finally {
                setLoading(false);
            }
        }
        fetchStats();
    }, []);

    const fetchPosts = useCallback(async (pageNum: number, sentiment: string | null, reset: boolean = false) => {
        if (loadingPosts) return;
        setLoadingPosts(true);
        try {
            const query = new URLSearchParams({
                page: pageNum.toString(),
                limit: '12',
                sentiment: sentiment || 'All'
            });

            const res = await fetch(`/api/posts?${query}`);
            const data = await res.json();

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
        }
    }, []);

    // Initial Load & Filter Change
    useEffect(() => {
        setPage(1);
        fetchPosts(1, selectedSentiment, true);
    }, [selectedSentiment]);

    const handleLoadMore = () => {
        const nextPage = page + 1;
        setPage(nextPage);
        fetchPosts(nextPage, selectedSentiment);
    };

    if (loading) {
        return (
            <div className="flex h-full items-center justify-center">
                <Loader2 className="animate-spin text-green-500" size={48} />
            </div>
        );
    }

    return (
        <div className="space-y-6 pb-10">
            <div>
                <h2 className="text-3xl font-bold text-foreground">Voice of the Customer</h2>
                <p className="text-neutral mt-2">Analyze farmer sentiment across different categories and platforms.</p>
            </div>

            {/* Sentiment Overview Widget */}
            <div className="min-h-[350px]">
                <SentimentAnalysis
                    distData={stats.sentimentDist}
                    platformData={stats.sentimentByPlatform}
                    categoryData={stats.sentimentByCategory}
                    selectedSentiment={selectedSentiment}
                    onFilter={(s) => setSelectedSentiment(s === 'All' ? null : s)}
                />
            </div>

            {/* New: Detailed Platform Analysis */}
            {platformDetails && (
                <div className="animate-in slide-in-from-bottom-5 duration-700">
                    <h3 className="text-xl font-bold text-foreground mb-4 border-l-4 border-primary pl-3">Platform-wise Deep Dive</h3>
                    <SentimentPlatformDetails data={platformDetails} />
                </div>
            )}

            {/* Live Feed */}
            <div>
                <h3 className="text-xl font-bold text-foreground mb-4">Live Discussion Feed</h3>
                <PostFeed posts={posts} onLoadMore={handleLoadMore} hasMore={hasMore} />
            </div>
        </div>
    );
}
