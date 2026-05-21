/**
 * ELITE TRADING ENGINE - JavaScript port of elite_trading_bot.py
 * Implements all core strategies: RSI, MACD, EMA, Bollinger, ADX, Stochastic,
 * Volume Profile, ATR, Market Regime, Fibonacci levels, Kelly Criterion,
 * Support/Resistance, Divergence Detection, 8-Signal Confirmation System
 */

// ─────────────────────────────────────────────────────────────
// ENUMS
// ─────────────────────────────────────────────────────────────
export const Signal = {
  STRONG_BUY: 'STRONG_BUY',
  BUY: 'BUY',
  HOLD: 'HOLD',
  SELL: 'SELL',
  STRONG_SELL: 'STRONG_SELL',
};

export const MarketRegime = {
  BULL_TRENDING: 'BULL_TRENDING',
  BEAR_TRENDING: 'BEAR_TRENDING',
  HIGH_VOLATILITY: 'HIGH_VOLATILITY',
  LOW_VOLATILITY: 'LOW_VOLATILITY',
  CONSOLIDATION: 'CONSOLIDATION',
  TRENDING_UP: 'TRENDING_UP',
  TRENDING_DOWN: 'TRENDING_DOWN',
};

export const MarketState = {
  NORMAL: 'NORMAL',       // BB bandwidth < 8%, ADX 20-60, RSI 30-70
  VOLATILE: 'VOLATILE',   // BB 8-15%, ADX 15-75
  CRASH: 'CRASH',         // BB > 15%, ADX > 75, RSI < 20 OR momentum < -5%
  RECOVERY: 'RECOVERY',   // After crash stabilizing
};

// ─────────────────────────────────────────────────────────────
// CORE INDICATOR FUNCTIONS
// ─────────────────────────────────────────────────────────────

export function ema(prices, period) {
  if (!prices || prices.length === 0) return [];
  const k = 2 / (period + 1);
  const result = [];
  let val = prices[0];
  for (let i = 0; i < prices.length; i++) {
    val = prices[i] * k + val * (1 - k);
    result.push(+val.toFixed(4));
  }
  return result;
}

export function sma(prices, period) {
  const result = [];
  for (let i = period - 1; i < prices.length; i++) {
    const sum = prices.slice(i - period + 1, i + 1).reduce((a, b) => a + b, 0);
    result.push(+(sum / period).toFixed(4));
  }
  return result;
}

export function calculateRSI(ohlcv, period = 14) {
  if (!ohlcv || ohlcv.length < period + 1) return [];
  const closes = ohlcv.map(d => d.close);
  const changes = closes.slice(1).map((c, i) => c - closes[i]);

  let avgGain = 0, avgLoss = 0;
  for (let i = 0; i < period; i++) {
    if (changes[i] > 0) avgGain += changes[i];
    else avgLoss += Math.abs(changes[i]);
  }
  avgGain /= period;
  avgLoss /= period;

  const result = [];
  const pushRSI = (date, ag, al) => {
    const rs = al === 0 ? 100 : ag / al;
    result.push({ date, value: +(100 - 100 / (1 + rs)).toFixed(2) });
  };

  pushRSI(ohlcv[period].date, avgGain, avgLoss);

  for (let i = period; i < changes.length; i++) {
    avgGain = (avgGain * (period - 1) + (changes[i] > 0 ? changes[i] : 0)) / period;
    avgLoss = (avgLoss * (period - 1) + (changes[i] < 0 ? Math.abs(changes[i]) : 0)) / period;
    pushRSI(ohlcv[i + 1].date, avgGain, avgLoss);
  }
  return result;
}

export function calculateMACD(ohlcv, fast = 12, slow = 26, signalPeriod = 9) {
  if (!ohlcv || ohlcv.length < slow + signalPeriod) return [];
  const closes = ohlcv.map(d => d.close);
  const emaFast = ema(closes, fast);
  const emaSlow = ema(closes, slow);
  const macdLine = emaFast.map((v, i) => +(v - emaSlow[i]).toFixed(4));
  const macdSignalLine = ema(macdLine.slice(slow - 1), signalPeriod);

  const result = [];
  for (let i = slow - 1 + signalPeriod - 1; i < ohlcv.length; i++) {
    const idx = i - (slow - 1 + signalPeriod - 1);
    const macdVal = macdLine[i];
    const sigVal = macdSignalLine[idx];
    result.push({
      date: ohlcv[i].date,
      macd: macdVal,
      signal: sigVal,
      histogram: +(macdVal - sigVal).toFixed(4),
    });
  }
  return result;
}

