"use client";

import { useEffect, useState } from "react";

export default function ISTClock() {
  const [h, setH] = useState("12");
  const [m, setM] = useState("00");
  const [amPm, setAmPm] = useState("AM");
  const [date, setDate] = useState("");
  const [blink, setBlink] = useState(true);

  useEffect(() => {
    const tick = () => {
      const now = new Date();

      const timeStr = now.toLocaleTimeString("en-IN", {
        timeZone: "Asia/Kolkata",
        hour: "2-digit",
        minute: "2-digit",
        hour12: true,
      });
      // "02:45 pm" → split on space
      const [hm, ap] = timeStr.split(" ");
      const parts = (hm ?? "").split(":");
      setH(parts[0] ?? "12");
      setM(parts[1] ?? "00");
      setAmPm((ap ?? "AM").toUpperCase());

      const day = now.toLocaleDateString("en-IN", {
        timeZone: "Asia/Kolkata",
        weekday: "short",
      });
      const dayNum = now.toLocaleDateString("en-IN", {
        timeZone: "Asia/Kolkata",
        day: "numeric",
      });
      const month = now.toLocaleDateString("en-IN", {
        timeZone: "Asia/Kolkata",
        month: "short",
      });
      setDate(`${day}, ${dayNum} ${month}`);

      setBlink((v) => !v);
    };
    tick();
    const id = setInterval(tick, 1000);
    return () => clearInterval(id);
  }, []);

  return (
    <div className="hidden sm:flex flex-col items-center justify-center relative
      rounded-2xl overflow-hidden
      bg-[#0a0a0a] border border-white/[0.10]
      shadow-[0_0_18px_3px_rgba(234,179,8,0.10),0_0_0_1px_rgba(255,255,255,0.06),inset_0_1px_0_rgba(255,255,255,0.08)]
      px-4 py-2.5 min-w-[110px]"
    >
      {/* subtle gold top highlight */}
      <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-yellow-400/[0.25] to-transparent" />

      {/* FIFA-style digit display — HH : MM */}
      <div className="flex items-center gap-0.5 tabular-nums leading-none">
        {/* Hours */}
        <div className="flex gap-px">
          <span className="bg-zinc-800 text-white font-black text-lg px-1.5 py-0.5 rounded-md leading-none min-w-[22px] text-center">
            {h[0]}
          </span>
          <span className="bg-zinc-800 text-white font-black text-lg px-1.5 py-0.5 rounded-md leading-none min-w-[22px] text-center">
            {h[1]}
          </span>
        </div>

        {/* Blinking colon */}
        <span
          className="text-yellow-400 font-black text-xl mx-0.5 leading-none transition-opacity duration-100"
          style={{ opacity: blink ? 1 : 0.15 }}
        >
          :
        </span>

        {/* Minutes */}
        <div className="flex gap-px">
          <span className="bg-zinc-800 text-white font-black text-lg px-1.5 py-0.5 rounded-md leading-none min-w-[22px] text-center">
            {m[0]}
          </span>
          <span className="bg-zinc-800 text-white font-black text-lg px-1.5 py-0.5 rounded-md leading-none min-w-[22px] text-center">
            {m[1]}
          </span>
        </div>

        {/* AM/PM */}
        <span className="ml-1.5 text-[11px] font-black text-yellow-400 leading-none self-center">
          {amPm}
        </span>
      </div>

      {/* Manual scoreboard date — individual flip-board tiles */}
      <div className="flex items-center gap-0.5 mt-2">
        {date.split("").map((char, i) =>
          char === " " ? (
            <span key={i} className="w-1" />
          ) : (
            <span
              key={i}
              className="inline-flex items-center justify-center
                bg-zinc-800 border-b-2 border-zinc-600
                text-[9px] font-black uppercase tracking-tight text-amber-300
                rounded-[3px] px-[3px] py-[2px] min-w-[9px] leading-none
                shadow-[inset_0_1px_0_rgba(255,255,255,0.08),inset_0_-1px_0_rgba(0,0,0,0.4)]"
            >
              {char}
            </span>
          )
        )}
      </div>
    </div>
  );
}
