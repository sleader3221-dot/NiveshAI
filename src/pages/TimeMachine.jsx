import { db } from '@/lib/dbClient';

import React, { useState, useEffect, useRef } from 'react';

import { useQuery } from '@tanstack/react-query';
import { useAuth } from '@/lib/AuthContext';
import { STOCK_SEED_DATA, formatCurrency } from '@/lib/stockData';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Slider } from "@/components/ui/slider";
import { motion, AnimatePresence } from 'framer-motion';
import { Play, Pause, RotateCcw, Clock, TrendingUp, TrendingDown, Zap, Info, Brain } from 'lucide-react';
import { AreaChart, Area, XAxis, YAxis, Tooltip, ResponsiveContainer, ReferenceLine } from 'recharts';

// Historical market events mapped to day indices (0-29)
const MARKET_EVENTS = [
  { day: 3, label: "Budget Rally", desc: "Government announces ₹10L Cr infra capex — markets surge 3.2%", type: "positive" },
  { day: 8, label: "FII Selloff", desc: "Foreign investors pull ₹8,500 Cr from equities — markets drop 2.1%", type: "negative" },
  { day: 14, label: "RBI Policy", desc: "RBI holds repo rate, signals accommodative stance — banking stocks rally", type: "positive" },
  { day: 19, label: "Global Selloff", desc: "US recession fears — Nifty falls 1.8% in a single session", type: "negative" },
  { day: 24, label: "Quarterly Results", desc: "IT sector beats estimates; INFY, TCS post strong numbers", type: "positive" },
];

function getReplayData(stock) {
  const data = stock?.ohlcv_data || [];
  return data.map((row, index) => ({
    day: index + 1,
    price: row.close,
    date: row.date,
    event: MARKET_EVENTS.find((e) => e.day === index)?.label || null,
  }));
}

