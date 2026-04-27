"use client";

import { useState, useEffect, useRef } from "react";

export default function Dashboard() {
  const [prices, setPrices] = useState<{ [key: string]: any }>({});
  const [coinList, setCoinList] = useState<any[]>([]);
  const [lastAlert, setLastAlert] = useState<string>("SCANNING RAPID MOVEMENTS...");
  const velocityRef = useRef<{ [key: string]: number }>({}); // Menyimpan kecepatan gerak koin
  const prevPrices = useRef<{ [key: string]: number }>({});

  const fetchTopCoins = async () => {
    try {
      const res = await fetch("https://api.binance.com/api/v3/ticker/24hr");
      const data = await res.json();
      const top30 = data
        .filter((item: any) => item.symbol.endsWith("USDT"))
        .sort((a: any, b: any) => parseFloat(b.quoteVolume) - parseFloat(a.quoteVolume))
        .slice(0, 30);
      setCoinList(top30);
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
          
          // HITUNG VELOCITY (KECEPATAN GERAK DETIK INI)
          const diff = ((currentPrice - oldPrice) / oldPrice) * 100;
          
          // Akumulasi kecepatan (Velocity)
          velocityRef.current[item.symbol] = (velocityRef.current[item.symbol] || 0) * 0.9 + diff;

          if (Math.abs(diff) > 0.02) { 
            setLastAlert(`ACTION: ${item.symbol.replace("USDT","")} MOVING FAST (${diff > 0 ? '+' : ''}${diff.toFixed(3)}%)`);
          }

          updated[item.symbol] = {
            price: currentPrice,
            change: parseFloat(item.priceChangePercent),
            vol: (parseFloat(item.quoteVolume) / 1000000).toFixed(2),
            velocity: velocityRef.current[item.symbol],
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
    const interval = setInterval(updateData, 1000); 
    return () => clearInterval(interval);
  }, [coinList]);

  // SORTING BERDASARKAN VELOCITY (SIAPA YANG PALING LINCAH SAAT INI)
  const sortedCoins = [...coinList].sort((a, b) => {
    const velA = Math.abs(prices[a.symbol]?.velocity || 0);
    const velB = Math.abs(prices[b.symbol]?.velocity || 0);
    return velB - velA; // Yang pergerakannya paling agresif di atas
  });

  const getSignal = (symbol: string) => {
    const data = prices[symbol];
    if (!data) return { label: "SCANNING", color: "text-gray-600", icon: "📡" };
    const vel = data.velocity || 0;
    
    if (vel > 0.01) return { label: "ACCUMULATE / BUY", color: "text-[#00ff00]", icon: "🟢" };
    if (vel > 0.005) return { label: "SPEKULASI BUY", color: "text-green-400", icon: "⚡" };
    if (vel < -0.01) return { label: "DISTRIBUTE / SELL", color: "text-red-500", icon: "🔴" };
    if (vel < -0.005) return { label: "WAIT & SEE", color: "text-yellow-500", icon: "🩹" };
    return { label: "NEUTRAL", color: "text-gray-500", icon: "⚖️" };
  };

  return (
    <div className="min-h-screen bg-[#020202] text-white font-mono">
      {/* VELOCITY ALERT BANNER */}
      <div className="bg-[#00ff00] text-black py-1 px-4 text-[10px] font-black flex justify-between items-center sticky top-0 z-50 shadow-[0_0_15px_#00ff00]">
        <span className="animate-pulse italic">VELOCITY_RADAR >></span>
        <span className="uppercase">{lastAlert}</span>
        <span className="animate-pulse italic"><< DETECTING_WHALES</span>
      </div>

      <div className="p-4">
        <div className="mb-4">
          <h1 className="text-[#00ff00] text-3xl font-black italic tracking-tighter">SENTINEL-X</h1>
          <p className="text-[8px] text-green-500/50 uppercase tracking-[0.5em]">Active Velocity Sorting</p>
        </div>

        <div className="flex flex-col gap-3">
          {sortedCoins.map((coin) => {
            const data = prices[coin.symbol] || {};
            const sig = getSignal(coin.symbol);
            const isActive = Math.abs(data.velocity) > 0.005;

            return (
              <div 
                key={coin.symbol} 
                className={`p-4 rounded border transition-all duration-500 ${
                  isActive ? 'bg-[#081a08] border-[#00ff00]/50 translate-x-1' : 'bg-[#0a0a0a] border-white/5 opacity-80'
                }`}
              >
                <div className="flex justify-between items-center">
                  <div className="flex items-center gap-3">
                    <div className={`h-2 w-2 rounded-full ${data.velocity > 0 ? 'bg-green-500 animate-ping' : data.velocity < 0 ? 'bg-red-500' : 'bg-gray-800'}`}></div>
                    <h2 className="text-3xl font-black tracking-tighter uppercase">{coin.symbol.replace("USDT","")}</h2>
                  </div>
                  <div className={`text-[9px] font-black px-3 py-1 border border-current/20 rounded bg-black flex items-center gap-2 ${sig.color}`}>
                    {sig.icon} {sig.label}
                  </div>
                </div>

                <div className="grid grid-cols-3 gap-2 mt-4 text-center border-t border-white/5 pt-3">
                   <div>
                     <p className="text-[7px] text-gray-600 uppercase">Price</p>
                     <p className={`text-lg font-bold ${data.dir === 'up' ? 'text-green-400' : 'text-red-400'}`}>${data.price?.toLocaleString()}</p>
                   </div>
                   <div>
                     <p className="text-[7px] text-gray-600 uppercase">Velocity (Speed)</p>
                     <p className="text-lg font-bold text-white">{data.velocity?.toFixed(4)}</p>
                   </div>
                   <div>
                     <p className="text-[7px] text-gray-600 uppercase">Whale Vol</p>
                     <p className="text-lg font-bold text-[#00ff00]">{data.vol}M</p>
                   </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}