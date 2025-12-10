'use client';

import { useEffect, useState } from 'react';
import { X, TrendingUp, Droplets, Thermometer, Sprout, AlertTriangle, Cpu, ExternalLink, Loader2, BarChart3, CloudRain, DollarSign, Bug } from 'lucide-react';
import clsx from 'clsx';

interface CountryInsightPanelProps {
    country: string;
    onClose: () => void;
}

interface CountryData {
    country: string;
    sentiment: string;
    sentimentScore: number;
    trend: string;
    insight: string;
    crops: string[];
    aiNews: { title: string; link: string }[];
    disaster: { hasAlert: boolean; alertText: string };
    concerns: { weather: number; price: number; pest: number };
    weather: { temp: number; condition: number; dailyMin: number; dailyMax: number; precip: number; capital?: string } | null;

}

export default function CountryInsightPanel({ country, onClose }: CountryInsightPanelProps) {
    const [data, setData] = useState<CountryData | null>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        if (!country) return;
        setLoading(true);
        fetch(`/api/country-insight?country=${encodeURIComponent(country)}`)
            .then(res => res.json())
            .then(resData => {
                setData(resData);
                setLoading(false);
            })
            .catch(err => {
                console.error(err);
                setLoading(false);
            });
    }, [country]);

    if (!country) return null;

    return (
        <div className="fixed inset-y-0 right-0 w-full md:w-[450px] bg-slate-950/95 backdrop-blur-xl border-l border-slate-700 shadow-2xl z-50 transform transition-transform duration-300 ease-in-out animate-in slide-in-from-right text-slate-100">
            <div className="p-6 h-full flex flex-col overflow-y-auto custom-scrollbar">
                {/* Header */}
                <div className="flex items-center justify-between mb-6">
                    <div>
                        <h2 className="text-3xl font-black text-white tracking-tight mb-1">{country}</h2>
                        <div className="flex items-center gap-2">
                            <div className="flex items-center gap-1.5 px-2 py-0.5 rounded-full bg-blue-500/20 text-blue-400 border border-blue-500/30 text-xs font-bold uppercase">
                                <span className="relative flex h-2 w-2">
                                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-blue-400 opacity-75"></span>
                                    <span className="relative inline-flex rounded-full h-2 w-2 bg-blue-500"></span>
                                </span>
                                Live Feed
                            </div>
                        </div>
                    </div>
                    <button
                        onClick={onClose}
                        className="p-2 bg-slate-800 rounded-full hover:bg-slate-700 text-slate-400 hover:text-white transition-colors"
                    >
                        <X size={20} />
                    </button>
                </div>

                {loading ? (
                    <div className="flex-1 flex flex-col items-center justify-center space-y-4">
                        <Loader2 className="animate-spin text-green-500" size={48} />
                        <p className="text-slate-400 text-sm animate-pulse">Aggregating Global Data...</p>
                    </div>
                ) : data ? (
                    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">

                        {/* 1. Sentiment & Trend Header */}
                        <div className="grid grid-cols-2 gap-3">
                            <div className={clsx(
                                "p-4 rounded-xl border",
                                data.sentiment === 'Positive' ? 'bg-emerald-950/30 border-emerald-500/30' :
                                    data.sentiment === 'Negative' ? 'bg-red-950/30 border-red-500/30' :
                                        data.sentiment === 'Critical' ? 'bg-red-950/50 border-red-600' :
                                            'bg-slate-900/50 border-slate-800'
                            )}>
                                <span className="text-xs font-bold uppercase text-slate-400">Sentiment</span>
                                <div className={clsx(
                                    "text-xl font-bold mt-1",
                                    data.sentiment === 'Positive' ? 'text-emerald-400' :
                                        data.sentiment === 'Negative' ? 'text-red-400' :
                                            data.sentiment === 'Critical' ? 'text-red-500' :
                                                'text-amber-400'
                                )}>
                                    {data.sentiment}
                                </div>
                            </div>
                            <div className="p-4 rounded-xl bg-slate-900/50 border border-slate-800">
                                <span className="text-xs font-bold uppercase text-slate-400">Trend</span>
                                <div className="text-xl font-bold text-white mt-1">{data.trend}</div>
                            </div>
                        </div>

                        {/* 2. Concern Density Heatmap */}
                        <div>
                            <h3 className="text-sm font-bold text-slate-400 mb-3 uppercase tracking-wider flex items-center gap-2">
                                <BarChart3 size={16} /> Concern Density
                            </h3>
                            <div className="bg-slate-900/50 border border-slate-800 rounded-xl p-4 space-y-4">
                                {/* Weather */}
                                <div>
                                    <div className="flex justify-between text-xs mb-1">
                                        <span className="text-slate-300 flex items-center gap-1"><CloudRain size={12} /> Weather Fear</span>
                                        <span className="font-mono text-slate-500">{data.concerns.weather}%</span>
                                    </div>
                                    <div className="h-2 w-full bg-slate-800 rounded-full overflow-hidden">
                                        <div
                                            className="h-full bg-blue-500 transition-all duration-1000"
                                            style={{ width: `${data.concerns.weather}%` }}
                                        />
                                    </div>
                                </div>
                                {/* Price */}
                                <div>
                                    <div className="flex justify-between text-xs mb-1">
                                        <span className="text-slate-300 flex items-center gap-1"><DollarSign size={12} /> Price Complaints</span>
                                        <span className="font-mono text-slate-500">{data.concerns.price}%</span>
                                    </div>
                                    <div className="h-2 w-full bg-slate-800 rounded-full overflow-hidden">
                                        <div
                                            className="h-full bg-amber-500 transition-all duration-1000"
                                            style={{ width: `${data.concerns.price}%` }}
                                        />
                                    </div>
                                </div>
                                {/* Pest */}
                                <div>
                                    <div className="flex justify-between text-xs mb-1">
                                        <span className="text-slate-300 flex items-center gap-1"><Bug size={12} /> Pest Outbreaks</span>
                                        <span className="font-mono text-slate-500">{data.concerns.pest}%</span>
                                    </div>
                                    <div className="h-2 w-full bg-slate-800 rounded-full overflow-hidden">
                                        <div
                                            className="h-full bg-red-500 transition-all duration-1000"
                                            style={{ width: `${data.concerns.pest}%` }}
                                        />
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* 3. Top Crops */}
                        <div>
                            <h3 className="text-sm font-bold text-slate-400 mb-3 uppercase tracking-wider">Top Crops in Focus</h3>
                            <div className="flex flex-wrap gap-2">
                                {data.crops.map((crop, i) => (
                                    <span key={i} className="px-3 py-1 bg-slate-800 text-slate-200 text-sm rounded-lg border border-slate-700">
                                        {crop}
                                    </span>
                                ))}
                            </div>
                        </div>

                        {/* 4. Top Insight */}
                        <div className="bg-gradient-to-br from-slate-800 to-slate-900 border border-slate-700 p-4 rounded-xl relative overflow-hidden">
                            <div className="absolute top-0 right-0 p-2 opacity-10"><TrendingUp size={48} /></div>
                            <h4 className="text-xs font-bold text-slate-500 uppercase mb-2">Primary Headline</h4>
                            <p className="text-slate-200 leading-relaxed text-sm font-medium">
                                "{data.insight}"
                            </p>
                        </div>

                        {/* 5. Live Weather Details */}
                        {/* 5. Live Weather Details */}
                        {data.weather && (
                            <div className="bg-slate-900/50 p-4 rounded-xl border border-slate-800">
                                <div className="flex items-center justify-between mb-4">
                                    <h3 className="text-sm font-bold text-slate-400 uppercase tracking-wider flex items-center gap-2">
                                        <CloudRain size={16} /> Live Conditions
                                    </h3>
                                    {data.weather.capital && (
                                        <span className="text-xs text-slate-500 font-mono border border-slate-800 px-2 py-0.5 rounded-full">
                                            {data.weather.capital}
                                        </span>
                                    )}
                                </div>

                                <div className="flex flex-wrap gap-3">
                                    {/* Temp Pill */}
                                    <div className="flex items-center gap-2 px-4 py-2 bg-gradient-to-br from-red-500/20 to-orange-500/20 border border-red-500/30 rounded-full">
                                        <Thermometer size={18} className="text-red-400" />
                                        <div>
                                            <span className="text-2xl font-black text-white leading-none">{data.weather.temp}°C</span>
                                        </div>
                                    </div>

                                    {/* Condition Pill */}
                                    <div className="flex items-center gap-2 px-4 py-2 bg-gradient-to-br from-blue-500/20 to-slate-500/20 border border-blue-500/30 rounded-full">
                                        <CloudRain size={18} className="text-blue-400" />
                                        <span className="text-sm font-bold text-blue-100">{getWeatherStatus(data.weather.condition)}</span>
                                    </div>

                                    {/* Precip Pill */}
                                    {data.weather.precip > 0 && (
                                        <div className="flex items-center gap-2 px-4 py-2 bg-gradient-to-br from-cyan-500/20 to-blue-500/20 border border-cyan-500/30 rounded-full">
                                            <Droplets size={16} className="text-cyan-400" />
                                            <span className="text-sm font-bold text-cyan-100">{data.weather.precip}mm</span>
                                        </div>
                                    )}
                                </div>
                                <div className="mt-3 flex items-center gap-4 text-xs font-bold text-slate-500 px-2">
                                    <span>H: {data.weather.dailyMax}°</span>
                                    <span>L: {data.weather.dailyMin}°</span>
                                </div>
                            </div>
                        )}

                        {/* 6. AI News Feed */}
                        <div>
                            <h3 className="text-sm font-bold text-slate-400 mb-3 uppercase tracking-wider flex items-center gap-2">
                                <Cpu size={14} /> AI & Tech Update
                            </h3>
                            <div className="space-y-2">
                                {data.aiNews && data.aiNews.length > 0 ? (
                                    data.aiNews.map((news, i) => (
                                        <a href={news.link} target="_blank" rel="noopener" key={i} className="block group">
                                            <div className="p-3 bg-slate-900/30 border border-slate-800 rounded-lg hover:border-purple-500/50 hover:bg-slate-900/80 transition-all flex items-start justify-between gap-3">
                                                <p className="text-xs text-slate-300 group-hover:text-purple-300 transition-colors line-clamp-2">
                                                    {news.title}
                                                </p>
                                                <ExternalLink size={12} className="text-slate-600 group-hover:text-purple-400 shrink-0 mt-0.5" />
                                            </div>
                                        </a>
                                    ))
                                ) : (
                                    <p className="text-xs text-slate-500 italic">No recent tech developments.</p>
                                )}
                            </div>
                        </div>

                    </div>
                ) : (
                    <div className="flex-1 flex items-center justify-center text-red-400">
                        Unable to connect to global nodes.
                    </div>
                )}
            </div>
        </div>
    );
}

function getWeatherStatus(code: number): string {
    if (code === 0) return "Clear Sky";
    if (code >= 1 && code <= 3) return "Partly Cloudy";
    if (code >= 45 && code <= 48) return "Foggy";
    if (code >= 51 && code <= 67) return "Rain";
    if (code >= 71 && code <= 77) return "Snow";
    if (code >= 95) return "Thunderstorm";
    return "Unknown";
}
