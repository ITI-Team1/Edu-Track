import React, { useEffect, useMemo, useRef, useState } from "react";
import "../../styles/select.css";

/**
 * Reusable Select (RTL + modal friendly)
 * - Custom dropdown rendered inside form with absolute positioning
 * - Searchable list
 * - Accepts options as array of { value, label } or strings
 */
export default function Select({
  options = [],
  value,
  onChange,
  placeholder = "اختر",
  searchable = false,
  disabled = false,
  className = "",
}) {
  const rootRef = useRef(null);
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");

  const normalized = useMemo(() => {
    const arr = options.map((opt) => {
      if (opt && typeof opt === "object" && "value" in opt) return opt;
      return { value: opt, label: String(opt) };
    });
    // Remove placeholder-like entries (empty/undefined/null)
    return arr.filter((o) => !(o.value === "" || o.value === undefined || o.value === null));
  }, [options]);

  const selected = useMemo(
    () => normalized.find((o) => String(o.value) === String(value)) || null,
    [normalized, value]
  );

  const filtered = useMemo(() => {
    if (!searchable) return normalized;
    if (!query.trim()) return normalized;
    const q = query.trim().toLowerCase();
    return normalized.filter((o) => String(o.label).toLowerCase().includes(q));
  }, [normalized, query, searchable]);

  useEffect(() => {
    const onDoc = (e) => {
      if (!rootRef.current) return;
      if (!rootRef.current.contains(e.target)) setOpen(false);
    };
    const onKey = (e) => e.key === "Escape" && setOpen(false);
    document.addEventListener("mousedown", onDoc);
    window.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("mousedown", onDoc);
      window.removeEventListener("keydown", onKey);
    };
  }, []);

  const handleSelect = (opt) => {
    onChange?.(opt.value);
    setOpen(false);
    setQuery("");
  };

  return (
    <div className={`sel-root ${className}`} ref={rootRef} dir="rtl">
      <button
        type="button"
        className={`sel-input ${disabled ? "sel-disabled" : ""}`}
        onClick={() => !disabled && setOpen((o) => !o)}
        disabled={disabled}
        aria-haspopup="listbox"
        aria-expanded={open}
      >
        <span className={`sel-display ${!selected ? "sel-placeholder" : ""}`}>
          {selected ? selected.label : placeholder}
        </span>
        <svg className="sel-caret" width="16" height="16" viewBox="0 0 24 24" fill="currentColor" aria-hidden>
          <path d="M7 10l5 5 5-5z" />
        </svg>
      </button>

      {open && !disabled && (
        <div className="sel-panel" role="listbox">
          <div className="sel-options">
            {filtered.length === 0 ? (
              <div className="sel-empty">لا توجد خيارات</div>
            ) : (
              filtered.map((opt) => (
                <div
                  key={String(opt.value)}
                  className={`sel-option ${selected && String(selected.value) === String(opt.value) ? "selected" : ""}`}
                  onClick={() => handleSelect(opt)}
                  role="option"
                >
                  {opt.label}
                </div>
              ))
            )}
          </div>
        </div>
      )}
    </div>
  );
}
