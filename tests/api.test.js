/**
 * Automated API & Backend Integration Test Suite for Pocket V1
 * Tests all endpoints, validation rules, integer paise calculations, and DB queries.
 */

const http = require('node:http');
const path = require('node:path');
const fs = require('node:fs');

// Use a separate test database file
const TEST_DB_PATH = path.resolve(__dirname, '../pocket_test.db');
if (fs.existsSync(TEST_DB_PATH)) {
  fs.unlinkSync(TEST_DB_PATH);
}
process.env.DB_PATH = TEST_DB_PATH;
process.env.NODE_ENV = 'test';

const { app } = require('../src/server');
const { getDb, closeDb } = require('../src/db/connection');
const { initDatabase } = require('../src/db/schema');

// Initialize test DB
initDatabase();

let server = null;
const TEST_PORT = 3001;

function request(method, path, body = null) {
  return new Promise((resolve, reject) => {
    const options = {
      hostname: '127.0.0.1',
      port: TEST_PORT,
      path: path,
      method: method,
      headers: {
        'Content-Type': 'application/json'
      }
    };

    const req = http.request(options, (res) => {
      let data = '';
      res.on('data', (chunk) => {
        data += chunk;
      });
      res.on('end', () => {
        let parsed = null;
        try {
          parsed = JSON.parse(data);
        } catch (e) {
          parsed = data;
        }
        resolve({
          status: res.statusCode,
          headers: res.headers,
          body: parsed
        });
      });
    });

    req.on('error', (err) => {
      reject(err);
    });

    if (body) {
      req.write(JSON.stringify(body));
    }
    req.end();
  });
}

function assert(condition, message) {
  if (!condition) {
    throw new Error(`Assertion Failed: ${message}`);
  }
  console.log(`  ✓ ${message}`);
}

