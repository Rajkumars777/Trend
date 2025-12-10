'use client';

import { TrendingUp, TrendingDown, DollarSign } from 'lucide-react';

import clsx from 'clsx';

interface Commodity {
    name: string;
    price: string | number; // Allow string for currency formatted
    change: number;
    unit: string;
}

interface PriceTrackerProps {
    filter?: string;
    commodities?: Commodity[];
}

export default function PriceTracker({ filter = 'All', commodities = [] }: PriceTrackerProps) {
    const filteredCommodities = (commodities || []).filter(item => {
        if (filter === 'All') return true;
        // ... (keep logic)
        if (filter === 'Crops') return ['Rice', 'Wheat', 'Corn', 'Soybean', 'Sugar'].some(k => item.name.includes(k));
        if (filter === 'Inputs') return false;
        if (filter === 'Softs') return ['Cotton', 'Coffee'].some(k => item.name.includes(k));
        return true;
    });

    return (
        <div className="bg-card border border-neutral/20 rounded-2xl p-6 shadow-lg">
            <h3 className="text-xl font-bold text-foreground mb-4 flex items-center gap-2">
                <DollarSign className="text-positive" />
                Commodity Prices
            </h3>

            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
                {filteredCommodities.length > 0 ? (
                    filteredCommodities.map((item) => (
                        <div key={item.name} className="bg-card/50 p-3 rounded-xl border border-neutral/20 flex flex-col items-center text-center hover:bg-neutral/5 transition-colors">
                            <p className="text-neutral text-xs font-medium uppercase tracking-wider mb-1">{item.name}</p>
                            <p className="text-lg font-bold text-foreground">{item.price}</p>
                            <div className={clsx(
                                "flex items-center gap-1 text-xs font-bold",
                                item.change >= 0 ? 'text-positive' : 'text-negative'
                            )}>
                                {item.change >= 0 ? <TrendingUp size={12} /> : <TrendingDown size={12} />}
                                {item.change > 0 ? '+' : ''}{item.change}%
                            </div>
                            <p className="text-neutral/70 text-[10px] mt-1">per {item.unit}</p>
                        </div>
                    ))
                ) : (
                    <p className="col-span-full text-neutral text-sm py-4">No commodities found for this filter.</p>
                )}
            </div>
        </div>
    );
}
