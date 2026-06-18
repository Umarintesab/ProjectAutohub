import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import './Customer.css';

function RentalAgencies() {
  const navigate = useNavigate();
  const [agencies, setAgencies] = useState([]);
  const [search, setSearch] = useState('');

  useEffect(() => {
    axios.get('${API_URL}/api/auth/agencies').then(res => setAgencies(res.data));
  }, []);

  const filtered = agencies.filter(a =>
    a.agencyName?.toLowerCase().includes(search.toLowerCase()) ||
    a.address?.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="page-container">
      <div className="page-header">
        <button className="back-btn" onClick={() => navigate('/customer/dashboard')}>← Back</button>
        <h2>🚙 Rental Agencies</h2>
      </div>

      {/* HERO BANNER */}
      <div className="inner-hero rental-hero">
        <div className="inner-hero-text">
          <h2>Rent a <span>Premium Car</span></h2>
          <p>Choose from top rental agencies — with or without driver and petrol</p>
        </div>
        <div className="inner-hero-stats">
          <div className="inner-stat"><h3>{agencies.length}</h3><p>Agencies</p></div>
          <div className="inner-stat"><h3>100+</h3><p>Cars</p></div>
          <div className="inner-stat"><h3>Daily</h3><p>Rentals</p></div>
        </div>
      </div>

      <div className="page-content">
        <div className="search-section">
          <div className="search-bar">
            <input
              placeholder="🔍  Search by agency name or location..."
              value={search}
              onChange={e => setSearch(e.target.value)}
            />
          </div>
          <p className="results-count">{filtered.length} agency(s) found</p>
        </div>

        <div className="profiles-grid">
          {filtered.map(agency => (
            <div key={agency.id} className="dealer-card"
              onClick={() => navigate(`/customer/rental/${agency.id}`)}>
              <div className="dealer-card-top">
                <div className="dealer-avatar rental-avatar">
                  {agency.agencyName?.charAt(0).toUpperCase()}
                </div>
                <div className="dealer-card-info">
                  <h3>{agency.agencyName}</h3>
                  <span className="dealer-brand-tag">Rental Agency</span>
                </div>
              </div>
              <div className="dealer-card-details">
                <p>📞 {agency.phone}</p>
                <p>📍 {agency.address || 'Pakistan'}</p>
              </div>
              <div className="dealer-card-footer">
                <span>View Fleet →</span>
              </div>
            </div>
          ))}
          {filtered.length === 0 && (
            <div className="empty-state">
              <h3>No agencies found</h3>
              <p>Try a different search term</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export default RentalAgencies;
