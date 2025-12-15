'use client';

import { useState, useEffect } from 'react';
import { CloudRain, Sun, Thermometer, Wind } from 'lucide-react';

export default function LiveHeader() {
    const [time, setTime] = useState<Date | null>(null);
    const [weather, setWeather] = useState<{ temp: string | number; rain: string | number; wind: string | number; }>({ temp: '--', rain: '--', wind: '--' });
    const [locationName, setLocationName] = useState('Loading location...');

    useEffect(() => {
        setTime(new Date());
        const timer = setInterval(() => setTime(new Date()), 1000);

        const fetchWeather = async (lat: number, lon: number) => {
            try {
                const response = await fetch(
                    `https://api.open-meteo.com/v1/forecast?latitude=${lat}&longitude=${lon}&current=temperature_2m,rain,wind_speed_10m`
                );
                const data = await response.json();

                if (data.current) {
                    setWeather({
                        temp: data.current.temperature_2m,
                        rain: data.current.rain,
                        wind: data.current.wind_speed_10m
                    });
                }
            } catch (error) {
                console.error("Failed to fetch weather data", error);
            }
        };

        const getLocationAndFetchWeather = () => {
            if (navigator.geolocation) {
                navigator.geolocation.getCurrentPosition(
                    (position) => {
                        fetchWeather(position.coords.latitude, position.coords.longitude);
                        setLocationName('Local Weather');
                    },
                    (error) => {
                        console.warn("Geolocation denied or failed, using default (London)", error);
                        fetchWeather(51.5074, -0.1278); // Default to London
                        setLocationName('London (Default)');
                    }
                );
            } else {
                fetchWeather(51.5074, -0.1278);
                setLocationName('London (Default)');
            }
        };

        getLocationAndFetchWeather();

        // Refresh weather every 15 minutes
        const weatherInterval = setInterval(getLocationAndFetchWeather, 15 * 60 * 1000);

        return () => {
            clearInterval(timer);
            clearInterval(weatherInterval);
        };
    }, []);

    return (
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-8">
            <div>
                <h2 className="text-4xl font-extrabold text-transparent bg-clip-text bg-gradient-to-r from-primary to-positive tracking-tight">
                    Agriculture Intelligence Hub
                </h2>
                <div className="flex items-center gap-2 mt-1">
                    <p className="text-neutral font-medium">Real-time market, social, and environmental insights.</p>
                    {/* Optional: Show location source if desired, currently sticking to design */}
                </div>
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