export default function TimeMachine() {
  const { user } = useAuth();
  const [stocks, setStocks] = useState([]);
  const [selectedSymbol, setSelectedSymbol] = useState('RELIANCE');
  const [currentDay, setCurrentDay] = useState(0);
  const [isPlaying, setIsPlaying] = useState(false);
  const [replayData, setReplayData] = useState([]);
  const [speed, setSpeed] = useState(300);
  const intervalRef = useRef(null);

  const { data: dbStocks } = useQuery({
    queryKey: ['stocks'],
    queryFn: () => db.entities.Stock.list(),
  });

  const { data: trades } = useQuery({
    queryKey: ['trades', user?.email],
    queryFn: () => db.entities.Trade.filter({ created_by: user?.email }),
    enabled: !!user?.email,
  });

  useEffect(() => {
    const s = dbStocks?.length > 0 ? dbStocks : STOCK_SEED_DATA;
    setStocks(s);
  }, [dbStocks]);

  const selectedStock = stocks.find(s => s.symbol === selectedSymbol);

  useEffect(() => {
    if (selectedStock) {
      setReplayData(getReplayData(selectedStock));
      setCurrentDay(0);
      setIsPlaying(false);
    }
  }, [selectedStock]);

  useEffect(() => {
    if (isPlaying) {
      intervalRef.current = setInterval(() => {
        setCurrentDay(d => {
          if (d >= 29) {
            setIsPlaying(false);
            return 29;
          }
          return d + 1;
        });
      }, speed);
    } else {
      clearInterval(intervalRef.current);
    }
    return () => clearInterval(intervalRef.current);
  }, [isPlaying, speed]);

  const visibleData = replayData.slice(0, currentDay + 1);
  const startPrice = replayData[0]?.price || 0;
  const currentPrice = replayData[currentDay]?.price || 0;
  const pnlPct = startPrice > 0 ? (((currentPrice - startPrice) / startPrice) * 100).toFixed(2) : 0;
  const isUp = currentPrice >= startPrice;

  // Portfolio value simulation
  const holding = (trades || [])
    .filter(t => t.stock_symbol === selectedSymbol)
    .reduce((acc, t) => {
      if (t.trade_type === 'BUY') { acc.qty += t.quantity; acc.invested += t.total_value; }
      else { acc.qty -= t.quantity; }
      return acc;
    }, { qty: 0, invested: 0 });

  const portfolioValue = holding.qty > 0 ? holding.qty * currentPrice : 0;
  const portfolioPnL = portfolioValue - (holding.qty > 0 ? holding.invested : 0);
  const currentEvent = MARKET_EVENTS.find(e => e.day === currentDay);

  return (
    <div className="p-6 lg:p-8 max-w-[1400px] mx-auto space-y-6">
      <div>
        <h1 className="text-2xl lg:text-3xl font-dm font-bold flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-blue-100 flex items-center justify-center">
            <Clock className="w-5 h-5 text-blue-600" />
          </div>
          Market Time Machine
        </h1>
        <p className="text-muted-foreground mt-1">Fast-forward through 30 days of market history. Watch how events impact your portfolio.</p>
      </div>

      {/* Stock selector */}
      <div className="flex flex-wrap gap-2">
        {stocks.slice(0, 10).map(s => (
          <button
            key={s.symbol}
            onClick={() => setSelectedSymbol(s.symbol)}
            className={`px-4 py-2 rounded-xl text-sm font-medium border transition-all ${
              selectedSymbol === s.symbol
                ? 'bg-primary text-primary-foreground border-primary shadow-md'
                : 'border-border text-muted-foreground hover:border-primary/30 hover:text-foreground'
            }`}
          >
            {s.symbol}
          </button>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Chart */}
        <Card className="lg:col-span-2">
          <CardHeader className="pb-2">
            <div className="flex items-center justify-between flex-wrap gap-4">
              <div>
                <CardTitle className="font-dm text-xl">{selectedStock?.symbol}</CardTitle>
                <p className="text-sm text-muted-foreground">{selectedStock?.name}</p>
              </div>
              <div className="text-right">
                <p className="text-3xl font-dm font-bold">{formatCurrency(currentPrice)}</p>
                <p className={`text-sm font-semibold ${isUp ? 'text-emerald-600' : 'text-red-500'}`}>
                  {isUp ? '+' : ''}{pnlPct}% from start
                </p>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={visibleData}>
                  <defs>
                    <linearGradient id="priceGrad" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor={isUp ? 'hsl(148,58%,28%)' : 'hsl(0,70%,55%)'} stopOpacity={0.3} />
                      <stop offset="95%" stopColor={isUp ? 'hsl(148,58%,28%)' : 'hsl(0,70%,55%)'} stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <XAxis dataKey="date" tick={{ fontSize: 10 }} />
                  <YAxis tick={{ fontSize: 10 }} domain={['auto', 'auto']} />
                  <Tooltip
                    contentStyle={{ borderRadius: 12, fontSize: 12 }}
                    formatter={(v) => [formatCurrency(v), 'Price']}
                  />
                  {MARKET_EVENTS.map(e => (
                    <ReferenceLine
                      key={e.day}
                      x={`Day ${e.day + 1}`}
                      stroke={e.type === 'positive' ? 'hsl(148,58%,28%)' : 'hsl(0,70%,55%)'}
                      strokeDasharray="4 4"
                      opacity={0.6}
                    />
                  ))}
                  <Area
                    type="monotone"
                    dataKey="price"
                    stroke={isUp ? 'hsl(148,58%,28%)' : 'hsl(0,70%,55%)'}
                    fill="url(#priceGrad)"
                    strokeWidth={2.5}
                    animationDuration={100}
                  />
                </AreaChart>
              </ResponsiveContainer>
            </div>

            {/* Timeline slider */}
            <div className="mt-4 px-2">
              <div className="flex items-center justify-between text-xs text-muted-foreground mb-2">
                <span>Day 1</span>
                <span className="font-medium text-foreground">Day {currentDay + 1} of 30</span>
                <span>Day 30</span>
              </div>
              <Slider
                min={0}
                max={29}
                step={1}
                value={[currentDay]}
                onValueChange={([v]) => { setCurrentDay(v); setIsPlaying(false); }}
                className="w-full"
              />
            </div>

            {/* Controls */}
            <div className="flex items-center justify-between mt-4 flex-wrap gap-3">
              <div className="flex items-center gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => { setCurrentDay(0); setIsPlaying(false); }}
                >
                  <RotateCcw className="w-4 h-4" />
                </Button>
                <Button
                  size="sm"
                  onClick={() => setIsPlaying(p => !p)}
                  className={isPlaying ? 'bg-amber-500 hover:bg-amber-600' : ''}
                >
                  {isPlaying ? <Pause className="w-4 h-4 mr-1" /> : <Play className="w-4 h-4 mr-1" />}
                  {isPlaying ? 'Pause' : 'Play'}
                </Button>
              </div>
              <div className="flex items-center gap-2 text-xs">
                <span className="text-muted-foreground">Speed:</span>
                {[{ label: '1x', ms: 600 }, { label: '2x', ms: 300 }, { label: '4x', ms: 150 }].map(s => (
                  <button
                    key={s.label}
                    onClick={() => setSpeed(s.ms)}
                    className={`px-3 py-1 rounded-lg border text-xs font-medium transition-all ${speed === s.ms ? 'bg-primary text-primary-foreground border-primary' : 'border-border hover:border-primary/30'}`}
                  >
                    {s.label}
                  </button>
                ))}
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Right panel */}
        <div className="space-y-4">
          {/* Event notification */}
          <AnimatePresence mode="wait">
            {currentEvent && (
              <motion.div
                key={currentDay}
                initial={{ opacity: 0, scale: 0.95, y: -10 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.95 }}
              >
                <Card className={`border-2 ${currentEvent.type === 'positive' ? 'border-emerald-300 bg-emerald-50' : 'border-red-300 bg-red-50'}`}>
                  <CardContent className="p-4">
                    <div className="flex items-center gap-2 mb-2">
                      <Zap className={`w-4 h-4 ${currentEvent.type === 'positive' ? 'text-emerald-600' : 'text-red-500'}`} />
                      <span className={`text-sm font-bold ${currentEvent.type === 'positive' ? 'text-emerald-700' : 'text-red-600'}`}>
                        Market Event!
                      </span>
                    </div>
                    <p className="text-sm font-semibold mb-1">{currentEvent.label}</p>
                    <p className="text-xs text-muted-foreground">{currentEvent.desc}</p>
                  </CardContent>
                </Card>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Portfolio impact */}
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-dm">Your Portfolio Impact</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              {holding.qty > 0 ? (
                <>
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">Shares held</span>
                    <span className="font-semibold">{holding.qty}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">Current Value</span>
                    <span className="font-semibold">{formatCurrency(portfolioValue)}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">Unrealized P&L</span>
                    <span className={`font-bold ${portfolioPnL >= 0 ? 'text-emerald-600' : 'text-red-500'}`}>
                      {portfolioPnL >= 0 ? '+' : ''}{formatCurrency(portfolioPnL)}
                    </span>
                  </div>
                </>
              ) : (
                <div className="text-center py-4">
                  <p className="text-sm text-muted-foreground">No holdings in {selectedSymbol}</p>
                  <p className="text-xs text-muted-foreground mt-1">Buy this stock to see portfolio impact</p>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Events legend */}
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-dm flex items-center gap-2">
                <Info className="w-4 h-4" /> Market Events
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              {MARKET_EVENTS.map(e => (
                <div
                  key={e.day}
                  className={`flex items-center gap-2 p-2 rounded-lg cursor-pointer transition-all ${currentDay >= e.day ? 'opacity-100' : 'opacity-40'}`}
                  onClick={() => { setCurrentDay(e.day); setIsPlaying(false); }}
                >
                  <div className={`w-2 h-2 rounded-full flex-shrink-0 ${e.type === 'positive' ? 'bg-emerald-500' : 'bg-red-500'}`} />
                  <div>
                    <p className="text-xs font-semibold">Day {e.day + 1}: {e.label}</p>
                    <p className="text-[10px] text-muted-foreground line-clamp-1">{e.desc}</p>
                  </div>
                </div>
              ))}
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Insight section */}
      <Card className="bg-primary/5 border-primary/10">
        <CardContent className="p-5">
          <h3 className="font-dm font-semibold mb-2 flex items-center gap-2">
            <Brain className="w-4 h-4 text-primary" />
            What the Time Machine teaches you
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
            <div className="p-3 bg-background rounded-xl border border-border">
              <p className="font-semibold mb-1">📉 Market Corrections are Normal</p>
              <p className="text-muted-foreground text-xs">Even strong stocks dip 10-15%. Panic selling at dips destroys wealth.</p>
            </div>
            <div className="p-3 bg-background rounded-xl border border-border">
              <p className="font-semibold mb-1">⏱ Time in Market &gt; Timing Market</p>
              <p className="text-muted-foreground text-xs">Staying invested through volatility outperforms trying to time perfect entries.</p>
            </div>
            <div className="p-3 bg-background rounded-xl border border-border">
              <p className="font-semibold mb-1">📊 Events Create Opportunities</p>
              <p className="text-muted-foreground text-xs">Budget days, policy announcements, and results seasons offer entry points.</p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
