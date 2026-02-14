const supabase = require('./config/supabase');

async function checkTables() {
    console.log('Checking Supabase Tables...');
    try {
        const tables = ['users', 'channels', 'videos', 'comments', 'likes', 'subscriptions'];

        // Check information_schema first
        const { data: infoData, error: infoError } = await supabase
            .from('information_schema.tables')
            .select('table_name')
            .eq('table_schema', 'public');

        if (!infoError && infoData.length > 0) {
            console.log('Tables found in "public" schema (via information_schema):');
            infoData.forEach(t => console.log(`- ${t.table_name}`));
        } else {
            console.log('Direct information_schema access failed or returned empty. Running manual check...');
            // Manual check for each table
            for (const table of tables) {
                const { error } = await supabase.from(table).select('count', { count: 'exact', head: true });
                if (error) {
                    // 404 means table not found usually (PostgREST returns 404 for missing relations)
                    console.log(`❌ Table "${table}" NOT found. (${error.message})`);
                } else {
                    console.log(`✅ Table "${table}" exists.`);
                }
            }
        }
    } catch (err) {
        console.error('Unexpected error:', err);
    }
}

checkTables();
