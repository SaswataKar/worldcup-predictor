"use client";

import { motion } from "framer-motion";

type Props = {
  selectedInventoryBooster: any;

  setSelectedInventoryBooster: any;

  usedBoosters: any[];

  goatDays: any[];
};

export default function BoosterInventory({
  selectedInventoryBooster,

  setSelectedInventoryBooster,

  usedBoosters,

  goatDays,
}: Props) {
  const boosters = [
    {
      key: "2x",

      icon: "⚽",

      title:
        "Tiki Taka",

      description:
        "Double Points",

      glow:
        "from-yellow-500/20 to-orange-500/10",

      border:
        "border-yellow-500/40",

      text:
        "text-yellow-300",
    },

    {
      key: "3x",

      icon: "🔥",

      title:
        "Hat Trick Hero",

      description:
        "Triple Points",

      glow:
        "from-fuchsia-500/20 to-purple-500/10",

      border:
        "border-fuchsia-500/40",

      text:
        "text-fuchsia-300",
    },

    {
      key: "draw",

      icon: "🐐",

      title:
        "G.O.A.T",

      description:
        "Legendary Booster",

      glow:
        "from-emerald-500/20 to-lime-500/10",

      border:
        "border-emerald-500/40",

      text:
        "text-emerald-300",
    },
  ];

  return (
    <div className="mb-14">
      {/* HEADER */}
      <div className="mb-8">
        <div className="text-zinc-500 uppercase tracking-[0.35em] text-xs font-black mb-3">
          Tournament Inventory
        </div>

        <h1 className="text-4xl md:text-5xl font-black">
          Power Boosters
        </h1>
      </div>

      {/* GRID */}
      <div className="flex flex-wrap gap-5">
        {boosters.map(
          (booster) => {
            const consumed =
              booster.key ===
              "draw"
                ? goatDays.length >
                  0
                : usedBoosters.includes(
                    booster.key
                  );

            const selected =
              selectedInventoryBooster ===
                booster.key &&
              !consumed;

            return (
              <motion.button
                key={
                  booster.key
                }
                whileHover={
                  consumed
                    ? {}
                    : {
                        scale: 1.03,
                      }
                }
                whileTap={
                  consumed
                    ? {}
                    : {
                        scale: 0.98,
                      }
                }
                disabled={
                  consumed
                }
                onClick={() =>
                  setSelectedInventoryBooster(
                    selected
                      ? null
                      : booster.key
                  )
                }
                className={`
                  relative
                  overflow-hidden
                  rounded-[28px]
                  border
                  p-5
                  w-full
                  sm:w-[220px]
                  text-left
                  transition-all
                  duration-300

                  ${
                    consumed
                      ? "opacity-40 grayscale cursor-not-allowed border-zinc-800 bg-zinc-950"
                      : selected
                      ? `${booster.border} bg-gradient-to-br ${booster.glow} shadow-2xl`
                      : "border-zinc-800 bg-zinc-900 hover:border-zinc-600"
                  }
                `}
              >
                {/* TEXTURE */}
                <div className="absolute inset-0 opacity-[0.04] bg-[radial-gradient(circle,#fff_1px,transparent_1px)] [background-size:16px_16px]" />

                <div className="relative z-10">
                  {/* ICON */}
                  <div className="text-4xl">
                    {
                      booster.icon
                    }
                  </div>

                  {/* TITLE */}
                  <div
                    className={`mt-5 text-2xl leading-tight font-black ${booster.text}`}
                  >
                    {
                      booster.title
                    }
                  </div>

                  {/* DESCRIPTION */}
                  <div className="mt-3 text-sm text-zinc-500">
                    {
                      booster.description
                    }
                  </div>

                  {/* STATUS */}
                  <div className="mt-6 flex justify-end">
                    {selected &&
                      !consumed && (
                        <div className="bg-white text-black px-3 py-1 rounded-xl text-[10px] font-black tracking-[0.2em]">
                          ACTIVE
                        </div>
                      )}

                    {consumed && (
                      <div className="bg-zinc-800 text-zinc-400 px-3 py-1 rounded-xl text-[10px] font-black tracking-[0.2em]">
                        USED
                      </div>
                    )}
                  </div>
                </div>

                {/* ACTIVE OVERLAY */}
                {selected &&
                  !consumed && (
                    <motion.div
                      initial={{
                        opacity: 0,
                      }}
                      animate={{
                        opacity: 1,
                      }}
                      className="absolute inset-0 bg-white/[0.03]"
                    />
                  )}
              </motion.button>
            );
          }
        )}
      </div>
    </div>
  );
}
