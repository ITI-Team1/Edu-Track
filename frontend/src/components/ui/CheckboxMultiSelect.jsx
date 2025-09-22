import React, { useEffect, useMemo, useRef, useState } from 'react';
import '../../styles/select.css';

// Checkbox-based multi-select with dropdown
// Props:
// - options: [{ value, label }]
// - value: array of selected values (numbers/strings)
// - onChange: (nextArray) => void
// - placeholder: string
// - searchable: boolean
// - disabled: boolean
// - className: string
export default function CheckboxMultiSelect({
  options = [],
  value = [],
  onChange,
  placeholder = 'اختر',
  searchable = true,
  disabled = false,
  className = '',
}) {
  const [query, setQuery] = useState('');
  const [open, setOpen] = useState(false);
  const wrapRef = useRef(null);
  const panelRef = useRef(null);
  const justOpenedRef = useRef(false);
  const [panelStyle, setPanelStyle] = useState({});

  // Compute panel position relative to trigger. Uses fixed positioning to avoid clipping.
  const computePanelStyle = () => {
    if (!wrapRef.current) return {};
    const rect = wrapRef.current.getBoundingClientRect();
    const gap = 6;
    const left = Math.round(rect.left);
    const width = Math.round(rect.width);
    const topBelow = Math.round(rect.bottom + gap);
    const spaceBelow = window.innerHeight - topBelow - 12;
    const spaceAbove = Math.round(rect.top) - 12;
    const targetMax = Math.floor(window.innerHeight * 0.8);
    // Prefer below, but flip above if not enough space
    if (spaceBelow >= 180 || spaceBelow >= spaceAbove) {
      const maxHeight = Math.max(140, Math.min(targetMax, spaceBelow));
      return { position: 'fixed', top: topBelow, left, width, maxHeight, zIndex: 2001 };
    } else {
      const bottom = Math.max(12, window.innerHeight - Math.round(rect.top) + gap);
      const maxHeight = Math.max(140, Math.min(targetMax, spaceAbove));
      return { position: 'fixed', bottom, left, width, maxHeight, zIndex: 2001 };
    }
  };

  const normalized = useMemo(() => {
    const arr = options.map(opt => {
      if (opt && typeof opt === 'object' && 'value' in opt) return opt;
      return { value: opt, label: String(opt) };
    });
    return arr.filter(o => !(o.value === '' || o.value === undefined || o.value === null));
  }, [options]);

  const filtered = useMemo(() => {
    if (!searchable) return normalized;
    const q = (query || '').trim().toLowerCase();
    if (!q) return normalized;
    return normalized.filter(o => String(o.label).toLowerCase().includes(q));
  }, [normalized, query, searchable]);

  const selectedCount = Array.isArray(value) ? value.length : 0;

  const toggle = (val) => {
    if (!Array.isArray(value)) return onChange?.([val]);
    const exists = value.some(v => String(v) === String(val));
    if (exists) {
      onChange?.(value.filter(v => String(v) !== String(val)));
    } else {
      onChange?.([...value, val]);
    }
  };

  const allValues = filtered.map(o => o.value);
  const allChecked = allValues.length > 0 && allValues.every(v => value.some(x => String(x) === String(v)));
  const someChecked = allValues.some(v => value.some(x => String(x) === String(v)));

  const toggleAll = () => {
    if (allChecked) {
      const remaining = (Array.isArray(value) ? value : []).filter(v => !allValues.some(x => String(x) === String(v)));
      onChange?.(remaining);
    } else {
      const merged = Array.from(new Set([...(Array.isArray(value) ? value : []), ...allValues]));
      onChange?.(merged);
    }
  };

  // Close dropdown on outside click
  useEffect(() => {
    const onDoc = (e) => {
      if (!open) return;
      if (justOpenedRef.current) return; // ignore the click that opened it
      const root = wrapRef.current;
      const panel = panelRef.current;
      if (!root) return;
      const target = e.target;
      const insideRoot = root.contains(target);
      const insidePanel = panel ? panel.contains(target) : false;
      if (!insideRoot && !insidePanel) setOpen(false);
    };
    document.addEventListener('mousedown', onDoc, true);
    return () => document.removeEventListener('mousedown', onDoc, true);
  }, [open]);

  // Compute and update dropdown panel position/size to avoid clipping
  useEffect(() => {
    if (!open) return;

    const updatePanel = () => {
      const st = computePanelStyle();
      if (st && Object.keys(st).length) setPanelStyle(st);
    };

    updatePanel();
    window.addEventListener('resize', updatePanel);
    window.addEventListener('scroll', updatePanel, true);
    return () => {
      window.removeEventListener('resize', updatePanel);
      window.removeEventListener('scroll', updatePanel, true);
    };
  }, [open]);

  const selectedLabels = useMemo(() => {
    if (!Array.isArray(value) || value.length === 0) return '';
    const setVals = value.map(v => String(v));
    const labels = normalized.filter(o => setVals.includes(String(o.value))).map(o => o.label);
    return labels.slice(0, 2).join(', ') + (labels.length > 2 ? ` +${labels.length - 2}` : '');
  }, [normalized, value]);

  return (
    <div ref={wrapRef} className={className} dir="rtl" style={{ position: 'relative' }}>
      {/* Control */}
      <button
        type="button"
        disabled={disabled}
        onMouseDown={(e) => {
          e.preventDefault();
          // toggle open ASAP on mousedown to precede document capture listeners
          // Precompute and set panel style immediately to avoid initial misposition
          const st = computePanelStyle();
          if (st && Object.keys(st).length) setPanelStyle(st);
          setOpen((o) => {
            const next = !o;
            if (next) {
              justOpenedRef.current = true;
              setTimeout(() => { justOpenedRef.current = false; }, 200);
            }
            return next;
          });
          // Ensure a second pass after render for precision
          requestAnimationFrame(() => {
            const st2 = computePanelStyle();
            if (st2 && Object.keys(st2).length) setPanelStyle(st2);
          });
        }}
        className="sel-control"
        style={{
          width: '100%',
          textAlign: 'right',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          gap: 8,
          padding: '8px 12px',
          borderRadius: 8,
          border: '1px solid #cbd5e1',
          background: disabled ? '#f5f5f5' : '#fff',
          color: '#1f2937',
          cursor: disabled ? 'not-allowed' : 'pointer',
        }}
      >
        <span style={{ color: selectedCount ? '#0f172a' : '#64748b' }}>
          {selectedCount === 0 ? placeholder : selectedLabels || `مختار: ${selectedCount}`}
        </span>
        <span aria-hidden="true" style={{ opacity: 0.8 }}>▾</span>
      </button>

      {/* Dropdown */}
      {open && (
        <div
          className="sel-dropdown"
          ref={panelRef}
          onMouseDown={(e) => {
            // prevent immediate outside-close when interacting inside the panel
            e.stopPropagation();
          }}
          style={{
            background: '#fff',
            border: '1px solid #e2e8f0',
            borderRadius: 10,
            boxShadow: '0 10px 25px rgba(0,0,0,0.08)',
            padding: '10px 10px 8px 10px',
            display: 'flex',
            flexDirection: 'column',
            overflow: 'hidden',
            ...panelStyle,
          }}
        >
          {searchable && (
            <div style={{ marginBottom: 8 }}>
              <input
                type="text"
                placeholder="ابحث بالاسم..."
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                disabled={disabled}
                style={{ width: '100%', padding: '6px 10px', border: '1px solid #cbd5e1', borderRadius: 8 }}
                autoFocus
              />
            </div>
          )}

          {/* Options list */}
          <div style={{ overflowY: 'auto', padding: '0 2px 14px 0', scrollbarWidth: 'thin' }}>
            {/* Select all row */}
            {filtered.length > 0 && (
              <label
                className="sel-row"
                style={{
                  display: 'flex', alignItems: 'center', gap: 10,
                  padding: '8px 10px', borderRadius: 8,
                  background: someChecked ? '#eef6ff' : 'transparent',
                  border: someChecked ? '1px solid #60a5fa' : '1px solid transparent',
                  marginBottom: 6,
                  cursor: disabled ? 'not-allowed' : 'pointer',
                  userSelect: 'none',
                }}
                title={allChecked ? 'إلغاء تحديد الكل' : 'تحديد الكل'}
              >
                <input
                  type="checkbox"
                  checked={allChecked}
                  ref={(el) => { if (el) el.indeterminate = !allChecked && someChecked; }}
                  onChange={toggleAll}
                  disabled={disabled}
                  style={{ width: 18, height: 18 }}
                />
                <span>تحديد الكل</span>
              </label>
            )}

            {filtered.length === 0 ? (
              <div className="sel-empty" style={{ padding: 10, color: '#64748b' }}>لا توجد خيارات</div>
            ) : (
              filtered.map(opt => {
                const selected = Array.isArray(value) && value.some(v => String(v) === String(opt.value));
                return (
                  <label
                    key={String(opt.value)}
                    className="sel-row"
                    style={{
                      display: 'flex', alignItems: 'center', gap: 10,
                      padding: '8px 10px', borderRadius: 8,
                      background: selected ? '#eef6ff' : 'transparent',
                      border: selected ? '1px solid #60a5fa' : '1px solid transparent',
                      marginBottom: 6,
                      cursor: disabled ? 'not-allowed' : 'pointer',
                      userSelect: 'none',
                    }}
                  >
                    <input
                      type="checkbox"
                      checked={selected}
                      onChange={() => toggle(opt.value)}
                      disabled={disabled}
                      style={{ width: 18, height: 18 }}
                    />
                    <span style={{ flex: 1 }}>{opt.label}</span>
                  </label>
                );
              })
            )}
            {/* bottom spacer to avoid clipping last item */}
            <div style={{ height: 8 }} />
          </div>
        </div>
      )}
    </div>
  );
}
