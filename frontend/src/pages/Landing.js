import React from 'react';
import { useNavigate } from 'react-router-dom';
import carImage from '../assets/car.jpg';
import './Landing.css';

function Landing() {
  const navigate = useNavigate();

  return (
    <div className="landing-container">
      <div className="landing-left">
        <div className="landing-card">
          <div className="landing-logo">
            <div className="landing-logo-icon">🚗</div>
            <h2>AUTOHUB</h2>
          </div>
          <div className="landing-hero-text">
            <h1>Drive Your<br /><span>Dream Car</span><br />Today</h1>
            <p>Pakistan's most unified automotive platform. Buy new cars, find used vehicles, or rent premium cars — all in one place.</p>
          </div>
          <div className="landing-action-buttons">
            <button className="btn-landing-primary" onClick={() => navigate('/login')}>Login</button>
            <button className="btn-landing-secondary" onClick={() => navigate('/signup')}>Sign Up</button>
          </div>
          <div className="landing-divider"></div>
          <div className="landing-stats">
            <div className="landing-stat"><h3>500+</h3><p>Cars Listed</p></div>
            <div className="landing-stat"><h3>50+</h3><p>Dealers</p></div>
            <div className="landing-stat"><h3>30+</h3><p>Agencies</p></div>
          </div>
        </div>
      </div>
      <div className="landing-right">
        <div className="landing-right-overlay"></div>
        <img src={carImage} alt="Premium Car" className="landing-car-img" />
        <div className="landing-badge">
          <p>Pakistan's #1 Platform</p>
          <h4>AutoHub <span>Premium</span></h4>
        </div>
      </div>
    </div>
  );
}

export default Landing;