const request = require('supertest');
const express = require('express');
const fs = require('fs');
const path = require('path');
const multer = require('multer');

const carsFile = path.join(__dirname, '../data/cars.json');
const transactionsFile = path.join(__dirname, '../data/transactions.json');
const backupCars = path.join(__dirname, '../data/cars_backup.json');
const backupTxn = path.join(__dirname, '../data/transactions_backup.json');

beforeAll(() => {
  fs.writeFileSync(backupCars, fs.readFileSync(carsFile));
  if (fs.existsSync(transactionsFile)) {
    fs.writeFileSync(backupTxn, fs.readFileSync(transactionsFile));
  } else {
    fs.writeFileSync(transactionsFile, '[]');
    fs.writeFileSync(backupTxn, '[]');
  }
});

afterAll(() => {
  fs.writeFileSync(carsFile, fs.readFileSync(backupCars));
  fs.writeFileSync(transactionsFile, fs.readFileSync(backupTxn));
  fs.unlinkSync(backupCars);
  fs.unlinkSync(backupTxn);
});

const app = express();
app.use(express.json());
const carRoutes = require('../routes/cars');
app.use('/api/cars', carRoutes);

let testCarId = null;

// ==================== UNIT TESTS ====================
describe('UNIT TESTS — Cars Routes', () => {

  describe('GET /api/cars', () => {

    test('UT-012: Should return all cars as array', async () => {
      const res = await request(app).get('/api/cars');
      expect(res.statusCode).toBe(200);
      expect(Array.isArray(res.body)).toBe(true);
    });

    test('UT-013: Each car should have required fields', async () => {
      const res = await request(app).get('/api/cars');
      res.body.forEach(car => {
        expect(car).toHaveProperty('id');
        expect(car).toHaveProperty('brand');
        expect(car).toHaveProperty('model');
        expect(car).toHaveProperty('status');
      });
    });

  });

  describe('GET /api/cars/seller/:sellerId', () => {

    test('UT-014: Should return cars filtered by seller ID', async () => {
      const allRes = await request(app).get('/api/cars');
      const allCars = allRes.body;
      if (allCars.length > 0) {
        const sellerId = allCars[0].sellerId;
        const res = await request(app).get(`/api/cars/seller/${sellerId}`);
        expect(res.statusCode).toBe(200);
        expect(Array.isArray(res.body)).toBe(true);
        res.body.forEach(car => {
          expect(car.sellerId).toBe(sellerId);
        });
      }
    });

    test('UT-015: Should return empty array for non-existent seller', async () => {
      const res = await request(app).get('/api/cars/seller/nonexistentid999');
      expect(res.statusCode).toBe(200);
      expect(res.body).toHaveLength(0);
    });

  });

  describe('POST /api/cars/buy/:id', () => {

    test('UT-016: Should send purchase request and change status to pending', async () => {
      const allRes = await request(app).get('/api/cars');
      const availableCar = allRes.body.find(c => c.status === 'available');
      if (availableCar) {
        testCarId = availableCar.id;
        const res = await request(app)
          .post(`/api/cars/buy/${availableCar.id}`)
          .send({
            buyerId: 'testbuyer123',
            buyerName: 'Test Buyer',
            buyerPhone: '03001234567'
          });
        expect(res.statusCode).toBe(200);
        expect(res.body.car.status).toBe('pending');
        expect(res.body.car.buyerName).toBe('Test Buyer');
      }
    });

    test('UT-017: Should return 404 for non-existent car', async () => {
      const res = await request(app)
        .post('/api/cars/buy/nonexistentcar999')
        .send({
          buyerId: 'buyer1',
          buyerName: 'Test',
          buyerPhone: '03001111111'
        });
      expect(res.statusCode).toBe(404);
    });

  });

  describe('POST /api/cars/confirm/:id', () => {

    test('UT-018: Should confirm sale and generate transaction ID', async () => {
      if (testCarId) {
        const res = await request(app).post(`/api/cars/confirm/${testCarId}`);
        expect(res.statusCode).toBe(200);
        expect(res.body.car.status).toBe('sold');
        expect(res.body.transactionId).toBeDefined();
        expect(res.body.transactionId).toMatch(/^AH-/);
      }
    });

  });

  describe('GET /api/cars/check-transaction/:carId', () => {

    test('UT-019: Should return transaction status for a car', async () => {
      if (testCarId) {
        const res = await request(app).get(`/api/cars/check-transaction/${testCarId}`);
        expect(res.statusCode).toBe(200);
        expect(res.body).toHaveProperty('status');
        expect(res.body).toHaveProperty('transactionId');
      }
    });

    test('UT-020: Should return 404 for non-existent car', async () => {
      const res = await request(app).get('/api/cars/check-transaction/nonexistent999');
      expect(res.statusCode).toBe(404);
    });

  });

});