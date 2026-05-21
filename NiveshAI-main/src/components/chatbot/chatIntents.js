import { formatCurrency } from '@/lib/stockData';

function calculateHealthScore(holdings, profile) {
  const totalVal = holdings.reduce((sum, h) => sum + h.currentVal, 0);
  const totalInv = holdings.reduce((sum, h) => sum + h.invested, 0);
  const pnl = totalVal - totalInv;
  const pnlPct = totalInv > 0 ? (pnl / totalInv) * 100 : 0;

  const sectorCounts = {};
  holdings.forEach(h => { sectorCounts[h.sector] = (sectorCounts[h.sector] || 0) + h.currentVal; });
  const maxSectorPct = Math.max(...Object.values(sectorCounts).map(v => totalVal > 0 ? v / totalVal : 0));

  const riskTolerance = profile?.risk_tolerance || 'moderate';
  let health = 70;

  if (pnl >= 5) health += 10;
  if (pnl >= 15) health += 10;
  if (pnl < -5) health -= 10;
  if (pnl < -15) health -= 20;
  if (maxSectorPct > 0.5) health -= 15;
  if (holdings.length >= 5) health += 10;
  if (riskTolerance === 'conservative' && maxSectorPct > 0.4) health -= 10;
  if (riskTolerance === 'aggressive' && maxSectorPct > 0.6) health -= 5;

  return Math.min(100, Math.max(0, health));
}

function calculateMonthlyInvestable(profile) {
  if (!profile) return 0;
  const income = Number(profile.monthly_income || 0);
  const expenses = Number(profile.monthly_expenses || 0);
  const savings = Number(profile.total_savings || 0);
  const surplus = income - expenses;

  let allocation = 0.2;
  if (profile.risk_tolerance === 'conservative') allocation = 0.1;
  if (profile.risk_tolerance === 'aggressive') allocation = 0.3;

  const investableFromSavings = savings * allocation;
  const investableFromSurplus = surplus * allocation;
  return investableFromSurplus + (investableFromSavings / 12);
}

function calculateWhatIf(symbol, qty, context) {
  const stock = context.stocks?.find(s => s.symbol === symbol);
  if (!stock) return null;

  const numQty = Number(qty);
  const totalCost = numQty * stock.current_price;
  const currentHolding = context.holdings?.find(h => h.symbol === symbol);

  let newAvg = stock.current_price;
  let newTotalQty = numQty;
  if (currentHolding) {
    newTotalQty = currentHolding.qty + numQty;
    newAvg = (currentHolding.avgPrice * currentHolding.qty + totalCost) / newTotalQty;
  }

  const investable = calculateMonthlyInvestable(context.profile);
  const canAfford = investable >= totalCost;

  return {
    symbol,
    buyQty: numQty,
    buyPrice: stock.current_price,
    totalCost,
    newAvg,
    newTotalQty,
    investablePerMonth: investable,
    monthsToRecover: investable > 0 ? totalCost / investable : 0,
    canAfford,
    signal: stock.signal,
    reasoning: stock.signal_reasoning,
  };
}

