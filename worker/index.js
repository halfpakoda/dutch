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
"price" is the unit price for one qty (not the line total).
"charges" are bill-level extras like tax, service charge, delivery fee (positive numbers)
or discounts (negative numbers). do not include the items themselves in charges.

important - reading the item table correctly:
- item names sometimes wrap onto a second printed line because they're too long for
  the column (e.g. "budweiser premium mug" printed as "budweiser" then "premium mug"
  on the next line). a wrapped continuation line has no qty/price/amount of its own -
  it belongs to the item above it. do not treat a name-only line as a separate item,
  and do not let it shift the qty/price/amount values of later rows.
- match each item name to the qty/price/amount that appears on the same visual row,
  not the next available numbers in sequence.
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
            generationConfig: { responseMimeType: 'application/json' },
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
