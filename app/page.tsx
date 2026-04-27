"use client";

import { useState, useEffect, useRef } from "react";

export default function Dashboard() {
  const [prices, setPrices] = useState<any>({});
  const [coinList, setCoinList] = useState<any[]>([]);
  const [alertText, setAlertText] = useState("RADAR_ACTIVE");
  const activityScore = useRef<any>({});
  const prevPrices = useRef<any>({});

  useEffect(() => {
    const fetchList = async () => {
      try {
        const res = await fetch("https://api.binance.com/api/v3/ticker/24hr");
        const data = await res.json();
        const top50 = data
          .filter((item: any) => item.symbol.endsWith("USDT"))
          .sort((a: any, b: any) => parseFloat(b.quoteVolume) - parseFloat(a.quoteVolume))
          .slice(0, 50);
        setCoinList(top50);
      } catch (e) { console.log(e); }
    };
    fetchList();
  }, []);

  useEffect(() => {
    if (coinList.length === 0) return;

    const interval = setInterval(async () => {
      try {
        const res = await fetch("https://api.binance.com/api/v3/ticker/24hr");
        const data = await res.json();
        const updated: any = {};

        data.forEach((item: any) => {
          if (coinList.find(c => c.symbol === item.symbol)) {
            const current = parseFloat(item.lastPrice);
            const old = prevPrices.current[item.symbol] || current;
            const diff = current !== old ? ((current - old) / old) * 100 : 0;

            if (Math.abs(diff) > 0.001) {
              activityScore.current[item.symbol] = (activityScore.current[item.symbol] || 0) + Math.abs(diff) * 150;
              if (Math.abs(diff) > 0.02) setAlertText("VOL_SPIKE: " + item.symbol);
            } else {
              activityScore.current[item.symbol] = (activityScore.current[item.symbol] || 0) * 0.8;
            }

            updated[item.symbol] = {
              price: current,
              change: parseFloat(item.priceChangePercent),
              vol: (parseFloat(item.quoteVolume) / 1000000).toFixed(1),
              score: activityScore.current[item.symbol] || 0,
              up: current > old,
              down: current < old
            };
            prevPrices.current[item.symbol] = current;
          }
        });
        setPrices(updated);
      } catch (e) { console.log(e); }
    }, 1000);

    return () => clearInterval(interval);
  }, [coinList]);

  const sorted = [...coinList].sort((a, b) => {
    const sA = prices[a.symbol]?.score || 0;
    const sB = prices[b.symbol]?.score || 0;
    return sB - sA;
  });

  return (
    <div className="min-h-screen bg-black text-white font-mono uppercase text-[10px]">
      {/* BANNER ATAS - SIMBOL SUDAH DIHAPUS TOTAL */}
      <div className="bg-[#00ff00] text-black p-2 font-black flex justify-between sticky top-0 z-50">
        <span>STATUS: ACTIVE</span>
        <span className="animate-pulse">{alertText}</span>
        <span>FEED: LIVE</span>
      </div>

      <div className="p-4 space-y-4">
        <div className="flex justify-between items-end border-b border-[#00ff00]/20 pb-4">
          <h1 className="text-[#00ff00] text-4xl font-black italic tracking-tighter leading-none">SENTINEL-X</h1>
          <div className="text-[8px] text-zinc-500 font-bold tracking-widest uppercase">Momentum Engine</div>
        </div>
        
        <div className="flex flex-col gap-3">
          {sorted.map((coin) => {
            const d = prices[coin.symbol] || {};
            const moving = d.score > 2;

            return (
              <div key={coin.symbol} className={`p-5 border transition-all duration-500 ${moving ? 'bg-[#081a08] border-[#00ff00] scale-[1.02]' : 'bg-black border-zinc-800 opacity-40'}`}>
                <div className="flex justify-between items-center mb-4">
                  <div className="flex items-center gap-4">
                    <div className={`h-2 w-2 rounded-full ${d.up ? 'bg-green-500 animate-ping' : d.down ? 'bg-red-500 animate-ping' : 'bg-zinc-800'}`}></div>
                    <span className="text-3xl font-black tracking-tighter">{coin.symbol.replace("USDT","")}</span>
                  </div>
                  <div className="text-[10px] font-bold px-2 py-1 border border-[#00ff00]/30 rounded text-[#00ff00]">
                    SCORE: {d.score?.toFixed(1)}
                  </div>
                </div>

                <div className="grid grid-cols-3 gap-2 border-t border-zinc-800 pt-4 text-center">
                  <div>
                    <p className="text-zinc-600 text-[8px] font-bold">PRICE</p>
                    <p className={`text-lg font-black ${d.up ? 'text-green-400' : d.down ? 'text-red-400' : 'text-white'}`}>
                      ${d.price?.toLocaleString()}
                    </p>
                  </div>
                  <div>
                    <p className="text-zinc-600 text-[8px] font-bold">24H %</p>
                    <p className="text-lg font-black">{d.change?.toFixed(2)}%</p>
                  </div>
                  <div>
                    <p className="text-zinc-600 text-[8px] font-bold">VOL</p>
                    <p className="text-lg font-black text-[#00ff00]">{d.vol}M</p>
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