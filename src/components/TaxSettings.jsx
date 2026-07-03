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
            className={charge.splitMode === 'proportional' ? 'toggle-option selected' : 'toggle-option'}
            style={{ flex: 1, fontSize: 11 }}
          >
            {charge.splitMode === 'proportional' && (
              <i className="ti ti-check" aria-hidden="true" style={{ marginRight: 4 }}></i>
            )}
            proportional
          </button>
          <button
            onClick={() => setMode('equal')}
            className={charge.splitMode === 'equal' ? 'toggle-option selected' : 'toggle-option'}
            style={{ flex: 1, fontSize: 11 }}
          >
            {charge.splitMode === 'equal' && (
              <i className="ti ti-check" aria-hidden="true" style={{ marginRight: 4 }}></i>
            )}
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
