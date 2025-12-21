import ChatInterface from '@/components/ChatInterface';
import { Bot, Sparkles } from 'lucide-react';

export default function ChatbotPage() {
    return (
        <div className="space-y-6">
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 animate-in slide-in-from-top-4 duration-500">
                <div>
                    <h1 className="text-3xl font-black text-slate-900 dark:text-white flex items-center gap-3">
                        <span className="p-2 bg-emerald-100 dark:bg-emerald-500/10 rounded-xl text-emerald-600 dark:text-emerald-400">
                            <Bot size={32} />
                        </span>
                        Agri-Intelligence Chatbot
                    </h1>
                    <p className="text-slate-500 dark:text-slate-400 mt-2 text-lg">
                        Real-time answers powered by RAG (Retrieval Augmented Generation) on social data.
                    </p>
                </div>

                <div className="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-emerald-500/10 to-blue-500/10 border border-emerald-500/20 rounded-full text-sm font-bold text-emerald-700 dark:text-emerald-300">
                    <Sparkles size={16} />
                    <span>Live RAG Model Active</span>
                </div>
            </div>

            <div className="animate-in fade-in duration-700 delay-150">
                <ChatInterface />
            </div>
        </div>
    );
}
