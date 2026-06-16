const request = require('supertest');
const express = require('express');
const fs = require('fs');
const path = require('path');

// Files
const usersFile = path.join(__dirname, '../data/users.json');
const carsFile = path.join(__dirname, '../data/cars.json');
const rentalsFile = path.join(__dirname, '../data/rentals.json');
const transactionsFile = path.join(__dirname, '../data/transactions.json');
const rentalTxnFile = path.join(__dirname, '../data/rental_transactions.json');

// Backups
const bu = (f) => f.replace('.json', '_ibak.json');

beforeAll(() => {
  [usersFile, carsFile, rentalsFile].forEach(f => fs.writeFileSync(bu(f), fs.readFileSync(f)));
  if (!fs.existsSync(transactionsFile)) fs.writeFileSync(transactionsFile, '[]');
  if (!fs.existsSync(rentalTxnFile)) fs.writeFileSync(rentalTxnFile, '[]');
  fs.writeFileSync(bu(transactionsFile), fs.readFileSync(transactionsFile));
  fs.writeFileSync(bu(rentalTxnFile), fs.readFileSync(rentalTxnFile));
});

afterAll(() => {
  [usersFile, carsFile, rentalsFile, transactionsFile, rentalTxnFile].forEach(f => {
    if (fs.existsSync(bu(f))) {
      fs.writeFileSync(f, fs.readFileSync(bu(f)));
      fs.unlinkSync(bu(f));
    }
  });
});

const app = express();
app.use(express.json());
app.use('/api/auth', require('../routes/auth'));
app.use('/api/cars', require('../routes/cars'));
app.use('/api/rentals', require('../routes/rentals'));

