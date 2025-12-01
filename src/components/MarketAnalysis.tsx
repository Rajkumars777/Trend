'use client';

import { TrendingUp, TrendingDown, Activity, AlertCircle } from 'lucide-react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';

const FORECAST_DATA = [
    { month: 'Jan', price: 120 },
    { month: 'Feb', price: 132 },
    { month: 'Mar', price: 125 },
    { month: 'Apr', price: 145 },
    { month: 'May', price: 160 },
    { month: 'Jun', price: 155 },
];

const TOP_MOVERS = [
    { name: 'Wheat', change: '+5.2%', price: '$580', trend: 'up' },
    { name: 'Tomato', change: '-12.5%', price: '$14', trend: 'down' },
    { name: 'Cotton', change: '+3.1%', price: '$82', trend: 'up' },
];

export default function MarketAnalysis() {
    return (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Volatility Index */}
            <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-lg flex flex-col justify-between">
                <div>
                    <h3 className="text-lg font-bold text-white mb-2 flex items-center gap-2">
                        <Activity className="text-blue-400" />
                        Market Volatility
                    </h3>
                    <p className="text-slate-400 text-sm">Risk assessment based on price fluctuations.</p>
                </div>
                <div className="mt-6">
                    <div className="flex items-end gap-2 mb-2">
                        <span className="text-4xl font-black text-yellow-400">Medium</span>
                        <span className="text-slate-500 mb-1">Risk Level</span>
                    </div>
                    <div className="w-full bg-slate-800 h-2 rounded-full overflow-hidden">
                        <div className="bg-yellow-400 h-full w-[60%] rounded-full" />
                    </div>
                    <p className="text-xs text-slate-500 mt-3">
                        Prices are fluctuating due to seasonal transitions. Wheat and Corn show stable growth, while perishables are volatile.
                    </p>
                </div>
            </div>

            {/* Price Forecast Chart */}
            <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-lg lg:col-span-2">
                <div className="flex justify-between items-center mb-6">
                    <h3 className="text-lg font-bold text-white flex items-center gap-2">
                        <TrendingUp className="text-green-400" />
                        6-Month Price Forecast (Wheat)
                    </h3>
                    <select className="bg-slate-800 border border-slate-700 text-white text-xs rounded-lg px-2 py-1 outline-none">
                        <option>Wheat</option>
                        <option>Rice</option>
                        <option>Corn</option>
                    </select>
                </div>
                <div className="h-[200px] w-full">
                    <ResponsiveContainer width="100%" height="100%">
                        <LineChart data={FORECAST_DATA}>
                            <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" vertical={false} />
                            <XAxis dataKey="month" stroke="#64748b" tick={{ fontSize: 12 }} axisLine={false} tickLine={false} />
                            <YAxis stroke="#64748b" tick={{ fontSize: 12 }} axisLine={false} tickLine={false} tickFormatter={(value) => `$${value}`} />
                            <Tooltip
                                contentStyle={{ backgroundColor: '#0f172a', borderColor: '#1e293b', color: '#fff' }}
                                itemStyle={{ color: '#fff' }}
                            />
                            <Line type="monotone" dataKey="price" stroke="#10B981" strokeWidth={3} dot={{ r: 4, fill: '#10B981' }} activeDot={{ r: 6 }} />
                        </LineChart>
                    </ResponsiveContainer>
                </div>
            </div>

            {/* Top Movers */}
            <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-lg col-span-1 lg:col-span-3">
                <h3 className="text-lg font-bold text-white mb-4 flex items-center gap-2">
                    <AlertCircle className="text-orange-400" />
                    Top Market Movers
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    {TOP_MOVERS.map((item, i) => (
                        <div key={i} className="bg-slate-800/50 p-4 rounded-xl border border-slate-700 flex items-center justify-between">
                            <div>
                                <p className="font-bold text-white">{item.name}</p>
                                <p className="text-xs text-slate-400">Current: {item.price}</p>
                            </div>
                            <div className={`text-right ${item.trend === 'up' ? 'text-green-400' : 'text-red-400'}`}>
                                <p className="font-black text-lg">{item.change}</p>
                                <div className="flex items-center justify-end gap-1 text-xs font-bold uppercase">
                                    {item.trend === 'up' ? <TrendingUp size={12} /> : <TrendingDown size={12} />}
                                    {item.trend}
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
            </div>
        </div>
    );
}
