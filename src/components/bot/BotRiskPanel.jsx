import React, { useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { formatCurrency } from '@/lib/stockData';
import { Signal, kellyPositionSize } from '@/lib/tradingEngine';
import { Shield, AlertTriangle, TrendingUp, Target } from 'lucide-react';

const MAX_POSITIONS = 3;
const MAX_TRADES_PER_DAY = 10;

export default function BotRiskPanel({ scanResults, trades, stocks, profile, holdingsMap }) {
  const capital = profile?.investable_amount || 50000;

  // Current active positions
  const activePositions = useMemo(() => {
    return Object.entries(holdingsMap || {})
      .filter(([, h]) => h.qty > 0)
      .map(([symbol, h]) => {
        const stock = stocks.find(s => s.symbol === symbol);
        const currentVal = (stock?.current_price || 0) * h.qty;
        const pnl = currentVal - h.invested;
        const pnlPct = h.invested > 0 ? (pnl / h.invested) * 100 : 0;
        const botResult = scanResults.find(s => s.symbol === symbol);
        const stopLoss = botResult?.analysis?.stopLoss;
        const target = botResult?.analysis?.profitTarget2;
        return { symbol, ...h, currentVal, pnl, pnlPct, stopLoss, target, signal: botResult?.botSignal };
      });
  }, [holdingsMap, stocks, scanResults]);

  const todayTrades = useMemo(() => {
    const today = new Date().toDateString();
    return (trades || []).filter(t => new Date(t.created_date).toDateString() === today).length;
  }, [trades]);

  const portfolioRisk = useMemo(() => {
    const totalInvested = activePositions.reduce((a, p) => a + p.invested, 0);
    const portfolioPct = capital > 0 ? (totalInvested / capital) * 100 : 0;
    const maxLoss = activePositions.reduce((a, p) => {
      const sl = p.stopLoss || 0;
      const currentPrice = stocks.find(s => s.symbol === p.symbol)?.current_price || 0;
      return a + (currentPrice > sl ? (currentPrice - sl) * p.qty : 0);
    }, 0);
    return { totalInvested, portfolioPct, maxLoss };
  }, [activePositions, capital, stocks]);

  // Top sell alerts (positions with SELL/STRONG_SELL signal)
  const sellAlerts = activePositions.filter(p => [Signal.SELL, Signal.STRONG_SELL].includes(p.signal));

  // New opportunities
  const opportunities = scanResults
    .filter(s => [Signal.STRONG_BUY, Signal.BUY].includes(s.botSignal))
    .filter(s => !(holdingsMap?.[s.symbol]?.qty > 0))
    .slice(0, 5);

  return (
    <div className="space-y-4">
      {/* Risk Dashboard */}
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-sm flex items-center gap-2">
            <Shield className="w-4 h-4 text-primary" />
            Risk Management Dashboard
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="grid grid-cols-2 gap-2 text-xs">
            <div className={`rounded-lg p-2.5 ${activePositions.length >= MAX_POSITIONS ? 'bg-red-50' : 'bg-muted/40'}`}>
              <div className="text-muted-foreground">Open Positions</div>
              <div className={`text-xl font-bold ${activePositions.length >= MAX_POSITIONS ? 'text-red-600' : 'text-foreground'}`}>
                {activePositions.length} / {MAX_POSITIONS}
              </div>
              {activePositions.length >= MAX_POSITIONS && <div className="text-red-500">Max reached!</div>}
            </div>
            <div className={`rounded-lg p-2.5 ${todayTrades >= MAX_TRADES_PER_DAY ? 'bg-red-50' : 'bg-muted/40'}`}>
              <div className="text-muted-foreground">Trades Today</div>
              <div className={`text-xl font-bold ${todayTrades >= MAX_TRADES_PER_DAY ? 'text-red-600' : 'text-foreground'}`}>
                {todayTrades} / {MAX_TRADES_PER_DAY}
              </div>
              {todayTrades >= MAX_TRADES_PER_DAY && <div className="text-red-500">Daily limit!</div>}
            </div>
            <div className="rounded-lg p-2.5 bg-muted/40">
              <div className="text-muted-foreground">Capital Deployed</div>
              <div className="text-lg font-bold">{portfolioRisk.portfolioPct.toFixed(1)}%</div>
              <div className="text-muted-foreground">{formatCurrency(portfolioRisk.totalInvested)}</div>
            </div>
            <div className="rounded-lg p-2.5 bg-red-50">
              <div className="text-muted-foreground">Max Risk (Stop)</div>
              <div className="text-lg font-bold text-red-600">{formatCurrency(portfolioRisk.maxLoss)}</div>
              <div className="text-muted-foreground">{capital > 0 ? ((portfolioRisk.maxLoss / capital) * 100).toFixed(1) : 0}% of capital</div>
            </div>
          </div>

          {/* Kelly sizing reference */}
          <div className="bg-primary/5 border border-primary/10 rounded-lg p-2.5 text-xs">
            <div className="font-semibold text-primary mb-1">Kelly Criterion (½ Kelly, max 15%)</div>
            <div className="text-muted-foreground">Max position size per trade: <span className="font-bold text-foreground">{formatCurrency(kellyPositionSize(0.6, 0.08, 0.04, capital))}</span></div>
            <div className="text-muted-foreground">Based on: Win rate 60%, Avg win 8%, Avg loss 4%</div>
          </div>
        </CardContent>
      </Card>

      {/* Sell Alerts */}
      {sellAlerts.length > 0 && (
        <Card className="border-red-200 bg-red-50/30">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm text-red-600 flex items-center gap-2">
              <AlertTriangle className="w-4 h-4" />
              Exit Alerts ({sellAlerts.length})
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            {sellAlerts.map(pos => (
              <div key={pos.symbol} className="flex items-center justify-between text-xs bg-white/60 rounded p-2">
                <div>
                  <div className="font-bold">{pos.symbol}</div>
                  <div className={pos.pnlPct >= 0 ? 'text-emerald-600' : 'text-red-600'}>
                    P&L: {pos.pnlPct.toFixed(2)}%
                  </div>
                </div>
                <div className="text-right">
                  <Badge className="bg-red-100 text-red-700 text-xs">{pos.signal?.replace('_', ' ')}</Badge>
                  <div className="text-muted-foreground mt-0.5">Stop: {formatCurrency(pos.stopLoss)}</div>
                </div>
              </div>
            ))}
          </CardContent>
        </Card>
      )}

      {/* Current Holdings */}
      {activePositions.length > 0 && (
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm flex items-center gap-2">
              <TrendingUp className="w-4 h-4" />
              Active Positions with Bot Levels
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            {activePositions.map(pos => (
              <div key={pos.symbol} className="text-xs border rounded-lg p-2.5 space-y-1.5">
                <div className="flex justify-between items-center">
                  <span className="font-bold text-sm">{pos.symbol}</span>
                  <span className={`font-bold ${pos.pnl >= 0 ? 'text-emerald-600' : 'text-red-500'}`}>
                    {pos.pnl >= 0 ? '+' : ''}{formatCurrency(pos.pnl)} ({pos.pnlPct.toFixed(2)}%)
                  </span>
                </div>
                <div className="grid grid-cols-3 gap-1">
                  <div className="bg-emerald-50 rounded p-1 text-center">
                    <div className="text-muted-foreground">Target</div>
                    <div className="font-semibold text-emerald-600">{formatCurrency(pos.target)}</div>
                  </div>
                  <div className="bg-red-50 rounded p-1 text-center">
                    <div className="text-muted-foreground">Stop</div>
                    <div className="font-semibold text-red-500">{formatCurrency(pos.stopLoss)}</div>
                  </div>
                  <div className="bg-muted/40 rounded p-1 text-center">
                    <div className="text-muted-foreground">Qty</div>
                    <div className="font-semibold">{pos.qty}</div>
                  </div>
                </div>
              </div>
            ))}
          </CardContent>
        </Card>
      )}

      {/* New Opportunities */}
      {opportunities.length > 0 && (
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm flex items-center gap-2">
              <Target className="w-4 h-4 text-primary" />
              New Opportunities (Bot Approved)
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            {opportunities.map(opp => (
              <div key={opp.symbol} className="flex items-center justify-between text-xs bg-emerald-50/50 border border-emerald-100 rounded-lg p-2">
                <div>
                  <div className="font-bold">{opp.symbol}</div>
                  <div className="text-muted-foreground">{formatCurrency(opp.current_price)}</div>
                </div>
                <div className="text-right space-y-0.5">
                  <Badge className="bg-emerald-100 text-emerald-700 text-xs block">{opp.botSignal?.replace('_', ' ')}</Badge>
                  <div className="text-muted-foreground">Conf: {opp.analysis?.confirmations || 0}/8</div>
                </div>
              </div>
            ))}
          </CardContent>
        </Card>
      )}
    </div>
  );
}