export function calculateBollingerBands(ohlcv, period = 20, stdDev = 2) {
  if (!ohlcv || ohlcv.length < period) return [];
  const result = [];
  for (let i = period - 1; i < ohlcv.length; i++) {
    const slice = ohlcv.slice(i - period + 1, i + 1).map(d => d.close);
    const mean = slice.reduce((a, b) => a + b, 0) / period;
    const variance = slice.reduce((a, b) => a + Math.pow(b - mean, 2), 0) / period;
    const sd = Math.sqrt(variance);
    const upper = +(mean + stdDev * sd).toFixed(2);
    const lower = +(mean - stdDev * sd).toFixed(2);
    const bandwidth = mean > 0 ? +((upper - lower) / mean * 100).toFixed(2) : 0;
    result.push({
      date: ohlcv[i].date,
      middle: +mean.toFixed(2),
      upper,
      lower,
      bandwidth,
      squeeze: bandwidth < 3.0, // Bollinger Squeeze: bandwidth < 3%
    });
  }
  return result;
}

export function calculateATR(ohlcv, period = 14) {
  if (!ohlcv || ohlcv.length < period + 1) return [];
  const trs = [];
  for (let i = 1; i < ohlcv.length; i++) {
    const high = ohlcv[i].high;
    const low = ohlcv[i].low;
    const prevClose = ohlcv[i - 1].close;
    trs.push(Math.max(high - low, Math.abs(high - prevClose), Math.abs(low - prevClose)));
  }
  const result = [];
  let atr = trs.slice(0, period).reduce((a, b) => a + b, 0) / period;
  result.push({ date: ohlcv[period].date, value: +atr.toFixed(4) });
  for (let i = period; i < trs.length; i++) {
    atr = (atr * (period - 1) + trs[i]) / period;
    result.push({ date: ohlcv[i + 1].date, value: +atr.toFixed(4) });
  }
  return result;
}

export function calculateADX(ohlcv, period = 14) {
  if (!ohlcv || ohlcv.length < period * 2) return [];
  const plusDM = [], minusDM = [], tr = [];

  for (let i = 1; i < ohlcv.length; i++) {
    const upMove = ohlcv[i].high - ohlcv[i - 1].high;
    const downMove = ohlcv[i - 1].low - ohlcv[i].low;
    plusDM.push(upMove > downMove && upMove > 0 ? upMove : 0);
    minusDM.push(downMove > upMove && downMove > 0 ? downMove : 0);
    const h = ohlcv[i].high, l = ohlcv[i].low, pc = ohlcv[i - 1].close;
    tr.push(Math.max(h - l, Math.abs(h - pc), Math.abs(l - pc)));
  }

  const smoothTR = sma(tr, period);
  const smoothPlusDM = sma(plusDM, period);
  const smoothMinusDM = sma(minusDM, period);

  const result = [];
  const dxHistory = [];
  for (let i = 0; i < smoothTR.length; i++) {
    const plusDI = smoothTR[i] > 0 ? 100 * smoothPlusDM[i] / smoothTR[i] : 0;
    const minusDI = smoothTR[i] > 0 ? 100 * smoothMinusDM[i] / smoothTR[i] : 0;
    const diSum = plusDI + minusDI;
    const dx = diSum > 0 ? 100 * Math.abs(plusDI - minusDI) / diSum : 0;
    dxHistory.push(dx);
    if (dxHistory.length >= period) {
      const adx = dxHistory.slice(-period).reduce((a, b) => a + b, 0) / period;
      result.push({
        date: ohlcv[i + period].date,
        adx: +adx.toFixed(2),
        plusDI: +plusDI.toFixed(2),
        minusDI: +minusDI.toFixed(2),
        trending: adx > 25,
      });
    }
  }
  return result;
}

