import React from "react";

// Simple iPhone-like frame that renders children as the screen content
export function Iphone({ children, className = "" }) {
  return (
    <div className={[
      "relative mx-auto select-none",
      // outer phone body
      "rounded-[3rem] border border-white/10 bg-neutral-900/90 shadow-[0_20px_70px_rgba(0,0,0,0.6)]",
      // approximate iPhone 15 Pro dimensions ratio
      "w-[360px] sm:w-[390px]",
      className,
    ].join(" ")}
    style={{
      // keep a tall-ish aspect
      aspectRatio: "9/19.5",
    }}
    >
      {/* Side buttons (decorative) */}
      <div className="absolute -left-1 top-[18%] h-10 w-1 rounded-r bg-neutral-700/70" />
      <div className="absolute -left-1 top-[32%] h-16 w-1 rounded-r bg-neutral-700/70" />

      {/* Notch */}
      <div className="pointer-events-none absolute inset-x-0 top-0 flex justify-center">
        <div className="mt-2 h-6 w-40 rounded-b-2xl bg-neutral-800/90 border-x border-b border-white/10" />
      </div>

      {/* Screen */}
      <div className="absolute inset-[10px] rounded-[2.2rem] overflow-hidden bg-black">
        {children ?? (
          <div className="h-full w-full grid place-items-center text-white/70">
            <span className="text-sm">iPhone Preview</span>
          </div>
        )}
      </div>
    </div>
  );
}
