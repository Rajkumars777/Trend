'use client';

import { useEffect, useState } from 'react';
import { Activity, TrendingUp, AlertTriangle, MessageSquare } from 'lucide-react';
import StatCard from '@/components/StatCard';
import GlobalMap from '@/components/GlobalMap';
import WordCloud from '@/components/WordCloud';
import InfluencerTable from '@/components/InfluencerTable';
import LiveHeader from '@/components/LiveHeader';

import NewsTicker from '@/components/NewsTicker';

import TopStatsRow from '@/components/TopStatsRow';
import SentimentPieChart from '@/components/SentimentPieChart';

export default function Dashboard() {
  const [data, setData] = useState<{
    trends: any[],
    sentimentDist: any[],
    predictions: any[],
    wordCloud: any[],
    recentPosts: any[],
    influencers: any[],
    commodities: any[]
  }>({
    trends: [],
    sentimentDist: [],
    predictions: [],
    wordCloud: [],
    recentPosts: [],
    influencers: [],
    commodities: []
  });

  useEffect(() => {
    async function fetchData() {
      try {
        const [trendsRes, pricesRes] = await Promise.all([
          fetch('/api/trends'),
          fetch('/api/market-prices')
        ]);

        const result = await trendsRes.json();
        const priceResult = await pricesRes.json();

        // Ensure all arrays are initialized to avoid undefined errors
        setData({
          trends: Array.isArray(result.trends) ? result.trends : [],
          sentimentDist: Array.isArray(result.sentimentDist) ? result.sentimentDist : [],
          predictions: Array.isArray(result.predictions) ? result.predictions : [],
          wordCloud: Array.isArray(result.wordCloud) ? result.wordCloud : [],
          recentPosts: Array.isArray(result.recentPosts) ? result.recentPosts : [],
          influencers: Array.isArray(result.influencers) ? result.influencers : [],
          commodities: Array.isArray(priceResult.commodities) ? priceResult.commodities : []
        });
      } catch (e) {
        console.error("Failed to fetch dashboard data", e);
      }
    }
    fetchData();
  }, []);

  // Aggregations for TopStatsRow
  // Global Counts from sentimentDist
  const sentimentDist = Array.isArray(data.sentimentDist) ? data.sentimentDist : [];

  const getSentimentCount = (name: string) => {
    const item = sentimentDist.find(s => s.name === name);
    return item ? item.value : 0;
  };

  const positiveCount = getSentimentCount('Positive');
  const negativeCount = getSentimentCount('Negative');
  const neutralCount = getSentimentCount('Neutral');
  const totalRecords = positiveCount + negativeCount + neutralCount;

  // Trending Topics from predictions or fallback
  const predictions = Array.isArray(data.predictions) ? data.predictions : [];
  const trendingTopics = predictions.length > 0
    ? predictions.map(p => p.product)
    : ["Tractor", "Wheat", "Drought", "Sustainable", "AgTech"];

  // Calculate summary stats for other cards
  const trends = Array.isArray(data.trends) ? data.trends : [];
  const totalPosts = data.sentimentDist?.reduce((acc: number, curr: any) => acc + curr.value, 0) || trends.reduce((acc: number, curr: any) => acc + curr.count, 0) || 0;

  const avgSentiment = trends.length > 0
    ? (trends.reduce((acc: number, curr: any) => acc + curr.sentiment, 0) / trends.length).toFixed(2)
    : 0;

  return (
    <div className="space-y-4">
      {/* Live Header with Clock & Weather */}
      <LiveHeader />

      {/* Scrolling News Ticker */}
      <NewsTicker headlines={data.recentPosts
        ?.map((p: any) => p.content)
        .filter((c: string) => c && c.length > 40)
        .map((c: string) => c.length > 150 ? c.substring(0, 150) + "..." : c)
        || []}
      />

      {/* Top Stats Row (Fixed Position / Prominent) */}
      <TopStatsRow
        totalRecords={totalRecords}
        positiveCount={positiveCount}
        negativeCount={negativeCount}
        neutralCount={neutralCount}
        topCrop={trendingTopics[0] || "Mixed"}
        forecastIndex="Stable"
        forecastDirection="up"
        dailyTrend={[]}
      />

      {/* Main Grid Layout */}
      <div className="grid grid-cols-1 xl:grid-cols-3 gap-3">

        {/* Left Column: Map (2/3 width) */}
        <div className="xl:col-span-2 flex flex-col gap-4 h-full">
          <GlobalMap className="flex-1 min-h-[300px]" />
          <SentimentPieChart
            positive={positiveCount}
            negative={negativeCount}
            neutral={neutralCount}
            className="h-fit"
          />
        </div>

        {/* Right Column: KPIs (1/3 width) */}
        <div className="flex flex-col gap-4 h-full">
          {/* KPI Cards Grid (2x2) */}
          <div className="grid grid-cols-2 gap-4">
            <StatCard title="Total Posts" value={totalPosts} trend="+12%" trendUp={true} icon={MessageSquare} color="blue" />
            <StatCard title="Sentiment" value={avgSentiment} trend="+0.5" trendUp={Number(avgSentiment) > 0} icon={Activity} color="green" />
            <StatCard
              title="Alerts"
              value={(trends.filter((t: any) => t.sentiment < -0.5).length || 3).toString()}
              trend="Critical"
              trendUp={false}
              icon={AlertTriangle}
              color="red"
            />
            <StatCard title="Trending" value={trendingTopics[0] || "Tractor"} trend="High" trendUp={true} icon={TrendingUp} color="orange" />
          </div>

          {/* Top Trends List (Moved here for better dashboard balance) */}
          <div className="border border-border rounded-xl bg-card p-5 shadow-sm h-fit overflow-hidden flex flex-col">
            <h3 className="text-lg font-bold mb-4 flex items-center gap-2 text-foreground">
              <TrendingUp size={18} className="text-primary" /> Top Trends
            </h3>
            <div className="space-y-3 overflow-y-auto pr-2 custom-scrollbar flex-1">
              {(data.wordCloud || []).slice(0, 15).map((topic: any, i: number) => {
                const maxVal = Math.max(...(data.wordCloud || []).map((t: any) => t.value));
                const percent = maxVal > 0 ? (topic.value / maxVal) * 100 : 0;
                return (
                  <div key={i} className="group relative w-full h-10 bg-neutral/5 rounded-xl border border-transparent hover:border-primary/20 overflow-hidden transition-all duration-200">
                    <div className="absolute left-0 top-0 bottom-0 bg-primary/10 transition-all duration-500 group-hover:bg-primary/20" style={{ width: `${percent}%` }} />
                    <div className="absolute inset-0 flex items-center justify-between px-4">
                      <div className="flex items-center gap-3">
                        <span className="text-xs font-bold text-neutral/50 w-4">{i + 1}</span>
                        <span className="text-sm font-semibold text-foreground group-hover:text-primary transition-colors">#{topic.text}</span>
                      </div>
                      <span className="text-xs font-medium text-neutral">{topic.value}</span>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      </div>

      {/* Analysis Section: Influencers & Word Cloud */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="min-h-[400px]">
          <InfluencerTable influencers={data.influencers} />
        </div>
        <div className="min-h-[400px]">
          <WordCloud topics={data.wordCloud || []} />
        </div>
      </div>


    </div>
  );
}