export function calculateStochastic(ohlcv, kPeriod = 14, dPeriod = 3) {
  if (!ohlcv || ohlcv.length < kPeriod) return [];
  const kValues = [];
  for (let i = kPeriod - 1; i < ohlcv.length; i++) {
    const slice = ohlcv.slice(i - kPeriod + 1, i + 1);
    const high = Math.max(...slice.map(d => d.high));
    const low = Math.min(...slice.map(d => d.low));
    const k = high === low ? 50 : +((ohlcv[i].close - low) / (high - low) * 100).toFixed(2);
    kValues.push({ date: ohlcv[i].date, k });
  }
  const result = [];
  for (let i = dPeriod - 1; i < kValues.length; i++) {
    const d = kValues.slice(i - dPeriod + 1, i + 1).reduce((a, b) => a + b.k, 0) / dPeriod;
    result.push({ date: kValues[i].date, k: kValues[i].k, d: +d.toFixed(2) });
  }
  return result;
}

export function calculateVolumeProfile(ohlcv) {
  if (!ohlcv || ohlcv.length === 0) return { averageVolume: 0, volumeRatio: 1, highVolumeDay: false };
  const volumes = ohlcv.map(d => d.volume);
  const avg = volumes.reduce((a, b) => a + b, 0) / volumes.length;
  const lastVol = volumes[volumes.length - 1] || 0;
  return {
    averageVolume: +avg.toFixed(0),
    volumeRatio: avg > 0 ? +(lastVol / avg).toFixed(2) : 1,
    highVolumeDay: lastVol > avg * 1.5,
    volumeTrend: volumes.slice(-5).reduce((a, b) => a + b, 0) / 5 > avg ? 'rising' : 'falling',
  };
}

// ─────────────────────────────────────────────────────────────
// SUPPORT / RESISTANCE (Pivot Points)
// ─────────────────────────────────────────────────────────────
export function calculatePivotPoints(ohlcv) {
  if (!ohlcv || ohlcv.length < 2) return { support: [], resistance: [] };
  const support = [], resistance = [];

  for (let i = 2; i < ohlcv.length - 2; i++) {
    const prev2 = ohlcv[i - 2], prev1 = ohlcv[i - 1], curr = ohlcv[i], next1 = ohlcv[i + 1], next2 = ohlcv[i + 2];
    // Local low = support
    if (curr.low < prev2.low && curr.low < prev1.low && curr.low < next1.low && curr.low < next2.low) {
      support.push({ price: curr.low, date: curr.date, strength: 1 });
    }
    // Local high = resistance
    if (curr.high > prev2.high && curr.high > prev1.high && curr.high > next1.high && curr.high > next2.high) {
      resistance.push({ price: curr.high, date: curr.date, strength: 1 });
    }
  }
  return { support: support.slice(-5), resistance: resistance.slice(-5) };
}

// ─────────────────────────────────────────────────────────────
// FIBONACCI LEVELS (38.2%, 61.8%, 100%)
// ─────────────────────────────────────────────────────────────
export function calculateFibonacciLevels(ohlcv) {
  if (!ohlcv || ohlcv.length < 10) return null;
  const recent = ohlcv.slice(-20);
  const high = Math.max(...recent.map(d => d.high));
  const low = Math.min(...recent.map(d => d.low));
  const diff = high - low;
  return {
    high,
    low,
    level_0: +low.toFixed(2),
    level_236: +(low + diff * 0.236).toFixed(2),
    level_382: +(low + diff * 0.382).toFixed(2),
    level_500: +(low + diff * 0.5).toFixed(2),
    level_618: +(low + diff * 0.618).toFixed(2),
    level_786: +(low + diff * 0.786).toFixed(2),
    level_100: +high.toFixed(2),
    // Profit targets (from current price upward)
    target_382: +(low + diff * 0.382).toFixed(2),
    target_618: +(low + diff * 0.618).toFixed(2),
    target_100: +high.toFixed(2),
  };
}

