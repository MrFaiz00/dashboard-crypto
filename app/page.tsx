"use client";

import { useState, useEffect } from "react";

export default function Dashboard() {
  const [prices, setPrices] = useState<{ [key: string]: any }>({});
  const [coinList, setCoinList] = useState<any[]>([]);

  // 1. Ambil 25 koin dengan volume tertinggi di Binance
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

  // 2. Update data setiap 2 detik (Sangat Cepat)
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
            vol: (parseFloat(item.quoteVolume) / 1000000).toFixed(2),
            high: parseFloat(item.highPrice)
          };
        }
      });
      setPrices(updated);
    } catch (err) { console.error(err); }
  };

  useEffect(() => { fetchTopCoins(); }, []);
  useEffect(() => {
    const interval = setInterval(updateData, 2000); 
    return () => clearInterval(interval);
  }, [coinList]);

  // LOGIKA DETEKSI WHALE (BERDASARKAN VOL & CHANGE)
  const getWhaleSignal = (symbol: string) => {
    const data = prices[symbol];
    if (!data) return { label: "SCANNING", color: "text-gray-600", priority: 3, icon: "📡" };

    // Sinyal Akumulasi Whale (Volume Gede & Harga Naik)
    if (data.change > 3 && parseFloat(data.vol) > 500) {
      return { label: "WHALE ACCUMULATE", color: "text-[#00ff00]", priority: 1, icon: "🐋" };
    }
    // Sinyal Spekulasi (Naik kencang)
    if (data.change > 1.5) {
      return { label: "SPEKULASI BUY", color: "text-green-400", priority: 2, icon: "⚡" };
    }
    // Sinyal Dump (Turun parah)
    if (data.change < -3) {
      return { label: "WHALE DUMPING", color: "text-red-500", priority: 5, icon: "🚨" };
    }
    return { label: "NEUTRAL", color: "text-gray-500", priority: 3, icon: "⚖️" };
  };

  // SORTING OTOMATIS: PIN KOIN DENGAN SINYAL TERBAIK KE ATAS
  const sortedCoins = [...coinList].sort((a, b) => {
    const sigA = getWhaleSignal(a.symbol);
    const sigB = getWhaleSignal(b.symbol);
    if (sigA.priority !== sigB.priority) return sigA.priority - sigB.priority;
    // Jika sinyal sama, urutkan berdasarkan Volume terbesar
    return parseFloat(prices[b.symbol]?.vol || 0) - parseFloat(prices[a.symbol]?.vol || 0);
  });

  return (
    <div className="min-h-screen bg-[#050505] text-white p-4 font-mono">
      <div className="mb-6 sticky top-0 bg-[#050505]/95 z-20 py-2 border-b border-green-500/30">
        <h1 className="text-[#00ff00] text-3xl font-black italic tracking-tighter">SENTINEL v12.0</h1>
        <p className="text-[10px] text-green-500/50 tracking-[0.3em] uppercase">Binance Whale Feed | Active</p>
      </div>

      <div className="space-y-4">
        {sortedCoins.map((coin) => {
          const data = prices[coin.symbol] || {};
          const sig = getWhaleSignal(coin.symbol);

          return (
            <div key={coin.symbol} className={`p-5 rounded-lg border-l-4 transition-all duration-700 ${
              sig.priority <= 2 ? 'border-green-500 bg-[#081508]' : 'border-zinc-800 bg-[#0a0a0a]'
            }`}>
              <div className="flex justify-between items-start mb-4">
                <h2 className="text-4xl font-black tracking-tighter">{coin.symbol.replace("USDT", "")}</h2>
                <div className={`text-xs font-black px-3 py-1 border border-current/20 rounded bg-black/40 flex items-center gap-2 ${sig.color}`}>
                  {sig.icon} {sig.label}
                </div>
              </div>

              <div className="grid grid-cols-3 gap-4 border-y border-white/5 py-4 my-2">
                <div>
                  <p className="text-[8px] text-gray-500 uppercase mb-1">Price</p>
                  <p className="text-xl font-bold">${data.price?.toLocaleString() || "0.00"}</p>
                </div>
                <div>
                  <p className="text-[8px] text-gray-500 uppercase mb-1">24h Change</p>
                  <p className={`text-xl font-bold ${data.change > 0 ? 'text-green-500' : 'text-red-500'}`}>
                    {data.change?.toFixed(2)}%
                  </p>
                </div>
                <div>
                  <p className="text-[8px] text-gray-500 uppercase mb-1">Whale Power</p>
                  <p className="text-xl font-bold text-[#00ff00]">{data.vol}M</p>
                </div>
              </div>

              <div className="mt-3 flex justify-between items-center text-[8px] text-gray-700 font-bold tracking-widest uppercase">
                <span>Whale Target: ${(data.price * 1.08).toFixed(4)}</span>
                <span>Signal_Priority_{sig.priority}</span>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}