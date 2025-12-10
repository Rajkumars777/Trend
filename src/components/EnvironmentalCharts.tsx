'use client';

import { useState, useEffect } from 'react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from 'recharts';
import { CloudRain, Thermometer } from 'lucide-react';
import { useTheme } from 'next-themes';

interface EnvironmentalChartsProps {
    country: string;
}

export default function EnvironmentalCharts({ country }: EnvironmentalChartsProps) {
    const [data, setData] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const { resolvedTheme } = useTheme();
    const isDark = resolvedTheme === 'dark';

    useEffect(() => {
        async function fetchData() {
            setLoading(true);
            try {
                const res = await fetch(`/api/environmental-stats?country=${country}`);
                if (res.ok) {
                    const result = await res.json();
                    setData(Array.isArray(result) ? result : []);
                } else {
                    setData([]);
                }
            } catch (e) {
                console.error("Failed to fetch environmental stats", e);
                setData([]);
            } finally {
                setLoading(false);
            }
        }
        if (country) fetchData();
    }, [country]);

    // Chart Colors
    const gridColor = isDark ? "#1e293b" : "#e2e8f0";
    const axisColor = isDark ? "#94a3b8" : "#64748b";
    const tooltipBg = isDark ? "#1e293b" : "#ffffff";
    const tooltipBorder = isDark ? "#334155" : "#e2e8f0";
    const tooltipText = isDark ? "#f8fafc" : "#0f172a";

    return (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Rainfall vs Yield */}
            <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-6 shadow-sm transition-all duration-300">
                <h3 className="text-lg font-bold text-slate-900 dark:text-white mb-4 flex items-center gap-2 transition-colors duration-300">
                    <CloudRain className="text-blue-600" />
                    Rainfall vs Crop Yield
                </h3>
                <div className="h-[250px] w-full">
                    {loading ? (
                        <div className="h-full flex items-center justify-center text-slate-400 dark:text-slate-500">Loading...</div>
                    ) : data.length > 0 ? (
                        <ResponsiveContainer width="100%" height="100%">
                            <LineChart data={data}>
                                <CartesianGrid strokeDasharray="3 3" stroke={gridColor} opacity={0.8} />
                                <XAxis dataKey="year" stroke={axisColor} tick={{ fontSize: 12 }} />
                                <YAxis yAxisId="left" stroke={axisColor} tick={{ fontSize: 12 }} />
                                <YAxis yAxisId="right" orientation="right" stroke={axisColor} tick={{ fontSize: 12 }} />
                                <Tooltip contentStyle={{ backgroundColor: tooltipBg, borderColor: tooltipBorder, color: tooltipText, borderRadius: '8px', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }} />
                                <Legend wrapperStyle={{ color: axisColor }} />
                                <Line yAxisId="left" type="monotone" dataKey="rain" name="Rainfall (mm)" stroke="#3b82f6" strokeWidth={2} dot={{ r: 4 }} activeDot={{ r: 6 }} />
                                <Line yAxisId="right" type="monotone" dataKey="yield" name="Yield (t/ha)" stroke="#22c55e" strokeWidth={2} dot={{ r: 4 }} activeDot={{ r: 6 }} />
                            </LineChart>
                        </ResponsiveContainer>
                    ) : (
                        <div className="h-full flex items-center justify-center text-slate-500 italic">No environmental data for {country}.</div>
                    )}
                </div>
            </div>

            {/* Temp vs Yield */}
            <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-6 shadow-sm transition-all duration-300">
                <h3 className="text-lg font-bold text-slate-900 dark:text-white mb-4 flex items-center gap-2 transition-colors duration-300">
                    <Thermometer className="text-orange-500" />
                    Temperature vs Crop Yield
                </h3>
                <div className="h-[250px] w-full">
                    {loading ? (
                        <div className="h-full flex items-center justify-center text-slate-400 dark:text-slate-500">Loading...</div>
                    ) : data.length > 0 ? (
                        <ResponsiveContainer width="100%" height="100%">
                            <LineChart data={data}>
                                <CartesianGrid strokeDasharray="3 3" stroke={gridColor} opacity={0.8} />
                                <XAxis dataKey="year" stroke={axisColor} tick={{ fontSize: 12 }} />
                                <YAxis yAxisId="left" stroke={axisColor} tick={{ fontSize: 12 }} />
                                <YAxis yAxisId="right" orientation="right" stroke={axisColor} tick={{ fontSize: 12 }} />
                                <Tooltip contentStyle={{ backgroundColor: tooltipBg, borderColor: tooltipBorder, color: tooltipText, borderRadius: '8px', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }} />
                                <Legend wrapperStyle={{ color: axisColor }} />
                                <Line yAxisId="left" type="monotone" dataKey="temp" name="Avg Temp (°C)" stroke="#f59e0b" strokeWidth={2} dot={{ r: 4 }} activeDot={{ r: 6 }} />
                                <Line yAxisId="right" type="monotone" dataKey="yield" name="Yield (t/ha)" stroke="#22c55e" strokeWidth={2} dot={{ r: 4 }} activeDot={{ r: 6 }} />
                            </LineChart>
                        </ResponsiveContainer>
                    ) : (
                        <div className="h-full flex items-center justify-center text-slate-500 italic">No environmental data for {country}.</div>
                    )}
                </div>
            </div>
        </div>
    );
}
