'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { LayoutDashboard, HeartPulse, Globe, Radio, TrendingUp, Settings } from 'lucide-react';
import clsx from 'clsx';
import { ThemeToggle } from './ThemeToggle';

const NAV_SECTIONS = [
    {
        title: 'Analytics',
        items: [
            { name: 'Overview', href: '/', icon: LayoutDashboard },
            { name: 'Sentiment Analysis', href: '/sentiment', icon: HeartPulse },
            { name: 'Country Intelligence', href: '/country-stats', icon: Globe },
        ]
    },
    {
        title: 'Real-time Monitoring',
        items: [
            { name: 'Real-time Feed', href: '/realtime', icon: Radio },
        ]
    },
    {
        title: 'Market Intelligence',
        items: [
            { name: 'Market & Pricing', href: '/market', icon: TrendingUp },
        ]
    }
];

export default function Sidebar() {
    const pathname = usePathname();

    return (
        <aside className="w-64 bg-card text-card-foreground h-screen fixed left-0 top-0 flex flex-col border-r border-border shadow-sm transition-colors duration-300 overflow-y-auto">
            <div className="p-6 pb-2">
                <h1 className="text-2xl font-bold text-primary tracking-tight">AgriTrend<span className="text-foreground">.ai</span></h1>
                <p className="text-xs text-muted-foreground mt-1">Social Intelligence for Ag</p>
            </div>

            <nav className="flex-1 px-4 mt-6 mb-6">
                {NAV_SECTIONS.map((section) => (
                    <div key={section.title} className="mb-6">
                        <h3 className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider mb-2 px-4 transition-colors">
                            {section.title}
                        </h3>
                        <div className="space-y-1">
                            {section.items.map((item) => {
                                const isActive = pathname === item.href;
                                return (
                                    <Link
                                        key={item.href}
                                        href={item.href}
                                        className={clsx(
                                            'flex items-center gap-3 px-4 py-2.5 rounded-xl transition-all duration-200 group text-sm',
                                            isActive
                                                ? 'bg-primary/10 text-primary shadow-sm border border-primary/20 font-semibold'
                                                : 'text-muted-foreground hover:bg-muted hover:text-foreground font-medium'
                                        )}
                                    >
                                        <item.icon size={18} className={clsx(isActive ? 'text-primary' : 'text-muted-foreground group-hover:text-foreground')} />
                                        <span>{item.name}</span>
                                    </Link>
                                );
                            })}
                        </div>
                    </div>
                ))}
            </nav>

            <div className="p-4 border-t border-border flex items-center justify-between">
                <button className="flex items-center gap-3 px-4 py-3 text-muted-foreground hover:text-foreground transition-colors">
                    <Settings size={20} />
                    <span className="font-medium">Settings</span>
                </button>
                <ThemeToggle />
            </div>
        </aside>
    );
}
