'use client';

import { Activity, Database, Globe, Server, Wifi } from 'lucide-react';

export default function SystemHealth() {
    return (
        <div className="bg-slate-900/80 backdrop-blur-sm border border-slate-800 rounded-2xl p-6 shadow-lg">
            <h3 className="text-lg font-bold text-white mb-4 flex items-center gap-2">
                <Activity className="text-green-400" size={20} />
                System Health
            </h3>

            <div className="space-y-4">
                {/* Pipeline Status */}
                <div className="flex items-center justify-between p-3 bg-slate-800/50 rounded-xl border border-slate-700/30">
                    <div className="flex items-center gap-3">
                        <Globe size={18} className="text-blue-400" />
                        <div>
                            <p className="text-sm font-bold text-slate-200">Data Pipelines</p>
                            <p className="text-xs text-slate-500">Reddit, Twitter, News</p>
                        </div>
                    </div>
                    <div className="flex items-center gap-2">
                        <span className="relative flex h-2 w-2">
                            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75"></span>
                            <span className="relative inline-flex rounded-full h-2 w-2 bg-green-500"></span>
                        </span>
                        <span className="text-xs font-bold text-green-400">Active</span>
                    </div>
                </div>

                {/* Database Status */}
                <div className="flex items-center justify-between p-3 bg-slate-800/50 rounded-xl border border-slate-700/30">
                    <div className="flex items-center gap-3">
                        <Database size={18} className="text-purple-400" />
                        <div>
                            <p className="text-sm font-bold text-slate-200">MongoDB Atlas</p>
                            <p className="text-xs text-slate-500">Cluster0-shard-00-02</p>
                        </div>
                    </div>
                    <div className="text-right">
                        <p className="text-xs font-bold text-green-400">Connected</p>
                        <p className="text-[10px] text-slate-500">Latency: 24ms</p>
                    </div>
                </div>

                {/* API Status */}
                <div className="flex items-center justify-between p-3 bg-slate-800/50 rounded-xl border border-slate-700/30">
                    <div className="flex items-center gap-3">
                        <Server size={18} className="text-orange-400" />
                        <div>
                            <p className="text-sm font-bold text-slate-200">API Gateway</p>
                            <p className="text-xs text-slate-500">/api/trends, /api/posts</p>
                        </div>
                    </div>
                    <div className="flex items-center gap-2">
                        <Wifi size={14} className="text-green-400" />
                        <span className="text-xs font-bold text-green-400">99.9% Uptime</span>
                    </div>
                </div>
            </div>
        </div>
    );
}
