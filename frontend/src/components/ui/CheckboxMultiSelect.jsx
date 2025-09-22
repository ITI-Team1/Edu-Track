import React, { useMemo, useState } from 'react';
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

  // Styles for pill-like chips
  const pillBase = {
    display: 'inline-flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 8,
    padding: '8px 12px',
    borderRadius: 12,
    border: '1px solid #cbd5e1',
    background: '#fff',
    color: '#1f2937',
    minWidth: 140,
    userSelect: 'none',
    cursor: disabled ? 'not-allowed' : 'pointer',
    boxShadow: '0 1px 1px rgba(0,0,0,0.03)',
  };
  const pillSelected = {
    border: '1px solid #60a5fa',
    background: '#eef6ff',
    color: '#0f172a',
    fontWeight: 600,
  };

  return (
    <div className={className} dir="rtl">
      <div style={{ marginBottom: 6, fontSize: 13, color: '#334155' }}>
        {selectedCount === 0 ? placeholder : `مختار: ${selectedCount}`}
      </div>
      {searchable && (
        <div style={{ marginBottom: 8 }}>
          <input
            type="text"
            placeholder="ابحث..."
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            disabled={disabled}
            style={{ width: '100%', padding: '6px 10px', border: '1px solid #cbd5e1', borderRadius: 8 }}
          />
        </div>
      )}
      <div style={{ display: 'flex', flexWrap: 'wrap', gap: 10 }}>
        {/* Select all chip */}
        {filtered.length > 0 && (
          <label
            style={{
              ...pillBase,
              ...(someChecked ? pillSelected : {}),
            }}
            title={allChecked ? 'إلغاء تحديد الكل' : 'تحديد الكل'}
          >
            <span style={{ flex: 1 }}>تحديد الكل</span>
            <input
              type="checkbox"
              checked={allChecked}
              ref={(el) => { if (el) el.indeterminate = !allChecked && someChecked; }}
              onChange={toggleAll}
              disabled={disabled}
              style={{ width: 18, height: 18 }}
            />
          </label>
        )}

        {filtered.length === 0 ? (
          <div className="sel-empty">لا توجد خيارات</div>
        ) : (
          filtered.map(opt => {
            const selected = Array.isArray(value) && value.some(v => String(v) === String(opt.value));
            return (
              <label
                key={String(opt.value)}
                style={{
                  ...pillBase,
                  ...(selected ? pillSelected : {}),
                }}
              >
                <span style={{ flex: 1 }}>{opt.label}</span>
                <input
                  type="checkbox"
                  checked={selected}
                  onChange={() => toggle(opt.value)}
                  disabled={disabled}
                  style={{ width: 18, height: 18 }}
                />
              </label>
            );
          })
        )}
      </div>
    </div>
  );
}
