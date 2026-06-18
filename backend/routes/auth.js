const express = require('express');
const router = express.Router();
const fs = require('fs');
const path = require('path');

const usersFile = path.join(__dirname, '../data/users.json');

// ✅ Improved with error handling
const getUsers = () => {
  try {
    if (!fs.existsSync(usersFile)) {
      // Create empty users array if file doesn't exist
      fs.writeFileSync(usersFile, JSON.stringify([], null, 2));
      return [];
    }
    const data = fs.readFileSync(usersFile);
    return JSON.parse(data);
  } catch (error) {
    console.error('Error reading users file:', error);
    return [];
  }
};

const saveUsers = (users) => {
  try {
    fs.writeFileSync(usersFile, JSON.stringify(users, null, 2));
  } catch (error) {
    console.error('Error saving users:', error);
  }
};

// SIGNUP
router.post('/signup', (req, res) => {
  try {
    const users = getUsers();
    const { name, email, password, role, phone, cnic, brandName, agencyName, address } = req.body;

    // ✅ Validate required fields
    if (!name || !email || !password || !role || !phone) {
      return res.status(400).json({ 
        message: 'Name, email, password, role, and phone are required' 
      });
    }

    const exists = users.find(u => u.email === email);
    if (exists) {
      return res.status(400).json({ message: 'Email already exists' });
    }

    const newUser = {
      id: Date.now().toString(),
      name,
      email,
      password,
      role,
      phone,
      cnic: cnic || '',
      brandName: brandName || '',
      agencyName: agencyName || '',
      address: address || '',
      createdAt: new Date().toISOString()
    };

    users.push(newUser);
    saveUsers(users);
    
    // ✅ Return user without password
    const { password: _, ...userWithoutPassword } = newUser;
    res.status(201).json({ 
      message: 'Signup successful', 
      user: userWithoutPassword 
    });
  } catch (error) {
    console.error('Signup error:', error);
    res.status(500).json({ message: 'Server error during signup' });
  }
});

// LOGIN
router.post('/login', (req, res) => {
  try {
    const users = getUsers();
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({ message: 'Email and password are required' });
    }

    const user = users.find(u => u.email === email && u.password === password);
    if (!user) {
      return res.status(401).json({ message: 'Invalid email or password' });
    }

    // ✅ Return user without password
    const { password: _, ...userWithoutPassword } = user;
    res.json({ 
      message: 'Login successful', 
      user: userWithoutPassword 
    });
  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({ message: 'Server error during login' });
  }
});

// GET ALL DEALERS
router.get('/dealers', (req, res) => {
  try {
    const users = getUsers();
    const dealers = users.filter(u => u.role === 'dealer');
    res.json(dealers);
  } catch (error) {
    console.error('Error fetching dealers:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// GET ALL USED CAR SELLERS
router.get('/usedcarsellers', (req, res) => {
  try {
    const users = getUsers();
    const sellers = users.filter(u => u.role === 'usedcar');
    res.json(sellers);
  } catch (error) {
    console.error('Error fetching used car sellers:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// GET ALL RENTAL AGENCIES
router.get('/agencies', (req, res) => {
  try {
    const users = getUsers();
    const agencies = users.filter(u => u.role === 'rental');
    res.json(agencies);
  } catch (error) {
    console.error('Error fetching rental agencies:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

module.exports = router;