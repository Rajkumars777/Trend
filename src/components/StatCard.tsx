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
        <div className="bg-card border border-border rounded-xl p-5 hover:border-primary/20 transition-all duration-300 shadow-sm hover:shadow-md">
            <div className="flex justify-between items-start">
                <div>
                    <p className="text-muted-foreground text-sm font-medium mb-1">{title}</p>
                    <h3 className="text-3xl font-bold text-foreground">{value}</h3>
                </div>
                <div className={clsx('p-3 rounded-xl border', colorStyles[color])}>
                    <Icon size={24} />
                </div>
            </div>
            {trend && (
                <div className="mt-4 flex items-center gap-2">
                    <span className={clsx('text-xs font-bold px-2 py-1 rounded-full', trendUp ? 'bg-positive/10 text-positive' : 'bg-destructive/10 text-destructive')}>
                        {trend}
                    </span>
                    <span className="text-muted-foreground text-xs">vs last week</span>
                </div>
            )}
        </div>
    );
}
