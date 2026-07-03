// cloudflare worker: proxies bill photos to gemini's vision api so the
// api key never touches the browser. deploy with wrangler,
// set GEMINI_API_KEY as a secret, and point VITE_WORKER_URL at it.

const ALLOWED_ORIGIN = '*'; // tighten to your github pages origin once deployed

const SYSTEM_PROMPT = `you read restaurant/bar bill photos and extract structured data.
return only valid json, no markdown, no commentary.

if the image is not a restaurant/bar/cafe bill or receipt, return exactly:
{"error": "not_a_bill"}

otherwise return json in this exact shape:
{
  "items": [{"name": "string", "price": number, "qty": number}],
  "charges": [{"name": "string", "amount": number}]
}
"items" are individual food/drink line items with their unit price and quantity.
"charges" are bill-level extras like tax, service charge, delivery fee (positive numbers)
or discounts (negative numbers). do not include the items themselves in charges.

important - getting "price" right (price * qty must reconstruct the right line amount):
- bills print a "rate"/unit-price column and, often, a separate "amount"/"total"
  column for the same row. use whichever one is the PRE-TAX line amount - "price"
  should never have any tax or service charge baked into it, because all tax and
  service charge lines are already captured separately in "charges", and including
  them in both places would double-count them.
- almost always this means "price" = the plain "rate" column, and price * qty
  should equal rate * qty. if the printed row "amount" differs from rate * qty by
  roughly the bill's overall tax percentage (e.g. row amount ≈ rate * qty * 1.05
  when there's 2.5% CGST + 2.5% SGST), that's tax baked into the row amount - use
  rate * qty instead of the row amount.
- only fall back to (row amount / qty) when the row amount differs from rate * qty
  for a reason that has nothing to do with tax (e.g. a genuine per-row rounding
  quirk, or the bill has no separate tax/charge lines at all).

important - reading the charges section correctly:
- bills often list several charge lines between the items table and the grand total,
  e.g. "Sub Total", "CGST", "SGST", "S.Tax" / "Service Tax", "VAT", "Service Charge",
  "Cess", "Delivery Fee", "Discount". treat every one of these lines as its own
  charge EXCEPT "Sub Total" (that's just the sum of items, not a charge) and any
  "Total Qty" / "Grand Total" / final total line.
- abbreviations like "S.Tax" or "S. Tax" mean "service tax" - a real charge line,
  separate from "Sub Total". don't skip it and don't confuse the two because their
  labels look similar.
- include every distinct tax/charge line even if there are several (e.g. both CGST
  and SGST, or CGST/SGST alongside a separate service tax) - do not merge them or
  drop any of them.
- the "charges" array is required in every response (except the not_a_bill case) -
  include it even if it's empty. never omit the "charges" key.

important - reading the item table correctly:
- item names sometimes wrap onto a second printed line because they're too long for
  the column (e.g. "budweiser premium mug" printed as "budweiser" then "premium mug"
  on the next line). a wrapped continuation line has no qty/price/amount of its own -
  it belongs to the item above it. do not treat a name-only line as a separate item,
  and do not let it shift the qty/price/amount values of later rows.
- match each item name to the qty/price/amount that appears on the same visual row,
  not the next available numbers in sequence.
- before finalizing, count the number of distinct item rows (by name) and the
  number of qty/rate/amount entries in the table - they should be equal, one set
  per row. if they don't match 1:1, you've likely merged two rows together or
  split one row into two - recount directly from the image and fix it.
- after extracting all items, check your work: sum(price * qty) for all items, plus
  all charges, should be close to the bill's printed subtotal/grand total. if it's
  off, you've likely misaligned a row - re-examine the image and fix it before
  returning your answer.

if a field is illegible, make your best guess. never include any text outside the json object.`;

export default {
  async fetch(request, env) {
    if (request.method === 'OPTIONS') {
      return new Response(null, { headers: corsHeaders() });
    }

    const url = new URL(request.url);
    if (url.pathname !== '/scan' || request.method !== 'POST') {
      return new Response('not found', { status: 404, headers: corsHeaders() });
    }

    try {
      const { image } = await request.json();
      if (!image || typeof image !== 'string') {
        return jsonResponse({ error: 'missing image' }, 400);
      }

      const match = image.match(/^data:(image\/\w+);base64,(.+)$/);
      if (!match) {
        return jsonResponse({ error: 'image must be a base64 data url' }, 400);
      }
      const [, mediaType, base64Data] = match;

      const geminiRes = await fetch(
        `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${env.GEMINI_API_KEY}`,
        {
          method: 'POST',
          headers: { 'content-type': 'application/json' },
          body: JSON.stringify({
            systemInstruction: { parts: [{ text: SYSTEM_PROMPT }] },
            contents: [
              {
                role: 'user',
                parts: [
                  { inline_data: { mime_type: mediaType, data: base64Data } },
                  { text: 'extract the items and charges from this bill.' },
                ],
              },
            ],
            generationConfig: {
              responseMimeType: 'application/json',
              temperature: 0,
              topP: 0.1,
              topK: 1,
              responseSchema: {
                type: 'object',
                properties: {
                  error: { type: 'string' },
                  items: {
                    type: 'array',
                    items: {
                      type: 'object',
                      properties: {
                        name: { type: 'string' },
                        price: { type: 'number' },
                        qty: { type: 'number' },
                      },
                      required: ['name', 'price', 'qty'],
                    },
                  },
                  charges: {
                    type: 'array',
                    items: {
                      type: 'object',
                      properties: {
                        name: { type: 'string' },
                        amount: { type: 'number' },
                      },
                      required: ['name', 'amount'],
                    },
                  },
                },
                required: ['items', 'charges'],
              },
            },
          }),
        }
      );

      if (geminiRes.status === 429) {
        return jsonResponse({ error: 'quota_exceeded' }, 429);
      }

      if (!geminiRes.ok) {
        const errText = await geminiRes.text();
        return jsonResponse({ error: 'vision api error', detail: errText }, 502);
      }

      const geminiData = await geminiRes.json();
      const text = geminiData.candidates?.[0]?.content?.parts?.[0]?.text || '{}';
      const parsed = JSON.parse(text);

      if (parsed.error === 'not_a_bill') {
        return jsonResponse({ error: 'not_a_bill' }, 422);
      }

      return jsonResponse(parsed, 200);
    } catch (err) {
      return jsonResponse({ error: err.message || 'unknown error' }, 500);
    }
  },
};

function corsHeaders() {
  return {
    'access-control-allow-origin': ALLOWED_ORIGIN,
    'access-control-allow-methods': 'POST, OPTIONS',
    'access-control-allow-headers': 'content-type',
  };
}

function jsonResponse(obj, status) {
  return new Response(JSON.stringify(obj), {
    status,
    headers: { 'content-type': 'application/json', ...corsHeaders() },
  });
}
