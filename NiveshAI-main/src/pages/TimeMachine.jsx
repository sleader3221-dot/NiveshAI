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
import { Play, Pause, RotateCcw, Clock, TrendingUp, TrendingDown, Zap, Info, Brain, CheckCircle, XCircle, Target } from 'lucide-react';
import { AreaChart, Area, XAxis, YAxis, Tooltip, ResponsiveContainer, ReferenceLine, CartesianGrid } from 'recharts';

const MARKET_EVENTS = [
  { day: 3, label: "Infrastructure Budget", desc: "Government announces ₹10 lakh crore spending plan on roads, railways, and ports — markets surge 3.2%", type: "positive" },
  { day: 8, label: "Foreign Investors Sell", desc: "Global funds pull out ₹8,500 crore from Indian equities — markets drop 2.1%", type: "negative" },
  { day: 14, label: "RBI Holds Interest Rate", desc: "Reserve Bank keeps interest rates steady. Banks and home-loan companies rally as investors cheer stable borrowing costs", type: "positive" },
  { day: 19, label: "Global Selloff Panic", desc: "US recession fears cause worldwide selloff. Nifty falls 1.8% in a single day — a good time for calm investors to buy the dip!", type: "negative" },
  { day: 24, label: "IT Companies Beat Targets", desc: "Infosys, TCS, and Wipro report stronger-than-expected quarterly results — IT stocks rally", type: "positive" },
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
  const daysInData = replayData.length;

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
          if (d >= daysInData - 1) {
            setIsPlaying(false);
            return daysInData - 1;
          }
          return d + 1;
        });
      }, speed);
    } else {
      clearInterval(intervalRef.current);
    }
    return () => clearInterval(intervalRef.current);
  }, [isPlaying, speed, daysInData]);

  const visibleData = replayData.slice(0, currentDay + 1);
  const startPrice = replayData[0]?.price || 0;
  const endPriceAtCurrent = replayData[currentDay]?.price || 0;
  const finalPrice = replayData[daysInData - 1]?.price || 0;
  const pnlPctFromStart = startPrice > 0 ? (((endPriceAtCurrent - startPrice) / startPrice) * 100).toFixed(2) : 0;
  const finalPnlPct = startPrice > 0 ? (((finalPrice - startPrice) / startPrice) * 100).toFixed(2) : 0;
  const isUp = endPriceAtCurrent >= startPrice;

  // Model Accuracy: Compare signal direction against actual movement
  const signal = selectedStock?.signal || 'HOLD';
  const signalIsPositive = signal === 'STRONG_BUY' || signal === 'BUY';
  const signalIsNegative = signal === 'STRONG_SELL' || signal === 'SELL';
  const actualIsPositive = finalPrice >= startPrice;
  const modelCorrect = (signalIsPositive && actualIsPositive) || (signalIsNegative && !actualIsPositive);
  const accuracyPct = signalIsPositive || signalIsNegative ? (modelCorrect ? 100 : 0) : 50;

  const holding = (trades || [])
    .filter(t => t.stock_symbol === selectedSymbol)
    .reduce((acc, t) => {
      if (t.trade_type === 'BUY') { acc.qty += t.quantity; acc.invested += t.total_value; }
      else { acc.qty -= t.quantity; }
      return acc;
    }, { qty: 0, invested: 0 });

  const portfolioValue = holding.qty > 0 ? holding.qty * endPriceAtCurrent : 0;
  const portfolioPnL = portfolioValue - (holding.qty > 0 ? holding.invested : 0);
  const currentEvent = MARKET_EVENTS.find(e => e.day === currentDay);

  // Price change stats
  const daysUp = visibleData.filter((d, i) => i > 0 && d.price >= replayData[i-1]?.price).length;
  const daysDown = visibleData.filter((d, i) => i > 0 && d.price < replayData[i-1]?.price).length;
  const totalDays = Math.max(daysUp + daysDown, 1);

  return (
    <div className="p-6 lg:p-8 max-w-[1400px] mx-auto space-y-6">
      {/* Header with beginner tip */}
      <div className="flex items-start justify-between flex-wrap gap-4">
        <div>
          <h1 className="text-2xl lg:text-3xl font-dm font-bold flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center">
              <Clock className="w-5 h-5 text-primary" />
            </div>
            Market Time Machine
          </h1>
          <p className="text-muted-foreground mt-1">See how real market events would have affected your stock investments — and check if our AI signals got it right.</p>
        </div>
        <div className="bg-accent rounded-xl px-4 py-3 text-sm max-w-xs">
          <p className="font-semibold text-xs flex items-center gap-1"><Info className="w-3 h-3" /> Beginner Tip</p>
          <p className="text-xs text-muted-foreground mt-1">Press <strong>Play</strong> to fast-forward through market events. Watch how prices react to news — this is how real markets behave!</p>
        </div>
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
                <p className="text-3xl font-dm font-bold">{formatCurrency(endPriceAtCurrent)}</p>
                <p className="text-sm font-semibold flex items-center gap-1 justify-end">
                  <span className={isUp ? 'text-emerald-600' : 'text-red-500'}>
                    {isUp ? '▲' : '▼'} {isUp ? '+' : ''}{pnlPctFromStart}%
                  </span>
                  <span className="text-muted-foreground text-xs">from day 1</span>
                </p>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <div className="h-72">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={visibleData}>
                  <defs>
                    <linearGradient id="priceGrad" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor={isUp ? '#10b981' : '#ef4444'} stopOpacity={0.25} />
                      <stop offset="95%" stopColor={isUp ? '#10b981' : '#ef4444'} stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                  <XAxis dataKey="day" tick={{ fontSize: 10 }} label={{ value: 'Trading Day', position: 'insideBottomRight', offset: -5, style: { fontSize: 10 } }} />
                  <YAxis tick={{ fontSize: 10 }} domain={['auto', 'auto']} tickFormatter={(v) => `₹${(v/1000).toFixed(0)}K`} />
                  <Tooltip
                    contentStyle={{ borderRadius: 12, fontSize: 12, border: '1px solid hsl(var(--border))' }}
                    formatter={(v) => [formatCurrency(v), 'Price']}
                    labelFormatter={(v) => `Day ${v}`}
                  />
                  {MARKET_EVENTS.filter(e => e.day <= currentDay).map(e => (
                    <ReferenceLine
                      key={e.day}
                      x={e.day + 1}
                      stroke={e.type === 'positive' ? '#10b981' : '#ef4444'}
                      strokeDasharray="4 4"
                      opacity={0.4}
                    />
                  ))}
                  <Area
                    type="monotone"
                    dataKey="price"
                    stroke={isUp ? '#10b981' : '#ef4444'}
                    fill="url(#priceGrad)"
                    strokeWidth={2.5}
                    animationDuration={100}
                  />
                </AreaChart>
              </ResponsiveContainer>
            </div>

            <div className="mt-4 px-2">
              <div className="flex items-center justify-between text-xs text-muted-foreground mb-2">
                <span>Day 1</span>
                <span className="font-bold text-foreground">Day {currentDay + 1} of {daysInData}</span>
                <span>Day {daysInData}</span>
              </div>
              <Slider
                min={0}
                max={daysInData - 1}
                step={1}
                value={[currentDay]}
                onValueChange={([v]) => { setCurrentDay(v); setIsPlaying(false); }}
                className="w-full"
              />
            </div>

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
                  className={isPlaying ? 'bg-amber-500 hover:bg-amber-600 border-amber-500' : ''}
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

            {/* Day counter stats */}
            {currentDay > 0 && (
              <div className="mt-4 grid grid-cols-3 gap-3 text-center text-xs">
                <div className="bg-muted rounded-lg p-2">
                  <p className="text-muted-foreground">Days Up</p>
                  <p className="text-emerald-600 font-bold text-sm">{daysUp}/{totalDays}</p>
                </div>
                <div className="bg-muted rounded-lg p-2">
                  <p className="text-muted-foreground">Days Down</p>
                  <p className="text-red-500 font-bold text-sm">{daysDown}/{totalDays}</p>
                </div>
                <div className="bg-muted rounded-lg p-2">
                  <p className="text-muted-foreground">Net Change</p>
                  <p className={`font-bold text-sm ${isUp ? 'text-emerald-600' : 'text-red-500'}`}>
                    {isUp ? '+' : ''}{pnlPctFromStart}%
                  </p>
                </div>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Right panel */}
        <div className="space-y-4">
          {/* Current Event (animated) */}
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

          {/* Model Accuracy */}
          {currentDay === daysInData - 1 && (
            <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}>
              <Card className="border-2 border-amber-200 bg-amber-50">
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm font-dm flex items-center gap-2">
                    <Target className="w-4 h-4 text-amber-600" /> AI Signal Accuracy
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  <div className="flex items-center gap-2">
                    <div className={`w-10 h-10 rounded-full flex items-center justify-center ${modelCorrect ? 'bg-emerald-100' : 'bg-red-100'}`}>
                      {modelCorrect ? <CheckCircle className="w-5 h-5 text-emerald-600" /> : <XCircle className="w-5 h-5 text-red-500" />}
                    </div>
                    <div>
                      <p className="text-sm font-bold">{modelCorrect ? 'Our AI was RIGHT!' : 'Our AI got it wrong'}</p>
                      <p className="text-xs text-muted-foreground">
                        Signal: <strong>{signal.replace('_', ' ')}</strong> | 
                        Actual: {actualIsPositive ? '📈 Up' : '📉 Down'} {finalPnlPct}%
                      </p>
                    </div>
                  </div>
                  <div className="text-xs text-muted-foreground">
                    <p>Our model predicted this stock would {signalIsPositive ? 'go up' : signalIsNegative ? 'go down' : 'stay steady'}. 
                    In reality, it {actualIsPositive ? 'increased' : 'decreased'} by <strong>{finalPnlPct}%</strong> over {daysInData} trading days.</p>
                    <p className="mt-1 italic">Tip: No model is 100% accurate — that's why diversification matters!</p>
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          )}

          {/* Portfolio impact */}
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-dm">Your Holdings in {selectedSymbol}</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              {holding.qty > 0 ? (
                <>
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">Shares owned</span>
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
                  <p className="text-xs text-muted-foreground mt-1">Buy this stock to see how it affects your portfolio over time</p>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Market events timeline */}
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-dm flex items-center gap-2">
                <Info className="w-4 h-4" /> Key Events
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

      {/* Beginner insight section */}
      <Card className="bg-primary/5 border-primary/10">
        <CardContent className="p-5">
          <h3 className="font-dm font-semibold mb-3 flex items-center gap-2">
            <Brain className="w-4 h-4 text-primary" />
            What the Time Machine teaches you
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
            <div className="p-3 bg-background rounded-xl border border-border">
              <p className="font-semibold mb-1">📉 Market Dips are Normal</p>
              <p className="text-muted-foreground text-xs">Even good stocks drop 10-15% occasionally. Selling in panic locks in losses — staying patient pays off.</p>
            </div>
            <div className="p-3 bg-background rounded-xl border border-border">
              <p className="font-semibold mb-1">⏱ Time Beats Timing</p>
              <p className="text-muted-foreground text-xs">Investors who stay invested through ups and downs earn more than those trying to buy at the perfect low and sell at the perfect high.</p>
            </div>
            <div className="p-3 bg-background rounded-xl border border-border">
              <p className="font-semibold mb-1">📊 News Moves Markets</p>
              <p className="text-muted-foreground text-xs">Budgets, RBI decisions, and company results create opportunities. The key is buying quality stocks when others are panicking.</p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}