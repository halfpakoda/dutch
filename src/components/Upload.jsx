import { useRef } from 'react';
import { preprocessImage } from '../lib/image';

export default function Upload({ onImageReady, scanError, scanErrorCode }) {
  const galleryInput = useRef(null);
  const cameraInput = useRef(null);

  const handleFile = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    try {
      const dataUrl = await preprocessImage(file);
      onImageReady(dataUrl);
    } catch {
      // fall back to the raw file if the browser can't decode/resize it
      const reader = new FileReader();
      reader.onload = () => onImageReady(reader.result);
      reader.readAsDataURL(file);
    }
  };

  return (
    <div>
      {scanError && (
        <div
          className="card"
          style={{
            marginBottom: 16,
            borderColor: '#a32d2d',
            textAlign: 'center',
          }}
        >
          <div style={{ fontSize: 13, color: '#a32d2d' }}>{scanError}</div>
          {scanErrorCode === 'not_a_bill' && (
            <div style={{ fontSize: 10, color: 'var(--ink-soft)', marginTop: 8, lineHeight: 1.6 }}>
              if it is, crop it down to just the receipt and try again.
              <br />
              still stuck? time to do the math yourself.
            </div>
          )}
          {scanErrorCode === 'quota_exceeded' && (
            <div style={{ fontSize: 10, color: 'var(--ink-soft)', marginTop: 8, lineHeight: 1.6 }}>
              the free scanning quota resets daily. try again later, or just
              add the items by hand this once.
            </div>
          )}
        </div>
      )}

      <div style={{ display: 'flex', gap: 12, marginTop: 8 }}>
        <button
          className="primary"
          onClick={() => cameraInput.current?.click()}
          style={{
            flex: 1,
            aspectRatio: '1 / 1',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            gap: 10,
            fontSize: 12,
            letterSpacing: 1,
          }}
        >
          <i className="ti ti-camera" style={{ fontSize: 36 }} aria-hidden="true"></i>
          take photo of bill
        </button>
        <button
          onClick={() => galleryInput.current?.click()}
          style={{
            flex: 1,
            aspectRatio: '1 / 1',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            gap: 10,
            fontSize: 12,
            letterSpacing: 1,
          }}
        >
          <i className="ti ti-photo" style={{ fontSize: 36 }} aria-hidden="true"></i>
          upload bill
        </button>
      </div>

      <input
        ref={cameraInput}
        type="file"
        accept="image/*"
        capture="environment"
        style={{ display: 'none' }}
        onChange={handleFile}
      />
      <input
        ref={galleryInput}
        type="file"
        accept="image/*"
        style={{ display: 'none' }}
        onChange={handleFile}
      />

      <div className="stub-line">* * * * * * * * * * * * * * *</div>
    </div>
  );
}
