import { useState } from 'react';

export default function TaxSettings({ charges, onChange, onNext, onBack }) {
  const [charge, setCharge] = useState(
    charges[0] || { id: `charge-${Date.now()}`, name: 'taxes & charges', amount: 0, splitMode: 'proportional' }
  );

  const setMode = (mode) => {
    setCharge((prev) => ({ ...prev, splitMode: mode }));
  };

  const handleNext = () => {
    onChange(charge.amount > 0 ? [charge] : []);
    onNext();
  };

  if (!charge.amount) {
    return (
      <div>
        <div className="screen-title" style={{ marginBottom: 16 }}>no extra charges on this bill</div>
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
      <div className="screen-title" style={{ marginBottom: 16 }}>how should taxes &amp; charges be split</div>

      <div className="card">
        <div className="row" style={{ marginBottom: 10 }}>
          <span style={{ fontSize: 13 }}>taxes &amp; charges</span>
          <span style={{ fontSize: 13 }}>{Number(charge.amount).toFixed(2)}</span>
        </div>
        <div style={{ display: 'flex', gap: 8 }}>
          <button
            onClick={() => setMode('proportional')}
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
            onClick={() => setMode('equal')}
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
