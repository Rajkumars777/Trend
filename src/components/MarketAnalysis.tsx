import { useState, useEffect } from 'react';
import { TrendingUp, TrendingDown, Activity, AlertCircle } from 'lucide-react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { useTheme } from 'next-themes';
import clsx from 'clsx';

interface MarketAnalysisProps {
    volatility?: {
        level: string;
        explanation: string;
    };
    forecasts?: any[];
    allForecasts?: Record<string, any[]>;
    movers?: any[];
}

export default function MarketAnalysis({ volatility, forecasts = [], allForecasts = {}, movers = [] }: MarketAnalysisProps) {
    const { theme } = useTheme();
    const [selectedCrop, setSelectedCrop] = useState<string>('');

    // Default safe values or empty states handles inside JSX
    const riskLevel = volatility?.level || 'Unknown';
    const riskExplanation = volatility?.explanation || 'No volatility data available.';
    const isMedium = riskLevel === 'Medium';
    const isHigh = riskLevel === 'High';

    // Initialize selected crop only when data arrives
    useEffect(() => {
        if (!selectedCrop && allForecasts && Object.keys(allForecasts).length > 0) {
            setSelectedCrop(Object.keys(allForecasts)[0]);
        }
    }, [allForecasts, selectedCrop]);

    // Derived data
    // Fallback logic: if selectedCrop suggests data, use it; otherwise legacy 'forecasts'
    const chartData = (selectedCrop && allForecasts[selectedCrop]) ? allForecasts[selectedCrop] : forecasts;

    // Theme colors
    const isDark = theme === 'dark';
    const axisColor = isDark ? '#94a3b8' : '#64748b'; // slate-400 : slate-500
    const gridColor = isDark ? 'rgba(148, 163, 184, 0.1)' : 'rgba(100, 116, 139, 0.1)';
    const tooltipBg = isDark ? '#1e293b' : '#ffffff';
    const tooltipColor = isDark ? '#f8fafc' : '#0f172a';
    const tooltipBorder = isDark ? '#334155' : '#e2e8f0';

    const availableCrops = Object.keys(allForecasts).length > 0 ? Object.keys(allForecasts) : ['General'];

    return (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Volatility Index */}
            <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-6 shadow-sm dark:shadow-md flex flex-col justify-between transition-colors">
                <div>
                    <h3 className="text-lg font-bold text-slate-900 dark:text-white mb-2 flex items-center gap-2">
                        <Activity className="text-blue-500" />
                        Market Volatility
                    </h3>
                    <p className="text-slate-500 dark:text-slate-400 text-sm">Risk assessment based on price fluctuations.</p>
                </div>
                <div className="mt-6">
                    <div className="flex items-end gap-2 mb-2">
                        <span className={clsx(
                            "text-4xl font-black transition-colors",
                            isHigh ? 'text-red-500' : isMedium ? 'text-amber-500' : 'text-emerald-500'
                        )}>
                            {riskLevel}
                        </span>
                        <span className="text-slate-500 dark:text-slate-400 mb-1">Risk Level</span>
                    </div>
                    <div className="w-full bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 h-2 rounded-full overflow-hidden">
                        <div className={clsx(
                            "h-full rounded-full transition-all duration-500",
                            isHigh ? 'bg-red-500 w-[90%]' : isMedium ? 'bg-amber-500 w-[60%]' : 'bg-emerald-500 w-[30%]'
                        )} />
                    </div>
                    <p className="text-xs text-slate-500 dark:text-slate-400 mt-3">
                        {riskExplanation}
                    </p>
                </div>
            </div>

            {/* Price Forecast Chart */}
            <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-6 shadow-sm dark:shadow-md lg:col-span-2 transition-colors">
                <div className="flex justify-between items-center mb-6">
                    <h3 className="text-lg font-bold text-slate-900 dark:text-white flex items-center gap-2">
                        <TrendingUp className="text-emerald-500" />
                        6-Month Price Forecast ({selectedCrop || 'General'})
                    </h3>
                    <select
                        value={selectedCrop}
                        onChange={(e) => setSelectedCrop(e.target.value)}
                        className="bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white text-xs rounded-lg px-2 py-1 outline-none focus:border-blue-500/50 transition-colors"
                    >
                        {availableCrops.map(crop => (
                            <option key={crop} value={crop}>{crop}</option>
                        ))}
                    </select>
                </div>
                <div className="h-[200px] w-full">
                    <ResponsiveContainer width="100%" height="100%">
                        <LineChart data={chartData}>
                            <CartesianGrid strokeDasharray="3 3" stroke={gridColor} vertical={false} />
                            <XAxis
                                dataKey="month"
                                stroke={axisColor}
                                tick={{ fontSize: 12, fill: axisColor }}
                                axisLine={false}
                                tickLine={false}
                            />
                            <YAxis
                                stroke={axisColor}
                                tick={{ fontSize: 12, fill: axisColor }}
                                axisLine={false}
                                tickLine={false}
                                tickFormatter={(value) => `$${value}`}
                            />
                            <Tooltip
                                contentStyle={{
                                    backgroundColor: tooltipBg,
                                    borderColor: tooltipBorder,
                                    color: tooltipColor,
                                    borderRadius: '8px',
                                    padding: '8px 12px'
                                }}
                                itemStyle={{ color: tooltipColor }}
                                labelStyle={{ color: axisColor, marginBottom: '4px' }}
                            />
                            <Line
                                type="monotone"
                                dataKey="price"
                                stroke="#10b981"
                                strokeWidth={3}
                                dot={{ r: 4, fill: '#10b981', strokeWidth: 0 }}
                                activeDot={{ r: 6, fill: '#10b981' }}
                            />
                        </LineChart>
                    </ResponsiveContainer>
                </div>
            </div>

            {/* Top Movers */}
            <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-6 shadow-sm dark:shadow-md col-span-1 lg:col-span-3 transition-colors">
                <h3 className="text-lg font-bold text-slate-900 dark:text-white mb-4 flex items-center gap-2">
                    <AlertCircle className="text-blue-500" />
                    Top Market Movers
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    {movers.length > 0 ? (
                        movers.map((item, i) => (
                            <div key={i} className="bg-slate-50 dark:bg-slate-800/50 p-4 rounded-xl border border-slate-100 dark:border-slate-700/50 flex items-center justify-between hover:border-blue-500/20 transition-colors">
                                <div>
                                    <p className="font-bold text-slate-900 dark:text-white">{item.name}</p>
                                    <p className="text-xs text-slate-500 dark:text-slate-400">Current: {item.price}</p>
                                </div>
                                <div className={clsx(
                                    "text-right",
                                    item.trend === 'up' ? 'text-emerald-500' : 'text-red-500'
                                )}>
                                    <p className="font-black text-lg">{item.change}</p>
                                    <div className="flex items-center justify-end gap-1 text-xs font-bold uppercase">
                                        {item.trend === 'up' ? <TrendingUp size={12} /> : <TrendingDown size={12} />}
                                        {item.trend}
                                    </div>
                                </div>
                            </div>
                        ))
                    ) : (
                        <p className="col-span-full text-center text-slate-500 dark:text-slate-400 text-sm">No significant movers detected.</p>
                    )}
                </div>
            </div>
        </div>
    );
}
