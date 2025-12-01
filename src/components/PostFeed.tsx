'use client';

import { useState } from 'react';
import { MessageCircle, ThumbsUp, TrendingUp, AlertCircle, Newspaper, Youtube, X, ExternalLink, Twitter } from 'lucide-react';
import clsx from 'clsx';

interface Post {
    _id: string;
    source?: string;
    url?: string;
    content: string;
    author: string;
    timestamp: string;
    metrics: {
        upvotes: number;
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
            case 'twitter': return <Twitter size={16} className="text-blue-400" />;
            case 'youtube': return <Youtube size={16} className="text-red-500" />;
            case 'news': return <Newspaper size={16} className="text-purple-400" />;
            case 'reddit':
            default: return <div className="w-4 h-4 rounded-full bg-orange-500 flex items-center justify-center text-[10px] font-bold text-white">R</div>;
        }
    };

    const getSentimentColor = (score: number) => {
        if (score > 0.05) return "text-green-400 border-green-500/20 bg-green-500/10";
        if (score < -0.05) return "text-red-400 border-red-500/20 bg-red-500/10";
        return "text-slate-400 border-slate-700 bg-slate-800";
    };

    return (
        <>
            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
                {posts.map((post) => (
                    <div
                        key={post._id}
                        onClick={() => setSelectedPost(post)}
                        className="bg-slate-900 border border-slate-800 p-4 rounded-xl hover:border-slate-600 transition-all cursor-pointer hover:shadow-lg hover:-translate-y-1"
                    >
                        <div className="flex justify-between items-start mb-3">
                            <div className="flex items-center gap-2">
                                {getPlatformIcon(post.source)}
                                <span className="font-bold text-slate-200 text-sm truncate max-w-[100px]">{post.author}</span>
                            </div>
                            <span className={clsx("text-[10px] font-bold px-2 py-0.5 rounded-full border", getSentimentColor(post.analysis?.sentiment_score || 0))}>
                                {(post.analysis?.sentiment_score || 0) > 0.05 ? "Positive" : (post.analysis?.sentiment_score || 0) < -0.05 ? "Negative" : "Neutral"}
                            </span>
                        </div>

                        <p className="text-slate-300 text-sm mb-4 line-clamp-3 leading-relaxed">{post.content}</p>

                        <div className="flex items-center justify-between text-slate-500 text-xs mt-auto">
                            <div className="flex gap-3">
                                <div className="flex items-center gap-1">
                                    <ThumbsUp size={12} /> {post.metrics.upvotes}
                                </div>
                                <div className="flex items-center gap-1">
                                    <MessageCircle size={12} /> {post.metrics.comments}
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
                        className="bg-slate-800 hover:bg-slate-700 text-white px-6 py-2 rounded-full text-sm font-bold transition-colors border border-slate-700"
                    >
                        Load More
                    </button>
                </div>
            )}

            {/* Modal */}
            {selectedPost && (
                <div className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center z-50 p-4" onClick={() => setSelectedPost(null)}>
                    <div className="bg-slate-900 border border-slate-700 rounded-2xl p-6 max-w-2xl w-full shadow-2xl relative" onClick={e => e.stopPropagation()}>
                        <button
                            onClick={() => setSelectedPost(null)}
                            className="absolute top-4 right-4 text-slate-400 hover:text-white"
                        >
                            <X size={24} />
                        </button>

                        <div className="flex items-center gap-3 mb-6">
                            <div className="p-2 bg-slate-800 rounded-lg">
                                {getPlatformIcon(selectedPost.source)}
                            </div>
                            <div>
                                <h3 className="text-lg font-bold text-white">{selectedPost.author}</h3>
                                <p className="text-slate-400 text-sm capitalize">{selectedPost.source || 'Unknown Platform'}</p>
                            </div>
                            {selectedPost.url && (
                                <a
                                    href={selectedPost.url}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="ml-auto flex items-center gap-2 text-blue-400 hover:text-blue-300 text-sm font-bold bg-blue-500/10 px-3 py-1.5 rounded-lg transition-colors"
                                >
                                    Open Original <ExternalLink size={14} />
                                </a>
                            )}
                        </div>

                        <div className="bg-slate-800/50 p-6 rounded-xl border border-slate-700/50 mb-6">
                            <p className="text-slate-200 text-lg leading-relaxed">{selectedPost.content}</p>
                        </div>

                        <div className="grid grid-cols-2 gap-4 mb-6">
                            <div className="bg-slate-800 p-4 rounded-xl">
                                <p className="text-slate-400 text-xs uppercase font-bold mb-1">Sentiment Score</p>
                                <div className="flex items-center gap-2">
                                    <span className={clsx("text-2xl font-bold", getSentimentColor(selectedPost.analysis?.sentiment_score || 0))}>
                                        {(selectedPost.analysis?.sentiment_score || 0).toFixed(2)}
                                    </span>
                                    <span className="text-sm text-slate-500">
                                        ({(selectedPost.analysis?.sentiment_score || 0) > 0.05 ? "Positive" : (selectedPost.analysis?.sentiment_score || 0) < -0.05 ? "Negative" : "Neutral"})
                                    </span>
                                </div>
                            </div>
                            <div className="bg-slate-800 p-4 rounded-xl">
                                <p className="text-slate-400 text-xs uppercase font-bold mb-1">Category</p>
                                <div className="flex items-center gap-2">
                                    <TrendingUp size={20} className="text-orange-400" />
                                    <span className="text-xl font-bold text-white">{selectedPost.analysis?.category || 'General'}</span>
                                </div>
                            </div>
                        </div>

                        {selectedPost.analysis?.detected_keywords && selectedPost.analysis.detected_keywords.length > 0 && (
                            <div>
                                <p className="text-slate-400 text-xs uppercase font-bold mb-2">Detected Keywords</p>
                                <div className="flex flex-wrap gap-2">
                                    {selectedPost.analysis.detected_keywords.map((kw, i) => (
                                        <span key={i} className="bg-slate-800 text-slate-300 px-3 py-1 rounded-full text-sm border border-slate-700">
                                            #{kw}
                                        </span>
                                    ))}
                                </div>
                            </div>
                        )}
                    </div>
                </div>
            )}
        </>
    );
}
