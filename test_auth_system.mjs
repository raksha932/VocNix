// Automated E2E verification for Admin & Super Admin Supabase Authentication

const BASE_URL = process.env.TEST_BASE_URL || 'http://127.0.0.1:3000';

async function runTests() {
  console.log('====================================================');
  console.log('🧪 Starting Auth & RBAC Verification Tests');
  console.log(`🌐 Base URL: ${BASE_URL}`);
  console.log('====================================================\n');

  let passed = 0;
  let failed = 0;

  function assert(condition, message) {
    if (condition) {
      console.log(`  ✅ PASS: ${message}`);
      passed++;
    } else {
      console.error(`  ❌ FAIL: ${message}`);
      failed++;
    }
  }

  const timestamp = Date.now().toString().slice(-6);
  const testAdminUsername = `admin_${timestamp}`;
  const testAdminEmail = `admin_${timestamp}@vocnix-test.com`;
  const testPassword = 'Password123!';

  // 1. Check Username Availability
  console.log('--- Test 1: Username Availability Endpoint ---');
  try {
    const res = await fetch(`${BASE_URL}/api/auth/check-username?username=${testAdminUsername}`);
    const data = await res.json();
    assert(res.status === 200 && data.available === true, 'New username is reported as available');
  } catch (err) {
    assert(false, `Check username error: ${err.message}`);
  }

  // 2. Admin Signup Validation (Password requirements)
  console.log('\n--- Test 2: Admin Signup Validation ---');
  try {
    // Too short password
    const resWeak = await fetch(`${BASE_URL}/api/auth/signup`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        username: testAdminUsername,
        email: testAdminEmail,
        password: 'short',
        confirmPassword: 'short',
      }),
    });
    assert(resWeak.status === 400, 'Rejects password shorter than 8 characters');

    // Mismatched passwords
    const resMismatch = await fetch(`${BASE_URL}/api/auth/signup`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        username: testAdminUsername,
        email: testAdminEmail,
        password: testPassword,
        confirmPassword: 'DifferentPassword123!',
      }),
    });
    assert(resMismatch.status === 400, 'Rejects mismatched passwords');

    // Valid Admin Registration
    const resSuccess = await fetch(`${BASE_URL}/api/auth/signup`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        username: testAdminUsername,
        fullName: 'Test Admin User',
        email: testAdminEmail,
        password: testPassword,
        confirmPassword: testPassword,
      }),
    });
    const dataSuccess = await resSuccess.json();
    assert(resSuccess.status === 201 && dataSuccess.success === true, 'Registers Admin account successfully');

    // Duplicate username rejection
    const resDup = await fetch(`${BASE_URL}/api/auth/signup`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        username: testAdminUsername,
        email: `other_${timestamp}@test.com`,
        password: testPassword,
        confirmPassword: testPassword,
      }),
    });
    assert(resDup.status === 409, 'Rejects duplicate username registration');
  } catch (err) {
    assert(false, `Admin signup error: ${err.message}`);
  }

  // 3. Admin Login Tests
  console.log('\n--- Test 3: Admin Login Verification ---');
  let adminCookie = '';
  try {
    // Invalid password
    const resWrongPass = await fetch(`${BASE_URL}/api/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        identifier: testAdminUsername,
        password: 'WrongPassword999!',
        requiredRole: 'admin',
      }),
    });
    assert(resWrongPass.status === 401, 'Rejects incorrect password');

    // Valid Login with Username
    const resLoginUsername = await fetch(`${BASE_URL}/api/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        identifier: testAdminUsername,
        password: testPassword,
        requiredRole: 'admin',
      }),
    });
    const dataLoginUsername = await resLoginUsername.json();
    const setCookie = resLoginUsername.headers.get('set-cookie');
    if (setCookie) {
      adminCookie = setCookie.split(';')[0];
    }
    assert(
      resLoginUsername.status === 200 &&
      dataLoginUsername.success === true &&
      dataLoginUsername.redirectUrl === '/dashboard',
      'Logs in using username and returns redirect to /dashboard'
    );
    assert(adminCookie.includes('vocnix_session='), 'Sets vocnix_session HTTP-only cookie');

    // Valid Login with Email
    const resLoginEmail = await fetch(`${BASE_URL}/api/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        identifier: testAdminEmail,
        password: testPassword,
        requiredRole: 'admin',
      }),
    });
    const dataLoginEmail = await resLoginEmail.json();
    assert(
      resLoginEmail.status === 200 && dataLoginEmail.success === true,
      'Logs in using email address'
    );
  } catch (err) {
    assert(false, `Admin login error: ${err.message}`);
  }

  // 4. Role-Based Access Isolation (Admin attempting Super Admin)
  console.log('\n--- Test 4: RBAC Isolation (Admin -> Super Admin) ---');
  try {
    // Admin attempting to login via Super Admin login endpoint
    const resAdminAsSuper = await fetch(`${BASE_URL}/api/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        identifier: testAdminUsername,
        password: testPassword,
        requiredRole: 'super_admin',
      }),
    });
    const dataAdminAsSuper = await resAdminAsSuper.json();
    assert(
      resAdminAsSuper.status === 403 && dataAdminAsSuper.code === 'WRONG_ROLE_ADMIN',
      'Blocks Admin from authenticating at Super Admin login portal with 403 WRONG_ROLE_ADMIN'
    );
  } catch (err) {
    assert(false, `RBAC login check error: ${err.message}`);
  }

  // 5. Super Admin Setup and Login
  console.log('\n--- Test 5: Super Admin Setup & Login ---');
  const testSuperUsername = `super_${timestamp}`;
  const testSuperEmail = `super_${timestamp}@vocnix-platform.com`;
  let superCookie = '';
  try {
    // Setup Super Admin
    const resSuperSetup = await fetch(`${BASE_URL}/api/auth/setup-super-admin`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        username: testSuperUsername,
        fullName: 'Global Platform Admin',
        email: testSuperEmail,
        password: testPassword,
        confirmPassword: testPassword,
        setupKey: 'vocnix-platform-setup-2026',
      }),
    });
    const dataSuperSetup = await resSuperSetup.json();
    assert(resSuperSetup.status === 200 && dataSuperSetup.success === true, 'Provisions Super Admin account');

    // Log in as Super Admin
    const resSuperLogin = await fetch(`${BASE_URL}/api/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        identifier: testSuperUsername,
        password: testPassword,
        requiredRole: 'super_admin',
      }),
    });
    const dataSuperLogin = await resSuperLogin.json();
    const superSetCookie = resSuperLogin.headers.get('set-cookie');
    if (superSetCookie) {
      superCookie = superSetCookie.split(';')[0];
    }
    assert(
      resSuperLogin.status === 200 &&
      dataSuperLogin.success === true &&
      dataSuperLogin.redirectUrl === '/admin',
      'Super Admin logs in and receives redirect to /admin'
    );
    assert(superCookie.includes('vocnix_session='), 'Sets Super Admin session cookie');
  } catch (err) {
    assert(false, `Super admin setup/login error: ${err.message}`);
  }

  // 6. Forgot Password Endpoint
  console.log('\n--- Test 6: Forgot Password Endpoint ---');
  try {
    const resForgot = await fetch(`${BASE_URL}/api/auth/forgot-password`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: testAdminEmail }),
    });
    const dataForgot = await resForgot.json();
    assert(resForgot.status === 200 && dataForgot.success === true, 'Processes forgot password request');
  } catch (err) {
    assert(false, `Forgot password error: ${err.message}`);
  }

  // 7. Route Guards & Middleware Verification
  console.log('\n--- Test 7: Middleware Route Protection ---');
  try {
    // Unauthenticated access to /admin -> redirects to /super-admin/login
    const resUnauthAdmin = await fetch(`${BASE_URL}/admin`, { redirect: 'manual' });
    const locationUnauthAdmin = resUnauthAdmin.headers.get('location') || '';
    assert(
      locationUnauthAdmin.includes('/super-admin/login'),
      `Unauthenticated /admin redirects to /super-admin/login (actual: ${locationUnauthAdmin})`
    );

    // Unauthenticated access to /dashboard -> redirects to /admin/login
    const resUnauthDash = await fetch(`${BASE_URL}/dashboard`, { redirect: 'manual' });
    const locationUnauthDash = resUnauthDash.headers.get('location') || '';
    assert(
      locationUnauthDash.includes('/admin/login'),
      `Unauthenticated /dashboard redirects to /admin/login (actual: ${locationUnauthDash})`
    );

    // Admin user attempting /admin -> blocked, redirected to /dashboard?error=access_denied
    if (adminCookie) {
      const resAdminOnSuper = await fetch(`${BASE_URL}/admin`, {
        headers: { Cookie: adminCookie },
        redirect: 'manual',
      });
      const locAdminOnSuper = resAdminOnSuper.headers.get('location') || '';
      assert(
        locAdminOnSuper.includes('/dashboard?error=access_denied'),
        `Admin accessing /admin is redirected to /dashboard?error=access_denied (actual: ${locAdminOnSuper})`
      );

      // Admin user accessing /dashboard -> allowed
      const resAdminOnDash = await fetch(`${BASE_URL}/dashboard`, {
        headers: { Cookie: adminCookie },
        redirect: 'manual',
      });
      assert(
        resAdminOnDash.status === 200,
        `Admin accessing /dashboard is granted access (status: ${resAdminOnDash.status})`
      );
    }

    // Super Admin user accessing /admin -> allowed
    if (superCookie) {
      const resSuperOnAdmin = await fetch(`${BASE_URL}/admin`, {
        headers: { Cookie: superCookie },
        redirect: 'manual',
      });
      assert(
        resSuperOnAdmin.status === 200,
        `Super Admin accessing /admin is granted access (status: ${resSuperOnAdmin.status})`
      );
    }
  } catch (err) {
    assert(false, `Route protection error: ${err.message}`);
  }

  // 8. Logout
  console.log('\n--- Test 8: Logout Verification ---');
  try {
    const resLogout = await fetch(`${BASE_URL}/api/auth/logout`, {
      headers: { Cookie: adminCookie },
      redirect: 'manual',
    });
    const setCookie = resLogout.headers.get('set-cookie') || '';
    assert(
      setCookie.includes('vocnix_session=;') || setCookie.includes('Max-Age=0') || setCookie.includes('expires='),
      'Logout clears vocnix_session cookie'
    );
  } catch (err) {
    assert(false, `Logout error: ${err.message}`);
  }

  console.log('\n====================================================');
  console.log(`📊 Test Summary: ${passed} Passed, ${failed} Failed`);
  console.log('====================================================');

  if (failed > 0) {
    process.exit(1);
  }
}

runTests();
