import { db } from '@/lib/dbClient';

import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';

import { useQuery } from '@tanstack/react-query';
import { useAuth } from '@/lib/AuthContext';
import { STOCK_SEED_DATA, getSignalColor, getRiskColor, formatCurrency } from '@/lib/stockData';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Zap, ShieldCheck, Target, TrendingUp, IndianRupee, Info, Sparkles, Brain } from 'lucide-react';
import { motion } from 'framer-motion';
import InvestmentProjection from '@/components/dashboard/InvestmentProjection';

export default function Recommendations() {
  const { user } = useAuth();
  const [stocks, setStocks] = useState([]);

  const { data: dbStocks } = useQuery({
    queryKey: ['stocks'],
    queryFn: () => db.entities.Stock.list(),
  });

  const { data: profiles } = useQuery({
    queryKey: ['financial-profile'],
    queryFn: () => db.entities.FinancialProfile.filter({ created_by: user?.email }),
    enabled: !!user?.email,
  });

  useEffect(() => {
    setStocks(dbStocks?.length > 0 ? dbStocks : STOCK_SEED_DATA);
  }, [dbStocks]);

  const profile = profiles?.[0];
  const riskKey = profile?.risk_appetite || 'moderate';
  const suitabilityField = `suitability_${riskKey}`;
  const investableAmount = profile?.investable_amount || 50000;

  // Rank stocks by suitability + signal strength
  const signalScore = { STRONG_BUY: 50, BUY: 40, HOLD: 20, SELL: 5, STRONG_SELL: 0 };
  
  const ranked = stocks
    .map(s => {
      const suitability = s[suitabilityField] || 50;
      const signal = signalScore[s.signal] || 20;
      const totalScore = suitability * 0.6 + signal * 0.4;
      const suggestedAllocation = Math.round(investableAmount * (totalScore / 100) * 0.15);
      const suggestedQty = Math.max(1, Math.floor(suggestedAllocation / s.current_price));
      return { ...s, suitability, totalScore: +totalScore.toFixed(0), suggestedAllocation, suggestedQty };
    })
    .sort((a, b) => b.totalScore - a.totalScore);

  const topPicks = ranked.filter(s => s.signal === 'BUY' || s.signal === 'STRONG_BUY').slice(0, 8);
  const holdStocks = ranked.filter(s => s.signal === 'HOLD').slice(0, 4);
  const avoidStocks = ranked.filter(s => s.signal === 'SELL' || s.signal === 'STRONG_SELL');

  return (
    <div className="p-6 lg:p-8 max-w-[1400px] mx-auto space-y-6">
      <div>
        <h1 className="text-2xl lg:text-3xl font-dm font-bold flex items-center gap-2">
          <Sparkles className="w-7 h-7 text-primary" /> AI Recommendations
        </h1>
        <p className="text-muted-foreground mt-1">Personalized stock picks based on your risk profile and AI analysis</p>
      </div>

      {/* Profile Summary */}
      {profile && (
        <Card className="bg-primary/5 border-primary/10">
          <CardContent className="p-5 flex flex-wrap gap-6 items-center">
            <div className="flex items-center gap-2">
              <ShieldCheck className="w-5 h-5 text-primary" />
              <span className="text-sm">
                <span className="text-muted-foreground">Risk Profile: </span>
                <span className="font-semibold capitalize">{profile.risk_appetite}</span>
              </span>
            </div>
            <div className="flex items-center gap-2">
              <Target className="w-5 h-5 text-primary" />
              <span className="text-sm">
                <span className="text-muted-foreground">Goal: </span>
                <span className="font-semibold capitalize">{profile.investment_goal?.replace('_', ' ')}</span>
              </span>
            </div>
            <div className="flex items-center gap-2">
              <IndianRupee className="w-5 h-5 text-primary" />
              <span className="text-sm">
                <span className="text-muted-foreground">Investable: </span>
                <span className="font-semibold">{formatCurrency(investableAmount)}</span>
              </span>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Top Picks */}
      <div>
        <h2 className="text-lg font-dm font-bold mb-4 flex items-center gap-2">
          <TrendingUp className="w-5 h-5 text-emerald-600" /> Top Picks for You
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {topPicks.map((stock, i) => (
            <motion.div key={stock.symbol} initial={{ opacity: 0, y: 15 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.05 }}>
              <Link to={`/stock/${stock.symbol}`}>
                <Card className="hover:shadow-lg hover:border-primary/20 transition-all group">
                  <CardContent className="p-5">
                    <div className="flex items-start justify-between">
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="font-dm font-bold text-lg">{stock.symbol}</span>
                          <Badge className={`${getSignalColor(stock.signal)} border text-[10px]`}>{stock.signal.replace('_',' ')}</Badge>
                        </div>
                        <p className="text-xs text-muted-foreground mt-0.5">{stock.name}</p>
                      </div>
                      <div className="text-right">
                        <p className="text-lg font-dm font-bold">{formatCurrency(stock.current_price)}</p>
                        <Badge variant="outline" className="text-[10px]">{stock.sector}</Badge>
                      </div>
                    </div>

                    <div className="mt-4 space-y-3">
                      <div>
                        <div className="flex justify-between text-xs mb-1">
                          <span className="text-muted-foreground">Suitability for your profile</span>
                          <span className="font-semibold text-primary">{stock.suitability}%</span>
                        </div>
                        <Progress value={stock.suitability} className="h-2" />
                      </div>
                      
                      <div className="flex justify-between items-center p-3 rounded-lg bg-accent">
                        <div>
                          <p className="text-xs text-muted-foreground">Suggested Investment</p>
                          <p className="font-semibold text-sm">{formatCurrency(stock.suggestedAllocation)}</p>
                        </div>
                        <div className="text-right">
                          <p className="text-xs text-muted-foreground">Suggested Qty</p>
                          <p className="font-semibold text-sm">{stock.suggestedQty} shares</p>
                        </div>
                        <Badge className={getRiskColor(stock.risk_level) + " text-[10px]"}>{stock.risk_level} Risk</Badge>
                      </div>
                    </div>

                    <p className="text-xs text-muted-foreground mt-3 line-clamp-2 group-hover:text-foreground transition-colors">
                      {stock.signal_reasoning?.slice(0, 150)}...
                    </p>
                  </CardContent>
                </Card>
              </Link>
            </motion.div>
          ))}
        </div>
      </div>

      {/* Hold / Watch */}
      {holdStocks.length > 0 && (
        <div>
          <h2 className="text-lg font-dm font-bold mb-4 flex items-center gap-2">
            <Info className="w-5 h-5 text-amber-600" /> Watch & Wait
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-3">
            {holdStocks.map(stock => (
              <Link key={stock.symbol} to={`/stock/${stock.symbol}`}>
                <Card className="hover:shadow-md transition-all p-4">
                  <div className="flex items-center justify-between">
                    <span className="font-dm font-bold">{stock.symbol}</span>
                    <Badge className={`${getSignalColor(stock.signal)} border text-[10px]`}>HOLD</Badge>
                  </div>
                  <p className="text-xs text-muted-foreground mt-1">{stock.name}</p>
                  <p className="font-bold mt-2">{formatCurrency(stock.current_price)}</p>
                  <div className="flex justify-between text-xs mt-2">
                    <span className="text-muted-foreground">Suitability</span>
                    <span className="font-medium">{stock.suitability}%</span>
                  </div>
                </Card>
              </Link>
            ))}
          </div>
        </div>
      )}

      {/* Investment Projector */}
      <InvestmentProjection profile={profile} />

      {/* Avoid */}
      {avoidStocks.length > 0 && (
        <div>
          <h2 className="text-lg font-dm font-bold mb-4 flex items-center gap-2 text-red-500">
            ⚠️ Consider Avoiding
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-3">
            {avoidStocks.map(stock => (
              <Link key={stock.symbol} to={`/stock/${stock.symbol}`}>
                <Card className="hover:shadow-md transition-all p-4 border-red-100">
                  <div className="flex items-center justify-between">
                    <span className="font-dm font-bold">{stock.symbol}</span>
                    <Badge className={`${getSignalColor(stock.signal)} border text-[10px]`}>{stock.signal.replace('_',' ')}</Badge>
                  </div>
                  <p className="text-xs text-muted-foreground mt-1">{stock.name}</p>
                  <p className="font-bold mt-2">{formatCurrency(stock.current_price)}</p>
                  <p className="text-xs text-red-500 mt-2 line-clamp-2">{stock.signal_reasoning?.slice(0, 100)}</p>
                </Card>
              </Link>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
