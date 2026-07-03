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

  const countFor = (item, personId) => item.sharedBy.filter((id) => id === personId).length;

  const cyclePersonCount = (itemId, personId) => {
    setLocalItems((prev) =>
      prev.map((item) => {
        if (item.id !== itemId) return item;
        const current = countFor(item, personId);
        const remaining = item.qty - item.sharedBy.length + current;
        const without = item.sharedBy.filter((id) => id !== personId);
        const nextCount = current >= remaining ? 0 : current + 1;
        return { ...item, sharedBy: Array(nextCount).fill(personId).concat(without) };
      })
    );
  };

  const setSplitMode = (itemId, mode) => {
    setLocalItems((prev) =>
      prev.map((item) => (item.id === itemId ? { ...item, splitByCount: mode === 'count', sharedBy: [] } : item))
    );
  };

  const nameFor = (id) => people.find((p) => p.id === id)?.name || '';

  const allAssigned = localItems.every((item) =>
    item.splitByCount ? item.sharedBy.length === item.qty : item.sharedBy.length > 0
  );

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
                      {(item.splitByCount ? item.sharedBy.length !== item.qty : item.sharedBy.length === 0) && (
                        <span style={{ color: '#a32d2d', marginRight: 4 }}>*</span>
                      )}
                      {item.name} {item.qty > 1 ? `x${item.qty}` : ''}
                    </div>
                    {item.sharedBy.length > 0 && (
                      <div style={{ fontSize: 10, color: 'var(--ink-soft)', marginTop: 3 }}>
                        {item.splitByCount
                          ? people
                              .filter((p) => countFor(item, p.id) > 0)
                              .map((p) => `${p.name} x${countFor(item, p.id)}`)
                              .join(', ')
                          : item.sharedBy.map(nameFor).join(', ')}
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
                    {item.qty > 1 && (
                      <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 10 }}>
                        <div className="mode-switch">
                          <button
                            onClick={() => setSplitMode(item.id, 'equal')}
                            className={!item.splitByCount ? 'selected' : ''}
                            aria-label="split equally"
                            title="split equally"
                          >
                            <i className="ti ti-equal" aria-hidden="true"></i>
                          </button>
                          <button
                            onClick={() => setSplitMode(item.id, 'count')}
                            className={item.splitByCount ? 'selected' : ''}
                            aria-label="split by count"
                            title="split by count"
                          >
                            <i className="ti ti-123" aria-hidden="true"></i>
                          </button>
                        </div>
                        <span style={{ fontSize: 10, color: 'var(--ink-soft)' }}>
                          {item.splitByCount ? 'split by count' : 'split equally'}
                        </span>
                      </div>
                    )}

                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
                      {people.map((p) => {
                        const count = countFor(item, p.id);
                        const active = item.splitByCount ? count > 0 : item.sharedBy.includes(p.id);
                        return (
                          <button
                            key={p.id}
                            onClick={() =>
                              item.splitByCount ? cyclePersonCount(item.id, p.id) : togglePerson(item.id, p.id)
                            }
                            className={active ? 'pill-option selected' : 'pill-option'}
                          >
                            <i
                              className={`ti ti-${active && !item.splitByCount ? 'check' : 'plus'}`}
                              aria-hidden="true"
                              style={{ fontSize: 12 }}
                            ></i>
                            {item.splitByCount && count > 0 ? `${p.name} x${count}` : p.name}
                          </button>
                        );
                      })}
                    </div>

                    {item.splitByCount && (
                      <div
                        style={{
                          fontSize: 10,
                          color: item.sharedBy.length === item.qty ? 'var(--ink-soft)' : '#a32d2d',
                          marginTop: 8,
                        }}
                      >
                        {item.sharedBy.length} / {item.qty} assigned
                      </div>
                    )}
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
