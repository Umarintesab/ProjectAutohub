const express = require('express');
const router = express.Router();
const fs = require('fs');
const path = require('path');
const multer = require('multer');

const carsFile = path.join(__dirname, '../data/cars.json');
const transactionsFile = path.join(__dirname, '../data/transactions.json');

// ✅ Improved with error handling
const getCars = () => {
  try {
    if (!fs.existsSync(carsFile)) {
      fs.writeFileSync(carsFile, JSON.stringify([], null, 2));
      return [];
    }
    return JSON.parse(fs.readFileSync(carsFile));
  } catch (error) {
    console.error('Error reading cars:', error);
    return [];
  }
};

const saveCars = (cars) => {
  try {
    fs.writeFileSync(carsFile, JSON.stringify(cars, null, 2));
  } catch (error) {
    console.error('Error saving cars:', error);
  }
};

const getTransactions = () => {
  try {
    if (!fs.existsSync(transactionsFile)) {
      fs.writeFileSync(transactionsFile, JSON.stringify([], null, 2));
      return [];
    }
    return JSON.parse(fs.readFileSync(transactionsFile));
  } catch (error) {
    console.error('Error reading transactions:', error);
    return [];
  }
};

const saveTransactions = (t) => {
  try {
    fs.writeFileSync(transactionsFile, JSON.stringify(t, null, 2));
  } catch (error) {
    console.error('Error saving transactions:', error);
  }
};

// ✅ Configure multer for Railway
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    const uploadDir = path.join(__dirname, '../uploads');
    if (!fs.existsSync(uploadDir)) {
      fs.mkdirSync(uploadDir, { recursive: true });
    }
    cb(null, uploadDir);
  },
  filename: (req, file, cb) => {
    const uniqueName = Date.now() + '-' + file.originalname.replace(/\s/g, '_');
    cb(null, uniqueName);
  }
});

const fileFilter = (req, file, cb) => {
  const allowedTypes = ['image/jpeg', 'image/png', 'image/webp', 'image/jpg'];
  if (allowedTypes.includes(file.mimetype)) {
    cb(null, true);
  } else {
    cb(new Error('Only JPEG, PNG, and WEBP images are allowed'), false);
  }
};

const upload = multer({ 
  storage,
  fileFilter,
  limits: {
    fileSize: 5 * 1024 * 1024, // 5MB limit
    files: 4 // Max 4 images
  }
});

// GET ALL CARS
router.get('/', (req, res) => {
  try {
    const cars = getCars();
    res.json(cars);
  } catch (error) {
    console.error('Error fetching cars:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// GET CARS BY SELLER
router.get('/seller/:sellerId', (req, res) => {
  try {
    const cars = getCars();
    const sellerCars = cars.filter(c => c.sellerId === req.params.sellerId);
    res.json(sellerCars);
  } catch (error) {
    console.error('Error fetching seller cars:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// GET SINGLE CAR
router.get('/:id', (req, res) => {
  try {
    const cars = getCars();
    const car = cars.find(c => c.id === req.params.id);
    if (!car) {
      return res.status(404).json({ message: 'Car not found' });
    }
    res.json(car);
  } catch (error) {
    console.error('Error fetching car:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// ADD CAR
router.post('/add', upload.array('images', 4), (req, res) => {
  try {
    const cars = getCars();
    const images = req.files ? req.files.map(f => f.filename) : [];
    
    // ✅ Validate required fields
    const { brand, model, year, price, sellerId, sellerName, sellerPhone } = req.body;
    if (!brand || !model || !year || !price || !sellerId) {
      return res.status(400).json({ 
        message: 'Brand, model, year, price, and sellerId are required' 
      });
    }

    const newCar = {
      id: Date.now().toString(),
      brand,
      model,
      year,
      price: price.toString(),
      sellerId,
      sellerName: sellerName || '',
      sellerPhone: sellerPhone || '',
      images,
      description: req.body.description || '',
      status: 'available',
      createdAt: new Date().toISOString()
    };
    
    cars.push(newCar);
    saveCars(cars);
    res.status(201).json({ message: 'Car added successfully', car: newCar });
  } catch (error) {
    console.error('Error adding car:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// DELETE CAR
router.delete('/:id', (req, res) => {
  try {
    let cars = getCars();
    const carExists = cars.some(c => c.id === req.params.id);
    if (!carExists) {
      return res.status(404).json({ message: 'Car not found' });
    }
    cars = cars.filter(c => c.id !== req.params.id);
    saveCars(cars);
    res.json({ message: 'Car deleted successfully' });
  } catch (error) {
    console.error('Error deleting car:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// BUY CAR — customer request
router.post('/buy/:id', (req, res) => {
  try {
    let cars = getCars();
    const car = cars.find(c => c.id === req.params.id);
    if (!car) {
      return res.status(404).json({ message: 'Car not found' });
    }
    if (car.status !== 'available') {
      return res.status(400).json({ message: 'Car is not available for purchase' });
    }
    
    const { buyerId, buyerName, buyerPhone } = req.body;
    if (!buyerId || !buyerName || !buyerPhone) {
      return res.status(400).json({ 
        message: 'Buyer ID, name, and phone are required' 
      });
    }
    
    car.status = 'pending';
    car.buyerId = buyerId;
    car.buyerName = buyerName;
    car.buyerPhone = buyerPhone;
    car.buyRequestedAt = new Date().toISOString();
    car.transactionId = null;
    saveCars(cars);
    
    res.json({ message: 'Purchase request sent successfully', car });
  } catch (error) {
    console.error('Error processing buy request:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// CONFIRM SALE — dealer confirms
router.post('/confirm/:id', (req, res) => {
  try {
    let cars = getCars();
    const car = cars.find(c => c.id === req.params.id);
    if (!car) {
      return res.status(404).json({ message: 'Car not found' });
    }
    if (car.status !== 'pending') {
      return res.status(400).json({ message: 'Car is not pending confirmation' });
    }

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
      year: car.year,
      price: car.price,
      sellerId: car.sellerId,
      sellerName: car.sellerName,
      buyerId: car.buyerId,
      buyerName: car.buyerName,
      buyerPhone: car.buyerPhone,
      type: 'sale',
      confirmedAt: car.confirmedAt
    });
    saveTransactions(transactions);

    res.json({ 
      message: 'Sale confirmed successfully', 
      car, 
      transactionId 
    });
  } catch (error) {
    console.error('Error confirming sale:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// GET TRANSACTIONS BY SELLER
router.get('/transactions/:sellerId', (req, res) => {
  try {
    const transactions = getTransactions();
    const sellerTransactions = transactions.filter(t => t.sellerId === req.params.sellerId);
    res.json(sellerTransactions);
  } catch (error) {
    console.error('Error fetching transactions:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// GET BUYER TRANSACTIONS
router.get('/buyer-transactions/:buyerId', (req, res) => {
  try {
    const transactions = getTransactions();
    const buyerTransactions = transactions.filter(t => t.buyerId === req.params.buyerId);
    res.json(buyerTransactions);
  } catch (error) {
    console.error('Error fetching buyer transactions:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// CHECK TRANSACTION STATUS FOR CUSTOMER
router.get('/check-transaction/:carId', (req, res) => {
  try {
    const cars = getCars();
    const car = cars.find(c => c.id === req.params.carId);
    if (!car) {
      return res.status(404).json({ message: 'Car not found' });
    }
    res.json({ 
      status: car.status, 
      transactionId: car.transactionId || null,
      buyerId: car.buyerId || null,
      confirmedAt: car.confirmedAt || null
    });
  } catch (error) {
    console.error('Error checking transaction:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

module.exports = router;