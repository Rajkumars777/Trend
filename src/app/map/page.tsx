import GlobalMap from '@/components/GlobalMap';

export default function MapPage() {
    return (
        <div className="space-y-6">
            <div>
                <h2 className="text-3xl font-bold text-white">Global Agriculture Map</h2>
                <p className="text-slate-400 mt-2">Interactive yield analysis and regional alerts.</p>
            </div>

            <GlobalMap />

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mt-8">
                <div className="bg-slate-900 p-6 rounded-xl border border-slate-800">
                    <h4 className="font-bold text-white mb-2">Regional Hotspots</h4>
                    <p className="text-sm text-slate-400">High activity detected in <span className="text-white font-medium">India (Punjab)</span> and <span className="text-white font-medium">Brazil (Mato Grosso)</span>.</p>
                </div>
                <div className="bg-slate-900 p-6 rounded-xl border border-slate-800">
                    <h4 className="font-bold text-white mb-2">Logistics Warning</h4>
                    <p className="text-sm text-slate-400">Potential supply chain disruption in <span className="text-red-400 font-medium">East Europe</span> due to weather.</p>
                </div>
                <div className="bg-slate-900 p-6 rounded-xl border border-slate-800">
                    <h4 className="font-bold text-white mb-2">Market Opportunity</h4>
                    <p className="text-sm text-slate-400">Rising demand for <span className="text-green-400 font-medium">Organic Pesticides</span> in California.</p>
                </div>
            </div>
        </div>
    );
}
