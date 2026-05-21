import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip, Legend } from 'recharts';

const SECTOR_COLORS = [
  'hsl(148, 58%, 28%)', 'hsl(210, 60%, 50%)', 'hsl(43, 74%, 56%)', 
  'hsl(0, 70%, 55%)', 'hsl(280, 50%, 55%)', 'hsl(173, 58%, 39%)',
  'hsl(30, 80%, 55%)', 'hsl(160, 50%, 45%)', 'hsl(340, 60%, 50%)', 'hsl(60, 60%, 45%)'
];

export default function SectorAllocation({ trades, stocks }) {
  const holdings = {};
  (trades || []).forEach(t => {
    if (!holdings[t.stock_symbol]) holdings[t.stock_symbol] = { qty: 0, sector: t.sector };
    if (t.trade_type === 'BUY') holdings[t.stock_symbol].qty += t.quantity;
    else holdings[t.stock_symbol].qty -= t.quantity;
  });

  const sectorMap = {};
  Object.entries(holdings).forEach(([symbol, h]) => {
    if (h.qty > 0) {
      const stock = (stocks || []).find(s => s.symbol === symbol);
      const value = (stock?.current_price || 0) * h.qty;
      const sector = h.sector || stock?.sector || 'Other';
      sectorMap[sector] = (sectorMap[sector] || 0) + value;
    }
  });

  const data = Object.entries(sectorMap)
    .map(([name, value]) => ({ name, value: +value.toFixed(0) }))
    .sort((a, b) => b.value - a.value);

  if (data.length === 0) {
    return (
      <Card>
        <CardHeader><CardTitle className="text-base font-dm">Sector Allocation</CardTitle></CardHeader>
        <CardContent>
          <div className="h-64 flex items-center justify-center text-muted-foreground text-sm">
            Add stocks to see sector breakdown
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base font-dm">Sector Allocation</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="h-64">
          <ResponsiveContainer width="100%" height="100%">
            <PieChart>
              <Pie
                data={data}
                cx="50%"
                cy="50%"
                innerRadius={55}
                outerRadius={90}
                paddingAngle={3}
                dataKey="value"
              >
                {data.map((_, i) => (
                  <Cell key={i} fill={SECTOR_COLORS[i % SECTOR_COLORS.length]} />
                ))}
              </Pie>
              <Tooltip formatter={(value) => `₹${value.toLocaleString('en-IN')}`} />
              <Legend iconSize={8} wrapperStyle={{ fontSize: 11 }} />
            </PieChart>
          </ResponsiveContainer>
        </div>
      </CardContent>
    </Card>
  );
}