// ─────────────────────────────────────────────────────────────
// RSI DIVERGENCE DETECTION
// ─────────────────────────────────────────────────────────────
export function detectRSIDivergence(ohlcv, rsiValues) {
  if (!ohlcv || !rsiValues || ohlcv.length < 10 || rsiValues.length < 5) {
    return { bullish: false, bearish: false };
  }
  const recentOHLCV = ohlcv.slice(-10);
  const recentRSI = rsiValues.slice(-10);

  // Bullish divergence: price makes lower low but RSI makes higher low
  const priceLow1 = Math.min(...recentOHLCV.slice(0, 5).map(d => d.low));
  const priceLow2 = Math.min(...recentOHLCV.slice(5).map(d => d.low));
  const rsiLow1 = Math.min(...recentRSI.slice(0, 5).map(d => d.value));
  const rsiLow2 = Math.min(...recentRSI.slice(5).map(d => d.value));

  const bullish = priceLow2 < priceLow1 && rsiLow2 > rsiLow1;

  // Bearish divergence: price makes higher high but RSI makes lower high
  const priceHigh1 = Math.max(...recentOHLCV.slice(0, 5).map(d => d.high));
  const priceHigh2 = Math.max(...recentOHLCV.slice(5).map(d => d.high));
  const rsiHigh1 = Math.max(...recentRSI.slice(0, 5).map(d => d.value));
  const rsiHigh2 = Math.max(...recentRSI.slice(5).map(d => d.value));

  const bearish = priceHigh2 > priceHigh1 && rsiHigh2 < rsiHigh1;

  return { bullish, bearish };
}

// ─────────────────────────────────────────────────────────────
// MARKET STATE DETECTION (NORMAL/VOLATILE/CRASH/RECOVERY)
// ─────────────────────────────────────────────────────────────
export function detectMarketState(ohlcv, bb, adx, rsi) {
  if (!ohlcv || ohlcv.length < 5) return MarketState.NORMAL;

  const latestBB = bb?.[bb.length - 1];
  const latestADX = adx?.[adx.length - 1]?.adx || 20;
  const latestRSI = rsi?.[rsi.length - 1]?.value || 50;
  const bwPct = latestBB?.bandwidth || 5;

  // Momentum check: last 5 bars
  const closes = ohlcv.slice(-6);
  const momentum5 = closes.length > 1
    ? ((closes[closes.length - 1].close - closes[0].close) / closes[0].close) * 100
    : 0;

  if (bwPct > 15 || latestADX > 75 || latestRSI < 20 || momentum5 < -5) return MarketState.CRASH;
  if (bwPct >= 8 && bwPct <= 15 && latestADX >= 15 && latestADX <= 75) return MarketState.VOLATILE;
  // Recovery: post-crash RSI bouncing
  if (latestRSI < 35 && momentum5 > 0) return MarketState.RECOVERY;
  return MarketState.NORMAL;
}

// ─────────────────────────────────────────────────────────────
// MARKET REGIME DETECTION
// ─────────────────────────────────────────────────────────────
export function detectMarketRegime(ohlcv, adxData) {
  if (!ohlcv || ohlcv.length < 20) return MarketRegime.CONSOLIDATION;

  const closes = ohlcv.map(d => d.close);
  const sma20 = sma(closes, 20);
  const sma50 = sma(closes, Math.min(50, closes.length - 1));
  const latestADX = adxData?.[adxData.length - 1];
  const adxVal = latestADX?.adx || 20;

  const lastClose = closes[closes.length - 1];
  const lastSMA20 = sma20[sma20.length - 1];
  const lastSMA50 = sma50[sma50.length - 1];

  // Momentum over last 10 bars
  const momentum = ((lastClose - closes[closes.length - 11]) / closes[closes.length - 11]) * 100;

  if (adxVal > 25) {
    if (lastClose > lastSMA20 && lastSMA20 > lastSMA50 && momentum > 2) return MarketRegime.BULL_TRENDING;
    if (lastClose < lastSMA20 && lastSMA20 < lastSMA50 && momentum < -2) return MarketRegime.BEAR_TRENDING;
    if (momentum > 0) return MarketRegime.TRENDING_UP;
    return MarketRegime.TRENDING_DOWN;
  }

  // Calculate volatility (std dev of returns)
  const returns = closes.slice(1).map((c, i) => (c - closes[i]) / closes[i]);
  const mean = returns.reduce((a, b) => a + b, 0) / returns.length;
  const variance = returns.reduce((a, b) => a + Math.pow(b - mean, 2), 0) / returns.length;
  const volPct = Math.sqrt(variance) * 100;

  if (volPct > 2) return MarketRegime.HIGH_VOLATILITY;
  if (volPct < 0.5) return MarketRegime.LOW_VOLATILITY;
  return MarketRegime.CONSOLIDATION;
}

