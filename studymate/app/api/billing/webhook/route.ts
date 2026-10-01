import { authorizedWebhook, processCreditWebhook } from '@/lib/credit-webhook';
import { usageError } from '@/lib/metered-route';
import { z } from 'zod';
export async function POST(request: Request) {
  if (!authorizedWebhook(request.headers.get('authorization'))) return Response.json({ error: 'Unauthorized.' }, { status: 401 });
  try {
    if (Number(request.headers.get('content-length') || 0) > 65536) return Response.json({ error: 'Event too large.' }, { status: 413 });
    const text = await request.text(); if (text.length > 65536) return Response.json({ error: 'Event too large.' }, { status: 413 });
    const body = JSON.parse(text) as { event?: unknown };
    return Response.json(await processCreditWebhook(body.event));
  } catch (error) { if (error instanceof z.ZodError || error instanceof SyntaxError) return Response.json({ error: 'Invalid billing event.' }, { status: 400 }); return usageError(error); }
}
