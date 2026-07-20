
require('dotenv').config();
const { createClient } = require('@supabase/supabase-js');

async function runMigration() {
  const supabaseUrl = process.env.SUPABASE_URL;
  const serviceRoleKey = process.env.SUPABASE_SECRET_KEY;

  if (!supabaseUrl || !serviceRoleKey) {
    console.error('Missing SUPABASE_URL or SUPABASE_SECRET_KEY!');
    process.exit(1);
  }

  const supabase = createClient(supabaseUrl, serviceRoleKey, {
    auth: { autoRefreshToken: false, persistSession: false }
  });

  // Read the migration SQL
  const fs = require('fs');
  const path = require('path');
  const migrationSql = fs.readFileSync(path.join(__dirname, '../supabase/migrations/029_add_first_last_name_to_profile.sql'), 'utf8');

  console.log('Running migration...');
  console.log(migrationSql);

  // Split SQL into individual statements (since we can't run multiple in one query)
  const statements = migrationSql
    .split(';')
    .map(s => s.trim())
    .filter(s => s.length > 0);

  for (const statement of statements) {
    if (statement.startsWith('--')) continue;
    console.log(`Executing: ${statement.substring(0, 100)}...`);
    const { error } = await supabase.rpc('exec_sql', { sql: statement });
    if (error) {
      console.error('Error executing statement:', error);
      // Wait, maybe exec_sql doesn't exist? Let's try another approach - use the pooler or SQL Editor alternative?
      // Let's try to run using the SQL REST API
      const response = await fetch(`${supabaseUrl}/rest/v1/rpc/exec_sql`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'apikey': serviceRoleKey,
          'Authorization': `Bearer ${serviceRoleKey}`
        },
        body: JSON.stringify({ sql: statement })
      });

      if (!response.ok) {
        console.error('Alternative approach failed too. Let\'s just manually execute the SQL in your Supabase Dashboard!');
        console.log('\nPlease copy and paste this SQL into your Supabase SQL Editor:');
        console.log('--------------------------------------------------');
        console.log(migrationSql);
        console.log('--------------------------------------------------');
        process.exit(1);
      }
    }
  }

  console.log('Migration completed successfully!');
}

// Since exec_sql might not exist, let's just print the SQL for the user to run manually
console.log('\nPlease copy and paste this SQL into your Supabase SQL Editor (https://supabase.com/dashboard):');
console.log('--------------------------------------------------');
const fs = require('fs');
const path = require('path');
const migrationSql = fs.readFileSync(path.join(__dirname, '../supabase/migrations/029_add_first_last_name_to_profile.sql'), 'utf8');
console.log(migrationSql);
console.log('--------------------------------------------------');
console.log('\nOr, if you have the Supabase CLI set up, you can run:');
console.log('npx supabase link --project-ref YOUR_PROJECT_REF');
console.log('npx supabase db push');
