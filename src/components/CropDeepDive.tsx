'use client';

import { Sprout, AlertCircle, TrendingUp } from 'lucide-react';

interface CropData {
    name: string;
    risk: string;
    disease: string;
    yieldTrend: string;
}

interface CropDeepDiveProps {
    data?: CropData[] | null;
}

export default function CropDeepDive({ data }: CropDeepDiveProps) {
    // If no real-time data is found, we can show a placeholder or a fallback message
    // Ideally, the parent passes null while loading, or empty array if nothing found.
    const displayData = data && data.length > 0 ? data : [];

    return (
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-6 shadow-sm transition-all duration-300">
            <h3 className="text-xl font-bold text-slate-900 dark:text-white mb-6 flex items-center gap-2 transition-colors duration-300">
                <Sprout className="text-green-600 dark:text-green-500 transition-colors duration-300" />
                Crop Deep Dive & Risks
            </h3>

            <div className="overflow-hidden bg-white dark:bg-slate-950 rounded-xl border border-slate-200 dark:border-slate-800 transition-colors duration-300">
                <table className="w-full text-left text-sm text-slate-600 dark:text-slate-400 transition-colors duration-300">
                    <thead className="text-xs uppercase bg-slate-50 dark:bg-slate-900 text-slate-500 dark:text-slate-400 font-bold border-b border-slate-200 dark:border-slate-800 transition-colors duration-300">
                        <tr>
                            <th className="px-4 py-3">Crop</th>
                            <th className="px-4 py-3">Risk Level</th>
                            <th className="px-4 py-3">Top Issue</th>
                            <th className="px-4 py-3 text-right">Yield Trend</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-200 dark:divide-slate-800 transition-colors duration-300">
                        {displayData.length === 0 ? (
                            <tr>
                                <td colSpan={4} className="px-4 py-8 text-center text-slate-500">
                                    Analyzing real-time news streams for crop specific risks...
                                </td>
                            </tr>
                        ) : (
                            displayData.map((crop, i) => (
                                <tr key={i} className="hover:bg-slate-50 dark:hover:bg-slate-900/50 transition-colors duration-200">
                                    <td className="px-4 py-3 font-bold text-slate-900 dark:text-white transition-colors duration-300">{crop.name}</td>
                                    <td className="px-4 py-3">
                                        <span className={`px-2 py-0.5 rounded text-xs font-bold border transition-colors duration-300 ${crop.risk === 'High' ? 'bg-red-100 dark:bg-red-900/30 text-red-600 dark:text-red-400 border-red-200 dark:border-red-800' :
                                            crop.risk === 'Medium' ? 'bg-amber-100 dark:bg-amber-900/30 text-amber-600 dark:text-amber-400 border-amber-200 dark:border-amber-800' :
                                                'bg-emerald-100 dark:bg-emerald-900/30 text-emerald-600 dark:text-emerald-400 border-emerald-200 dark:border-emerald-800'
                                            }`}>
                                            {crop.risk}
                                        </span>
                                    </td>
                                    <td className="px-4 py-3 flex items-center gap-1.5 transition-colors duration-300">
                                        {crop.disease !== 'None' && <AlertCircle size={12} className="text-amber-500" />}
                                        {crop.disease}
                                    </td>
                                    <td className="px-4 py-3 text-right transition-colors duration-300">
                                        {crop.yieldTrend === 'up' && <TrendingUp size={14} className="text-emerald-500 ml-auto" />}
                                        {crop.yieldTrend === 'down' && <TrendingUp size={14} className="text-red-500 ml-auto rotate-180" />}
                                        {crop.yieldTrend === 'stable' && <span className="text-slate-400 font-mono">--</span>}
                                    </td>
                                </tr>
                            ))
                        )}
                    </tbody>
                </table>
            </div>
        </div>
    );
}
