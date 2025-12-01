'use client';

import { Megaphone } from 'lucide-react';

const HEADLINES = [
    "🚜 John Deere announces new AI-driven autonomous tractor series for 2025.",
    "📉 Wheat prices dip slightly as global supply chain stabilizes.",
    "🌾 India reports record-breaking rice harvest in Punjab region.",
    "🤖 AgTech startup 'FarmBot' raises $50M for robotic weed control.",
    "⚠️ Locust warning issued for East Africa - potential crop impact.",
    "💡 New hydroponic vertical farming facility opens in Dubai.",
    "📈 Soybean demand surges in Southeast Asia markets."
];

export default function NewsTicker() {
    return (
        <div className="bg-slate-900 border-y border-slate-800 py-2 mb-6 overflow-hidden flex items-center relative">
            <div className="absolute left-0 bg-slate-900 z-10 px-4 py-1 flex items-center gap-2 border-r border-slate-800 shadow-xl">
                <Megaphone size={16} className="text-red-500 animate-pulse" />
                <span className="text-xs font-bold text-red-400 uppercase tracking-wider">Breaking</span>
            </div>

            <div className="whitespace-nowrap animate-marquee flex gap-12 items-center pl-32">
                {[...HEADLINES, ...HEADLINES].map((headline, i) => (
                    <span key={i} className="text-sm text-slate-300 font-medium flex items-center gap-2">
                        <span className="w-1.5 h-1.5 rounded-full bg-slate-600"></span>
                        {headline}
                    </span>
                ))}
            </div>
        </div>
    );
}
