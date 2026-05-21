// Pre-seeded NIFTY 50 stocks with realistic OHLCV data
// This simulates historical data as required by the problem statement

function generateOHLCV(basePrice, days = 30, volatility = 0.02) {
  const data = [];
  let price = basePrice;
  const startDate = new Date('2025-04-15');
  
  // Create a multi-phase trend for visual interest
  // Phase 1: initial move, Phase 2: correction/dip, Phase 3: recovery/boom
  const phases = [
    { startDay: 0, endDay: days * 0.3, dailyBias: 0.003 },
    { startDay: days * 0.3, endDay: days * 0.55, dailyBias: -0.004 },
    { startDay: days * 0.55, endDay: days * 0.75, dailyBias: 0.002 },
    { startDay: days * 0.75, endDay: days * 0.9, dailyBias: -0.001 },
    { startDay: days * 0.9, endDay: days, dailyBias: 0.005 },
  ];

  let idx = 0;
  for (let i = 0; idx < days; i++) {
    const date = new Date(startDate);
    date.setDate(date.getDate() + i);
    if (date.getDay() === 0 || date.getDay() === 6) continue;

    const phase = phases.find(p => idx >= p.startDay && idx < p.endDay) || phases[phases.length - 1];
    
    const noise = (Math.random() - 0.5) * volatility * price;
    const drift = phase.dailyBias * price;
    const change = drift + noise;
    
    const open = +(price + (Math.random() - 0.5) * volatility * price * 0.3).toFixed(2);
    const close = +(price + change).toFixed(2);
    const high = +(Math.max(open, close) + Math.random() * volatility * price * 0.4).toFixed(2);
    const low = +(Math.min(open, close) - Math.random() * volatility * price * 0.4).toFixed(2);
    const volume = Math.floor(800000 + Math.random() * 12000000);
    
    data.push({
      date: date.toISOString().split('T')[0],
      open, high, low, close, volume
    });
    price = close;
    idx++;
  }
  return data;
}

