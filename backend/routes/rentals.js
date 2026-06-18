const express = require('express');
const router = express.Router();
const fs = require('fs');
const path = require('path');
const multer = require('multer');

const rentalsFile = path.join(__dirname, '../data/rentals.json');
const rentalTransactionsFile = path.join(__dirname, '../data/rental_transactions.json');

// ✅ Improved with error handling
const getRentals = () => {
  try {
    if (!fs.existsSync(rentalsFile)) {
      fs.writeFileSync(rentalsFile, JSON.stringify([], null, 2));
      return [];
    }
    return JSON.parse(fs.readFileSync(rentalsFile));
  } catch (error) {
    console.error('Error reading rentals:', error);
    return [];
  }
};

const saveRentals = (r) => {
  try {
    fs.writeFileSync(rentalsFile, JSON.stringify(r, null, 2));
  } catch (error) {
    console.error('Error saving rentals:', error);
  }
};

const getRentalTransactions = () => {
  try {
    if (!fs.existsSync(rentalTransactionsFile)) {
      fs.writeFileSync(rentalTransactionsFile, JSON.stringify([], null, 2));
      return [];
    }
    return JSON.parse(fs.readFileSync(rentalTransactionsFile));
  } catch (error) {
    console.error('Error reading rental transactions:', error);
    return [];
  }
};

const saveRentalTransactions = (t) => {
  try {
    fs.writeFileSync(rentalTransactionsFile, JSON.stringify(t, null, 2));
  } catch (error) {
    console.error('Error saving rental transactions:', error);
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
    files: 2 // Max 2 images
  }
});

