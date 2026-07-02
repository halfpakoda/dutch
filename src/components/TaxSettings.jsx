import { useState } from 'react';

export default function TaxSettings({ charges, onChange, onNext, onBack }) {
  const [localCharges, setLocalCharges] = useState(charges);

  const setMode = (id, mode) => {
    setLocalCharges((prev) => prev.map((c) => (c.id === id ? { ...c, splitMode: mode } : c)));
  };

  const handleNext = () => {
    onChange(localCharges);
    onNext();
  };

  if (localCharges.length === 0) {
    return (
      <div>
        <div className="screen-title">tax &amp; charges</div>
        <div className="screen-sub">no extra charges on this bill</div>
        <div className="actions">
          <button onClick={onBack}>back</button>
          <button className="primary" onClick={handleNext}>
            compute split
          </button>
        </div>
      </div>
    );
  }

  return (
    <div>
      <div className="screen-title">tax &amp; charges</div>
      <div className="screen-sub">how should these be split</div>

      <div className="card">
        {localCharges.map((charge, i) => (
          <div
            key={charge.id}
            style={{
              marginBottom: i < localCharges.length - 1 ? 16 : 0,
              paddingBottom: i < localCharges.length - 1 ? 16 : 0,
              borderBottom: i < localCharges.length - 1 ? '1px dashed var(--border-dashed)' : 'none',
            }}
          >
            <div className="row" style={{ marginBottom: 10 }}>
              <span style={{ fontSize: 13 }}>{charge.name || 'charge'}</span>
              <span style={{ fontSize: 13 }}>{Number(charge.amount).toFixed(2)}</span>
            </div>
            <div style={{ display: 'flex', gap: 8 }}>
              <button
                onClick={() => setMode(charge.id, 'proportional')}
                style={{
                  flex: 1,
                  fontSize: 11,
                  background: charge.splitMode === 'proportional' ? 'var(--ink)' : 'var(--paper)',
                  color: charge.splitMode === 'proportional' ? 'var(--paper)' : 'var(--ink)',
                }}
              >
                proportional
              </button>
              <button
                onClick={() => setMode(charge.id, 'equal')}
                style={{
                  flex: 1,
                  fontSize: 11,
                  background: charge.splitMode === 'equal' ? 'var(--ink)' : 'var(--paper)',
                  color: charge.splitMode === 'equal' ? 'var(--paper)' : 'var(--ink)',
                }}
              >
                equal
              </button>
            </div>
          </div>
        ))}
      </div>

      <div style={{ fontSize: 10, color: 'var(--ink-soft)', marginTop: 10, lineHeight: 1.6 }}>
        proportional: split based on what each person ordered<br />
        equal: split evenly across everyone
      </div>

      <div className="actions">
        <button onClick={onBack}>back</button>
        <button className="primary" onClick={handleNext}>
          compute split
        </button>
      </div>
    </div>
  );
}
