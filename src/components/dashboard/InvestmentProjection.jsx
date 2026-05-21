import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Slider } from "@/components/ui/slider";
import { motion } from 'framer-motion';
import { TrendingUp, IndianRupee, Calculator } from 'lucide-react';
import { AreaChart, Area, XAxis, YAxis, Tooltip, ResponsiveContainer } from 'recharts';
import { formatCurrency } from '@/lib/stockData';

const MARKET_CAGR = 0.127; // 12.7% historical Nifty CAGR
const INFLATION = 0.065; // 6.5% inflation

function computeProjection(monthlyAmount, years) {
  const monthlyRate = MARKET_CAGR / 12;
  const data = [];
  for (let y = 1; y <= years; y++) {
    const months = y * 12;
    const invested = monthlyAmount * months;
    const futureValue = monthlyAmount * ((Math.pow(1 + monthlyRate, months) - 1) / monthlyRate) * (1 + monthlyRate);
    const inflationAdjusted = futureValue / Math.pow(1 + INFLATION, y);
    data.push({
      year: `Yr ${y}`,
      invested: Math.round(invested),
      futureValue: Math.round(futureValue),
      realValue: Math.round(inflationAdjusted),
    });
  }
  return data;
}

export default function InvestmentProjection({ profile }) {
  const defaultAmount = profile?.investable_amount 
    ? Math.round(profile.investable_amount * 0.4) 
    : 10000;
  const [monthlyAmount, setMonthlyAmount] = useState(defaultAmount);
  const [years, setYears] = useState(5);

  const data = computeProjection(monthlyAmount, years);
  const finalRow = data[data.length - 1];
  const totalInvested = finalRow?.invested || 0;
  const futureValue = finalRow?.futureValue || 0;
  const wealthCreated = futureValue - totalInvested;

  return (
    <Card>
      <CardHeader className="pb-2">
        <CardTitle className="text-base font-dm flex items-center gap-2">
          <Calculator className="w-4 h-4 text-primary" />
          Smart Investment Projector
          <span className="text-[10px] text-muted-foreground font-normal ml-1">50/30/20 Rule</span>
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Controls */}
          <div className="space-y-5">
            <div>
              <div className="flex justify-between text-sm mb-2">
                <span className="font-medium">Monthly SIP</span>
                <span className="font-dm font-bold text-primary">{formatCurrency(monthlyAmount)}</span>
              </div>
              <Slider
                min={500}
                max={100000}
                step={500}
                value={[monthlyAmount]}
                onValueChange={([v]) => setMonthlyAmount(v)}
              />
              <div className="flex justify-between text-[10px] text-muted-foreground mt-1">
                <span>₹500</span><span>₹1L</span>
              </div>
            </div>

            <div>
              <div className="flex justify-between text-sm mb-2">
                <span className="font-medium">Investment Horizon</span>
                <span className="font-dm font-bold text-primary">{years} Years</span>
              </div>
              <Slider
                min={1}
                max={20}
                step={1}
                value={[years]}
                onValueChange={([v]) => setYears(v)}
              />
              <div className="flex justify-between text-[10px] text-muted-foreground mt-1">
                <span>1 yr</span><span>20 yrs</span>
              </div>
            </div>

            {/* Result cards */}
            <div className="grid grid-cols-2 gap-3">
              <div className="p-3 rounded-xl bg-muted/50 border border-border">
                <p className="text-[10px] text-muted-foreground uppercase tracking-wide">Total Invested</p>
                <p className="font-dm font-bold text-sm mt-0.5">{formatCurrency(totalInvested)}</p>
              </div>
              <div className="p-3 rounded-xl bg-emerald-50 border border-emerald-200">
                <p className="text-[10px] text-emerald-700 uppercase tracking-wide">Future Value</p>
                <p className="font-dm font-bold text-sm mt-0.5 text-emerald-700">{formatCurrency(futureValue)}</p>
              </div>
              <div className="col-span-2 p-3 rounded-xl bg-primary/5 border border-primary/10">
                <p className="text-[10px] text-muted-foreground uppercase tracking-wide">Wealth Created (at {(MARKET_CAGR * 100).toFixed(1)}% CAGR)</p>
                <p className="font-dm font-bold text-base mt-0.5 text-primary">+{formatCurrency(wealthCreated)}</p>
              </div>
            </div>
            <p className="text-[10px] text-muted-foreground">
              Based on historical Nifty 50 CAGR of 12.7%. Past performance doesn't guarantee future returns. Inflation at 6.5%.
            </p>
          </div>

          {/* Chart */}
          <div className="h-60">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={data}>
                <defs>
                  <linearGradient id="futureGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="hsl(148,58%,28%)" stopOpacity={0.3} />
                    <stop offset="95%" stopColor="hsl(148,58%,28%)" stopOpacity={0} />
                  </linearGradient>
                  <linearGradient id="investedGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="hsl(210,60%,50%)" stopOpacity={0.2} />
                    <stop offset="95%" stopColor="hsl(210,60%,50%)" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <XAxis dataKey="year" tick={{ fontSize: 10 }} />
                <YAxis tick={{ fontSize: 10 }} tickFormatter={v => `₹${(v/100000).toFixed(0)}L`} />
                <Tooltip
                  contentStyle={{ borderRadius: 12, fontSize: 11 }}
                  formatter={(v, name) => [formatCurrency(v), name === 'futureValue' ? 'Future Value' : 'Invested']}
                />
                <Area type="monotone" dataKey="invested" stroke="hsl(210,60%,50%)" fill="url(#investedGrad)" strokeWidth={1.5} name="invested" />
                <Area type="monotone" dataKey="futureValue" stroke="hsl(148,58%,28%)" fill="url(#futureGrad)" strokeWidth={2} name="futureValue" />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}