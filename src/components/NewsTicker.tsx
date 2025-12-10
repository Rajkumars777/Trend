'use client';

import { Megaphone } from 'lucide-react';

interface NewsTickerProps {
    headlines?: string[];
}

export default function NewsTicker({ headlines = [] }: NewsTickerProps) {
    if (!headlines || headlines.length === 0) {
        return null; // Don't show ticker if no news
    }

    return (
        <div className="bg-gradient-to-r from-red-600/10 via-background to-background border-y border-red-500/20 py-3 mb-8 overflow-hidden flex items-center relative backdrop-blur-sm">
            <div className="absolute left-0 top-0 bottom-0 bg-card z-30 px-6 flex items-center gap-3 border-r border-red-500/20 shadow-[10px_0_30px_rgba(0,0,0,0.1)]">
                <div className="relative">
                    <span className="absolute -inset-1 rounded-full bg-red-500/20 animate-ping"></span>
                    <Megaphone size={18} className="text-red-500 relative z-10" />
                </div>
                <div className="flex flex-col">
                    <span className="text-xs font-black text-red-500 uppercase tracking-[0.2em]">Breaking</span>
                    <span className="text-[10px] font-medium text-neutral">Live Feed</span>
                </div>
            </div>

            <div className="whitespace-nowrap animate-marquee flex gap-16 items-center pl-48">
                {[...headlines, ...headlines, ...headlines].map((headline, i) => ( // Triple content for smoother loop
                    <span key={i} className="text-sm text-foreground/90 font-medium flex items-center gap-3 group cursor-pointer hover:text-red-400 transition-colors">
                        <span className="w-1.5 h-1.5 rounded-full bg-red-500/50 group-hover:bg-red-500 group-hover:scale-150 transition-all"></span>
                        {headline}
                    </span>
                ))}
            </div>

            {/* Right fade */}
            <div className="absolute right-0 top-0 bottom-0 w-32 bg-gradient-to-l from-background to-transparent z-20 pointer-events-none"></div>
        </div>
    );
}
