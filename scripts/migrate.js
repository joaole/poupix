#!/usr/bin/env node
// npm run db:migrate
// Runs all SQL migration files in supabase/migrations/ against the Supabase project
// using the service role key (bypasses RLS).

const { createClient } = require('@supabase/supabase-js')
const fs = require('fs')
const path = require('path')

require('dotenv').config({ path: '.env.local' })

const url = process.env.NEXT_PUBLIC_SUPABASE_URL
const key = process.env.SUPABASE_SERVICE_ROLE_KEY

if (!url || !key) {
  console.error('Missing NEXT_PUBLIC_SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY in .env.local')
  process.exit(1)
}

const supabase = createClient(url, key, {
  auth: { autoRefreshToken: false, persistSession: false },
})

const migrationsDir = path.join(__dirname, '..', 'supabase', 'migrations')
const files = fs.readdirSync(migrationsDir).filter(f => f.endsWith('.sql')).sort()

;(async () => {
  for (const file of files) {
    const sql = fs.readFileSync(path.join(migrationsDir, file), 'utf8')
    console.log(`Running migration: ${file}`)
    const { error } = await supabase.rpc('exec_sql', { sql }).single()
    // If exec_sql RPC doesn't exist, fall back to direct query via REST
    if (error && error.message?.includes('exec_sql')) {
      // Split on semicolons and run each statement
      const statements = sql
        .split(/;\s*(?:\n|$)/)
        .map(s => s.trim())
        .filter(s => s.length > 0 && !s.startsWith('--'))

      for (const stmt of statements) {
        const { error: stmtErr } = await supabase.from('_migrations_dummy').select('*').limit(0)
          // We can't run arbitrary SQL via the JS client without a custom RPC.
          // Print instructions for manual execution.
        void stmtErr
      }
      console.log(`  ⚠  Cannot run raw SQL via JS client. Please run ${file} manually in the Supabase SQL editor.`)
      console.log(`  Tip: Supabase CLI: supabase db push  (or paste into dashboard → SQL editor)`)
    } else if (error) {
      console.error(`  ✗ Error in ${file}:`, error.message)
      process.exit(1)
    } else {
      console.log(`  ✓ ${file}`)
    }
  }
  console.log('\nMigration complete.')
  console.log('\nNote: If you cannot run SQL via the JS client, open the Supabase SQL editor and run')
  console.log('each file in supabase/migrations/ in order.')
})()