function getDailyTip(context) {
  const profile = context.profile;
  const holdings = context.holdings || [];
  const watchlist = context.watchlist || [];
  const investable = calculateMonthlyInvestable(profile);

  const watchStock = watchlist.find(ws => {
    const s = context.stocks?.find(st => st.symbol === ws.symbol);
    return s && (s.signal === 'STRONG_BUY' || s.signal === 'BUY');
  });

  const fallbackStock = context.stocks?.find(s => s.signal === 'STRONG_BUY');
  const recStock = watchStock ? context.stocks?.find(s => s.symbol === watchStock.symbol) : fallbackStock;

  const tips = [];

  if (investable > 0) {
    tips.push(`You have about **${formatCurrency(investable)}** available to invest this month. That is a good starting point!`);
  } else {
    tips.push(`Your monthly expenses are close to your income. Focus on building your savings first. Even ₹500 per month can grow over time.`);
  }

  if (recStock) {
    tips.push(`**${recStock.name} (${recStock.symbol})** has a strong BUY signal right now. It might be worth adding to your watchlist.`);
  }

  if (holdings.length > 0) {
    const totalVal = holdings.reduce((sum, h) => sum + h.currentVal, 0);
    const totalInv = holdings.reduce((sum, h) => sum + h.invested, 0);
    const pnl = totalVal - totalInv;
    if (pnl < -5000) tips.push(`Your portfolio is down by ${formatCurrency(pnl)}. Do not panic — market dips are normal. Review your stocks before making any changes.`);
    if (pnl > 5000) tips.push(`Your portfolio is up by ${formatCurrency(pnl)}! Great job staying invested.`);

    // Check sector concentration
    const sectors = {};
    holdings.forEach(h => { sectors[h.sector] = (sectors[h.sector] || 0) + h.currentVal; });
    const topSector = Object.entries(sectors).sort((a, b) => b[1] - a[1])[0];
    if (topSector && topSector[1] / totalVal > 0.5) {
      tips.push(`You have **${topSector[0]}** making up over 50% of your portfolio. Consider diversifying into other sectors to spread risk.`);
    }
  }

  if (holdings.length < 3) {
    tips.push(`You currently own **${holdings.length} stock(s)**. Most experts suggest holding 5-8 different stocks to spread out risk.`);
  }

  return tips.join(' ');
}

function getRiskAnalysis(context) {
  const profile = context.profile;
  const holdings = context.holdings || [];
  const totalVal = holdings.reduce((sum, h) => sum + h.currentVal, 0);

  let riskScore = 0;
  let factors = [];

  if (totalVal > 500000) {
    riskScore += 20;
    factors.push({ text: 'Large portfolio size — bigger amounts mean bigger swings', type: 'risk' });
  }

  const sectorCounts = {};
  holdings.forEach(h => { if (h.sector) sectorCounts[h.sector] = (sectorCounts[h.sector] || 0) + 1; });
  const maxSector = Object.entries(sectorCounts).sort((a, b) => b[1] - a[1])[0];
  if (maxSector && maxSector[1] / holdings.length > 0.5) {
    riskScore += 25;
    factors.push({ text: `Too much in ${maxSector[0]} — if that sector dips, you will feel it`, type: 'risk' });
  }

  if (profile?.risk_tolerance === 'aggressive') {
    riskScore += 15;
    factors.push({ text: 'You chose aggressive investing — higher potential returns, but also higher ups and downs', type: 'risk' });
  }

  if (profile?.risk_tolerance === 'conservative') {
    riskScore -= 10;
    factors.push({ text: 'You chose conservative investing — lower risk, steady growth', type: 'good' });
  }

  if (holdings.length < 5) {
    riskScore += 10;
    factors.push({ text: `Only ${holdings.length} stocks — spreading across more stocks reduces risk`, type: 'risk' });
  } else {
    factors.push({ text: `Good diversification across ${holdings.length} stocks`, type: 'good' });
  }

  if (totalVal === 0) {
    riskScore = 0;
    factors = [{ text: 'No holdings yet — start with a small investment to get comfortable', type: 'good' }];
  }

  riskScore = Math.min(100, Math.max(0, riskScore));

  let level = 'Low';
  if (riskScore > 30) level = 'Moderate';
  if (riskScore > 60) level = 'High';

  return { score: Math.round(riskScore), level, factors };
}

function parseWhatIf(msg) {
  const matches = msg.match(/(\d+)\s+(?:shares?|qty|quantity)?\s*(?:of\s+)?(\w+)/i);
  if (matches) return { qty: parseInt(matches[1]), symbol: matches[2].toUpperCase() };

  const matches2 = msg.match(/buy\s+(\d+)\s+shares?\s+(?:of\s+)?(\w+)/i);
  if (matches2) return { qty: parseInt(matches2[1]), symbol: matches2[2].toUpperCase() };

  return null;
}

