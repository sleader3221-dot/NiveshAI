import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { BarChart3, TrendingUp, TrendingDown, Minus } from 'lucide-react';

export default function MarketBreadth({ stocks }) {
  if (!stocks || stocks.length === 0) return null;

  const buyCount = stocks.filter(s => s.signal === 'BUY' || s.signal === 'STRONG_BUY').length;
  const holdCount = stocks.filter(s => s.signal === 'HOLD').length;
  const sellCount = stocks.filter(s => s.signal === 'SELL' || s.signal === 'STRONG_SELL').length;
  const total = stocks.length;

  const sentiment = buyCount > sellCount * 2 ? 'Bullish' : buyCount < sellCount ? 'Bearish' : 'Neutral';
  const sentimentColor = sentiment === 'Bullish' ? 'text-emerald-600' : sentiment === 'Bearish' ? 'text-red-500' : 'text-amber-600';
  const sentimentBg = sentiment === 'Bullish' ? 'bg-emerald-50 border-emerald-200' : sentiment === 'Bearish' ? 'bg-red-50 border-red-200' : 'bg-amber-50 border-amber-200';

  // Sector breakdown
  const sectorSignals = {};
  stocks.forEach(s => {
    if (!sectorSignals[s.sector]) sectorSignals[s.sector] = { buy: 0, hold: 0, sell: 0 };
    if (s.signal === 'BUY' || s.signal === 'STRONG_BUY') sectorSignals[s.sector].buy++;
    else if (s.signal === 'HOLD') sectorSignals[s.sector].hold++;
    else sectorSignals[s.sector].sell++;
  });

  return (
    <Card>
      <CardHeader className="pb-2">
        <CardTitle className="text-base font-dm flex items-center gap-2">
          <BarChart3 className="w-4 h-4 text-primary" />
          Market Breadth
        </CardTitle>
      </CardHeader>
      <CardContent>
        {/* Overall sentiment */}
        <div className={`flex items-center justify-between p-3 rounded-xl border ${sentimentBg} mb-4`}>
          <div>
            <p className="text-xs text-muted-foreground">Overall Sentiment</p>
            <p className={`text-xl font-dm font-bold ${sentimentColor}`}>{sentiment}</p>
          </div>
          <div className="text-right text-xs space-y-0.5">
            <p className="text-emerald-600 font-semibold">▲ {buyCount} Buy</p>
            <p className="text-amber-600 font-semibold">— {holdCount} Hold</p>
            <p className="text-red-500 font-semibold">▼ {sellCount} Sell</p>
          </div>
        </div>

        {/* Visual bar */}
        <div className="h-3 rounded-full overflow-hidden flex mb-4">
          <div className="bg-emerald-500 transition-all" style={{ width: `${(buyCount / total) * 100}%` }} />
          <div className="bg-amber-400 transition-all" style={{ width: `${(holdCount / total) * 100}%` }} />
          <div className="bg-red-500 transition-all" style={{ width: `${(sellCount / total) * 100}%` }} />
        </div>

        {/* Sector signals */}
        <div className="space-y-2">
          {Object.entries(sectorSignals).map(([sector, signals]) => {
            const topSignal = signals.buy > 0 ? 'BUY' : signals.hold > 0 ? 'HOLD' : 'SELL';
            const topColor = topSignal === 'BUY' ? 'text-emerald-600 bg-emerald-50' : topSignal === 'HOLD' ? 'text-amber-600 bg-amber-50' : 'text-red-600 bg-red-50';
            return (
              <div key={sector} className="flex items-center justify-between text-sm">
                <span className="text-muted-foreground text-xs">{sector}</span>
                <div className="flex items-center gap-1.5">
                  {signals.buy > 0 && <span className="text-[10px] text-emerald-600">+{signals.buy}</span>}
                  {signals.sell > 0 && <span className="text-[10px] text-red-500">-{signals.sell}</span>}
                  <Badge className={`text-[9px] px-1.5 py-0 border ${topColor}`}>{topSignal}</Badge>
                </div>
              </div>
            );
          })}
        </div>
      </CardContent>
    </Card>
  );
}