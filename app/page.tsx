"use client";

import { useState, useEffect } from "react";

export default function Dashboard() {
  const [prices, setPrices] = useState<{ [key: string]: any }>({});
  const [coinList, setCoinList] = useState<any[]>([]);

  const fetchTopCoins = async () => {
    try {
      const res = await fetch("https://api.binance.com/api/v3/ticker/24hr");
      const data = await res.json();
      const top20 = data
        .filter((item: any) => item.symbol.endsWith("USDT"))
        .sort((a: any, b: any) => parseFloat(b.volume) - parseFloat(a.volume))
        .slice(0, 20);
      setCoinList(top20);
    } catch (err) { console.error(err); }
  };

  const updateData = async () => {
    try {
      const res = await fetch("https://api.binance.com/api/v3/ticker/24hr");
      const data = await res.json();
      const updated: any = {};
      data.forEach((item: any) => {
        if (coinList.find(c => c.symbol === item.symbol)) {
          updated[item.symbol] = {
            price: parseFloat(item.lastPrice),
            change: parseFloat(item.priceChangePercent),
            high: parseFloat(item.highPrice),
            vol: (parseFloat(item.volume) / 1000000).toFixed(1)
          };
        }
      });
      setPrices(updated);
    } catch (err) { console.error(err); }
  };

  useEffect(() => { fetchTopCoins(); }, []);
  useEffect(() => {
    const interval = setInterval(updateData, 3000);
    return () => clearInterval(interval);
  }, [coinList]);

  const getSignal = (change: number) => {
    if (change > 3) return { label: "ACCUMULATE / BUY", color: "text-[#00ff00]", icon: "🟢", priority: 1 };
    if (change > 1) return { label: "SPEKULASI BUY", color: "text-[#00ff00]", icon: "⚡", priority: 2 };
    if (change < -3) return { label: "DISTRIBUTE / SELL", color: "text-red-500", icon: "🔴", priority: 5 };
    if (change < -1) return { label: "WAIT & SEE", color: "text-yellow-500", icon: "🩹", priority: 4 };
    return { label: "NEUTRAL", color: "text-gray-400", icon: "⚖️", priority: 3 };
  };

  // LOGIKA SORTING (MENGURUTKAN BERDASARKAN PRIORITAS SINYAL)
  const sortedCoins = [...coinList].sort((a, b) => {
    const dataA = prices[a.symbol] || { change: 0 };
    const dataB = prices[b.symbol] || { change: 0 };
    return getSignal(dataA.change).priority - getSignal(dataB.change).priority;
  });

  return (
    <div className="min-h-screen bg-[#050505] text-white p-4 font-mono">
      <div className="mb-6">
        <h1 className="text-[#00ff00] text-3xl font-black italic tracking-tighter">
          [ Sentinel v12.0 ]
        </h1>
        <p className="text-[10px] text-green-500/50 mt-2 tracking-widest uppercase">
          Signal Priority Active | {new Date().toLocaleTimeString()}
        </p>
        <div className="h-[1px] w-full bg-green-900/50 mt-4"></div>
      </div>

      <div className="space-y-4">
        {sortedCoins.map((coin) => {
          const data = prices[coin.symbol] || {};
          const sig = getSignal(data.change || 0);
          const whaleTarget = (data.price * 1.05) || 0;

          return (
            <div key={coin.symbol} className={`bg-[#0a0a0a] border-l-4 ${sig.priority <= 2 ? 'border-green-500' : 'border-gray-800'} p-5 rounded-r-xl relative transition-all duration-500`}>
              <div className="flex justify-between items-start mb-4">
                <h2 className="text-3xl font-black tracking-tighter">{coin.symbol.replace("USDT", "")}</h2>
                <div className={`text-sm font-bold flex items-center gap-2 ${sig.color}`}>
                   <span>{sig.icon}</span> {sig.label}
                </div>
              </div>

              <div className="grid grid-cols-4 gap-4 mb-4 text-gray-500 uppercase">
                <div>
                  <p className="text-[8px]">Price</p>
                  <p className="text-lg font-bold text-white">${data.price?.toLocaleString() || "0.00"}</p>
                </div>
                <div>
                  <p className="text-[8px]">Change</p>
                  <p className={`text-lg font-bold ${data.change > 0 ? 'text-green-500' : 'text-red-500'}`}>{data.change}%</p>
                </div>
                <div>
                  <p className="text-[8px]">B-Power</p>
                  <p className="text-lg font-bold text-white">{(Math.random() * 100).toFixed(1)}%</p>
                </div>
                <div>
                  <p className="text-[8px]">Whale Vol</p>
                  <p className="text-lg font-bold text-white">{data.vol}M</p>
                </div>
              </div>

              <div className="mt-2 flex justify-between items-end">
                <div>
                    <p className="text-[8px] text-gray-600">WHALE TARGET</p>
                    <p className="text-xl font-bold text-[#00ff00] tracking-tighter">
                    ${whaleTarget < 1 ? whaleTarget.toFixed(6) : whaleTarget.toLocaleString()}
                    </p>
                </div>
                <div className="text-[10px] text-gray-800 font-bold uppercase tracking-widest bg-white/5 px-2 py-1">
                    Priority: {sig.priority}
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}