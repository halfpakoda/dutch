import { useRef, useState } from 'react';
import html2canvas from 'html2canvas';
import { computeSplit, round2 } from '../lib/split';

function BreakdownRows({ results, grandTotal }) {
  return (
    <>
      {results.map((r) => (
        <div key={r.id}>
          <div style={{ padding: '12px 14px' }}>
            <div className="row">
              <span style={{ fontSize: 13 }}>
                <i className="ti ti-circle-filled" style={{ fontSize: 8, marginRight: 6 }} aria-hidden="true"></i>
                {r.name}
              </span>
              <span style={{ fontSize: 13 }}>{round2(r.total).toFixed(2)}</span>
            </div>
            <div style={{ marginTop: 8, paddingLeft: 14, fontSize: 10, color: 'var(--ink-soft)' }}>
              {r.breakdown.map((b, idx) => (
                <div key={idx} className="row" style={{ marginBottom: 2 }}>
                  <span>{b.name}</span>
                  <span>{round2(b.amount).toFixed(2)}</span>
                </div>
              ))}
              {r.chargesTotal > 0 && (
                <div className="row">
                  <span>tax &amp; charges</span>
                  <span>{round2(r.chargesTotal).toFixed(2)}</span>
                </div>
              )}
            </div>
          </div>
          <div style={{ borderTop: '1px dashed var(--border-dashed)', margin: '0 14px' }} />
        </div>
      ))}
      <div style={{ padding: '12px 14px' }}>
        <div className="row">
          <span style={{ fontSize: 14, fontWeight: 700 }}>total</span>
          <span style={{ fontSize: 14, fontWeight: 700 }}>{grandTotal.toFixed(2)}</span>
        </div>
      </div>
    </>
  );
}

export default function Results({ items, people, charges, onBack }) {
  const results = computeSplit(items, people, charges);
  const grandTotal = round2(results.reduce((sum, r) => sum + r.total, 0));
  const cardRef = useRef(null);
  const shareRef = useRef(null);
  const [copyLabel, setCopyLabel] = useState('copy text');

  const summaryText = () => {
    const lines = [
      'dutch.',
      `split between ${people.length} people`,
      '- - - - - - - - - - - - - - -',
      '',
    ];
    results.forEach((r) => {
      lines.push(`${r.name} - ${round2(r.total).toFixed(2)}`);
      r.breakdown.forEach((b) => {
        lines.push(`  ${b.name} ${round2(b.amount).toFixed(2)}`);
      });
      if (r.chargesTotal > 0) {
        lines.push(`  tax & charges ${round2(r.chargesTotal).toFixed(2)}`);
      }
      lines.push('');
    });
    lines.push('- - - - - - - - - - - - - - -');
    lines.push(`total: ${grandTotal.toFixed(2)}`);
    return lines.join('\n');
  };

  const handleCopyText = async () => {
    await navigator.clipboard.writeText(summaryText());
    setCopyLabel('copied!');
    setTimeout(() => setCopyLabel('copy text'), 1500);
  };

  const handleShareImage = async () => {
    const canvas = await html2canvas(shareRef.current, { backgroundColor: '#f6f1e7', scale: 2 });
    const blob = await new Promise((resolve) => canvas.toBlob(resolve, 'image/png'));
    const file = new File([blob], 'dutch-split.png', { type: 'image/png' });

    if (navigator.canShare && navigator.canShare({ files: [file] })) {
      try {
        await navigator.share({ files: [file], title: 'dutch. split summary' });
        return;
      } catch {
        // fall through to download
      }
    }

    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'dutch-split.png';
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div>
      <div className="screen-title">split summary</div>
      <div className="screen-sub">{people.length} people &middot; {items.length} items</div>

      <div ref={cardRef} className="card" style={{ padding: 0 }}>
        <BreakdownRows results={results} grandTotal={grandTotal} />
      </div>

      <div style={{ position: 'fixed', top: 0, left: -9999, width: 460 }} aria-hidden="true">
        <div ref={shareRef} className="card" style={{ padding: 0, background: 'var(--paper-raised)' }}>
          <div style={{ padding: '14px 14px 12px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
              <img src="/dutch/icon-192.png" alt="" width={18} height={18} style={{ display: 'block' }} />
              <span style={{ fontSize: 15, fontWeight: 700, letterSpacing: 2 }}>dutch.</span>
            </div>
            <div style={{ fontSize: 10, color: 'var(--ink-soft)', marginTop: 3 }}>
              split between {people.length} {people.length === 1 ? 'person' : 'people'}
            </div>
          </div>
          <div style={{ borderTop: '1px dashed var(--border-dashed)', margin: '0 14px' }} />
          <BreakdownRows results={results} grandTotal={grandTotal} />
        </div>
      </div>

      <div className="actions">
        <button onClick={onBack}>back</button>
        <button onClick={handleCopyText}>
          <i className="ti ti-copy" aria-hidden="true"></i> {copyLabel}
        </button>
      </div>
      <div className="actions">
        <button className="primary" onClick={handleShareImage} style={{ width: '100%' }}>
          <i className="ti ti-share" aria-hidden="true"></i> share image
        </button>
      </div>

      <div className="stub-line">* * * * * * * * * * * * * * *</div>
    </div>
  );
}
