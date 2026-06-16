const request = require('supertest');
const express = require('express');
const fs = require('fs');
const path = require('path');

const rentalsFile = path.join(__dirname, '../data/rentals.json');
const rentalTxnFile = path.join(__dirname, '../data/rental_transactions.json');
const backupRentals = path.join(__dirname, '../data/rentals_backup.json');
const backupRentalTxn = path.join(__dirname, '../data/rental_transactions_backup.json');

beforeAll(() => {
  fs.writeFileSync(backupRentals, fs.readFileSync(rentalsFile));
  if (fs.existsSync(rentalTxnFile)) {
    fs.writeFileSync(backupRentalTxn, fs.readFileSync(rentalTxnFile));
  } else {
    fs.writeFileSync(rentalTxnFile, '[]');
    fs.writeFileSync(backupRentalTxn, '[]');
  }
});

afterAll(() => {
  fs.writeFileSync(rentalsFile, fs.readFileSync(backupRentals));
  fs.writeFileSync(rentalTxnFile, fs.readFileSync(backupRentalTxn));
  fs.unlinkSync(backupRentals);
  fs.unlinkSync(backupRentalTxn);
});

const app = express();
app.use(express.json());
const rentalRoutes = require('../routes/rentals');
app.use('/api/rentals', rentalRoutes);

let testRentalId = null;

// ==================== UNIT TESTS ====================
describe('UNIT TESTS — Rentals Routes', () => {

  describe('GET /api/rentals', () => {

    test('UT-021: Should return all rental cars as array', async () => {
      const res = await request(app).get('/api/rentals');
      expect(res.statusCode).toBe(200);
      expect(Array.isArray(res.body)).toBe(true);
    });

    test('UT-022: Each rental car should have required pricing fields', async () => {
      const res = await request(app).get('/api/rentals');
      res.body.forEach(car => {
        expect(car).toHaveProperty('id');
        expect(car).toHaveProperty('brand');
        expect(car).toHaveProperty('model');
        expect(car).toHaveProperty('rentPerDay');
        expect(car).toHaveProperty('status');
      });
    });

  });

  describe('GET /api/rentals/agency/:agencyId', () => {

    test('UT-023: Should return cars filtered by agency ID', async () => {
      const allRes = await request(app).get('/api/rentals');
      const allRentals = allRes.body;
      if (allRentals.length > 0) {
        const agencyId = allRentals[0].agencyId;
        const res = await request(app).get(`/api/rentals/agency/${agencyId}`);
        expect(res.statusCode).toBe(200);
        res.body.forEach(car => {
          expect(car.agencyId).toBe(agencyId);
        });
      }
    });

    test('UT-024: Should return empty array for non-existent agency', async () => {
      const res = await request(app).get('/api/rentals/agency/nonexistentagency999');
      expect(res.statusCode).toBe(200);
      expect(res.body).toHaveLength(0);
    });

  });

  describe('POST /api/rentals/rent/:id', () => {

    test('UT-025: Should send rental request and change status to pending', async () => {
      const allRes = await request(app).get('/api/rentals');
      const availableCar = allRes.body.find(c => c.status === 'available');
      if (availableCar) {
        testRentalId = availableCar.id;
        const res = await request(app)
          .post(`/api/rentals/rent/${availableCar.id}`)
          .send({
            renterId: 'testrenter123',
            renterName: 'Test Renter',
            renterPhone: '03009998877',
            days: '3'
          });
        expect(res.statusCode).toBe(200);
        expect(res.body.car.status).toBe('pending');
        expect(res.body.car.renterName).toBe('Test Renter');
        expect(res.body.car.days).toBe('3');
      }
    });

    test('UT-026: Should return 404 for non-existent rental car', async () => {
      const res = await request(app)
        .post('/api/rentals/rent/nonexistent999')
        .send({
          renterId: 'renter1',
          renterName: 'Test',
          renterPhone: '03001111111',
          days: '2'
        });
      expect(res.statusCode).toBe(404);
    });

  });

  describe('POST /api/rentals/confirm/:id', () => {

    test('UT-027: Should confirm rental and generate transaction ID', async () => {
      if (testRentalId) {
        const res = await request(app).post(`/api/rentals/confirm/${testRentalId}`);
        expect(res.statusCode).toBe(200);
        expect(res.body.car.status).toBe('rented');
        expect(res.body.transactionId).toBeDefined();
        expect(res.body.transactionId).toMatch(/^AHR-/);
      }
    });

  });

  describe('POST /api/rentals/return/:id', () => {

    test('UT-028: Should mark rented car as available again', async () => {
      if (testRentalId) {
        const res = await request(app).post(`/api/rentals/return/${testRentalId}`);
        expect(res.statusCode).toBe(200);
        expect(res.body.car.status).toBe('available');
      }
    });

  });

  describe('GET /api/rentals/check-transaction/:carId', () => {

    test('UT-029: Should return transaction status for rental car', async () => {
      if (testRentalId) {
        const res = await request(app).get(`/api/rentals/check-transaction/${testRentalId}`);
        expect(res.statusCode).toBe(200);
        expect(res.body).toHaveProperty('status');
        expect(res.body).toHaveProperty('transactionId');
      }
    });

  });

});