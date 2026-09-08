import assert from 'assert';

const BASE_URL = 'http://localhost:3000';

async function runSuperAdminTests() {
  console.log('=== ROLE 1: SUPER ADMIN (PLATFORM OWNER) TEST SUITE ===\n');

  // TEST 1: Platform Overview
  console.log('[TEST 1] Testing /api/admin/overview (Platform metrics & revenue)...');
  const overviewRes = await fetch(`${BASE_URL}/api/admin/overview`);
  assert.strictEqual(overviewRes.status, 200);
  const overviewData = await overviewRes.json();
  assert.strictEqual(overviewData.success, true);
  console.log('  Total Organizations:', overviewData.overview.totalOrganizations);
  console.log('  Active Organizations:', overviewData.overview.activeOrganizations);
  console.log('  Platform MRR: $' + overviewData.overview.monthlyRecurringRevenue);
  console.log('  Total Invoiced Revenue: $' + overviewData.overview.totalInvoicedRevenue);
  console.log('  Platform Usage Minutes:', overviewData.overview.totalPlatformMinutesUsed);
  console.log('  Passed!\n');

  // TEST 2: List All Organizations
  console.log('[TEST 2] Testing /api/admin/organizations (View all organizations)...');
  const orgsRes = await fetch(`${BASE_URL}/api/admin/organizations`);
  assert.strictEqual(orgsRes.status, 200);
  const orgsData = await orgsRes.json();
  assert.strictEqual(orgsData.success, true);
  assert.ok(orgsData.organizations.length > 0, 'Must return organizations list');
  const targetOrg = orgsData.organizations[0];
  console.log(`  Found Organization: ${targetOrg.name} (ID: ${targetOrg.id})`);
  console.log(`  Current Plan: ${targetOrg.planName} ($${targetOrg.planPrice}/mo)`);
  console.log(`  Status: ${targetOrg.status}`);
  console.log('  Passed!\n');

  // TEST 3: Suspend Organization
  console.log('[TEST 3] Testing Suspend Organization...');
  const suspendRes = await fetch(`${BASE_URL}/api/admin/organizations/${targetOrg.id}`, {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ action: 'suspend' }),
  });
  assert.strictEqual(suspendRes.status, 200);
  const suspendData = await suspendRes.json();
  assert.strictEqual(suspendData.success, true);
  assert.strictEqual(suspendData.organization.status, 'suspended');
  console.log(`  Organization status updated to: ${suspendData.organization.status}`);
  console.log('  Passed!\n');

  // TEST 4: Reactivate Organization
  console.log('[TEST 4] Testing Reactivate Organization...');
  const reactivateRes = await fetch(`${BASE_URL}/api/admin/organizations/${targetOrg.id}`, {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ action: 'reactivate' }),
  });
  assert.strictEqual(reactivateRes.status, 200);
  const reactivateData = await reactivateRes.json();
  assert.strictEqual(reactivateData.success, true);
  assert.strictEqual(reactivateData.organization.status, 'active');
  console.log(`  Organization status updated to: ${reactivateData.organization.status}`);
  console.log('  Passed!\n');

  // TEST 5: Change Organization Plan
  console.log('[TEST 5] Testing Change Organization Plan to Enterprise...');
  const changePlanRes = await fetch(`${BASE_URL}/api/admin/organizations/${targetOrg.id}`, {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ action: 'change_plan', planSlug: 'enterprise' }),
  });
  assert.strictEqual(changePlanRes.status, 200);
  const changePlanData = await changePlanRes.json();
  assert.strictEqual(changePlanData.success, true);
  console.log('  Plan updated successfully to enterprise. Passed!\n');

  // TEST 6: Extend Trial
  console.log('[TEST 6] Testing Extend Trial by 30 days...');
  const extendTrialRes = await fetch(`${BASE_URL}/api/admin/organizations/${targetOrg.id}`, {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ action: 'extend_trial', days: 30 }),
  });
  assert.strictEqual(extendTrialRes.status, 200);
  const extendTrialData = await extendTrialRes.json();
  assert.strictEqual(extendTrialData.success, true);
  console.log(`  New trial expiration: ${extendTrialData.newTrialEnd}`);
  console.log('  Passed!\n');

  console.log('===========================================================');
  console.log('ALL SUPER ADMIN PLATFORM OWNER ACCEPTANCE TESTS PASSED!');
  console.log('===========================================================');
}

runSuperAdminTests().catch(err => {
  console.error('Super Admin test failed:', err);
  process.exit(1);
});
