import { createClient } from 'npm:@supabase/supabase-js@2';
const headers = { 'Content-Type': 'application/json', 'Cache-Control': 'no-store', 'Access-Control-Allow-Origin': '*', 'Access-Control-Allow-Headers': 'authorization, apikey, x-client-info, content-type', 'Access-Control-Allow-Methods': 'POST, OPTIONS' };
const reply = (body: object, status = 200) => new Response(JSON.stringify(body), { status, headers });
Deno.serve(async request => {
  if (request.method === 'OPTIONS') return new Response(null, { status: 204, headers });
  if (request.method !== 'POST') return reply({ error: 'method_not_allowed' }, 405);
  const token = request.headers.get('authorization')?.match(/^Bearer (.+)$/i)?.[1];
  if (!token) return reply({ error: 'unauthorized' }, 401);
  try {
    const admin = createClient(Deno.env.get('SUPABASE_URL')!, Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!, { auth: { persistSession: false, autoRefreshToken: false } });
    const { data: { user }, error } = await admin.auth.getUser(token);
    if (error || !user) return reply({ error: 'unauthorized' }, 401);
    const { error: deletionError } = await admin.auth.admin.deleteUser(user.id);
    if (deletionError) return reply({ error: 'delete_failed' }, 500);
    return reply({ deleted: true });
  } catch { return reply({ error: 'unavailable' }, 503); }
});
