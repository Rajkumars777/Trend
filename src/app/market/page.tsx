'use client';

import { useEffect, useState } from 'react';
import PriceTracker from '@/components/PriceTracker';
import ProductPredictionCard from '@/components/ProductPredictionCard';
import MarketAnalysis from '@/components/MarketAnalysis';
import { TrendingUp, Filter, Sprout } from 'lucide-react';

export default function MarketPage() {
    const [predictions, setPredictions] = useState<any[]>([]);
    const [activeFilter, setActiveFilter] = useState('All');

    useEffect(() => {
        async function fetchData() {
            try {
                const res = await fetch('/api/trends');
                const result = await res.json();
                setPredictions(result.predictions || []);
            } catch (e) {
                console.error("Failed to fetch market data", e);
            }
        }
        fetchData();
    }, []);

    const filters = ['All', 'Crops', 'Softs'];

    return (
        <div className="space-y-8">
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                <div>
                    <h2 className="text-3xl font-bold text-white">Market & Pricing</h2>
                    <p className="text-slate-400 mt-2">Live commodity prices and AI-driven market predictions.</p>
                </div>

                {/* Filter Buttons */}
                <div className="flex bg-slate-800 p-1 rounded-lg border border-slate-700">
                    {filters.map(f => (
                        <button
                            key={f}
                            onClick={() => setActiveFilter(f)}
                            className={`px-4 py-2 rounded-md text-sm font-medium transition-all ${activeFilter === f
                                ? 'bg-blue-500 text-white shadow-lg'
                                : 'text-slate-400 hover:text-white hover:bg-slate-700'
                                }`}
                        >
                            {f}
                        </button>
                    ))}
                </div>
            </div>

            {/* Price Ticker (Filtered) */}
            <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-lg">
                <h3 className="text-xl font-bold text-white mb-6 flex items-center gap-2">
                    <TrendingUp className="text-green-400" />
                    Live Commodity Prices
                </h3>
                <PriceTracker filter={activeFilter} />
            </div>

            {/* New Market Analysis Section */}
            <MarketAnalysis />

            {/* Predictions Grid */}
            <div>
                <h3 className="text-xl font-bold text-white mb-6 flex items-center gap-2">
                    <Sprout className="text-yellow-400" />
                    AI Market Opportunities
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {predictions.length > 0 ? (
                        predictions.map((p, i) => (
                            <ProductPredictionCard key={i} {...p} />
                        ))
                    ) : (
                        <p className="text-slate-500 col-span-full text-center py-12">No active market signals detected.</p>
                    )}
                </div>
            </div>
        </div>
    );
}
