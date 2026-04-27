"use client";

import { useState, useEffect, useRef } from "react";

export default function Dashboard() {
  const [prices, setPrices] = useState<{ [key: string]: any }>({});
  const [coinList, setCoinList] = useState<any[]>([]);
  const [lastAlert, setLastAlert] = useState<string>("SYSTEM_ACTIVE: SCANNING MARKET");
  const activityScore = useRef<{ [key: string]: number }>({});
  const prevPrices = useRef<{ [key: string]: number }>({});

  const fetchTopCoins = async () => {
    try {
      const res = await fetch("https://api.binance.com/api/v3/ticker/24hr");
      const data = await res.json();
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
          const diff = currentPrice !== oldPrice ? ((currentPrice - oldPrice) / oldPrice) * 100 : 0;
          
          if (Math.abs(diff) > 0.001) {
             activityScore.current[item.symbol] = (activityScore.current[item.symbol] || 0) + Math.abs(diff) * 100;
             if (Math.abs(diff) > 0.03) {
                setLastAlert(`MOVEMENT: ${item.symbol.replace("USDT","")} ACTIVATED!`);
             }
          } else {
             activityScore.current[item.symbol] = (activityScore.current[item.symbol] || 0) * 0.85;
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
    const interval = setInterval(updateData, 1000);
    return () => clearInterval(interval);
  }, [coinList]);

  const sortedCoins = [...coinList].sort((a, b) => {
    const scoreA = prices[a.symbol]?.score || 0;
    const scoreB = prices[b.symbol]?.score || 0;
    return scoreB - scoreA;
  });

  return (
    <div className="min-h-screen bg-[#020202] text-white font-mono uppercase">
      {/* HEADER BANNER - DIPERBAIKI AGAR TIDAK EROR */}
      <div className="bg-[#00ff00] text-black py-1 px-4 text-[10px] font-black flex justify-between items-center sticky top-0 z-50">
        <span>RADAR_ACTIVE</span>
        <span className="animate-pulse">{lastAlert}</span>
        <span>LIVE_FEED</span>
      </div>

      <div className="p-4">
        <div className="mb-6">
          <h1 className="text-[#00ff00] text-4xl font-black italic tracking-tighter leading-none text-center md:text-left">
            SENTINEL-X
          </h1>
          <p className="text-[7px] text-green-500/50 tracking-[0.5em] mt-2 text-center md:text-left">
            MOMENTUM PRIORITY SCANNER
          </p>
        </div>

        <div className="flex flex-col gap-3">
          {sortedCoins.map((coin) => {
            const data = prices[coin.symbol] || {};
            const isMoving = data.score > 1;

            return (
              <div 
                key={coin.symbol} 
                className={`p-5 rounded-lg border transition-all duration-500 ${
                  isMoving ? 'bg-[#081a08] border-[#00ff00] scale-[1.01]' : 'bg-[#0a0a0a] border-white/5 opacity-50'
                }`}
              >
                <div className="flex justify-between items-center">
                  <div className="flex items-center gap-4">
                    <div className={`h-2 w-2 rounded-full ${data.dir === 'up' ? 'bg-green-500 animate-ping' : data.dir === 'down' ? 'bg-red-500 animate-ping' : 'bg-gray-800'}`}></div>
                    <h2 className="text-3xl font-black tracking-tighter">{coin.symbol.replace("USDT","")}</h2>
                  </div>
                  <div className="text-[10px] font-black px-2 py-1 border border-[#00ff00]/30 rounded text-[#00ff00]">
                    SCORE: {data.score?.toFixed(1)}
                  </div>
                </div>

                <div className="grid grid-cols-3 gap-2 mt-4 text-center border-t border-white/10 pt-3">
                   <div>
                     <p className="text-[7px] text-gray-600 mb-1">PRICE</p>
                     <p className={`text-lg font-black ${data.dir === 'up' ? 'text-green-400' : 'text-red-400'}`}>
                       ${data.price?.toLocaleString()}
                     </p>
                   </div>
                   <div>
                     <p className="text-[7px] text-gray-600 mb-1">24H %</p>
                     <p className="text-lg font-black text-white">{data.change?.toFixed(2)}%</p>
                   </div>
                   <div>
                     <p className="text-[7px] text-gray-600 mb-1">VOL</p>
                     <p className="text-lg font-black text-[#00ff00]">{data.vol}M</p>
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