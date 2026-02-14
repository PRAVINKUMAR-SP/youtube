// No imports needed for Node 18+

async function testRegister() {
    const url = 'http://localhost:5000/api/auth/register';

    const uniqueUser = `user_${Date.now()}`;
    const payload = {
        username: uniqueUser,
        email: `${uniqueUser}@example.com`,
        password: 'password123'
    };

    console.log(`Testing Registration to ${url}...`);
    // console.log('Payload:', payload);

    try {
        const response = await fetch(url, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(payload)
        });

        const status = response.status;
        const text = await response.text();

        console.log(`Response Status: ${status}`);
        console.log('Response Body:', text);

    } catch (err) {
        console.error('Fetch Error:', err);
    }
}

testRegister();
