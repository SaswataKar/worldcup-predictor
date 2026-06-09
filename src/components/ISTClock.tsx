"use client";

import { useEffect, useState } from "react";

export default function ISTClock() {
  const [h, setH] = useState("00");
  const [m, setM] = useState("00");
  const [s, setS] = useState("00");
  const [amPm, setAmPm] = useState("AM");
  const [date, setDate] = useState("");
  const [blink, setBlink] = useState(true);

  useEffect(() => {
    const tick = () => {
      const now = new Date();
      // 12-hour time in IST
      const timeStr = now.toLocaleTimeString("en-IN", {
        timeZone: "Asia/Kolkata",
        hour: "2-digit",
        minute: "2-digit",
        second: "2-digit",
        hour12: true,
      });
      // "02:45:09 pm" → split on space → ["02:45:09", "pm"]
      const [hms, ampm] = timeStr.split(" ");
      const parts = (hms ?? "").split(":");
      setH(parts[0] ?? "00");
      setM(parts[1] ?? "00");
      setS(parts[2] ?? "00");
      setAmPm((ampm ?? "").toUpperCase());
      setDate(
        now.toLocaleDateString("en-IN", {
          timeZone: "Asia/Kolkata",
          weekday: "short",
          day: "numeric",
          month: "short",
        })
      );
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
      px-4 py-2.5 min-w-[130px]"
    >
      {/* subtle top highlight */}
      <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-yellow-400/[0.25] to-transparent" />

      {/* FIFA-style digit display */}
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

        {/* Colon — blinks every second */}
        <span
          className="text-yellow-400 font-black text-lg mx-0.5 leading-none transition-opacity duration-100"
          style={{ opacity: blink ? 1 : 0.2 }}
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

        {/* Colon */}
        <span
          className="text-yellow-400 font-black text-lg mx-0.5 leading-none transition-opacity duration-100"
          style={{ opacity: blink ? 1 : 0.2 }}
        >
          :
        </span>

        {/* Seconds */}
        <div className="flex gap-px">
          <span className="bg-zinc-800 text-white font-black text-lg px-1.5 py-0.5 rounded-md leading-none min-w-[22px] text-center">
            {s[0]}
          </span>
          <span className="bg-zinc-800 text-white font-black text-lg px-1.5 py-0.5 rounded-md leading-none min-w-[22px] text-center">
            {s[1]}
          </span>
        </div>
        {/* AM/PM badge */}
        <span className="ml-1.5 text-[11px] font-black text-yellow-400 leading-none self-center">
          {amPm}
        </span>
      </div>

      {/* Date */}
      <div className="text-[9px] text-zinc-500 mt-1.5 tracking-wide">{date}</div>
    </div>
  );
}
