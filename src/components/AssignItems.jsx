import { useState } from 'react';

export default function AssignItems({ items, people, charges, onChange, onNext, onBack }) {
  const [localItems, setLocalItems] = useState(items);
  const [expandedIds, setExpandedIds] = useState(() => new Set(items[0] ? [items[0].id] : []));

  const itemsTotal = localItems.reduce((sum, item) => sum + item.price * (item.qty || 1), 0);
  const chargesTotal = (charges || []).reduce((sum, c) => sum + (c.amount || 0), 0);
  const grandTotal = itemsTotal + chargesTotal;

  const toggleExpand = (id) => {
    setExpandedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const togglePerson = (itemId, personId) => {
    setLocalItems((prev) =>
      prev.map((item) => {
        if (item.id !== itemId) return item;
        const has = item.sharedBy.includes(personId);
        return {
          ...item,
          sharedBy: has
            ? item.sharedBy.filter((id) => id !== personId)
            : [...item.sharedBy, personId],
        };
      })
    );
  };

  const nameFor = (id) => people.find((p) => p.id === id)?.name || '';

  const allAssigned = localItems.every((item) => item.sharedBy.length > 0);

  const handleNext = () => {
    onChange(localItems);
    onNext();
  };

  return (
    <div>
      <div className="row" style={{ alignItems: 'flex-start' }}>
        <div>
          <div className="screen-title">who had what</div>
          <div className="screen-sub">tap an item, pick who shared it</div>
        </div>
        <button onClick={onBack} style={{ fontSize: 11, whiteSpace: 'nowrap' }}>
          <i className="ti ti-user-plus" aria-hidden="true"></i> add people
        </button>
      </div>

      <div className="card" style={{ padding: 0 }}>
        {localItems.map((item, i) => {
          const isOpen = expandedIds.has(item.id);
          return (
            <div key={item.id}>
              <div style={{ padding: '12px 14px' }}>
                <div
                  className="row"
                  style={{ cursor: 'pointer' }}
                  onClick={() => toggleExpand(item.id)}
                >
                  <div>
                    <div style={{ fontSize: 13 }}>
                      {item.sharedBy.length === 0 && (
                        <span style={{ color: '#a32d2d', marginRight: 4 }}>*</span>
                      )}
                      {item.name} {item.qty > 1 ? `x${item.qty}` : ''}
                    </div>
                    {item.sharedBy.length > 0 && (
                      <div style={{ fontSize: 10, color: 'var(--ink-soft)', marginTop: 3 }}>
                        {item.sharedBy.map(nameFor).join(', ')}
                      </div>
                    )}
                  </div>
                  <div className="row" style={{ gap: 8 }}>
                    <span style={{ fontSize: 12 }}>
                      {(item.price * (item.qty || 1)).toFixed(2)}
                    </span>
                    <i
                      className={`ti ti-chevron-${isOpen ? 'up' : 'down'}`}
                      aria-hidden="true"
                      style={{ fontSize: 14 }}
                    ></i>
                  </div>
                </div>

                {isOpen && (
                  <div style={{ marginTop: 12 }}>
                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
                      {people.map((p) => {
                        const active = item.sharedBy.includes(p.id);
                        return (
                          <button
                            key={p.id}
                            onClick={() => togglePerson(item.id, p.id)}
                            style={{
                              display: 'flex',
                              alignItems: 'center',
                              gap: 5,
                              fontSize: 11,
                              padding: '6px 10px',
                              background: active ? 'var(--ink)' : 'var(--paper)',
                              color: active ? 'var(--paper)' : 'var(--ink)',
                              borderRadius: 20,
                            }}
                          >
                            <i
                              className={`ti ti-${active ? 'check' : 'plus'}`}
                              aria-hidden="true"
                              style={{ fontSize: 12 }}
                            ></i>
                            {p.name}
                          </button>
                        );
                      })}
                    </div>
                  </div>
                )}
              </div>
              <div style={{ borderTop: '1px dashed var(--border-dashed)', margin: '0 14px' }} />
            </div>
          );
        })}
        <div style={{ padding: '12px 14px' }}>
          <div className="row">
            <span style={{ fontSize: 14, fontWeight: 700 }}>total</span>
            <span style={{ fontSize: 14, fontWeight: 700 }}>{grandTotal.toFixed(2)}</span>
          </div>
        </div>
      </div>

      {!allAssigned && (
        <div style={{ fontSize: 10, color: '#a32d2d', marginTop: 10 }}>
          * items still need at least one person assigned before you can continue
        </div>
      )}

      <div className="actions">
        <button onClick={onBack}>back</button>
        <button className="primary" onClick={handleNext} disabled={!allAssigned}>
          next
        </button>
      </div>
    </div>
  );
}
