'use client';

import { TrendingUp, TrendingDown, DollarSign } from 'lucide-react';

const COMMODITIES = [
    { name: 'Rice (Rough)', price: 16.45, change: 0.25, unit: 'cwt' },
    { name: 'Wheat', price: 580.50, change: -4.25, unit: 'bu' },
    { name: 'Corn', price: 475.25, change: 1.50, unit: 'bu' },
    { name: 'Soybeans', price: 1340.00, change: 8.75, unit: 'bu' },
    { name: 'Cotton', price: 82.30, change: -0.40, unit: 'lb' },
    { name: 'Coffee', price: 185.60, change: 2.10, unit: 'lb' },
];

interface PriceTrackerProps {
    filter?: string;
}

export default function PriceTracker({ filter = 'All' }: PriceTrackerProps) {
    const filteredCommodities = COMMODITIES.filter(item => {
        if (filter === 'All') return true;
        // Simple mock categorization logic
        if (filter === 'Crops') return ['Rice (Rough)', 'Wheat', 'Corn', 'Soybeans'].includes(item.name);
        if (filter === 'Inputs') return false; // Mock: No inputs in this list yet
        if (filter === 'Softs') return ['Cotton', 'Coffee'].includes(item.name);
        return true;
    });

    return (
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-lg">
            <h3 className="text-xl font-bold text-white mb-4 flex items-center gap-2">
                <DollarSign className="text-green-400" />
                Commodity Prices
            </h3>

            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
                {filteredCommodities.length > 0 ? (
                    filteredCommodities.map((item) => (
                        <div key={item.name} className="bg-slate-800/50 p-3 rounded-xl border border-slate-700 flex flex-col items-center text-center hover:bg-slate-800 transition-colors">
                            <p className="text-slate-400 text-xs font-medium uppercase tracking-wider mb-1">{item.name}</p>
                            <p className="text-lg font-bold text-white">${item.price}</p>
                            <div className={`flex items-center gap-1 text-xs font-bold ${item.change >= 0 ? 'text-green-400' : 'text-red-400'}`}>
                                {item.change >= 0 ? <TrendingUp size={12} /> : <TrendingDown size={12} />}
                                {item.change > 0 ? '+' : ''}{item.change}
                            </div>
                            <p className="text-slate-500 text-[10px] mt-1">per {item.unit}</p>
                        </div>
                    ))
                ) : (
                    <p className="col-span-full text-slate-500 text-sm py-4">No commodities found for this filter.</p>
                )}
            </div>
        </div>
    );
}
