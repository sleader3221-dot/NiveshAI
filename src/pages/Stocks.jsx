import { db } from '@/lib/dbClient';

import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';

import { useQuery } from '@tanstack/react-query';
import { STOCK_SEED_DATA, getSignalColor, getRiskColor, formatCurrency } from '@/lib/stockData';
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Search, TrendingUp, TrendingDown, Filter, ArrowUpDown } from 'lucide-react';
import { motion } from 'framer-motion';

export default function Stocks() {
  const [search, setSearch] = useState('');
  const [sectorFilter, setSectorFilter] = useState('all');
  const [signalFilter, setSignalFilter] = useState('all');
  const [sortBy, setSortBy] = useState('signal');
  const [stocks, setStocks] = useState([]);

  const { data: dbStocks } = useQuery({
    queryKey: ['stocks'],
    queryFn: () => db.entities.Stock.list(),
  });

  useEffect(() => {
    setStocks(dbStocks?.length > 0 ? dbStocks : STOCK_SEED_DATA);
  }, [dbStocks]);

  const sectors = [...new Set(stocks.map(s => s.sector))].sort();
  const signalOrder = { STRONG_BUY: 1, BUY: 2, HOLD: 3, SELL: 4, STRONG_SELL: 5 };

  const filtered = stocks
    .filter(s => {
      const matchSearch = s.symbol.toLowerCase().includes(search.toLowerCase()) || 
                          s.name.toLowerCase().includes(search.toLowerCase());
      const matchSector = sectorFilter === 'all' || s.sector === sectorFilter;
      const matchSignal = signalFilter === 'all' || s.signal === signalFilter;
      return matchSearch && matchSector && matchSignal;
    })
    .sort((a, b) => {
      if (sortBy === 'signal') return (signalOrder[a.signal] || 3) - (signalOrder[b.signal] || 3);
      if (sortBy === 'price_asc') return a.current_price - b.current_price;
      if (sortBy === 'price_desc') return b.current_price - a.current_price;
      if (sortBy === 'name') return a.name.localeCompare(b.name);
      return 0;
    });

  return (
    <div className="p-6 lg:p-8 max-w-[1400px] mx-auto space-y-6">
      <div>
        <h1 className="text-2xl lg:text-3xl font-dm font-bold">Stock Signals</h1>
        <p className="text-muted-foreground mt-1">AI-driven BUY/SELL signals based on technical analysis of OHLCV data</p>
      </div>

      {/* Filters */}
      <Card>
        <CardContent className="p-4">
          <div className="flex flex-col md:flex-row gap-3">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <Input
                placeholder="Search stocks..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="pl-9"
              />
            </div>
            <Select value={sectorFilter} onValueChange={setSectorFilter}>
              <SelectTrigger className="w-full md:w-40">
                <Filter className="w-4 h-4 mr-2" />
                <SelectValue placeholder="Sector" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Sectors</SelectItem>
                {sectors.map(s => <SelectItem key={s} value={s}>{s}</SelectItem>)}
              </SelectContent>
            </Select>
            <Select value={signalFilter} onValueChange={setSignalFilter}>
              <SelectTrigger className="w-full md:w-40">
                <SelectValue placeholder="Signal" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Signals</SelectItem>
                <SelectItem value="STRONG_BUY">Strong Buy</SelectItem>
                <SelectItem value="BUY">Buy</SelectItem>
                <SelectItem value="HOLD">Hold</SelectItem>
                <SelectItem value="SELL">Sell</SelectItem>
              </SelectContent>
            </Select>
            <Select value={sortBy} onValueChange={setSortBy}>
              <SelectTrigger className="w-full md:w-40">
                <ArrowUpDown className="w-4 h-4 mr-2" />
                <SelectValue placeholder="Sort" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="signal">By Signal</SelectItem>
                <SelectItem value="price_desc">Price: High to Low</SelectItem>
                <SelectItem value="price_asc">Price: Low to High</SelectItem>
                <SelectItem value="name">Name A-Z</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Stock Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {filtered.map((stock, i) => (
          <motion.div
            key={stock.symbol}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.04 }}
          >
            <Link to={`/stock/${stock.symbol}`}>
              <Card className="hover:shadow-lg hover:border-primary/20 transition-all duration-300 cursor-pointer group">
                <CardContent className="p-5">
                  <div className="flex items-start justify-between">
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="font-dm font-bold text-lg">{stock.symbol}</span>
                        <Badge variant="outline" className="text-[10px]">{stock.market_cap}</Badge>
                      </div>
                      <p className="text-xs text-muted-foreground mt-0.5">{stock.name}</p>
                    </div>
                    <Badge className={`${getSignalColor(stock.signal)} border text-xs font-semibold`}>
                      {stock.signal.replace('_', ' ')}
                    </Badge>
                  </div>

                  <div className="mt-4 flex items-end justify-between">
                    <div>
                      <p className="text-2xl font-dm font-bold">{formatCurrency(stock.current_price)}</p>
                      <div className="flex items-center gap-3 mt-1">
                        <Badge className={getRiskColor(stock.risk_level) + " text-[10px]"}>{stock.risk_level} Risk</Badge>
                        <span className="text-xs text-muted-foreground">{stock.sector}</span>
                      </div>
                    </div>
                    <div className="text-right text-xs text-muted-foreground">
                      <p>PE: {stock.pe_ratio}</p>
                      <p>Div: {stock.dividend_yield}%</p>
                    </div>
                  </div>

                  <div className="mt-3 pt-3 border-t border-border">
                    <p className="text-xs text-muted-foreground line-clamp-2 group-hover:text-foreground transition-colors">
                      {stock.signal_reasoning?.slice(0, 120)}...
                    </p>
                  </div>
                </CardContent>
              </Card>
            </Link>
          </motion.div>
        ))}
      </div>

      {filtered.length === 0 && (
        <div className="text-center py-16 text-muted-foreground">
          <p>No stocks match your filters</p>
        </div>
      )}
    </div>
  );
}
