import { ExternalLink, TrendingUp, MapPin, Calendar, DollarSign } from 'lucide-react';
import Image from 'next/image';

export interface SearchResult {
    id: string;
    title: string;
    url: string;
    displayUrl: string;
    snippet: string;
    source: string;
    publishedAt?: string;
    price?: {
        amount: string;
        currency: string;
        trend?: 'up' | 'down' | 'stable';
    };
    location?: string;
    imageUrl?: string;
    extraParams?: { label: string; value: string }[];
}

interface SearchResultCardProps {
    result: SearchResult;
}

export default function SearchResultCard({ result }: SearchResultCardProps) {
    return (
        <div className="bg-white dark:bg-slate-900 mb-4 rounded-xl border border-slate-100 dark:border-slate-800 p-4 max-w-2xl hover:shadow-md transition-shadow">
            {/* Header: Source & Icon */}
            <div className="flex items-center gap-2 mb-2">
                <div className="w-6 h-6 rounded-full bg-slate-100 dark:bg-slate-800 flex items-center justify-center text-xs font-bold text-slate-600 dark:text-slate-400">
                    {result.source.charAt(0)}
                </div>
                <div className="flex flex-col">
                    <span className="text-xs font-medium text-slate-800 dark:text-slate-200">{result.source}</span>
                    <span className="text-[10px] text-slate-500 dark:text-slate-500 truncate max-w-[200px]">{result.displayUrl}</span>
                </div>
            </div>

            {/* Title */}
            <a href={result.url} target="_blank" rel="noopener noreferrer" className="group">
                <h3 className="text-lg font-semibold text-blue-600 dark:text-blue-400 group-hover:underline leading-tight mb-1">
                    {result.title}
                </h3>
            </a>

            {/* Price & Location Highlight (if available) */}
            {(result.price || result.location) && (
                <div className="flex flex-wrap gap-2 my-2">
                    {result.price && (
                        <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-emerald-50 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400 border border-emerald-100 dark:border-emerald-800">
                            <DollarSign size={12} className="mr-1" />
                            {result.price.currency} {result.price.amount}
                            {result.price.trend && (
                                <TrendingUp
                                    size={12}
                                    className={`ml-1 ${result.price.trend === 'down' ? 'rotate-180 text-red-500' : 'text-emerald-600'}`}
                                />
                            )}
                        </span>
                    )}
                    {result.location && (
                        <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-400 border border-slate-200 dark:border-slate-700">
                            <MapPin size={12} className="mr-1" />
                            {result.location}
                        </span>
                    )}
                </div>
            )}

            {/* Snippet + Image Layout */}
            <div className="flex gap-4">
                <div className="flex-1">
                    <p className="text-sm text-slate-600 dark:text-slate-400 leading-relaxed mb-2">
                        {result.snippet}
                    </p>

                    {/* Extra Params (Table-like, e.g., "Wholesale: $5") */}
                    {result.extraParams && result.extraParams.length > 0 && (
                        <div className="mt-2 grid grid-cols-2 gap-x-4 gap-y-1 text-xs">
                            {result.extraParams.map((param, idx) => (
                                <div key={idx}>
                                    <span className="font-semibold text-slate-700 dark:text-slate-300">{param.label}:</span> <span className="text-slate-600 dark:text-slate-400">{param.value}</span>
                                </div>
                            ))}
                        </div>
                    )}
                </div>

                {/* Optional Thumbnail */}
                {result.imageUrl && (
                    <div className="shrink-0 w-24 h-24 relative rounded-lg overflow-hidden border border-slate-200 dark:border-slate-700">
                        {/* Fallback to simple img tag if Next/Image config is tricky, but let's try standard img first for safety or basic Next Image */}
                        <img src={result.imageUrl} alt={result.title} className="object-cover w-full h-full" />
                    </div>
                )}
            </div>
        </div>
    );
}
