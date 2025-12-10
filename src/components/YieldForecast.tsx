'use client';

import { useState, useEffect } from 'react';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { Sprout, AlertCircle } from 'lucide-react';
import { useTheme } from 'next-themes';

const CROPS = ["Rice", "Wheat", "Corn", "Soybean", "Cotton", "Barley"];

interface YieldForecastProps {
    country: string;
}

export default function YieldForecast({ country }: YieldForecastProps) {
    const [crop, setCrop] = useState(CROPS[0]);
    const [data, setData] = useState<any>(null);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');
    const { resolvedTheme } = useTheme();
    const isDark = resolvedTheme === 'dark';

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
        if (country) fetchForecast();
    }, [country, crop]);

    // Prepare chart data
    let chartData: any[] = [];
    let growthPercent = 0;
    let currentYield = 0;
    let predictedYield = 0;

    if (data) {
        const history = data.history.map((h: any) => ({ year: h.year, yield: h.yield, type: 'History' }));
        const forecast = data.forecast.map((f: any) => ({ year: f.year, yield: f.yield, type: 'Forecast' }));

        // Re-structure for Recharts
        const historyData = history.map((h: any) => ({ year: h.year, yield: h.yield }));

        // Add last history point to forecast for continuity visual
        const lastHist = history[history.length - 1];
        const forecastData = forecast.map((f: any) => ({ year: f.year, forecast: f.yield }));

        // Simpler data structure: unified array
        // We will just concat them, but distinguishing keys
        chartData = [...historyData];

        // Add the bridge point to forecast data specifically
        if (lastHist) {
            forecastData.unshift({ year: lastHist.year, forecast: lastHist.yield });
        }

        // Merge into one array with 'yield' and 'forecast' keys
        const years = new Set([...history.map((h: any) => h.year), ...forecast.map((f: any) => f.year)]);
        const mergedData: any[] = [];
        years.forEach(year => {
            const h = history.find((x: any) => x.year === year);
            const f = forecastData.find((x: any) => x.year === year);
            mergedData.push({
                year,
                yield: h ? h.yield : null,
                forecast: f ? f.forecast : null
            });
        });
        chartData = mergedData.sort((a, b) => a.year - b.year);

        currentYield = history[history.length - 1]?.yield || 0;
        predictedYield = data.forecast[data.forecast.length - 1]?.yield || 0;
        growthPercent = ((predictedYield - currentYield) / currentYield) * 100;
    }

    // Chart Colors
    const gridColor = isDark ? "#1e293b" : "#e2e8f0";
    const axisColor = isDark ? "#94a3b8" : "#64748b";
    const tooltipBg = isDark ? "#1e293b" : "#ffffff";
    const tooltipBorder = isDark ? "#334155" : "#e2e8f0";
    const tooltipText = isDark ? "#f8fafc" : "#0f172a";

    return (
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-6 shadow-sm transition-all duration-300">
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-6 gap-4">
                <div>
                    <h3 className="text-xl font-bold text-slate-900 dark:text-white flex items-center gap-2 transition-colors duration-300">
                        <Sprout className="text-green-600 dark:text-green-500" />
                        Crop Yield Forecast
                    </h3>
                    <p className="text-slate-500 dark:text-slate-400 text-sm mt-1 transition-colors duration-300">AI-driven predictive modeling for next harvest.</p>
                </div>
                <div>
                    <select
                        value={crop}
                        onChange={(e) => setCrop(e.target.value)}
                        className="bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white text-sm rounded-lg focus:ring-blue-500 focus:border-blue-500 block w-full p-2.5 transition-colors duration-300"
                    >
                        {CROPS.map(c => <option key={c} value={c}>{c}</option>)}
                    </select>
                </div>
            </div>

            {loading ? (
                <div className="h-[300px] flex items-center justify-center text-slate-400 dark:text-slate-500 animate-pulse">Running Predictive Models...</div>
            ) : error ? (
                <div className="h-[300px] flex flex-col items-center justify-center text-slate-500 gap-2">
                    <AlertCircle size={32} />
                    <p>{error}</p>
                </div>
            ) : data ? (
                <div>
                    {/* Stats */}
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-6">
                        <div className="bg-slate-50 dark:bg-slate-950 p-4 rounded-xl border border-slate-200 dark:border-slate-800 transition-colors duration-300">
                            <p className="text-slate-500 dark:text-slate-400 text-xs font-bold uppercase mb-1 transition-colors duration-300">Current Yield</p>
                            <p className="text-2xl font-black text-slate-900 dark:text-white transition-colors duration-300">{currentYield.toFixed(2)} <span className="text-sm font-medium text-slate-500">t/ha</span></p>
                        </div>
                        <div className="bg-slate-50 dark:bg-slate-950 p-4 rounded-xl border border-slate-200 dark:border-slate-800 transition-colors duration-300">
                            <p className="text-slate-500 dark:text-slate-400 text-xs font-bold uppercase mb-1 transition-colors duration-300">Forecast (2027)</p>
                            <p className="text-2xl font-black text-slate-900 dark:text-white transition-colors duration-300">{predictedYield.toFixed(2)} <span className="text-sm font-medium text-slate-500">t/ha</span></p>
                        </div>
                        <div className="bg-slate-50 dark:bg-slate-950 p-4 rounded-xl border border-slate-200 dark:border-slate-800 transition-colors duration-300">
                            <p className="text-slate-500 dark:text-slate-400 text-xs font-bold uppercase mb-1 transition-colors duration-300">Growth Trend</p>
                            <p className={`text-2xl font-black transition-colors duration-300 ${growthPercent >= 0 ? 'text-emerald-600 dark:text-emerald-500' : 'text-red-600 dark:text-red-500'}`}>
                                {growthPercent > 0 ? '+' : ''}{growthPercent.toFixed(1)}%
                            </p>
                        </div>
                    </div>

                    {/* Chart */}
                    <div className="h-[300px] w-full">
                        <ResponsiveContainer width="100%" height="100%">
                            <AreaChart data={chartData}>
                                <defs>
                                    <linearGradient id="colorYield" x1="0" y1="0" x2="0" y2="1">
                                        <stop offset="5%" stopColor="#22c55e" stopOpacity={0.3} />
                                        <stop offset="95%" stopColor="#22c55e" stopOpacity={0} />
                                    </linearGradient>
                                    <linearGradient id="colorForecast" x1="0" y1="0" x2="0" y2="1">
                                        <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.3} />
                                        <stop offset="95%" stopColor="#3b82f6" stopOpacity={0} />
                                    </linearGradient>
                                </defs>
                                <CartesianGrid strokeDasharray="3 3" stroke={gridColor} opacity={0.8} />
                                <XAxis dataKey="year" stroke={axisColor} tick={{ fontSize: 12 }} tickLine={false} axisLine={false} dy={10} />
                                <YAxis stroke={axisColor} tick={{ fontSize: 12 }} tickLine={false} axisLine={false} dx={-10} />
                                <Tooltip
                                    contentStyle={{ backgroundColor: tooltipBg, borderColor: tooltipBorder, color: tooltipText, borderRadius: '8px', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}
                                    formatter={(value: number, name: string) => [`${value.toFixed(2)} t/ha`, name === 'forecast' ? 'Forecast' : 'Yield']}
                                />
                                <Area
                                    type="monotone"
                                    dataKey="yield"
                                    stroke="#22c55e"
                                    fillOpacity={1}
                                    fill="url(#colorYield)"
                                    strokeWidth={3}
                                    name="Historical Yield"
                                />
                                <Area
                                    type="monotone"
                                    dataKey="forecast"
                                    stroke="#3b82f6"
                                    strokeDasharray="5 5"
                                    fillOpacity={1}
                                    fill="url(#colorForecast)"
                                    strokeWidth={3}
                                    name="AI Forecast"
                                />
                            </AreaChart>
                        </ResponsiveContainer>
                    </div>
                </div>
            ) : null}
        </div>
    );
}
