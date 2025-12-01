'use client';

import { useState, useEffect } from 'react';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { Sprout, TrendingUp, AlertCircle } from 'lucide-react';

const COUNTRIES = ["India", "United States", "Brazil", "China", "Russia"];
const CROPS = ["Rice", "Wheat", "Corn", "Soybean"];

export default function YieldForecast() {
    const [country, setCountry] = useState(COUNTRIES[0]);
    const [crop, setCrop] = useState(CROPS[0]);
    const [data, setData] = useState<any>(null);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');

    async function fetchForecast() {
        setLoading(true);
        setError('');
        try {
            const res = await fetch(`/api/yield-forecast?country=${country}&crop=${crop}`);
            if (!res.ok) throw new Error('Failed to fetch forecast');
            const result = await res.json();
            setData(result);
        } catch (err) {
            setError('No data available for this selection.');
            setData(null);
        } finally {
            setLoading(false);
        }
    }

    useEffect(() => {
        fetchForecast();
    }, [country, crop]);

    // Prepare chart data
    let chartData: any[] = [];
    let growthPercent = 0;
    let currentYield = 0;
    let predictedYield = 0;

    if (data) {
        const history = data.history.map((h: any) => ({ year: h.year, yield: h.yield, type: 'History' }));
        const forecast = data.forecast.map((f: any) => ({ year: f.year, yield: f.yield, type: 'Forecast' }));

        // Connect lines
        if (history.length > 0 && forecast.length > 0) {
            // Add last history point to forecast to make line continuous
            const lastHist = history[history.length - 1];
            forecast.unshift({ ...lastHist, type: 'Forecast' });
        }

        chartData = [...history, ...forecast.slice(1)]; // Avoid duplicate point in array for rendering if needed, but for separate lines we handle differently

        // Re-structure for Recharts with two lines
        // We need a single array where some points have 'yield' and others have 'forecastYield'
        chartData = [];
        history.forEach((h: any) => chartData.push({ year: h.year, yield: h.yield }));

        // Add the connection point
        if (history.length > 0) {
            const last = history[history.length - 1];
            // We don't push a new point, we just ensure the next forecast point connects?
            // Actually, easiest is to have 'yield' (history) and 'forecast' (future) keys
            // For the connection point, it should have BOTH
            chartData[chartData.length - 1].forecast = last.yield;
        }

        data.forecast.forEach((f: any) => {
            chartData.push({ year: f.year, forecast: f.yield });
        });

        currentYield = history[history.length - 1]?.yield || 0;
        predictedYield = data.forecast[data.forecast.length - 1]?.yield || 0;
        growthPercent = ((predictedYield - currentYield) / currentYield) * 100;
    }

    return (
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-lg">
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-6 gap-4">
                <div>
                    <h3 className="text-xl font-bold text-white flex items-center gap-2">
                        <Sprout className="text-green-500" />
                        Crop Yield Forecast
                    </h3>
                    <p className="text-slate-400 text-sm">AI-powered growth prediction</p>
                </div>

                <div className="flex gap-3">
                    <select
                        value={country}
                        onChange={(e) => setCountry(e.target.value)}
                        className="bg-slate-800 text-white border border-slate-700 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-green-500 outline-none"
                    >
                        {COUNTRIES.map(c => <option key={c} value={c}>{c}</option>)}
                    </select>
                    <select
                        value={crop}
                        onChange={(e) => setCrop(e.target.value)}
                        className="bg-slate-800 text-white border border-slate-700 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-green-500 outline-none"
                    >
                        {CROPS.map(c => <option key={c} value={c}>{c}</option>)}
                    </select>
                </div>
            </div>

            {loading ? (
                <div className="h-[300px] flex items-center justify-center text-slate-500">Loading forecast...</div>
            ) : error ? (
                <div className="h-[300px] flex items-center justify-center text-red-400 flex-col gap-2">
                    <AlertCircle />
                    {error}
                </div>
            ) : (
                <>
                    <div className="grid grid-cols-2 gap-4 mb-6">
                        <div className="bg-slate-800/50 p-4 rounded-xl border border-slate-700">
                            <p className="text-slate-400 text-xs uppercase tracking-wider">Current Yield (2024)</p>
                            <p className="text-2xl font-bold text-white mt-1">{currentYield} <span className="text-sm font-normal text-slate-500">t/ha</span></p>
                        </div>
                        <div className="bg-slate-800/50 p-4 rounded-xl border border-slate-700">
                            <p className="text-slate-400 text-xs uppercase tracking-wider">Predicted (2027)</p>
                            <div className="flex items-end gap-2">
                                <p className="text-2xl font-bold text-white mt-1">{predictedYield} <span className="text-sm font-normal text-slate-500">t/ha</span></p>
                                <span className={`text-sm font-bold mb-1 ${growthPercent >= 0 ? 'text-green-400' : 'text-red-400'}`}>
                                    {growthPercent > 0 ? '+' : ''}{growthPercent.toFixed(1)}%
                                </span>
                            </div>
                        </div>
                    </div>

                    <div className="h-[300px] w-full">
                        <ResponsiveContainer width="100%" height="100%">
                            <AreaChart data={chartData}>
                                <defs>
                                    <linearGradient id="colorYield" x1="0" y1="0" x2="0" y2="1">
                                        <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.3} />
                                        <stop offset="95%" stopColor="#3b82f6" stopOpacity={0} />
                                    </linearGradient>
                                    <linearGradient id="colorForecastYield" x1="0" y1="0" x2="0" y2="1">
                                        <stop offset="5%" stopColor="#10b981" stopOpacity={0.3} />
                                        <stop offset="95%" stopColor="#10b981" stopOpacity={0} />
                                    </linearGradient>
                                </defs>
                                <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" />
                                <XAxis dataKey="year" stroke="#64748b" />
                                <YAxis stroke="#64748b" domain={['auto', 'auto']} />
                                <Tooltip
                                    contentStyle={{ backgroundColor: '#0f172a', borderColor: '#1e293b', color: '#fff' }}
                                />
                                <Area
                                    type="monotone"
                                    dataKey="yield"
                                    name="Historical"
                                    stroke="#3b82f6"
                                    strokeWidth={3}
                                    fillOpacity={1}
                                    fill="url(#colorYield)"
                                />
                                <Area
                                    type="monotone"
                                    dataKey="forecast"
                                    name="Forecast"
                                    stroke="#10b981"
                                    strokeWidth={3}
                                    strokeDasharray="5 5"
                                    fillOpacity={1}
                                    fill="url(#colorForecastYield)"
                                />
                            </AreaChart>
                        </ResponsiveContainer>
                    </div>
                </>
            )}
        </div>
    );
}
