"use client";

import { useState, useEffect, useRef } from "react";

export default function Dashboard() {
  const [prices, setPrices] = useState<{ [key: string]: any }>({});
  const [coinList, setCoinList] = useState<any[]>([]);
  const prevPrices = useRef<{ [key: string]: number }>({});

  const fetchTopCoins = async () => {
    try {
      const res = await fetch("https://api.binance.com/api/v3/ticker/24hr");
      const data = await res.json();
      const top25 = data
        .filter((item: any) => item.symbol.endsWith("USDT"))
        .sort((a: any, b: any) => parseFloat(b.quoteVolume) - parseFloat(a.quoteVolume))
        .slice(0, 25);
      setCoinList(top25);
    } catch (err) { console.error(err); }
  };

  const updateData = async () => {
    try {
      const res = await fetch("https://api.binance.com/api/v3/ticker/24hr");
      const data = await res.json();
      const updated: any = {};
      data.forEach((item: any) => {
        if (coinList.find(c => c.symbol === item.symbol)) {
          const currentPrice = parseFloat(item.lastPrice);
          updated[item.symbol] = {
            price: currentPrice,
            change: parseFloat(item.priceChangePercent),
            vol: (parseFloat(item.quoteVolume) / 1000000).toFixed(2),
            // Deteksi arah perubahan harga per detik
            dir: currentPrice > (prevPrices.current[item.symbol] || 0) ? "up" : "down"
          };
          prevPrices.current[item.symbol] = currentPrice;
        }
      });
      setPrices(updated);
    } catch (err) { console.error(err); }
  };

  useEffect(() => { fetchTopCoins(); }, []);
  useEffect(() => {
    const interval = setInterval(updateData, 1000); // GASS POOL 1 DETIK
    return () => clearInterval(interval);
  }, [coinList]);

  const getWhaleSignal = (symbol: string) => {
    const data = prices[symbol];
    if (!data) return { label: "SCANNING", color: "text-gray-600", priority: 3, icon: "📡" };
    if (data.change > 2.5) return { label: "WHALE ACCUMULATE", color: "text-[#00ff00]", priority: 1, icon: "🐋" };
    if (data.change > 0.5) return { label: "SPEKULASI BUY", color: "text-green-400", priority: 2, icon: "⚡" };
    if (data.change < -2.5) return { label: "WHALE DUMPING", color: "text-red-500", priority: 5, icon: "🚨" };
    return { label: "NEUTRAL", color: "text-gray-500", priority: 3, icon: "⚖️" };
  };

  const sortedCoins = [...coinList].sort((a, b) => {
    const sigA = getWhaleSignal(a.symbol);
    const sigB = getWhaleSignal(b.symbol);
    if (sigA.priority !== sigB.priority) return sigA.priority - sigB.priority;
    return parseFloat(prices[b.symbol]?.vol || 0) - parseFloat(prices[a.symbol]?.vol || 0);
  });

  return (
    <div className="min-h-screen bg-[#020202] text-white p-4 font-mono overflow-x-hidden">
      <div className="mb-6 sticky top-0 bg-[#020202]/90 backdrop-blur-xl z-30 py-4 border-b-2 border-[#00ff00]/20 flex justify-between items-center">
        <div>
          <h1 className="text-[#00ff00] text-3xl font-black italic tracking-tighter animate-pulse">SENTINEL-X v12.0</h1>
          <p className="text-[8px] text-green-500/50 tracking-[0.5em] uppercase">Hyper-Scale Whale Tracking</p>
        </div>
        <div className="text-right">
            <div className="text-[10px] font-bold text-[#00ff00]">[ SYSTEM_LIVE ]</div>
            <div className="text-[8px] text-gray-600 uppercase mt-1">Refreshed every 1000ms</div>
        </div>
      </div>

      <div className="flex flex-col gap-3">
        {sortedCoins.map((coin) => {
          const data = prices[coin.symbol] || {};
          const sig = getWhaleSignal(coin.symbol);
          const isUp = data.dir === "up";

          return (
            <div 
              key={coin.symbol} 
              className={`relative p-5 rounded-lg border border-white/5 transition-all duration-700 transform ${
                sig.priority <= 2 ? 'bg-[#081a08] border-[#00ff00]/30 shadow-[0_0_30px_rgba(0,255,0,0.05)]' : 'bg-[#0a0a0a]'
              } ${isUp ? 'ring-1 ring-green-500/20' : 'ring-1 ring-red-500/20'}`}
            >
              <div className="flex justify-between items-center mb-4">
                <div className="flex items-center gap-4">
                    <span className={`h-2 w-2 rounded-full ${isUp ? 'bg-green-500 animate-ping' : 'bg-red-500'}`}></span>
                    <h2 className="text-4xl font-black tracking-tighter">{coin.symbol.replace("USDT", "")}</h2>
                </div>
                <div className={`text-[10px] font-black px-4 py-1.5 border border-current/30 rounded-full bg-black/80 flex items-center gap-2 ${sig.color}`}>
                  {sig.icon} {sig.label}
                </div>
              </div>

              <div className="grid grid-cols-3 gap-6 my-4 border-y border-white/5 py-4">
                <div className="text-center md:text-left">
                  <p className="text-[8px] text-gray-500 uppercase mb-2">Price Action</p>
                  <p className={`text-2xl font-bold tracking-tighter transition-colors duration-300 ${isUp ? 'text-green-400' : 'text-red-400'}`}>
                    ${data.price?.toLocaleString(undefined, { minimumFractionDigits: 2 })}
                  </p>
                </div>
                <div className="text-center">
                  <p className="text-[8px] text-gray-500 uppercase mb-2">24H Dynamic</p>
                  <p className={`text-2xl font-bold ${data.change > 0 ? 'text-green-500' : 'text-red-500'}`}>
                    {data.change > 0 ? "+" : ""}{data.change?.toFixed(2)}%
                  </p>
                </div>
                <div className="text-center md:text-right">
                  <p className="text-[8px] text-gray-500 uppercase mb-2">Whale Inflow</p>
                  <p className="text-2xl font-bold text-[#00ff00]">${data.vol}M</p>
                </div>
              </div>

              <div className="flex justify-between items-center mt-2">
                 <div className="flex gap-4">
                    <div className="text-[7px] text-gray-700 bg-white/5 px-2 py-0.5 rounded uppercase">Target: ${(data.price * 1.05).toFixed(2)}</div>
                    <div className="text-[7px] text-gray-700 bg-white/5 px-2 py-0.5 rounded uppercase font-bold">Priority: {sig.priority}</div>
                 </div>
                 <div className="text-[8px] text-zinc-800 font-bold tracking-widest italic animate-pulse">INTEL_MATCH_FOUND</div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}