const request = require('supertest');
const express = require('express');
const fs = require('fs');
const path = require('path');

// Setup test environment
const usersFile = path.join(__dirname, '../data/users.json');
const backupFile = path.join(__dirname, '../data/users_backup.json');

// Backup original data
beforeAll(() => {
  const data = fs.readFileSync(usersFile);
  fs.writeFileSync(backupFile, data);
});

// Restore original data after all tests
afterAll(() => {
  const backup = fs.readFileSync(backupFile);
  fs.writeFileSync(usersFile, backup);
  fs.unlinkSync(backupFile);
});

const app = express();
app.use(express.json());
const authRoutes = require('../routes/auth');
app.use('/api/auth', authRoutes);

// ==================== UNIT TESTS ====================
describe('UNIT TESTS — Auth Routes', () => {

  describe('POST /api/auth/signup', () => {

    test('UT-001: Should create a new customer account successfully', async () => {
      const res = await request(app).post('/api/auth/signup').send({
        name: 'Test Customer',
        email: 'testcustomer_unit@gmail.com',
        password: '123456',
        role: 'customer',
        phone: '03001234567',
        cnic: '',
        brandName: '',
        agencyName: '',
        address: 'House 1, Street 1, Area, City, Pakistan'
      });
      expect(res.statusCode).toBe(200);
      expect(res.body.message).toBe('Signup successful');
      expect(res.body.user).toHaveProperty('id');
      expect(res.body.user.role).toBe('customer');
    });

    test('UT-002: Should create a new dealer account successfully', async () => {
      const res = await request(app).post('/api/auth/signup').send({
        name: 'Test Dealer',
        email: 'testdealer_unit@gmail.com',
        password: '123456',
        role: 'dealer',
        phone: '03009876543',
        cnic: '',
        brandName: 'Toyota',
        agencyName: '',
        address: 'House 5, Street 2, DHA, Karachi, Pakistan'
      });
      expect(res.statusCode).toBe(200);
      expect(res.body.user.role).toBe('dealer');
      expect(res.body.user.brandName).toBe('Toyota');
    });

    test('UT-003: Should reject duplicate email', async () => {
      await request(app).post('/api/auth/signup').send({
        name: 'Duplicate User',
        email: 'duplicate_unit@gmail.com',
        password: '123',
        role: 'customer',
        phone: '03001111111',
        address: 'Test Address'
      });
      const res = await request(app).post('/api/auth/signup').send({
        name: 'Duplicate User 2',
        email: 'duplicate_unit@gmail.com',
        password: '456',
        role: 'customer',
        phone: '03002222222',
        address: 'Test Address'
      });
      expect(res.statusCode).toBe(400);
      expect(res.body.message).toBe('Email already exists');
    });

    test('UT-004: Should create rental agency account', async () => {
      const res = await request(app).post('/api/auth/signup').send({
        name: 'Test Agency',
        email: 'testagency_unit@gmail.com',
        password: '123456',
        role: 'rental',
        phone: '03003334455',
        cnic: '42201-1234567-8',
        agencyName: 'Test Rent a Car',
        address: 'House 10, Street 5, Gulshan, Karachi, Pakistan'
      });
      expect(res.statusCode).toBe(200);
      expect(res.body.user.agencyName).toBe('Test Rent a Car');
    });

    test('UT-005: Should create used car seller account', async () => {
      const res = await request(app).post('/api/auth/signup').send({
        name: 'Test Seller',
        email: 'testseller_unit@gmail.com',
        password: '123456',
        role: 'usedcar',
        phone: '03005556677',
        cnic: '42201-7654321-2',
        address: 'House 20, Street 8, PECHS, Karachi, Pakistan'
      });
      expect(res.statusCode).toBe(200);
      expect(res.body.user.role).toBe('usedcar');
    });

  });

  describe('POST /api/auth/login', () => {

    test('UT-006: Should login successfully with correct credentials', async () => {
      await request(app).post('/api/auth/signup').send({
        name: 'Login Test User',
        email: 'logintest_unit@gmail.com',
        password: 'mypassword',
        role: 'customer',
        phone: '03007778899',
        address: 'Test Address'
      });
      const res = await request(app).post('/api/auth/login').send({
        email: 'logintest_unit@gmail.com',
        password: 'mypassword'
      });
      expect(res.statusCode).toBe(200);
      expect(res.body.message).toBe('Login successful');
      expect(res.body.user).toHaveProperty('id');
    });

    test('UT-007: Should reject wrong password', async () => {
      const res = await request(app).post('/api/auth/login').send({
        email: 'logintest_unit@gmail.com',
        password: 'wrongpassword'
      });
      expect(res.statusCode).toBe(400);
      expect(res.body.message).toBe('Invalid credentials');
    });

    test('UT-008: Should reject non-existent email', async () => {
      const res = await request(app).post('/api/auth/login').send({
        email: 'nonexistent@gmail.com',
        password: 'anypassword'
      });
      expect(res.statusCode).toBe(400);
      expect(res.body.message).toBe('Invalid credentials');
    });

  });

  describe('GET /api/auth/dealers', () => {

    test('UT-009: Should return list of all dealers', async () => {
      const res = await request(app).get('/api/auth/dealers');
      expect(res.statusCode).toBe(200);
      expect(Array.isArray(res.body)).toBe(true);
      res.body.forEach(dealer => {
        expect(dealer.role).toBe('dealer');
      });
    });

  });

  describe('GET /api/auth/agencies', () => {

    test('UT-010: Should return list of all rental agencies', async () => {
      const res = await request(app).get('/api/auth/agencies');
      expect(res.statusCode).toBe(200);
      expect(Array.isArray(res.body)).toBe(true);
      res.body.forEach(agency => {
        expect(agency.role).toBe('rental');
      });
    });

  });

  describe('GET /api/auth/usedcarsellers', () => {

    test('UT-011: Should return list of all used car sellers', async () => {
      const res = await request(app).get('/api/auth/usedcarsellers');
      expect(res.statusCode).toBe(200);
      expect(Array.isArray(res.body)).toBe(true);
      res.body.forEach(seller => {
        expect(seller.role).toBe('usedcar');
      });
    });

  });

});