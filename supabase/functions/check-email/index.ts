import { createClient } from 'npm:@supabase/supabase-js@2';

const headers = {
  'Content-Type': 'application/json',
  'Cache-Control': 'no-store',
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, apikey, x-client-info, content-type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
};
const reply = (body: object, status = 200) => new Response(JSON.stringify(body), { status, headers });

Deno.serve(async request => {
  if (request.method === 'OPTIONS') return new Response(null, { status: 204, headers });
  if (request.method !== 'POST') return reply({ error: 'method_not_allowed' }, 405);
  if (!request.headers.get('content-type')?.includes('application/json')) return reply({ error: 'invalid_request' }, 400);
  try {
    // Bound the body without buffering an unbounded request.
    const reader = request.body?.getReader();
    if (!reader) return reply({ error: 'invalid_request' }, 400);
    let bytes = 0, text = '';
    const decoder = new TextDecoder();
    while (true) {
      const { value, done } = await reader.read(); if (done) break;
      bytes += value.byteLength;
      if (bytes > 1024) { await reader.cancel(); return reply({ error: 'invalid_request' }, 413); }
      text += decoder.decode(value, { stream: true });
    }
    text += decoder.decode();
    const body = JSON.parse(text);
    const email = typeof body.email === 'string' ? body.email.trim().toLowerCase() : '';
    if (email.length > 254 || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) return reply({ error: 'invalid_email' }, 400);
    const url = Deno.env.get('SUPABASE_URL');
    const secret = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');
    if (!url || !secret) return reply({ error: 'unavailable' }, 503);
    const ip = (request.headers.get('x-forwarded-for') || request.headers.get('x-real-ip') || 'unknown').split(',')[0].trim();
    const encoder = new TextEncoder();
    const hmacKey = await crypto.subtle.importKey('raw', encoder.encode(secret), { name: 'HMAC', hash: 'SHA-256' }, false, ['sign']);
    const hash = [...new Uint8Array(await crypto.subtle.sign('HMAC', hmacKey, encoder.encode(ip)))].map(v => v.toString(16).padStart(2, '0')).join('');
    const admin = createClient(url, secret, { auth: { autoRefreshToken: false, persistSession: false } });
    const { data, error } = await admin.rpc('autolog_check_email', { p_email: email, p_client_hash: hash });
    if (error || !data) return reply({ error: 'unavailable' }, 503);
    if (data.error === 'rate_limited') return reply({ error: 'rate_limited' }, 429);
    if (typeof data.exists !== 'boolean') return reply({ error: 'unavailable' }, 503);
    return reply({ exists: data.exists });
  } catch { return reply({ error: 'invalid_request' }, 400); }
});
