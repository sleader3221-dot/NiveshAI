import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { formatCurrency } from '@/lib/stockData';
import { MarketState, MarketRegime } from '@/lib/tradingEngine';
import { Activity, TrendingUp, TrendingDown, Zap, AlertTriangle } from 'lucide-react';

const STATE_CONFIG = {
  NORMAL:    { color: 'text-emerald-600 bg-emerald-50', icon: Activity, label: 'NORMAL' },
  VOLATILE:  { color: 'text-orange-500 bg-orange-50', icon: Zap, label: 'VOLATILE' },
  CRASH:     { color: 'text-red-600 bg-red-50', icon: AlertTriangle, label: 'CRASH' },
  RECOVERY:  { color: 'text-blue-500 bg-blue-50', icon: TrendingUp, label: 'RECOVERY' },
};

const REGIME_CONFIG = {
  BULL_TRENDING:   { color: 'text-emerald-600', emoji: '🐂', label: 'Bull Trending' },
  BEAR_TRENDING:   { color: 'text-red-600', emoji: '🐻', label: 'Bear Trending' },
  HIGH_VOLATILITY: { color: 'text-orange-500', emoji: '⚡', label: 'High Volatility' },
  LOW_VOLATILITY:  { color: 'text-blue-500', emoji: '🌊', label: 'Low Volatility' },
  CONSOLIDATION:   { color: 'text-amber-500', emoji: '↔️', label: 'Consolidation' },
  TRENDING_UP:     { color: 'text-green-600', emoji: '↗️', label: 'Trending Up' },
  TRENDING_DOWN:   { color: 'text-red-500', emoji: '↘️', label: 'Trending Down' },
};

const MTF_CONFIG = {
  BULLISH:          { label: '🟢 Bullish', color: 'text-emerald-600' },
  SLIGHTLY_BULLISH: { label: '🟡 Slightly Bullish', color: 'text-green-500' },
  NEUTRAL:          { label: '⬜ Neutral', color: 'text-amber-500' },
  SLIGHTLY_BEARISH: { label: '🟠 Slightly Bearish', color: 'text-orange-500' },
  BEARISH:          { label: '🔴 Bearish', color: 'text-red-600' },
};

export default function BotMarketStateCard({ stock }) {
  if (!stock) return null;
  const analysis = stock.analysis;
  const stateKey = analysis?.marketState || MarketState.NORMAL;
  const regimeKey = analysis?.regime || MarketRegime.CONSOLIDATION;
  const stateCfg = STATE_CONFIG[stateKey] || STATE_CONFIG.NORMAL;
  const regimeCfg = REGIME_CONFIG[regimeKey] || REGIME_CONFIG.CONSOLIDATION;
  const mtfCfg = MTF_CONFIG[stock.mtf?.confluence] || MTF_CONFIG.NEUTRAL;
  const Icon = stateCfg.icon;

  return (
    <Card>
      <CardHeader className="pb-2">
        <CardTitle className="text-sm flex items-center gap-2">
          <span className="font-bold text-base">{stock.symbol}</span>
          <span className="text-muted-foreground font-normal text-xs">· {stock.sector}</span>
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        {/* Market State */}
        <div className={`flex items-center gap-2 rounded-lg p-2.5 ${stateCfg.color}`}>
          <Icon className="w-4 h-4 shrink-0" />
          <div>
            <div className="text-xs font-semibold">Market State: {stateCfg.label}</div>
            <div className="text-xs opacity-75">
              {stateKey === 'CRASH' && 'Extreme caution — bot blocks new buys'}
              {stateKey === 'VOLATILE' && 'Tighten stops, reduce position size'}
              {stateKey === 'RECOVERY' && 'Cautious re-entry, watch for confirmation'}
              {stateKey === 'NORMAL' && 'Optimal conditions for trading'}
            </div>
          </div>
        </div>

        {/* Regime */}
        <div className="flex items-center justify-between text-sm">
          <span className="text-muted-foreground text-xs">Regime</span>
          <span className={`font-semibold text-xs ${regimeCfg.color}`}>
            {regimeCfg.emoji} {regimeCfg.label}
          </span>
        </div>

        {/* MTF Confluence */}
        <div className="flex items-center justify-between text-sm">
          <span className="text-muted-foreground text-xs">Multi-Timeframe (1m/5m/15m)</span>
          <span className={`font-semibold text-xs ${mtfCfg.color}`}>{mtfCfg.label}</span>
        </div>
        {stock.mtf && (
          <div className="flex gap-2 text-xs">
            {[['1m', stock.mtf.t1m], ['5m', stock.mtf.t5m], ['15m', stock.mtf.t15m]].map(([tf, val]) => (
              <div key={tf} className={`flex-1 text-center rounded p-1 ${val > 0 ? 'bg-emerald-50 text-emerald-600' : val < 0 ? 'bg-red-50 text-red-600' : 'bg-muted text-muted-foreground'}`}>
                <div className="font-bold">{tf}</div>
                <div>{val > 0 ? '↑' : val < 0 ? '↓' : '→'}</div>
              </div>
            ))}
          </div>
        )}

        {/* Key Levels */}
        <div className="space-y-1.5 pt-1 border-t">
          <div className="text-xs font-semibold text-muted-foreground">Key Levels (Fibonacci + Pivot)</div>
          <div className="grid grid-cols-2 gap-1.5 text-xs">
            <div className="bg-muted/40 rounded p-1.5">
              <div className="text-muted-foreground">Target 38.2%</div>
              <div className="font-semibold text-emerald-600">{formatCurrency(analysis?.profitTarget1)}</div>
            </div>
            <div className="bg-muted/40 rounded p-1.5">
              <div className="text-muted-foreground">Target 61.8%</div>
              <div className="font-semibold text-emerald-600">{formatCurrency(analysis?.profitTarget2)}</div>
            </div>
            <div className="bg-muted/40 rounded p-1.5">
              <div className="text-muted-foreground">Target 100%</div>
              <div className="font-semibold text-primary">{formatCurrency(analysis?.profitTarget3)}</div>
            </div>
            <div className="bg-red-50 rounded p-1.5">
              <div className="text-muted-foreground">Stop Loss (ATR)</div>
              <div className="font-semibold text-red-600">{formatCurrency(analysis?.stopLoss)}</div>
            </div>
          </div>
        </div>

        {/* Divergence */}
        {(analysis?.divergence?.bullish || analysis?.divergence?.bearish) && (
          <div className={`text-xs rounded p-2 font-medium ${analysis.divergence.bullish ? 'bg-emerald-50 text-emerald-700' : 'bg-red-50 text-red-700'}`}>
            🔍 {analysis.divergence.bullish ? 'Bullish RSI Divergence detected' : 'Bearish RSI Divergence detected'}
          </div>
        )}

        {/* Kellly Position Size */}
        <div className="bg-primary/5 rounded-lg p-2.5 border border-primary/10">
          <div className="text-xs text-muted-foreground">Kelly Position Size (½ Kelly, max 15%)</div>
          <div className="font-bold text-primary text-sm mt-0.5">
            {stock.suggestedQty} shares · ₹{(stock.kellySize || 0).toLocaleString('en-IN')}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}