export const STOCK_SEED_DATA = [
  {
    symbol: "RELIANCE", name: "Reliance Industries Ltd", sector: "Energy",
    current_price: 2945.60, market_cap: "Large Cap", pe_ratio: 28.5, dividend_yield: 0.34,
    week_52_high: 3217.60, week_52_low: 2220.30, risk_level: "Medium",
    signal: "BUY", signal_reasoning: "RSI at 42 indicates the stock is neither overbought nor oversold. The 20-day SMA has crossed above the 50-day SMA forming a Golden Cross — a classic bullish signal. Strong quarterly results with 18% YoY revenue growth in retail and telecom segments support upside momentum.",
    suitability_conservative: 72, suitability_moderate: 88, suitability_aggressive: 75,
    description: "India's largest conglomerate with interests in petrochemicals, retail, telecom (Jio), and digital services.",
    ohlcv_data: generateOHLCV(2850, 30, 0.015)
  },
  {
    symbol: "TCS", name: "Tata Consultancy Services", sector: "IT",
    current_price: 3892.45, market_cap: "Large Cap", pe_ratio: 32.1, dividend_yield: 1.18,
    week_52_high: 4243.80, week_52_low: 3311.00, risk_level: "Low",
    signal: "HOLD", signal_reasoning: "MACD histogram is flattening near zero line, suggesting consolidation. The stock trades near its 50-day moving average. IT sector faces headwinds from US spending cuts, but TCS's diversified client base provides stability. Wait for breakout above ₹4,000 for fresh entry.",
    suitability_conservative: 90, suitability_moderate: 78, suitability_aggressive: 55,
    description: "India's largest IT services company and a global leader in consulting, technology, and digital solutions.",
    ohlcv_data: generateOHLCV(3800, 30, 0.012)
  },
  {
    symbol: "HDFCBANK", name: "HDFC Bank Ltd", sector: "Banking",
    current_price: 1842.30, market_cap: "Large Cap", pe_ratio: 20.8, dividend_yield: 1.12,
    week_52_high: 1880.00, week_52_low: 1430.00, risk_level: "Low",
    signal: "STRONG_BUY", signal_reasoning: "The stock has broken above its 200-day SMA with rising volumes — a strong bullish confirmation. RSI at 58 shows room for upside. HDFC Bank posted record net profit with improving NIM (Net Interest Margins). The merger synergies are fully priced in, making this a value pick.",
    suitability_conservative: 95, suitability_moderate: 90, suitability_aggressive: 70,
    description: "India's largest private sector bank with a strong retail franchise and consistent growth track record.",
    ohlcv_data: generateOHLCV(1780, 30, 0.013)
  },
  {
    symbol: "INFY", name: "Infosys Ltd", sector: "IT",
    current_price: 1578.90, market_cap: "Large Cap", pe_ratio: 27.3, dividend_yield: 2.45,
    week_52_high: 1988.50, week_52_low: 1352.60, risk_level: "Low",
    signal: "BUY", signal_reasoning: "RSI has bounced from oversold territory (32→48). The stock is at 52-week support with strong dividend yield of 2.45%. AI/cloud deals pipeline is robust. The price-to-book ratio of 8.2 is below 3-year average. Good entry point for long-term investors.",
    suitability_conservative: 85, suitability_moderate: 82, suitability_aggressive: 60,
    description: "Global leader in next-generation digital services and consulting, enabling clients across 56 countries.",
    ohlcv_data: generateOHLCV(1520, 30, 0.018)
  },
  {
    symbol: "ICICIBANK", name: "ICICI Bank Ltd", sector: "Banking",
    current_price: 1312.75, market_cap: "Large Cap", pe_ratio: 18.2, dividend_yield: 0.78,
    week_52_high: 1362.35, week_52_low: 1045.00, risk_level: "Low",
    signal: "BUY", signal_reasoning: "Bollinger Bands show a squeeze pattern indicating an imminent breakout. Price above all major moving averages. Consistent 20%+ ROE over 8 quarters. Asset quality remains strong with GNPA at 2.16%. Best-in-class banking stock for steady compounding.",
    suitability_conservative: 88, suitability_moderate: 85, suitability_aggressive: 68,
    description: "India's second-largest private sector bank with a strong presence across banking and financial services.",
    ohlcv_data: generateOHLCV(1280, 30, 0.014)
  },
  {
    symbol: "BHARTIARTL", name: "Bharti Airtel Ltd", sector: "Telecom",
    current_price: 1685.20, market_cap: "Large Cap", pe_ratio: 78.5, dividend_yield: 0.48,
    week_52_high: 1779.00, week_52_low: 1200.00, risk_level: "Medium",
    signal: "HOLD", signal_reasoning: "MACD is in bullish territory but momentum is weakening. High PE ratio of 78.5x makes valuation rich. However, ARPU growth from tariff hikes and 5G monetization provide long-term tailwinds. Accumulate on dips below ₹1,600.",
    suitability_conservative: 60, suitability_moderate: 75, suitability_aggressive: 72,
    description: "India's leading telecom operator with growing digital TV, data center, and enterprise businesses.",
    ohlcv_data: generateOHLCV(1650, 30, 0.016)
  },
  {
    symbol: "SBIN", name: "State Bank of India", sector: "Banking",
    current_price: 812.45, market_cap: "Large Cap", pe_ratio: 10.2, dividend_yield: 1.65,
    week_52_high: 912.10, week_52_low: 680.00, risk_level: "Medium",
    signal: "STRONG_BUY", signal_reasoning: "Trading at a significant discount to book value (P/B 1.8x vs sector avg 2.5x). RSI at 38 suggests oversold conditions. SBI's net NPA at 0.57% is at historical lows. Government capex spending will boost corporate loan growth. Dividend yield of 1.65% provides downside protection.",
    suitability_conservative: 78, suitability_moderate: 90, suitability_aggressive: 82,
    description: "India's largest public sector bank with the widest branch network and growing digital banking capabilities.",
    ohlcv_data: generateOHLCV(790, 30, 0.018)
  },
  {
    symbol: "ITC", name: "ITC Ltd", sector: "FMCG",
    current_price: 438.25, market_cap: "Large Cap", pe_ratio: 26.8, dividend_yield: 3.12,
    week_52_high: 500.00, week_52_low: 390.00, risk_level: "Low",
    signal: "BUY", signal_reasoning: "ITC's demerger of hotel business is a positive catalyst. Highest dividend yield (3.12%) among Nifty stocks. FMCG segment growing at 12% CAGR. RSI at 45 with price near 200-day SMA support. Excellent risk-reward for income-seeking conservative investors.",
    suitability_conservative: 92, suitability_moderate: 80, suitability_aggressive: 50,
    description: "Diversified conglomerate with leading positions in FMCG, hotels, paperboards, packaging, and agri-business.",
    ohlcv_data: generateOHLCV(430, 30, 0.012)
  },
  {
    symbol: "TATAMOTORS", name: "Tata Motors Ltd", sector: "Auto",
    current_price: 742.80, market_cap: "Large Cap", pe_ratio: 8.5, dividend_yield: 0.35,
    week_52_high: 1066.00, week_52_low: 620.00, risk_level: "High",
    signal: "SELL", signal_reasoning: "Stock has formed a Death Cross (50-day SMA below 200-day SMA). JLR margins under pressure from EV transition costs. Volume decline of 15% in domestic CV segment. RSI at 35 but no reversal signal yet. Avoid until price stabilizes above ₹780.",
    suitability_conservative: 25, suitability_moderate: 45, suitability_aggressive: 70,
    description: "India's largest auto manufacturer, owner of Jaguar Land Rover, leading in EV transition with Nexon, Punch EV.",
    ohlcv_data: generateOHLCV(780, 30, 0.025)
  },
  {
    symbol: "WIPRO", name: "Wipro Ltd", sector: "IT",
    current_price: 462.30, market_cap: "Large Cap", pe_ratio: 22.8, dividend_yield: 0.22,
    week_52_high: 570.00, week_52_low: 380.00, risk_level: "Medium",
    signal: "HOLD", signal_reasoning: "Wipro underperforms IT peers. Revenue growth guidance of 1-3% is below industry average. However, AI-led deals are improving. Stock trades at 22.8x PE — cheaper than TCS/Infy. Wait for turnaround signals in Q2 earnings.",
    suitability_conservative: 55, suitability_moderate: 60, suitability_aggressive: 55,
    description: "Global IT, consulting, and business process services company with operations across 66 countries.",
    ohlcv_data: generateOHLCV(450, 30, 0.02)
  },
  {
    symbol: "SUNPHARMA", name: "Sun Pharmaceutical Industries", sector: "Pharma",
    current_price: 1825.40, market_cap: "Large Cap", pe_ratio: 38.2, dividend_yield: 0.55,
    week_52_high: 1960.00, week_52_low: 1398.00, risk_level: "Medium",
    signal: "BUY", signal_reasoning: "Specialty portfolio (Ilumya, Cequa) growing at 30%+ in US markets. MACD shows bullish crossover. RSI at 52 is neutral with upside potential. R&D pipeline has 3 drugs in Phase-3 trials. Pharma sector benefits from defensive positioning during market volatility.",
    suitability_conservative: 70, suitability_moderate: 82, suitability_aggressive: 68,
    description: "India's largest pharma company, 4th largest specialty generics company globally.",
    ohlcv_data: generateOHLCV(1780, 30, 0.017)
  },
  {
    symbol: "MARUTI", name: "Maruti Suzuki India Ltd", sector: "Auto",
    current_price: 12450.60, market_cap: "Large Cap", pe_ratio: 30.5, dividend_yield: 0.72,
    week_52_high: 13680.00, week_52_low: 10440.00, risk_level: "Medium",
    signal: "HOLD", signal_reasoning: "Auto sales volume up 8% YoY but ASP growth is slowing. SUV mix at 55% is positive for margins. EV entry delayed to 2025. RSI at 55 and price consolidating between ₹12,000-13,000. Hold for long-term; EV catalyst may rerate stock.",
    suitability_conservative: 65, suitability_moderate: 72, suitability_aggressive: 58,
    description: "India's largest passenger car manufacturer with over 42% market share. Subsidiary of Suzuki Motor Corporation.",
    ohlcv_data: generateOHLCV(12200, 30, 0.014)
  },
  {
    symbol: "TATASTEEL", name: "Tata Steel Ltd", sector: "Metals",
    current_price: 152.35, market_cap: "Large Cap", pe_ratio: 55.0, dividend_yield: 2.35,
    week_52_high: 184.60, week_52_low: 120.00, risk_level: "High",
    signal: "SELL", signal_reasoning: "Global steel prices declining 12% QoQ. European operations continue to bleed with £800M annual losses. RSI at 28 is oversold but no volume-backed recovery seen. China dumping fears persist. Avoid until European restructuring clarity emerges.",
    suitability_conservative: 20, suitability_moderate: 35, suitability_aggressive: 60,
    description: "India's largest steel producer with integrated operations across mining, steel manufacturing, and distribution.",
    ohlcv_data: generateOHLCV(160, 30, 0.03)
  },
  {
    symbol: "BAJFINANCE", name: "Bajaj Finance Ltd", sector: "Financial Services",
    current_price: 8742.50, market_cap: "Large Cap", pe_ratio: 35.2, dividend_yield: 0.40,
    week_52_high: 9545.00, week_52_low: 6188.00, risk_level: "Medium",
    signal: "STRONG_BUY", signal_reasoning: "AUM growth at 34% YoY is industry-leading. New customer additions at 4.5M/quarter. MACD bullish crossover with rising histogram. RSI at 48 leaves room for rally. Fintech pivot with app-based lending driving operating leverage. Premium valuation justified by growth.",
    suitability_conservative: 55, suitability_moderate: 85, suitability_aggressive: 92,
    description: "India's largest NBFC with diversified lending portfolio across consumer, SME, commercial, and rural segments.",
    ohlcv_data: generateOHLCV(8500, 30, 0.018)
  },
  {
    symbol: "HCLTECH", name: "HCL Technologies Ltd", sector: "IT",
    current_price: 1645.80, market_cap: "Large Cap", pe_ratio: 25.6, dividend_yield: 3.52,
    week_52_high: 2000.00, week_52_low: 1380.00, risk_level: "Low",
    signal: "BUY", signal_reasoning: "Highest dividend yield in IT sector (3.52%). Strong services deal pipeline with $2.8B TCV in latest quarter. Price near 52-week support. RSI at 40 suggests recovery potential. AI services business growing at 45%+ making it a value pick in IT space.",
    suitability_conservative: 82, suitability_moderate: 80, suitability_aggressive: 62,
    description: "Third-largest Indian IT services company with strengths in engineering R&D and infrastructure management.",
    ohlcv_data: generateOHLCV(1600, 30, 0.016)
  },
  {
    symbol: "ADANIENT", name: "Adani Enterprises Ltd", sector: "Infrastructure",
    current_price: 2380.90, market_cap: "Large Cap", pe_ratio: 72.0, dividend_yield: 0.05,
    week_52_high: 3480.00, week_52_low: 2025.00, risk_level: "High",
    signal: "HOLD", signal_reasoning: "High volatility stock with beta of 1.8. New airport and green hydrogen businesses provide long-term optionality. However, PE of 72x with thin margins makes valuation stretched. Suitable only for high-risk appetite investors with 5+ year horizon.",
    suitability_conservative: 15, suitability_moderate: 40, suitability_aggressive: 78,
    description: "Flagship Adani Group company with interests in airports, data centers, roads, green hydrogen, and mining.",
    ohlcv_data: generateOHLCV(2300, 30, 0.028)
  },
  {
    symbol: "LTIM", name: "LTIMindtree Ltd", sector: "IT",
    current_price: 5245.30, market_cap: "Large Cap", pe_ratio: 34.8, dividend_yield: 1.15,
    week_52_high: 6360.00, week_52_low: 4582.00, risk_level: "Medium",
    signal: "BUY", signal_reasoning: "Post-merger integration complete. Deal wins up 22% YoY. MACD bullish divergence forming on daily chart. Price near strong support zone ₹5,100-5,200. Digital engineering segment growing at 25%. AI and cloud deals pipeline is strongest among mid-tier IT.",
    suitability_conservative: 62, suitability_moderate: 78, suitability_aggressive: 72,
    description: "Top-5 Indian IT company formed by merger of L&T Infotech and Mindtree, specializing in digital engineering.",
    ohlcv_data: generateOHLCV(5100, 30, 0.019)
  },
  {
    symbol: "NESTLEIND", name: "Nestle India Ltd", sector: "FMCG",
    current_price: 2348.70, market_cap: "Large Cap", pe_ratio: 72.5, dividend_yield: 1.38,
    week_52_high: 2778.00, week_52_low: 2142.00, risk_level: "Low",
    signal: "HOLD", signal_reasoning: "Defensive stock with consistent 15% CAGR earnings growth. However, valuation at 72.5x PE is expensive. Volume growth at 7.8% is healthy. Maggi, KitKat brands have strong pricing power. Good for SIP-based accumulation rather than lump sum entry.",
    suitability_conservative: 80, suitability_moderate: 65, suitability_aggressive: 35,
    description: "India's largest food company, part of Nestle SA. Market leader in noodles, coffee, dairy, and confectionery.",
    ohlcv_data: generateOHLCV(2300, 30, 0.01)
  },
  {
    symbol: "POWERGRID", name: "Power Grid Corporation", sector: "Energy",
    current_price: 315.40, market_cap: "Large Cap", pe_ratio: 18.5, dividend_yield: 4.20,
    week_52_high: 357.00, week_52_low: 252.00, risk_level: "Low",
    signal: "STRONG_BUY", signal_reasoning: "Highest dividend yield (4.2%) among Nifty stocks. Government capex on transmission infrastructure provides revenue visibility. ROE consistently above 18%. RSI at 44 with price above 200-day SMA. Perfect defensive pick for conservative investors seeking income.",
    suitability_conservative: 95, suitability_moderate: 75, suitability_aggressive: 40,
    description: "India's largest electric power transmission company, operating one of the world's largest transmission networks.",
    ohlcv_data: generateOHLCV(308, 30, 0.012)
  },
  {
    symbol: "ZOMATO", name: "Zomato Ltd", sector: "IT",
    current_price: 245.60, market_cap: "Large Cap", pe_ratio: 320.0, dividend_yield: 0.0,
    week_52_high: 304.50, week_52_low: 125.00, risk_level: "High",
    signal: "SELL", signal_reasoning: "Extreme valuation at 320x PE despite first-time profitability. Quick commerce (Blinkit) is cash-burning growth story. RSI at 62 approaching overbought. Competitive intensity from Swiggy, BigBasket increasing. Book profits; re-enter below ₹200 for long-term play.",
    suitability_conservative: 10, suitability_moderate: 35, suitability_aggressive: 75,
    description: "India's leading food delivery and quick commerce platform. Blinkit acquisition driving growth in instant delivery.",
    ohlcv_data: generateOHLCV(240, 30, 0.03)
  }
];

