'use client';

import { useEffect, useState } from 'react';
import PriceTracker from '@/components/PriceTracker';
import ProductPredictionCard from '@/components/ProductPredictionCard';
import MarketAnalysis from '@/components/MarketAnalysis';
import SmartCropCard from '@/components/SmartCropCard'; // Import
import { TrendingUp, Filter, Sprout } from 'lucide-react';

export default function MarketPage() {
    const [predictions, setPredictions] = useState<any[]>([]);
    const [marketData, setMarketData] = useState<any>({
        commodities: [],
        volatility: null,
        forecasts: [],
        movers: []
    });
    const [smartCrop, setSmartCrop] = useState<any>(null); // New State

    const [activeFilter, setActiveFilter] = useState('All');
    const [selectedCountry, setSelectedCountry] = useState('India');
    const COUNTRIES = ['India', 'Japan', 'Philippines'];

    useEffect(() => {
        async function fetchData() {
            try {
                // Fetch predictions
                const resTrends = await fetch('/api/trends');
                const resultTrends = await resTrends.json();
                setPredictions(resultTrends.predictions || []);

                // Fetch market prices with Country param
                const resMarket = await fetch(`/api/market-prices?country=${selectedCountry}`);
                const resultMarket = await resMarket.json();
                setMarketData(resultMarket);

                // Fetch Smart Crop
                const resSmart = await fetch(`/api/smart-crop-recommendation?country=${selectedCountry}`);
                const resultSmart = await resSmart.json();
                setSmartCrop(resultSmart.topRecommendation);

            } catch (e) {
                console.error("Failed to fetch market data", e);
            }
        }
        fetchData();
    }, [selectedCountry]); // Reload when country changes

    const filters = ['All', 'Crops', 'Softs'];

    return (
        <div className="space-y-8">
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                <div>
                    <h2 className="text-3xl font-bold text-slate-900 dark:text-white">Market & Pricing</h2>
                    <p className="text-slate-500 dark:text-slate-400 mt-2">Live commodity prices and AI-driven market predictions.</p>
                </div>

                <div className="flex gap-4">
                    {/* Country Selector */}
                    <select
                        value={selectedCountry}
                        onChange={(e) => setSelectedCountry(e.target.value)}
                        className="bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white text-sm rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 outline-none transition-colors"
                    >
                        {COUNTRIES.map(c => <option key={c} value={c}>{c}</option>)}
                    </select>

                    {/* Filter Buttons */}
                    <div className="flex bg-slate-100 dark:bg-slate-800 p-1 rounded-lg border border-slate-200 dark:border-slate-700 transition-colors">
                        {filters.map(f => (
                            <button
                                key={f}
                                onClick={() => setActiveFilter(f)}
                                className={`px-4 py-2 rounded-md text-sm font-medium transition-all ${activeFilter === f
                                    ? 'bg-blue-600 text-white shadow-md'
                                    : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white hover:bg-white dark:hover:bg-slate-700 hover:shadow-sm'
                                    }`}
                            >
                                {f}
                            </button>
                        ))}
                    </div>
                </div>
            </div>

            {/* Smart Crop Recommendation */}
            {smartCrop && <SmartCropCard recommendation={smartCrop} />}

            {/* Price Ticker (Filtered) */}
            <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-6 shadow-sm dark:shadow-lg transition-all">
                <h3 className="text-xl font-bold text-slate-900 dark:text-white mb-6 flex items-center gap-2">
                    <TrendingUp className="text-green-500 dark:text-green-400" />
                    Live Commodity Prices
                </h3>
                <PriceTracker filter={activeFilter} commodities={marketData.commodities} />
            </div>

            {/* New Market Analysis Section */}
            <MarketAnalysis
                volatility={marketData.volatility}
                forecasts={marketData.forecasts}
                allForecasts={marketData.allForecasts}
                movers={marketData.movers}
                country={selectedCountry}
            />

            {/* Predictions Grid */}
            <div>
                <h3 className="text-xl font-bold text-slate-900 dark:text-white mb-6 flex items-center gap-2">
                    <Sprout className="text-yellow-500 dark:text-yellow-400" />
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
