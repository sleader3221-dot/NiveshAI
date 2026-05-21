import { db } from '@/lib/dbClient';

import React, { useState, useMemo, useCallback } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';

import { useAuth } from '@/lib/AuthContext';
import { STOCK_SEED_DATA } from '@/lib/stockData';
import {
  runSignalConfirmation,
  multiTimeframeConfluence,
  generateSignalReasoning,
  kellyPositionSize,
  MarketState,
  MarketRegime,
  Signal,
} from '@/lib/tradingEngine';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import BotSignalCard from '@/components/bot/BotSignalCard';
import BotScannerTable from '@/components/bot/BotScannerTable';
import BotIndicatorPanel from '@/components/bot/BotIndicatorPanel';
import BotRiskPanel from '@/components/bot/BotRiskPanel';
import BotMarketStateCard from '@/components/bot/BotMarketStateCard';
import { motion } from 'framer-motion';
import {
  Bot, Play, Square, RefreshCw, TrendingUp, TrendingDown, Activity,
  Shield, Target, Zap, BarChart2, AlertTriangle
} from 'lucide-react';

const SCAN_TIERS = {
  TIER1: ['HDFCBANK', 'RELIANCE', 'TCS', 'INFY', 'ICICIBANK', 'SBIN', 'BAJFINANCE', 'HCLTECH', 'ITC', 'BHARTIARTL'],
  TIER2: ['TATAMOTORS', 'SUNPHARMA', 'MARUTI', 'WIPRO', 'TATASTEEL', 'ADANIENT', 'LTIM', 'NESTLEIND', 'POWERGRID', 'ZOMATO'],
};

