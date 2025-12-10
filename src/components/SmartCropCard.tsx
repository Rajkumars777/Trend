'use client';

import { Sprout, TrendingUp, AlertTriangle, CheckCircle2 } from 'lucide-react';

interface Recommendation {
    crop: string;
    score: number;
    reason: string;
    risk: string;
}

interface SmartCropCardProps {
    recommendation: Recommendation;
}

export default function SmartCropCard({ recommendation }: SmartCropCardProps) {
    if (!recommendation) return null;

    return (
        <div className="bg-gradient-to-br from-emerald-50 to-white dark:from-emerald-900/40 dark:to-slate-900 border border-emerald-100 dark:border-emerald-500/30 rounded-2xl p-6 shadow-sm dark:shadow-lg relative overflow-hidden group transition-all">
            <div className="absolute top-0 right-0 p-6 opacity-5 dark:opacity-10 group-hover:opacity-10 dark:group-hover:opacity-20 transition-opacity">
                <Sprout size={100} className="text-emerald-600 dark:text-emerald-400" />
            </div>

            <div className="flex items-center gap-2 mb-4">
                <div className="bg-emerald-100 dark:bg-emerald-500/20 p-2 rounded-lg text-emerald-600 dark:text-emerald-400">
                    <CheckCircle2 size={24} />
                </div>
                <h3 className="text-xl font-bold text-slate-900 dark:text-white">Smart Crop Recommendation</h3>
            </div>

            <div className="mb-6">
                <p className="text-slate-500 dark:text-slate-400 text-sm mb-1 uppercase tracking-wider font-bold">Best Crop to Plant</p>
                <div className="font-black text-4xl text-slate-900 dark:text-white tracking-tight flex items-center gap-3">
                    {recommendation.crop}
                    <span className="text-lg bg-emerald-100 dark:bg-emerald-500/20 text-emerald-700 dark:text-emerald-300 px-3 py-1 rounded-full border border-emerald-200 dark:border-emerald-500/30">
                        {recommendation.score}/100 Score
                    </span>
                </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
                <div className="bg-white/60 dark:bg-slate-950/50 p-3 rounded-xl border border-emerald-100/50 dark:border-slate-800 shadow-sm dark:shadow-none">
                    <p className="text-slate-500 text-xs font-bold mb-1">Key Driver</p>
                    <div className="flex items-center gap-2 text-emerald-600 dark:text-emerald-400 font-bold">
                        <TrendingUp size={16} /> {recommendation.reason}
                    </div>
                </div>
                <div className="bg-white/60 dark:bg-slate-950/50 p-3 rounded-xl border border-emerald-100/50 dark:border-slate-800 shadow-sm dark:shadow-none">
                    <p className="text-slate-500 text-xs font-bold mb-1">Risk Factors</p>
                    <div className={`flex items-center gap-2 font-bold ${recommendation.risk === 'Low' ? 'text-blue-600 dark:text-blue-400' : 'text-amber-600 dark:text-amber-400'}`}>
                        <AlertTriangle size={16} /> {recommendation.risk} Risk
                    </div>
                </div>
            </div>
        </div>
    );
}
