"use client";

import { useState, useEffect, useRef } from "react";

export default function Dashboard() {
  const [prices, setPrices] = useState<{ [key: string]: any }>({});
  const [coinList, setCoinList] = useState<any[]>([]);
  const [lastAlert, setLastAlert] = useState<string>("WAITING FOR MARKET MOVEMENT...");
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
          const oldPrice = prevPrices.current[item.symbol] || currentPrice;
          const diff = ((currentPrice - oldPrice) / oldPrice) * 100;

          // DETEKSI PERGERAKAN INSTAN (FLASH SIGNAL)
          if (Math.abs(diff) > 0.05) { 
            setLastAlert(`INSTANT SPIKE: ${item.symbol.replace("USDT","")} ${diff > 0 ? '▲' : '▼'} ${diff.toFixed(3)}%`);
          }

          updated[item.symbol] = {
            price: currentPrice,
            change: parseFloat(item.priceChangePercent),
            vol: (parseFloat(item.quoteVolume) / 1000000).toFixed(2),
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

  const getWhaleSignal = (symbol: string) => {
    const data = prices[symbol];
    if (!data) return { label: "SCANNING", color: "text-gray-600", priority: 3, icon: "📡" };
    
    // Logika Sinyal sesuai request (Urutan Prioritas)
    if (data.change > 4) return { label: "ACCUMULATE / BUY", color: "text-[#00ff00]", priority: 1, icon: "🟢" };
    if (data.change > 1.5) return { label: "SPEKULASI BUY", color: "text-green-400", priority: 2, icon: "⚡" };
    if (data.change < -4) return { label: "DISTRIBUTE / SELL", color: "text-red-500", priority: 5, icon: "🔴" };
    if (data.change < -1.5) return { label: "WAIT & SEE", color: "text-yellow-500", priority: 4, icon: "🩹" };
    return { label: "NEUTRAL", color: "text-gray-500", priority: 3, icon: "⚖️" };
  };

  const sortedCoins = [...coinList].sort((a, b) => {
    const sigA = getWhaleSignal(a.symbol);
    const sigB = getWhaleSignal(b.symbol);
    if (sigA.priority !== sigB.priority) return sigA.priority - sigB.priority;
    return parseFloat(prices[b.symbol]?.vol || 0) - parseFloat(prices[a.symbol]?.vol || 0);
  });

  return (
    <div className="min-h-screen bg-[#020202] text-white font-mono overflow-x-hidden">
      {/* FLASH ALERT BANNER (INFO PERGERAKAN LANGSUNG) */}
      <div className="bg-[#00ff00] text-black py-1 px-4 text-[10px] font-black flex justify-between items-center sticky top-0 z-50 overflow-hidden whitespace-nowrap">
        <span className="animate-pulse">SYSTEM_ALERT_READY >> </span>
        <span className="uppercase tracking-tighter">{lastAlert}</span>
        <span className="animate-pulse"> << LIVE_DATA</span>
      </div>

      <div className="p-4">
        <div className="mb-6 flex justify-between items-end border-b border-green-900/30 pb-4">
          <div>
            <h1 className="text-[#00ff00] text-3xl font-black italic tracking-tighter leading-none">SENTINEL-X</h1>
            <p className="text-[8px] text-green-500/50 tracking-[0.4em] uppercase mt-1 text-center">Auto-Priority Scanner</p>
          </div>
          <div className="text-[9px] text-gray-700 font-bold border border-gray-800 px-2 py-1">
            CORE_V.12.04
          </div>
        </div>

        <div className="flex flex-col gap-4">
          {sortedCoins.map((coin) => {
            const data = prices[coin.symbol] || {};
            const sig = getWhaleSignal(coin.symbol);
            const isUp = data.dir === "up";
            const isDown = data.dir === "down";

            return (
              <div 
                key={coin.symbol} 
                className={`p-5 rounded-lg border transition-all duration-700 ${
                  sig.priority <= 2 
                  ? 'bg-[#081a08] border-[#00ff00]/40 shadow-[0_0_20px_rgba(0,255,0,0.1)]' 
                  : 'bg-[#0a0a0a] border-white/5'
                } ${isUp ? 'border-t-green-500' : isDown ? 'border-t-red-500' : ''}`}
              >
                <div className="flex justify-between items-start mb-4">
                  <div className="flex items-center gap-4">
                      <div className={`h-3 w-3 rounded-full ${isUp ? 'bg-green-500 animate-ping' : isDown ? 'bg-red-500' : 'bg-gray-800'}`}></div>
                      <h2 className="text-4xl font-black tracking-tighter">{coin.symbol.replace("USDT", "")}</h2>
                  </div>
                  <div className={`text-[10px] font-black px-4 py-1 border border-current/30 rounded bg-black/60 flex items-center gap-2 ${sig.color}`}>
                    {sig.icon} {sig.label}
                  </div>
                </div>

                <div className="grid grid-cols-3 gap-4 border-y border-white/5 py-4 my-2">
                  <Stat label="Price" value={`$${data.price?.toLocaleString(undefined, { minimumFractionDigits: 2 })}`} color={isUp ? "text-green-400" : isDown ? "text-red-400" : "text-white"} />
                  <Stat label="24h %" value={`${data.change > 0 ? "+" : ""}${data.change?.toFixed(2)}%`} color={data.change > 0 ? 'text-green-500' : 'text-red-500'} />
                  <Stat label="Whale Vol" value={`${data.vol}M`} color="text-[#00ff00]" />
                </div>

                <div className="flex justify-between items-center mt-3">
                   <div className="text-[7px] text-gray-700 uppercase tracking-[0.2em] font-bold">
                     Target Liquidity: ${(data.price * 1.07).toFixed(2)}
                   </div>
                   <div className="text-[7px] text-green-900 font-black animate-pulse">MONITORING_ACTIVE</div>
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
    <div className="text-center">
      <p className="text-[7px] text-gray-600 uppercase mb-1 font-bold">{label}</p>
      <p className={`text-xl font-black tracking-tighter ${color}`}>{value}</p>
    </div>
  );
}