// Technical indicator calculations
export function calculateSMA(data, period) {
  const result = [];
  for (let i = period - 1; i < data.length; i++) {
    const sum = data.slice(i - period + 1, i + 1).reduce((a, b) => a + b.close, 0);
    result.push({ date: data[i].date, value: +(sum / period).toFixed(2) });
  }
  return result;
}

export function calculateRSI(data, period = 14) {
  if (data.length < period + 1) return [];
  const changes = [];
  for (let i = 1; i < data.length; i++) {
    changes.push(data[i].close - data[i - 1].close);
  }
  
  let avgGain = 0, avgLoss = 0;
  for (let i = 0; i < period; i++) {
    if (changes[i] > 0) avgGain += changes[i];
    else avgLoss += Math.abs(changes[i]);
  }
  avgGain /= period;
  avgLoss /= period;
  
  const result = [];
  const rs = avgLoss === 0 ? 100 : avgGain / avgLoss;
  result.push({ date: data[period].date, value: +(100 - 100 / (1 + rs)).toFixed(2) });
  
  for (let i = period; i < changes.length; i++) {
    avgGain = (avgGain * (period - 1) + (changes[i] > 0 ? changes[i] : 0)) / period;
    avgLoss = (avgLoss * (period - 1) + (changes[i] < 0 ? Math.abs(changes[i]) : 0)) / period;
    const rs = avgLoss === 0 ? 100 : avgGain / avgLoss;
    result.push({ date: data[i + 1].date, value: +(100 - 100 / (1 + rs)).toFixed(2) });
  }
  return result;
}

