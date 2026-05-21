import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { AreaChart, Area, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid } from 'recharts';

export default function PortfolioChart({ trades, stocks }) {
  // Simulate portfolio value over time using OHLCV data
  const holdings = {};
  (trades || []).forEach(t => {
    if (!holdings[t.stock_symbol]) holdings[t.stock_symbol] = { qty: 0, name: t.stock_name };
    if (t.trade_type === 'BUY') holdings[t.stock_symbol].qty += t.quantity;
    else holdings[t.stock_symbol].qty -= t.quantity;
  });

  // Get dates from first stock's OHLCV data
  const firstStock = (stocks || [])[0];
  if (!firstStock?.ohlcv_data?.length) {
    return (
      <Card>
        <CardHeader><CardTitle className="text-base font-dm">Portfolio Value</CardTitle></CardHeader>
        <CardContent>
          <div className="h-64 flex items-center justify-center text-muted-foreground text-sm">
            Make your first trade to see portfolio performance
          </div>
        </CardContent>
      </Card>
    );
  }

  const chartData = firstStock.ohlcv_data.map((d, idx) => {
    let value = 0;
    Object.entries(holdings).forEach(([symbol, h]) => {
      if (h.qty > 0) {
        const stock = (stocks || []).find(s => s.symbol === symbol);
        const price = stock?.ohlcv_data?.[idx]?.close || stock?.current_price || 0;
        value += price * h.qty;
      }
    });
    return { date: d.date.slice(5), value: +value.toFixed(0) };
  });

  if (chartData.every(d => d.value === 0)) {
    return (
      <Card>
        <CardHeader><CardTitle className="text-base font-dm">Portfolio Value</CardTitle></CardHeader>
        <CardContent>
          <div className="h-64 flex items-center justify-center text-muted-foreground text-sm">
            Make your first trade to see portfolio performance
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base font-dm">Portfolio Value Over Time</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="h-64">
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={chartData}>
              <defs>
                <linearGradient id="portfolioGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="hsl(148, 58%, 28%)" stopOpacity={0.3} />
                  <stop offset="100%" stopColor="hsl(148, 58%, 28%)" stopOpacity={0.02} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="hsl(140, 12%, 89%)" />
              <XAxis dataKey="date" tick={{ fontSize: 11 }} stroke="hsl(160, 8%, 46%)" />
              <YAxis tick={{ fontSize: 11 }} stroke="hsl(160, 8%, 46%)" tickFormatter={v => `₹${(v/1000).toFixed(0)}K`} />
              <Tooltip 
                contentStyle={{ borderRadius: 12, border: '1px solid hsl(140, 12%, 89%)', fontSize: 12 }}
                formatter={(value) => [`₹${value.toLocaleString('en-IN')}`, 'Value']}
              />
              <Area type="monotone" dataKey="value" stroke="hsl(148, 58%, 28%)" fill="url(#portfolioGrad)" strokeWidth={2} />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      </CardContent>
    </Card>
  );
}