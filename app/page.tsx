"use client";

import { useState, useEffect } from "react";
import { LineChart, Line, ResponsiveContainer, YAxis } from "recharts";

export default function Dashboard() {
  const [prices, setPrices] = useState<{ [key: string]: any[] }>({});
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

  const updatePrices = async () => {
    try {
      const res = await fetch("https://api.binance.com/api/v3/ticker/price");
      const data = await res.json();
      setPrices(prev => {
        const next = { ...prev };
        data.forEach((item: any) => {
          if (coinList.find(c => c.symbol === item.symbol)) {
            const val = parseFloat(item.price);
            const history = next[item.symbol] || [];
            next[item.symbol] = [...history, { val }].slice(-15);
          }
        });
        return next;
      });
    } catch (err) { console.error(err); }
  };

  useEffect(() => { fetchTopCoins(); }, []);
  useEffect(() => {
    if (coinList.length > 0) {
      const interval = setInterval(updatePrices, 3000);
      return () => clearInterval(interval);
    }
  }, [coinList]);

  // FUNGSI DETEKSI SINYAL
  const getSignal = (history: any[]) => {
    if (history.length < 10) return { label: "SCANNING", color: "text-gray-500", bg: "bg-gray-500/10" };
    const current = history[history.length - 1].val;
    const old = history[history.length - 8].val;
    
    if (current > old * 1.0002) return { label: "BUY", color: "text-green-400", bg: "bg-green-500/20" };
    if (current < old * 0.9998) return { label: "SELL", color: "text-red-400", bg: "bg-red-500/20" };
    return { label: "HOLD", color: "text-yellow-500", bg: "bg-yellow-500/10" };
  };

  return (
    <div className="min-h-screen bg-black text-white p-4 font-mono">
      <div className="flex justify-between items-center border-b border-green-900 pb-4 mb-6">
        <div>
          <h1 className="text-[#00ff00] font-black text-xl italic tracking-tighter">SENTINEL SCANNER V2.0</h1>
          <p className="text-[9px] text-gray-500">REAL-TIME MULTI-ASSET INTELLIGENCE</p>
        </div>
        <div className="text-[10px] text-green-500 animate-pulse font-bold">● FEED ACTIVE</div>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-5 gap-4">
        {coinList.map((coin) => {
          const history = prices[coin.symbol] || [];
          const current = history.length > 0 ? history[history.length - 1].val : 0;
          const signal = getSignal(history);

          return (
            <div key={coin.symbol} className="bg-[#080808] border border-white/10 p-3 rounded-lg hover:border-green-500/40 transition-all">
              <div className="flex justify-between items-start mb-2">
                <span className="text-[10px] text-gray-400 font-bold uppercase">{coin.symbol.replace("USDT", "")}</span>
                <span className={`text-[8px] font-black px-2 py-0.5 rounded ${signal.bg} ${signal.color}`}>
                  {signal.label}
                </span>
              </div>
              
              <div className="text-xl font-black tracking-tighter mb-1 text-white">
                ${current < 1 ? current.toFixed(5) : current.toLocaleString()}
              </div>

              <div className="h-12 w-full mt-2">
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={history}>
                    <YAxis domain={['auto', 'auto']} hide />
                    <Line 
                      type="monotone" 
                      dataKey="val" 
                      stroke={signal.label === "BUY" ? "#22c55e" : signal.label === "SELL" ? "#ef4444" : "#eab308"} 
                      strokeWidth={2} 
                      dot={false} 
                      isAnimationActive={false} 
                    />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}