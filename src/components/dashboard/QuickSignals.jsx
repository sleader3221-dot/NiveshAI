import React from 'react';
import { Link } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { ArrowRight, Zap } from 'lucide-react';
import { getSignalColor, formatCurrency } from '@/lib/stockData';

export default function QuickSignals({ stocks }) {
  const buySignals = (stocks || [])
    .filter(s => s.signal === 'BUY' || s.signal === 'STRONG_BUY')
    .slice(0, 5);

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between">
        <CardTitle className="text-base font-dm flex items-center gap-2">
          <Zap className="w-4 h-4 text-primary" /> AI Buy Signals
        </CardTitle>
        <Link to="/stocks">
          <Button variant="ghost" size="sm" className="text-primary">
            View All <ArrowRight className="w-3 h-3 ml-1" />
          </Button>
        </Link>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
          {buySignals.map(stock => (
            <Link
              key={stock.symbol}
              to={`/stock/${stock.symbol}`}
              className="p-4 rounded-xl border border-border hover:border-primary/30 hover:shadow-sm transition-all"
            >
              <div className="flex items-start justify-between">
                <div>
                  <p className="font-semibold text-sm">{stock.symbol}</p>
                  <p className="text-xs text-muted-foreground mt-0.5">{stock.name}</p>
                </div>
                <Badge className={`${getSignalColor(stock.signal)} border text-[10px] font-semibold`}>
                  {stock.signal.replace('_', ' ')}
                </Badge>
              </div>
              <p className="text-lg font-dm font-bold mt-3">{formatCurrency(stock.current_price)}</p>
              <p className="text-xs text-muted-foreground mt-2 line-clamp-2">{stock.signal_reasoning?.slice(0, 80)}...</p>
            </Link>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}