// ─────────────────────────────────────────────────────────────
// KELLY CRITERION POSITION SIZING
// ─────────────────────────────────────────────────────────────
export function kellyPositionSize(winRate, avgWin, avgLoss, capital) {
  if (avgLoss === 0) return 0;
  const b = avgWin / avgLoss; // reward/risk ratio
  const p = winRate;
  const q = 1 - p;
  const kelly = (b * p - q) / b;
  const fractionalKelly = Math.max(0, Math.min(kelly * 0.5, 0.15)); // half-Kelly, max 15%
  return +(capital * fractionalKelly).toFixed(2);
}

// ─────────────────────────────────────────────────────────────
// DYNAMIC STOP LOSS (ATR-based)
// ─────────────────────────────────────────────────────────────
export function calculateDynamicStopLoss(entryPrice, atrValue, multiplier = 2.5) {
  return +(entryPrice - atrValue * multiplier).toFixed(2);
}

export function calculateTrailingStop(currentPrice, highSinceBuy, atrValue, multiplier = 2.0) {
  return +(highSinceBuy - atrValue * multiplier).toFixed(2);
}

// ─────────────────────────────────────────────────────────────
// 8-SIGNAL CONFIRMATION SYSTEM (Core of the bot)
// ─────────────────────────────────────────────────────────────
export function runSignalConfirmation(ohlcv) {
  if (!ohlcv || ohlcv.length < 30) {
    return { signal: Signal.HOLD, confirmations: 0, confidence: 0, details: {} };
  }

  const rsiData = calculateRSI(ohlcv);
  const macdData = calculateMACD(ohlcv);
  const bbData = calculateBollingerBands(ohlcv);
  const atrData = calculateATR(ohlcv);
  const adxData = calculateADX(ohlcv);
  const stochData = calculateStochastic(ohlcv);
  const volumeProfile = calculateVolumeProfile(ohlcv);
  const { support, resistance } = calculatePivotPoints(ohlcv);
  const fibLevels = calculateFibonacciLevels(ohlcv);
  const rsDiv = detectRSIDivergence(ohlcv, rsiData);
  const marketState = detectMarketState(ohlcv, bbData, adxData, rsiData);
  const regime = detectMarketRegime(ohlcv, adxData);

  const latestClose = ohlcv[ohlcv.length - 1].close;
  const latestRSI = rsiData[rsiData.length - 1]?.value ?? 50;
  const latestMACD = macdData[macdData.length - 1];
  const latestBB = bbData[bbData.length - 1];
  const latestADX = adxData[adxData.length - 1];
  const latestStoch = stochData[stochData.length - 1];
  const latestATR = atrData[atrData.length - 1]?.value ?? 0;

  // SMA crossovers (EMA 20/50)
  const closes = ohlcv.map(d => d.close);
  const ema20 = ema(closes, 20);
  const ema50 = ema(closes, Math.min(50, closes.length - 1));
  const goldenCross = ema20[ema20.length - 1] > ema50[ema50.length - 1];
  const deathCross = ema20[ema20.length - 1] < ema50[ema50.length - 1];

  // Price relative to SMA200
  const sma200 = sma(closes, Math.min(200, closes.length));
  const aboveSMA200 = sma200.length > 0 && latestClose > sma200[sma200.length - 1];

  let bullishSignals = 0, bearishSignals = 0;
  const details = {};

  // ── Signal 1: RSI
  if (latestRSI < 30) { bullishSignals++; details.rsi = { status: 'BULLISH', value: latestRSI, reason: 'Oversold (<30)' }; }
  else if (latestRSI > 70) { bearishSignals++; details.rsi = { status: 'BEARISH', value: latestRSI, reason: 'Overbought (>70)' }; }
  else if (latestRSI >= 40 && latestRSI <= 60) { bullishSignals += 0.5; details.rsi = { status: 'NEUTRAL', value: latestRSI, reason: 'Neutral zone' }; }
  else { details.rsi = { status: 'NEUTRAL', value: latestRSI, reason: 'Neutral' }; }

  // ── Signal 2: MACD
  if (latestMACD) {
    if (latestMACD.histogram > 0 && latestMACD.macd > latestMACD.signal) {
      bullishSignals++; details.macd = { status: 'BULLISH', histogram: latestMACD.histogram, reason: 'MACD above signal, positive histogram' };
    } else if (latestMACD.histogram < 0 && latestMACD.macd < latestMACD.signal) {
      bearishSignals++; details.macd = { status: 'BEARISH', histogram: latestMACD.histogram, reason: 'MACD below signal, negative histogram' };
    } else { details.macd = { status: 'NEUTRAL', histogram: latestMACD?.histogram, reason: 'MACD crossing' }; }
  }

  // ── Signal 3: EMA Golden/Death Cross
  if (goldenCross) { bullishSignals++; details.ema = { status: 'BULLISH', reason: 'Golden Cross: EMA20 > EMA50' }; }
  else if (deathCross) { bearishSignals++; details.ema = { status: 'BEARISH', reason: 'Death Cross: EMA20 < EMA50' }; }
  else { details.ema = { status: 'NEUTRAL', reason: 'No crossover' }; }

  // ── Signal 4: Bollinger Bands
  if (latestBB) {
    if (latestClose <= latestBB.lower) { bullishSignals++; details.bollinger = { status: 'BULLISH', reason: 'Price at lower band (oversold)', squeeze: latestBB.squeeze }; }
    else if (latestClose >= latestBB.upper) { bearishSignals++; details.bollinger = { status: 'BEARISH', reason: 'Price at upper band (overbought)', squeeze: latestBB.squeeze }; }
    else if (latestBB.squeeze) { bullishSignals += 0.5; details.bollinger = { status: 'SQUEEZE', reason: 'Bollinger Squeeze - breakout imminent', squeeze: true }; }
    else { details.bollinger = { status: 'NEUTRAL', reason: 'Price within bands', squeeze: false }; }
  }

  // ── Signal 5: ATR (Volatility / Risk)
  const atrPct = latestClose > 0 ? (latestATR / latestClose) * 100 : 1;
  details.atr = { value: +latestATR.toFixed(2), pct: +atrPct.toFixed(2), highVol: atrPct > 2.5 };

  // ── Signal 6: ADX (Trend Strength)
  if (latestADX) {
    if (latestADX.adx > 25 && latestADX.plusDI > latestADX.minusDI) {
      bullishSignals++; details.adx = { status: 'BULLISH', adx: latestADX.adx, reason: 'Strong uptrend (ADX>25, +DI>-DI)' };
    } else if (latestADX.adx > 25 && latestADX.minusDI > latestADX.plusDI) {
      bearishSignals++; details.adx = { status: 'BEARISH', adx: latestADX.adx, reason: 'Strong downtrend (ADX>25, -DI>+DI)' };
    } else { details.adx = { status: 'NEUTRAL', adx: latestADX?.adx, reason: 'Weak trend (ADX<25)' }; }
  }

  // ── Signal 7: Stochastic
  if (latestStoch) {
    if (latestStoch.k < 20 && latestStoch.d < 20) { bullishSignals++; details.stochastic = { status: 'BULLISH', k: latestStoch.k, d: latestStoch.d, reason: 'Stochastic oversold (<20)' }; }
    else if (latestStoch.k > 80 && latestStoch.d > 80) { bearishSignals++; details.stochastic = { status: 'BEARISH', k: latestStoch.k, d: latestStoch.d, reason: 'Stochastic overbought (>80)' }; }
    else { details.stochastic = { status: 'NEUTRAL', k: latestStoch?.k, d: latestStoch?.d, reason: 'Neutral range' }; }
  }

  // ── Signal 8: Volume Profile
  if (volumeProfile.highVolumeDay && volumeProfile.volumeRatio > 1.5) {
    bullishSignals += 0.5; details.volume = { status: 'BULLISH', ratio: volumeProfile.volumeRatio, reason: 'High volume confirms move' };
  } else if (volumeProfile.volumeRatio < 0.5) {
    details.volume = { status: 'WEAK', ratio: volumeProfile.volumeRatio, reason: 'Low volume - weak signal' };
  } else { details.volume = { status: 'NEUTRAL', ratio: volumeProfile.volumeRatio, reason: 'Normal volume' }; }

  // RSI Divergence bonus
  if (rsDiv.bullish) { bullishSignals++; details.divergence = { type: 'BULLISH', reason: 'Bullish RSI divergence detected' }; }
  else if (rsDiv.bearish) { bearishSignals++; details.divergence = { type: 'BEARISH', reason: 'Bearish RSI divergence detected' }; }
  else { details.divergence = { type: 'NONE', reason: 'No divergence' }; }

  // SMA200 filter (Regime filter)
  if (aboveSMA200) bullishSignals += 0.5;
  else bearishSignals += 0.5;

  // REGIME FILTER: Never buy in TRENDING_DOWN (critical rule from bot)
  const regimeBlocksBuy = regime === MarketRegime.TRENDING_DOWN || regime === MarketRegime.BEAR_TRENDING;
  const marketCrash = marketState === MarketState.CRASH;

  // Determine final signal
  const totalBull = bullishSignals;
  const totalBear = bearishSignals;
  const netScore = totalBull - totalBear;
  const maxSignals = 9;
  const confidence = +Math.min(100, Math.abs(netScore) / maxSignals * 100 + 35).toFixed(1);

  let signal;
  if (marketCrash || regimeBlocksBuy) {
    if (netScore < -1) signal = Signal.STRONG_SELL;
    else if (netScore < 0) signal = Signal.SELL;
    else signal = Signal.HOLD;
  } else if (netScore >= 3.5) {
    signal = Signal.STRONG_BUY;
  } else if (netScore >= 1.5) {
    signal = Signal.BUY;
  } else if (netScore <= -3) {
    signal = Signal.STRONG_SELL;
  } else if (netScore <= -1.5) {
    signal = Signal.SELL;
  } else {
    signal = Signal.HOLD;
  }

  // Target & Stop Loss
  const stopLoss = calculateDynamicStopLoss(latestClose, latestATR);
  const profitTarget1 = fibLevels?.target_382 ?? +(latestClose * 1.038).toFixed(2);
  const profitTarget2 = fibLevels?.target_618 ?? +(latestClose * 1.062).toFixed(2);
  const profitTarget3 = fibLevels?.target_100 ?? +(latestClose * 1.10).toFixed(2);
  const riskReward = stopLoss > 0 ? +((profitTarget2 - latestClose) / (latestClose - stopLoss)).toFixed(2) : 0;
  const profitScore = +Math.min(10, Math.max(0, netScore * 1.2 + 3)).toFixed(1);

  return {
    signal,
    confirmations: Math.round(Math.max(totalBull, totalBear) * 2) / 2,
    bullishSignals: +totalBull.toFixed(1),
    bearishSignals: +totalBear.toFixed(1),
    confidence,
    details,
    indicators: { rsi: latestRSI, macd: latestMACD, bb: latestBB, atr: latestATR, adx: latestADX, stoch: latestStoch },
    marketState,
    regime,
    divergence: rsDiv,
    fibonacci: fibLevels,
    support: support.slice(-3),
    resistance: resistance.slice(-3),
    stopLoss,
    profitTarget1,
    profitTarget2,
    profitTarget3,
    riskReward,
    profitScore,
    goldenCross,
    deathCross,
    volumeProfile,
    aboveSMA200,
  };
}

