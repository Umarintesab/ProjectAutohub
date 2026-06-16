const express = require('express');
const router = express.Router();
const fs = require('fs');
const path = require('path');
const multer = require('multer');

const carsFile = path.join(__dirname, '../data/cars.json');
const transactionsFile = path.join(__dirname, '../data/transactions.json');

const getCars = () => JSON.parse(fs.readFileSync(carsFile));
const saveCars = (cars) => fs.writeFileSync(carsFile, JSON.stringify(cars, null, 2));

const getTransactions = () => {
  if (!fs.existsSync(transactionsFile)) fs.writeFileSync(transactionsFile, '[]');
  return JSON.parse(fs.readFileSync(transactionsFile));
};
const saveTransactions = (t) => fs.writeFileSync(transactionsFile, JSON.stringify(t, null, 2));

const storage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, path.join(__dirname, '../uploads')),
  filename: (req, file, cb) => cb(null, Date.now() + '-' + file.originalname)
});
const upload = multer({ storage });

// GET ALL CARS
router.get('/', (req, res) => {
  const cars = getCars();
  res.json(cars);
});

// GET CARS BY SELLER
router.get('/seller/:sellerId', (req, res) => {
  const cars = getCars();
  res.json(cars.filter(c => c.sellerId === req.params.sellerId));
});

// ADD CAR
router.post('/add', upload.array('images', 4), (req, res) => {
  const cars = getCars();
  const images = req.files.map(f => f.filename);
  const newCar = {
    id: Date.now().toString(),
    ...req.body,
    price: req.body.price ? req.body.price.toString() : '0',
    images,
    status: 'available'
  };
  cars.push(newCar);
  saveCars(cars);
  res.json({ message: 'Car added', car: newCar });
});

// DELETE CAR
router.delete('/:id', (req, res) => {
  let cars = getCars();
  cars = cars.filter(c => c.id !== req.params.id);
  saveCars(cars);
  res.json({ message: 'Car deleted' });
});

// BUY CAR — customer request, no transaction ID yet
router.post('/buy/:id', (req, res) => {
  let cars = getCars();
  const car = cars.find(c => c.id === req.params.id);
  if (!car) return res.status(404).json({ message: 'Car not found' });
  car.status = 'pending';
  car.buyerId = req.body.buyerId;
  car.buyerName = req.body.buyerName;
  car.buyerPhone = req.body.buyerPhone;
  car.transactionId = null; // not generated yet
  saveCars(cars);
  res.json({ message: 'Purchase request sent', car });
});

// CONFIRM SALE — dealer confirms, transaction ID generated
router.post('/confirm/:id', (req, res) => {
  let cars = getCars();
  const car = cars.find(c => c.id === req.params.id);
  if (!car) return res.status(404).json({ message: 'Car not found' });

  const transactionId = 'AH-' + Date.now() + '-' + Math.floor(Math.random() * 9000 + 1000);
  car.status = 'sold';
  car.transactionId = transactionId;
  car.confirmedAt = new Date().toISOString();
  saveCars(cars);

  // Save to transactions
  const transactions = getTransactions();
  transactions.push({
    id: transactionId,
    carId: car.id,
    brand: car.brand,
    model: car.model,
    price: car.price,
    sellerId: car.sellerId,
    buyerId: car.buyerId,
    buyerName: car.buyerName,
    buyerPhone: car.buyerPhone,
    type: 'sale',
    confirmedAt: car.confirmedAt
  });
  saveTransactions(transactions);

  res.json({ message: 'Sale confirmed', car, transactionId });
});

// GET TRANSACTIONS BY SELLER
router.get('/transactions/:sellerId', (req, res) => {
  const transactions = getTransactions();
  res.json(transactions.filter(t => t.sellerId === req.params.sellerId));
});

// CHECK TRANSACTION STATUS FOR CUSTOMER
router.get('/check-transaction/:carId', (req, res) => {
  const cars = getCars();
  const car = cars.find(c => c.id === req.params.carId);
  if (!car) return res.status(404).json({ message: 'Not found' });
  res.json({ status: car.status, transactionId: car.transactionId || null });
});

module.exports = router;