// Mock market news
const MARKET_NEWS = [
  { headline: "Nifty 50 hits new all-time high — what it means for you", summary: "The index crossed 25,000 for the first time. If you own index funds or large-cap stocks, your portfolio value just increased." },
  { headline: "RBI keeps interest rates unchanged — good news for home loans", summary: "EMIs on home and car loans will stay the same. Banking stocks may see a boost." },
  { headline: "IT sector reports strong quarterly growth", summary: "Infosys, TCS, and Wipro beat profit estimates. If you own IT stocks, check your portfolio." },
  { headline: "Government pushes renewable energy — which stocks to watch", summary: "Solar, wind, and green energy companies may benefit from new policy. Consider adding them to your watchlist." },
  { headline: "Gold prices rise — should you invest?", summary: "Gold is up 12% this year. It is a good hedge against inflation but remember: gold does not pay dividends like stocks." },
  { headline: "Foreign investors return to Indian markets", summary: "FIIs bought ₹15,000 crore worth of Indian stocks this month. This signals confidence in India's growth story." },
  { headline: "Small-cap stocks outperform — but be careful", summary: "Small-cap funds have given 25% returns this year. Higher returns come with higher risk — only invest what you can afford to hold long-term." },
  { headline: "New tax rules for stock investors — simplified", summary: "Profits from stocks held over 1 year are tax-free up to ₹1.25 lakh. Short-term gains are taxed at 15%. Always consult a CA for your specific situation." },
];

