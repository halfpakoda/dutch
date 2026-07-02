// sends the bill photo to our cloudflare worker, which forwards it to
// claude's vision api and returns structured items + charges.
// set VITE_WORKER_URL in a .env file to point at your deployed worker.
const WORKER_URL = import.meta.env.VITE_WORKER_URL || 'http://localhost:8787';

export async function scanBill(imageDataUrl) {
  if (import.meta.env.VITE_MOCK_OCR === 'true') {
    await new Promise((r) => setTimeout(r, 1500));
    return {
      items: [
        { id: 'm1', name: 'butter chicken', price: 420, qty: 1, sharedBy: [] },
        { id: 'm2', name: 'paneer tikka', price: 350, qty: 1, sharedBy: [] },
        { id: 'm3', name: 'naan', price: 60, qty: 4, sharedBy: [] },
        { id: 'm4', name: 'biryani', price: 320, qty: 1, sharedBy: [] },
      ],
      charges: [
        { id: 'c1', name: 'tax', amount: 143, splitMode: 'proportional' },
        { id: 'c2', name: 'service charge', amount: 100, splitMode: 'proportional' },
      ],
    };
  }
  const res = await fetch(`${WORKER_URL}/scan`, {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify({ image: imageDataUrl }),
  });

  if (!res.ok) {
    const text = await res.text().catch(() => '');
    throw new Error(`scan failed (${res.status}): ${text}`);
  }

  const data = await res.json();

  const items = (data.items || []).map((item, i) => ({
    id: `item-${i}-${Date.now()}`,
    name: item.name,
    price: item.price,
    qty: item.qty || 1,
    sharedBy: [],
  }));

  const charges = (data.charges || []).map((charge, i) => ({
    id: `charge-${i}-${Date.now()}`,
    name: charge.name,
    amount: charge.amount,
    splitMode: 'proportional',
  }));

  return { items, charges };
}
