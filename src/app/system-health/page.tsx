'use client';

import SystemHealth from '@/components/SystemHealth';
import LiveHeader from '@/components/LiveHeader';

export default function SystemHealthPage() {
    return (
        <div className="space-y-6 max-h-screen overflow-hidden flex flex-col p-4">
            <h1 className="text-2xl font-bold text-white mb-2 shrink-0">System Health & Performance</h1>
            <div className="w-full flex-1 min-h-0">
                <SystemHealth />
            </div>
        </div>
    );
}
