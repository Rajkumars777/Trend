'use client';

import { useState } from 'react';
import { MessageCircle, ThumbsUp, TrendingUp, AlertCircle, Newspaper, Youtube, X, ExternalLink, Twitter, Eye } from 'lucide-react';
import clsx from 'clsx';

interface Post {
    _id: string;
    source?: string;
    url?: string;
    content: string;
    author: string;
    timestamp: string;
    metrics: {
        upvotes?: number;
        likes?: number;
        views?: number;
        comments: number;
    };
    analysis: {
        sentiment_score: number;
        category: string;
        detected_location?: string;
        detected_keywords?: string[];
        vader_details?: any;
    };
}

export default function PostFeed({ posts, onLoadMore, hasMore }: { posts: Post[], onLoadMore?: () => void, hasMore?: boolean }) {
    const [selectedPost, setSelectedPost] = useState<Post | null>(null);

    const getPlatformIcon = (source: string | undefined) => {
        switch (source) {
            case 'twitter': return <Twitter size={16} className="text-primary" />;
            case 'youtube': return <Youtube size={16} className="text-negative" />;
            case 'news': return <Newspaper size={16} className="text-accent" />;
            case 'reddit':
            default: return <div className="w-4 h-4 rounded-full bg-accent flex items-center justify-center text-[10px] font-bold text-black">R</div>;
        }
    };

    const getSentimentColor = (score: number) => {
        if (score > 0.05) return "text-positive border-positive/20 bg-positive/10";
        if (score < -0.05) return "text-negative border-negative/20 bg-negative/10";
        return "text-neutral border-neutral/20 bg-card/50";
    };

    return (
        <>
            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
                {posts.map((post) => (
                    <div
                        key={post._id}
                        onClick={() => setSelectedPost(post)}
                        className="bg-card border border-neutral/20 p-4 rounded-xl hover:border-neutral/40 transition-all cursor-pointer hover:shadow-lg hover:-translate-y-1"
                    >
                        <div className="flex justify-between items-start mb-3">
                            <div className="flex items-center gap-2">
                                {getPlatformIcon(post.source)}
                                <span className="font-bold text-foreground text-sm truncate max-w-[100px]">{post.author}</span>
                            </div>
                            <span className={clsx("text-[10px] font-bold px-2 py-0.5 rounded-full border", getSentimentColor(post.analysis?.sentiment_score || 0))}>
                                {(post.analysis?.sentiment_score || 0) > 0.05 ? "Positive" : (post.analysis?.sentiment_score || 0) < -0.05 ? "Negative" : "Neutral"}
                            </span>
                        </div>

                        <p className="text-foreground/80 text-sm mb-4 line-clamp-3 leading-relaxed">{post.content}</p>

                        <div className="flex items-center justify-between text-neutral text-xs mt-auto">
                            <div className="flex gap-3">
                                <div className="flex items-center gap-1">
                                    <ThumbsUp size={12} /> {post.metrics?.upvotes || 0}
                                </div>
                                <div className="flex items-center gap-1">
                                    <MessageCircle size={12} /> {post.metrics?.comments || 0}
                                </div>
                            </div>
                            <span className="text-[10px]">{new Date(post.timestamp).toLocaleDateString()}</span>
                        </div>
                    </div>
                ))}
            </div>

            {hasMore && (
                <div className="flex justify-center mt-6">
                    <button
                        onClick={onLoadMore}
                        className="bg-card hover:bg-neutral/10 text-foreground px-6 py-2 rounded-full text-sm font-bold transition-colors border border-neutral/20"
                    >
                        Load More
                    </button>
                </div>
            )}

            {/* Modal */}
            {selectedPost && (
                <div className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center z-50 p-4" onClick={() => setSelectedPost(null)}>
                    <div className="bg-card border border-neutral/20 rounded-2xl p-6 max-w-2xl w-full shadow-2xl relative" onClick={e => e.stopPropagation()}>
                        <button
                            onClick={() => setSelectedPost(null)}
                            className="absolute top-4 right-4 text-neutral hover:text-foreground"
                        >
                            <X size={24} />
                        </button>

                        <div className="flex items-center gap-3 mb-6">
                            <div className="p-2 bg-neutral/10 rounded-lg">
                                {getPlatformIcon(selectedPost.source)}
                            </div>
                            <div>
                                <h3 className="text-lg font-bold text-foreground">{selectedPost.author}</h3>
                                <p className="text-neutral text-sm capitalize">{selectedPost.source || 'Unknown Platform'}</p>
                            </div>
                            {selectedPost.url && (
                                <a
                                    href={selectedPost.url}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="ml-auto flex items-center gap-2 text-primary hover:text-primary/80 text-sm font-bold bg-primary/10 px-3 py-1.5 rounded-lg transition-colors"
                                >
                                    Open Original <ExternalLink size={14} />
                                </a>
                            )}
                        </div>

                        <div className="bg-card/50 p-6 rounded-xl border border-neutral/10 mb-6">
                            <p className="text-foreground text-lg leading-relaxed">{selectedPost.content}</p>
                        </div>



                        {/* ENGAGEMENT METRICS SECTION */}
                        <div className="grid grid-cols-2 gap-4 mb-6">
                            <div className="bg-neutral/5 p-4 rounded-xl">
                                <p className="text-neutral text-xs uppercase font-bold mb-2">Engagement</p>
                                <div className="flex items-center justify-between gap-2">

                                    {selectedPost.source === 'youtube' ? (
                                        <>
                                            {/* YouTube Logic: Handle Legacy Data where upvotes might be views */}
                                            <div className="flex flex-col items-center">
                                                <span className="text-xl font-bold text-foreground flex items-center gap-1">
                                                    <Eye size={18} className="text-neutral" />
                                                    {((selectedPost.metrics?.views || 0) > 0 ? (selectedPost.metrics?.views || 0) : (selectedPost.metrics?.upvotes || 0)).toLocaleString()}
                                                </span>
                                                <span className="text-[10px] text-neutral font-medium uppercase mt-0.5">Views</span>
                                            </div>

                                            <div className="w-px h-8 bg-neutral/20"></div>

                                            <div className="flex flex-col items-center">
                                                <span className="text-xl font-bold text-foreground flex items-center gap-1">
                                                    <ThumbsUp size={18} className="text-primary" />
                                                    {(selectedPost.metrics?.likes || 0).toLocaleString()}
                                                </span>
                                                <span className="text-[10px] text-neutral font-medium uppercase mt-0.5">Likes</span>
                                            </div>
                                        </>
                                    ) : (
                                        <>
                                            {/* Standard/Reddit Logic */}
                                            <div className="flex flex-col items-center">
                                                <span className="text-xl font-bold text-foreground flex items-center gap-1">
                                                    <ThumbsUp size={18} className="text-primary" />
                                                    {(selectedPost.metrics?.upvotes || selectedPost.metrics?.likes || 0).toLocaleString()}
                                                </span>
                                                <span className="text-[10px] text-neutral font-medium uppercase mt-0.5">
                                                    {selectedPost.source === 'reddit' ? 'Upvotes' : 'Likes'}
                                                </span>
                                            </div>
                                        </>
                                    )}

                                    <div className="w-px h-8 bg-neutral/20"></div>

                                    {/* Comments */}
                                    <div className="flex flex-col items-center">
                                        <span className="text-xl font-bold text-foreground flex items-center gap-1">
                                            <MessageCircle size={18} className="text-sky-400" />
                                            {(selectedPost.metrics?.comments || 0).toLocaleString()}
                                        </span>
                                        <span className="text-[10px] text-neutral font-medium uppercase mt-0.5">Comments</span>
                                    </div>
                                </div>
                            </div>

                            <div className="bg-neutral/5 p-4 rounded-xl">
                                <p className="text-neutral text-xs uppercase font-bold mb-2">Info</p>
                                <div className="space-y-2">
                                    <div className="flex justify-between items-center text-sm">
                                        <span className="text-neutral">Date</span>
                                        <span className="font-bold text-foreground">
                                            {new Date(selectedPost.timestamp).toLocaleDateString('en-US', {
                                                year: 'numeric', month: 'short', day: 'numeric',
                                                hour: '2-digit', minute: '2-digit'
                                            })}
                                        </span>
                                    </div>
                                    <div className="flex justify-between items-center text-sm">
                                        <span className="text-neutral">Type</span>
                                        <span className="font-bold text-foreground capitalize flex items-center gap-1">
                                            {selectedPost.source === 'youtube' && <Youtube size={14} className="text-red-500" />}
                                            {selectedPost.source === 'reddit' && <div className="w-3 h-3 rounded-full bg-orange-500 text-[8px] flex items-center justify-center text-white">R</div>}
                                            {selectedPost.source || 'Standard'}
                                        </span>
                                    </div>
                                </div>
                            </div>
                        </div>

                        <div className="grid grid-cols-2 gap-4 mb-6">
                            <div className="bg-neutral/5 p-4 rounded-xl">
                                <p className="text-neutral text-xs uppercase font-bold mb-1">Sentiment Score</p>
                                <div className="flex items-center gap-2">
                                    <span className={clsx("text-2xl font-bold", getSentimentColor(selectedPost.analysis?.sentiment_score || 0).split(" ")[0])}>
                                        {(selectedPost.analysis?.sentiment_score || 0).toFixed(2)}
                                    </span>
                                    <span className="text-sm text-neutral">
                                        ({(selectedPost.analysis?.sentiment_score || 0) > 0.05 ? "Positive" : (selectedPost.analysis?.sentiment_score || 0) < -0.05 ? "Negative" : "Neutral"})
                                    </span>
                                </div>
                            </div>
                            <div className="bg-neutral/5 p-4 rounded-xl">
                                <p className="text-neutral text-xs uppercase font-bold mb-1">Category</p>
                                <div className="flex items-center gap-2">
                                    <TrendingUp size={20} className="text-accent" />
                                    <span className="text-xl font-bold text-foreground">{selectedPost.analysis?.category || 'General'}</span>
                                </div>
                            </div>
                        </div>

                        {selectedPost.analysis?.detected_keywords && selectedPost.analysis.detected_keywords.length > 0 && (
                            <div>
                                <p className="text-neutral text-xs uppercase font-bold mb-2">Detected Keywords</p>
                                <div className="flex flex-wrap gap-2">
                                    {selectedPost.analysis.detected_keywords.map((kw, i) => (
                                        <span key={i} className="bg-neutral/10 text-neutral px-3 py-1 rounded-full text-sm border border-neutral/20">
                                            #{kw}
                                        </span>
                                    ))}
                                </div>
                            </div>
                        )}
                    </div>
                </div >
            )
            }
        </>
    );
}
