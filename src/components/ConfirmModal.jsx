export default function ConfirmModal({ message, confirmLabel = 'yes', cancelLabel = 'cancel', onConfirm, onCancel }) {
  return (
    <div className="modal-backdrop" onClick={onCancel}>
      <div className="modal-sheet" onClick={(e) => e.stopPropagation()}>
        <div style={{ fontSize: 13, marginBottom: 18 }}>{message}</div>
        <div className="actions" style={{ marginTop: 0 }}>
          <button onClick={onCancel}>{cancelLabel}</button>
          <button className="primary" onClick={onConfirm}>
            {confirmLabel}
          </button>
        </div>
      </div>
    </div>
  );
}
