import React from 'react';
import { Card } from "@/components/ui/card";
import { TrendingUp, TrendingDown, Briefcase, IndianRupee, BarChart3, Star } from 'lucide-react';
import { formatCurrency } from '@/lib/stockData';
import { motion } from 'framer-motion';

export default function StatsRow({ trades, stocks, profile }) {
  // Calculate portfolio metrics
  const holdings = {};
  (trades || []).forEach(t => {
    if (!holdings[t.stock_symbol]) holdings[t.stock_symbol] = { qty: 0, invested: 0, name: t.stock_name, sector: t.sector };
    if (t.trade_type === 'BUY') {
      holdings[t.stock_symbol].qty += t.quantity;
      holdings[t.stock_symbol].invested += t.total_value;
    } else {
      holdings[t.stock_symbol].qty -= t.quantity;
      holdings[t.stock_symbol].invested -= t.price * t.quantity;
    }
  });

  let totalInvested = 0, currentValue = 0, holdingsCount = 0;
  Object.entries(holdings).forEach(([symbol, h]) => {
    if (h.qty > 0) {
      holdingsCount++;
      totalInvested += h.invested;
      const stock = (stocks || []).find(s => s.symbol === symbol);
      currentValue += (stock?.current_price || 0) * h.qty;
    }
  });

  const totalPnL = currentValue - totalInvested;
  const pnlPercent = totalInvested > 0 ? ((totalPnL / totalInvested) * 100).toFixed(2) : 0;
  const isProfit = totalPnL >= 0;

  const stats = [
    { 
      label: 'Portfolio Value', 
      value: formatCurrency(currentValue), 
      icon: Briefcase,
      color: 'bg-primary/10 text-primary',
      subtext: `${holdingsCount} holdings`
    },
    { 
      label: 'Total P&L', 
      value: `${isProfit ? '+' : ''}${formatCurrency(totalPnL)}`, 
      icon: isProfit ? TrendingUp : TrendingDown,
      color: isProfit ? 'bg-emerald-50 text-emerald-600' : 'bg-red-50 text-red-600',
      subtext: `${isProfit ? '+' : ''}${pnlPercent}%`
    },
    { 
      label: 'Investable Amount', 
      value: formatCurrency(profile?.investable_amount || 0), 
      icon: IndianRupee,
      color: 'bg-blue-50 text-blue-600',
      subtext: profile?.risk_appetite ? `${profile.risk_appetite} risk` : 'Set profile'
    },
    { 
      label: 'Buy Signals', 
      value: (stocks || []).filter(s => s.signal === 'BUY' || s.signal === 'STRONG_BUY').length,
      icon: BarChart3,
      color: 'bg-amber-50 text-amber-600',
      subtext: `of ${(stocks || []).length} stocks`
    },
  ];

  return (
    <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
      {stats.map((stat, i) => (
        <motion.div
          key={stat.label}
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: i * 0.08 }}
        >
          <Card className="p-5 hover:shadow-md transition-shadow">
            <div className="flex items-start justify-between">
              <div>
                <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider">{stat.label}</p>
                <p className="text-2xl font-dm font-bold mt-2">{stat.value}</p>
                <p className="text-xs text-muted-foreground mt-1 capitalize">{stat.subtext}</p>
              </div>
              <div className={`p-2.5 rounded-xl ${stat.color}`}>
                <stat.icon className="w-5 h-5" />
              </div>
            </div>
          </Card>
        </motion.div>
      ))}
    </div>
  );
}