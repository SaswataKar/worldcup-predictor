"use client";

import { useEffect, useState } from "react";
import { userTZ, tzLabel } from "@/lib/utils";

export default function ISTClock() {
  const [h, setH] = useState("12");
  const [m, setM] = useState("00");
  const [s, setS] = useState("00");
  const [amPm, setAmPm] = useState("AM");
  const [weekday, setWeekday] = useState("MON");
  const [day, setDay] = useState("1");
  const [month, setMonth] = useState("JAN");
  const [blink, setBlink] = useState(true);
  const [tz, setTz] = useState("IST");

  useEffect(() => {
    const zone = userTZ();
    setTz(tzLabel(zone));

    const tick = () => {
      const now = new Date();

      const timeStr = now.toLocaleTimeString("en-US", {
        timeZone: zone,
        hour: "2-digit",
        minute: "2-digit",
        second: "2-digit",
        hour12: true,
      });
      // "12:34:56 AM" format
      const parts = timeStr.split(":");
      setH(parts[0] ?? "12");
      setM(parts[1] ?? "00");
      const secAm = (parts[2] ?? "00 AM").split(" ");
      setS(secAm[0] ?? "00");
      setAmPm(secAm[1] ?? "AM");

      setWeekday(
        now.toLocaleDateString("en-US", { timeZone: zone, weekday: "short" }).toUpperCase()
      );
      setDay(
        now.toLocaleDateString("en-US", { timeZone: zone, day: "numeric" })
      );
      setMonth(
        now.toLocaleDateString("en-US", { timeZone: zone, month: "short" }).toUpperCase()
      );

      setBlink((v) => !v);
    };
    tick();
    const id = setInterval(tick, 1000);
    return () => clearInterval(id);
  }, []);

  const Digit = ({ char }: { char: string }) => (
    <span className="inline-flex items-center justify-center bg-zinc-800 text-white font-black text-lg px-1.5 py-0.5 rounded-md leading-none min-w-[22px] text-center">
      {char}
    </span>
  );

  const Colon = () => (
    <span
      className="text-yellow-400 font-black text-xl mx-0.5 leading-none transition-opacity duration-100"
      style={{ opacity: blink ? 1 : 0.15 }}
    >
      :
    </span>
  );

  return (
    <div className="hidden sm:flex items-center gap-2">

      {/* ── CLOCK ── */}
      <div className="flex flex-col items-center justify-center relative
        rounded-2xl overflow-hidden bg-[#0a0a0a] border border-white/[0.10]
        shadow-[0_0_18px_3px_rgba(234,179,8,0.10),0_0_0_1px_rgba(255,255,255,0.06),inset_0_1px_0_rgba(255,255,255,0.08)]
        px-3 py-2"
      >
        <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-yellow-400/[0.25] to-transparent" />

        <div className="flex items-center gap-0.5 tabular-nums leading-none">
          <div className="flex gap-px"><Digit char={h[0] ?? "1"} /><Digit char={h[1] ?? "2"} /></div>
          <Colon />
          <div className="flex gap-px"><Digit char={m[0] ?? "0"} /><Digit char={m[1] ?? "0"} /></div>
          <Colon />
          <div className="flex gap-px"><Digit char={s[0] ?? "0"} /><Digit char={s[1] ?? "0"} /></div>
          <span className="ml-1.5 text-[9px] font-black text-yellow-400 leading-none self-center text-center">
            <span className="block">{amPm}</span>
            <span className="block text-zinc-500">{tz}</span>
          </span>
        </div>
      </div>

      {/* ── RETRO CALENDAR ── */}
      <div className="flex flex-col overflow-hidden rounded-xl border border-white/[0.10]
        shadow-[0_0_12px_2px_rgba(239,68,68,0.12),0_0_0_1px_rgba(255,255,255,0.05)]
        w-[44px]"
      >
        <div className="bg-red-600 text-white text-[9px] font-black uppercase tracking-[0.15em] text-center py-[3px] leading-none">
          {weekday}
        </div>
        <div className="bg-zinc-900 flex flex-col items-center justify-center py-1 gap-0">
          <span className="text-white font-black text-xl leading-none tabular-nums">{day}</span>
          <span className="text-red-400 font-black text-[9px] tracking-[0.12em] leading-none mt-0.5">{month}</span>
        </div>
      </div>

    </div>
  );
}
