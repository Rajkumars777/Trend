'use client';

import { useState, useRef, useEffect, useCallback } from 'react';
import { Send, Bot, User, Loader2, Sprout, Leaf, Paperclip, FileText, X, Square, Pencil, Download } from 'lucide-react';
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
    const [attachedFile, setAttachedFile] = useState<{ name: string, content: string } | null>(null);
    const [uploading, setUploading] = useState(false);
    const fileInputRef = useRef<HTMLInputElement>(null);
    const scrollRef = useRef<HTMLDivElement>(null);
    const abortControllerRef = useRef<AbortController | null>(null);

    const handleStop = () => {
        if (abortControllerRef.current) {
            abortControllerRef.current.abort();
            abortControllerRef.current = null;
            setLoading(false);
        }
    };

    const handleDownload = () => {
        const chatContent = messages.map(m => `[${m.role.toUpperCase()} - ${m.timestamp.toLocaleString()}]\n${m.content}\n`).join('\n-------------------\n');
        const blob = new Blob([chatContent], { type: 'text/plain' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `agritrend-chat-${new Date().toISOString().slice(0, 10)}.txt`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
    };

    const handleEdit = (messageId: string, content: string) => {
        // Rewind history to just before this message
        const msgIndex = messages.findIndex(m => m.id === messageId);
        if (msgIndex === -1) return;

        const newHistory = messages.slice(0, msgIndex);
        setMessages(newHistory);
        setInput(content);
        if (fileInputRef.current) fileInputRef.current.focus();
    };

    useEffect(() => {
        if (scrollRef.current) {
            scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
        }
    }, [messages]);

    const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;

        setUploading(true);
        const formData = new FormData();
        formData.append('file', file);

        try {
            const res = await fetch('/api/parse-document', {
                method: 'POST',
                body: formData
            });

            if (!res.ok) {
                const errorText = await res.text();
                throw new Error(`Upload failed: ${res.status} ${errorText}`);
            }

            const data = await res.json();

            if (data.text) {
                setAttachedFile({ name: file.name, content: data.text });
            } else {
                alert('Failed to extract text from document.');
            }
        } catch (err) {
            console.error(err);
            alert(err instanceof Error ? err.message : 'Error uploading document.');
        } finally {
            setUploading(false);
            if (fileInputRef.current) fileInputRef.current.value = '';
        }
    };

    const handleSend = async () => {
        if (!input.trim() && !attachedFile) return;

        const userMsg: Message = {
            id: Date.now().toString(),
            role: 'user',
            content: input + (attachedFile ? `\n\n[Attached File: ${attachedFile.name}]` : ''),
            timestamp: new Date()
        };

        setMessages(prev => [...prev, userMsg]);
        setInput('');

        // Keep a reference to the file content before clearing state
        const docContext = attachedFile?.content;
        setAttachedFile(null); // Clear attachment after sending

        setLoading(true);

        // Create new AbortController
        const abortController = new AbortController();
        abortControllerRef.current = abortController;

        try {
            const response = await fetch('/api/chat', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    query: userMsg.content,
                    documentContext: docContext // Send parsed text to backend
                }),
                signal: abortController.signal
            });

            if (!response.ok) throw new Error('Failed to fetch response');

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
        } catch (error: any) {
            if (error.name === 'AbortError') {
                console.log('Request cancelled');
                return; // Do nothing if cancelled
            }
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
            abortControllerRef.current = null;
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
            {/* Download Button */}
            <button
                onClick={handleDownload}
                className="absolute top-4 right-4 z-20 p-2 bg-white/80 dark:bg-slate-800/80 backdrop-blur-sm border border-slate-200 dark:border-slate-700 rounded-full text-slate-500 hover:text-emerald-600 dark:text-slate-400 dark:hover:text-emerald-400 shadow-sm transition-colors"
                title="Download Chat History"
            >
                <Download size={18} />
            </button>

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
                            "relative p-6 rounded-2xl shadow-md text-[15px] leading-relaxed max-w-[90%] group", // Added group for hover
                            msg.role === 'assistant'
                                ? "bg-gradient-to-br from-white to-emerald-50/50 dark:from-slate-800 dark:to-emerald-900/10 text-slate-800 dark:text-slate-100 border border-emerald-100/50 dark:border-emerald-500/20 rounded-tl-none shadow-lg shadow-emerald-500/5 backdrop-blur-sm"
                                : "bg-gradient-to-r from-blue-600 to-indigo-600 text-white rounded-tr-none shadow-lg shadow-blue-500/20 font-medium"
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
                                {msg.timestamp.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' })}
                            </span>

                            {/* Edit Button (User Only) */}
                            {msg.role === 'user' && (
                                <button
                                    onClick={() => handleEdit(msg.id, msg.content)}
                                    className="absolute -left-10 top-1/2 -translate-y-1/2 p-2 text-slate-400 hover:text-blue-600 bg-white dark:bg-slate-800 rounded-full shadow-sm border border-slate-100 dark:border-slate-700 opacity-0 group-hover:opacity-100 transition-opacity"
                                    title="Edit Message"
                                >
                                    <Pencil size={14} />
                                </button>
                            )}
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
                            <span className="text-xs font-medium text-slate-500">Analyzing data...</span>
                            <button
                                onClick={handleStop}
                                className="ml-2 p-1.5 hover:bg-red-50 text-slate-400 hover:text-red-500 rounded-md transition-colors"
                                title="Stop Generation"
                            >
                                <Square size={14} fill="currentColor" />
                            </button>
                        </div>
                    </div>
                )}
            </div>

            {/* Input Area */}
            <div className="p-4 bg-white dark:bg-slate-900/50 backdrop-blur-md border-t border-slate-200 dark:border-slate-800">
                <div className="max-w-4xl mx-auto space-y-2">
                    {/* Attachment Indicator */}
                    {attachedFile && (
                        <div className="flex items-center gap-2 bg-blue-50 dark:bg-blue-900/20 text-blue-600 dark:text-blue-400 px-3 py-1.5 rounded-lg text-xs w-fit border border-blue-100 dark:border-blue-800 animate-in fade-in slide-in-from-bottom-2">
                            <FileText size={14} />
                            <span className="font-medium truncate max-w-[200px]">{attachedFile.name}</span>
                            <button onClick={() => setAttachedFile(null)} className="hover:bg-blue-100 dark:hover:bg-blue-900 rounded-full p-0.5 ml-1">
                                <X size={12} />
                            </button>
                        </div>
                    )}

                    <div className="relative flex items-center gap-3">
                        <input
                            type="file"
                            ref={fileInputRef}
                            onChange={handleFileSelect}
                            className="hidden"
                            accept=".pdf,.txt"
                        />
                        <button
                            onClick={() => fileInputRef.current?.click()}
                            disabled={uploading || loading}
                            className="absolute left-2 p-2 text-slate-400 hover:text-emerald-600 dark:hover:text-emerald-400 transition-colors disabled:opacity-50"
                            title="Attach Document (PDF/Text)"
                        >
                            {uploading ? <Loader2 size={20} className="animate-spin" /> : <Paperclip size={20} />}
                        </button>

                        <input
                            type="text"
                            value={input}
                            onChange={(e) => setInput(e.target.value)}
                            onKeyDown={handleKeyDown}
                            placeholder="Ask about crops, or upload a report..."
                            className="w-full bg-slate-100 dark:bg-slate-950 border-0 text-slate-900 dark:text-white rounded-full pl-12 pr-14 py-4 focus:ring-2 focus:ring-emerald-500/50 transition-all font-medium placeholder:text-slate-400"
                            disabled={loading}
                        />
                        <button
                            onClick={handleSend}
                            disabled={loading || (!input.trim() && !attachedFile)}
                            className="absolute right-2 p-2.5 bg-emerald-600 hover:bg-emerald-500 text-white rounded-full transition-all disabled:opacity-50 disabled:cursor-not-allowed shadow-lg shadow-emerald-600/20"
                        >
                            {loading ? <Loader2 size={18} className="animate-spin" /> : <Send size={18} />}
                        </button>
                    </div>
                </div>
                <p className="text-center text-[10px] text-slate-400 mt-2">
                    AI-generated answers based on real-time social media & document analysis. Verify important info.
                </p>
            </div>
        </div >
    );
}
