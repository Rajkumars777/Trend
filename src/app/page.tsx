'use client';

import { useEffect, useState } from 'react';
import { Activity, TrendingUp, AlertTriangle, MessageSquare } from 'lucide-react';
import StatCard from '@/components/StatCard';
import GlobalMap from '@/components/GlobalMap';
import WordCloud from '@/components/WordCloud';
import InfluencerTable from '@/components/InfluencerTable';
import LiveHeader from '@/components/LiveHeader';
import SystemHealth from '@/components/SystemHealth';
import NewsTicker from '@/components/NewsTicker';
import PriceTracker from '@/components/PriceTracker';
import TopStatsRow from '@/components/TopStatsRow';

export default function Dashboard() {
  const [data, setData] = useState<{
    trends: any[],
    sentimentDist: any[],
    predictions: any[]
  }>({
    trends: [],
    sentimentDist: [],
    predictions: []
  });

  useEffect(() => {
    async function fetchData() {
      try {
        const res = await fetch('/api/trends');
        const result = await res.json();
        setData(result);
      } catch (e) {
        console.error("Failed to fetch trends", e);
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
  const totalPosts = data.sentimentDist?.reduce((acc, curr) => acc + curr.value, 0) || trends.reduce((acc, curr) => acc + curr.count, 0);
  const avgSentiment = trends.length > 0
    ? (trends.reduce((acc, curr) => acc + curr.sentiment, 0) / trends.length).toFixed(2)
    : 0;

  return (
    <div className="space-y-6">
      {/* Live Header with Clock & Weather */}
      <LiveHeader />

      {/* Scrolling News Ticker */}
      <NewsTicker />

      {/* Top Stats Row (Fixed Position / Prominent) */}
      <TopStatsRow
        totalRecords={totalRecords}
        positiveCount={positiveCount}
        negativeCount={negativeCount}
        neutralCount={neutralCount}
        trendingTopics={trendingTopics}
      />

      {/* Main Grid Layout */}
      <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">

        {/* Left Column: Map & Ticker (2/3 width) */}
        <div className="xl:col-span-2 space-y-6">
          {/* Price Ticker */}
          <PriceTracker />

          {/* Global Map */}
          <GlobalMap />
        </div>

        {/* Right Column: KPIs & System Health (1/3 width) */}
        <div className="space-y-6">
          {/* System Health Widget */}
          <SystemHealth />

          {/* KPI Cards Grid (2x2) */}
          <div className="grid grid-cols-2 gap-4">
            <StatCard title="Total Posts" value={totalPosts} trend="+12%" trendUp={true} icon={MessageSquare} color="blue" />
            <StatCard title="Sentiment" value={avgSentiment} trend="+0.5" trendUp={Number(avgSentiment) > 0} icon={Activity} color="green" />
            <StatCard title="Alerts" value="3" trend="Critical" trendUp={false} icon={AlertTriangle} color="red" />
            <StatCard title="Trending" value="Tractor" trend="High" trendUp={true} icon={TrendingUp} color="orange" />
          </div>
        </div>
      </div>

      {/* Bottom Row: Detailed Insights (Equal Width) */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 h-[450px]">
        {/* Word Cloud */}
        <WordCloud />

        {/* Influencer Table */}
        <InfluencerTable />
      </div>
    </div>
  );
}
