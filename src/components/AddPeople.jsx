import { useRef, useState } from 'react';

let idCounter = 0;
const nextId = () => `person-${Date.now()}-${idCounter++}`;

export default function AddPeople({ people, onChange, onNext, onBack }) {
  const [localPeople, setLocalPeople] = useState(people);
  const [draft, setDraft] = useState('');
  const inputRef = useRef(null);

  const addPerson = () => {
    const name = draft.trim();
    if (!name) return;
    setLocalPeople((prev) => [...prev, { id: nextId(), name }]);
    setDraft('');
    inputRef.current?.focus();
  };

  const removePerson = (id) => {
    setLocalPeople((prev) => prev.filter((p) => p.id !== id));
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    addPerson();
  };

  const handleNext = () => {
    onChange(localPeople);
    onNext();
  };

  return (
    <div>
      <div className="screen-title" style={{ marginBottom: 16 }}>add people splitting this bill</div>

      <div className="card">
        <form onSubmit={handleSubmit}>
          <input
            ref={inputRef}
            type="text"
            value={draft}
            placeholder="type a name, tap return"
            enterKeyHint="next"
            autoFocus
            onChange={(e) => setDraft(e.target.value)}
          />
        </form>

        {localPeople.length > 0 && (
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8, marginTop: 14 }}>
            {localPeople.map((p) => (
              <div
                key={p.id}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: 6,
                  border: '1px solid var(--border)',
                  borderRadius: 20,
                  padding: '6px 10px',
                  fontSize: 12,
                }}
              >
                {p.name}
                <i
                  className="ti ti-x"
                  aria-hidden="true"
                  style={{ cursor: 'pointer', fontSize: 12 }}
                  onClick={() => removePerson(p.id)}
                ></i>
              </div>
            ))}
          </div>
        )}
      </div>

      <div className="actions">
        <button onClick={onBack}>back</button>
        <button className="primary" onClick={handleNext} disabled={localPeople.length === 0}>
          next
        </button>
      </div>
    </div>
  );
}
