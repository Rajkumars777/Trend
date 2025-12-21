'use client';

import { useState, useRef, useEffect } from 'react';
import { Send, Bot, User, Loader2, Sprout, Leaf } from 'lucide-react';
import clsx from 'clsx';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import SearchResultCard, { SearchResult } from './SearchResultCard';

interface Message {
    id: string;
    role: 'user' | 'assistant';
    content: string;
    timestamp: Date;
    sources?: any[]; // For RAG citations
    structuredResults?: SearchResult[];
}

export default function ChatInterface() {
    const [messages, setMessages] = useState<Message[]>([
        {
            id: '1',
            role: 'assistant',
            content: 'Hello! I am your Agri-Trend Assistant. I analyze thousands of social media posts to answer your questions about crop prices, weather, and market trends. How can I help you today?',
            timestamp: new Date()
        }
    ]);
    const [input, setInput] = useState('');
    const [loading, setLoading] = useState(false);
    const scrollRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        if (scrollRef.current) {
            scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
        }
    }, [messages]);

    const handleSend = async () => {
        if (!input.trim()) return;

        const userMsg: Message = {
            id: Date.now().toString(),
            role: 'user',
            content: input,
            timestamp: new Date()
        };

        setMessages(prev => [...prev, userMsg]);
        setInput('');
        setLoading(true);

        try {
            const response = await fetch('/api/chat', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ query: userMsg.content })
            });

            const data = await response.json();

            const botMsg: Message = {
                id: (Date.now() + 1).toString(),
                role: 'assistant',
                content: data.answer || "I'm sorry, I couldn't process that request right now.",
                timestamp: new Date(),
                sources: data.sources,
                structuredResults: data.structuredResults
            };

            setMessages(prev => [...prev, botMsg]);
        } catch (error) {
            console.error("Chat Error:", error);
            const errorMsg: Message = {
                id: (Date.now() + 1).toString(),
                role: 'assistant',
                content: "⚠️ I encountered an error connecting to the knowledge base. Please try again.",
                timestamp: new Date()
            };
            setMessages(prev => [...prev, errorMsg]);
        } finally {
            setLoading(false);
        }
    };

    const handleKeyDown = (e: React.KeyboardEvent) => {
        if (e.key === 'Enter' && !e.shiftKey) {
            e.preventDefault();
            handleSend();
        }
    };

    return (
        <div className="flex flex-col h-[calc(100vh-140px)] bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl overflow-hidden shadow-2xl relative">
            {/* Background Pattern */}
            <div className="absolute inset-0 opacity-5 pointer-events-none">
                <div className="absolute top-10 left-10"><Sprout size={120} /></div>
                <div className="absolute bottom-20 right-20"><Leaf size={150} /></div>
            </div>

            {/* Chat Area */}
            <div className="flex-1 overflow-y-auto p-6 space-y-6 custom-scrollbar z-10" ref={scrollRef}>
                {messages.map((msg) => (
                    <div
                        key={msg.id}
                        className={clsx(
                            "flex gap-4 max-w-4xl mx-auto",
                            msg.role === 'user' ? "flex-row-reverse" : "flex-row"
                        )}
                    >
                        {/* Avatar */}
                        <div className={clsx(
                            "w-10 h-10 rounded-full flex items-center justify-center shrink-0 border shadow-sm",
                            msg.role === 'assistant'
                                ? "bg-emerald-100 text-emerald-600 border-emerald-200 dark:bg-emerald-900/30 dark:text-emerald-400 dark:border-emerald-800"
                                : "bg-blue-100 text-blue-600 border-blue-200 dark:bg-blue-900/30 dark:text-blue-400 dark:border-blue-800"
                        )}>
                            {msg.role === 'assistant' ? <Bot size={20} /> : <User size={20} />}
                        </div>

                        {/* Bubble */}
                        <div className={clsx(
                            "relative p-6 rounded-2xl shadow-md text-[15px] leading-relaxed max-w-[90%]", // Wider & more padding
                            msg.role === 'assistant'
                                ? "bg-gradient-to-br from-white to-emerald-50/50 dark:from-slate-800 dark:to-emerald-900/10 text-slate-800 dark:text-slate-100 border border-emerald-100/50 dark:border-emerald-500/20 rounded-tl-none shadow-lg shadow-emerald-500/5 backdrop-blur-sm" // Premium Assistant Bubble
                                : "bg-gradient-to-r from-blue-600 to-indigo-600 text-white rounded-tr-none shadow-lg shadow-blue-500/20 font-medium" // Premium User Bubble
                        )}>

                            <div className="prose dark:prose-invert prose-sm max-w-none">
                                <ReactMarkdown remarkPlugins={[remarkGfm]}>{msg.content}</ReactMarkdown>
                            </div>

                            {/* Structured Results (Google Search Style) */}
                            {msg.structuredResults && msg.structuredResults.length > 0 && (
                                <div className="mt-6 space-y-4">
                                    {/* Divider */}
                                    <div className="h-px bg-slate-200 dark:bg-slate-700 my-4" />
                                    {msg.structuredResults.map((result) => (
                                        <SearchResultCard key={result.id} result={result} />
                                    ))}
                                </div>
                            )}

                            {/* Citations / Sources (Legacy) */}
                            {msg.sources && msg.sources.length > 0 && !msg.structuredResults && (
                                <div className="mt-4 pt-3 border-t border-slate-200 dark:border-slate-700/50">
                                    <p className="text-xs font-bold text-slate-500 dark:text-slate-400 mb-2 uppercase tracking-wider">Sources from Social Feed</p>
                                    <div className="grid gap-2">
                                        {msg.sources.map((src, idx) => (
                                            <div key={idx} className="text-xs bg-slate-50 dark:bg-slate-900/50 p-2 rounded border border-slate-100 dark:border-slate-700 text-slate-600 dark:text-slate-400 flex justify-between items-center cursor-pointer hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors">
                                                <span className="truncate max-w-[200px] italic">"{src.content.substring(0, 40)}..."</span>
                                                <span className="font-bold text-[10px] px-1.5 py-0.5 rounded bg-slate-200 dark:bg-slate-700 text-slate-700 dark:text-slate-300 ml-2">{src.source || 'Twitter'}</span>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            )}
                            <span className="text-[10px] opacity-50 absolute bottom-2 right-4">
                                {msg.timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                            </span>
                        </div>
                    </div>
                ))}

                {loading && (
                    <div className="flex gap-4 max-w-4xl mx-auto">
                        <div className="w-10 h-10 rounded-full bg-emerald-100 text-emerald-600 border-emerald-200 dark:bg-emerald-900/30 dark:text-emerald-400 dark:border-emerald-800 flex items-center justify-center shrink-0 border shadow-sm">
                            <Bot size={20} />
                        </div>
                        <div className="bg-white dark:bg-slate-800 border border-slate-100 dark:border-slate-700 p-4 rounded-2xl rounded-tl-none flex items-center gap-3 shadow-sm">
                            <Loader2 className="animate-spin text-emerald-500" size={18} />
                            <span className="text-xs font-medium text-slate-500">Analyzing thousands of data points...</span>
                        </div>
                    </div>
                )}
            </div>

            {/* Input Area */}
            <div className="p-4 bg-white dark:bg-slate-900/50 backdrop-blur-md border-t border-slate-200 dark:border-slate-800">
                <div className="max-w-4xl mx-auto relative flex items-center gap-3">
                    <input
                        type="text"
                        value={input}
                        onChange={(e) => setInput(e.target.value)}
                        onKeyDown={handleKeyDown}
                        placeholder="Ask about crop prices, pest attacks, or market trends..."
                        className="w-full bg-slate-100 dark:bg-slate-950 border-0 text-slate-900 dark:text-white rounded-full pl-6 pr-14 py-4 focus:ring-2 focus:ring-emerald-500/50 transition-all font-medium placeholder:text-slate-400"
                        disabled={loading}
                    />
                    <button
                        onClick={handleSend}
                        disabled={loading || !input.trim()}
                        className="absolute right-2 p-2.5 bg-emerald-600 hover:bg-emerald-500 text-white rounded-full transition-all disabled:opacity-50 disabled:cursor-not-allowed shadow-lg shadow-emerald-600/20"
                    >
                        {loading ? <Loader2 size={18} className="animate-spin" /> : <Send size={18} />}
                    </button>
                </div>
                <p className="text-center text-[10px] text-slate-400 mt-2">
                    AI-generated answers based on real-time social media analysis. Verify important info.
                </p>
            </div>
        </div >
    );
}
