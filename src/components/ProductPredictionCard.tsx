import { TrendingUp, ArrowUpRight } from 'lucide-react';

interface ProductPredictionProps {
    product: string;
    count: number;
    sentiment: number;
}

export default function ProductPredictionCard({ product, count, sentiment }: ProductPredictionProps) {
    return (
        <div className="bg-slate-900 border border-slate-800 p-4 rounded-xl flex items-center justify-between hover:border-emerald-500/50 transition-colors group">
            <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-emerald-500/10 flex items-center justify-center text-emerald-500 group-hover:bg-emerald-500 group-hover:text-white transition-colors">
                    <TrendingUp size={20} />
                </div>
                <div>
                    <h4 className="font-bold text-slate-200 capitalize">{product}</h4>
                    <p className="text-xs text-slate-500">Predicted High Demand</p>
                </div>
            </div>

            <div className="text-right">
                <div className="text-emerald-400 font-bold text-sm flex items-center justify-end gap-1">
                    +{sentiment.toFixed(1)} Sentiment
                    <ArrowUpRight size={14} />
                </div>
                <p className="text-xs text-slate-500">{count} Mentions</p>
            </div>
        </div>
    );
}
