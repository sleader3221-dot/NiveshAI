import { db } from '@/lib/dbClient';

import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';

import { useQuery } from '@tanstack/react-query';
import { useAuth } from '@/lib/AuthContext';
import { STOCK_SEED_DATA } from '@/lib/stockData';
import StatsRow from '@/components/dashboard/StatsRow';
import PortfolioChart from '@/components/dashboard/PortfolioChart';
import SectorAllocation from '@/components/dashboard/SectorAllocation';
import TopMovers from '@/components/dashboard/TopMovers';
import QuickSignals from '@/components/dashboard/QuickSignals';
import PortfolioHealthScore from '@/components/dashboard/PortfolioHealthScore';
import InvestmentProjection from '@/components/dashboard/InvestmentProjection';
import AIInsightFeed from '@/components/dashboard/AIInsightFeed';
import MarketBreadth from '@/components/dashboard/MarketBreadth';
import { Skeleton } from '@/components/ui/skeleton';

export default function Dashboard() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [stocks, setStocks] = useState([]);

  const { data: profiles, isLoading: loadingProfile } = useQuery({
    queryKey: ['financial-profile', user?.email],
    queryFn: () => db.entities.FinancialProfile.filter({ created_by: user?.email }),
    enabled: !!user?.email,
  });

  const { data: dbStocks, isLoading: loadingStocks } = useQuery({
    queryKey: ['stocks'],
    queryFn: () => db.entities.Stock.list(),
  });

  const { data: trades, isLoading: loadingTrades } = useQuery({
    queryKey: ['trades', user?.email],
    queryFn: () => db.entities.Trade.filter({ created_by: user?.email }),
    enabled: !!user?.email,
  });

  useEffect(() => {
    setStocks(dbStocks?.length > 0 ? dbStocks : STOCK_SEED_DATA);
  }, [dbStocks]);

  const profile = profiles?.[0];

  useEffect(() => {
    if (!loadingProfile && profiles && profiles.length === 0) {
      navigate('/onboarding');
    }
  }, [loadingProfile, profiles, navigate]);

  if (loadingProfile || loadingStocks) {
    return (
      <div className="p-6 lg:p-8 space-y-6">
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          {[1,2,3,4].map(i => <Skeleton key={i} className="h-32 rounded-xl" />)}
        </div>
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          <Skeleton className="h-80 rounded-xl" />
          <Skeleton className="h-80 rounded-xl" />
        </div>
      </div>
    );
  }

  // Build holdings for health score
  const holdingsMap = {};
  (trades || []).forEach(t => {
    if (!holdingsMap[t.stock_symbol]) holdingsMap[t.stock_symbol] = { qty: 0, invested: 0, sector: t.sector };
    if (t.trade_type === 'BUY') { holdingsMap[t.stock_symbol].qty += t.quantity; holdingsMap[t.stock_symbol].invested += t.total_value; }
    else { holdingsMap[t.stock_symbol].qty -= t.quantity; holdingsMap[t.stock_symbol].invested -= t.price * t.quantity; }
  });
  const holdings = Object.entries(holdingsMap)
    .filter(([_, h]) => h.qty > 0)
    .map(([symbol, h]) => {
      const stock = stocks.find(s => s.symbol === symbol);
      const currentVal = (stock?.current_price || 0) * h.qty;
      return { symbol, ...h, currentVal, pnl: currentVal - h.invested };
    });

  return (
    <div className="p-6 lg:p-8 space-y-6 max-w-[1400px] mx-auto">
      {/* Header */}
      <div className="flex items-center justify-between flex-wrap gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="w-2 h-2 rounded-full bg-mint pulse-live inline-block" />
            <span className="text-xs text-white/30 uppercase tracking-widest font-mono">Live Portfolio</span>
          </div>
          <h1 className="text-2xl lg:text-3xl font-space font-bold text-white">
            Welcome back, <span className="text-cyan">{user?.full_name?.split(' ')[0] || 'Investor'}</span>
          </h1>
          <p className="text-white/35 mt-1 text-sm">Here's how your portfolio is performing today</p>
        </div>
      </div>

      <StatsRow trades={trades || []} stocks={stocks} profile={profile} />

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2">
          <PortfolioChart trades={trades || []} stocks={stocks} />
        </div>
        <div className="space-y-6">
          <MarketBreadth stocks={stocks} />
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2">
          <AIInsightFeed stocks={stocks} holdings={holdings} profile={profile} />
        </div>
        <SectorAllocation trades={trades || []} stocks={stocks} />
      </div>

      {holdings.length > 0 && (
        <PortfolioHealthScore holdings={holdings} stocks={stocks} profile={profile} />
      )}

      <InvestmentProjection profile={profile} />

      <TopMovers trades={trades || []} stocks={stocks} />

      <QuickSignals stocks={stocks} />
    </div>
  );
}
