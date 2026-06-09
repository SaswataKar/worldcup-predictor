"use client";

import { useEffect, useState } from "react";

export default function ISTClock() {
  const [time, setTime] = useState("");
  const [date, setDate] = useState("");

  useEffect(() => {
    const tick = () => {
      const now = new Date();
      setTime(
        now.toLocaleTimeString("en-IN", {
          timeZone: "Asia/Kolkata",
          hour: "2-digit",
          minute: "2-digit",
          second: "2-digit",
          hour12: false,
        })
      );
      setDate(
        now.toLocaleDateString("en-IN", {
          timeZone: "Asia/Kolkata",
          weekday: "short",
          day: "numeric",
          month: "short",
        })
      );
    };
    tick();
    const id = setInterval(tick, 1000);
    return () => clearInterval(id);
  }, []);

  return (
    <div className="hidden sm:flex flex-col items-center justify-center bg-zinc-900 border border-zinc-700 rounded-xl px-4 py-2 min-w-[110px]">
      <div className="text-[10px] uppercase tracking-[0.2em] text-zinc-500 font-bold mb-0.5">IST</div>
      <div
        className="text-lg font-black tabular-nums leading-none text-white"
        style={{ fontVariantNumeric: "tabular-nums", letterSpacing: "0.05em" }}
      >
        {time || "00:00:00"}
      </div>
      <div className="text-[10px] text-zinc-500 mt-0.5">{date}</div>
    </div>
  );
}
