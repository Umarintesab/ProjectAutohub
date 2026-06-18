import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import './Customer.css';

function AuthorizedDealers() {
  const navigate = useNavigate();
  const [dealers, setDealers] = useState([]);
  const [search, setSearch] = useState('');

  useEffect(() => {
    axios.get('${API_URL}/api/auth/dealers').then(res => setDealers(res.data));
  }, []);

  const filtered = dealers.filter(d =>
    d.name.toLowerCase().includes(search.toLowerCase()) ||
    d.brandName.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="page-container">
      <div className="page-header">
        <button className="back-btn" onClick={() => navigate('/customer/dashboard')}>← Back</button>
        <h2>🏪 Authorized Dealers</h2>
      </div>

      {/* HERO BANNER */}
      <div className="inner-hero">
        <div className="inner-hero-text">
          <h2>Buy Your <span>Brand New Car</span></h2>
          <p>Browse Pakistan's top authorized dealers and find your perfect new vehicle</p>
        </div>
        <div className="inner-hero-stats">
          <div className="inner-stat"><h3>{dealers.length}</h3><p>Dealers</p></div>
          <div className="inner-stat"><h3>50+</h3><p>Brands</p></div>
          <div className="inner-stat"><h3>200+</h3><p>Cars</p></div>
        </div>
      </div>

      <div className="page-content">
        {/* SEARCH */}
        <div className="search-section">
          <div className="search-bar">
            <input
              placeholder="🔍  Search by dealer name or brand..."
              value={search}
              onChange={e => setSearch(e.target.value)}
            />
          </div>
          <p className="results-count">{filtered.length} dealer(s) found</p>
        </div>

        {/* DEALER CARDS */}
        <div className="profiles-grid">
          {filtered.map(dealer => (
            <div key={dealer.id} className="dealer-card"
              onClick={() => navigate(`/customer/dealer/${dealer.id}`)}>
              <div className="dealer-card-top">
                <div className="dealer-avatar">
                  {dealer.brandName?.charAt(0).toUpperCase()}
                </div>
                <div className="dealer-card-info">
                  <h3>{dealer.name}</h3>
                  <span className="dealer-brand-tag">{dealer.brandName}</span>
                </div>
              </div>
              <div className="dealer-card-details">
                <p>📞 {dealer.phone}</p>
                <p>📍 {dealer.address || 'Pakistan'}</p>
              </div>
              <div className="dealer-card-footer">
                <span>View Cars →</span>
              </div>
            </div>
          ))}
          {filtered.length === 0 && (
            <div className="empty-state">
              <h3>No dealers found</h3>
              <p>Try a different search term</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export default AuthorizedDealers;
