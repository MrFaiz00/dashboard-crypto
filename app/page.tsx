"use client";

import { useState, useEffect } from "react";
import { LineChart, Line, ResponsiveContainer, YAxis } from "recharts";

export default function Dashboard() {
  const [prices, setPrices] = useState<{ [key: string]: any[] }>({});
  const [coinList, setCoinList] = useState<any[]>([]);

  // 1. Ambil daftar koin paling populer (Top 20)
  const fetchTopCoins = async () => {
    try {
      const res = await fetch("https://api.binance.com/api/v3/ticker/24hr");
      const data = await res.json();
      // Filter hanya yang pair USDT dan ambil 20 teratas berdasarkan volume
      const top20 = data
        .filter((item: any) => item.symbol.endsWith("USDT"))
        .sort((a: any, b: any) => parseFloat(b.volume) - parseFloat(a.volume))
        .slice(0, 20);
      setCoinList(top20);
    } catch (err) { console.error(err); }
  };

  // 2. Ambil harga real-time
  const updatePrices = async () => {
    try {
      const res = await fetch("https://api.binance.com/api/v3/ticker/price");
      const data = await res.json();
      
      setPrices(prev => {
        const next = { ...prev };
        data.forEach((item: any) => {
          // Hanya simpan data untuk koin yang ada di list top 20
          if (coinList.find(c => c.symbol === item.symbol)) {
            const val = parseFloat(item.price);
            const history = next[item.symbol] || [];
            next[item.symbol] = [...history, { val }].slice(-15);
          }
        });
        return next;
      });
    } catch (err) { console.error(err); }
  };

  useEffect(() => {
    fetchTopCoins();
  }, []);

  useEffect(() => {
    if (coinList.length > 0) {
      const interval = setInterval(updatePrices, 3000);
      return () => clearInterval(interval);
    }
  }, [coinList]);

  return (
    <div className="min-h-screen bg-black text-white p-4 font-mono">
      <div className="flex justify-between items-center border-b border-green-900 pb-4 mb-6">
        <h1 className="text-[#00ff00] font-black text-xl italic">[ MARKET SCANNER: TOP 20 ]</h1>
        <div className="text-[10px] text-green-500 animate-pulse font-bold">● LIVE FEED</div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 lg:grid-cols-5 gap-3">
        {coinList.map((coin) => {
          const history = prices[coin.symbol] || [];
          const current = history.length > 0 ? history[history.length - 1].val : 0;
          const isUp = history.length > 1 && current > history[history.length - 2].val;

          return (
            <div key={coin.symbol} className="bg-[#0a0a0a] border border-white/5 p-3 rounded-sm">
              <div className="flex justify-between items-center mb-2">
                <span className="text-[10px] text-gray-400 font-bold">{coin.symbol.replace("USDT", "")}</span>
                <span className={`text-[10px] font-bold ${isUp ? 'text-green-500' : 'text-red-500'}`}>
                  {isUp ? "▲" : "▼"}
                </span>
              </div>
              
              <div className="text-lg font-black tracking-tighter mb-2">
                ${current < 1 ? current.toFixed(4) : current.toLocaleString()}
              </div>

              <div className="h-10 w-full opacity-50">
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={history}>
                    <YAxis domain={['auto', 'auto']} hide />
                    <Line type="monotone" dataKey="val" stroke={isUp ? "#00ff00" : "#ff0000"} strokeWidth={1} dot={false} isAnimationActive={false} />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}