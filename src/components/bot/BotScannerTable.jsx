import React from 'react';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { formatCurrency } from '@/lib/stockData';
import { Signal } from '@/lib/tradingEngine';
import { TrendingUp, TrendingDown, Minus, ChevronRight } from 'lucide-react';
import { motion } from 'framer-motion';

const SIGNAL_CONFIG = {
  STRONG_BUY:  { label: 'STRONG BUY',  color: 'bg-emerald-100 text-emerald-700 border-emerald-200' },
  BUY:         { label: 'BUY',          color: 'bg-green-100 text-green-700 border-green-200' },
  HOLD:        { label: 'HOLD',         color: 'bg-amber-100 text-amber-700 border-amber-200' },
  SELL:        { label: 'SELL',         color: 'bg-orange-100 text-orange-700 border-orange-200' },
  STRONG_SELL: { label: 'STRONG SELL', color: 'bg-red-100 text-red-700 border-red-200' },
};

const REGIME_COLORS = {
  BULL_TRENDING: 'text-emerald-600',
  BEAR_TRENDING: 'text-red-600',
  HIGH_VOLATILITY: 'text-orange-500',
  TRENDING_UP: 'text-green-600',
  TRENDING_DOWN: 'text-red-500',
  CONSOLIDATION: 'text-amber-600',
  LOW_VOLATILITY: 'text-blue-500',
};

const MTF_COLORS = {
  BULLISH: 'text-emerald-600',
  SLIGHTLY_BULLISH: 'text-green-500',
  NEUTRAL: 'text-amber-600',
  SLIGHTLY_BEARISH: 'text-orange-500',
  BEARISH: 'text-red-600',
};

export default function BotScannerTable({ scanResults, selectedSymbol, onSelect, holdingsMap }) {
  return (
    <Card>
      <CardHeader className="pb-3">
        <CardTitle className="text-base flex items-center gap-2">
          Market Scanner — {scanResults.length} stocks analyzed
          <span className="text-xs font-normal text-muted-foreground ml-1">· sorted by Profit Score</span>
        </CardTitle>
      </CardHeader>
      <CardContent className="p-0">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b bg-muted/30 text-muted-foreground text-xs">
                <th className="text-left px-4 py-2 font-medium">Stock</th>
                <th className="text-center px-3 py-2 font-medium">Signal</th>
                <th className="text-right px-3 py-2 font-medium">Price</th>
                <th className="text-center px-3 py-2 font-medium hidden md:table-cell">Conf.</th>
                <th className="text-center px-3 py-2 font-medium hidden lg:table-cell">MTF</th>
                <th className="text-center px-3 py-2 font-medium hidden lg:table-cell">Regime</th>
                <th className="text-center px-3 py-2 font-medium">Score</th>
                <th className="text-center px-3 py-2 font-medium hidden md:table-cell">Held</th>
                <th className="px-2 py-2"></th>
              </tr>
            </thead>
            <tbody>
              {scanResults.map((stock, i) => {
                const sig = SIGNAL_CONFIG[stock.botSignal] || SIGNAL_CONFIG.HOLD;
                const isSelected = stock.symbol === selectedSymbol;
                const held = holdingsMap?.[stock.symbol]?.qty > 0;
                const conf = stock.analysis?.confirmations || 0;
                const regime = stock.analysis?.regime || 'CONSOLIDATION';
                const mtf = stock.mtf?.confluence || 'NEUTRAL';

                return (
                  <motion.tr
                    key={stock.symbol}
                    initial={{ opacity: 0, x: -10 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: i * 0.02 }}
                    onClick={() => onSelect(stock.symbol)}
                    className={`border-b cursor-pointer transition-colors hover:bg-muted/40 ${isSelected ? 'bg-primary/5 border-l-2 border-l-primary' : ''}`}
                  >
                    <td className="px-4 py-2.5">
                      <div className="font-semibold text-sm">{stock.symbol}</div>
                      <div className="text-xs text-muted-foreground truncate max-w-[120px]">{stock.sector}</div>
                    </td>
                    <td className="px-3 py-2.5 text-center">
                      <Badge variant="outline" className={`text-xs font-semibold border ${sig.color}`}>
                        {sig.label}
                      </Badge>
                    </td>
                    <td className="px-3 py-2.5 text-right font-mono text-sm">
                      {formatCurrency(stock.current_price)}
                    </td>
                    <td className="px-3 py-2.5 text-center hidden md:table-cell">
                      <div className="text-xs font-semibold">{conf}/8</div>
                      <div className="w-12 h-1 bg-muted rounded mx-auto mt-1">
                        <div
                          className={`h-full rounded ${conf >= 5 ? 'bg-emerald-500' : conf >= 3 ? 'bg-amber-500' : 'bg-red-400'}`}
                          style={{ width: `${(conf / 8) * 100}%` }}
                        />
                      </div>
                    </td>
                    <td className={`px-3 py-2.5 text-center text-xs font-medium hidden lg:table-cell ${MTF_COLORS[mtf] || 'text-muted-foreground'}`}>
                      {mtf.replace('_', ' ')}
                    </td>
                    <td className={`px-3 py-2.5 text-center text-xs font-medium hidden lg:table-cell ${REGIME_COLORS[regime] || 'text-muted-foreground'}`}>
                      {regime.replace('_', '\n')}
                    </td>
                    <td className="px-3 py-2.5 text-center">
                      <span className={`text-xs font-bold ${stock.profitScore >= 7 ? 'text-emerald-600' : stock.profitScore >= 4 ? 'text-amber-600' : 'text-red-500'}`}>
                        {stock.profitScore?.toFixed(1)}/10
                      </span>
                    </td>
                    <td className="px-3 py-2.5 text-center hidden md:table-cell">
                      {held && <Badge variant="secondary" className="text-xs px-1.5 py-0">In Portfolio</Badge>}
                    </td>
                    <td className="px-2 py-2.5">
                      <ChevronRight className={`w-3.5 h-3.5 text-muted-foreground ${isSelected ? 'text-primary' : ''}`} />
                    </td>
                  </motion.tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </CardContent>
    </Card>
  );
}