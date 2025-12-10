'use client';

import { Activity, Database, Globe, Server, Wifi, Play, CheckCircle, XCircle, Clock, AlertTriangle, Terminal, Cpu } from 'lucide-react';
import { Area, AreaChart, ResponsiveContainer, Tooltip, XAxis, YAxis, BarChart, Bar, Cell } from 'recharts';
import { useEffect, useState } from 'react';

// Types
interface PipelineRun {
    id: string;
    job: string;
    status: 'RUNNING' | 'SUCCESS' | 'FAILED' | 'SKIPPED';
    startTime: string;
    duration: number;
    error: string | null;
    steps: {
        name: string;
        status: string;
        timestamp: string;
        details: string;
    }[];
}

interface SystemStats {
    historical: { date: string; count: number }[];
    pipeline: {
        totalRuns: number;
        recentFailures: number;
        successRate: number;
    };
}

export default function SystemHealth() {
    const [stats, setStats] = useState<SystemStats | null>(null);
    const [runs, setRuns] = useState<PipelineRun[]>([]);
    const [selectedRun, setSelectedRun] = useState<PipelineRun | null>(null);

    useEffect(() => {
        const fetchData = async () => {
            try {
                const [statsRes, runsRes] = await Promise.all([
                    fetch('/api/system-stats'),
                    fetch('/api/system-health/runs')
                ]);
                const statsData = await statsRes.json();
                const runsData = await runsRes.json();

                setStats(statsData);
                setRuns(runsData);
                if (runsData.length > 0 && !selectedRun) {
                    setSelectedRun(runsData[0]);
                }
            } catch (err) {
                console.error("Failed to load health data", err);
            }
        };

        fetchData();
        const interval = setInterval(fetchData, 5000); // Polling every 5s
        return () => clearInterval(interval);
    }, []);

    const getStatusColor = (status: string) => {
        switch (status) {
            case 'SUCCESS': return 'text-positive bg-positive/10 border-positive/20';
            case 'FAILED': return 'text-red-400 bg-red-500/10 border-red-500/20';
            case 'RUNNING': return 'text-blue-400 bg-blue-500/10 border-blue-500/20 animate-pulse';
            default: return 'text-neutral bg-neutral/10 border-white/5';
        }
    };

    return (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">

            {/* Left Column: Metrics & Pipeline Visual (2/3 width) */}
            <div className="md:col-span-2 space-y-6">

                {/* 1. KEY METRICS ROW */}
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                    <div className="bg-card/70 border border-white/5 rounded-2xl p-5 relative overflow-hidden group">
                        <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:opacity-20 transition-opacity">
                            <Activity size={40} />
                        </div>
                        <p className="text-neutral text-xs uppercase font-bold tracking-wider">Success Rate</p>
                        <h3 className="text-3xl font-bold text-foreground mt-1">{stats?.pipeline?.successRate || 100}%</h3>
                        <div className="w-full h-1 bg-white/5 mt-4 rounded-full overflow-hidden">
                            <div className="h-full bg-positive transition-all duration-1000" style={{ width: `${stats?.pipeline?.successRate || 100}%` }}></div>
                        </div>
                    </div>

                    <div className="bg-card/70 border border-white/5 rounded-2xl p-5 relative overflow-hidden group">
                        <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:opacity-20 transition-opacity">
                            <Database size={40} />
                        </div>
                        <p className="text-neutral text-xs uppercase font-bold tracking-wider">Total Runs</p>
                        <h3 className="text-3xl font-bold text-foreground mt-1">{stats?.pipeline?.totalRuns || 0}</h3>
                        <p className="text-[10px] text-neutral/60 mt-2">Lifetime executions</p>
                    </div>

                    <div className="bg-card/70 border border-white/5 rounded-2xl p-5 relative overflow-hidden group">
                        <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:opacity-20 transition-opacity">
                            <AlertTriangle size={40} className="text-amber-500" />
                        </div>
                        <p className="text-neutral text-xs uppercase font-bold tracking-wider">Recent Failures</p>
                        <h3 className="text-3xl font-bold text-amber-400 mt-1">{stats?.pipeline?.recentFailures || 0}</h3>
                        <p className="text-[10px] text-neutral/60 mt-2">Last 24 hours</p>
                    </div>
                </div>

                {/* 2. PIPELINE VISUALIZATION (THE "BACKGROUND WORK") */}
                <div className="bg-card/70 border border-white/5 rounded-3xl p-6 relative overflow-hidden min-h-[300px]">
                    <h3 className="text-lg font-bold text-foreground mb-6 flex items-center gap-2">
                        <Cpu size={20} className="text-primary" />
                        <span>Active Pipeline Trace</span>
                    </h3>

                    {selectedRun ? (
                        <div className="space-y-6">
                            <div className="flex items-center justify-between">
                                <div className="flex items-center gap-3">
                                    <span className={`px-2 py-0.5 rounded text-[10px] font-bold border ${getStatusColor(selectedRun.status)}`}>
                                        {selectedRun.status}
                                    </span>
                                    <span className="text-sm font-mono text-neutral/80">{selectedRun.job}</span>
                                </div>
                                <span className="text-xs text-neutral/50 font-mono">Run ID: {selectedRun.id.split('-')[0]}...</span>
                            </div>

                            {/* Steps Visualization */}
                            <div className="relative">
                                {/* Connector Line */}
                                <div className="absolute left-[19px] top-0 bottom-0 w-0.5 bg-white/5"></div>

                                <div className="space-y-4">
                                    {selectedRun.steps.map((step, idx) => (
                                        <div key={idx} className="relative flex gap-4 group">
                                            {/* Status Dot */}
                                            <div className={`
                                                relative z-10 w-10 h-10 rounded-full border-4 border-card flex items-center justify-center shrink-0
                                                ${step.status === 'SUCCESS' ? 'bg-positive text-neutral-900' :
                                                    step.status === 'FAILED' ? 'bg-red-500 text-white' :
                                                        step.status === 'STARTED' ? 'bg-blue-500 text-white animate-pulse' : 'bg-neutral/20 text-neutral'}
                                            `}>
                                                {step.status === 'SUCCESS' && <CheckCircle size={16} />}
                                                {step.status === 'FAILED' && <XCircle size={16} />}
                                                {step.status === 'STARTED' && <Activity size={16} />}
                                                {step.status === 'INFO' && <div className="w-2 h-2 bg-current rounded-full" />}
                                                {step.status === 'WARNING' && <AlertTriangle size={16} />}
                                            </div>

                                            {/* Content */}
                                            <div className="flex-1 pt-1 pb-4 border-b border-white/5 last:border-0">
                                                <div className="flex justify-between items-start">
                                                    <div>
                                                        <p className="text-sm font-bold text-foreground">{step.name}</p>
                                                        <p className="text-xs text-neutral/60 mt-1 font-mono">{step.details}</p>
                                                    </div>
                                                    <span className="text-[10px] text-neutral/40 font-mono">
                                                        {new Date(step.timestamp).toLocaleTimeString()}
                                                    </span>
                                                </div>
                                            </div>
                                        </div>
                                    ))}

                                    {selectedRun.steps.length === 0 && (
                                        <div className="p-4 text-center text-neutral/50 text-sm">
                                            Initializing pipeline steps...
                                        </div>
                                    )}
                                </div>
                            </div>
                        </div>
                    ) : (
                        <div className="flex flex-col items-center justify-center h-48 text-neutral/40">
                            <Terminal size={48} className="mb-4 opacity-50" />
                            <p>No active pipelines detected.</p>
                        </div>
                    )}
                </div>

                {/* 3. PERFORMANCE PLOT */}
                <div className="h-64 w-full p-6 bg-card/70 border border-white/5 rounded-3xl relative">
                    <h3 className="text-sm font-bold text-neutral mb-4 uppercase tracking-wider">System Throughput</h3>
                    <ResponsiveContainer width="100%" height="80%">
                        <AreaChart data={stats?.historical || []}>
                            <defs>
                                <linearGradient id="colorCount" x1="0" y1="0" x2="0" y2="1">
                                    <stop offset="5%" stopColor="var(--primary)" stopOpacity={0.3} />
                                    <stop offset="95%" stopColor="var(--primary)" stopOpacity={0} />
                                </linearGradient>
                            </defs>
                            <Tooltip
                                contentStyle={{ backgroundColor: '#0f172a', borderColor: 'rgba(255,255,255,0.1)', borderRadius: '8px' }}
                                itemStyle={{ color: 'var(--primary)' }}
                            />
                            <Area
                                type="monotone"
                                dataKey="count"
                                stroke="var(--primary)"
                                strokeWidth={2}
                                fillOpacity={1}
                                fill="url(#colorCount)"
                            />
                        </AreaChart>
                    </ResponsiveContainer>
                </div>
            </div>

            {/* Right Column: Run History & Connections (1/3 width) */}
            <div className="space-y-6">

                {/* CONNECTION STATUS */}
                <div className="bg-card/70 border border-white/5 rounded-3xl p-6 space-y-4">
                    <h3 className="text-sm font-bold text-foreground mb-2">Systems Status</h3>

                    <div className="flex items-center justify-between p-3 rounded-xl bg-background/50 border border-white/5">
                        <div className="flex items-center gap-3">
                            <div className="p-2 bg-green-500/10 rounded-lg text-green-500"><Database size={16} /></div>
                            <span className="text-sm font-medium">MongoDB Atlas</span>
                        </div>
                        <span className="w-2 h-2 rounded-full bg-green-500 shadow-[0_0_8px_rgba(34,197,94,0.6)]"></span>
                    </div>

                    <div className="flex items-center justify-between p-3 rounded-xl bg-background/50 border border-white/5">
                        <div className="flex items-center gap-3">
                            <div className="p-2 bg-blue-500/10 rounded-lg text-blue-500"><Globe size={16} /></div>
                            <span className="text-sm font-medium">Ext. APIs</span>
                        </div>
                        <span className="w-2 h-2 rounded-full bg-green-500 shadow-[0_0_8px_rgba(34,197,94,0.6)]"></span>
                    </div>

                    <div className="flex items-center justify-between p-3 rounded-xl bg-background/50 border border-white/5">
                        <div className="flex items-center gap-3">
                            <div className="p-2 bg-purple-500/10 rounded-lg text-purple-500"><Server size={16} /></div>
                            <span className="text-sm font-medium">Backend Sync</span>
                        </div>
                        <span className="w-2 h-2 rounded-full bg-green-500 shadow-[0_0_8px_rgba(34,197,94,0.6)]"></span>
                    </div>
                </div>

                {/* RECENT RUNS LIST */}
                <div className="bg-card/70 border border-white/5 rounded-3xl p-6 flex-1 flex flex-col h-[600px]">
                    <h3 className="text-sm font-bold text-foreground mb-4 flex items-center justify-between">
                        <span>Recent Activity</span>
                        <span className="px-2 py-0.5 rounded-full bg-white/5 text-[10px] text-neutral/70">{runs.length} runs</span>
                    </h3>

                    <div className="overflow-y-auto space-y-2 pr-2 custom-scrollbar flex-1">
                        {runs.map(run => (
                            <button
                                key={run.id}
                                onClick={() => setSelectedRun(run)}
                                className={`w-full text-left p-3 rounded-xl transition-all duration-200 border ${selectedRun?.id === run.id ? 'bg-primary/10 border-primary/30' : 'bg-background/30 border-white/5 hover:bg-white/5'
                                    }`}
                            >
                                <div className="flex justify-between items-start mb-1">
                                    <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded ${run.status === 'SUCCESS' ? 'text-positive bg-positive/10' :
                                            run.status === 'FAILED' ? 'text-red-400 bg-red-500/10' : 'text-blue-400 bg-blue-500/10'
                                        }`}>
                                        {run.status}
                                    </span>
                                    <span className="text-[10px] text-neutral/50 font-mono">
                                        {new Date(run.startTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                    </span>
                                </div>
                                <p className="text-xs font-bold text-foreground truncate">{run.job}</p>
                                <p className="text-[10px] text-neutral/60 mt-1 flex items-center gap-1">
                                    <Clock size={10} /> {run.duration.toFixed(1)}s
                                </p>
                            </button>
                        ))}
                    </div>
                </div>

            </div>
        </div>
    );
}
