'use client';

import { useState, useEffect, useMemo } from 'react';
import GlobalMap from '@/components/GlobalMap';
import YieldForecast from '@/components/YieldForecast';
import EnvironmentalCharts from '@/components/EnvironmentalCharts';
import CountrySelector from '@/components/CountrySelector';
import AgricultureOverview from '@/components/AgricultureOverview';
import MarketEconomy from '@/components/MarketEconomy';
import SmartCropCard from '@/components/SmartCropCard';
import MarketAnalysis from '@/components/MarketAnalysis';

import CropDeepDive from '@/components/CropDeepDive';
import SingleCountryMap from '@/components/SingleCountryMap';
import { TrendingUp, AlertTriangle, Sprout, Wind, Droplets, Thermometer, DollarSign, Bug, CloudRain, Cpu, Globe, ChevronRight } from 'lucide-react';
import clsx from 'clsx';

export default function CountryStatsPage() {
    const [selectedCountry, setSelectedCountry] = useState<string>("India");

    // Data States
    const [insightData, setInsightData] = useState<any>(null);
    const [deepData, setDeepData] = useState<any>(null);
    const [loading, setLoading] = useState(false);
    const [deepLoading, setDeepLoading] = useState(false);

    // Fetch Insight Data (Sentiment, Concerns, Forecasts)
    useEffect(() => {
        if (!selectedCountry) return;
        setLoading(true);
        fetch(`/api/country-insight?country=${encodeURIComponent(selectedCountry)}`)
            .then(res => res.json())
            .then(data => {
                setInsightData(data);
                setLoading(false);
            })
            .catch(err => {
                console.error(err);
                setLoading(false);
            });
    }, [selectedCountry]);

    // Fetch Deep Stats Data (Economy, Social, Market)
    useEffect(() => {
        if (!selectedCountry) return;
        setDeepLoading(true);
        fetch(`/api/country-deep-stats?country=${encodeURIComponent(selectedCountry)}`)
            .then(res => res.json())
            .then(data => {
                setDeepData(data);
                setDeepLoading(false);
            })
            .catch(err => {
                console.error(err);
                setDeepLoading(false);
            });
    }, [selectedCountry]);

    // Intelligent Crop Recommendation Engine
    const smartRecommendation = useMemo(() => {
        if (!deepData?.market?.prices) return null;

        // 1. Find Best Market Trend
        const marketWinner = [...deepData.market.prices]
            .filter((p: any) => p.trend.includes('+'))
            .sort((a: any, b: any) => {
                const valA = parseFloat(a.trend.replace('%', '').replace('+', ''));
                const valB = parseFloat(b.trend.replace('%', '').replace('+', ''));
                return valB - valA;
            })[0];

        if (!marketWinner) return null;

        // 2. Check Risk Profile
        const cropName = marketWinner.commodity.split(' ')[0];
        const healthProfile = insightData?.cropHealth?.find((c: any) => c.name.includes(cropName) || cropName.includes(c.name));

        const riskLevel = healthProfile ? healthProfile.risk : "Low";
        const riskReason = healthProfile ? healthProfile.disease : "None";

        // 3. Calculate Score
        let trendVal = parseFloat(marketWinner.trend.replace('%', '').replace('+', ''));
        if (isNaN(trendVal)) trendVal = 5;

        let score = 50 + (trendVal * 2);
        if (riskLevel === 'Medium') score -= 15;
        if (riskLevel === 'High') score -= 30;

        if (score > 98) score = 98.5;
        if (score < 40) score = 42.0;

        return {
            crop: marketWinner.commodity,
            score: parseFloat(score.toFixed(1)),
            reason: `Strong Market Upside (${marketWinner.trend})`,
            risk: riskLevel,
            riskReason: riskReason
        };
    }, [deepData, insightData]);

    return (
        <div className="space-y-8 animate-in fade-in duration-500 pb-12 bg-gray-50 dark:bg-[#0B1221] min-h-screen p-8 transition-colors duration-300">
            {/* Header Area */}
            <div className="flex flex-col md:flex-row justify-between items-end gap-6 border-b border-slate-200 dark:border-slate-800 pb-6 transition-colors duration-300">
                <div>
                    <h1 className="text-3xl font-black text-slate-900 dark:text-white tracking-tight transition-colors duration-300">Country Intelligence</h1>
                    <p className="text-slate-500 dark:text-slate-400 mt-2 transition-colors duration-300">AI-driven agricultural analysis & yield forecasting.</p>
                </div>
                <CountrySelector onSelect={setSelectedCountry} selectedCountry={selectedCountry} />
            </div>

            {/* SECTION 1: Strategic Overview (GDP, Economy, Policy) */}
            <AgricultureOverview data={deepData ? deepData.overview : null} loading={deepLoading} />

            {/* SECTION 2: Top Overview Cards (Real-time Insight) */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">

                {/* Sentiment Card */}
                <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-6 rounded-2xl shadow-sm relative overflow-hidden group hover:shadow-md transition-all duration-300">
                    <div className="absolute top-0 right-0 p-4 opacity-5 group-hover:opacity-10 transition-opacity"><TrendingUp size={64} className="text-slate-900 dark:text-slate-500 transition-colors duration-300" /></div>
                    <p className="text-slate-500 dark:text-slate-400 text-xs font-bold uppercase tracking-wider mb-2 transition-colors duration-300">Market Sentiment</p>
                    <div className="flex items-end gap-2">
                        {loading ? <div className="h-8 w-24 bg-slate-100 dark:bg-slate-800 rounded animate-pulse" /> : (
                            <h3 className={clsx(
                                "text-3xl font-black transition-colors duration-300",
                                insightData?.sentiment === 'Positive' ? 'text-emerald-600 dark:text-emerald-500' :
                                    insightData?.sentiment === 'Negative' ? 'text-red-600 dark:text-red-500' : 'text-amber-500'
                            )}>
                                {insightData?.sentiment || "Neutral"}
                            </h3>
                        )}
                    </div>
                    <p className="text-slate-600 dark:text-slate-400 text-sm mt-2 transition-colors duration-300">{insightData?.trend || "Analyzing..."}</p>
                </div>

                {/* Weather Alert Card */}
                <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-6 rounded-2xl shadow-sm relative overflow-hidden group hover:shadow-md transition-all duration-300">
                    <div className="absolute top-0 right-0 p-4 opacity-5 group-hover:opacity-10 transition-opacity"><Wind size={64} className="text-slate-900 dark:text-slate-500 transition-colors duration-300" /></div>
                    <p className="text-slate-500 dark:text-slate-400 text-xs font-bold uppercase tracking-wider mb-2 transition-colors duration-300">Weather Risk</p>
                    <div className="flex items-end gap-2">
                        {loading ? <div className="h-8 w-24 bg-slate-100 dark:bg-slate-800 rounded animate-pulse" /> : (
                            <h3 className={clsx("text-3xl font-black transition-colors duration-300", (insightData?.concerns?.weather || 0) > 50 ? "text-red-600 dark:text-red-500" : "text-blue-600 dark:text-blue-500")}>
                                {(insightData?.concerns?.weather || 0) > 50 ? "High" : "Normal"}
                            </h3>
                        )}
                    </div>
                    <p className="text-slate-600 dark:text-slate-400 text-sm mt-2 transition-colors duration-300">
                        Fear Index: {insightData?.concerns?.weather || 0}%
                    </p>
                </div>

                {/* Top Crop */}
                <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-6 rounded-2xl shadow-sm relative overflow-hidden group hover:shadow-md transition-all duration-300">
                    <div className="absolute top-0 right-0 p-4 opacity-5 group-hover:opacity-10 transition-opacity"><Sprout size={64} className="text-slate-900 dark:text-slate-500 transition-colors duration-300" /></div>
                    <p className="text-slate-500 dark:text-slate-400 text-xs font-bold uppercase tracking-wider mb-2 transition-colors duration-300">Primary Crop Focus</p>
                    <div className="flex items-end gap-2">
                        {loading ? <div className="h-8 w-24 bg-slate-100 dark:bg-slate-800 rounded animate-pulse" /> : (
                            <h3 className="text-3xl font-black text-slate-900 dark:text-white truncate transition-colors duration-300">
                                {insightData?.crops?.[0] || "Rice"}
                            </h3>
                        )}
                    </div>
                    <p className="text-slate-600 dark:text-slate-400 text-sm mt-2 transition-colors duration-300">
                        + {insightData?.crops?.length ? insightData.crops.length - 1 : 0} others trending
                    </p>
                </div>

                {/* AI / Tech */}
                <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-6 rounded-2xl shadow-sm relative overflow-hidden group hover:shadow-md transition-all duration-300">
                    <div className="absolute top-0 right-0 p-4 opacity-5 group-hover:opacity-10 transition-opacity"><Cpu size={64} className="text-slate-900 dark:text-slate-500 transition-colors duration-300" /></div>
                    <p className="text-slate-500 dark:text-slate-400 text-xs font-bold uppercase tracking-wider mb-2 transition-colors duration-300">Tech Adoption</p>
                    <div className="flex items-center gap-2 mt-1">
                        {loading ? <div className="h-8 w-full bg-slate-100 dark:bg-slate-800 rounded animate-pulse" /> : (
                            <div className="text-sm text-slate-700 dark:text-slate-300 font-medium line-clamp-2 leading-snug transition-colors duration-300">
                                {insightData?.aiNews?.[0]?.title || "Stable tech indicators."}
                            </div>
                        )}
                    </div>
                </div>
            </div>

            {/* Main Content Grid */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">

                {/* Left Column: Map & Environment (2/3 width) */}
                <div className="lg:col-span-2 space-y-8">
                    {/* Map Section */}
                    <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-1 shadow-md relative group h-[400px] lg:h-[500px] overflow-hidden transition-all duration-300">
                        <GlobalMap className="w-full h-full shadow-none border-none rounded-xl" onCountrySelect={setSelectedCountry} />
                    </div>

                    {/* Environmental Metrics */}
                    <div className="space-y-6">
                        <h3 className="text-2xl font-bold text-slate-900 dark:text-white flex items-center gap-2 transition-colors duration-300">
                            <CloudRain className="text-blue-600 dark:text-blue-500 transition-colors duration-300" /> Environmental Impact
                        </h3>
                        <EnvironmentalCharts country={selectedCountry} />
                    </div>

                    {/* Yield Forecasts */}
                    <div className="space-y-6">
                        <h3 className="text-2xl font-bold text-slate-900 dark:text-white flex items-center gap-2 transition-colors duration-300">
                            <Sprout className="text-green-600 dark:text-green-500 transition-colors duration-300" /> Yield Forecasts
                        </h3>
                        <YieldForecast country={selectedCountry} />
                    </div>

                    {/* Regional Focus Map */}
                    <SingleCountryMap country={selectedCountry} />
                </div>

                {/* Right Column: Economy, Social, Risks (1/3 width) */}
                <div className="space-y-6">

                    {/* Intelligent Crop Recommendation */}
                    {smartRecommendation && <SmartCropCard recommendation={smartRecommendation} />}

                    {/* Market & Economy */}
                    <MarketEconomy data={deepData} loading={deepLoading} />

                    {/* Advanced Market Analysis (Volatility & Forecasts) */}
                    {deepData?.market?.analysis && (
                        <div className="col-span-full">
                            <MarketAnalysis
                                volatility={deepData.market.analysis.volatility}
                                allForecasts={deepData.market.analysis.allForecasts}
                                movers={deepData.market.analysis.movers}
                                country={selectedCountry}
                            />
                        </div>
                    )}


                    {/* Crop Deep Dive */}
                    <CropDeepDive data={insightData?.cropHealth} />

                    {/* Concern Density Heatmap */}
                    <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-6 shadow-sm transition-all duration-300">
                        <h3 className="text-xl font-bold text-slate-900 dark:text-white mb-6 flex items-center gap-2 transition-colors duration-300">
                            <AlertTriangle className="text-amber-500" /> Risk Analysis
                        </h3>

                        <div className="space-y-6">
                            {/* Weather */}
                            <div>
                                <div className="flex justify-between text-sm mb-2">
                                    <span className="text-slate-600 dark:text-slate-400 flex items-center gap-2 transition-colors duration-300"><CloudRain size={16} className="text-blue-500" /> Weather Stress</span>
                                    <span className="font-mono text-slate-900 dark:text-white font-bold transition-colors duration-300">{insightData?.concerns?.weather || 0}%</span>
                                </div>
                                <div className="h-3 w-full bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden transition-colors duration-300">
                                    <div
                                        className="h-full bg-blue-500 transition-all duration-1000"
                                        style={{ width: `${insightData?.concerns?.weather || 0}%` }}
                                    />
                                </div>
                            </div>
                            {/* Price */}
                            <div>
                                <div className="flex justify-between text-sm mb-2">
                                    <span className="text-slate-600 dark:text-slate-400 flex items-center gap-2 transition-colors duration-300"><DollarSign size={16} className="text-green-500" /> Price Volatility</span>
                                    <span className="font-mono text-slate-900 dark:text-white font-bold transition-colors duration-300">{insightData?.concerns?.price || 0}%</span>
                                </div>
                                <div className="h-3 w-full bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden transition-colors duration-300">
                                    <div
                                        className="h-full bg-green-500 transition-all duration-1000"
                                        style={{ width: `${insightData?.concerns?.price || 0}%` }}
                                    />
                                </div>
                            </div>
                            {/* Pest */}
                            <div>
                                <div className="flex justify-between text-sm mb-2">
                                    <span className="text-slate-600 dark:text-slate-400 flex items-center gap-2 transition-colors duration-300"><Bug size={16} className="text-red-500" /> Pest Outbreak</span>
                                    <span className="font-mono text-slate-900 dark:text-white font-bold transition-colors duration-300">{insightData?.concerns?.pest || 0}%</span>
                                </div>
                                <div className="h-3 w-full bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden transition-colors duration-300">
                                    <div
                                        className="h-full bg-red-500 transition-all duration-1000"
                                        style={{ width: `${insightData?.concerns?.pest || 0}%` }}
                                    />
                                </div>
                            </div>
                        </div>

                        <div className="mt-6 p-4 bg-slate-50 dark:bg-slate-950 rounded-xl border border-slate-200 dark:border-slate-800 transition-all duration-300">
                            <h4 className="text-xs font-bold text-slate-500 uppercase mb-2">AI Insight</h4>
                            <p className="text-slate-700 dark:text-slate-400 text-sm leading-relaxed transition-colors duration-300">
                                {insightData?.insight || "Analyzing regional data streams..."}
                            </p>
                        </div>
                    </div>

                    {/* Live Weather Widget */}
                    <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-6 shadow-sm relative overflow-hidden transition-all duration-300">
                        <div className="absolute top-0 right-0 p-6 opacity-10"><Wind size={80} className="text-blue-500" /></div>
                        <h3 className="text-xl font-bold text-slate-900 dark:text-white mb-4 flex items-center gap-2 transition-colors duration-300">
                            <Thermometer className="text-blue-600 dark:text-blue-500 transition-colors duration-300" /> Live Conditions
                        </h3>

                        {loading || !insightData?.weather ? (
                            <div className="animate-pulse flex flex-col gap-2">
                                <div className="h-10 w-20 bg-slate-100 dark:bg-slate-800 rounded"></div>
                                <div className="h-4 w-32 bg-slate-100 dark:bg-slate-800 rounded"></div>
                                <div className="grid grid-cols-2 gap-4 mt-2">
                                    <div className="h-16 bg-slate-100 dark:bg-slate-800 rounded"></div>
                                    <div className="h-16 bg-slate-100 dark:bg-slate-800 rounded"></div>
                                </div>
                            </div>
                        ) : (
                            <div>
                                <div className="text-5xl font-black text-slate-900 dark:text-white mb-1 transition-colors duration-300">
                                    {insightData.weather.temp}°C
                                </div>
                                <div className="text-slate-500 dark:text-slate-400 font-medium mb-4 flex items-center gap-2 transition-colors duration-300">
                                    {insightData.weather.condition}
                                    <span className="text-slate-400 dark:text-slate-600">•</span>
                                    Feels like {insightData.weather.feels_like}°C
                                </div>

                                <div className="grid grid-cols-2 gap-4">
                                    <div className="bg-slate-50 dark:bg-slate-950 p-3 rounded-lg border border-slate-200 dark:border-slate-800 transition-colors duration-300">
                                        <div className="text-slate-500 text-xs font-bold uppercase mb-1">Humidity</div>
                                        <div className="text-slate-900 dark:text-white font-bold transition-colors duration-300">{insightData.weather.humidity}%</div>
                                    </div>
                                    <div className="bg-slate-50 dark:bg-slate-950 p-3 rounded-lg border border-slate-200 dark:border-slate-800 transition-colors duration-300">
                                        <div className="text-slate-500 text-xs font-bold uppercase mb-1">Wind</div>
                                        <div className="text-slate-900 dark:text-white font-bold transition-colors duration-300">{insightData.weather.wind_kph} km/h</div>
                                    </div>
                                </div>
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
}