async function runTests() {
  console.log('\n--- STARTING POCKET V1 BACKEND API TEST SUITE ---');

  // Start temporary test server
  await new Promise((resolve) => {
    server = app.listen(TEST_PORT, () => {
      console.log(`Test server running on port ${TEST_PORT}\n`);
      resolve();
    });
  });

  try {
    // ==========================================
    // 1. Profile API Tests
    // ==========================================
    console.log('[1] Testing Profile API...');
    const getProfileRes = await request('GET', '/api/profile');
    assert(getProfileRes.status === 200, 'GET /api/profile returns 200');
    assert(getProfileRes.body.data.username === 'Uttam', 'Default username is "Uttam"');

    const updateProfileRes = await request('PUT', '/api/profile', { username: 'Uttam Kumar' });
    assert(updateProfileRes.status === 200, 'PUT /api/profile returns 200');
    assert(updateProfileRes.body.data.username === 'Uttam Kumar', 'Profile updated to "Uttam Kumar"');

    // ==========================================
    // 2. Income API Tests
    // ==========================================
    console.log('\n[2] Testing Income API...');
    // Validation test
    const invalidIncomeRes = await request('POST', '/api/income', { amount: -50, note: '', datetime: 'bad-date' });
    assert(invalidIncomeRes.status === 400, 'POST /api/income with invalid data returns 400');

    // Create Income: ₹50,000.50 (5000050 paise)
    const createIncomeRes1 = await request('POST', '/api/income', {
      amount: 50000.50,
      note: 'Monthly Salary',
      datetime: '2026-08-01T10:00:00'
    });
    assert(createIncomeRes1.status === 201, 'POST /api/income (salary) returns 201');
    assert(createIncomeRes1.body.data.amount === 50000.50, 'Income amount in rupees is 50000.50');
    assert(createIncomeRes1.body.data.amountPaise === 5000050, 'Income amount stored in integer paise: 5000050');
    const incomeId1 = createIncomeRes1.body.data.id;

    // Create Income: ₹5,000 (Freelance)
    const createIncomeRes2 = await request('POST', '/api/income', {
      amount: 5000,
      note: 'Freelance Design',
      datetime: '2026-08-15T15:30:00'
    });
    assert(createIncomeRes2.status === 201, 'POST /api/income (freelance) returns 201');
    const incomeId2 = createIncomeRes2.body.data.id;

    // Get All Income
    const getAllIncomeRes = await request('GET', '/api/income');
    assert(getAllIncomeRes.status === 200, 'GET /api/income returns 200');
    assert(getAllIncomeRes.body.data.length === 2, 'GET /api/income returns 2 items');

    // Update Income
    const updateIncomeRes = await request('PUT', `/api/income/${incomeId2}`, {
      amount: 6000,
      note: 'Freelance Design + Bonus',
      datetime: '2026-08-15T15:30:00'
    });
    assert(updateIncomeRes.status === 200, 'PUT /api/income/:id returns 200');
    assert(updateIncomeRes.body.data.amount === 6000, 'Updated income amount is 6000');
    assert(updateIncomeRes.body.data.amountPaise === 600000, 'Updated income integer paise is 600000');

    // ==========================================
    // 3. Expense API Tests
    // ==========================================
    console.log('\n[3] Testing Expense API...');
    // Validation tests
    const invalidExpRes1 = await request('POST', '/api/expenses', { amount: 0, category: 'invalid', type: 'invalid', datetime: 'bad' });
    assert(invalidExpRes1.status === 400, 'POST /api/expenses with invalid category/amount returns 400');

    // Create Expense 1: Food & Dining, Need: ₹450.75 (45075 paise)
    const nowIso = new Date().toISOString();
    const createExpRes1 = await request('POST', '/api/expenses', {
      amount: 450.75,
      category: 'food',
      note: 'Lunch at Cafe',
      datetime: nowIso,
      type: 'need'
    });
    assert(createExpRes1.status === 201, 'POST /api/expenses (food) returns 201');
    assert(createExpRes1.body.data.amount === 450.75, 'Expense amount in rupees is 450.75');
    assert(createExpRes1.body.data.amountPaise === 45075, 'Expense stored in integer paise: 45075');
    const expId1 = createExpRes1.body.data.id;

    // Create Expense 2: Shopping, Want: ₹2,500.25 (250025 paise)
    const createExpRes2 = await request('POST', '/api/expenses', {
      amount: 2500.25,
      category: 'shopping',
      note: 'New Headphones',
      datetime: nowIso,
      type: 'want'
    });
    assert(createExpRes2.status === 201, 'POST /api/expenses (shopping) returns 201');
    const expId2 = createExpRes2.body.data.id;

    // Get Expenses by category filter
    const getFoodExpRes = await request('GET', '/api/expenses?category=food');
    assert(getFoodExpRes.status === 200, 'GET /api/expenses?category=food returns 200');
    assert(getFoodExpRes.body.data.length === 1, 'Category filter returns 1 food expense');
    assert(getFoodExpRes.body.data[0].id === expId1, 'Filtered expense ID matches');

    // Update Expense
    const updateExpRes = await request('PUT', `/api/expenses/${expId1}`, {
      amount: 500.00,
      category: 'food',
      note: 'Lunch + Dessert',
      datetime: nowIso,
      type: 'need'
    });
    assert(updateExpRes.status === 200, 'PUT /api/expenses/:id returns 200');
    assert(updateExpRes.body.data.amount === 500.00, 'Updated expense amount is 500.00');
    assert(updateExpRes.body.data.amountPaise === 50000, 'Updated expense integer paise is 50000');

    // ==========================================
    // 4. People / Debts API Tests
    // ==========================================
    console.log('\n[4] Testing People / Debts API...');
    // Create "borrowed" entry (I Owe Rajesh ₹1,500, repaid ₹500)
    const createPeopleRes1 = await request('POST', '/api/people', {
      type: 'borrowed',
      person: 'Rajesh',
      amount: 1500.00,
      repaidAmount: 500.00,
      date: nowIso,
      note: 'Emergency travel cash'
    });
    assert(createPeopleRes1.status === 201, 'POST /api/people (borrowed) returns 201');
    assert(createPeopleRes1.body.data.remaining === 1000.00, 'Remaining debt is ₹1,000.00');
    assert(createPeopleRes1.body.data.remainingPaise === 100000, 'Remaining paise is 100000');
    assert(createPeopleRes1.body.data.status === 'partial', 'Status is "partial"');
    const peopleId1 = createPeopleRes1.body.data.id;

    // Create "spent" entry (Priya owes me ₹3,000, 0 repaid)
    const createPeopleRes2 = await request('POST', '/api/people', {
      type: 'spent',
      person: 'Priya',
      amount: 3000.00,
      repaidAmount: 0,
      date: nowIso,
      note: 'Concert ticket booking'
    });
    assert(createPeopleRes2.status === 201, 'POST /api/people (spent) returns 201');
    assert(createPeopleRes2.body.data.status === 'pending', 'Status is "pending"');
    const peopleId2 = createPeopleRes2.body.data.id;

    // Update to Fully Paid
    const updatePeopleRes = await request('PUT', `/api/people/${peopleId2}`, {
      type: 'spent',
      person: 'Priya',
      amount: 3000.00,
      repaidAmount: 3000.00,
      date: nowIso,
      note: 'Concert ticket booking'
    });
    assert(updatePeopleRes.status === 200, 'PUT /api/people/:id returns 200');
    assert(updatePeopleRes.body.data.remaining === 0, 'Remaining after full payment is 0');
    assert(updatePeopleRes.body.data.status === 'paid', 'Status updated to "paid"');

    // ==========================================
    // 5. Dashboard Summary API Tests
    // ==========================================
    console.log('\n[5] Testing Dashboard Summary API...');
    const dashRes = await request('GET', '/api/dashboard');
    assert(dashRes.status === 200, 'GET /api/dashboard returns 200');
    
    // Total income: 50000.50 + 6000 = 56000.50
    assert(dashRes.body.data.totalIncome === 56000.50, `Dashboard totalIncome: ₹56,000.50`);
    
    // Total expenses: 500.00 + 2500.25 = 3000.25
    assert(dashRes.body.data.totalExpenses === 3000.25, `Dashboard totalExpenses: ₹3,000.25`);
    
    // Current balance: 56000.50 - 3000.25 = 53000.25
    assert(dashRes.body.data.currentBalance === 53000.25, `Dashboard currentBalance: ₹53,000.25`);
    assert(dashRes.body.data.currentBalancePaise === 5300025, `Dashboard currentBalancePaise: 5300025`);

    // Debts summary: I Owe: ₹1000, Owed to me: 0 (since Priya fully paid), Net: ₹1000 I Owe
    assert(dashRes.body.data.debts.totalIOwe === 1000.00, 'Dashboard debts totalIOwe is ₹1,000.00');
    assert(dashRes.body.data.debts.totalOwed === 0.00, 'Dashboard debts totalOwed is ₹0.00');

    // Categories breakdown
    assert(dashRes.body.data.categories.length === 2, 'Dashboard has 2 expense categories');

    // ==========================================
    // 6. Delete Endpoint Tests
    // ==========================================
    console.log('\n[6] Testing Delete Operations...');
    const delExp = await request('DELETE', `/api/expenses/${expId2}`);
    assert(delExp.status === 200, 'DELETE /api/expenses/:id returns 200');

    const delInc = await request('DELETE', `/api/income/${incomeId2}`);
    assert(delInc.status === 200, 'DELETE /api/income/:id returns 200');

    const delPeop = await request('DELETE', `/api/people/${peopleId2}`);
    assert(delPeop.status === 200, 'DELETE /api/people/:id returns 200');

    // Verify DB state after deletions
    const finalDashRes = await request('GET', '/api/dashboard');
    assert(finalDashRes.body.data.totalExpenses === 500.00, 'After delete, total expenses is ₹500.00');
    assert(finalDashRes.body.data.totalIncome === 50000.50, 'After delete, total income is ₹50,000.50');

    console.log('\n=============================================');
    console.log('  ALL BACKEND TESTS PASSED SUCCESSFULLY! (100%)');
    console.log('=============================================\n');

  } catch (err) {
    console.error('\n❌ TEST FAILED:', err);
    process.exitCode = 1;
  } finally {
    if (server) {
      server.close();
    }
    closeDb();
    if (fs.existsSync(TEST_DB_PATH)) {
      try { fs.unlinkSync(TEST_DB_PATH); } catch (e) {}
    }
  }
}

runTests();
