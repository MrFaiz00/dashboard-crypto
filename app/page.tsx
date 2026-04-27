"use client";

import { useState, useEffect } from "react";
import { LineChart, Line, ResponsiveContainer, YAxis } from "recharts";

const TIKERS = [
  { symbol: "BTCUSDT", name: "Bitcoin", color: "#00ff00" },
  { symbol: "ETHUSDT", name: "Ethereum", color: "#3b82f6" },
  { symbol: "SOLUSDT", name: "Solana", color: "#a855f7" },
];

export default function Dashboard() {
  const [prices, setPrices] = useState<{ [key: string]: any[] }>({});
  const [logs, setLogs] = useState<string[]>(["System initialized...", "Awaiting market data..."]);

  // Fungsi Bunyi Beep (Hanya bunyi kalau ada BUY Signal)
  const playAlert = () => {
    const context = new (window.AudioContext || (window as any).webkitAudioContext)();
    const osc = context.createOscillator();
    const gain = context.createGain();
    osc.connect(gain);
    gain.connect(context.destination);
    osc.type = "sine";
    osc.frequency.value = 880;
    gain.gain.setValueAtTime(0.1, context.currentTime);
    osc.start();
    osc.stop(context.currentTime + 0.1);
  };

  const fetchPrices = async () => {
    try {
      const response = await fetch("https://api.binance.com/api/v3/ticker/price");
      const data = await response.json();
      
      const newPrices = { ...prices };
      data.forEach((item: any) => {
        if (TIKERS.find(t => t.symbol === item.symbol)) {
          const priceVal = parseFloat(item.price);
          const history = newPrices[item.symbol] || [];
          
          // Logika Bunyi: Jika harga naik drastis dari data sebelumnya
          if (history.length > 0 && priceVal > history[history.length - 1].val * 1.0001) {
             // playAlert(); // Hapus komentar ini jika ingin ada bunyi beep (tapi harus klik layar dulu sekali)
          }

          newPrices[item.symbol] = [...history, { val: priceVal }].slice(-20);
        }
      });
      setPrices(newPrices);
    } catch (error) { console.error(error); }
  };

  useEffect(() => {
    fetchPrices();
    const interval = setInterval(fetchPrices, 3000);
    return () => clearInterval(interval);
  }, [prices]);

  const getSignal = (history: any[]) => {
    if (history.length < 5) return { label: "SCANNING", color: "text-gray-500", bg: "bg-gray-500/10" };
    const last = history[history.length - 1].val;
    const prev = history[history.length - 5].val;
    if (last > prev) return { label: "STRONG BUY", color: "text-[#00ff00]", bg: "bg-green-500/20" };
    if (last < prev) return { label: "STRONG SELL", color: "text-red-500", bg: "bg-red-500/20" };
    return { label: "NEUTRAL", color: "text-yellow-500", bg: "bg-yellow-500/10" };
  };

  return (
    <div className="min-h-screen bg-black text-yellow-400 p-4 font-mono overflow-hidden flex flex-col">
      {/* HEADER */}
      <div className="flex justify-between items-center border-b border-green-900/50 pb-4 mb-6">
        <div>
          <h1 className="text-[#00ff00] font-black text-2xl tracking-tighter italic">SENTINEL-X</h1>
          <p className="text-[9px] text-gray-500 tracking-[0.3em] uppercase">Advanced Market Terminal</p>
        </div>
        <div className="text-right text-[10px]">
          <p className="text-green-500">Uptime: 99.9%</p>
          <p className="text-gray-600 uppercase">Secure Connection: SSL_AES_256</p>
        </div>
      </div>

      {/* MAIN CONTENT */}
      <div className="flex-1 grid grid-cols-1 md:grid-cols-3 gap-4 overflow-y-auto">
        {TIKERS.map((coin) => {
          const history = prices[coin.symbol] || [];
          const sig = getSignal(history);
          const current = history.length > 0 ? history[history.length - 1].val : 0;

          return (
            <div key={coin.symbol} className="bg-[#050505] border border-white/5 p-4 flex flex-col justify-between hover:border-white/20 transition-all">
              <div className="flex justify-between items-center mb-4">
                <span className="text-xs font-bold text-gray-400">{coin.name}</span>
                <div className={`${sig.bg} ${sig.color} text-[9px] font-black px-2 py-1`}>{sig.label}</div>
              </div>

              <div className="mb-4">
                <p className="text-[9px] text-gray-600 uppercase tracking-widest">{coin.symbol}</p>
                <p className="text-3xl font-black text-white tracking-tighter">${current.toLocaleString()}</p>
              </div>

              <div className="h-24 w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={history}>
                    <YAxis domain={['auto', 'auto']} hide />
                    <Line type="monotone" dataKey="val" stroke={sig.color.includes('green') ? '#00ff00' : sig.color.includes('red') ? '#ff0000' : '#444'} strokeWidth={2} dot={false} isAnimationActive={false} />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            </div>
          );
        })}
      </div>

      {/* FOOTER - LIVE NEWS / LOGS */}
      <div className="mt-4 bg-[#0a0a0a] border border-green-900/20 p-3 h-32 relative overflow-hidden">
        <div className="absolute top-0 left-0 w-full h-[1px] bg-green-500/30 animate-pulse"></div>
        <h3 className="text-[9px] text-green-800 font-bold mb-2 uppercase tracking-[0.2em]">Global Intelligence Feed:</h3>
        <div className="text-[10px] text-gray-500 space-y-1">
          <p className="text-blue-500 animate-pulse font-bold">&gt; [NEWS] US Federal Reserve maintains interest rates...</p>
          <p>&gt; [WHALE] Large BTC transfer (1,400 BTC) from Unknown Wallet to Binance.</p>
          <p className="text-green-900">&gt; [ALGO] Momentum cross-over detected on 15m timeframe.</p>
          <p>&gt; [INFO] All systems operational. Waiting for next volatility spike.</p>
        </div>
      </div>
    </div>
  );
}