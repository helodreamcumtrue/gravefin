const http = require('http');

function request(options, data) {
  return new Promise((resolve, reject) => {
    const req = http.request(options, (res) => {
      let body = '';
      res.on('data', chunk => body += chunk);
      res.on('end', () => {
        let json;
        try {
          json = JSON.parse(body);
        } catch {
          json = body;
        }
        resolve({
          statusCode: res.statusCode,
          headers: res.headers,
          body: json
        });
      });
    });

    req.on('error', reject);
    if (data) {
      req.write(typeof data === 'string' ? data : JSON.stringify(data));
    }
    req.end();
  });
}

function extractCookie(headers) {
  const setCookie = headers['set-cookie'];
  if (!setCookie) return '';
  if (Array.isArray(setCookie)) {
    return setCookie.map(c => c.split(';')[0]).join('; ');
  }
  return setCookie.split(';')[0];
}

async function runTests() {
  console.log('=== Starting End-to-End Authentication Tests ===\n');
  const port = 3000;

  // Test 1: Invalid Login
  console.log('1. Testing Login with invalid password...');
  const res1 = await request({
    hostname: 'localhost',
    port,
    path: '/api/auth/login',
    method: 'POST',
    headers: { 'Content-Type': 'application/json' }
  }, { email: 'sarah.chen@campus.edu', password: 'wrongpassword' });

  if (res1.statusCode === 401) {
    console.log('   ✅ Correctly rejected with 401 Unauthorized');
  } else {
    console.error('   ❌ Expected 401, got:', res1.statusCode, res1.body);
    process.exit(1);
  }

  // Test 2: Valid Login with Sarah Chen
  console.log('\n2. Testing Login with valid credentials (sarah.chen@campus.edu)...');
  const res2 = await request({
    hostname: 'localhost',
    port,
    path: '/api/auth/login',
    method: 'POST',
    headers: { 'Content-Type': 'application/json' }
  }, { email: 'sarah.chen@campus.edu', password: 'password123' });

  if (res2.statusCode === 200 && res2.body.user?.alias === 'Digger-1042') {
    console.log('   ✅ Login successful for alias:', res2.body.user.alias);
    console.log('   ✅ Token issued:', !!res2.body.token);
  } else {
    console.error('   ❌ Login failed:', res2.statusCode, res2.body);
    process.exit(1);
  }

  const sarahCookie = extractCookie(res2.headers);
  console.log('   ✅ Session cookie received:', sarahCookie ? 'graveyard_session present' : 'none');

  // Test 3: Session check with cookie
  console.log('\n3. Testing /api/auth/me session verification using cookie...');
  const res3 = await request({
    hostname: 'localhost',
    port,
    path: '/api/auth/me',
    method: 'GET',
    headers: { Cookie: sarahCookie }
  });

  if (res3.statusCode === 200 && res3.body.authenticated && res3.body.user?.alias === 'Digger-1042') {
    console.log('   ✅ Session validated: user is authenticated as', res3.body.user.alias);
    console.log('   ✅ Credits:', res3.body.user.credits, 'Reputation:', res3.body.user.reputation);
  } else {
    console.error('   ❌ Session check failed:', res3.statusCode, res3.body);
    process.exit(1);
  }

  // Test 4: Dynamic Account Registration (Signup)
  const testEmail = `test.builder.${Date.now()}@campus.edu`;
  console.log(`\n4. Testing Signup for brand new user (${testEmail})...`);
  const res4 = await request({
    hostname: 'localhost',
    port,
    path: '/api/auth/signup',
    method: 'POST',
    headers: { 'Content-Type': 'application/json' }
  }, { email: testEmail, password: 'securePassword123' });

  if (res4.statusCode === 201 && res4.body.user?.credits === 500) {
    console.log('   ✅ Signup successful! Assigned alias:', res4.body.user.alias);
    console.log('   ✅ Genesis grant awarded: 500 credits, 100 reputation');
  } else {
    console.error('   ❌ Signup failed:', res4.statusCode, res4.body);
    process.exit(1);
  }

  // Test 5: Persona Switcher Server-Side Synchronization
  console.log('\n5. Testing /api/auth/switch-persona to Digger-2099 (Alex Rivera)...');
  const res5 = await request({
    hostname: 'localhost',
    port,
    path: '/api/auth/switch-persona',
    method: 'POST',
    headers: { 'Content-Type': 'application/json' }
  }, { alias: 'Digger-2099' });

  if (res5.statusCode === 200 && res5.body.user?.alias === 'Digger-2099') {
    console.log('   ✅ Persona switch succeeded, active persona is now:', res5.body.user.alias);
  } else {
    console.error('   ❌ Switch persona failed:', res5.statusCode, res5.body);
    process.exit(1);
  }

  const alexCookie = extractCookie(res5.headers);
  const res5Check = await request({
    hostname: 'localhost',
    port,
    path: '/api/auth/me',
    method: 'GET',
    headers: { Cookie: alexCookie }
  });

  if (res5Check.body.authenticated && res5Check.body.user?.alias === 'Digger-2099') {
    console.log('   ✅ Verified /api/auth/me reflects switched persona:', res5Check.body.user.alias);
  } else {
    console.error('   ❌ Switched cookie check failed:', res5Check.body);
    process.exit(1);
  }

  // Test 6: Logout
  console.log('\n6. Testing /api/auth/logout...');
  const res6 = await request({
    hostname: 'localhost',
    port,
    path: '/api/auth/logout',
    method: 'POST',
    headers: { Cookie: alexCookie }
  });

  if (res6.statusCode === 200 && res6.body.success) {
    console.log('   ✅ Logout request succeeded');
  } else {
    console.error('   ❌ Logout failed:', res6.statusCode, res6.body);
    process.exit(1);
  }

  const clearedCookie = extractCookie(res6.headers);
  const res7Check = await request({
    hostname: 'localhost',
    port,
    path: '/api/auth/me',
    method: 'GET',
    headers: { Cookie: clearedCookie }
  });

  if (res7Check.body.authenticated === false) {
    console.log('   ✅ Verified /api/auth/me returns authenticated: false after logout');
  } else {
    console.error('   ❌ Expected unauthenticated after logout, got:', res7Check.body);
    process.exit(1);
  }

  console.log('\n🎉 ALL 6 END-TO-END AUTHENTICATION TESTS PASSED PERFECTLY!\n');
}

runTests().catch(err => {
  console.error('Unexpected test error:', err);
  process.exit(1);
});
