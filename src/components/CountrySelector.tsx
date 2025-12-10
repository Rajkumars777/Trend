'use client';

import { useState, useRef, useEffect } from 'react';
import { ChevronDown, Search, MapPin } from 'lucide-react';
import clsx from 'clsx';

const COUNTRIES = [
    "India", "United States", "China", "Brazil", "Russia",
    "Australia", "Canada", "Argentina", "Ukraine", "France",
    "Germany", "Indonesia", "Thailand", "United Kingdom", "Japan",
    "Vietnam", "Mexico", "Turkey", "Italy", "Spain", "Pakistan",
    "Nigeria", "Egypt", "South Africa", "Bangladesh"
].sort();

interface CountrySelectorProps {
    selectedCountry: string;
    onSelect: (country: string) => void;
}

export default function CountrySelector({ selectedCountry, onSelect }: CountrySelectorProps) {
    const [isOpen, setIsOpen] = useState(false);
    const [search, setSearch] = useState('');
    const dropdownRef = useRef<HTMLDivElement>(null);

    // Close dropdown when clicking outside
    useEffect(() => {
        function handleClickOutside(event: MouseEvent) {
            if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
                setIsOpen(false);
            }
        }
        document.addEventListener("mousedown", handleClickOutside);
        return () => document.removeEventListener("mousedown", handleClickOutside);
    }, []);

    const filteredCountries = COUNTRIES.filter(c =>
        c.toLowerCase().includes(search.toLowerCase())
    );

    return (
        <div className="relative w-full max-w-sm z-50" ref={dropdownRef}>
            <button
                onClick={() => setIsOpen(!isOpen)}
                className="w-full flex items-center justify-between bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 hover:border-slate-300 dark:hover:border-slate-700 rounded-xl px-4 py-3 text-slate-900 dark:text-white transition-all shadow-sm group duration-300"
            >
                <div className="flex items-center gap-3">
                    <div className="bg-blue-50 dark:bg-blue-900/30 p-2 rounded-lg text-blue-600 dark:text-blue-400 group-hover:bg-blue-100 dark:group-hover:bg-blue-900/50 group-hover:scale-105 transition-all duration-300">
                        <MapPin size={18} />
                    </div>
                    <div className="text-left">
                        <span className="block text-xs text-slate-500 dark:text-slate-400 font-bold uppercase tracking-wider transition-colors duration-300">Analysis Target</span>
                        <span className="block font-bold text-lg leading-tighter transition-colors duration-300">{selectedCountry}</span>
                    </div>
                </div>
                <ChevronDown size={20} className={clsx("text-slate-400 dark:text-slate-500 transition-transform duration-300", isOpen && "rotate-180")} />
            </button>

            {isOpen && (
                <div className="absolute top-full left-0 right-0 mt-2 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl shadow-xl overflow-hidden animate-in fade-in zoom-in-95 duration-200 z-50">
                    <div className="p-2 border-b border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 sticky top-0 transition-colors duration-300">
                        <div className="relative">
                            <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 dark:text-slate-500" />
                            <input
                                type="text"
                                placeholder="Search country..."
                                className="w-full bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg py-2 pl-9 pr-3 text-sm text-slate-900 dark:text-white focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 transition-colors duration-300"
                                value={search}
                                onChange={(e) => setSearch(e.target.value)}
                                autoFocus
                            />
                        </div>
                    </div>
                    <div className="max-h-[300px] overflow-y-auto custom-scrollbar">
                        {filteredCountries.length > 0 ? (
                            filteredCountries.map(country => (
                                <button
                                    key={country}
                                    onClick={() => {
                                        onSelect(country);
                                        setIsOpen(false);
                                        setSearch('');
                                    }}
                                    className="w-full flex items-center justify-between px-4 py-3 hover:bg-slate-50 dark:hover:bg-slate-800 text-left transition-colors duration-200"
                                >
                                    <span className={country === selectedCountry ? "text-blue-600 dark:text-blue-400 font-bold" : "text-slate-700 dark:text-slate-300"}>
                                        {country}
                                    </span>
                                    {country === selectedCountry && (
                                        <div className="h-2 w-2 rounded-full bg-blue-500 shadow-[0_0_8px_rgba(59,130,246,0.5)]" />
                                    )}
                                </button>
                            ))
                        ) : (
                            <div className="p-4 text-center text-slate-500 text-sm">
                                No countries found.
                            </div>
                        )}
                    </div>
                </div>
            )}
        </div>
    );
}
