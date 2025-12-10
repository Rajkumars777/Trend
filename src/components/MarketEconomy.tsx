'use client';

import { TrendingUp, TrendingDown, DollarSign, ArrowRightLeft, ShoppingBag } from 'lucide-react';
import { AreaChart, Area, XAxis, Tooltip, ResponsiveContainer } from 'recharts';

interface MarketEconomyProps {
    data: any;
    loading: boolean;
}

// Helper to format numbers cleanly (e.g. "9.78923%" -> "9.79%", "113.432" -> "113.43")
const formatMetric = (val: string | number) => {
    if (!val) return '---';
    if (typeof val === 'number') return val.toFixed(2);

    const isPercent = val.toString().includes('%');
    const numericPart = parseFloat(val.toString().replace(/[^0-9.-]/g, ''));

    if (isNaN(numericPart)) return val;
    return isPercent ? `${numericPart.toFixed(2)}%` : numericPart.toFixed(2);
};

export default function MarketEconomy({ data, loading }: MarketEconomyProps) {
    if (loading) {
        return <div className="animate-pulse bg-white dark:bg-slate-900 p-6 rounded-xl border border-slate-200 dark:border-slate-800 h-[200px] flex items-center justify-center text-slate-400 dark:text-slate-500">Loading Market Data...</div>;
    }

    if (!data) return null;

    // derived trade balance for visualization
    const tradeVolume = (data.trade.exports || 0) + (data.trade.imports || 0);
    const exportPct = tradeVolume ? ((data.trade.exports || 0) / tradeVolume) * 100 : 50;

    return (
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-6 shadow-sm transition-all duration-300">
            <h3 className="text-xl font-bold text-slate-900 dark:text-white mb-6 flex items-center gap-2 transition-colors duration-300">
                <DollarSign className="text-emerald-500" />
                Market & Trade Intelligence
            </h3>

            {/* Inflation & CPI Row */}
            <div className="flex gap-6 mb-6">
                <div className="flex-1">
                    <p className="text-slate-500 dark:text-slate-400 text-xs font-bold uppercase transition-colors duration-300">Food Inflation</p>
                    <p className="text-3xl font-black text-slate-900 dark:text-white transition-colors duration-300">{formatMetric(data.market.inflation)}</p>
                </div>
                <div className="flex-1">
                    <p className="text-slate-500 dark:text-slate-400 text-xs font-bold uppercase transition-colors duration-300">Consumer Price Index</p>
                    <p className="text-2xl font-bold text-slate-700 dark:text-slate-300 transition-colors duration-300">{formatMetric(data.market.cpi)}</p>
                </div>
            </div>

            {/* Commodity Ticker */}
            <div className="mb-8">
                <p className="text-slate-500 dark:text-slate-400 text-xs font-bold uppercase tracking-wider mb-3 transition-colors duration-300">Live Commodity Prices</p>
                <div className="space-y-3">
                    {data.market.prices.map((item: any, i: number) => {
                        const isUp = item.trend.includes('+');
                        return (
                            <div key={i} className="flex items-center justify-between p-3 bg-slate-50 dark:bg-slate-950 rounded-lg border border-slate-200 dark:border-slate-800 group hover:border-slate-300 dark:hover:border-slate-700 transition duration-300">
                                <div className="flex items-center gap-3">
                                    <div className={`w-1 h-8 rounded-full ${isUp ? 'bg-emerald-500' : 'bg-red-500'}`}></div>
                                    <span className="text-slate-900 dark:text-white font-bold transition-colors duration-300">{item.commodity}</span>
                                </div>
                                <div className="text-right">
                                    <div className="text-slate-900 dark:text-white font-mono transition-colors duration-300">{item.price}</div>
                                    <div className={`text-xs font-medium flex items-center justify-end gap-1 ${isUp ? 'text-emerald-600 dark:text-emerald-500' : 'text-red-600 dark:text-red-500'}`}>
                                        {isUp ? <TrendingUp size={12} /> : <TrendingDown size={12} />}
                                        {item.trend}
                                    </div>
                                </div>
                            </div>
                        );
                    })}
                </div>
            </div>

            {/* Trade Balance */}
            <div>
                <p className="text-slate-500 dark:text-slate-400 text-xs font-bold uppercase tracking-wider mb-3 flex items-center gap-2 transition-colors duration-300">
                    <ArrowRightLeft size={14} /> Trade Balance ({data.trade.exports + data.trade.imports}B Total)
                </p>
                <div className="relative h-4 bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden flex mb-2 transition-colors duration-300">
                    <div className="h-full bg-blue-500 hover:bg-blue-400 transition-colors" style={{ width: `${exportPct}%` }} title={`Exports: $${data.trade.exports}B`}></div>
                    <div className="h-full bg-amber-500 hover:bg-amber-400 transition-colors" style={{ width: `${100 - exportPct}%` }} title={`Imports: $${data.trade.imports}B`}></div>
                </div>
                <div className="flex justify-between text-xs text-slate-500 dark:text-slate-400 font-medium font-mono transition-colors duration-300">
                    <span className="text-blue-500 dark:text-blue-400">EXP: ${data.trade.exports}B</span>
                    <span className="text-amber-500">IMP: ${data.trade.imports}B</span>
                </div>
                <div className="mt-4 grid grid-cols-2 gap-2 text-xs">
                    <div className="bg-slate-50 dark:bg-slate-950 p-2 rounded border border-slate-200 dark:border-slate-800 transition-colors duration-300">
                        <span className="text-slate-500 dark:text-slate-400 block transition-colors duration-300">Top Export</span>
                        <span className="text-slate-900 dark:text-white font-bold transition-colors duration-300">{data.trade.topExport}</span>
                    </div>
                    <div className="bg-slate-50 dark:bg-slate-950 p-2 rounded border border-slate-200 dark:border-slate-800 transition-colors duration-300">
                        <span className="text-slate-500 dark:text-slate-400 block transition-colors duration-300">Top Import</span>
                        <span className="text-slate-900 dark:text-white font-bold transition-colors duration-300">{data.trade.topImport}</span>
                    </div>
                </div>
            </div>
        </div>
    );
}
