import { db } from '@/lib/dbClient';

import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useAuth } from '@/lib/AuthContext';
import { STOCK_SEED_DATA, calculateSMA, calculateRSI, calculateMACD, calculateBollingerBands, getSignalColor, getRiskColor, formatCurrency, formatNumber } from '@/lib/stockData';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { ArrowLeft, TrendingUp, TrendingDown, Star, ShoppingCart, MinusCircle, Info, BarChart3, Activity } from 'lucide-react';
import { AreaChart, Area, LineChart, Line, BarChart, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid, ComposedChart, Bar, ReferenceLine } from 'recharts';
import { toast } from 'sonner';
import { motion } from 'framer-motion';

export default function StockDetail() {
  const { symbol } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const [stocks, setStocks] = useState([]);
  const [tradeQty, setTradeQty] = useState(1);
  const [tradeDialog, setTradeDialog] = useState(null); // 'BUY' or 'SELL'

  const { data: dbStocks } = useQuery({
    queryKey: ['stocks'],
    queryFn: () => db.entities.Stock.list(),
  });

  useEffect(() => {
    setStocks(dbStocks?.length > 0 ? dbStocks : STOCK_SEED_DATA);
  }, [dbStocks]);

  const stock = stocks.find(s => s.symbol === symbol);
  const ohlcv = stock?.ohlcv_data || [];

  const sma20 = calculateSMA(ohlcv, 5);
  const sma50 = calculateSMA(ohlcv, 10);
  const rsi = calculateRSI(ohlcv, 7);
  const macd = calculateMACD(ohlcv);
  const bbands = calculateBollingerBands(ohlcv, 10);

  const { data: myTrades } = useQuery({
    queryKey: ['trades', user?.email],
    queryFn: () => db.entities.Trade.filter({ created_by: user?.email }),
    enabled: !!user?.email,
  });

  const myHolding = (myTrades || [])
    .filter(t => t.stock_symbol === symbol)
    .reduce((acc, t) => {
      if (t.trade_type === 'BUY') { acc.qty += t.quantity; acc.invested += t.total_value; }
      else { acc.qty -= t.quantity; acc.invested -= t.price * t.quantity; }
      return acc;
    }, { qty: 0, invested: 0 });

  const tradeMutation = useMutation({
    mutationFn: (data) => db.entities.Trade.create(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['trades'] });
      setTradeDialog(null);
      setTradeQty(1);
      toast.success('Trade executed successfully!');
    },
  });

  const watchlistMutation = useMutation({
    mutationFn: () => db.entities.Watchlist.create({
      stock_symbol: stock.symbol,
      stock_name: stock.name,
      added_price: stock.current_price,
    }),
    onSuccess: () => toast.success('Added to watchlist!'),
  });

  const handleTrade = (type) => {
    if (type === 'SELL' && tradeQty > myHolding.qty) {
      toast.error(`You only hold ${myHolding.qty} shares`);
      return;
    }
    tradeMutation.mutate({
      stock_symbol: stock.symbol,
      stock_name: stock.name,
      trade_type: type,
      quantity: tradeQty,
      price: stock.current_price,
      total_value: +(stock.current_price * tradeQty).toFixed(2),
      sector: stock.sector,
      trade_date: new Date().toISOString().split('T')[0],
    });
  };

  if (!stock) {
    return (
      <div className="p-8 text-center">
        <p className="text-muted-foreground">Stock not found</p>
        <Button variant="outline" onClick={() => navigate('/stocks')} className="mt-4">
          <ArrowLeft className="w-4 h-4 mr-2" /> Back to Stocks
        </Button>
      </div>
    );
  }

  const chartData = ohlcv.map((d) => ({
    date: d.date.slice(5),
    price: d.close,
    high: d.high,
    low: d.low,
    volume: d.volume,
    sma20: sma20.find(s => s.date === d.date)?.value,
    sma50: sma50.find(s => s.date === d.date)?.value,
    bbUpper: bbands.find(b => b.date === d.date)?.upper,
    bbLower: bbands.find(b => b.date === d.date)?.lower,
  }));

  const rsiData = rsi.map(r => ({ date: r.date.slice(5), rsi: r.value }));
  const macdData = macd.map(m => ({ date: m.date.slice(5), macd: m.macd, signal: m.signal, histogram: m.histogram }));

  const currentPnL = myHolding.qty > 0 ? (stock.current_price * myHolding.qty) - myHolding.invested : 0;
  const pnlPct = myHolding.invested > 0 ? ((currentPnL / myHolding.invested) * 100).toFixed(2) : 0;

  return (
    <div className="p-6 lg:p-8 max-w-[1400px] mx-auto space-y-6">
      {/* Back + Header */}
      <Button variant="ghost" size="sm" onClick={() => navigate(-1)} className="text-muted-foreground -ml-2">
        <ArrowLeft className="w-4 h-4 mr-1" /> Back
      </Button>

      <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}>
        <div className="flex flex-col lg:flex-row lg:items-start justify-between gap-4">
          <div>
            <div className="flex items-center gap-3 flex-wrap">
              <h1 className="text-3xl font-dm font-bold">{stock.symbol}</h1>
              <Badge className={`${getSignalColor(stock.signal)} border text-sm font-semibold`}>
                {stock.signal.replace('_', ' ')}
              </Badge>
              <Badge className={getRiskColor(stock.risk_level) + " text-xs"}>{stock.risk_level} Risk</Badge>
              <Badge variant="outline">{stock.sector}</Badge>
              <Badge variant="outline">{stock.market_cap}</Badge>
            </div>
            <p className="text-muted-foreground mt-1">{stock.name}</p>
            <p className="text-4xl font-dm font-bold mt-3">{formatCurrency(stock.current_price)}</p>
            <div className="flex gap-4 text-sm text-muted-foreground mt-2">
              <span>52W High: ₹{formatNumber(stock.week_52_high)}</span>
              <span>52W Low: ₹{formatNumber(stock.week_52_low)}</span>
              <span>PE: {stock.pe_ratio}</span>
              <span>Div Yield: {stock.dividend_yield}%</span>
            </div>
          </div>

          <div className="flex gap-2">
            <Button variant="outline" onClick={() => watchlistMutation.mutate()}>
              <Star className="w-4 h-4 mr-2" /> Watchlist
            </Button>
            <Dialog open={tradeDialog === 'BUY'} onOpenChange={(open) => setTradeDialog(open ? 'BUY' : null)}>
              <DialogTrigger asChild>
                <Button className="bg-emerald-600 hover:bg-emerald-700 text-white">
                  <ShoppingCart className="w-4 h-4 mr-2" /> Buy
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader><DialogTitle>Buy {stock.symbol}</DialogTitle></DialogHeader>
                <div className="space-y-4 mt-4">
                  <div className="flex justify-between text-sm"><span>Price</span><span className="font-bold">{formatCurrency(stock.current_price)}</span></div>
                  <div>
                    <label className="text-sm font-medium">Quantity</label>
                    <Input type="number" min={1} value={tradeQty} onChange={(e) => setTradeQty(Math.max(1, parseInt(e.target.value) || 1))} className="mt-1" />
                  </div>
                  <div className="p-3 rounded-lg bg-accent flex justify-between">
                    <span className="text-sm">Total Cost</span>
                    <span className="font-bold">{formatCurrency(stock.current_price * tradeQty)}</span>
                  </div>
                  <Button onClick={() => handleTrade('BUY')} disabled={tradeMutation.isPending} className="w-full bg-emerald-600 hover:bg-emerald-700">
                    {tradeMutation.isPending ? 'Processing...' : 'Confirm Buy'}
                  </Button>
                </div>
              </DialogContent>
            </Dialog>
            {myHolding.qty > 0 && (
              <Dialog open={tradeDialog === 'SELL'} onOpenChange={(open) => setTradeDialog(open ? 'SELL' : null)}>
                <DialogTrigger asChild>
                  <Button variant="outline" className="text-red-600 border-red-200 hover:bg-red-50">
                    <MinusCircle className="w-4 h-4 mr-2" /> Sell
                  </Button>
                </DialogTrigger>
                <DialogContent>
                  <DialogHeader><DialogTitle>Sell {stock.symbol}</DialogTitle></DialogHeader>
                  <div className="space-y-4 mt-4">
                    <div className="flex justify-between text-sm"><span>Holdings</span><span className="font-bold">{myHolding.qty} shares</span></div>
                    <div className="flex justify-between text-sm"><span>Price</span><span className="font-bold">{formatCurrency(stock.current_price)}</span></div>
                    <div>
                      <label className="text-sm font-medium">Quantity to Sell</label>
                      <Input type="number" min={1} max={myHolding.qty} value={tradeQty} onChange={(e) => setTradeQty(Math.max(1, Math.min(myHolding.qty, parseInt(e.target.value) || 1)))} className="mt-1" />
                    </div>
                    <div className="p-3 rounded-lg bg-accent flex justify-between">
                      <span className="text-sm">Sale Value</span>
                      <span className="font-bold">{formatCurrency(stock.current_price * tradeQty)}</span>
                    </div>
                    <Button onClick={() => handleTrade('SELL')} disabled={tradeMutation.isPending} variant="destructive" className="w-full">
                      {tradeMutation.isPending ? 'Processing...' : 'Confirm Sell'}
                    </Button>
                  </div>
                </DialogContent>
              </Dialog>
            )}
          </div>
        </div>
      </motion.div>

      {/* Holdings Card */}
      {myHolding.qty > 0 && (
        <Card className="bg-primary/5 border-primary/10">
          <CardContent className="p-4 flex flex-wrap gap-6">
            <div><p className="text-xs text-muted-foreground">Your Holdings</p><p className="font-bold">{myHolding.qty} shares</p></div>
            <div><p className="text-xs text-muted-foreground">Invested</p><p className="font-bold">{formatCurrency(myHolding.invested)}</p></div>
            <div><p className="text-xs text-muted-foreground">Current Value</p><p className="font-bold">{formatCurrency(stock.current_price * myHolding.qty)}</p></div>
            <div>
              <p className="text-xs text-muted-foreground">P&L</p>
              <p className={`font-bold ${currentPnL >= 0 ? 'text-emerald-600' : 'text-red-500'}`}>
                {currentPnL >= 0 ? '+' : ''}{formatCurrency(currentPnL)} ({currentPnL >= 0 ? '+' : ''}{pnlPct}%)
              </p>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <Card className="lg:col-span-2">
          <CardHeader><CardTitle className="text-base font-dm flex items-center gap-2"><BarChart3 className="w-4 h-4" /> Price Chart + Bollinger Bands + Moving Averages</CardTitle></CardHeader>
          <CardContent>
            <div className="h-72">
              <ResponsiveContainer width="100%" height="100%">
                <ComposedChart data={chartData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="hsl(140, 12%, 89%)" />
                  <XAxis dataKey="date" tick={{ fontSize: 10 }} />
                  <YAxis tick={{ fontSize: 10 }} domain={['auto', 'auto']} />
                  <Tooltip contentStyle={{ borderRadius: 12, fontSize: 12 }} />
                  <Area type="monotone" dataKey="bbUpper" stroke="transparent" fill="hsl(210, 60%, 50%)" fillOpacity={0.07} name="BB Upper" />
                  <Area type="monotone" dataKey="bbLower" stroke="transparent" fill="hsl(210, 60%, 50%)" fillOpacity={0.07} name="BB Lower" />
                  <Area type="monotone" dataKey="price" stroke="hsl(148, 58%, 28%)" fill="hsl(148, 58%, 28%)" fillOpacity={0.1} strokeWidth={2} name="Price" />
                  <Line type="monotone" dataKey="sma20" stroke="hsl(210, 60%, 50%)" strokeWidth={1.5} dot={false} name="SMA 5" />
                  <Line type="monotone" dataKey="sma50" stroke="hsl(0, 70%, 55%)" strokeWidth={1.5} dot={false} name="SMA 10" />
                  <Line type="monotone" dataKey="bbUpper" stroke="hsl(280, 40%, 55%)" strokeWidth={1} dot={false} strokeDasharray="4 2" name="BB Upper" />
                  <Line type="monotone" dataKey="bbLower" stroke="hsl(280, 40%, 55%)" strokeWidth={1} dot={false} strokeDasharray="4 2" name="BB Lower" />
                  <Bar dataKey="volume" fill="hsl(148, 58%, 28%)" fillOpacity={0.15} yAxisId="volume" name="Volume" />
                  <YAxis yAxisId="volume" orientation="right" hide />
                </ComposedChart>
              </ResponsiveContainer>
            </div>
            <div className="flex flex-wrap gap-4 text-[10px] mt-2">
              <span className="flex items-center gap-1"><span className="w-4 h-0.5 bg-primary inline-block" /> Price</span>
              <span className="flex items-center gap-1"><span className="w-4 h-0.5 bg-blue-500 inline-block" /> SMA 5</span>
              <span className="flex items-center gap-1"><span className="w-4 h-0.5 bg-red-500 inline-block" /> SMA 10</span>
              <span className="flex items-center gap-1"><span className="w-4 h-0.5 bg-purple-500 inline-block border-dashed" /> Bollinger Bands</span>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader><CardTitle className="text-base font-dm flex items-center gap-2"><Activity className="w-4 h-4" />RSI (14)</CardTitle></CardHeader>
          <CardContent>
            <div className="h-48">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={rsiData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="hsl(140, 12%, 89%)" />
                  <XAxis dataKey="date" tick={{ fontSize: 10 }} />
                  <YAxis tick={{ fontSize: 10 }} domain={[0, 100]} />
                  <Tooltip contentStyle={{ borderRadius: 12, fontSize: 12 }} formatter={(v) => [v.toFixed(1), 'RSI']} />
                  <ReferenceLine y={70} stroke="hsl(0,70%,55%)" strokeDasharray="4 2" label={{ value: '70', fontSize: 9 }} />
                  <ReferenceLine y={30} stroke="hsl(148,58%,28%)" strokeDasharray="4 2" label={{ value: '30', fontSize: 9 }} />
                  <Line type="monotone" dataKey="rsi" stroke="hsl(280, 50%, 55%)" strokeWidth={2} dot={false} />
                </LineChart>
              </ResponsiveContainer>
            </div>
            <div className="flex justify-between text-xs text-muted-foreground mt-2">
              <span className="text-emerald-600">Oversold &lt;30</span>
              <span>Current: {rsi[rsi.length - 1]?.value?.toFixed(1)}</span>
              <span className="text-red-500">Overbought &gt;70</span>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* MACD Chart */}
      {macdData.length > 0 && (
        <Card>
          <CardHeader><CardTitle className="text-base font-dm flex items-center gap-2"><BarChart3 className="w-4 h-4" /> MACD (12, 26, 9) — Trend Confirmation</CardTitle></CardHeader>
          <CardContent>
            <div className="h-48">
              <ResponsiveContainer width="100%" height="100%">
                <ComposedChart data={macdData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="hsl(140, 12%, 89%)" />
                  <XAxis dataKey="date" tick={{ fontSize: 10 }} />
                  <YAxis tick={{ fontSize: 10 }} />
                  <Tooltip contentStyle={{ borderRadius: 12, fontSize: 12 }} />
                  <ReferenceLine y={0} stroke="hsl(140, 12%, 60%)" />
                  <Bar dataKey="histogram" fill="hsl(148, 58%, 28%)" fillOpacity={0.6} name="Histogram" />
                  <Line type="monotone" dataKey="macd" stroke="hsl(210, 60%, 50%)" strokeWidth={2} dot={false} name="MACD" />
                  <Line type="monotone" dataKey="signal" stroke="hsl(0, 70%, 55%)" strokeWidth={2} dot={false} name="Signal" />
                </ComposedChart>
              </ResponsiveContainer>
            </div>
            <div className="flex flex-wrap gap-4 text-[10px] mt-2">
              <span className="flex items-center gap-1"><span className="w-4 h-0.5 bg-blue-500 inline-block" /> MACD Line</span>
              <span className="flex items-center gap-1"><span className="w-4 h-0.5 bg-red-500 inline-block" /> Signal Line</span>
              <span className="flex items-center gap-1"><span className="w-3 h-3 bg-primary/50 rounded-sm inline-block" /> Histogram</span>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Signal Analysis */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base font-dm flex items-center gap-2">
            <Info className="w-4 h-4" /> AI Signal Analysis
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="p-5 rounded-xl bg-accent border border-primary/10">
            <div className="flex items-center gap-2 mb-3">
              <Badge className={`${getSignalColor(stock.signal)} border text-sm font-semibold`}>
                {stock.signal.replace('_', ' ')}
              </Badge>
              <span className="text-sm text-muted-foreground">Signal generated from OHLCV technical analysis</span>
            </div>
            <p className="text-sm leading-relaxed">{stock.signal_reasoning}</p>
          </div>
          <p className="text-xs text-muted-foreground mt-3">{stock.description}</p>
        </CardContent>
      </Card>
    </div>
  );
}