export default function TradingBot() {
  const { user } = useAuth();
  const [isRunning, setIsRunning] = useState(false);
  const [selectedSymbol, setSelectedSymbol] = useState(null);
  const [scanProgress, setScanProgress] = useState(0);
  const [activeTab, setActiveTab] = useState('scanner');

  const { data: dbStocks } = useQuery({ queryKey: ['stocks'], queryFn: () => db.entities.Stock.list() });
  const { data: profile } = useQuery({
    queryKey: ['financial-profile', user?.email],
    queryFn: () => db.entities.FinancialProfile.filter({ created_by: user?.email }),
    enabled: !!user?.email,
    select: data => data?.[0],
  });
  const { data: trades } = useQuery({
    queryKey: ['trades', user?.email],
    queryFn: () => db.entities.Trade.filter({ created_by: user?.email }),
    enabled: !!user?.email,
  });

  const stocks = useMemo(() => dbStocks?.length > 0 ? dbStocks : STOCK_SEED_DATA, [dbStocks]);

  // Run full scan analysis on all stocks
  const scanResults = useMemo(() => {
    const profileRiskKey = profile?.risk_appetite || 'moderate';
    const experienceFactor = profile?.investment_experience === 'beginner' ? 0.45 : profile?.investment_experience === 'intermediate' ? 0.65 : 0.9;
    const riskFactor = profileRiskKey === 'conservative' ? 0.85 : profileRiskKey === 'aggressive' ? 1.1 : 1.0;

    return stocks.map(stock => {
      const ohlcv = stock.ohlcv_data || [];
      const analysis = runSignalConfirmation(ohlcv);
      const mtf = multiTimeframeConfluence(ohlcv);
      const reasoning = generateSignalReasoning({ ...analysis, confluence: mtf.confluence });

      const capital = profile?.investable_amount || 50000;
      const adjustedCapital = Math.max(10000, capital * experienceFactor);
      const kellySize = kellyPositionSize(0.6, 0.08, 0.04, adjustedCapital) * riskFactor;
      const suggestedQty = stock.current_price > 0 ? Math.max(1, Math.floor(kellySize / stock.current_price)) : 1;
      const profileFit = stock[`suitability_${profileRiskKey}`] || 65;
      const adjustedProfitScore = Math.max(0, analysis.profitScore * (0.7 + (profileFit / 100) * 0.3));

      return {
        ...stock,
        analysis,
        mtf,
        reasoning,
        kellySize,
        suggestedQty,
        botSignal: analysis.signal,
        profitScore: analysis.profitScore,
        profileFit,
        adjustedProfitScore,
      };
    }).sort((a, b) => b.adjustedProfitScore - a.adjustedProfitScore);
  }, [stocks, profile]);

  const selectedStock = useMemo(
    () => scanResults.find(s => s.symbol === selectedSymbol) || scanResults[0],
    [scanResults, selectedSymbol]
  );

  // Aggregate market stats
  const marketStats = useMemo(() => {
    const strongBuy = scanResults.filter(s => s.botSignal === Signal.STRONG_BUY).length;
    const buy = scanResults.filter(s => s.botSignal === Signal.BUY).length;
    const hold = scanResults.filter(s => s.botSignal === Signal.HOLD).length;
    const sell = scanResults.filter(s => s.botSignal === Signal.SELL).length;
    const strongSell = scanResults.filter(s => s.botSignal === Signal.STRONG_SELL).length;
    const bullish = strongBuy + buy;
    const bearish = sell + strongSell;
    const sentiment = bullish > bearish + 3 ? 'BULLISH' : bearish > bullish + 3 ? 'BEARISH' : 'NEUTRAL';
    const topPicks = scanResults.filter(s => [Signal.STRONG_BUY, Signal.BUY].includes(s.botSignal)).slice(0, 5);
    return { strongBuy, buy, hold, sell, strongSell, bullish, bearish, sentiment, topPicks };
  }, [scanResults]);

  // Portfolio context
  const queryClient = useQueryClient();
  const tradeMutation = useMutation({
    mutationFn: (data) => db.entities.Trade.create(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['trades', user?.email] });
      toast.success('Virtual trade executed successfully!');
    },
    onError: (err) => {
      console.error('Trading bot trade error:', err);
      toast.error('Failed to execute trade');
    },
  });

  const holdingsMap = useMemo(() => {
    const map = {};
    (trades || []).forEach(t => {
      if (!map[t.stock_symbol]) map[t.stock_symbol] = { qty: 0, invested: 0 };
      if (t.trade_type === 'BUY') { map[t.stock_symbol].qty += t.quantity; map[t.stock_symbol].invested += t.total_value; }
      else { map[t.stock_symbol].qty -= t.quantity; }
    });
    return map;
  }, [trades]);

  const heldQty = selectedStock ? holdingsMap[selectedStock.symbol]?.qty || 0 : 0;
  const recommendedAction = selectedStock
    ? ([Signal.STRONG_BUY, Signal.BUY].includes(selectedStock.botSignal) ? 'BUY'
      : ([Signal.STRONG_SELL, Signal.SELL].includes(selectedStock.botSignal) ? 'SELL' : 'HOLD'))
    : 'HOLD';
  const recommendedQty = recommendedAction === 'BUY'
    ? selectedStock?.suggestedQty || 1
    : recommendedAction === 'SELL'
      ? Math.min(heldQty, selectedStock?.suggestedQty || 1)
      : 0;

  const handleBotTrade = (tradeType) => {
    if (!selectedStock || !user?.email) {
      toast.error('Please log in to execute trades');
      return;
    }

    const qty = tradeType === 'SELL'
      ? Math.max(1, Math.min(heldQty, selectedStock.suggestedQty || 1))
      : Math.max(1, selectedStock.suggestedQty || 1);

    if (tradeType === 'SELL' && heldQty === 0) {
      toast.error('No holdings available to sell');
      return;
    }

    tradeMutation.mutate({
      stock_symbol: selectedStock.symbol,
      stock_name: selectedStock.name,
      trade_type: tradeType,
      quantity: qty,
      price: selectedStock.current_price,
      total_value: +(selectedStock.current_price * qty).toFixed(2),
      sector: selectedStock.sector,
      trade_date: new Date().toISOString().split('T')[0],
      created_by: user?.email,
    });
  };

  const handleRecommendedTrade = () => {
    if (recommendedAction === 'HOLD') {
      toast('No strong action recommended for this stock right now.');
      return;
    }
    handleBotTrade(recommendedAction);
  };

  const handleScan = useCallback(() => {
    setIsRunning(true);
    setScanProgress(0);
    let progress = 0;
    const interval = setInterval(() => {
      progress += 5;
      setScanProgress(progress);
      if (progress >= 100) {
        clearInterval(interval);
        setIsRunning(false);
      }
    }, 80);
  }, []);

  const sentimentColor = {
    BULLISH: 'text-emerald-600 bg-emerald-50 border-emerald-200',
    BEARISH: 'text-red-600 bg-red-50 border-red-200',
    NEUTRAL: 'text-amber-600 bg-amber-50 border-amber-200',
  }[marketStats.sentiment];

  return (
    <div className="p-4 lg:p-6 space-y-6 max-w-[1600px] mx-auto">
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center">
            <Bot className="w-5 h-5 text-primary" />
          </div>
          <div>
            <h1 className="text-2xl font-dm font-bold">Elite Trading Bot</h1>
            <p className="text-sm text-muted-foreground">8-Signal Confirmation · 14 AI Models · Multi-Timeframe · Kelly Sizing</p>
          </div>
        </div>
        <div className="flex items-center gap-3">
          <Badge variant="outline" className={`text-xs px-3 py-1 border ${sentimentColor}`}>
            Market: {marketStats.sentiment}
          </Badge>
          <Button
            onClick={handleScan}
            disabled={isRunning}
            className="gap-2"
            size="sm"
          >
            {isRunning ? (
              <><RefreshCw className="w-4 h-4 animate-spin" />Scanning...</>
            ) : (
              <><Play className="w-4 h-4" />Run Full Scan</>
            )}
          </Button>
        </div>
      </div>

      {/* Scan Progress */}
      {isRunning && (
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-1">
          <div className="flex justify-between text-xs text-muted-foreground">
            <span>Scanning {stocks.length} stocks · 8-signal confirmation · Multi-timeframe analysis</span>
            <span>{scanProgress}%</span>
          </div>
          <Progress value={scanProgress} className="h-2" />
        </motion.div>
      )}

      {/* Market Overview Strip */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
        {[
          { label: 'Strong Buy', value: marketStats.strongBuy, color: 'text-emerald-600', bg: 'bg-emerald-50' },
          { label: 'Buy', value: marketStats.buy, color: 'text-green-600', bg: 'bg-green-50' },
          { label: 'Hold', value: marketStats.hold, color: 'text-amber-600', bg: 'bg-amber-50' },
          { label: 'Sell', value: marketStats.sell, color: 'text-orange-600', bg: 'bg-orange-50' },
          { label: 'Strong Sell', value: marketStats.strongSell, color: 'text-red-600', bg: 'bg-red-50' },
          { label: 'Top Picks', value: marketStats.topPicks.length, color: 'text-primary', bg: 'bg-primary/10' },
        ].map(stat => (
          <Card key={stat.label} className={`${stat.bg} border-0`}>
            <CardContent className="p-3 text-center">
              <div className={`text-2xl font-bold ${stat.color}`}>{stat.value}</div>
              <div className="text-xs text-muted-foreground mt-0.5">{stat.label}</div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Main Content */}
      <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
        {/* Left: Scanner + Tabs */}
        <div className="xl:col-span-2 space-y-4">
          <Tabs value={activeTab} onValueChange={setActiveTab}>
            <TabsList className="w-full grid grid-cols-3">
              <TabsTrigger value="scanner" className="gap-1.5 text-xs"><BarChart2 className="w-3.5 h-3.5" />Scanner</TabsTrigger>
              <TabsTrigger value="signals" className="gap-1.5 text-xs"><Zap className="w-3.5 h-3.5" />Top Signals</TabsTrigger>
              <TabsTrigger value="risk" className="gap-1.5 text-xs"><Shield className="w-3.5 h-3.5" />Risk Manager</TabsTrigger>
            </TabsList>

            <TabsContent value="scanner" className="mt-4">
              <BotScannerTable
                scanResults={scanResults}
                selectedSymbol={selectedSymbol || scanResults[0]?.symbol}
                onSelect={setSelectedSymbol}
                holdingsMap={holdingsMap}
              />
            </TabsContent>

            <TabsContent value="signals" className="mt-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {scanResults.filter(s => [Signal.STRONG_BUY, Signal.BUY].includes(s.botSignal)).slice(0, 6).map(stock => (
                  <BotSignalCard
                    key={stock.symbol}
                    stock={stock}
                    onClick={() => { setSelectedSymbol(stock.symbol); setActiveTab('scanner'); }}
                  />
                ))}
              </div>
            </TabsContent>

            <TabsContent value="risk" className="mt-4">
              <BotRiskPanel
                scanResults={scanResults}
                trades={trades || []}
                stocks={stocks}
                profile={profile}
                holdingsMap={holdingsMap}
              />
            </TabsContent>
          </Tabs>
        </div>

        {/* Right: Detail Panel */}
        <div className="space-y-4">
          <BotMarketStateCard stock={selectedStock} />
          {selectedStock && (
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm">Quick Trade</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="flex items-center justify-between gap-3">
                  <p className="text-sm text-muted-foreground">
                    Execute the bot's recommended action for {selectedStock.symbol} at the latest virtual price.
                  </p>
                  <Badge variant="secondary" className="text-xs px-2 py-1 uppercase">
                    {recommendedAction}
                  </Badge>
                </div>
                <div className="text-xs text-muted-foreground">
                  Profile fit: {selectedStock.profileFit?.toFixed(0)}% · Suggested position aligned with {profile?.investment_experience || 'beginner'} experience.
                </div>
                <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
                  <Button
                    onClick={handleRecommendedTrade}
                    disabled={tradeMutation.isPending || recommendedAction === 'HOLD' || (recommendedAction === 'SELL' && heldQty === 0)}
                    className="bg-primary hover:bg-primary/90"
                  >
                    Execute {recommendedAction === 'HOLD' ? 'No Action' : `${recommendedAction} ${recommendedQty || ''}`}
                  </Button>
                  <Button
                    variant="outline"
                    onClick={() => handleBotTrade('SELL')}
                    disabled={tradeMutation.isPending || heldQty === 0}
                  >
                    Sell {heldQty || 0}
                  </Button>
                </div>
                <div className="text-xs text-muted-foreground">
                  Current price: ₹{selectedStock.current_price.toLocaleString('en-IN')}, Suggested size: {selectedStock.suggestedQty || 1} shares.
                </div>
              </CardContent>
            </Card>
          )}
          {selectedStock && (
            <BotIndicatorPanel stock={selectedStock} />
          )}
        </div>
      </div>
    </div>
  );
}
