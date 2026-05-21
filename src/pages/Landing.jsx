import React, { useEffect, useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import { motion, useMotionValue, useSpring } from 'framer-motion';
import {
  TrendingUp, Shield, Zap, BarChart3, Target, Brain,
  ChevronRight, ArrowRight, Play, Clock, IndianRupee,
  Bot, Activity, Star, CheckCircle2, Sparkles
} from 'lucide-react';
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { STOCK_SEED_DATA, formatCurrency } from '@/lib/stockData';

const TICKER_STOCKS = STOCK_SEED_DATA.slice(0, 20);

function TickerBar() {
  return (
    <div className="overflow-hidden bg-black/30 border-y border-white/5 py-2">
      <div className="flex animate-ticker whitespace-nowrap" style={{ width: 'max-content' }}>
        {[...TICKER_STOCKS, ...TICKER_STOCKS].map((s, i) => {
          const last = s.ohlcv_data?.[s.ohlcv_data.length - 1];
          const prev = s.ohlcv_data?.[s.ohlcv_data.length - 2];
          const change = last && prev ? ((last.close - prev.close) / prev.close * 100) : 0;
          const isUp = change >= 0;
          return (
            <span key={i} className="inline-flex items-center gap-2 mx-6 font-mono text-xs">
              <span className="text-white/60">{s.symbol}</span>
              <span className="text-white font-medium">₹{s.current_price?.toFixed(0)}</span>
              <span className={isUp ? 'text-mint' : 'text-coral'}>
                {isUp ? '▲' : '▼'}{Math.abs(change).toFixed(2)}%
              </span>
            </span>
          );
        })}
      </div>
    </div>
  );
}

const features = [
  {
    icon: Brain,
    title: "8-Signal AI Engine",
    desc: "RSI, MACD, Bollinger Bands, ADX, Stochastic — 8 indicators voted and weighted for every BUY/SELL signal with plain-English reasoning.",
    gradient: "from-cyan/20 to-cyan/5",
    iconColor: "text-cyan",
    glow: "shadow-[0_0_20px_rgba(0,212,255,0.15)]",
  },
  {
    icon: Clock,
    title: "Market Time Machine",
    desc: "Travel to Jan 2023, load a portfolio, hit play at 30x speed. Watch your holdings react to the Budget rally and FII selloff in real-time.",
    gradient: "from-violet/20 to-violet/5",
    iconColor: "text-violet",
    glow: "shadow-[0_0_20px_rgba(123,47,255,0.15)]",
  },
  {
    icon: Bot,
    title: "Elite Trading Bot",
    desc: "Full 8-signal confirmation system with Kelly Criterion position sizing, regime filter, and multi-timeframe confluence — institutional grade.",
    gradient: "from-mint/20 to-mint/5",
    iconColor: "text-mint",
    glow: "shadow-[0_0_20px_rgba(46,213,115,0.15)]",
  },
  {
    icon: Target,
    title: "Personalized Suitability",
    desc: "Every stock rated 0–100% for YOUR risk profile. Conservative investor? We filter out the high-beta names automatically.",
    gradient: "from-amber2/20 to-amber2/5",
    iconColor: "text-amber2",
    glow: "shadow-[0_0_20px_rgba(255,165,2,0.15)]",
  },
  {
    icon: BarChart3,
    title: "Portfolio Health Score",
    desc: "AI-computed composite score covering diversification, risk alignment, sector concentration, and Nifty 50 benchmark comparison.",
    gradient: "from-coral/20 to-coral/5",
    iconColor: "text-coral",
    glow: "shadow-[0_0_20px_rgba(255,71,87,0.15)]",
  },
  {
    icon: Shield,
    title: "Virtual Trading Sandbox",
    desc: "₹1,00,000 virtual capital. Real historical prices. Real P&L math. Zero real money at risk. Build conviction first.",
    gradient: "from-cyan/10 to-violet/10",
    iconColor: "text-primary",
    glow: "shadow-[0_0_20px_rgba(0,212,255,0.1)]",
  },
];

const stats = [
  { value: "20+", label: "NIFTY 50 Stocks", sub: "Real historical prices" },
  { value: "8", label: "AI Signals", sub: "Multi-indicator confluence" },
  { value: "2yr", label: "Historical Data", sub: "OHLCV market events" },
  { value: "100%", label: "Explainable AI", sub: "Every signal justified" },
];

const steps = [
  { num: "01", title: "Build Your Profile", desc: "Tell us your income, expenses, goals and risk appetite. Get a personalized investable amount.", color: "border-cyan/40 text-cyan" },
  { num: "02", title: "Explore AI Signals", desc: "Browse 20+ Nifty stocks with BUY/SELL signals, confidence scores, and plain-English reasoning.", color: "border-violet/40 text-violet" },
  { num: "03", title: "Trade Virtually", desc: "Execute virtual trades and track real P&L with ₹1L starting capital. No real money involved.", color: "border-mint/40 text-mint" },
  { num: "04", title: "Time Travel", desc: "Launch the Market Time Machine. Fast-forward through 2 years of market history at 30x speed.", color: "border-amber2/40 text-amber2" },
];

export default function Landing() {
  return (
    <div className="min-h-screen bg-background text-foreground overflow-x-hidden">
      {/* Animated background grid */}
      <div className="fixed inset-0 pointer-events-none overflow-hidden">
        <div className="absolute inset-0" style={{
          backgroundImage: `linear-gradient(rgba(0,212,255,0.03) 1px, transparent 1px), linear-gradient(90deg, rgba(0,212,255,0.03) 1px, transparent 1px)`,
          backgroundSize: '60px 60px'
        }} />
        <div className="absolute top-1/4 left-1/4 w-96 h-96 rounded-full blur-[120px] opacity-20" style={{ background: 'radial-gradient(circle, #00D4FF, transparent)' }} />
        <div className="absolute bottom-1/3 right-1/4 w-96 h-96 rounded-full blur-[120px] opacity-15" style={{ background: 'radial-gradient(circle, #7B2FFF, transparent)' }} />
      </div>

      {/* Navbar */}
      <header className="fixed top-0 left-0 right-0 z-50 border-b border-white/5" style={{ background: 'rgba(5,11,24,0.85)', backdropFilter: 'blur(20px)' }}>
        <div className="max-w-7xl mx-auto px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl flex items-center justify-center" style={{ background: 'linear-gradient(135deg, #00D4FF, #7B2FFF)' }}>
              <TrendingUp className="w-5 h-5 text-white" />
            </div>
            <div className="flex items-baseline gap-1.5">
              <span className="font-space font-bold text-xl text-cyan">NIVESH</span>
              <span className="font-space font-bold text-xl text-violet">AI</span>
            </div>
            <Badge className="text-[10px] hidden sm:inline-flex border-cyan/30 text-cyan bg-cyan/10">LEAP 2026</Badge>
          </div>
          <div className="flex items-center gap-3">
            <Link to="/login">
              <Button variant="ghost" size="sm" className="text-white/70 hover:text-white">Sign In</Button>
            </Link>
            <Link to="/register">
              <Button size="sm" className="hidden sm:inline-flex text-background font-semibold" style={{ background: 'linear-gradient(135deg, #00D4FF, #7B2FFF)' }}>
                Get Started Free
              </Button>
            </Link>
          </div>
        </div>
      </header>

      {/* Ticker */}
      <div className="pt-[65px]">
        <TickerBar />
      </div>

      {/* Hero */}
      <section className="relative pt-20 pb-24 px-6">
        <div className="max-w-5xl mx-auto text-center">
          <motion.div initial={{ opacity: 0, y: 40 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.7 }}>
            <div className="inline-flex items-center gap-2 mb-6 px-4 py-2 rounded-full border border-cyan/20 bg-cyan/5 text-cyan text-sm font-medium">
              <Sparkles className="w-4 h-4" />
              🏆 Fidelity LEAP 2026 — Problem Statement #1
            </div>

            <h1 className="text-5xl md:text-7xl font-space font-bold leading-[1.05] tracking-tight">
              Your Intelligent
              <br />
              <span className="gradient-text-cyan">Investment Companion</span>
            </h1>

            <p className="mt-6 text-lg md:text-xl text-white/50 max-w-2xl mx-auto leading-relaxed font-dm">
              NIVESH AI gives India's retail investors institutional-grade tools — AI signals, virtual portfolio, 
              Market Time Machine, and Elite Trading Bot. Zero real money required.
            </p>

            <div className="flex flex-col sm:flex-row items-center justify-center gap-4 mt-10">
              <Link to="/register">
                <Button size="lg" className="gap-2 px-8 h-13 text-base font-semibold text-background shadow-[0_0_30px_rgba(0,212,255,0.3)]" style={{ background: 'linear-gradient(135deg, #00D4FF, #7B2FFF)' }}>
                  Start Investing Virtually <ArrowRight className="w-5 h-5" />
                </Button>
              </Link>
              <Link to="/login">
                <Button size="lg" variant="outline" className="gap-2 h-13 text-base border-white/10 text-white/80 hover:border-cyan/40 hover:text-cyan">
                  <Play className="w-4 h-4 text-cyan" /> Live Demo
                </Button>
              </Link>
            </div>
          </motion.div>

          {/* Stats */}
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.5 }}
            className="mt-20 grid grid-cols-2 md:grid-cols-4 gap-4"
          >
            {stats.map((s, i) => (
              <motion.div
                key={s.label}
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: 0.6 + i * 0.1 }}
                className="glass-card rounded-2xl p-5 text-center"
              >
                <p className="text-3xl font-space font-bold text-cyan font-num">{s.value}</p>
                <p className="text-sm text-white/80 font-medium mt-1">{s.label}</p>
                <p className="text-xs text-white/35 mt-0.5">{s.sub}</p>
              </motion.div>
            ))}
          </motion.div>
        </div>
      </section>

      {/* Features */}
      <section className="py-24 px-6">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-5xl font-space font-bold">
              Everything to invest <span className="gradient-text-cyan">smarter</span>
            </h2>
            <p className="text-white/40 mt-4 text-lg">Built specifically for Indian retail investors</p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
            {features.map((f, i) => (
              <motion.div
                key={f.title}
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.08 }}
                className={`glass-card rounded-2xl p-6 border border-white/5 hover:border-white/10 transition-all duration-300 ${f.glow} group cursor-default`}
              >
                <div className={`w-12 h-12 rounded-xl bg-gradient-to-br ${f.gradient} flex items-center justify-center mb-5`}>
                  <f.icon className={`w-6 h-6 ${f.iconColor}`} />
                </div>
                <h3 className="font-space font-bold text-lg text-white mb-2 group-hover:text-cyan transition-colors">{f.title}</h3>
                <p className="text-white/45 text-sm leading-relaxed">{f.desc}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* How it works */}
      <section className="py-24 px-6 relative">
        <div className="absolute inset-0 bg-hero-gradient pointer-events-none" />
        <div className="max-w-4xl mx-auto relative">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-5xl font-space font-bold">
              From zero to <span className="gradient-text-cyan">informed investor</span>
            </h2>
            <p className="text-white/40 mt-4">4 steps. 5 minutes setup. Zero real money.</p>
          </div>
          <div className="space-y-5">
            {steps.map((step, i) => (
              <motion.div
                key={step.num}
                initial={{ opacity: 0, x: -30 }}
                whileInView={{ opacity: 1, x: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.1 }}
                className="glass-card rounded-2xl p-6 flex gap-5 items-start border border-white/5 hover:border-white/10 transition-all"
              >
                <div className={`w-14 h-14 rounded-2xl border ${step.color} flex items-center justify-center flex-shrink-0 bg-white/3`}>
                  <span className={`font-space font-bold text-base ${step.color.split(' ')[1]}`}>{step.num}</span>
                </div>
                <div className="pt-1">
                  <h3 className="font-space font-bold text-lg text-white mb-1">{step.title}</h3>
                  <p className="text-white/45 text-sm leading-relaxed">{step.desc}</p>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Proof strip */}
      <section className="py-12 px-6 border-y border-white/5">
        <div className="max-w-5xl mx-auto">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-6 text-center">
            {[
              { icon: CheckCircle2, text: "8-Signal Confirmation System" },
              { icon: Activity, text: "Kelly Criterion Position Sizing" },
              { icon: Brain, text: "Regime Filter (Never Buy in TRENDING_DOWN)" },
              { icon: Star, text: "Fibonacci Profit Targets" },
            ].map((item, i) => (
              <div key={i} className="flex flex-col items-center gap-2">
                <item.icon className="w-5 h-5 text-cyan" />
                <p className="text-white/50 text-xs leading-relaxed">{item.text}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="py-24 px-6">
        <div className="max-w-3xl mx-auto text-center">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="glass-card rounded-3xl p-12 border border-white/8"
            style={{ boxShadow: '0 0 80px rgba(0,212,255,0.08), 0 0 160px rgba(123,47,255,0.05)' }}
          >
            <div className="w-16 h-16 rounded-2xl mx-auto mb-6 flex items-center justify-center" style={{ background: 'linear-gradient(135deg, #00D4FF22, #7B2FFF22)', border: '1px solid rgba(0,212,255,0.2)' }}>
              <Zap className="w-8 h-8 text-cyan" />
            </div>
            <h2 className="text-3xl md:text-4xl font-space font-bold text-white">
              Ready to invest smarter?
            </h2>
            <p className="mt-4 text-white/45 text-lg max-w-xl mx-auto">
              Join NIVESH AI and experience institutional-grade analysis built for India's retail investors.
            </p>
            <Link to="/register" className="mt-8 inline-flex">
              <Button size="lg" className="gap-2 px-10 h-13 text-base font-semibold text-background shadow-[0_0_40px_rgba(0,212,255,0.25)]" style={{ background: 'linear-gradient(135deg, #00D4FF, #7B2FFF)' }}>
                Get Started Free <ChevronRight className="w-5 h-5" />
              </Button>
            </Link>
          </motion.div>
        </div>
      </section>

      {/* Footer */}
      <footer className="py-8 px-6 border-t border-white/5 text-center text-sm text-white/25">
        <p>NIVESH AI — Built for Fidelity LEAP 2026 Hackathon | Problem Statement #1 | AI-Powered Stock Portfolio Manager</p>
        <p className="mt-1">Virtual platform for educational purposes only. Not financial advice.</p>
      </footer>
    </div>
  );
}