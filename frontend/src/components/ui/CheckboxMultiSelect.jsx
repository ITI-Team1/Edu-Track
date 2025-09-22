import React, { useEffect, useMemo, useRef, useState } from 'react';
import '../../styles/select.css';

// Simple checkbox-based multi-select
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
      if (!wrapRef.current) return;
      if (!wrapRef.current.contains(e.target)) setOpen(false);
    };
    if (open) document.addEventListener('mousedown', onDoc);
    return () => document.removeEventListener('mousedown', onDoc);
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
        onClick={() => setOpen(o => !o)}
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
          style={{
            position: 'absolute',
            right: 0,
            left: 0,
            top: 'calc(100% + 6px)',
            background: '#fff',
            border: '1px solid #e2e8f0',
            borderRadius: 10,
            boxShadow: '0 10px 25px rgba(0,0,0,0.08)',
            padding: 10,
            zIndex: 50,
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
              />
            </div>
          )}

          {/* Options list */}
          <div style={{ maxHeight: 280, overflowY: 'auto', paddingRight: 2 }}>
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
                      marginBottom: 4,
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
          </div>
        </div>
      )}
    </div>
  );
}
