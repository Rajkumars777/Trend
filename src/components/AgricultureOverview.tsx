'use client';

import { Users, Tractor, Sprout, Landmark, Scale, ShieldCheck } from 'lucide-react';

interface AgricultureOverviewProps {
    data: any;
    loading: boolean;
}

export default function AgricultureOverview({ data, loading }: AgricultureOverviewProps) {
    if (loading) {
        return <div className="animate-pulse bg-white dark:bg-slate-900 p-6 rounded-xl border border-slate-200 dark:border-slate-800 h-[200px] flex items-center justify-center text-slate-400 dark:text-slate-500">Loading Economics...</div>;
    }

    if (!data) return null;

    return (
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-6 shadow-sm transition-all duration-300">
            <h3 className="text-xl font-bold text-slate-900 dark:text-white mb-6 flex items-center gap-2 transition-colors duration-300">
                <Landmark className="text-amber-500" />
                Economic & Strategic Overview
            </h3>

            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
                <div className="bg-slate-50 dark:bg-slate-950 p-4 rounded-xl border border-slate-200 dark:border-slate-800 transition-colors duration-300">
                    <div className="flex items-center gap-2 text-slate-500 dark:text-slate-400 text-xs font-bold uppercase mb-2 transition-colors duration-300">
                        <Scale size={14} className="text-emerald-500" /> GDP Contrib.
                    </div>
                    <div className="text-2xl font-black text-slate-900 dark:text-white transition-colors duration-300">{data.gdpContribution}</div>
                </div>
                <div className="bg-slate-50 dark:bg-slate-950 p-4 rounded-xl border border-slate-200 dark:border-slate-800 transition-colors duration-300">
                    <div className="flex items-center gap-2 text-slate-500 dark:text-slate-400 text-xs font-bold uppercase mb-2 transition-colors duration-300">
                        <Users size={14} className="text-blue-500" /> Employment
                    </div>
                    <div className="text-2xl font-black text-slate-900 dark:text-white transition-colors duration-300">{data.employment}</div>
                </div>
                <div className="bg-slate-50 dark:bg-slate-950 p-4 rounded-xl border border-slate-200 dark:border-slate-800 transition-colors duration-300">
                    <div className="flex items-center gap-2 text-slate-500 dark:text-slate-400 text-xs font-bold uppercase mb-2 transition-colors duration-300">
                        <ShieldCheck size={14} className="text-purple-500" /> Food Security
                    </div>
                    <div className="text-lg font-bold text-slate-900 dark:text-white leading-tight transition-colors duration-300">{data.foodSecurityIndex}</div>
                </div>
                <div className="bg-slate-50 dark:bg-slate-950 p-4 rounded-xl border border-slate-200 dark:border-slate-800 transition-colors duration-300">
                    <div className="flex items-center gap-2 text-slate-500 dark:text-slate-400 text-xs font-bold uppercase mb-2 transition-colors duration-300">
                        <Tractor size={14} className="text-orange-500" /> Arable Land
                    </div>
                    <div className="text-lg font-bold text-slate-900 dark:text-white leading-tight transition-colors duration-300">{data.arableLand}</div>
                </div>
            </div>

            <div className="bg-gradient-to-r from-blue-50 to-white dark:from-blue-950 dark:to-slate-900 border border-blue-100 dark:border-blue-900 p-4 rounded-xl flex items-start gap-4 transition-all duration-300">
                <div className="bg-blue-100 dark:bg-blue-900/50 p-2 rounded-lg text-blue-600 dark:text-blue-400 shrink-0 transition-colors duration-300">
                    <Landmark size={24} />
                </div>
                <div>
                    <h4 className="text-blue-600 dark:text-blue-400 text-xs font-bold uppercase tracking-wider mb-1 transition-colors duration-300">Key Policy Highlight</h4>
                    <p className="text-slate-700 dark:text-slate-300 font-medium text-lg leading-snug transition-colors duration-300">
                        "{data.policyHighlight}"
                    </p>
                </div>
            </div>
        </div>
    );
}
