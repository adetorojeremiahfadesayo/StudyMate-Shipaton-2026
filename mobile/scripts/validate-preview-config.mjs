const required = ['VITE_SUPABASE_URL', 'VITE_SUPABASE_ANON_KEY', 'VITE_API_BASE_URL'];
for (const name of required) {
  if (!process.env[name]?.trim()) throw Error(`Missing public preview configuration: ${name}`);
}
for (const name of ['VITE_SUPABASE_URL', 'VITE_API_BASE_URL']) {
  const url = new URL(process.env[name]);
  if (url.protocol !== 'https:' || url.username || url.password) throw Error(`${name} must be a public HTTPS URL without credentials.`);
}
const key = process.env.VITE_SUPABASE_ANON_KEY;
let isPublicKey = key.startsWith('sb_publishable_');
if (!isPublicKey) {
  try { isPublicKey = JSON.parse(Buffer.from(key.split('.')[1], 'base64url').toString()).role === 'anon'; }
  catch { isPublicKey = false; }
}
if (!isPublicKey) throw Error('The browser preview requires a Supabase public anon/publishable key.');
console.log('Public preview configuration validated; no values printed.');
