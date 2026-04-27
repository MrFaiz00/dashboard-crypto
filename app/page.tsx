"use client";

import { useState, useEffect } from "react";

export default function Dashboard() {
  const [coinData, setCoinData] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchMarketData = async () => {
    try {
      const res = await fetch(
        "https://api.coingecko.com/api/v3/coins/markets?vs_currency=usd&order=market_cap_desc&per_page=30&page=1&sparkline=false&price_change_percentage=24h"
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
    const interval = setInterval(fetchMarketData, 60000); 
    return () => clearInterval(interval);
  }, []);

  // LOGIKA SINYAL BERDASARKAN WHALE MOVEMENT (VOLUME & PRICE)
  const getWhaleSignal = (coin: any) => {
    const priceChange = coin.price_change_percentage_24h;
    // Simulasi deteksi volume raksasa (Whale Power)
    const volumeToCap = (coin.total_volume / coin.market_cap) * 100;
    
    // 1. WHALE ACCUMULATING (Harga naik stabil + Volume tinggi)
    if (priceChange > 2 && volumeToCap > 5) {
      return { label: "WHALE ACCUMULATE", color: "text-[#00ff00]", icon: "🐋", priority: 1, desc: "B-Power: HIGH" };
    }
    // 2. SPEKULASI BUY (Harga naik kencang, volume ngekor)
    if (priceChange > 5) {
      return { label: "SPEKULASI BUY", color: "text-green-400", icon: "⚡", priority: 2, desc: "Momentum: UP" };
    }
    // 3. WHALE DISTRIBUTING (Harga mulai turun + Volume besar)
    if (priceChange < -2 && volumeToCap > 8) {
      return { label: "WHALE DUMPING", color: "text-red-600", icon: "🚨", priority: 5, desc: "Exit Flow: DETECTED" };
    }
    // 4. WAIT & SEE (Market lesu/sideways)
    if (priceChange < -3) {
      return { label: "WAIT & SEE", color: "text-yellow-500", icon: "🩹", priority: 4, desc: "No Whale Action" };
    }
    // 5. NEUTRAL
    return { label: "NEUTRAL / SIDEWAYS", color: "text-gray-500", icon: "⚖️", priority: 3, desc: "Stable Flow" };
  };

  // SORTING: WHALE ACCUMULATE SELALU DI ATAS
  const sortedCoins = [...coinData].sort((a, b) => {
    const sigA = getWhaleSignal(a);
    const sigB = getWhaleSignal(b);
    if (sigA.priority !== sigB.priority) return sigA.priority - sigB.priority;
    return b.total_volume - a.total_volume; // Jika sinyal sama, volume terbesar di atas
  });

  if (loading) return <div className="min-h-screen bg-black text-[#00ff00] flex items-center justify-center font-mono text-xl tracking-[0.5em]">SYNCING WHALE DATA...</div>;

  return (
    <div className="min-h-screen bg-[#020202] text-white p-4 font-mono">
      {/* HEADER GAHAR */}
      <div className="mb-6 sticky top-0 bg-[#020202]/90 backdrop-blur-md z-10 py-3 border-b border-green-500/20">
        <div className="flex justify-between items-center text-[#00ff00]">
          <h1 className="text-2xl font-black italic tracking-tighter">SENTINEL v12.0</h1>
          <span className="text-[10px] animate-pulse border border-[#00ff00] px-2">ENCRYPTED FEED</span>
        </div>
        <p className="text-[8px] text-gray-600 mt-1 uppercase tracking-[0.3em]">Whale Tracking System Active</p>
      </div>

      <div className="space-y-4">
        {sortedCoins.map((coin) => {
          const sig = getWhaleSignal(coin);
          const whalePower = (coin.total_volume / 100000000).toFixed(1);

          return (
            <div key={coin.id} className={`p-4 rounded-lg border-l-4 transition-all duration-500 ${
              sig.priority === 1 ? 'border-green-500 bg-[#051005] shadow-[0_0_20px_rgba(0,255,0,0.05)]' : 'border-zinc-800 bg-[#080808]'
            }`}>
              <div className="flex justify-between items-start mb-3">
                <div className="flex items-center gap-3">
                  <img src={coin.image} alt="" className={`w-8 h-8 ${sig.priority === 1 ? 'animate-pulse' : 'grayscale opacity-50'}`} />
                  <div>
                    <h2 className="text-xl font-black text-white leading-none uppercase">{coin.symbol}</h2>
                    <p className="text-[7px] text-gray-600 mt-1 uppercase tracking-widest">{coin.name}</p>
                  </div>
                </div>
                <div className={`text-[10px] font-black px-3 py-1 border border-current/20 rounded bg-black flex items-center gap-2 ${sig.color}`}>
                  {sig.icon} {sig.label}
                </div>
              </div>

              <div className="grid grid-cols-4 gap-4 py-2 border-y border-white/5 my-3">
                <Stat label="Price" value={`$${coin.current_price.toLocaleString()}`} />
                <Stat label="24H Change" value={`${coin.price_change_percentage_24h?.toFixed(2)}%`} color={coin.price_change_percentage_24h > 0 ? 'text-green-500' : 'text-red-500'} />
                <Stat label="Whale Power" value={`${whalePower}M`} />
                <Stat label="Status" value={sig.desc} color="text-gray-400" />
              </div>

              <div className="flex justify-between items-end">
                <div>
                  <p className="text-[7px] text-gray-600 uppercase">Target Whale Liquidation</p>
                  <p className="text-lg font-black text-[#00ff00] tracking-tighter">
                    ${(coin.current_price * 1.1).toLocaleString()}
                  </p>
                </div>
                <div className="text-[9px] font-bold text-zinc-800">SCANNING_ID: {coin.market_cap_rank}</div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

// Komponen Kecil untuk Statistik
function Stat({ label, value, color = "text-white" }) {
  return (
    <div>
      <p className="text-[7px] text-gray-700 uppercase font-bold tracking-tighter mb-1">{label}</p>
      <p className={`text-[11px] font-black leading-none ${color}`}>{value}</p>
    </div>
  );
}