const express = require('express');
const router = express.Router();
const fs = require('fs');
const path = require('path');
const multer = require('multer');

const rentalsFile = path.join(__dirname, '../data/rentals.json');
const rentalTransactionsFile = path.join(__dirname, '../data/rental_transactions.json');

const getRentals = () => JSON.parse(fs.readFileSync(rentalsFile));
const saveRentals = (r) => fs.writeFileSync(rentalsFile, JSON.stringify(r, null, 2));

const getRentalTransactions = () => {
  if (!fs.existsSync(rentalTransactionsFile)) fs.writeFileSync(rentalTransactionsFile, '[]');
  return JSON.parse(fs.readFileSync(rentalTransactionsFile));
};
const saveRentalTransactions = (t) => fs.writeFileSync(rentalTransactionsFile, JSON.stringify(t, null, 2));

const storage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, path.join(__dirname, '../uploads')),
  filename: (req, file, cb) => cb(null, Date.now() + '-' + file.originalname)
});
const upload = multer({ storage });

// GET ALL RENTALS
router.get('/', (req, res) => {
  res.json(getRentals());
});

// GET BY AGENCY
router.get('/agency/:agencyId', (req, res) => {
  const rentals = getRentals();
  res.json(rentals.filter(r => r.agencyId === req.params.agencyId));
});

// ADD RENTAL CAR
router.post('/add', upload.array('images', 2), (req, res) => {
  const rentals = getRentals();
  const images = req.files.map(f => f.filename);
  const newCar = {
    id: Date.now().toString(),
    ...req.body,
    images,
    status: 'available'
  };
  rentals.push(newCar);
  saveRentals(rentals);
  res.json({ message: 'Rental car added', car: newCar });
});

// DELETE RENTAL CAR
router.delete('/:id', (req, res) => {
  let rentals = getRentals();
  rentals = rentals.filter(r => r.id !== req.params.id);
  saveRentals(rentals);
  res.json({ message: 'Deleted' });
});

// RENT A CAR — customer request, no transaction ID yet
router.post('/rent/:id', (req, res) => {
  let rentals = getRentals();
  const car = rentals.find(r => r.id === req.params.id);
  if (!car) return res.status(404).json({ message: 'Not found' });
  car.status = 'pending';
  car.renterId = req.body.renterId;
  car.renterName = req.body.renterName;
  car.renterPhone = req.body.renterPhone;
  car.days = req.body.days;
  car.transactionId = null;
  saveRentals(rentals);
  res.json({ message: 'Rental request sent', car });
});

// CONFIRM RENTAL — agency confirms, transaction ID generated
router.post('/confirm/:id', (req, res) => {
  let rentals = getRentals();
  const car = rentals.find(r => r.id === req.params.id);
  if (!car) return res.status(404).json({ message: 'Not found' });

  const transactionId = 'AHR-' + Date.now() + '-' + Math.floor(Math.random() * 9000 + 1000);
  car.status = 'rented';
  car.transactionId = transactionId;
  car.confirmedAt = new Date().toISOString();
  saveRentals(rentals);

  const totalAmount = Number(car.rentPerDay) * Number(car.days);
  const transactions = getRentalTransactions();
  transactions.push({
    id: transactionId,
    carId: car.id,
    brand: car.brand,
    model: car.model,
    rentPerDay: car.rentPerDay,
    days: car.days,
    totalAmount,
    agencyId: car.agencyId,
    renterId: car.renterId,
    renterName: car.renterName,
    renterPhone: car.renterPhone,
    type: 'rental',
    confirmedAt: car.confirmedAt
  });
  saveRentalTransactions(transactions);

  res.json({ message: 'Rental confirmed', car, transactionId });
});

// GET RENTAL TRANSACTIONS BY AGENCY
router.get('/transactions/:agencyId', (req, res) => {
  const transactions = getRentalTransactions();
  res.json(transactions.filter(t => t.agencyId === req.params.agencyId));
});

// CHECK RENTAL TRANSACTION STATUS FOR CUSTOMER
router.get('/check-transaction/:carId', (req, res) => {
  const rentals = getRentals();
  const car = rentals.find(r => r.id === req.params.carId);
  if (!car) return res.status(404).json({ message: 'Not found' });
  res.json({ status: car.status, transactionId: car.transactionId || null });
});

// MARK AVAILABLE AGAIN
router.post('/return/:id', (req, res) => {
  let rentals = getRentals();
  const car = rentals.find(r => r.id === req.params.id);
  if (!car) return res.status(404).json({ message: 'Not found' });
  car.status = 'available';
  delete car.renterId;
  delete car.renterName;
  delete car.renterPhone;
  delete car.days;
  delete car.transactionId;
  saveRentals(rentals);
  res.json({ message: 'Car marked available', car });
});

module.exports = router;