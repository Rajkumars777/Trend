'use client';

import { useState } from 'react';
import { MessageCircle, ThumbsUp, TrendingUp, AlertCircle, Newspaper, Youtube, X, ExternalLink, Twitter, Facebook, Instagram, Linkedin, Eye } from 'lucide-react';
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
        switch (source?.toLowerCase()) {
            case 'twitter': return <Twitter size={18} className="text-[#1DA1F2]" />; // Twitter Blue
            case 'youtube': return <Youtube size={18} className="text-[#FF0000]" />; // YouTube Red
            case 'reddit': return <MessageCircle size={18} className="text-[#FF4500]" />; // Reddit Orange (using MessageCircle as generic for Reddit if no specific logo, or could use generic)
            case 'facebook': return <Facebook size={18} className="text-[#1877F2]" />; // Facebook Blue
            case 'instagram': return <Instagram size={18} className="text-[#E4405F]" />; // Instagram Pink
            case 'linkedin': return <Linkedin size={18} className="text-[#0A66C2]" />; // LinkedIn Blue
            case 'news': return <Newspaper size={18} className="text-slate-500" />;
            case 'lemmy': return <div className="w-5 h-5 rounded-md bg-slate-700 text-white flex items-center justify-center text-[10px] font-bold">L</div>; // Custom Lemmy
            default: return <div className="w-5 h-5 rounded-md bg-slate-200 dark:bg-slate-700 flex items-center justify-center text-[10px] font-bold text-slate-500">?</div>;
        }
    };

    const getSentimentColor = (score: number) => {
        if (score > 0.05) return "text-positive border-positive/20 bg-positive/10";
        if (score < -0.05) return "text-negative border-negative/20 bg-negative/10";
        return "text-neutral border-neutral/20 bg-card/50";
    };


    const getPlatformColor = (source: string | undefined) => {
        switch (source?.toLowerCase()) {
            case 'youtube': return 'bg-red-500 text-red-600 border-red-200';
            case 'reddit': return 'bg-orange-500 text-orange-600 border-orange-200';
            case 'twitter': return 'bg-[#1DA1F2] text-[#1DA1F2] border-sky-200';
            case 'facebook': return 'bg-[#1877F2] text-[#1877F2] border-blue-200';
            case 'linkedin': return 'bg-[#0A66C2] text-[#0A66C2] border-indigo-200';
            case 'instagram': return 'bg-[#E4405F] text-[#E4405F] border-pink-200';
            default: return 'bg-slate-500 text-slate-600 border-slate-200';
        }
    };

    const getPlatformBadgeFields = (source: string | undefined) => {
        switch (source?.toLowerCase()) {
            case 'youtube': return { bg: 'bg-red-50', text: 'text-red-700', border: 'border-red-100', stripe: 'bg-red-500' };
            case 'reddit': return { bg: 'bg-orange-50', text: 'text-orange-700', border: 'border-orange-100', stripe: 'bg-orange-500' };
            case 'twitter': return { bg: 'bg-sky-50', text: 'text-sky-700', border: 'border-sky-100', stripe: 'bg-[#1DA1F2]' };
            case 'facebook': return { bg: 'bg-blue-50', text: 'text-blue-700', border: 'border-blue-100', stripe: 'bg-[#1877F2]' };
            case 'linkedin': return { bg: 'bg-indigo-50', text: 'text-indigo-700', border: 'border-indigo-100', stripe: 'bg-[#0A66C2]' };
            case 'instagram': return { bg: 'bg-pink-50', text: 'text-pink-700', border: 'border-pink-100', stripe: 'bg-[#E4405F]' };
            default: return { bg: 'bg-slate-50', text: 'text-slate-700', border: 'border-slate-100', stripe: 'bg-slate-500' };
        }
    };

    const theme = selectedPost ? getPlatformBadgeFields(selectedPost.source) : { bg: '', text: '', border: '', stripe: '' };

    return (
        <>
            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
                {posts.map((post) => (
                    <div
                        key={post._id}
                        onClick={() => setSelectedPost(post)}
                        className="group relative overflow-hidden bg-white/80 dark:bg-slate-900/40 backdrop-blur-xl border border-slate-200 dark:border-slate-800 p-6 rounded-2xl hover:border-blue-500/30 transition-all duration-300 cursor-pointer hover:shadow-2xl hover:shadow-blue-500/10 hover:-translate-y-1"
                    >
                        <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-transparent via-blue-500/50 to-transparent opacity-0 group-hover:opacity-100 transition-opacity"></div>

                        <div className="flex justify-between items-start mb-4">
                            <div className="flex items-center gap-3">
                                <div className="p-2 bg-slate-100 dark:bg-slate-800 rounded-full group-hover:scale-110 transition-transform">
                                    {getPlatformIcon(post.source)}
                                </div>
                                <div>
                                    <h4 className="font-bold text-slate-900 dark:text-slate-100 text-sm truncate max-w-[140px] leading-tight group-hover:text-blue-500 transition-colors">
                                        {post.author}
                                    </h4>
                                    <p className="text-[10px] text-slate-500 dark:text-slate-400 font-medium capitalize mt-0.5">
                                        {post.source || 'Unknown'} • {new Date(post.timestamp).toLocaleDateString()}
                                    </p>
                                </div>
                            </div>
                            <span className={clsx("text-[10px] font-black uppercase tracking-wider px-2.5 py-1 rounded-full border shadow-sm", getSentimentColor(post.analysis?.sentiment_score || 0))}>
                                {(post.analysis?.sentiment_score || 0) > 0.05 ? "Pos" : (post.analysis?.sentiment_score || 0) < -0.05 ? "Neg" : "Neu"}
                            </span>
                        </div>

                        <p className="text-slate-600 dark:text-slate-300 text-sm mb-6 line-clamp-3 leading-relaxed font-normal group-hover:text-slate-900 dark:group-hover:text-white transition-colors">
                            {post.content}
                        </p>

                        <div className="flex items-center justify-between pt-4 border-t border-slate-100 dark:border-slate-800/50">
                            <div className="flex gap-4 text-slate-400 dark:text-slate-500 text-xs font-semibold">
                                <span className="flex items-center gap-1.5 group-hover:text-blue-500 transition-colors">
                                    <ThumbsUp size={14} /> {post.metrics?.upvotes || 0}
                                </span>
                                <span className="flex items-center gap-1.5 group-hover:text-emerald-500 transition-colors">
                                    <MessageCircle size={14} /> {post.metrics?.comments || 0}
                                </span>
                            </div>

                            <div className="opacity-0 group-hover:opacity-100 transition-opacity text-blue-500 text-xs font-bold flex items-center gap-1">
                                Read More <ExternalLink size={10} />
                            </div>
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
                <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-md flex items-center justify-center z-50 p-4 animate-in fade-in duration-200" onClick={() => setSelectedPost(null)}>
                    <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-0 max-w-2xl w-full shadow-2xl relative overflow-hidden flex flex-col max-h-[90vh]" onClick={e => e.stopPropagation()}>

                        {/* Platform Header Stripe */}
                        <div className={`h-2 w-full ${theme.stripe}`}></div>

                        <div className="p-8 pb-0">
                            <div className="flex items-center justify-between mb-6">
                                <div className="flex items-center gap-4">
                                    <div className={`p-3 rounded-2xl ${theme.bg} ${theme.text}`}>
                                        {getPlatformIcon(selectedPost.source)}
                                    </div>
                                    <div>
                                        <h3 className="text-xl font-black text-slate-900 dark:text-white leading-tight">{selectedPost.author}</h3>
                                        <div className="flex items-center gap-2 mt-1">
                                            <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full uppercase tracking-wider ${theme.bg} ${theme.text} ${theme.border} border`}>
                                                {selectedPost.source || 'Platform'}
                                            </span>
                                            <span className="text-xs text-slate-400 font-medium">{new Date(selectedPost.timestamp).toLocaleString()}</span>
                                        </div>
                                    </div>
                                </div>
                                <button
                                    onClick={() => setSelectedPost(null)}
                                    className="p-2 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-full transition-colors text-slate-400 hover:text-slate-600"
                                >
                                    <X size={24} />
                                </button>
                            </div>

                            {/* Scrollable Content Area */}
                            <div className="bg-slate-50 dark:bg-slate-950/50 p-6 rounded-2xl border border-slate-100 dark:border-slate-800 mb-6 max-h-[300px] overflow-y-auto custom-scrollbar">
                                <p className="text-slate-700 dark:text-slate-300 text-base leading-7 whitespace-pre-line">{selectedPost.content}</p>
                            </div>
                        </div>

                        {/* Footer / Metrics (Fixed at bottom or scrollable with main if needed, but keeping fixed is nicer) */}
                        <div className="p-8 pt-0 overflow-y-auto custom-scrollbar">
                            {/* ENGAGEMENT METRICS SECTION */}
                            <div className="grid grid-cols-2 gap-4 mb-6">
                                <div className="bg-white dark:bg-slate-800/50 border border-slate-100 dark:border-slate-700 p-4 rounded-xl">
                                    <p className="text-slate-400 text-[10px] uppercase font-bold mb-3 tracking-widest">Engagement</p>
                                    <div className="flex items-center justify-between gap-4">

                                        {selectedPost.source === 'youtube' ? (
                                            <>
                                                <div className="flex flex-col items-center flex-1">
                                                    <span className="text-lg font-black text-slate-900 dark:text-white flex items-center gap-2">
                                                        <Eye size={18} className="text-slate-400" />
                                                        {((selectedPost.metrics?.views || 0) > 0 ? (selectedPost.metrics?.views || 0) : (selectedPost.metrics?.upvotes || 0)).toLocaleString()}
                                                    </span>
                                                    <span className="text-[10px] text-slate-400 font-bold uppercase mt-1">Views</span>
                                                </div>

                                                <div className="w-px h-8 bg-slate-200 dark:bg-slate-700"></div>

                                                <div className="flex flex-col items-center flex-1">
                                                    <span className="text-lg font-black text-slate-900 dark:text-white flex items-center gap-2">
                                                        <ThumbsUp size={18} className="text-blue-500" />
                                                        {(selectedPost.metrics?.likes || 0).toLocaleString()}
                                                    </span>
                                                    <span className="text-[10px] text-slate-400 font-bold uppercase mt-1">Likes</span>
                                                </div>
                                            </>
                                        ) : (
                                            <>
                                                <div className="flex flex-col items-center flex-1">
                                                    <span className="text-lg font-black text-slate-900 dark:text-white flex items-center gap-2">
                                                        <ThumbsUp size={18} className="text-emerald-500" />
                                                        {(selectedPost.metrics?.upvotes || selectedPost.metrics?.likes || 0).toLocaleString()}
                                                    </span>
                                                    <span className="text-[10px] text-slate-400 font-bold uppercase mt-1">
                                                        {selectedPost.source === 'reddit' ? 'Upvotes' : 'Likes'}
                                                    </span>
                                                </div>
                                            </>
                                        )}

                                        <div className="w-px h-8 bg-slate-200 dark:bg-slate-700"></div>

                                        <div className="flex flex-col items-center flex-1">
                                            <span className="text-lg font-black text-slate-900 dark:text-white flex items-center gap-2">
                                                <MessageCircle size={18} className="text-sky-500" />
                                                {(selectedPost.metrics?.comments || 0).toLocaleString()}
                                            </span>
                                            <span className="text-[10px] text-slate-400 font-bold uppercase mt-1">Comments</span>
                                        </div>
                                    </div>
                                </div>

                                <div className="bg-white dark:bg-slate-800/50 border border-slate-100 dark:border-slate-700 p-4 rounded-xl">
                                    <p className="text-slate-400 text-[10px] uppercase font-bold mb-3 tracking-widest">Analysis</p>
                                    <div className="space-y-3">
                                        <div className="flex justify-between items-center">
                                            <span className="text-xs font-semibold text-slate-500">Sentiment</span>
                                            <span className={clsx("text-sm font-black px-2 py-0.5 rounded-md bg-opacity-20", getSentimentColor(selectedPost.analysis?.sentiment_score || 0))}>
                                                {(selectedPost.analysis?.sentiment_score || 0).toFixed(2)}
                                            </span>
                                        </div>
                                        <div className="flex justify-between items-center">
                                            <span className="text-xs font-semibold text-slate-500">Category</span>
                                            <span className="text-sm font-bold text-slate-900 dark:text-white flex items-center gap-1">
                                                <TrendingUp size={14} className="text-purple-500" />
                                                {selectedPost.analysis?.category || 'General'}
                                            </span>
                                        </div>
                                    </div>
                                </div>
                            </div>

                            {selectedPost.url && (
                                <a
                                    href={selectedPost.url}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="w-full flex items-center justify-center gap-2 bg-slate-900 dark:bg-white text-white dark:text-slate-900 hover:bg-slate-800 dark:hover:bg-slate-200 font-bold py-3 rounded-xl transition-colors mb-2"
                                >
                                    Open Original Post <ExternalLink size={16} />
                                </a>
                            )}
                        </div>
                    </div>
                </div >
            )
            }
        </>
    );
}
