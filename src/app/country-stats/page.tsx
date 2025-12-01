'use client';

import { useState } from 'react';
import GlobalMap from '@/components/GlobalMap';
import YieldForecast from '@/components/YieldForecast';
import EnvironmentalCharts from '@/components/EnvironmentalCharts';
import CountryInsightPanel from '@/components/CountryInsightPanel';

export default function CountryStatsPage() {
    const [selectedCountry, setSelectedCountry] = useState<string | null>(null);

    return (
        <div className="space-y-8 relative">
            {/* Insight Overlay */}
            {selectedCountry && (
                <CountryInsightPanel
                    country={selectedCountry}
                    onClose={() => setSelectedCountry(null)}
                />
            )}

            <div>
                <h2 className="text-3xl font-bold text-white">Country Insights & Yields</h2>
                <p className="text-slate-400 mt-2">Detailed environmental data and crop yield forecasts by region.</p>
            </div>

            {/* Map Section */}
            <div className="bg-slate-900 border border-slate-800 rounded-2xl p-1 shadow-lg">
                <GlobalMap onCountrySelect={setSelectedCountry} />
            </div>

            {/* Detailed Charts Grid */}
            <div className="grid grid-cols-1 xl:grid-cols-2 gap-8">
                <div className="space-y-6">
                    <h3 className="text-xl font-bold text-white">Yield Forecasts</h3>
                    <YieldForecast />
                </div>
                <div className="space-y-6">
                    <h3 className="text-xl font-bold text-white">Environmental Metrics</h3>
                    <EnvironmentalCharts />
                </div>
            </div>
        </div>
    );
}
