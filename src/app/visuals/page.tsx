'use client';

import { Camera, AlertTriangle, CheckCircle } from 'lucide-react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell } from 'recharts';

// Mock Data for Visual Analysis
const PEST_DATA = [
    { name: 'Fall Armyworm', count: 120, severity: 'High' },
    { name: 'Stem Borer', count: 85, severity: 'Medium' },
    { name: 'Leaf Blast', count: 60, severity: 'Medium' },
    { name: 'Aphids', count: 45, severity: 'Low' },
    { name: 'Whitefly', count: 30, severity: 'Low' },
];

const RECENT_UPLOADS = [
    { id: 1, img: 'https://images.unsplash.com/photo-1625246333195-58f214f063ce?w=400&h=300&fit=crop', status: 'Detected', pest: 'Fall Armyworm', conf: '98%' },
    { id: 2, img: 'https://images.unsplash.com/photo-1592982537447-6f2a6a0c7c18?w=400&h=300&fit=crop', status: 'Healthy', pest: 'None', conf: '99%' },
    { id: 3, img: 'https://images.unsplash.com/photo-1530836369250-ef72a3f5cda8?w=400&h=300&fit=crop', status: 'Detected', pest: 'Leaf Blast', conf: '87%' },
];

export default function VisualsPage() {
    return (
        <div className="space-y-8">
            <div>
                <h2 className="text-3xl font-bold text-white">Visual Intelligence</h2>
                <p className="text-slate-400 mt-2">AI-powered pest and disease detection from field images.</p>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                {/* Upload Section */}
                <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-lg">
                    <h3 className="text-xl font-bold text-white mb-4 flex items-center gap-2">
                        <Camera className="text-blue-400" /> Upload Image
                    </h3>
                    <div className="border-2 border-dashed border-slate-700 rounded-xl h-48 flex flex-col items-center justify-center text-slate-500 hover:border-blue-500 hover:text-blue-400 transition-colors cursor-pointer bg-slate-950/50">
                        <p>Drag & Drop or Click to Upload</p>
                        <p className="text-xs mt-2">Supports JPG, PNG</p>
                    </div>
                    <button className="w-full mt-4 bg-blue-600 hover:bg-blue-700 text-white font-bold py-3 rounded-xl transition-colors">
                        Analyze Now
                    </button>
                </div>

                {/* Pest Trends Chart */}
                <div className="lg:col-span-2 bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-lg">
                    <h3 className="text-xl font-bold text-white mb-4">Top Detected Threats (This Week)</h3>
                    <div className="h-[250px]">
                        <ResponsiveContainer width="100%" height="100%">
                            <BarChart data={PEST_DATA} layout="vertical">
                                <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" horizontal={false} />
                                <XAxis type="number" stroke="#64748b" />
                                <YAxis dataKey="name" type="category" width={100} stroke="#94a3b8" />
                                <Tooltip cursor={{ fill: 'transparent' }} contentStyle={{ backgroundColor: '#0f172a', border: 'none' }} />
                                <Bar dataKey="count" radius={[0, 4, 4, 0]}>
                                    {PEST_DATA.map((entry, index) => (
                                        <Cell key={`cell-${index}`} fill={entry.severity === 'High' ? '#EF4444' : entry.severity === 'Medium' ? '#F59E0B' : '#10B981'} />
                                    ))}
                                </Bar>
                            </BarChart>
                        </ResponsiveContainer>
                    </div>
                </div>
            </div>

            {/* Recent Analysis Grid */}
            <div>
                <h3 className="text-xl font-bold text-white mb-4">Recent Analysis</h3>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    {RECENT_UPLOADS.map((item) => (
                        <div key={item.id} className="bg-slate-900 border border-slate-800 rounded-xl overflow-hidden group">
                            <div className="h-48 overflow-hidden relative">
                                {/* eslint-disable-next-line @next/next/no-img-element */}
                                <img src={item.img} alt="Crop" className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" />
                                <div className="absolute top-2 right-2">
                                    <span className={`px-2 py-1 rounded-full text-xs font-bold ${item.status === 'Healthy' ? 'bg-green-500 text-white' : 'bg-red-500 text-white'}`}>
                                        {item.status}
                                    </span>
                                </div>
                            </div>
                            <div className="p-4">
                                <div className="flex justify-between items-center mb-2">
                                    <h4 className="font-bold text-white">{item.pest}</h4>
                                    <span className="text-xs text-slate-400">Conf: {item.conf}</span>
                                </div>
                                {item.status === 'Detected' ? (
                                    <div className="flex items-center gap-2 text-red-400 text-sm">
                                        <AlertTriangle size={16} />
                                        <span>Immediate Action Required</span>
                                    </div>
                                ) : (
                                    <div className="flex items-center gap-2 text-green-400 text-sm">
                                        <CheckCircle size={16} />
                                        <span>No Action Needed</span>
                                    </div>
                                )}
                            </div>
                        </div>
                    ))}
                </div>
            </div>
        </div>
    );
}
