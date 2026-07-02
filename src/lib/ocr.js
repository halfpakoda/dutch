// sends the bill photo to our cloudflare worker, which forwards it to
// claude's vision api and returns structured items + charges.
// set VITE_WORKER_URL in a .env file to point at your deployed worker.
const WORKER_URL = import.meta.env.VITE_WORKER_URL || 'http://localhost:8787';

// bills often itemize tax into several lines (cgst, sgst, service charge...)
// nobody needs that granularity here, so collapse them into one number.
function mergeCharges(rawCharges) {
  const total = rawCharges.reduce((sum, c) => sum + (c.amount || 0), 0);
  return [{ id: `charge-${Date.now()}`, name: 'taxes & charges', amount: total, splitMode: 'proportional' }];
}

export async function scanBill(imageDataUrl) {
  if (import.meta.env.VITE_MOCK_OCR === 'true') {
    await new Promise((r) => setTimeout(r, 1500));

    const forceError = import.meta.env.VITE_MOCK_OCR_ERROR;
    if (forceError) {
      const err = new Error(forceError);
      err.code = forceError;
      throw err;
    }

    return {
      items: [
        { id: 'm1', name: 'butter chicken', price: 420, qty: 1, sharedBy: [] },
        { id: 'm2', name: 'paneer tikka', price: 350, qty: 1, sharedBy: [] },
        { id: 'm3', name: 'naan', price: 60, qty: 4, sharedBy: [] },
        { id: 'm4', name: 'biryani', price: 320, qty: 1, sharedBy: [] },
      ],
      charges: mergeCharges([
        { name: 'tax', amount: 143 },
        { name: 'service charge', amount: 100 },
      ]),
    };
  }
  const res = await fetch(`${WORKER_URL}/scan`, {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify({ image: imageDataUrl }),
  });

  if (res.status === 422) {
    const err = new Error('not_a_bill');
    err.code = 'not_a_bill';
    throw err;
  }

  if (res.status === 429) {
    const err = new Error('quota_exceeded');
    err.code = 'quota_exceeded';
    throw err;
  }

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

  const charges = mergeCharges(data.charges || []);

  return { items, charges };
}
