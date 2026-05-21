import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { motion } from 'framer-motion';
import { Shield, TrendingUp, PieChart, AlertTriangle, CheckCircle, Info } from 'lucide-react';
import { formatCurrency } from '@/lib/stockData';

function computeHealthScore(holdings, stocks, profile) {
  let score = 0;
  let breakdown = [];

  // 1. Diversification (max 30pts)
  const sectors = [...new Set(holdings.map(h => h.sector).filter(Boolean))];
  const divScore = Math.min(30, sectors.length * 6);
  breakdown.push({ label: 'Diversification', score: divScore, max: 30, detail: `${sectors.length} sectors` });
  score += divScore;

  // 2. Risk Alignment (max 25pts)
  const riskAppetite = profile?.risk_appetite || 'moderate';
  const riskKey = `suitability_${riskAppetite}`;
  const avgSuitability = holdings.length > 0
    ? holdings.reduce((sum, h) => {
        const stock = stocks.find(s => s.symbol === h.symbol);
        return sum + (stock?.[riskKey] || 50);
      }, 0) / holdings.length
    : 0;
  const riskScore = Math.round((avgSuitability / 100) * 25);
  breakdown.push({ label: 'Risk Alignment', score: riskScore, max: 25, detail: `${Math.round(avgSuitability)}% avg suitability` });
  score += riskScore;

  // 3. P&L Performance (max 25pts)
  const totalPnL = holdings.reduce((sum, h) => sum + h.pnl, 0);
  const totalInvested = holdings.reduce((sum, h) => sum + h.invested, 0);
  const pnlPct = totalInvested > 0 ? (totalPnL / totalInvested) * 100 : 0;
  const perfScore = Math.min(25, Math.max(0, 12 + pnlPct * 1.5));
  breakdown.push({ label: 'Performance', score: Math.round(perfScore), max: 25, detail: `${pnlPct >= 0 ? '+' : ''}${pnlPct.toFixed(1)}% overall return` });
  score += Math.round(perfScore);

  // 4. Signal Quality (max 20pts)
  const goodSignals = holdings.filter(h => {
    const stock = stocks.find(s => s.symbol === h.symbol);
    return stock?.signal === 'BUY' || stock?.signal === 'STRONG_BUY';
  }).length;
  const sigScore = holdings.length > 0 ? Math.round((goodSignals / holdings.length) * 20) : 0;
  breakdown.push({ label: 'Signal Quality', score: sigScore, max: 20, detail: `${goodSignals}/${holdings.length} buy signals` });
  score += sigScore;

  const grade = score >= 80 ? 'Excellent' : score >= 65 ? 'Good' : score >= 50 ? 'Fair' : 'Needs Work';
  const gradeColor = score >= 80 ? 'text-emerald-600' : score >= 65 ? 'text-blue-600' : score >= 50 ? 'text-amber-600' : 'text-red-500';

  return { score: Math.min(100, score), grade, gradeColor, breakdown };
}

export default function PortfolioHealthScore({ holdings, stocks, profile }) {
  const [expanded, setExpanded] = useState(false);

  if (!holdings || holdings.length === 0) return null;

  const { score, grade, gradeColor, breakdown } = computeHealthScore(holdings, stocks, profile);

  const circumference = 2 * Math.PI * 45;
  const strokeDashoffset = circumference - (score / 100) * circumference;

  return (
    <Card>
      <CardHeader className="pb-2">
        <CardTitle className="text-base font-dm flex items-center gap-2">
          <Shield className="w-4 h-4 text-primary" />
          AI Portfolio Health Score
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="flex items-center gap-6">
          {/* Circular progress */}
          <div className="relative flex-shrink-0">
            <svg width="110" height="110" viewBox="0 0 110 110">
              <circle cx="55" cy="55" r="45" fill="none" stroke="hsl(140, 12%, 89%)" strokeWidth="8" />
              <circle
                cx="55" cy="55" r="45"
                fill="none"
                stroke={score >= 80 ? '#059669' : score >= 65 ? '#2563eb' : score >= 50 ? '#d97706' : '#dc2626'}
                strokeWidth="8"
                strokeLinecap="round"
                strokeDasharray={circumference}
                strokeDashoffset={strokeDashoffset}
                transform="rotate(-90 55 55)"
                style={{ transition: 'stroke-dashoffset 1s ease' }}
              />
              <text x="55" y="52" textAnchor="middle" fontSize="20" fontWeight="bold" fill="currentColor" className="font-dm">
                {score}
              </text>
              <text x="55" y="68" textAnchor="middle" fontSize="9" fill="#6b7280">/ 100</text>
            </svg>
          </div>
          <div className="flex-1">
            <div className="flex items-center gap-2 mb-1">
              <span className={`text-2xl font-dm font-bold ${gradeColor}`}>{grade}</span>
              <Badge variant="outline" className="text-xs">{profile?.risk_appetite || 'moderate'} profile</Badge>
            </div>
            <p className="text-sm text-muted-foreground mb-3">Based on diversification, risk alignment, performance & signal quality</p>
            <button
              onClick={() => setExpanded(!expanded)}
              className="text-xs text-primary hover:underline flex items-center gap-1"
            >
              <Info className="w-3 h-3" />
              {expanded ? 'Hide' : 'Show'} breakdown
            </button>
          </div>
        </div>

        {expanded && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            className="mt-4 space-y-3"
          >
            {breakdown.map(b => (
              <div key={b.label}>
                <div className="flex justify-between text-xs mb-1">
                  <span className="font-medium">{b.label}</span>
                  <span className="text-muted-foreground">{b.score}/{b.max} — {b.detail}</span>
                </div>
                <Progress value={(b.score / b.max) * 100} className="h-2" />
              </div>
            ))}
          </motion.div>
        )}
      </CardContent>
    </Card>
  );
}