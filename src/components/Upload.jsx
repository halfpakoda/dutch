import { useRef } from 'react';

export default function Upload({ onImageReady }) {
  const galleryInput = useRef(null);
  const cameraInput = useRef(null);

  const handleFile = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => onImageReady(reader.result);
    reader.readAsDataURL(file);
  };

  return (
    <div>
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
