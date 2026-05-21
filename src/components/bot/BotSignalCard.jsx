import React from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { formatCurrency } from '@/lib/stockData';
import { TrendingUp, TrendingDown, Minus, Target, Shield } from 'lucide-react';
import { motion } from 'framer-motion';

const SIGNAL_CONFIG = {
  STRONG_BUY:  { color: 'border-l-emerald-500 bg-emerald-50/50', badge: 'bg-emerald-100 text-emerald-700', label: '🚀 STRONG BUY' },
  BUY:         { color: 'border-l-green-500 bg-green-50/30', badge: 'bg-green-100 text-green-700', label: '✅ BUY' },
  HOLD:        { color: 'border-l-amber-400 bg-amber-50/30', badge: 'bg-amber-100 text-amber-700', label: '⏸ HOLD' },
  SELL:        { color: 'border-l-orange-500 bg-orange-50/30', badge: 'bg-orange-100 text-orange-700', label: '⚠️ SELL' },
  STRONG_SELL: { color: 'border-l-red-500 bg-red-50/30', badge: 'bg-red-100 text-red-700', label: '🔴 STRONG SELL' },
};

export default function BotSignalCard({ stock, onClick }) {
  const cfg = SIGNAL_CONFIG[stock.botSignal] || SIGNAL_CONFIG.HOLD;
  const analysis = stock.analysis;

  return (
    <motion.div
      whileHover={{ scale: 1.01 }}
      onClick={onClick}
      className={`rounded-xl border-l-4 border border-border cursor-pointer p-4 ${cfg.color}`}
    >
      <div className="flex items-start justify-between mb-2">
        <div>
          <div className="font-bold text-base">{stock.symbol}</div>
          <div className="text-xs text-muted-foreground">{stock.sector}</div>
        </div>
        <Badge className={`text-xs ${cfg.badge}`}>{cfg.label}</Badge>
      </div>

      <div className="text-lg font-semibold mb-2">{formatCurrency(stock.current_price)}</div>

      {/* Confirmations bar */}
      <div className="flex items-center gap-2 mb-2">
        <span className="text-xs text-muted-foreground">Confirmations:</span>
        <div className="flex gap-0.5">
          {Array.from({ length: 8 }).map((_, i) => (
            <div
              key={i}
              className={`w-3 h-3 rounded-sm ${i < Math.round(analysis?.confirmations || 0) ? 'bg-primary' : 'bg-muted'}`}
            />
          ))}
        </div>
        <span className="text-xs font-semibold">{analysis?.confirmations || 0}/8</span>
      </div>

      <div className="grid grid-cols-3 gap-2 text-xs">
        <div className="bg-white/60 rounded-lg p-1.5 text-center">
          <div className="text-muted-foreground">Target</div>
          <div className="font-semibold text-emerald-600">{formatCurrency(analysis?.profitTarget2)}</div>
        </div>
        <div className="bg-white/60 rounded-lg p-1.5 text-center">
          <div className="text-muted-foreground">Stop Loss</div>
          <div className="font-semibold text-red-500">{formatCurrency(analysis?.stopLoss)}</div>
        </div>
        <div className="bg-white/60 rounded-lg p-1.5 text-center">
          <div className="text-muted-foreground">R:R</div>
          <div className="font-semibold">{analysis?.riskReward || 0}:1</div>
        </div>
      </div>

      <div className="mt-2 flex items-center gap-2">
        <span className="text-xs text-muted-foreground">Score:</span>
        <div className="flex-1 h-1.5 bg-muted rounded">
          <div
            className="h-full rounded bg-primary"
            style={{ width: `${(stock.profitScore / 10) * 100}%` }}
          />
        </div>
        <span className="text-xs font-bold">{stock.profitScore?.toFixed(1)}</span>
      </div>
    </motion.div>
  );
}