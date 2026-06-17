import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';

import Landing from './pages/Landing';
import Login from './pages/Login';
import Signup from './pages/Signup';
import CustomerDashboard from './pages/customer/CustomerDashboard';
import DealerDashboard from './pages/dealer/DealerDashboard';
import UsedCarDashboard from './pages/usedcar/UsedCarDashboard';
import RentalDashboard from './pages/rental/RentalDashboard';
import AuthorizedDealers from './pages/customer/AuthorizedDealers';
import DealerProfile from './pages/customer/DealerProfile';
import UsedCars from './pages/customer/UsedCars';
import RentalAgencies from './pages/customer/RentalAgencies';
import RentalProfile from './pages/customer/RentalProfile';
import CarDetail from './pages/customer/CarDetail';
import './App.css';

function App() {
  return (
    <Router>
      <Routes>
        <Route path="/" element={<Landing />} />
        <Route path="/login" element={<Login />} />
        <Route path="/signup" element={<Signup />} />
        <Route path="/customer/dashboard" element={<CustomerDashboard />} />
        <Route path="/customer/authorized-dealers" element={<AuthorizedDealers />} />
        <Route path="/customer/dealer/:dealerId" element={<DealerProfile />} />
        <Route path="/customer/used-cars" element={<UsedCars />} />
        <Route path="/customer/rental-agencies" element={<RentalAgencies />} />
        <Route path="/customer/rental/:agencyId" element={<RentalProfile />} />
        <Route path="/dealer/dashboard" element={<DealerDashboard />} />
        <Route path="/usedcar/dashboard" element={<UsedCarDashboard />} />
        <Route path="/rental/dashboard" element={<RentalDashboard />} />
        <Route path="/customer/car/:carId" element={<CarDetail />} />
      </Routes>
    </Router>
  );
}

export default App;
