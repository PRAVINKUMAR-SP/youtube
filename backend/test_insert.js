const supabase = require('./config/supabase');

async function testInsert() {
    console.log('Testing Direct INSERT to Supabase...');

    const uniqueUser = `test_script_${Date.now()}`;
    const payload = {
        username: uniqueUser,
        email: `${uniqueUser}@example.com`,
        password: 'hashed_password_placeholder',
        avatar: 'https://placehold.co/100'
    };

    try {
        const { data, error } = await supabase
            .from('users')
            .insert([payload])
            .select()
            .single();

        if (error) {
            console.error('❌ INSERT Failed:', error);
            console.error('Message:', error.message);
            console.error('Details:', error.details);
            console.error('Hint:', error.hint);
        } else {
            console.log('✅ INSERT Successful!');
            console.log('User ID:', data.id);

            // Clean up
            await supabase.from('users').delete().eq('id', data.id);
            console.log('Cleaned up (Deleted test user).');
        }

    } catch (err) {
        console.error('Unexpected Script Error:', err);
    }
}

testInsert();
