'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { LayoutDashboard, HeartPulse, Globe, Radio, TrendingUp, Settings } from 'lucide-react';
import clsx from 'clsx';

const NAV_ITEMS = [
    { name: 'Overview', href: '/', icon: LayoutDashboard },
    { name: 'Sentiment Analysis', href: '/sentiment', icon: HeartPulse },
    { name: 'Country Details', href: '/country-stats', icon: Globe },
    { name: 'Real-time Feed', href: '/realtime', icon: Radio },
    { name: 'Market & Pricing', href: '/market', icon: TrendingUp },
];

export default function Sidebar() {
    const pathname = usePathname();

    return (
        <aside className="w-64 bg-slate-900 text-white h-screen fixed left-0 top-0 flex flex-col border-r border-slate-800">
            <div className="p-6">
                <h1 className="text-2xl font-bold text-green-400 tracking-tight">AgriTrend<span className="text-white">.ai</span></h1>
                <p className="text-xs text-slate-400 mt-1">Social Intelligence for Ag</p>
            </div>

            <nav className="flex-1 px-4 space-y-2 mt-4">
                {NAV_ITEMS.map((item) => {
                    const isActive = pathname === item.href;
                    return (
                        <Link
                            key={item.href}
                            href={item.href}
                            className={clsx(
                                'flex items-center gap-3 px-4 py-3 rounded-xl transition-all duration-200 group',
                                isActive
                                    ? 'bg-green-600/20 text-green-400 shadow-sm border border-green-600/10'
                                    : 'text-slate-400 hover:bg-slate-800 hover:text-white'
                            )}
                        >
                            <item.icon size={20} className={clsx(isActive ? 'text-green-400' : 'text-slate-500 group-hover:text-white')} />
                            <span className="font-medium">{item.name}</span>
                        </Link>
                    );
                })}
            </nav>

            <div className="p-4 border-t border-slate-800">
                <button className="flex items-center gap-3 px-4 py-3 w-full text-slate-400 hover:text-white transition-colors">
                    <Settings size={20} />
                    <span className="font-medium">Settings</span>
                </button>
            </div>
        </aside>
    );
}