// ─────────────────────────────────────────────────────────────
// MULTI-TIMEFRAME CONFLUENCE (1m, 5m, 15m simulation)
// ─────────────────────────────────────────────────────────────
export function multiTimeframeConfluence(ohlcv) {
  if (!ohlcv || ohlcv.length < 20) return { confluence: 'NEUTRAL', score: 0 };

  // Simulate timeframes by resampling (aggregate every N bars)
  function resample(data, n) {
    const out = [];
    for (let i = n - 1; i < data.length; i += n) {
      const slice = data.slice(i - n + 1, i + 1);
      out.push({
        date: data[i].date,
        open: slice[0].open,
        high: Math.max(...slice.map(d => d.high)),
        low: Math.min(...slice.map(d => d.low)),
        close: slice[slice.length - 1].close,
        volume: slice.reduce((a, d) => a + d.volume, 0),
      });
    }
    return out;
  }

  const tf1 = ohlcv.slice(-20); // 1m
  const tf5 = resample(ohlcv, 5); // 5m
  const tf15 = resample(ohlcv, 15); // 15m

  function quickTrend(data) {
    if (data.length < 5) return 0;
    const c = data.map(d => d.close);
    const em5 = ema(c, Math.min(5, c.length));
    const em10 = ema(c, Math.min(10, c.length));
    const last5 = em5[em5.length - 1];
    const last10 = em10[em10.length - 1];
    return last5 > last10 ? 1 : last5 < last10 ? -1 : 0;
  }

  const t1 = quickTrend(tf1);
  const t5 = quickTrend(tf5);
  const t15 = quickTrend(tf15);
  const score = t1 + t5 + t15;

  let confluence;
  if (score >= 2) confluence = 'BULLISH';
  else if (score <= -2) confluence = 'BEARISH';
  else if (score > 0) confluence = 'SLIGHTLY_BULLISH';
  else if (score < 0) confluence = 'SLIGHTLY_BEARISH';
  else confluence = 'NEUTRAL';

  return { confluence, score, t1m: t1, t5m: t5, t15m: t15 };
}

