const { createClient } = require('@supabase/supabase-js');

const url = 'https://teidsiqsligaksuwmczt.supabase.co';
const key =
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InRlaWRzaXFzbGlnYWtzdXdtY3p0Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTg1NTk1MjQsImV4cCI6MjA3NDEzNTUyNH0.BPe-_iLNyNicOx-nrQIqCdi3TFUudYs90Lq5lwhHvzg';

const supabase = createClient(url, key);

async function main() {
  const row = {
    action: 'VIEW',
    entity: 'audit_smoke_test',
    entity_id: 'local',
    usuario_email: 'smoke-test@local',
    meta: { source: 'tmp-audit-smoke-test' },
    client_ts: new Date().toISOString()
  };

  const ins = await supabase.from('auditoria_eventos').insert([row]).select('id,created_at').single();
  if (ins.error) throw ins.error;

  const sel = await supabase
    .from('auditoria_eventos')
    .select('id,created_at,action,entity,usuario_email')
    .eq('id', ins.data.id)
    .single();
  if (sel.error) throw sel.error;

  process.stdout.write(JSON.stringify({ inserted: sel.data }, null, 2) + '\n');
}

main().catch((e) => {
  process.stderr.write(`ERR: ${e?.message || String(e)}\n`);
  process.exit(1);
});

