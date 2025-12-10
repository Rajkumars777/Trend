'use client';

import { useEffect, useState } from 'react';
import { ComposableMap, Geographies, Geography, ZoomableGroup } from 'react-simple-maps';
import { scaleLinear } from "d3-scale";
import clsx from "clsx";
import { Tooltip as ReactTooltip } from 'react-tooltip';
import { AlertTriangle } from 'lucide-react';

const geoUrl = "https://cdn.jsdelivr.net/npm/world-atlas@2/countries-110m.json";

interface GlobalMapProps {
    className?: string;
    onCountrySelect?: (countryName: string) => void;
}

export default function GlobalMap({ className, onCountrySelect }: GlobalMapProps) {
    const [data, setData] = useState<any[]>([]);
    const [tooltipContent, setTooltipContent] = useState('');

    useEffect(() => {
        const fetchData = () => {
            fetch('/api/country-stats')
                .then(res => res.json())
                .then(data => setData(data))
                .catch(err => console.error("Failed to load map data", err));
        };

        fetchData(); // Initial fetch
        const interval = setInterval(fetchData, 30000); // Poll every 30s

        return () => clearInterval(interval);
    }, []);

    // Color Scale: Blue (0) -> Neutral (50) -> Red (100)
    const colorScale = scaleLinear<string>()
        .domain([0, 50, 100])
        .range(["#3b82f6", "#e2e8f0", "#ef4444"]);

    return (
        <div className={clsx("bg-card/50 backdrop-blur-xl border border-white/5 p-6 rounded-3xl shadow-lg flex flex-col relative overflow-hidden h-full min-h-[350px] md:min-h-[500px]", className)}>
            <div className="flex justify-between items-center mb-4">
                <h3 className="text-xl font-bold text-foreground">Global Activity Heatmap</h3>
                <div className="flex items-center gap-2 text-xs text-muted-foreground bg-muted/50 px-3 py-1 rounded-full border border-border">
                    <span>Low Activity</span>
                    <div className="w-32 h-2 rounded-full bg-gradient-to-r from-blue-500 via-slate-200 to-red-500"></div>
                    <span>High Heat</span>
                </div>
            </div>

            <div
                className="flex-1 w-full h-full rounded-xl overflow-hidden bg-muted/30 relative group flex items-center justify-center"
                onMouseLeave={() => setTooltipContent("")}
            >
                <ComposableMap
                    projectionConfig={{ scale: 220, center: [0, 20] }}
                    style={{ width: "100%", height: "100%" }}
                >
                    <ZoomableGroup zoom={1}>
                        <Geographies geography={geoUrl}>
                            {({ geographies }) =>
                                geographies.map((geo) => {
                                    const countryName = geo.properties.name;
                                    const countryData = data.find(d => d.country === countryName);
                                    const heatScore = countryData?.heatScore || 0;

                                    return (
                                        <g key={geo.rsmKey}>
                                            <Geography
                                                geography={geo}
                                                fill={countryData ? colorScale(heatScore) : "#e5e7eb"}
                                                stroke="var(--card)"
                                                strokeWidth={0.5}
                                                style={{
                                                    default: { outline: "none", fillOpacity: countryData ? 0.9 : 0.4, transition: 'all 0.3s' },
                                                    hover: { fill: "var(--foreground)", fillOpacity: 0.1, stroke: "var(--primary)", strokeWidth: 2, cursor: 'pointer' },
                                                    pressed: { outline: "none" },
                                                }}
                                                onMouseEnter={(evt) => {
                                                    const tooltipData = countryData || {
                                                        country: countryName,
                                                        heatScore: 0,
                                                        trend: 'neutral',
                                                        top_crop: { name: 'N/A', percent: 0 },
                                                        weather: { main: 'N/A', temp: 'N/A', desc: 'No Data Available', icon: 'Cloud' },
                                                        agri_stats: { precipitation: 0, humidity: 0, wind_kph: 0, chance_of_rain: 0 },
                                                        risk_alerts: [],
                                                        ai_reason: "No data available for this region.",
                                                        isMissing: true
                                                    };
                                                    setTooltipContent(JSON.stringify(tooltipData));
                                                }}
                                            />
                                        </g>
                                    );
                                })
                            }
                        </Geographies>
                    </ZoomableGroup>
                </ComposableMap>

                {/* Layer C: Rich Tooltip Card */}
                {tooltipContent && (() => {
                    const info = JSON.parse(tooltipContent);
                    const isUp = info.trend === 'up';
                    const risk = info.risk_alerts?.[0];
                    const isMissing = info.isMissing;

                    return (
                        <div className="absolute bottom-4 left-4 right-4 max-h-[60%] overflow-y-auto custom-scrollbar md:max-h-none md:overflow-visible md:top-4 md:right-4 md:left-auto md:bottom-auto md:w-72 bg-card/95 backdrop-blur-md border border-border p-0 rounded-xl shadow-2xl z-20 animate-in fade-in slide-in-from-bottom-4 md:slide-in-from-top-4 duration-300 ring-1 ring-black/5 pointer-events-auto">
                            {/* Header */}
                            <div className="p-4 border-b border-border/50 bg-muted/20 flex justify-between items-start">
                                <div>
                                    <h4 className="font-bold text-foreground text-lg leading-tight">{info.country}</h4>
                                    <span className="text-[10px] text-muted-foreground uppercase tracking-wider font-medium">Updated 2m ago</span>
                                </div>
                                <div className="flex flex-col items-end">
                                    <div className={`text-2xl font-black ${isMissing ? 'text-muted-foreground' : info.heatScore > 75 ? 'text-red-500' : info.heatScore > 40 ? 'text-amber-500' : 'text-blue-500'}`}>
                                        {isMissing ? 'N/A' : info.heatScore}
                                    </div>
                                    {!isMissing && (
                                        <div className="flex items-center gap-1 text-xs font-bold">
                                            <span className={isUp ? 'text-green-500' : 'text-red-500'}>{isUp ? '▲' : '▼'} Heat Trend</span>
                                        </div>
                                    )}
                                </div>
                            </div>

                            {/* Body Fields */}
                            <div className="p-4 space-y-4">
                                {/* Top Crop */}
                                <div className="flex items-center gap-3">
                                    <div className="w-8 h-8 rounded-full bg-emerald-500/10 flex items-center justify-center text-emerald-500">
                                        <span className="font-bold text-lg">🌱</span>
                                    </div>
                                    <div className="flex-1">
                                        <div className="text-xs text-muted-foreground font-semibold uppercase">Top Crop</div>
                                        <div className="font-medium text-foreground flex justify-between">
                                            {info.top_crop?.name || 'N/A'}
                                            <span className="text-xs bg-emerald-500/10 text-emerald-600 px-1.5 py-0.5 rounded-full">{info.top_crop?.percent || 0}% Vol</span>
                                        </div>
                                    </div>
                                </div>

                                {/* Weather */}
                                <div className="flex items-center gap-3">
                                    <div className="w-8 h-8 rounded-full bg-sky-500/10 flex items-center justify-center text-sky-500">
                                        {/* Simple dynamic icon mapping logic could go here, optimizing for generic Cloud/Sun */}
                                        <span className="font-bold text-lg">{info.weather?.icon === 'Sun' ? '☀️' : info.weather?.icon?.includes('Rain') ? '🌧️' : '☁️'}</span>
                                    </div>
                                    <div className="flex-1">
                                        <div className="text-xs text-muted-foreground font-semibold uppercase">Weather Snapshot</div>
                                        <div className="font-medium text-foreground">
                                            {info.weather?.main || 'N/A'}, {info.weather?.temp || 'N/A'}
                                        </div>
                                        <div className="text-[10px] text-muted-foreground leading-tight">{info.weather?.desc || 'No Data'}</div>
                                    </div>
                                </div>

                                {/* Agri Stats Grid */}
                                {info.agri_stats && (
                                    <div className="grid grid-cols-2 gap-2 bg-muted/30 p-2 rounded-lg border border-border/50">
                                        <div className="flex flex-col">
                                            <span className="text-[10px] text-muted-foreground font-semibold uppercase">Precip</span>
                                            <span className="text-xs font-bold text-blue-600">{info.agri_stats.precipitation}mm</span>
                                        </div>
                                        <div className="flex flex-col">
                                            <span className="text-[10px] text-muted-foreground font-semibold uppercase">Humidity</span>
                                            <span className="text-xs font-bold text-indigo-600">{info.agri_stats.humidity}%</span>
                                        </div>
                                        <div className="flex flex-col">
                                            <span className="text-[10px] text-muted-foreground font-semibold uppercase">Wind</span>
                                            <span className="text-xs font-bold text-slate-600">{info.agri_stats.wind_kph} km/h</span>
                                        </div>
                                        <div className="flex flex-col">
                                            <span className="text-[10px] text-muted-foreground font-semibold uppercase">Rain Chance</span>
                                            <span className="text-xs font-bold text-cyan-600">{info.agri_stats.chance_of_rain}%</span>
                                        </div>
                                    </div>
                                )}

                                {/* Alerts Badge */}
                                {risk ? (
                                    <div className="bg-destructive/5 border border-destructive/20 rounded-lg p-3 flex flex-col gap-2">
                                        <div className="flex gap-2 items-start">
                                            <AlertTriangle size={16} className="text-destructive shrink-0 mt-0.5" />
                                            <div>
                                                <div className="text-xs font-bold text-destructive uppercase flex items-center gap-2">
                                                    Risk Alert
                                                    {risk.severity && <span className="text-[9px] bg-destructive/10 px-1.5 py-0.5 rounded-full border border-destructive/20">{risk.severity}</span>}
                                                </div>
                                                <div className="text-sm font-semibold text-foreground leading-tight mt-0.5">
                                                    {risk.headline || risk.event || risk.type}
                                                </div>
                                                {risk.areas && (
                                                    <div className="text-[10px] text-muted-foreground mt-0.5 line-clamp-1">
                                                        Areas: {risk.areas}
                                                    </div>
                                                )}
                                                {risk.desc && (
                                                    <div className="text-[10px] text-muted-foreground mt-1 line-clamp-2 border-l-2 border-destructive/30 pl-2">
                                                        {risk.desc}
                                                    </div>
                                                )}
                                                {risk.instruction && (
                                                    <div className="text-[9px] text-destructive/80 mt-1 italic font-medium">
                                                        "{risk.instruction.slice(0, 100)}{risk.instruction.length > 100 ? '...' : ''}"
                                                    </div>
                                                )}
                                            </div>
                                        </div>
                                    </div>
                                ) : (
                                    <div className="bg-green-500/5 border border-green-500/20 rounded-lg p-2.5 flex gap-3 items-center">
                                        <div className="text-green-600">✓</div>
                                        <div className="text-sm font-medium text-green-700">No Critical Risks Detected</div>
                                    </div>
                                )}

                                {/* AI Reason */}
                                <div className="pt-3 border-t border-border/50">
                                    <div className="flex items-center gap-1.5 mb-1">
                                        <div className="w-1.5 h-1.5 rounded-full bg-purple-500 animate-pulse"></div>
                                        <span className="text-[10px] font-bold text-purple-600 uppercase">AI Analysis</span>
                                    </div>
                                    <p className="text-xs text-muted-foreground italic leading-relaxed">
                                        "{info.ai_reason}"
                                    </p>
                                </div>
                            </div>
                        </div>
                    );
                })()}
            </div>
        </div>
    );
}
