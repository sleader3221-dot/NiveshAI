import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { TrendingUp, TrendingDown } from 'lucide-react';
import { formatCurrency } from '@/lib/stockData';

export default function TopMovers({ trades, stocks }) {
  const holdings = {};
  (trades || []).forEach(t => {
    if (!holdings[t.stock_symbol]) holdings[t.stock_symbol] = { qty: 0, invested: 0, name: t.stock_name };
    if (t.trade_type === 'BUY') {
      holdings[t.stock_symbol].qty += t.quantity;
      holdings[t.stock_symbol].invested += t.total_value;
    } else {
      holdings[t.stock_symbol].qty -= t.quantity;
      holdings[t.stock_symbol].invested -= t.price * t.quantity;
    }
  });

  const movers = Object.entries(holdings)
    .filter(([_, h]) => h.qty > 0)
    .map(([symbol, h]) => {
      const stock = (stocks || []).find(s => s.symbol === symbol);
      const currentVal = (stock?.current_price || 0) * h.qty;
      const pnl = currentVal - h.invested;
      const pnlPct = h.invested > 0 ? (pnl / h.invested) * 100 : 0;
      return { symbol, name: h.name, pnl, pnlPct, currentVal };
    })
    .sort((a, b) => b.pnl - a.pnl);

  const gainers = movers.filter(m => m.pnl > 0).slice(0, 3);
  const losers = movers.filter(m => m.pnl < 0).sort((a, b) => a.pnl - b.pnl).slice(0, 3);

  const renderItem = (item, isGainer) => (
    <div key={item.symbol} className="flex items-center justify-between py-3 border-b border-border last:border-0">
      <div>
        <p className="font-medium text-sm">{item.symbol}</p>
        <p className="text-xs text-muted-foreground">{item.name}</p>
      </div>
      <div className="text-right">
        <p className={`text-sm font-semibold flex items-center gap-1 ${isGainer ? 'text-emerald-600' : 'text-red-500'}`}>
          {isGainer ? <TrendingUp className="w-3 h-3" /> : <TrendingDown className="w-3 h-3" />}
          {isGainer ? '+' : ''}{item.pnlPct.toFixed(2)}%
        </p>
        <p className="text-xs text-muted-foreground">{formatCurrency(Math.abs(item.pnl))}</p>
      </div>
    </div>
  );

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-base font-dm flex items-center gap-2">
            <TrendingUp className="w-4 h-4 text-emerald-600" /> Top Gainers
          </CardTitle>
        </CardHeader>
        <CardContent>
          {gainers.length > 0 ? gainers.map(g => renderItem(g, true)) : (
            <p className="text-sm text-muted-foreground py-4 text-center">No gainers yet</p>
          )}
        </CardContent>
      </Card>
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-base font-dm flex items-center gap-2">
            <TrendingDown className="w-4 h-4 text-red-500" /> Top Losers
          </CardTitle>
        </CardHeader>
        <CardContent>
          {losers.length > 0 ? losers.map(l => renderItem(l, false)) : (
            <p className="text-sm text-muted-foreground py-4 text-center">No losers yet</p>
          )}
        </CardContent>
      </Card>
    </div>
  );
}