export function processChatMessage(message, context) {
  const lower = message.toLowerCase().trim();

  // ---- GREETING ----
  if (/^(hi|hello|hey|namaste|hola|good\s*(morning|afternoon|evening))/i.test(lower)) {
    const userName = context.profile?.full_name?.split(' ')[0] || 'there';
    const hasHoldings = (context.holdings || []).length > 0;
    return {
      type: 'text',
      content: `Hello ${userName}! 👋 I am your NiveshAI Portfolio Assistant.\n\nI can help you understand your investments in simple terms. Here is what you can ask me:\n\n` +
        `📊 **"Explain my portfolio"** — See a simple summary of what you own\n` +
        `💡 **"Give me a tip"** — Get a personalized tip for today\n` +
        `🎯 **"How risky is my portfolio?"** — Understand your risk level\n` +
        `📈 **"What should I buy?"** — Stock recommendations with simple reasoning\n` +
        `💰 **"What if I buy 10 shares of Reliance?"** — Simulate a purchase\n` +
        `📰 **"Market news"** — Latest headlines in simple language\n` +
        `🧮 **"My 50/30/20"** — See how your budget breaks down\n` +
        `🏥 **"Portfolio health"** — Check how healthy your investments are\n\n` +
        (hasHoldings ? `You own **${context.holdings.length} stocks** worth a total of ${formatCurrency(context.holdings.reduce((s, h) => s + h.currentVal, 0))}.` : `You don't own any stocks yet. I can help you find beginner-friendly options!`) +
        `\n\nType **help** any time to see what I can do.`
    };
  }

  // ---- HELP ----
  if (/^(help|commands|what can you do|what do you do)/i.test(lower)) {
    return { type: 'commands' };
  }

  // ---- INVESTMENT ADVICE ----
  if (lower.match(/(what should i (buy|invest)|suggest|recommend|where should i put money|good stock)/)) {
    const profile = context.profile;
    const suitableStocks = (context.stocks || [])
      .filter(s => {
        if (!profile) return s.signal === 'STRONG_BUY' || s.signal === 'BUY';
        if (profile.risk_tolerance === 'conservative') return s.suitability_conservative > 70;
        if (profile.risk_tolerance === 'aggressive') return s.suitability_aggressive > 70;
        return s.suitability_moderate > 70;
      })
      .slice(0, 4);

    if (!suitableStocks.length) {
      return { type: 'text', content: 'No strong buy signals at this moment. Keep watching your watchlist — when a stock you like drops, that can be a good entry point!' };
    }

    const riskLabel = profile?.risk_tolerance || 'moderate';

    return {
      type: 'recommendations',
      content: `Based on your **${riskLabel}** risk profile, here are some stocks to consider:`,
      stocks: suitableStocks.map(s => ({
        symbol: s.symbol,
        name: s.name,
        price: s.current_price,
        signal: s.signal,
        reasoning: s.signal_reasoning,
        suitability: profile?.risk_tolerance === 'conservative' ? s.suitability_conservative :
                     profile?.risk_tolerance === 'aggressive' ? s.suitability_aggressive : s.suitability_moderate,
      }))
    };
  }

  // ---- WHAT IF ----
  const whatIf = parseWhatIf(message);
  if (whatIf) {
    const result = calculateWhatIf(whatIf.symbol, whatIf.qty, context);
    if (!result) {
      return { type: 'text', content: `I could not find **${whatIf.symbol}** in our list of stocks. Please check the symbol and try again (for example: RELIANCE, TCS, INFY).` };
    }
    return {
      type: 'whatif',
      content: `Here is what happens if you buy **${result.buyQty} shares** of **${result.symbol}** at ${formatCurrency(result.buyPrice)} per share:`,
      result
    };
  }

  // ---- RISK SCORE ----
  if (lower.match(/(risk|how risky|risk score|how safe|am i too risky|risk level)/)) {
    const analysis = getRiskAnalysis(context);
    return {
      type: 'risk',
      content: `Your portfolio risk score is **${analysis.score}/100** — this means **${analysis.level} Risk**.`,
      analysis
    };
  }

  // ---- PORTFOLIO SUMMARY ----
  if (lower.match(/(portfolio|what do i own|summary|how am i doing|my stocks|holdings|overview|what i have)/)) {
    const holdings = context.holdings || [];
    if (!holdings.length) {
      return { type: 'text', content: 'You do not own any stocks yet! Head over to **Stocks** to see beginner-friendly options with clear BUY and SELL signals. Start with a small amount to get comfortable.' };
    }
    const totalVal = holdings.reduce((sum, h) => sum + h.currentVal, 0);
    const totalInv = holdings.reduce((sum, h) => sum + h.invested, 0);
    const pnl = totalVal - totalInv;
    const upStocks = holdings.filter(h => h.pnl > 0).length;
    const downStocks = holdings.filter(h => h.pnl < 0).length;
    const topStock = holdings.sort((a, b) => b.currentVal - a.currentVal)[0];

    return {
      type: 'summary',
      content: `**Your Portfolio Summary**\n\n` +
        `You own **${holdings.length} stock(s)** worth **${formatCurrency(totalVal)}**.\n` +
        `You invested **${formatCurrency(totalInv)}** in total.\n` +
        `Your profit/loss: **${pnl >= 0 ? '+' : ''}${formatCurrency(pnl)}** (${pnl >= 0 ? '+' : ''}${((pnl / totalInv) * 100).toFixed(2)}%)\n\n` +
        `**${upStocks}** stock(s) are making profit ✅\n` +
        `**${downStocks}** stock(s) are showing loss 📉\n\n` +
        `Your biggest holding is **${topStock?.symbol}** worth ${formatCurrency(topStock?.currentVal)}.`,
      totalVal, totalInv, pnl, upStocks, downStocks, topStock
    };
  }

  // ---- DAILY TIP ----
  if (lower.match(/(tip|daily|advice|what should i do|suggestion|help me out)/)) {
    const tip = getDailyTip(context);
    return { type: 'tip', content: tip || 'Complete your financial profile so I can give you personalized tips!' };
  }

  // ---- 50/30/20 RULE ----
  if (lower.match(/(50.30.20|50 30 20|fifty|rule|budget|how should i split|income split)/)) {
    const profile = context.profile;
    if (!profile) {
      return { type: 'text', content: 'Please complete your **Financial Profile** first so I can show your 50/30/20 breakdown. Go to your Profile page and fill in your income and expenses.' };
    }
    const income = Number(profile.monthly_income || 0);
    const expenses = Number(profile.monthly_expenses || 0);
    const needs = Math.min(expenses, income * 0.5);
    const wants = Math.max(0, income * 0.3);
    const invest = Math.max(0, income * 0.2);
    const surplus = income - expenses;

    return {
      type: 'fiftyThirtyTwenty',
      content: `Here is your **50/30/20 Budget Breakdown** based on a monthly income of ${formatCurrency(income)}:`,
      income, needs, wants, invest, surplus, expenses,
    };
  }

  // ---- WATCHLIST ----
  if (lower.match(/(watchlist|watch|tracking|stocks i am watching)/)) {
    const watchlist = context.watchlist || [];
    if (!watchlist.length) {
      return { type: 'text', content: 'Your watchlist is empty. Go to **Stocks** and click the star icon on any stock to add it to your watchlist. This helps you track stocks you are interested in!' };
    }

    const detailed = watchlist.map(w => {
      const s = context.stocks?.find(st => st.symbol === w.symbol);
      return { ...w, signal: s?.signal, reasoning: s?.signal_reasoning, price: s?.current_price };
    });

    return {
      type: 'watchlist',
      content: `**Your Watchlist — ${watchlist.length} stock(s)**\n\nHere is how each stock is looking:`,
      stocks: detailed
    };
  }

  // ---- HEALTH SCORE ----
  if (lower.match(/(health|score|how healthy|portfolio health|health check)/)) {
    const score = calculateHealthScore(context.holdings || [], context.profile);
    const advice = score >= 80 ? 'Your portfolio is in great shape! Keep monitoring regularly.' :
                   score >= 50 ? 'Your portfolio is doing OK. Consider diversifying more.' :
                   'Your portfolio needs attention. Review your holdings and consider rebalancing.';

    return {
      type: 'health',
      content: `Your portfolio health score is **${score}/100**. ${advice}`
    };
  }

  // ---- MARKET NEWS ----
  if (lower.match(/(news|market news|what is happening|latest|headlines|stock market news)/)) {
    const count = Math.min(MARKET_NEWS.length, 4);
    const shuffled = [...MARKET_NEWS].sort(() => Math.random() - 0.5).slice(0, count);
    return {
      type: 'news',
      content: `Here are the latest market updates explained in simple terms:\n\n`,
      news: shuffled
    };
  }

  // ---- STOCK DETAIL ----
  if (lower.match(/(tell me about|details?|info|price of|how is)\s+(\w+)/i)) {
    const symbolMatch = lower.match(/(?:tell me about|details?|info|price of|how is)\s+(\w+)/i);
    if (symbolMatch) {
      const sym = symbolMatch[1].toUpperCase();
      const stock = context.stocks?.find(s => s.symbol === sym);
      if (stock) {
        const change = ((stock.current_price - stock.week_52_low) / stock.week_52_low * 100).toFixed(1);
        return {
          type: 'stockDetail',
          content: `**${stock.name} (${stock.symbol})**`,
          stock: {
            ...stock,
            pctFrom52Low: change,
          }
        };
      }
    }
  }

  // ---- COMPARE STOCKS ----
  if (lower.match(/(compare|vs|versus|which is better)/)) {
    const matchSymbols = lower.match(/(\w{2,5})\s*(?:vs|versus|and|or|compare)\s*(\w{2,5})/i);
    if (matchSymbols) {
      const sym1 = matchSymbols[1].toUpperCase();
      const sym2 = matchSymbols[2].toUpperCase();
      const stock1 = context.stocks?.find(s => s.symbol === sym1);
      const stock2 = context.stocks?.find(s => s.symbol === sym2);
      if (stock1 && stock2) {
        return {
          type: 'comparison',
          content: `Here is how **${stock1.symbol}** and **${stock2.symbol}** compare:`,
          stocks: [stock1, stock2]
        };
      }
    }
  }

  // ---- DIVERSIFICATION ----
  if (lower.match(/(diversif|spread|too much|concentrat|all eggs|one basket)/)) {
    const holdings = context.holdings || [];
    if (!holdings.length) {
      return { type: 'text', content: 'You do not have any stocks yet. When you start investing, try to buy stocks from different sectors (like IT, banking, energy) to spread your risk. This is called diversification!' };
    }

    const sectorTotal = {};
    holdings.forEach(h => {
      const sector = h.sector || 'Other';
      sectorTotal[sector] = (sectorTotal[sector] || 0) + h.currentVal;
    });
    const totalVal = Object.values(sectorTotal).reduce((a, b) => a + b, 0);

    return {
      type: 'sectorBreakdown',
      content: `Here is how your portfolio is spread across different sectors:`,
      sectors: Object.entries(sectorTotal)
        .map(([sector, value]) => ({ sector, value, pct: totalVal > 0 ? ((value / totalVal) * 100).toFixed(1) : 0 }))
        .sort((a, b) => b.value - a.value)
    };
  }

  // ---- PORTFOLIO PERFORMANCE ----
  if (lower.match(/(performance|returns|how did i do|profit|loss|pnl|gains)/)) {
    const holdings = context.holdings || [];
    if (!holdings.length) {
      return { type: 'text', content: 'You have no holdings yet, so no performance to show. Start with a small investment to see how it grows!' };
    }

    const totalVal = holdings.reduce((s, h) => s + h.currentVal, 0);
    const totalInv = holdings.reduce((s, h) => s + h.invested, 0);
    const bestStock = holdings.sort((a, b) => (b.pnl / b.invested * 100) - (a.pnl / a.invested * 100))[0];
    const worstStock = holdings.sort((a, b) => (a.pnl / a.invested * 100) - (b.pnl / b.invested * 100))[0];

    return {
      type: 'text',
      content: `**Your Portfolio Performance**\n\n` +
        `Total invested: ${formatCurrency(totalInv)}\n` +
        `Current value: ${formatCurrency(totalVal)}\n` +
        `Overall P&L: **${totalVal - totalInv >= 0 ? '+' : ''}${formatCurrency(totalVal - totalInv)}** (${((totalVal - totalInv) / totalInv * 100).toFixed(2)}%)\n\n` +
        `🏆 Best performer: **${bestStock?.symbol}** (${bestStock?.pnlPct.toFixed(2)}%)\n` +
        `📉 Weakest: **${worstStock?.symbol}** (${worstStock?.pnlPct.toFixed(2)}%)\n\n` +
        `Your total return is ${totalVal - totalInv >= 0 ? 'positive' : 'negative'}. ` +
        (totalVal >= totalInv ? 'Keep up the good work!' : 'Remember, short-term losses are normal. Hold quality stocks for the long term.')
    };
  }

  // ---- PROFILE/INCOME ----
  if (lower.match(/(profile|my income|my salary|my details|monthly income|how much i earn|my info)/)) {
    const profile = context.profile;
    if (!profile) {
      return { type: 'text', content: 'You have not filled in your financial profile yet. Go to your **Profile** page to tell us about your income, expenses, and goals — this helps me give you personalized advice!' };
    }
    const investable = calculateMonthlyInvestable(profile);
    const surplus = Number(profile.monthly_income || 0) - Number(profile.monthly_expenses || 0);

    return {
      type: 'profile',
      content: `**Your Financial Snapshot**`,
      profile,
      investable,
      surplus,
    };
  }

  // ---- FALLBACK ----
  return {
    type: 'text',
    content: `I am not sure I understand that. Here are some things you can ask me:\n\n` +
      `📊 **"Explain my portfolio"** — Simple summary of what you own\n` +
      `📰 **"Market news"** — Latest news in simple language\n` +
      `💡 **"Give me a tip"** — Personalized daily tip\n` +
      `🎯 **"Am I too risky?"** — Check your risk level\n` +
      `💰 **"What if I buy 10 shares of Reliance?"** — Simulate a trade\n` +
      `📈 **"What should I buy?"** — Stock suggestions for beginners\n` +
      `🧮 **"My 50/30/20"** — Budget breakdown\n` +
      `🏥 **"Portfolio health"** — Health check\n\n` +
      `Or try typing something simple like **"What do I own?"**`
  };
}
