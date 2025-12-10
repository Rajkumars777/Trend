'use client';

import { useState, useEffect } from 'react';
import { CloudRain, Sun, Thermometer, Wind } from 'lucide-react';

export default function LiveHeader() {
    const [time, setTime] = useState<Date | null>(null);
    const [weather, setWeather] = useState({ temp: 24, rain: 1200, wind: 12 });

    useEffect(() => {
        setTime(new Date()); // Set initial client time
        const timer = setInterval(() => setTime(new Date()), 1000);

        // Simulate dynamic weather changes
        const weatherTimer = setInterval(() => {
            setWeather(prev => ({
                temp: +(prev.temp + (Math.random() * 0.4 - 0.2)).toFixed(1),
                rain: Math.floor(prev.rain + (Math.random() * 10 - 5)),
                wind: +(prev.wind + (Math.random() * 2 - 1)).toFixed(1)
            }));
        }, 5000);

        return () => {
            clearInterval(timer);
            clearInterval(weatherTimer);
        };
    }, []);

    return (
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-8">
            <div>
                <h2 className="text-4xl font-extrabold text-transparent bg-clip-text bg-gradient-to-r from-primary to-positive tracking-tight">
                    Agriculture Intelligence Hub
                </h2>
                <p className="text-neutral mt-1 font-medium">Real-time market, social, and environmental insights.</p>
            </div>

            <div className="flex gap-4 items-center">
                {/* Clock */}
                <div className="text-right hidden md:block mr-4">
                    <div className="text-2xl font-bold text-foreground font-mono min-w-[120px]">
                        {time ? time.toLocaleTimeString([], { hour12: false }) : '--:--:--'}
                    </div>
                    <div className="text-xs text-neutral uppercase font-bold tracking-wider">
                        {time ? time.toLocaleDateString(undefined, { weekday: 'long', month: 'short', day: 'numeric' }) : 'Loading...'}
                    </div>
                </div>

                {/* Weather Widgets */}
                <div className="flex gap-3">
                    <div className="bg-card/50 backdrop-blur-md border border-neutral/20 px-4 py-2 rounded-xl flex items-center gap-3 shadow-lg">
                        <Thermometer size={20} className="text-accent" />
                        <div>
                            <span className="text-foreground font-bold block leading-none">{weather.temp}°C</span>
                            <span className="text-[10px] text-neutral uppercase font-bold">Avg Temp</span>
                        </div>
                    </div>
                    <div className="bg-card/50 backdrop-blur-md border border-neutral/20 px-4 py-2 rounded-xl flex items-center gap-3 shadow-lg">
                        <CloudRain size={20} className="text-primary" />
                        <div>
                            <span className="text-foreground font-bold block leading-none">{weather.rain}mm</span>
                            <span className="text-[10px] text-neutral uppercase font-bold">Rainfall</span>
                        </div>
                    </div>
                    <div className="bg-card/50 backdrop-blur-md border border-neutral/20 px-4 py-2 rounded-xl flex items-center gap-3 shadow-lg hidden lg:flex">
                        <Wind size={20} className="text-positive" />
                        <div>
                            <span className="text-foreground font-bold block leading-none">{weather.wind}km/h</span>
                            <span className="text-[10px] text-neutral uppercase font-bold">Wind</span>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
