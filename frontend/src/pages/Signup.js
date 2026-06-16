import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import carImage from '../assets/car.jpg';
import './Auth.css';

function Signup() {
  const navigate = useNavigate();
  const [step, setStep] = useState(1);
  const [role, setRole] = useState('');
  const [formData, setFormData] = useState({
    name: '', email: '', password: '', phone: '',
    cnic: '', brandName: '', agencyName: '',
    houseNo: '', street: '', area: '', city: '', country: 'Pakistan'
  });
  const [error, setError] = useState('');

  const roles = [
    { value: 'customer', label: '👤 Customer', desc: 'Buy or rent cars' },
    { value: 'dealer', label: '🏪 Authorized Dealer', desc: 'Sell brand new cars' },
    { value: 'usedcar', label: '🔄 Used Car Seller', desc: 'Sell second-hand cars' },
    { value: 'rental', label: '🚙 Rental Agency', desc: 'Rent out your cars' },
  ];

  const validatePhone = (p) => /^03[0-9]{9}$/.test(p);
  const validateCNIC = (c) => /^[0-9]{5}-[0-9]{7}-[0-9]{1}$/.test(c);
  const validateEmail = (e) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(e);
  const handleChange = (e) => setFormData({ ...formData, [e.target.name]: e.target.value });

  const handleSubmit = async () => {
    if (!formData.name || !formData.email || !formData.password || !formData.phone) {
      setError('Please fill all required fields'); return;
    }
    if (!validateEmail(formData.email)) { setError('Invalid email format'); return; }
    if (!validatePhone(formData.phone)) { setError('Phone: 03XXXXXXXXX format required'); return; }
    if ((role === 'usedcar' || role === 'rental') && formData.cnic && !validateCNIC(formData.cnic)) {
      setError('CNIC: XXXXX-XXXXXXX-X format required'); return;
    }
    const address = `House ${formData.houseNo}, Street ${formData.street}, ${formData.area}, ${formData.city}, ${formData.country}`;
    try {
      await axios.post('http://localhost:5000/api/auth/signup', { ...formData, role, address });
      navigate('/login');
    } catch (err) {
      setError(err.response?.data?.message || 'Signup failed');
    }
  };

  return (
    <div className="auth-container">
      <div className="auth-left">
        <div className="auth-card">
          <div className="auth-logo">
            <div className="auth-logo-icon">🚗</div>
            <h2>AUTOHUB</h2>
          </div>

          {step === 1 && (
            <>
              <h3>Create Your <span>Account</span></h3>
              <p className="auth-subtitle">Choose your account type to get started</p>
              <div className="role-grid">
                {roles.map(r => (
                  <div key={r.value} className="role-card"
                    onClick={() => { setRole(r.value); setStep(2); }}>
                    <h4>{r.label}</h4>
                    <p>{r.desc}</p>
                  </div>
                ))}
              </div>
              <p className="auth-switch">Already have an account? <span onClick={() => navigate('/login')}>Login</span></p>
            </>
          )}

          {step === 2 && (
            <>
              <h3>Your <span>Details</span></h3>
              <p className="auth-subtitle">Complete your registration</p>
              <div className="form-fields">
                <input name="name" placeholder="Full Name" onChange={handleChange} />
                <input name="email" placeholder="Email Address" type="email" onChange={handleChange} />
                <input name="password" placeholder="Password" type="password" onChange={handleChange} />
                <input name="phone" placeholder="Phone (03XXXXXXXXX)" onChange={handleChange} />
                {role === 'dealer' && (
                  <input name="brandName" placeholder="Brand Name (e.g. Toyota)" onChange={handleChange} />
                )}
                {(role === 'usedcar' || role === 'rental') && (
                  <input name="cnic" placeholder="CNIC (XXXXX-XXXXXXX-X)" onChange={handleChange} />
                )}
                {role === 'rental' && (
                  <input name="agencyName" placeholder="Agency Name" onChange={handleChange} />
                )}
                <p className="address-label">📍 Address</p>
                <div className="address-grid">
                  <input name="houseNo" placeholder="House No." onChange={handleChange} />
                  <input name="street" placeholder="Street/Block" onChange={handleChange} />
                  <input name="area" placeholder="Area" onChange={handleChange} />
                  <input name="city" placeholder="City" onChange={handleChange} />
                </div>
                <input name="country" placeholder="Country" defaultValue="Pakistan" onChange={handleChange} />
                {error && <p className="error-msg">{error}</p>}
                <button className="btn-submit" onClick={handleSubmit}>Create Account</button>
                <button className="btn-back" onClick={() => setStep(1)}>← Back</button>
              </div>
            </>
          )}
        </div>
      </div>
      <div className="auth-right-panel">
        <div className="auth-right-overlay"></div>
        <img src={carImage} alt="Car" className="auth-car-img" />
        <div className="auth-panel-badge">
          <p>Join AutoHub Today</p>
          <h4>Your <span>Dream Car</span> Awaits</h4>
        </div>
      </div>
    </div>
  );
}

export default Signup;