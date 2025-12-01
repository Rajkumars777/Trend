import { LucideIcon } from 'lucide-react';
import clsx from 'clsx';

interface StatCardProps {
    title: string;
    value: string | number;
    trend?: string;
    trendUp?: boolean;
    icon: LucideIcon;
    color?: 'green' | 'blue' | 'red' | 'orange';
}

export default function StatCard({ title, value, trend, trendUp, icon: Icon, color = 'green' }: StatCardProps) {
    const colorStyles = {
        green: 'bg-green-500/10 text-green-500 border-green-500/20',
        blue: 'bg-blue-500/10 text-blue-500 border-blue-500/20',
        red: 'bg-red-500/10 text-red-500 border-red-500/20',
        orange: 'bg-orange-500/10 text-orange-500 border-orange-500/20',
    };

    return (
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 hover:border-slate-700 transition-all duration-300 shadow-lg">
            <div className="flex justify-between items-start">
                <div>
                    <p className="text-slate-400 text-sm font-medium mb-1">{title}</p>
                    <h3 className="text-3xl font-bold text-white">{value}</h3>
                </div>
                <div className={clsx('p-3 rounded-xl border', colorStyles[color])}>
                    <Icon size={24} />
                </div>
            </div>
            {trend && (
                <div className="mt-4 flex items-center gap-2">
                    <span className={clsx('text-xs font-bold px-2 py-1 rounded-full', trendUp ? 'bg-green-500/20 text-green-400' : 'bg-red-500/20 text-red-400')}>
                        {trend}
                    </span>
                    <span className="text-slate-500 text-xs">vs last week</span>
                </div>
            )}
        </div>
    );
}
