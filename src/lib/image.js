// normalizes a photo before it goes to the vision api: corrects exif rotation
// and caps the long edge so huge camera captures don't get inconsistently
// downsampled server-side, which was a source of flaky bill scans.
const MAX_EDGE = 1600;

export async function preprocessImage(file) {
  const bitmap = await createImageBitmap(file, { imageOrientation: 'from-image' });

  const scale = Math.min(1, MAX_EDGE / Math.max(bitmap.width, bitmap.height));
  const width = Math.round(bitmap.width * scale);
  const height = Math.round(bitmap.height * scale);

  const canvas = document.createElement('canvas');
  canvas.width = width;
  canvas.height = height;
  const ctx = canvas.getContext('2d');
  ctx.drawImage(bitmap, 0, 0, width, height);
  bitmap.close();

  return canvas.toDataURL('image/jpeg', 0.9);
}
