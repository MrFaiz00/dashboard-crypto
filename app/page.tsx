"use client";

import { useState, useEffect, useRef } from "react";

export default function Dashboard() {
  const [prices, setPrices] = useState<{ [key: string]: any }>({});
  const [coinList, setCoinList] = useState<any[]>([]);
  const [lastAlert, setLastAlert] = useState<string>("SCANNING FOR WHALE PUMPS...");
  const prevPrices = useRef<{ [key: string]: number }>({});
  const activityScore = useRef<{ [key: string]: number }>({}); // Skor keaktifan koin

  const fetchTopCoins = async () => {
    try {
      const res = await fetch("https://api.binance.com/api/v3/ticker/24hr");
      const data = await res.json();
      // Ambil 50 koin teraktif biar pilihan radar lebih luas
      const top50 = data
        .filter((item: any) => item.symbol.endsWith("USDT"))
        .sort((a: any, b: any) => parseFloat(b.quoteVolume) - parseFloat(a.quoteVolume))
        .slice(0, 50);
      setCoinList(top50);
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
          const oldPrice = prevPrices.current[item.symbol] || currentPrice;
          
          // HITUNG PERGERAKAN DETIK INI
          const diff = currentPrice !== oldPrice ? ((currentPrice - oldPrice) / oldPrice) * 100 : 0;
          
          // SISTEM SKOR: Jika ada gerak, skor naik drastis. Jika diam, skor berkurang cepat.
          if (Math.abs(diff) > 0.001) {
             activityScore.current[item.symbol] = (activityScore.current[item.symbol] || 0) + Math.abs(diff) * 100;
             if (Math.abs(diff) > 0.03) {
                setLastAlert(`WHALE MOVE: ${item.symbol.replace("USDT","")} IS MOVING!`);
             }
          } else {
             activityScore.current[item.symbol] = (activityScore.current[item.symbol] || 0) * 0.8; // Cepat turun kalau diam
          }

          updated[item.symbol] = {
            price: currentPrice,
            change: parseFloat(item.priceChangePercent),
            vol: (parseFloat(item.quoteVolume) / 1000000).toFixed(1),
            score: activityScore.current[item.symbol] || 0,
            dir: currentPrice > oldPrice ? "up" : currentPrice < oldPrice ? "down" : "same"
          };
          prevPrices.current[item.symbol] = currentPrice;
        }
      });
      setPrices(updated);
    } catch (err) { console.error(err); }
  };

  useEffect(() => { fetchTopCoins(); }, []);
  useEffect(() => {
    const interval = setInterval(updateData, 800); // Super cepat (800ms)
    return () => clearInterval(interval);
  }, [coinList]);

  // SORTING: BERDASARKAN SKOR KEAKTIFAN (SIAPA YANG SEDANG GERAK SAAT INI)
  const sortedCoins = [...coinList].sort((a, b) => {
    const scoreA = prices[a.symbol]?.score || 0;
    const scoreB = prices[b.symbol]?.score || 0;
    return scoreB - scoreA;
  });

  const getSignal = (symbol: string) => {
    const score = prices[symbol]?.score || 0;
    const change = prices[symbol]?.change || 0;

    if (score > 5) return { label: "WHALE ACCUMULATE", color: "text-[#00ff00]", icon: "🐋" };
    if (score > 1) return { label: "SPEKULASI BUY", color: "text-green-400", icon: "⚡" };
    if (change < -5) return { label: "DISTRIBUTE / SELL", color: "text-red-500", icon: "🔴" };
    return { label: "NEUTRAL / WAIT", color: "text-gray-600", icon: "⚖️" };
  };

  return (
    <div className="min-h-screen bg-[#020202] text-white font-mono uppercase">
      {/* RADAR BANNER */}
      <div className="bg-[#00ff00] text-black py-1 px-4 text-[10px] font-black flex justify-between items-center sticky top-0 z-50 shadow-[0_0_20px_#00ff00]">
        <span>RADAR_ACTIVE >></span>
        <span className="animate-pulse">{lastAlert}</span>
        <span><< {new Date().toLocaleTimeString()}</span>
      </div>

      <div className="p-4">
        <div className="mb-6">
          <h1 className="text-[#00ff00] text-4xl font-black italic tracking-tighter leading-none">SENTINEL-X</h1>
          <p className="text-[7px] text-green-500/50 tracking-[0.6em] mt-2">Momentum-Based Priority System</p>
        </div>

        <div className="flex flex-col gap-3">
          {sortedCoins.map((coin) => {
            const data = prices[coin.symbol] || {};
            const sig = getSignal(coin.symbol);
            const isMoving = data.score > 0.5;

            return (
              <div 
                key={coin.symbol} 
                className={`p-5 rounded-lg border transition-all duration-500 ${
                  isMoving ? 'bg-[#081a08] border-[#00ff00] scale-[1.02] z-10' : 'bg-[#0a0a0a] border-white/5 opacity-40'
                }`}
              >
                <div className="flex justify-between items-start">
                  <div className="flex items-center gap-4">
                    <div className={`h-3 w-3 rounded-full ${data.dir === 'up' ? 'bg-green-500 animate-ping' : data.dir === 'down' ? 'bg-red-500 animate-ping' : 'bg-gray-900'}`}></div>
                    <h2 className="text-4xl font-black tracking-tighter">{coin.symbol.replace("USDT","")}</h2>
                  </div>
                  <div className={`text-[10px] font-black px-3 py-1 border border-current/30 rounded bg-black ${sig.color}`}>
                    {sig.icon} {sig.label}
                  </div>
                </div>

                <div className="grid grid-cols-3 gap-2 mt-5 text-center border-t border-white/10 pt-4">
                   <Stat label="Live Price" value={`$${data.price?.toLocaleString()}`} color={data.dir === 'up' ? 'text-green-400' : 'text-red-400'} />
                   <Stat label="Motive Score" value={data.score?.toFixed(2)} color="text-white" />
                   <Stat label="Whale Vol" value={`${data.vol}M`} color="text-[#00ff00]" />
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}

function Stat({ label, value, color }) {
  return (
    <div>
      <p className="text-[7px] text-gray-600 mb-1 font-bold">{label}</p>
      <p className={`text-xl font-black tracking-tighter ${color}`}>{value}</p>
    </div>
  );
}