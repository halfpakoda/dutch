import { useState } from 'react';

let idCounter = 0;
const nextId = () => `new-${Date.now()}-${idCounter++}`;

export default function ReviewItems({ items, charges, image, onChange, onNext, onBack }) {
  const [localItems, setLocalItems] = useState(items);
  const [localCharges, setLocalCharges] = useState(charges);
  const [showImage, setShowImage] = useState(false);

  const updateItem = (id, field, value) => {
    setLocalItems((prev) =>
      prev.map((it) => (it.id === id ? { ...it, [field]: value } : it))
    );
  };

  const removeItem = (id) => {
    setLocalItems((prev) => prev.filter((it) => it.id !== id));
  };

  const addItem = () => {
    setLocalItems((prev) => [...prev, { id: nextId(), name: '', price: 0, qty: 1, sharedBy: [] }]);
  };

  const updateLineTotal = (id, value) => {
    setLocalItems((prev) =>
      prev.map((it) => (it.id === id ? { ...it, price: value, qty: 1 } : it))
    );
  };

  const charge = localCharges[0] || { id: nextId(), name: 'taxes & charges', amount: 0, splitMode: 'proportional' };

  const updateChargeAmount = (value) => {
    setLocalCharges([{ ...charge, amount: value }]);
  };

  const itemsTotal = localItems.reduce((sum, item) => sum + item.price * (item.qty || 1), 0);
  const grandTotal = itemsTotal + (charge.amount || 0);

  const handleNext = () => {
    onChange(localItems, localCharges);
    onNext();
  };

  return (
    <div>
      <div className="row" style={{ alignItems: 'center', marginBottom: 16 }}>
        <div className="screen-title" style={{ marginBottom: 0 }}>check items</div>
        {image && (
          <button onClick={() => setShowImage(true)} style={{ fontSize: 11, whiteSpace: 'nowrap' }}>
            <i className="ti ti-photo" aria-hidden="true"></i> view bill
          </button>
        )}
      </div>

      <div className="card">
        {localItems.map((item) => (
          <div
            key={item.id}
            style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 14 }}
          >
            <input
              type="text"
              value={item.name}
              placeholder="item name"
              onChange={(e) => updateItem(item.id, 'name', e.target.value)}
              style={{ flex: '1 1 auto', minWidth: 0 }}
            />
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, flex: '0 0 auto', whiteSpace: 'nowrap' }}>
              <div style={{ position: 'relative' }}>
                <span
                  style={{
                    position: 'absolute',
                    left: 10,
                    top: '50%',
                    transform: 'translateY(-50%)',
                    fontSize: 13,
                    color: 'var(--ink-soft)',
                    pointerEvents: 'none',
                  }}
                >
                  &#8377;
                </span>
                <input
                  type="number"
                  value={item.price * (item.qty || 1)}
                  onChange={(e) => updateLineTotal(item.id, Number(e.target.value))}
                  style={{ width: 80, paddingLeft: 22 }}
                />
              </div>
              <button onClick={() => removeItem(item.id)} aria-label="remove item" style={{ padding: '6px 8px' }}>
                <i className="ti ti-x" aria-hidden="true"></i>
              </button>
            </div>
          </div>
        ))}
        <button onClick={addItem} style={{ width: '100%' }}>
          <i className="ti ti-plus" aria-hidden="true"></i> add item
        </button>
      </div>

      <div className="card" style={{ marginTop: 16 }}>
        <div className="row" style={{ gap: 8 }}>
          <span style={{ fontSize: 13 }}>taxes &amp; charges</span>
          <input
            type="number"
            value={charge.amount}
            onChange={(e) => updateChargeAmount(Number(e.target.value))}
            style={{ width: 96 }}
          />
        </div>
        <div className="row" style={{ marginTop: 12, borderTop: '1px dashed var(--border-dashed)', paddingTop: 12 }}>
          <span style={{ fontSize: 14, fontWeight: 700 }}>total</span>
          <span style={{ fontSize: 14, fontWeight: 700 }}>&#8377;{grandTotal.toFixed(2)}</span>
        </div>
      </div>

      <div className="actions">
        <button onClick={onBack}>back</button>
        <button className="primary" onClick={handleNext}>
          next
        </button>
      </div>

      {showImage && (
        <div className="image-viewer-backdrop" onClick={() => setShowImage(false)}>
          <div className="image-viewer-sheet" onClick={(e) => e.stopPropagation()}>
            <img src={image} alt="your uploaded bill" />
            <button
              onClick={() => setShowImage(false)}
              style={{ position: 'absolute', top: 12, right: 12, padding: '6px 8px' }}
              aria-label="close"
            >
              <i className="ti ti-x" aria-hidden="true"></i>
            </button>
          </div>
        </div>
      )}

      <style>{`
        .image-viewer-backdrop {
          position: fixed;
          inset: 0;
          background: rgba(50, 50, 50, 0.5);
          display: flex;
          align-items: center;
          justify-content: center;
          z-index: 50;
        }
        .image-viewer-sheet {
          position: relative;
          max-width: 82%;
          max-height: 82vh;
          overflow: auto;
          background: var(--paper-raised);
          border: 1px solid var(--border);
          padding: 10px;
          transform: rotate(-2deg);
          animation: slide-in-angled 0.28s ease-out;
        }
        .image-viewer-sheet img {
          display: block;
          max-width: 100%;
          height: auto;
        }
        @keyframes slide-in-angled {
          from {
            transform: translateX(-60%) rotate(-6deg);
            opacity: 0;
          }
          to {
            transform: rotate(-2deg);
            opacity: 1;
          }
        }
      `}</style>
    </div>
  );
}