// ==================== INTEGRATION TESTS ====================
describe('INTEGRATION TESTS — Complete User Flows', () => {

  describe('IT-001: Complete Customer Signup → Login → Dashboard Flow', () => {
    let customerId, customerEmail;

    test('Step 1: Customer signs up successfully', async () => {
      customerEmail = `inttest_customer_${Date.now()}@gmail.com`;
      const res = await request(app).post('/api/auth/signup').send({
        name: 'Integration Customer',
        email: customerEmail,
        password: 'pass123',
        role: 'customer',
        phone: '03001234567',
        address: 'Test Address'
      });
      expect(res.statusCode).toBe(200);
      customerId = res.body.user.id;
      expect(customerId).toBeDefined();
    });

    test('Step 2: Customer logs in with correct credentials', async () => {
      const res = await request(app).post('/api/auth/login').send({
        email: customerEmail,
        password: 'pass123'
      });
      expect(res.statusCode).toBe(200);
      expect(res.body.user.role).toBe('customer');
    });

    test('Step 3: Customer can view all available cars', async () => {
      const res = await request(app).get('/api/cars');
      expect(res.statusCode).toBe(200);
      expect(Array.isArray(res.body)).toBe(true);
    });

    test('Step 4: Customer can view all rental agencies', async () => {
      const res = await request(app).get('/api/auth/agencies');
      expect(res.statusCode).toBe(200);
      expect(Array.isArray(res.body)).toBe(true);
    });

  });

  describe('IT-002: Complete Dealer Signup → Login → Car Management Flow', () => {
    let dealerId, dealerEmail, addedCarId;

    test('Step 1: Dealer signs up as Toyota dealer', async () => {
      dealerEmail = `inttest_dealer_${Date.now()}@gmail.com`;
      const res = await request(app).post('/api/auth/signup').send({
        name: 'Integration Dealer',
        email: dealerEmail,
        password: 'dealer123',
        role: 'dealer',
        phone: '03009876543',
        brandName: 'Toyota',
        address: 'Dealer Address'
      });
      expect(res.statusCode).toBe(200);
      dealerId = res.body.user.id;
      expect(res.body.user.brandName).toBe('Toyota');
    });

    test('Step 2: Dealer logs in successfully', async () => {
      const res = await request(app).post('/api/auth/login').send({
        email: dealerEmail,
        password: 'dealer123'
      });
      expect(res.statusCode).toBe(200);
      expect(res.body.user.role).toBe('dealer');
    });

    test('Step 3: Dealer can see their cars (empty initially)', async () => {
      const res = await request(app).get(`/api/cars/seller/${dealerId}`);
      expect(res.statusCode).toBe(200);
      expect(Array.isArray(res.body)).toBe(true);
    });

    test('Step 4: Dealer appears in dealers list', async () => {
      const res = await request(app).get('/api/auth/dealers');
      expect(res.statusCode).toBe(200);
      const found = res.body.find(d => d.id === dealerId);
      expect(found).toBeDefined();
      expect(found.brandName).toBe('Toyota');
    });

  });

  describe('IT-003: Complete Purchase Flow — Customer buys → Dealer confirms → Transaction ID', () => {
    let buyerId, sellerId, availableCarId, transactionId;

    test('Step 1: Setup — find an available car', async () => {
      const res = await request(app).get('/api/cars');
      const available = res.body.find(c => c.status === 'available');
      expect(available).toBeDefined();
      availableCarId = available.id;
      sellerId = available.sellerId;
    });

    test('Step 2: Customer sends purchase request', async () => {
      const signupRes = await request(app).post('/api/auth/signup').send({
        name: 'Purchase Test Buyer',
        email: `buyer_${Date.now()}@gmail.com`,
        password: 'buyer123',
        role: 'customer',
        phone: '03001111111',
        address: 'Buyer Address'
      });
      buyerId = signupRes.body.user.id;

      const res = await request(app)
        .post(`/api/cars/buy/${availableCarId}`)
        .send({
          buyerId,
          buyerName: 'Purchase Test Buyer',
          buyerPhone: '03001111111'
        });
      expect(res.statusCode).toBe(200);
      expect(res.body.car.status).toBe('pending');
      expect(res.body.car.buyerId).toBe(buyerId);
    });

    test('Step 3: Car status is now pending', async () => {
      const res = await request(app).get('/api/cars');
      const car = res.body.find(c => c.id === availableCarId);
      expect(car.status).toBe('pending');
    });

    test('Step 4: Dealer confirms the sale', async () => {
      const res = await request(app).post(`/api/cars/confirm/${availableCarId}`);
      expect(res.statusCode).toBe(200);
      expect(res.body.car.status).toBe('sold');
      expect(res.body.transactionId).toMatch(/^AH-/);
      transactionId = res.body.transactionId;
    });

    test('Step 5: Transaction ID is accessible by customer', async () => {
      const res = await request(app).get(`/api/cars/check-transaction/${availableCarId}`);
      expect(res.statusCode).toBe(200);
      expect(res.body.status).toBe('sold');
      expect(res.body.transactionId).toBe(transactionId);
    });

    test('Step 6: Transaction is recorded in transactions list', async () => {
        const res = await request(app).get('/api/cars');
        const soldCar = res.body.find(c => c.id === availableCarId);
        const actualSellerId = soldCar?.sellerId;
        const txnRes = await request(app).get(`/api/cars/transactions/${actualSellerId}`);
        expect(txnRes.statusCode).toBe(200);
        const txn = txnRes.body.find(t => t.id === transactionId);
        expect(txn).toBeDefined();
        expect(txn.buyerName).toBe('Purchase Test Buyer');
    });

  describe('IT-004: Complete Rental Flow — Customer rents → Agency confirms → Transaction ID', () => {
    let renterId, agencyId, rentalCarId, rentalTxnId;

    test('Step 1: Setup — find an available rental car', async () => {
      const res = await request(app).get('/api/rentals');
      const available = res.body.find(r => r.status === 'available');
      expect(available).toBeDefined();
      rentalCarId = available.id;
      agencyId = available.agencyId;
    });

    test('Step 2: Customer sends rental request', async () => {
      const signupRes = await request(app).post('/api/auth/signup').send({
        name: 'Rental Test Customer',
        email: `renter_${Date.now()}@gmail.com`,
        password: 'renter123',
        role: 'customer',
        phone: '03002222222',
        address: 'Renter Address'
      });
      renterId = signupRes.body.user.id;

      const res = await request(app)
        .post(`/api/rentals/rent/${rentalCarId}`)
        .send({
          renterId,
          renterName: 'Rental Test Customer',
          renterPhone: '03002222222',
          days: '3'
        });
      expect(res.statusCode).toBe(200);
      expect(res.body.car.status).toBe('pending');
      expect(res.body.car.days).toBe('3');
    });

    test('Step 3: Agency confirms the rental', async () => {
      const res = await request(app).post(`/api/rentals/confirm/${rentalCarId}`);
      expect(res.statusCode).toBe(200);
      expect(res.body.car.status).toBe('rented');
      expect(res.body.transactionId).toMatch(/^AHR-/);
      rentalTxnId = res.body.transactionId;
    });

    test('Step 4: Rental transaction ID accessible by customer', async () => {
      const res = await request(app).get(`/api/rentals/check-transaction/${rentalCarId}`);
      expect(res.statusCode).toBe(200);
      expect(res.body.transactionId).toBe(rentalTxnId);
    });

    test('Step 5: Agency can mark car as available after return', async () => {
      const res = await request(app).post(`/api/rentals/return/${rentalCarId}`);
      expect(res.statusCode).toBe(200);
      expect(res.body.car.status).toBe('available');
    });

    test('Step 6: Rental transaction recorded in agency bookings', async () => {
      const res = await request(app).get(`/api/rentals/transactions/${agencyId}`);
      expect(res.statusCode).toBe(200);
      const txn = res.body.find(t => t.id === rentalTxnId);
      expect(txn).toBeDefined();
      expect(Number(txn.totalAmount)).toBeGreaterThan(0);
    });

  });

  describe('IT-005: Rental Agency Signup → Login → Fleet Management', () => {
    let agencyId, agencyEmail;

    test('Step 1: Rental agency signs up', async () => {
      agencyEmail = `agency_${Date.now()}@gmail.com`;
      const res = await request(app).post('/api/auth/signup').send({
        name: 'Integration Agency',
        email: agencyEmail,
        password: 'agency123',
        role: 'rental',
        phone: '03003333333',
        cnic: '42201-1234567-8',
        agencyName: 'Integration Rent a Car',
        address: 'Agency Location'
      });
      expect(res.statusCode).toBe(200);
      agencyId = res.body.user.id;
      expect(res.body.user.agencyName).toBe('Integration Rent a Car');
    });

    test('Step 2: Agency logs in', async () => {
      const res = await request(app).post('/api/auth/login').send({
        email: agencyEmail,
        password: 'agency123'
      });
      expect(res.statusCode).toBe(200);
      expect(res.body.user.role).toBe('rental');
    });

    test('Step 3: Agency appears in agencies list', async () => {
      const res = await request(app).get('/api/auth/agencies');
      const found = res.body.find(a => a.id === agencyId);
      expect(found).toBeDefined();
      expect(found.agencyName).toBe('Integration Rent a Car');
    });

  });

});