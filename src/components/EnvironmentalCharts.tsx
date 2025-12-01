'use client';

import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from 'recharts';
import { CloudRain, Thermometer } from 'lucide-react';

// Mock data structure for now, but designed to take props
// In a real app, this would come from the country_stats API
const MOCK_DATA = [
    { year: '2020', rain: 1200, temp: 24, yield: 4.5 },
    { year: '2021', rain: 1100, temp: 25, yield: 4.2 },
    { year: '2022', rain: 1350, temp: 23, yield: 4.8 },
    { year: '2023', rain: 900, temp: 26, yield: 3.9 },
    { year: '2024', rain: 1050, temp: 25, yield: 4.4 },
];

export default function EnvironmentalCharts() {
    return (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Rainfall vs Yield */}
            <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-lg">
                <h3 className="text-lg font-bold text-white mb-4 flex items-center gap-2">
                    <CloudRain className="text-blue-400" />
                    Rainfall vs Crop Yield
                </h3>
                <div className="h-[250px] w-full">
                    <ResponsiveContainer width="100%" height="100%">
                        <LineChart data={MOCK_DATA}>
                            <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" />
                            <XAxis dataKey="year" stroke="#64748b" />
                            <YAxis yAxisId="left" stroke="#64748b" />
                            <YAxis yAxisId="right" orientation="right" stroke="#64748b" />
                            <Tooltip contentStyle={{ backgroundColor: '#0f172a', borderColor: '#1e293b', color: '#fff' }} />
                            <Legend />
                            <Line yAxisId="left" type="monotone" dataKey="rain" name="Rainfall (mm)" stroke="#3b82f6" strokeWidth={2} />
                            <Line yAxisId="right" type="monotone" dataKey="yield" name="Yield (t/ha)" stroke="#10b981" strokeWidth={2} />
                        </LineChart>
                    </ResponsiveContainer>
                </div>
            </div>

            {/* Temp vs Yield */}
            <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-lg">
                <h3 className="text-lg font-bold text-white mb-4 flex items-center gap-2">
                    <Thermometer className="text-orange-400" />
                    Temperature vs Crop Yield
                </h3>
                <div className="h-[250px] w-full">
                    <ResponsiveContainer width="100%" height="100%">
                        <LineChart data={MOCK_DATA}>
                            <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" />
                            <XAxis dataKey="year" stroke="#64748b" />
                            <YAxis yAxisId="left" stroke="#64748b" />
                            <YAxis yAxisId="right" orientation="right" stroke="#64748b" />
                            <Tooltip contentStyle={{ backgroundColor: '#0f172a', borderColor: '#1e293b', color: '#fff' }} />
                            <Legend />
                            <Line yAxisId="left" type="monotone" dataKey="temp" name="Avg Temp (°C)" stroke="#f97316" strokeWidth={2} />
                            <Line yAxisId="right" type="monotone" dataKey="yield" name="Yield (t/ha)" stroke="#10b981" strokeWidth={2} />
                        </LineChart>
                    </ResponsiveContainer>
                </div>
            </div>
        </div>
    );
}
