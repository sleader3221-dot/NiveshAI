import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Brain, TrendingUp, TrendingDown, AlertTriangle, CheckCircle, Zap } from 'lucide-react';
import { motion } from 'framer-motion';
import { Link } from 'react-router-dom';

function generateInsights(stocks, holdings, profile) {
  const insights = [];

  // Strong buy opportunities
  const strongBuys = stocks.filter(s => s.signal === 'STRONG_BUY').slice(0, 2);
  strongBuys.forEach(s => {
    insights.push({
      type: 'opportunity',
      icon: Zap,
      color: 'text-emerald-600 bg-emerald-50',
      title: `Strong Buy Signal: ${s.symbol}`,
      desc: s.signal_reasoning?.split('.')[0] + '.',
      link: `/stock/${s.symbol}`,
      badge: 'STRONG BUY',
      badgeColor: 'bg-emerald-100 text-emerald-700 border-emerald-200',
    });
  });

  // Sell warnings in portfolio
  const sellWarnings = holdings.filter(h => {
    const stock = stocks.find(s => s.symbol === h.symbol);
    return stock?.signal === 'SELL' || stock?.signal === 'STRONG_SELL';
  });
  sellWarnings.slice(0, 1).forEach(h => {
    const stock = stocks.find(s => s.symbol === h.symbol);
    insights.push({
      type: 'warning',
      icon: AlertTriangle,
      color: 'text-red-600 bg-red-50',
      title: `Review Position: ${h.symbol}`,
      desc: `You hold ${h.qty} shares. Current signal is ${stock?.signal?.replace('_', ' ')} — consider reviewing your position.`,
      link: `/stock/${h.symbol}`,
      badge: stock?.signal?.replace('_', ' '),
      badgeColor: 'bg-red-100 text-red-700 border-red-200',
    });
  });

  // Diversification tip
  const sectors = [...new Set(holdings.map(h => h.sector).filter(Boolean))];
  if (sectors.length < 3 && holdings.length > 0) {
    insights.push({
      type: 'tip',
      icon: Brain,
      color: 'text-blue-600 bg-blue-50',
      title: 'Diversification Opportunity',
      desc: `Your portfolio is in ${sectors.length} sector(s). Adding exposure to Pharma, FMCG, or Energy can reduce risk.`,
      link: '/stocks',
      badge: 'TIP',
      badgeColor: 'bg-blue-100 text-blue-700 border-blue-200',
    });
  }

  // Profile-based tip
  if (profile?.risk_appetite === 'conservative') {
    const highRisk = holdings.filter(h => {
      const stock = stocks.find(s => s.symbol === h.symbol);
      return stock?.risk_level === 'High';
    });
    if (highRisk.length > 0) {
      insights.push({
        type: 'warning',
        icon: AlertTriangle,
        color: 'text-amber-600 bg-amber-50',
        title: 'Risk Profile Mismatch',
        desc: `You have ${highRisk.length} high-risk stock(s) in your portfolio, but your profile is Conservative.`,
        link: '/portfolio',
        badge: 'RISK ALERT',
        badgeColor: 'bg-amber-100 text-amber-700 border-amber-200',
      });
    }
  }

  // Good diversification message
  if (sectors.length >= 4) {
    insights.push({
      type: 'positive',
      icon: CheckCircle,
      color: 'text-emerald-600 bg-emerald-50',
      title: 'Well Diversified Portfolio',
      desc: `You're spread across ${sectors.length} sectors: ${sectors.join(', ')}. Great risk management!`,
      link: '/portfolio',
      badge: 'HEALTHY',
      badgeColor: 'bg-emerald-100 text-emerald-700 border-emerald-200',
    });
  }

  return insights.slice(0, 4);
}

export default function AIInsightFeed({ stocks, holdings, profile }) {
  const insights = generateInsights(stocks || [], holdings || [], profile);

  if (insights.length === 0) return null;

  return (
    <Card>
      <CardHeader className="pb-2">
        <CardTitle className="text-base font-dm flex items-center gap-2">
          <Brain className="w-4 h-4 text-primary" />
          AI Insights & Alerts
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        {insights.map((insight, i) => (
          <motion.div
            key={i}
            initial={{ opacity: 0, x: -10 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: i * 0.1 }}
          >
            <Link to={insight.link}>
              <div className="flex items-start gap-3 p-3 rounded-xl border border-border hover:border-primary/20 hover:bg-accent/40 transition-all group">
                <div className={`p-2 rounded-lg ${insight.color} flex-shrink-0`}>
                  <insight.icon className="w-4 h-4" />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <p className="text-sm font-semibold group-hover:text-primary transition-colors">{insight.title}</p>
                    <Badge className={`text-[10px] border ${insight.badgeColor}`}>{insight.badge}</Badge>
                  </div>
                  <p className="text-xs text-muted-foreground mt-0.5 leading-relaxed">{insight.desc}</p>
                </div>
              </div>
            </Link>
          </motion.div>
        ))}
      </CardContent>
    </Card>
  );
}