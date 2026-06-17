import React, { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import axios from 'axios';
import './Customer.css';

const getImageSrc = (img) => {
  if (!img) return null;
  return `https://projectautohub-production-2c65.up.railway.app/uploads/${img}`;
};

function RentalProfile() {
  const { agencyId } = useParams();
  const navigate = useNavigate();
  const [cars, setCars] = useState([]);
  const [agency, setAgency] = useState(null);
  const [search, setSearch] = useState('');

  useEffect(() => {
    axios.get('https://projectautohub-production-2c65.up.railway.app/api/auth/agencies').then(res => {
      const found = res.data.find(a => a.id === agencyId);
      setAgency(found);
    });
    axios.get('https://projectautohub-production-2c65.up.railway.app/api/rentals').then(res => {
      setCars(res.data.filter(r => r.agencyId === agencyId));
    });
  }, [agencyId]);

  const filtered = cars.filter(c =>
    c.model?.toLowerCase().includes(search.toLowerCase()) ||
    c.brand?.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="page-container rental-page">
      <div className="page-header">
        <button className="back-btn" onClick={() => navigate('/customer/rental-agencies')}>← Back</button>
        <h2>🚙 {agency?.agencyName}</h2>
        <span>📍 {agency?.address} &nbsp;|&nbsp; 📞 {agency?.phone}</span>
      </div>
      <div className="page-content">
        <div className="search-bar">
          <input placeholder="🔍  Search cars..." value={search} onChange={e => setSearch(e.target.value)} />
        </div>
        <p className="results-count">{filtered.length} car{filtered.length !== 1 ? 's' : ''} available</p>
        <div className="rental-cars-grid">
          {filtered.map(car => (
            <div key={car.id}
              className={`rental-car-card ${car.status === 'rented' ? 'rented-card' : ''}`}
              onClick={() => navigate(`/customer/car/${car.id}`, { state: { type: 'rental' } })}>
              <div className="rental-car-img">
                {car.images?.[0]
                  ? <img src={getImageSrc(car.images[0])} alt={car.model} />
                  : <div className="car-no-img">No Image</div>}
                {car.status === 'rented' && (
                  <div className="rented-overlay">🔴 Unavailable</div>
                )}
              </div>
              <div className="rental-car-info">
                <h4>{car.brand} {car.model}</h4>
                <p className="rental-car-year">{car.year} • {car.color}</p>
                <div className="rental-price-row">
                  <span>From</span>
                  <strong>PKR {Number(car.rentPerDay).toLocaleString()}/day</strong>
                </div>
                {car.rentWithDriver && (
                  <p className="rental-extra">With Driver: PKR {Number(car.rentWithDriver).toLocaleString()}/day</p>
                )}
                <div className="rental-card-footer">
                  <span className={`rental-status ${car.status}`}>
                    {car.status === 'rented' ? '🔴 Rented' : '🟢 Available'}
                  </span>
                  <span className="rental-view">Details →</span>
                </div>
              </div>
            </div>
          ))}
          {filtered.length === 0 && (
            <div className="empty-state">
              <h3>No cars available</h3>
              <p>This agency has not listed any cars yet</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export default RentalProfile;
