'use client';

import { useEffect, useState } from 'react';
import { ComposableMap, Geographies, Geography, ZoomableGroup } from 'react-simple-maps';
import { scaleLinear } from 'd3-scale';
import { Tooltip as ReactTooltip } from 'react-tooltip';
import { AlertTriangle } from 'lucide-react';

const geoUrl = "https://cdn.jsdelivr.net/npm/world-atlas@2/countries-110m.json";

interface GlobalMapProps {
    onCountrySelect?: (countryName: string) => void;
}

export default function GlobalMap({ onCountrySelect }: GlobalMapProps) {
    const [data, setData] = useState<any[]>([]);
    const [tooltipContent, setTooltipContent] = useState('');

    useEffect(() => {
        fetch('/api/country-stats')
            .then(res => res.json())
            .then(data => setData(data))
            .catch(err => console.error("Failed to load map data", err));
    }, []);

    const colorScale = scaleLinear<string>()
        .domain([-1, 0, 1]) // Sentiment range
        .range(["#ef4444", "#eab308", "#22c55e"]); // Red, Yellow, Green

    return (
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-lg relative">
            <h3 className="text-xl font-bold text-white mb-4">Global Sentiment Map</h3>
            <div className="h-[400px] w-full rounded-xl overflow-hidden bg-slate-800/30">
                <ComposableMap projectionConfig={{ scale: 140 }}>
                    <ZoomableGroup>
                        <Geographies geography={geoUrl}>
                            {({ geographies }) =>
                                geographies.map((geo) => {
                                    const countryName = geo.properties.name;
                                    const countryData = data.find(d => d.country === countryName);

                                    // Map sentiment string to number for color scale
                                    let sentimentVal = 0;
                                    if (countryData) {
                                        if (countryData.sentiment === 'Positive' || countryData.sentiment === 'Very Positive') sentimentVal = 0.8;
                                        else if (countryData.sentiment === 'Negative') sentimentVal = -0.8;
                                        else sentimentVal = 0;
                                    }

                                    return (
                                        <Geography
                                            key={geo.rsmKey}
                                            geography={geo}
                                            fill={countryData ? colorScale(sentimentVal) : "#334155"}
                                            stroke="#1e293b"
                                            strokeWidth={0.5}
                                            style={{
                                                default: { outline: "none" },
                                                hover: { fill: "#F53", outline: "none", cursor: 'pointer' },
                                                pressed: { outline: "none" },
                                            }}
                                            onClick={() => {
                                                if (onCountrySelect) {
                                                    onCountrySelect(countryName);
                                                }
                                            }}
                                            onMouseEnter={() => {
                                                if (countryData) {
                                                    setTooltipContent(`${countryName}: ${countryData.sentiment} (${countryData.alert !== 'None' ? '⚠️ ' + countryData.alert : 'No Alerts'})`);
                                                } else {
                                                    setTooltipContent(`${countryName}: No Data`);
                                                }
                                            }}
                                            onMouseLeave={() => {
                                                setTooltipContent("");
                                            }}
                                        />
                                    );
                                })
                            }
                        </Geographies>
                    </ZoomableGroup>
                </ComposableMap>
            </div>

            {/* Custom Tooltip Overlay */}
            {tooltipContent && (
                <div className="absolute top-20 right-6 bg-slate-800 border border-slate-700 p-3 rounded-lg shadow-xl text-sm text-white z-10 pointer-events-none">
                    {tooltipContent}
                </div>
            )}

            <div className="flex gap-4 mt-4 text-sm text-slate-400 justify-center">
                <div className="flex items-center gap-2"><div className="w-3 h-3 rounded-full bg-green-500"></div> Positive</div>
                <div className="flex items-center gap-2"><div className="w-3 h-3 rounded-full bg-yellow-500"></div> Neutral</div>
                <div className="flex items-center gap-2"><div className="w-3 h-3 rounded-full bg-red-500"></div> Negative</div>
            </div>
        </div>
    );
}
