const express = require('express');
const router = express.Router();
const fs = require('fs');
const path = require('path');

const usersFile = path.join(__dirname, '../data/users.json');

const getUsers = () => {
  const data = fs.readFileSync(usersFile);
  return JSON.parse(data);
};

const saveUsers = (users) => {
  fs.writeFileSync(usersFile, JSON.stringify(users, null, 2));
};

// SIGNUP
router.post('/signup', (req, res) => {
  const users = getUsers();
  const { name, email, password, role, phone, cnic, brandName, agencyName, address } = req.body;

  const exists = users.find(u => u.email === email);
  if (exists) return res.status(400).json({ message: 'Email already exists' });

  const newUser = {
    id: Date.now().toString(),
    name, email, password, role, phone,
    cnic: cnic || '',
    brandName: brandName || '',
    agencyName: agencyName || '',
    address: address || ''
  };

  users.push(newUser);
  saveUsers(users);
  res.json({ message: 'Signup successful', user: newUser });
});

// LOGIN
router.post('/login', (req, res) => {
  const users = getUsers();
  const { email, password } = req.body;

  const user = users.find(u => u.email === email && u.password === password);
  if (!user) return res.status(400).json({ message: 'Invalid credentials' });

  res.json({ message: 'Login successful', user });
});

// GET ALL DEALERS
router.get('/dealers', (req, res) => {
  const users = getUsers();
  const dealers = users.filter(u => u.role === 'dealer');
  res.json(dealers);
});

// GET ALL USED CAR SELLERS
router.get('/usedcarsellers', (req, res) => {
  const users = getUsers();
  const sellers = users.filter(u => u.role === 'usedcar');
  res.json(sellers);
});

// GET ALL RENTAL AGENCIES
router.get('/agencies', (req, res) => {
  const users = getUsers();
  const agencies = users.filter(u => u.role === 'rental');
  res.json(agencies);
});

module.exports = router;