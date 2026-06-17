import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import carImage from '../assets/car.jpg';
import './Auth.css';

function Login() {
  const navigate = useNavigate();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');

  const handleLogin = async () => {
    if (!email || !password) { setError('Please fill all fields'); return; }
    try {
      const res = await axios.post('projectautohub-production-2c65.up.railway.app/api/auth/login', { email, password });
      const user = res.data.user;
      localStorage.setItem('user', JSON.stringify(user));
      if (user.role === 'customer') navigate('/customer/dashboard');
      else if (user.role === 'dealer') navigate('/dealer/dashboard');
      else if (user.role === 'usedcar') navigate('/usedcar/dashboard');
      else if (user.role === 'rental') navigate('/rental/dashboard');
    } catch (err) {
      setError(err.response?.data?.message || 'Login failed');
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
          <h3>Welcome <span>Back!</span></h3>
          <p className="auth-subtitle">Login to your AutoHub account to continue</p>
          <div className="form-fields">
            <div className="form-group">
              <label>Email Address</label>
              <input placeholder="example@gmail.com" type="email"
                value={email} onChange={e => setEmail(e.target.value)} />
            </div>
            <div className="form-group">
              <label>Password</label>
              <input placeholder="••••••••••••" type="password"
                value={password} onChange={e => setPassword(e.target.value)} />
            </div>
            {error && <p className="error-msg">{error}</p>}
            <button className="btn-submit" onClick={handleLogin}>Login</button>
            <p className="auth-switch">
              Don't have an account? <span onClick={() => navigate('/signup')}>Sign Up</span>
            </p>
          </div>
        </div>
      </div>
      <div className="auth-right-panel">
        <div className="auth-right-overlay"></div>
        <img src={carImage} alt="Car" className="auth-car-img" />
        <div className="auth-panel-badge">
          <p>Welcome Back</p>
          <h4>Drive with <span>AutoHub</span></h4>
        </div>
      </div>
    </div>
  );
}

export default Login;
