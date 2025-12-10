import { TrendingUp, ArrowUpRight } from 'lucide-react';

interface ProductPredictionProps {
    product: string;
    count: number;
    sentiment: number;
}

export default function ProductPredictionCard({ product, count, sentiment }: ProductPredictionProps) {
    return (
        <div className="bg-card border border-neutral/20 p-4 rounded-xl flex items-center justify-between hover:border-primary/50 transition-colors group text-foreground">
            <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center text-primary group-hover:bg-primary group-hover:text-black transition-colors">
                    <TrendingUp size={20} />
                </div>
                <div>
                    <h4 className="font-bold text-foreground capitalize">{product}</h4>
                    <p className="text-xs text-neutral">Predicted High Demand</p>
                </div>
            </div>

            <div className="text-right">
                <div className="text-positive font-bold text-sm flex items-center justify-end gap-1">
                    +{(sentiment || 0).toFixed(1)} Sentiment
                    <ArrowUpRight size={14} />
                </div>
                <p className="text-xs text-neutral">{count} Mentions</p>
            </div>
        </div>
    );
}
