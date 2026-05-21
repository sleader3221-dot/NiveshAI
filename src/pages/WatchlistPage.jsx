import { db } from '@/lib/dbClient';

import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useAuth } from '@/lib/AuthContext';
import { STOCK_SEED_DATA, formatCurrency, getSignalColor } from '@/lib/stockData';
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Star, Trash2, TrendingUp, TrendingDown } from 'lucide-react';
import { toast } from 'sonner';

export default function WatchlistPage() {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const [stocks, setStocks] = useState([]);

  const { data: dbStocks } = useQuery({
    queryKey: ['stocks'],
    queryFn: () => db.entities.Stock.list(),
  });

  useEffect(() => {
    setStocks(dbStocks?.length > 0 ? dbStocks : STOCK_SEED_DATA);
  }, [dbStocks]);

  const { data: watchlist, isLoading } = useQuery({
    queryKey: ['watchlist', user?.email],
    queryFn: () => db.entities.Watchlist.filter({ created_by: user?.email }),
    enabled: !!user?.email,
  });

  const deleteMutation = useMutation({
    mutationFn: (id) => db.entities.Watchlist.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['watchlist', user?.email] });
      toast.success('Removed from watchlist');
    },
    onError: (err) => {
      console.error('Watchlist delete error:', err);
      toast.error('Failed to remove from watchlist');
    },
  });

  const enriched = (watchlist || []).map(w => {
    const stock = stocks.find(s => s.symbol === w.stock_symbol);
    const change = stock ? stock.current_price - w.added_price : 0;
    const changePct = w.added_price > 0 ? (change / w.added_price) * 100 : 0;
    return { ...w, stock, change, changePct };
  });

  return (
    <div className="p-6 lg:p-8 max-w-[1400px] mx-auto space-y-6">
      <div>
        <h1 className="text-2xl lg:text-3xl font-dm font-bold flex items-center gap-2">
          <Star className="w-7 h-7 text-amber-500" /> Watchlist
        </h1>
        <p className="text-muted-foreground mt-1">Track stocks you're interested in</p>
      </div>

      {enriched.length === 0 ? (
        <Card>
          <CardContent className="p-12 text-center">
            <Star className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
            <h3 className="font-semibold text-lg">Your Watchlist is Empty</h3>
            <p className="text-muted-foreground mt-1">Add stocks from the signals page to track them</p>
            <Link to="/stocks">
              <Button className="mt-4">Browse Stocks</Button>
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
                  <TableHead className="text-right">Added Price</TableHead>
                  <TableHead className="text-right">Current Price</TableHead>
                  <TableHead className="text-right">Change</TableHead>
                  <TableHead>Signal</TableHead>
                  <TableHead></TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {enriched.map(item => (
                  <TableRow key={item.id} className="group">
                    <TableCell>
                      <Link to={`/stock/${item.stock_symbol}`} className="hover:underline">
                        <p className="font-semibold">{item.stock_symbol}</p>
                        <p className="text-xs text-muted-foreground">{item.stock_name}</p>
                      </Link>
                    </TableCell>
                    <TableCell className="text-right">{formatCurrency(item.added_price)}</TableCell>
                    <TableCell className="text-right font-medium">{formatCurrency(item.stock?.current_price)}</TableCell>
                    <TableCell className="text-right">
                      <span className={`font-semibold flex items-center justify-end gap-1 ${item.change >= 0 ? 'text-emerald-600' : 'text-red-500'}`}>
                        {item.change >= 0 ? <TrendingUp className="w-3 h-3" /> : <TrendingDown className="w-3 h-3" />}
                        {item.change >= 0 ? '+' : ''}{item.changePct.toFixed(2)}%
                      </span>
                    </TableCell>
                    <TableCell>
                      {item.stock?.signal && (
                        <Badge className={`${getSignalColor(item.stock.signal)} border text-[10px]`}>
                          {item.stock.signal.replace('_',' ')}
                        </Badge>
                      )}
                    </TableCell>
                    <TableCell>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="opacity-0 group-hover:opacity-100 text-muted-foreground hover:text-red-500"
                        onClick={() => deleteMutation.mutate(item.id)}
                      >
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        </Card>
      )}
    </div>
  );
}
