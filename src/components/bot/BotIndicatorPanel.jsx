import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';

const INDICATOR_STATUS_COLOR = {
  BULLISH: 'text-emerald-600 bg-emerald-50',
  BEARISH: 'text-red-600 bg-red-50',
  NEUTRAL: 'text-amber-600 bg-amber-50',
  SQUEEZE: 'text-purple-600 bg-purple-50',
  STRONG:  'text-blue-600 bg-blue-50',
  WEAK:    'text-muted-foreground bg-muted',
};

function IndicatorRow({ name, status, reason, value }) {
  const colorClass = INDICATOR_STATUS_COLOR[status] || INDICATOR_STATUS_COLOR.NEUTRAL;
  return (
    <div className="flex items-start gap-2 py-2 border-b last:border-0">
      <div className={`mt-0.5 text-xs font-bold rounded px-1.5 py-0.5 shrink-0 ${colorClass}`}>
        {status}
      </div>
      <div className="flex-1 min-w-0">
        <div className="text-xs font-semibold">{name}</div>
        <div className="text-xs text-muted-foreground truncate">{reason}</div>
        {value !== undefined && value !== null && (
          <div className="text-xs font-mono text-foreground/70">{typeof value === 'number' ? value.toFixed(2) : value}</div>
        )}
      </div>
    </div>
  );
}

export default function BotIndicatorPanel({ stock }) {
  const analysis = stock?.analysis;
  if (!analysis) return null;

  const details = analysis.details || {};
  const rows = [
    { name: 'RSI (14)',           detail: details.rsi,         value: details.rsi?.value },
    { name: 'MACD (12,26,9)',      detail: details.macd,        value: details.macd?.histogram },
    { name: 'EMA Cross (20/50)',   detail: details.ema,         value: null },
    { name: 'Bollinger Bands (20)', detail: details.bollinger,  value: null },
    { name: 'ADX (14)',            detail: details.adx,         value: details.adx?.adx },
    { name: 'Stochastic (14,3)',   detail: details.stochastic,  value: details.stochastic?.k },
    { name: 'Volume Profile',      detail: details.volume,      value: details.volume?.ratio },
    { name: 'RSI Divergence',      detail: details.divergence ? { status: details.divergence.type === 'NONE' ? 'NEUTRAL' : details.divergence.type, reason: details.divergence.reason } : null, value: null },
  ];

  const confidence = analysis.confidence || 0;
  const bull = analysis.bullishSignals || 0;
  const bear = analysis.bearishSignals || 0;

  return (
    <Card>
      <CardHeader className="pb-2">
        <CardTitle className="text-sm">8-Signal Confirmation</CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        {/* Score bar */}
        <div className="space-y-1">
          <div className="flex justify-between text-xs">
            <span className="text-emerald-600 font-semibold">Bull: {bull.toFixed(1)}</span>
            <span className="font-semibold">{confidence.toFixed(0)}% confidence</span>
            <span className="text-red-500 font-semibold">Bear: {bear.toFixed(1)}</span>
          </div>
          <div className="h-2 bg-red-100 rounded-full overflow-hidden">
            <div
              className="h-full bg-emerald-500 rounded-full transition-all"
              style={{ width: `${(bull / (bull + bear + 0.01)) * 100}%` }}
            />
          </div>
        </div>

        {/* ATR Risk */}
        {details.atr && (
          <div className="flex items-center justify-between text-xs bg-muted/40 rounded p-2">
            <span className="text-muted-foreground">ATR Volatility</span>
            <span className={`font-semibold ${details.atr.highVol ? 'text-orange-500' : 'text-emerald-600'}`}>
              {details.atr.pct?.toFixed(2)}% {details.atr.highVol ? '⚠️ High' : '✅ Normal'}
            </span>
          </div>
        )}

        {/* Indicators */}
        <div>
          {rows.map(({ name, detail, value }) =>
            detail ? (
              <IndicatorRow key={name} name={name} status={detail.status} reason={detail.reason} value={value} />
            ) : null
          )}
        </div>

        {/* Golden/Death Cross */}
        {analysis.goldenCross && (
          <div className="text-xs bg-emerald-50 text-emerald-700 rounded p-2 font-medium">
            ✅ Golden Cross — EMA20 crossed above EMA50 (bullish)
          </div>
        )}
        {analysis.deathCross && (
          <div className="text-xs bg-red-50 text-red-700 rounded p-2 font-medium">
            ❌ Death Cross — EMA20 below EMA50 (bearish)
          </div>
        )}

        {/* Bollinger Squeeze */}
        {analysis.indicators?.bb?.squeeze && (
          <div className="text-xs bg-purple-50 text-purple-700 rounded p-2 font-medium">
            🎯 Bollinger Squeeze — Low volatility compression, breakout imminent
          </div>
        )}

        {/* Above SMA200 */}
        <div className={`text-xs rounded p-2 ${analysis.aboveSMA200 ? 'bg-emerald-50 text-emerald-700' : 'bg-red-50 text-red-600'}`}>
          {analysis.aboveSMA200 ? '✅ Price above SMA200 — long-term uptrend intact' : '⚠️ Price below SMA200 — long-term trend bearish'}
        </div>
      </CardContent>
    </Card>
  );
}