'use client';

import { useEffect, useState } from 'react';
import { ComposableMap, Geographies, Geography, ZoomableGroup } from 'react-simple-maps';
import { feature } from 'topojson-client';
import { geoCentroid, geoBounds } from 'd3-geo';

const geoUrl = "https://cdn.jsdelivr.net/npm/world-atlas@2/countries-110m.json";

interface SingleCountryMapProps {
    country: string;
}

export default function SingleCountryMap({ country }: SingleCountryMapProps) {
    const [geography, setGeography] = useState<object | null>(null);
    const [center, setCenter] = useState<[number, number]>([0, 0]);
    const [zoom, setZoom] = useState(1);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        setLoading(true);
        fetch(geoUrl)
            .then(res => res.json())
            .then(data => {
                // @ts-ignore
                const countries = feature(data, data.objects.countries).features;
                // Case-insensitive match for robustness
                const selected = countries.find((c: { properties: { name: string } }) =>
                    c.properties.name.toLowerCase() === country.toLowerCase() ||
                    c.properties.name === country
                );

                if (selected) {
                    setGeography(selected);

                    // Dynamic Center & Zoom
                    const centroid = geoCentroid(selected);
                    setCenter(centroid);

                    const bounds = geoBounds(selected);
                    const dx = bounds[1][0] - bounds[0][0];
                    const dy = bounds[1][1] - bounds[0][1];
                    const maxDim = Math.max(dx, dy);

                    if (maxDim > 0) {
                        // Heuristic: 250 / degrees provides a very tight fit for the 800px height
                        // Increased from previous values to maximize size as requested
                        const calculatedZoom = 250 / maxDim;
                        setZoom(Math.min(50, Math.max(1, calculatedZoom)));
                    } else {
                        setZoom(1);
                    }
                } else {
                    setGeography(null);
                }
            })
            .catch(err => console.error("Failed to load map data", err))
            .finally(() => setLoading(false));
    }, [country]);

    if (!geography && !loading) {
        return (
            <div className="h-[800px] w-full bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl flex items-center justify-center text-slate-400 dark:text-slate-500 transition-all duration-300">
                Map data unavailable for {country}
            </div>
        );
    }

    return (
        <div className="w-full h-[800px] flex items-center justify-center overflow-hidden cursor-default relative rounded-3xl pointer-events-none transition-all duration-300">
            {/* Ambient Background Glow */}
            <div className="absolute inset-0 bg-blue-500/5 blur-3xl rounded-full transform scale-90" />

            <ComposableMap
                projectionConfig={{ scale: 200 }}
                className="w-full h-full relative z-10"
                width={800}
                height={800}
            >
                <defs>
                    <linearGradient id="geoGradient" x1="0%" y1="0%" x2="0%" y2="100%">
                        <stop offset="0%" stopColor="#60a5fa" /> {/* blue-400 */}
                        <stop offset="100%" stopColor="#2563eb" /> {/* blue-600 */}
                    </linearGradient>
                    <filter id="geoGlow" height="130%">
                        <feGaussianBlur in="SourceAlpha" stdDeviation="5" />
                        <feOffset dx="0" dy="4" result="offsetblur" />
                        <feComponentTransfer>
                            <feFuncA type="linear" slope="0.5" />
                        </feComponentTransfer>
                        <feMerge>
                            <feMergeNode />
                            <feMergeNode in="SourceGraphic" />
                        </feMerge>
                    </filter>
                </defs>
                {geography && (
                    <ZoomableGroup
                        key={country}
                        center={center}
                        zoom={zoom}
                        minZoom={1}
                        maxZoom={50}
                    >
                        <Geographies geography={geoUrl}>
                            {({ geographies }) =>
                                geographies.map((geo) => {
                                    const isSelected = geo.properties.name === country ||
                                        geo.properties.name.toLowerCase() === country.toLowerCase();
                                    if (!isSelected) return null;

                                    return (
                                        <Geography
                                            key={geo.rsmKey}
                                            geography={geo}
                                            fill="url(#geoGradient)"
                                            filter="url(#geoGlow)"
                                            stroke="none"
                                            style={{
                                                default: { outline: "none" },
                                                hover: { fill: "#3b82f6", outline: "none", filter: "url(#geoGlow)" },
                                                pressed: { outline: "none" },
                                            }}
                                        />
                                    );
                                })
                            }
                        </Geographies>
                    </ZoomableGroup>
                )}
            </ComposableMap>
        </div>
    );
}
