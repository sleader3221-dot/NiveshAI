import { db } from '@/lib/dbClient';

import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';

import { useQuery } from '@tanstack/react-query';
import { useAuth } from '@/lib/AuthContext';
import { STOCK_SEED_DATA, formatCurrency, getSignalColor } from '@/lib/stockData';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Briefcase, TrendingUp, TrendingDown, ArrowUpRight, History, BarChart3 } from 'lucide-react';
import { motion } from 'framer-motion';

export default function Portfolio() {
  const { user } = useAuth();
  const [stocks, setStocks] = useState([]);

  const { data: dbStocks } = useQuery({
    queryKey: ['stocks'],
    queryFn: () => db.entities.Stock.list(),
  });

  useEffect(() => {
    setStocks(dbStocks?.length > 0 ? dbStocks : STOCK_SEED_DATA);
  }, [dbStocks]);

  const { data: trades, isLoading } = useQuery({
    queryKey: ['trades', user?.email],
    queryFn: () => db.entities.Trade.filter({ created_by: user?.email }, '-created_date'),
    enabled: !!user?.email,
  });

  // Build holdings
  const holdingsMap = {};
  (trades || []).forEach(t => {
    if (!holdingsMap[t.stock_symbol]) {
      holdingsMap[t.stock_symbol] = { qty: 0, invested: 0, name: t.stock_name, sector: t.sector, trades: [] };
    }
    holdingsMap[t.stock_symbol].trades.push(t);
    if (t.trade_type === 'BUY') {
      holdingsMap[t.stock_symbol].qty += t.quantity;
      holdingsMap[t.stock_symbol].invested += t.total_value;
    } else {
      holdingsMap[t.stock_symbol].qty -= t.quantity;
      holdingsMap[t.stock_symbol].invested -= t.price * t.quantity;
    }
  });

  const holdings = Object.entries(holdingsMap)
    .filter(([_, h]) => h.qty > 0)
    .map(([symbol, h]) => {
      const stock = stocks.find(s => s.symbol === symbol);
      const currentVal = (stock?.current_price || 0) * h.qty;
      const pnl = currentVal - h.invested;
      const pnlPct = h.invested > 0 ? (pnl / h.invested) * 100 : 0;
      const avgPrice = h.invested / h.qty;
      return { symbol, ...h, currentVal, pnl, pnlPct, avgPrice, signal: stock?.signal, currentPrice: stock?.current_price };
    })
    .sort((a, b) => b.currentVal - a.currentVal);

  const totalInvested = holdings.reduce((sum, h) => sum + h.invested, 0);
  const totalCurrentVal = holdings.reduce((sum, h) => sum + h.currentVal, 0);
  const totalPnL = totalCurrentVal - totalInvested;
  const totalPnLPct = totalInvested > 0 ? ((totalPnL / totalInvested) * 100).toFixed(2) : 0;

  return (
    <div className="p-6 lg:p-8 max-w-[1400px] mx-auto space-y-6">
      <div>
        <h1 className="text-2xl lg:text-3xl font-dm font-bold">My Portfolio</h1>
        <p className="text-muted-foreground mt-1">Track your virtual trades and P&L performance</p>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {[
          { label: 'Total Invested', value: formatCurrency(totalInvested), icon: Briefcase, color: 'text-primary' },
          { label: 'Current Value', value: formatCurrency(totalCurrentVal), icon: BarChart3, color: 'text-blue-600' },
          { label: 'Total P&L', value: `${totalPnL >= 0 ? '+' : ''}${formatCurrency(totalPnL)}`, icon: totalPnL >= 0 ? TrendingUp : TrendingDown, color: totalPnL >= 0 ? 'text-emerald-600' : 'text-red-500' },
          { label: 'Return', value: `${totalPnL >= 0 ? '+' : ''}${totalPnLPct}%`, icon: ArrowUpRight, color: totalPnL >= 0 ? 'text-emerald-600' : 'text-red-500' },
        ].map((stat, i) => (
          <motion.div key={stat.label} initial={{ opacity: 0, y: 15 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.05 }}>
            <Card className="p-5">
              <p className="text-xs text-muted-foreground uppercase tracking-wider">{stat.label}</p>
              <div className="flex items-center gap-2 mt-2">
                <stat.icon className={`w-5 h-5 ${stat.color}`} />
                <p className={`text-xl font-dm font-bold ${stat.color}`}>{stat.value}</p>
              </div>
            </Card>
          </motion.div>
        ))}
      </div>

      <Tabs defaultValue="holdings" className="space-y-4">
        <TabsList>
          <TabsTrigger value="holdings">Holdings ({holdings.length})</TabsTrigger>
          <TabsTrigger value="history">Trade History</TabsTrigger>
        </TabsList>

        <TabsContent value="holdings">
          {holdings.length === 0 ? (
            <Card>
              <CardContent className="p-12 text-center">
                <Briefcase className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
                <h3 className="font-semibold text-lg">No Holdings Yet</h3>
                <p className="text-muted-foreground mt-1">Browse stocks and place your first virtual trade</p>
                <Link to="/stocks">
                  <motion.button whileHover={{ scale: 1.02 }} className="mt-4 px-6 py-2.5 bg-primary text-primary-foreground rounded-lg font-medium text-sm">
                    Explore Stocks
                  </motion.button>
                </Link>
              </CardContent>
            </Card>
          ) : (
            <Card>
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Stock</TableHead>
                      <TableHead className="text-right">Qty</TableHead>
                      <TableHead className="text-right">Avg Price</TableHead>
                      <TableHead className="text-right">Current</TableHead>
                      <TableHead className="text-right">Invested</TableHead>
                      <TableHead className="text-right">Current Value</TableHead>
                      <TableHead className="text-right">P&L</TableHead>
                      <TableHead>Signal</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {holdings.map(h => (
                      <TableRow key={h.symbol} className="cursor-pointer hover:bg-accent/50">
                        <TableCell>
                          <Link to={`/stock/${h.symbol}`} className="hover:underline">
                            <p className="font-semibold">{h.symbol}</p>
                            <p className="text-xs text-muted-foreground">{h.name}</p>
                          </Link>
                        </TableCell>
                        <TableCell className="text-right font-medium">{h.qty}</TableCell>
                        <TableCell className="text-right">{formatCurrency(h.avgPrice)}</TableCell>
                        <TableCell className="text-right">{formatCurrency(h.currentPrice)}</TableCell>
                        <TableCell className="text-right">{formatCurrency(h.invested)}</TableCell>
                        <TableCell className="text-right font-medium">{formatCurrency(h.currentVal)}</TableCell>
                        <TableCell className="text-right">
                          <span className={`font-semibold ${h.pnl >= 0 ? 'text-emerald-600' : 'text-red-500'}`}>
                            {h.pnl >= 0 ? '+' : ''}{formatCurrency(h.pnl)}
                          </span>
                          <p className={`text-xs ${h.pnl >= 0 ? 'text-emerald-600' : 'text-red-500'}`}>
                            {h.pnl >= 0 ? '+' : ''}{h.pnlPct.toFixed(2)}%
                          </p>
                        </TableCell>
                        <TableCell>
                          {h.signal && <Badge className={`${getSignalColor(h.signal)} border text-[10px]`}>{h.signal.replace('_',' ')}</Badge>}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            </Card>
          )}
        </TabsContent>

        <TabsContent value="history">
          <Card>
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Date</TableHead>
                    <TableHead>Stock</TableHead>
                    <TableHead>Type</TableHead>
                    <TableHead className="text-right">Qty</TableHead>
                    <TableHead className="text-right">Price</TableHead>
                    <TableHead className="text-right">Total</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {(trades || []).slice(0, 50).map(t => (
                    <TableRow key={t.id}>
                      <TableCell className="text-sm">{new Date(t.created_date).toLocaleDateString()}</TableCell>
                      <TableCell>
                        <p className="font-medium">{t.stock_symbol}</p>
                        <p className="text-xs text-muted-foreground">{t.stock_name}</p>
                      </TableCell>
                      <TableCell>
                        <Badge className={t.trade_type === 'BUY' ? 'bg-emerald-50 text-emerald-600 border-emerald-200' : 'bg-red-50 text-red-600 border-red-200'}>
                          {t.trade_type}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-right">{t.quantity}</TableCell>
                      <TableCell className="text-right">{formatCurrency(t.price)}</TableCell>
                      <TableCell className="text-right font-medium">{formatCurrency(t.total_value)}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
            {(!trades || trades.length === 0) && (
              <div className="p-8 text-center text-muted-foreground text-sm">
                <History className="w-8 h-8 mx-auto mb-2 opacity-50" />
                No trades yet
              </div>
            )}
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