export function getSignalColor(signal) {
  const colors = {
    STRONG_BUY: "text-emerald-600 bg-emerald-50 border-emerald-200",
    BUY: "text-green-600 bg-green-50 border-green-200",
    HOLD: "text-amber-600 bg-amber-50 border-amber-200",
    SELL: "text-orange-600 bg-orange-50 border-orange-200",
    STRONG_SELL: "text-red-600 bg-red-50 border-red-200",
  };
  return colors[signal] || colors.HOLD;
}

export function getRiskColor(risk) {
  const colors = {
    Low: "text-emerald-600 bg-emerald-50",
    Medium: "text-amber-600 bg-amber-50",
    High: "text-red-600 bg-red-50",
  };
  return colors[risk] || colors.Medium;
}

export function formatCurrency(amount) {
  if (amount >= 10000000) return `₹${(amount / 10000000).toFixed(2)} Cr`;
  if (amount >= 100000) return `₹${(amount / 100000).toFixed(2)} L`;
  return `₹${amount?.toLocaleString('en-IN', { maximumFractionDigits: 2 })}`;
}

export function formatNumber(num) {
  return num?.toLocaleString('en-IN', { maximumFractionDigits: 2 });
}

export function calculateMACD(data, fast = 12, slow = 26, signal = 9) {
  if (data.length < slow + signal) return [];
  
  function ema(prices, period) {
    const k = 2 / (period + 1);
    let emaVal = prices[0];
    return prices.map(p => { emaVal = p * k + emaVal * (1 - k); return +emaVal.toFixed(2); });
  }
  
  const closes = data.map(d => d.close);
  const emaFast = ema(closes, fast);
  const emaSlow = ema(closes, slow);
  const macdLine = emaFast.map((v, i) => +(v - emaSlow[i]).toFixed(2));
  const macdSignal = ema(macdLine.slice(slow - 1), signal);
  
  const result = [];
  for (let i = slow - 1 + signal - 1; i < data.length; i++) {
    const idx = i - (slow - 1 + signal - 1);
    const macd = macdLine[i];
    const sig = macdSignal[idx];
    result.push({
      date: data[i].date,
      macd,
      signal: sig,
      histogram: +(macd - sig).toFixed(2),
    });
  }
  return result;
}

export function calculateBollingerBands(data, period = 20, stdDev = 2) {
  const result = [];
  for (let i = period - 1; i < data.length; i++) {
    const slice = data.slice(i - period + 1, i + 1);
    const mean = slice.reduce((a, b) => a + b.close, 0) / period;
    const variance = slice.reduce((a, b) => a + Math.pow(b.close - mean, 2), 0) / period;
    const sd = Math.sqrt(variance);
    result.push({
      date: data[i].date,
      middle: +mean.toFixed(2),
      upper: +(mean + stdDev * sd).toFixed(2),
      lower: +(mean - stdDev * sd).toFixed(2),
    });
  }
  return result;
}