// GET ALL RENTALS
router.get('/', (req, res) => {
  try {
    const rentals = getRentals();
    res.json(rentals);
  } catch (error) {
    console.error('Error fetching rentals:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// GET RENTAL BY ID
router.get('/:id', (req, res) => {
  try {
    const rentals = getRentals();
    const rental = rentals.find(r => r.id === req.params.id);
    if (!rental) {
      return res.status(404).json({ message: 'Rental car not found' });
    }
    res.json(rental);
  } catch (error) {
    console.error('Error fetching rental:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// GET BY AGENCY
router.get('/agency/:agencyId', (req, res) => {
  try {
    const rentals = getRentals();
    const agencyRentals = rentals.filter(r => r.agencyId === req.params.agencyId);
    res.json(agencyRentals);
  } catch (error) {
    console.error('Error fetching agency rentals:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// ADD RENTAL CAR
router.post('/add', upload.array('images', 2), (req, res) => {
  try {
    const rentals = getRentals();
    const images = req.files ? req.files.map(f => f.filename) : [];
    
    // ✅ Validate required fields
    const { brand, model, year, rentPerDay, agencyId, agencyName } = req.body;
    if (!brand || !model || !year || !rentPerDay || !agencyId) {
      return res.status(400).json({ 
        message: 'Brand, model, year, rentPerDay, and agencyId are required' 
      });
    }

    const newCar = {
      id: Date.now().toString(),
      brand,
      model,
      year,
      rentPerDay: rentPerDay.toString(),
      agencyId,
      agencyName: agencyName || '',
      agencyPhone: req.body.agencyPhone || '',
      images,
      description: req.body.description || '',
      status: 'available',
      createdAt: new Date().toISOString()
    };
    
    rentals.push(newCar);
    saveRentals(rentals);
    res.status(201).json({ message: 'Rental car added successfully', car: newCar });
  } catch (error) {
    console.error('Error adding rental car:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// DELETE RENTAL CAR
router.delete('/:id', (req, res) => {
  try {
    let rentals = getRentals();
    const rentalExists = rentals.some(r => r.id === req.params.id);
    if (!rentalExists) {
      return res.status(404).json({ message: 'Rental car not found' });
    }
    rentals = rentals.filter(r => r.id !== req.params.id);
    saveRentals(rentals);
    res.json({ message: 'Rental car deleted successfully' });
  } catch (error) {
    console.error('Error deleting rental:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// RENT A CAR — customer request
router.post('/rent/:id', (req, res) => {
  try {
    let rentals = getRentals();
    const car = rentals.find(r => r.id === req.params.id);
    if (!car) {
      return res.status(404).json({ message: 'Rental car not found' });
    }
    if (car.status !== 'available') {
      return res.status(400).json({ message: 'Car is not available for rent' });
    }
    
    const { renterId, renterName, renterPhone, days } = req.body;
    if (!renterId || !renterName || !renterPhone || !days) {
      return res.status(400).json({ 
        message: 'Renter ID, name, phone, and days are required' 
      });
    }
    if (isNaN(days) || days < 1) {
      return res.status(400).json({ message: 'Days must be a positive number' });
    }
    
    car.status = 'pending';
    car.renterId = renterId;
    car.renterName = renterName;
    car.renterPhone = renterPhone;
    car.days = days;
    car.transactionId = null;
    car.rentRequestedAt = new Date().toISOString();
    saveRentals(rentals);
    
    res.json({ message: 'Rental request sent successfully', car });
  } catch (error) {
    console.error('Error processing rent request:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// CONFIRM RENTAL — agency confirms
router.post('/confirm/:id', (req, res) => {
  try {
    let rentals = getRentals();
    const car = rentals.find(r => r.id === req.params.id);
    if (!car) {
      return res.status(404).json({ message: 'Rental car not found' });
    }
    if (car.status !== 'pending') {
      return res.status(400).json({ message: 'Car is not pending confirmation' });
    }

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
      year: car.year,
      rentPerDay: car.rentPerDay,
      days: car.days,
      totalAmount,
      agencyId: car.agencyId,
      agencyName: car.agencyName,
      renterId: car.renterId,
      renterName: car.renterName,
      renterPhone: car.renterPhone,
      type: 'rental',
      confirmedAt: car.confirmedAt
    });
    saveRentalTransactions(transactions);

    res.json({ 
      message: 'Rental confirmed successfully', 
      car, 
      transactionId,
      totalAmount
    });
  } catch (error) {
    console.error('Error confirming rental:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// GET RENTAL TRANSACTIONS BY AGENCY
router.get('/transactions/:agencyId', (req, res) => {
  try {
    const transactions = getRentalTransactions();
    const agencyTransactions = transactions.filter(t => t.agencyId === req.params.agencyId);
    res.json(agencyTransactions);
  } catch (error) {
    console.error('Error fetching agency transactions:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// GET RENTER TRANSACTIONS
router.get('/renter-transactions/:renterId', (req, res) => {
  try {
    const transactions = getRentalTransactions();
    const renterTransactions = transactions.filter(t => t.renterId === req.params.renterId);
    res.json(renterTransactions);
  } catch (error) {
    console.error('Error fetching renter transactions:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// CHECK RENTAL TRANSACTION STATUS FOR CUSTOMER
router.get('/check-transaction/:carId', (req, res) => {
  try {
    const rentals = getRentals();
    const car = rentals.find(r => r.id === req.params.carId);
    if (!car) {
      return res.status(404).json({ message: 'Rental car not found' });
    }
    res.json({ 
      status: car.status, 
      transactionId: car.transactionId || null,
      renterId: car.renterId || null,
      days: car.days || null,
      confirmedAt: car.confirmedAt || null
    });
  } catch (error) {
    console.error('Error checking transaction:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// MARK AVAILABLE AGAIN
router.post('/return/:id', (req, res) => {
  try {
    let rentals = getRentals();
    const car = rentals.find(r => r.id === req.params.id);
    if (!car) {
      return res.status(404).json({ message: 'Rental car not found' });
    }
    if (car.status !== 'rented') {
      return res.status(400).json({ message: 'Car is not currently rented' });
    }
    
    car.status = 'available';
    delete car.renterId;
    delete car.renterName;
    delete car.renterPhone;
    delete car.days;
    delete car.transactionId;
    delete car.confirmedAt;
    delete car.rentRequestedAt;
    car.returnedAt = new Date().toISOString();
    saveRentals(rentals);
    
    res.json({ message: 'Car marked as available', car });
  } catch (error) {
    console.error('Error returning car:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

module.exports = router;