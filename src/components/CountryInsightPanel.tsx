'use client';

import { X, TrendingUp, Droplets, Thermometer, Sprout } from 'lucide-react';

interface CountryInsightPanelProps {
    country: string;
    onClose: () => void;
}

// Mock data generator (in a real app, this would fetch from API)
const getCountryData = (country: string) => {
    const data: any = {
        'India': {
            crops: ['Rice', 'Wheat', 'Cotton', 'Sugarcane'],
            climate: 'Tropical Monsoon',
            sentiment: 'Positive',
            trend: '+12% Production',
            insight: 'India is experiencing a surge in sustainable farming practices. Wheat yields are expected to rise by 5% due to favorable monsoon conditions.'
        },
        'United States of America': {
            crops: ['Corn', 'Soybeans', 'Wheat', 'Cotton'],
            climate: 'Temperate / Continental',
            sentiment: 'Neutral',
            trend: 'Stable Yields',
            insight: 'US farmers are adopting precision agriculture at record rates. Corn production remains steady despite minor drought concerns in the Midwest.'
        },
        'Brazil': {
            crops: ['Soybeans', 'Coffee', 'Corn', 'Sugarcane'],
            climate: 'Tropical',
            sentiment: 'Very Positive',
            trend: '+8% Export Growth',
            insight: 'Brazil continues to dominate the global soybean market. Coffee plantations are recovering well from last year\'s frost events.'
        },
        'China': {
            crops: ['Rice', 'Wheat', 'Potatoes', 'Corn'],
            climate: 'Diverse',
            sentiment: 'Positive',
            trend: 'High Demand',
            insight: 'China is focusing on modernizing its irrigation infrastructure to boost rice production and ensure food security for its growing population.'
        },
        'Russia': {
            crops: ['Wheat', 'Barley', 'Sunflower', 'Oats'],
            climate: 'Continental',
            sentiment: 'Neutral',
            trend: 'Export Fluctuations',
            insight: 'Russia remains a key player in the global wheat market, though export volumes are fluctuating due to geopolitical factors and weather patterns.'
        }
    };

    return data[country] || {
        crops: ['Wheat', 'Corn', 'Rice'],
        climate: 'Varied',
        sentiment: 'Neutral',
        trend: 'Stable',
        insight: `${country} is a key agricultural region with diverse crop production. Recent data suggests stable yields with a focus on sustainable practices.`
    };
};

export default function CountryInsightPanel({ country, onClose }: CountryInsightPanelProps) {
    const data = getCountryData(country);

    return (
        <div className="fixed inset-y-0 right-0 w-full md:w-[400px] bg-slate-900/95 backdrop-blur-xl border-l border-slate-700 shadow-2xl z-50 transform transition-transform duration-300 ease-in-out animate-in slide-in-from-right">
            <div className="p-6 h-full flex flex-col overflow-y-auto custom-scrollbar">
                {/* Header */}
                <div className="flex items-center justify-between mb-8">
                    <div>
                        <h2 className="text-3xl font-black text-white mb-1">{country}</h2>
                        <div className="flex items-center gap-2">
                            <span className={`px-2 py-0.5 rounded-full text-xs font-bold ${data.sentiment === 'Positive' || data.sentiment === 'Very Positive' ? 'bg-green-500/20 text-green-400' :
                                    data.sentiment === 'Negative' ? 'bg-red-500/20 text-red-400' : 'bg-yellow-500/20 text-yellow-400'
                                }`}>
                                {data.sentiment} Sentiment
                            </span>
                            <span className="text-slate-500 text-xs">• {data.climate}</span>
                        </div>
                    </div>
                    <button
                        onClick={onClose}
                        className="p-2 bg-slate-800 rounded-full hover:bg-slate-700 text-slate-400 hover:text-white transition-colors"
                    >
                        <X size={20} />
                    </button>
                </div>

                {/* Key Metrics Grid */}
                <div className="grid grid-cols-2 gap-4 mb-8">
                    <div className="bg-slate-800/50 p-4 rounded-xl border border-slate-700/50">
                        <div className="flex items-center gap-2 text-blue-400 mb-2">
                            <TrendingUp size={18} />
                            <span className="text-xs font-bold uppercase">Trend</span>
                        </div>
                        <p className="text-white font-bold">{data.trend}</p>
                    </div>
                    <div className="bg-slate-800/50 p-4 rounded-xl border border-slate-700/50">
                        <div className="flex items-center gap-2 text-green-400 mb-2">
                            <Sprout size={18} />
                            <span className="text-xs font-bold uppercase">Top Crop</span>
                        </div>
                        <p className="text-white font-bold">{data.crops[0]}</p>
                    </div>
                </div>

                {/* AI Insight */}
                <div className="mb-8">
                    <h3 className="text-lg font-bold text-white mb-3 flex items-center gap-2">
                        <span className="w-1 h-6 bg-blue-500 rounded-full"></span>
                        AI Market Insight
                    </h3>
                    <div className="bg-gradient-to-br from-blue-500/10 to-purple-500/10 border border-blue-500/20 p-5 rounded-xl">
                        <p className="text-slate-300 leading-relaxed text-sm">
                            {data.insight}
                        </p>
                    </div>
                </div>

                {/* Major Crops */}
                <div className="mb-8">
                    <h3 className="text-lg font-bold text-white mb-3 flex items-center gap-2">
                        <span className="w-1 h-6 bg-green-500 rounded-full"></span>
                        Major Crops
                    </h3>
                    <div className="flex flex-wrap gap-2">
                        {data.crops.map((crop: string, i: number) => (
                            <span key={i} className="px-3 py-1.5 bg-slate-800 border border-slate-700 rounded-lg text-slate-300 text-sm">
                                {crop}
                            </span>
                        ))}
                    </div>
                </div>

                {/* Environmental Conditions (Mock) */}
                <div>
                    <h3 className="text-lg font-bold text-white mb-3 flex items-center gap-2">
                        <span className="w-1 h-6 bg-orange-500 rounded-full"></span>
                        Current Conditions
                    </h3>
                    <div className="space-y-3">
                        <div className="flex items-center justify-between p-3 bg-slate-800/30 rounded-lg border border-slate-800">
                            <div className="flex items-center gap-3">
                                <Thermometer size={18} className="text-orange-400" />
                                <span className="text-slate-400 text-sm">Avg Temperature</span>
                            </div>
                            <span className="text-white font-bold">24°C</span>
                        </div>
                        <div className="flex items-center justify-between p-3 bg-slate-800/30 rounded-lg border border-slate-800">
                            <div className="flex items-center gap-3">
                                <Droplets size={18} className="text-blue-400" />
                                <span className="text-slate-400 text-sm">Precipitation</span>
                            </div>
                            <span className="text-white font-bold">Moderate</span>
                        </div>
                    </div>
                </div>

            </div>
        </div>
    );
}