// ─────────────────────────────────────────────────────────────
// GENERATE PLAIN-ENGLISH REASONING
// ─────────────────────────────────────────────────────────────
export function generateSignalReasoning(analysis) {
  const { signal, details, marketState, regime, divergence, confirmations, riskReward, confluence } = analysis;

  const lines = [];

  if (marketState === MarketState.CRASH) lines.push('⚠️ Market in CRASH state — extreme caution warranted.');
  else if (marketState === MarketState.VOLATILE) lines.push('⚡ Market is VOLATILE — tighten risk parameters.');
  else if (marketState === MarketState.RECOVERY) lines.push('🔄 Market in RECOVERY phase — cautious re-entry possible.');

  if (details.rsi?.status === 'BULLISH') lines.push(`📊 RSI at ${details.rsi.value?.toFixed(1)} — oversold, reversal likely.`);
  else if (details.rsi?.status === 'BEARISH') lines.push(`📊 RSI at ${details.rsi.value?.toFixed(1)} — overbought, pullback risk.`);

  if (details.macd?.status === 'BULLISH') lines.push(`📈 MACD bullish crossover with positive histogram (${details.macd.histogram?.toFixed(2)}).`);
  else if (details.macd?.status === 'BEARISH') lines.push(`📉 MACD bearish crossover with negative histogram (${details.macd.histogram?.toFixed(2)}).`);

  if (details.ema?.status === 'BULLISH') lines.push('✅ Golden Cross confirmed: EMA20 crossed above EMA50.');
  else if (details.ema?.status === 'BEARISH') lines.push('❌ Death Cross: EMA20 below EMA50 — bearish trend.');

  if (details.bollinger?.squeeze) lines.push('🎯 Bollinger Squeeze detected — explosive breakout imminent.');
  else if (details.bollinger?.status === 'BULLISH') lines.push('📊 Price at lower Bollinger Band — mean reversion expected.');
  else if (details.bollinger?.status === 'BEARISH') lines.push('📊 Price at upper Bollinger Band — overbought zone.');

  if (details.adx?.status === 'BULLISH') lines.push(`💪 ADX at ${details.adx.adx?.toFixed(1)} — strong uptrend with +DI > -DI.`);
  else if (details.adx?.status === 'BEARISH') lines.push(`💪 ADX at ${details.adx.adx?.toFixed(1)} — strong downtrend with -DI > +DI.`);

  if (details.stochastic?.status === 'BULLISH') lines.push(`⚡ Stochastic K(${details.stochastic.k?.toFixed(0)}) oversold — momentum reversal.`);
  else if (details.stochastic?.status === 'BEARISH') lines.push(`⚡ Stochastic K(${details.stochastic.k?.toFixed(0)}) overbought — momentum declining.`);

  if (divergence?.bullish) lines.push('🔍 Bullish RSI Divergence: Price lower low, RSI higher low — strong reversal signal.');
  else if (divergence?.bearish) lines.push('🔍 Bearish RSI Divergence: Price higher high, RSI lower high — weakening momentum.');

  if (details.volume?.status === 'BULLISH') lines.push(`📦 Volume ${details.volume.ratio?.toFixed(1)}x avg — high volume confirms the move.`);

  if (regime === MarketRegime.BULL_TRENDING) lines.push('🐂 Market regime: BULL TRENDING — ride the trend.');
  else if (regime === MarketRegime.BEAR_TRENDING) lines.push('🐻 Market regime: BEAR TRENDING — avoid longs.');
  else if (regime === MarketRegime.TRENDING_DOWN) lines.push('⬇️ Regime filter: TRENDING DOWN — bot blocks new buys.');

  if (riskReward > 0) lines.push(`⚖️ Risk/Reward ratio: ${riskReward}:1`);
  lines.push(`🎯 Signal confirmations: ${confirmations}/8`);

  return lines.join(' ');
}