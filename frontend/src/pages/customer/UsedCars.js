import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import './Customer.css';

const getImageSrc = (img) => {
  if (!img) return null;
  return `${API_URL}/uploads/${img}`;
};

function UsedCars() {
  const navigate = useNavigate();
  const [cars, setCars] = useState([]);
  const [search, setSearch] = useState('');

  useEffect(() => {
    axios.get('${API_URL}/api/cars').then(res => {
      setCars(res.data.filter(c => c.type === 'used'));
    });
  }, []);

  const filtered = cars.filter(c =>
    c.model?.toLowerCase().includes(search.toLowerCase()) ||
    c.brand?.toLowerCase().includes(search.toLowerCase()) ||
    c.color?.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="page-container used-cars-page">
      <div className="page-header">
        <button className="back-btn" onClick={() => navigate('/customer/dashboard')}>← Back</button>
        <h2>🔄 Used Cars Marketplace</h2>
      </div>

      <div className="inner-hero">
        <div className="inner-hero-text">
          <h2>Find Your <span>Perfect Used Car</span></h2>
          <p>Browse quality second-hand cars from verified sellers across Pakistan.</p>
        </div>
        <div className="inner-hero-stats">
          <div className="inner-stat"><h3>{cars.length}</h3><p>Cars Listed</p></div>
          <div className="inner-stat"><h3>100%</h3><p>Verified</p></div>
          <div className="inner-stat"><h3>Best</h3><p>Prices</p></div>
        </div>
      </div>

      <div className="page-content">
        <div className="search-bar">
          <input
            placeholder="🔍  Search by brand, model or color..."
            value={search}
            onChange={e => setSearch(e.target.value)}
          />
        </div>
        <p className="results-count">{filtered.length} car{filtered.length !== 1 ? 's' : ''} found</p>
        <div className="used-cars-grid">
          {filtered.map(car => (
            <div key={car.id} className="used-car-card"
              onClick={() => navigate(`/customer/car/${car.id}`, { state: { type: 'used' } })}>
              <div className="used-car-img">
                {car.images?.[0]
                  ? <img src={getImageSrc(car.images[0])} alt={car.model} />
                  : <div className="car-no-img">No Image</div>}
                <span className={`used-status-badge ${car.status}`}>{car.status}</span>
              </div>
              <div className="used-car-info">
                <div className="used-car-top">
                  <h4>{car.brand} {car.model}</h4>
                  <span className="used-car-year">{car.year}</span>
                </div>
                <p className="used-car-price">PKR {Number(car.price).toLocaleString()}</p>
                <p className="used-car-color">🎨 {car.color}</p>
                <p className="used-car-desc">{car.description}</p>
                <div className="used-car-footer">
                  <span className="used-img-count">📷 {car.images?.length || 0} photos</span>
                  <span className="used-view-btn">View Details →</span>
                </div>
              </div>
            </div>
          ))}
          {filtered.length === 0 && (
            <div className="empty-state">
              <h3>No cars found</h3>
              <p>Try a different search term</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export default UsedCars;
