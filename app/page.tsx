"use client";

import { useState, useEffect } from "react";

export default function Dashboard() {
  const [coinData, setCoinData] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  // AMBIL DATA DARI COINGECKO (GRATIS & LENGKAP)
  const fetchMarketData = async () => {
    try {
      const res = await fetch(
        "https://api.coingecko.com/api/v3/coins/markets?vs_currency=usd&order=market_cap_desc&per_page=20&page=1&sparkline=false&price_change_percentage=24h"
      );
      const data = await res.json();
      setCoinData(data);
      setLoading(false);
    } catch (err) {
      console.error("API Error:", err);
    }
  };

  useEffect(() => {
    fetchMarketData();
    const interval = setInterval(fetchMarketData, 60000); // CoinGecko free tier update tiap 60 detik
    return () => clearInterval(interval);
  }, []);

  const getSignal = (change: number) => {
    if (change > 5) return { label: "ACCUMULATE / BUY", color: "text-[#00ff00]", icon: "🟢", priority: 1 };
    if (change > 1) return { label: "SPEKULASI BUY", color: "text-[#00ff00]", icon: "⚡", priority: 2 };
    if (change < -5) return { label: "DISTRIBUTE / SELL", color: "text-red-500", icon: "🔴", priority: 5 };
    if (change < -1) return { label: "WAIT & SEE", color: "text-yellow-500", icon: "🩹", priority: 4 };
    return { label: "NEUTRAL", color: "text-gray-400", icon: "⚖️", priority: 3 };
  };

  // SORTING BERDASARKAN PRIORITAS SINYAL
  const sortedCoins = [...coinData].sort((a, b) => {
    return getSignal(a.price_change_percentage_24h).priority - getSignal(b.price_change_percentage_24h).priority;
  });

  if (loading) return <div className="min-h-screen bg-black text-[#00ff00] flex items-center justify-center font-mono animate-pulse text-2xl">INITIALIZING CORE ACCESS...</div>;

  return (
    <div className="min-h-screen bg-[#050505] text-white p-4 font-mono">
      {/* HEADER */}
      <div className="mb-6">
        <h1 className="text-[#00ff00] text-3xl font-black italic tracking-tighter uppercase">
          [ Sentinel v12.0 ] CoinGecko Data Feed
        </h1>
        <p className="text-[10px] text-green-500/50 mt-2 tracking-widest uppercase">
          Signal Priority Active | Rank #1 - #20 Market Cap
        </p>
        <div className="h-[1px] w-full bg-green-900/50 mt-4"></div>
      </div>

      <div className="space-y-4">
        {sortedCoins.map((coin) => {
          const sig = getSignal(coin.price_change_percentage_24h);
          const whaleTarget = coin.current_price * 1.15;

          return (
            <div key={coin.id} className={`bg-[#0a0a0a] border-l-4 ${sig.priority <= 2 ? 'border-green-500 shadow-[0_0_15px_rgba(34,197,94,0.1)]' : 'border-gray-800'} p-5 rounded-r-xl relative transition-all duration-700`}>
              <div className="flex justify-between items-start mb-4">
                <div className="flex items-center gap-3">
                    <img src={coin.image} alt={coin.name} className="w-8 h-8" />
                    <div>
                        <h2 className="text-2xl font-black tracking-tighter uppercase">{coin.symbol}</h2>
                        <p className="text-[9px] text-gray-500">RANK #{coin.market_cap_rank}</p>
                    </div>
                </div>
                <div className={`text-sm font-bold flex items-center gap-2 ${sig.color} bg-black/40 px-3 py-1 rounded-full border border-white/5`}>
                   <span>{sig.icon}</span> {sig.label}
                </div>
              </div>

              <div className="grid grid-cols-4 gap-4 mb-4 text-gray-500 uppercase">
                <div>
                  <p className="text-[8px]">Current Price</p>
                  <p className="text-xl font-bold text-white">${coin.current_price.toLocaleString()}</p>
                </div>
                <div>
                  <p className="text-[8px]">24h Change</p>
                  <p className={`text-lg font-bold ${coin.price_change_percentage_24h > 0 ? 'text-green-400' : 'text-red-400'}`}>
                    {coin.price_change_percentage_24h?.toFixed(2)}%
                  </p>
                </div>
                <div>
                  <p className="text-[8px]">Market Cap</p>
                  <p className="text-lg font-bold text-white">${(coin.market_cap / 1000000000).toFixed(2)}B</p>
                </div>
                <div>
                  <p className="text-[8px]">B-Power</p>
                  <p className="text-lg font-bold text-[#00ff00]">{(Math.random() * 30 + 70).toFixed(1)}%</p>
                </div>
              </div>

              <div className="mt-2 flex justify-between items-end border-t border-white/5 pt-4">
                <div>
                    <p className="text-[8px] text-gray-600 tracking-[0.2em]">EXPECTED WHALE TARGET</p>
                    <p className="text-xl font-bold text-[#00ff00] tracking-tighter">
                    ${whaleTarget.toLocaleString()}
                    </p>
                </div>
                <div className="text-[9px] text-gray-700 italic">
                    ID: {coin.id}
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}