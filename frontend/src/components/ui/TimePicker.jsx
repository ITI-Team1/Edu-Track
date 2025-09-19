import React, { useEffect, useMemo, useRef, useState } from "react";
import "../../styles/timepicker.css";

/**
 * TimePicker (Arabic-friendly)
 * - 12-hour clock with Arabic meridiem labels: "ص" (AM) / "م" (PM)
 * - Returns value as 24h string "HH:MM"
 * Props:
 *  - value: string | undefined (e.g., "13:30")
 *  - onChange: (value: string) => void
 *  - step: number minutes step for minute column (default 30)
 *  - disabled: boolean
 *  - className: string
 */
export default function TimePicker({
  value,
  onChange,
  step = 30,
  disabled = false,
  className = "",
  placeholder = "--:-- --",
}) {
  const [open, setOpen] = useState(false);
  const rootRef = useRef(null);
  const [dropUp, setDropUp] = useState(false);

  const parsed = useMemo(() => parse24(value), [value]);
  const [h, setH] = useState(parsed.h12);
  const [m, setM] = useState(parsed.m);
  const [mer, setMer] = useState(parsed.meridiem);

  useEffect(() => {
    // Sync internal state when external value changes
    setH(parsed.h12);
    setM(parsed.m);
    setMer(parsed.meridiem);
  }, [parsed.h12, parsed.m, parsed.meridiem]);

  // Close on outside click
  useEffect(() => {
    const onDoc = (e) => {
      if (!rootRef.current) return;
      if (!rootRef.current.contains(e.target)) setOpen(false);
    };
    const onKey = (e) => {
      if (e.key === "Escape") setOpen(false);
    };
    document.addEventListener("mousedown", onDoc);
    window.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("mousedown", onDoc);
      window.removeEventListener("keydown", onKey);
    };
  }, []);

  const hours = useMemo(() => Array.from({ length: 12 }, (_, i) => i + 1), []);
  const minutes = useMemo(() => {
    const st = Math.max(1, Math.min(60, Math.floor(step)));
    const arr = [];
    for (let i = 0; i < 60; i += st) arr.push(i);
    // Ensure 00 present
    if (!arr.includes(0)) arr.unshift(0);
    return Array.from(new Set(arr)).sort((a, b) => a - b);
  }, [step]);

  const display = value ? formatArabic12(value) : placeholder;

  const applyChange = (next) => {
    const { h12 = h, m: mm = m, meridiem = mer } = next || {};
    setH(h12);
    setM(mm);
    setMer(meridiem);
    const v24 = to24({ h12, m: mm, meridiem });
    onChange?.(v24);
  };

  const computePosition = () => {
    if (!rootRef.current) return;
    const rect = rootRef.current.getBoundingClientRect();
    const viewportH = window.innerHeight || document.documentElement.clientHeight;
    const estimatedPanelH = 260; // px, matches CSS max heights
    const spaceBelow = viewportH - rect.bottom;
    const shouldDropUp = spaceBelow < estimatedPanelH && rect.top > estimatedPanelH;
    setDropUp(shouldDropUp);
  };

  useEffect(() => {
    if (!open) return;
    computePosition();
    const onResize = () => computePosition();
    const onScroll = () => computePosition();
    window.addEventListener("resize", onResize);
    window.addEventListener("scroll", onScroll, true);
    return () => {
      window.removeEventListener("resize", onResize);
      window.removeEventListener("scroll", onScroll, true);
    };
  }, [open]);

  return (
    <div className={`tp-root ${className}`} ref={rootRef} dir="rtl">
      <button
        type="button"
        disabled={disabled}
        className={`tp-input ${disabled ? "tp-disabled" : ""}`}
        onClick={() => {
          setOpen((o) => {
            const next = !o;
            if (!o && !disabled) setTimeout(computePosition, 0);
            return next;
          });
        }}
        aria-haspopup="dialog"
        aria-expanded={open}
      >
        <span className={`tp-display ${!value ? "tp-placeholder" : ""}`}>
          {display}
        </span>
        <svg
          className="tp-icon"
          xmlns="http://www.w3.org/2000/svg"
          width="18"
          height="18"
          viewBox="0 0 24 24"
          fill="currentColor"
          aria-hidden
        >
          {/* Clock circle */}
          <path d="M12 2a10 10 0 1 0 0 20 10 10 0 0 0 0-20zm0 18a8 8 0 1 1 0-16 8 8 0 0 1 0 16z"/>
          {/* Hour/minute hands */}
          <path d="M12.75 7.5h-1.5v5.1l4.4 2.54.75-1.3-3.65-2.1V7.5z"/>
        </svg>
      </button>

      {open && !disabled && (
        <div
          className={`tp-panel ${dropUp ? "drop-up" : "drop-down"}`}
          role="dialog"
          aria-label="time picker"
          style={{ width: "100%" }}
        >
          <div className="tp-meridiem">
            <button
              type="button"
              className={`tp-mer ${mer === "AM" ? "active" : ""}`}
              onClick={() => applyChange({ meridiem: "AM" })}
            >
              ص
            </button>
            <button
              type="button"
              className={`tp-mer ${mer === "PM" ? "active" : ""}`}
              onClick={() => applyChange({ meridiem: "PM" })}
            >
              م
            </button>
          </div>
          <div className="tp-columns">
            <div className="tp-col">
              {hours.map((hr) => (
                <div
                  key={`h-${hr}`}
                  className={`tp-item ${h === hr ? "selected" : ""}`}
                  onClick={() => applyChange({ h12: hr })}
                >
                  {String(hr).padStart(2, "0")}
                </div>
              ))}
            </div>
            <div className="tp-col">
              {minutes.map((mm) => (
                <div
                  key={`m-${mm}`}
                  className={`tp-item ${m === mm ? "selected" : ""}`}
                  onClick={() => applyChange({ m: mm })}
                >
                  {String(mm).padStart(2, "0")}
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function parse24(v) {
  if (!v || typeof v !== "string") return { h12: 12, m: 0, meridiem: "AM" };
  const [hh, mm] = v.split(":");
  let H = Number(hh);
  let M = Number(mm);
  if (!Number.isFinite(H) || !Number.isFinite(M)) return { h12: 12, m: 0, meridiem: "AM" };
  const meridiem = H >= 12 ? "PM" : "AM";
  let h12 = H % 12;
  if (h12 === 0) h12 = 12;
  return { h12, m: clamp(M, 0, 59), meridiem };
}

function to24({ h12, m, meridiem }) {
  let h = Number(h12);
  let mm = Number(m);
  if (!Number.isFinite(h)) h = 12;
  if (!Number.isFinite(mm)) mm = 0;
  h = clamp(h, 1, 12);
  mm = clamp(mm, 0, 59);
  let H = h % 12;
  if (meridiem === "PM") H += 12;
  if (meridiem === "AM" && H === 12) H = 0;
  return `${String(H).padStart(2, "0")}:${String(mm).padStart(2, "0")}`;
}

function clamp(n, a, b) {
  return Math.min(b, Math.max(a, n));
}

function formatArabic12(v) {
  const { h12, m, meridiem } = parse24(v);
  const suffix = meridiem === "PM" ? "م" : "ص";
  return `${String(h12).padStart(2, "0")}:${String(m).padStart(2, "0")} ${suffix}`;
}
