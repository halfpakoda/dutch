import { useEffect, useState } from 'react';
import { scanBill } from '../lib/ocr';

export default function Scanning({ image, onScanned, onError }) {
  const [statusText, setStatusText] = useState('reading the bill...');

  useEffect(() => {
    let cancelled = false;
    const texts = ['reading the bill...', 'finding the items...', 'adding it all up...'];
    let i = 0;
    const interval = setInterval(() => {
      i = (i + 1) % texts.length;
      if (!cancelled) setStatusText(texts[i]);
    }, 1400);

    scanBill(image)
      .then((result) => {
        if (!cancelled) onScanned(result);
      })
      .catch((err) => {
        if (!cancelled) onError(err);
      });

    return () => {
      cancelled = true;
      clearInterval(interval);
    };
  }, [image]);

  return (
    <div>
      <div
        style={{
          position: 'relative',
          overflow: 'hidden',
          border: '1px solid var(--border)',
          borderRadius: 'var(--radius)',
        }}
      >
        <img src={image} alt="your bill" style={{ width: '100%', display: 'block' }} />
        <div className="scan-overlay" />
        <div className="scan-line" />
      </div>

      <div style={{ textAlign: 'center', marginTop: 18, fontSize: 12, letterSpacing: 1 }}>
        {statusText}
      </div>

      <style>{`
        .scan-overlay {
          position: absolute;
          inset: 0;
          background: rgba(246, 241, 231, 0.55);
          backdrop-filter: blur(1px);
        }
        .scan-line {
          position: absolute;
          left: 0;
          right: 0;
          height: 3px;
          background: var(--ink);
          box-shadow: 0 0 16px 4px rgba(50,50,50,0.7), 0 0 30px 10px rgba(246,241,231,0.8);
          animation: sweep 1.8s ease-in-out infinite;
        }
        @keyframes sweep {
          0% { top: 0%; }
          50% { top: 98%; }
          100% { top: 0%; }
        }
      `}</style>
    </div>
  );
}
