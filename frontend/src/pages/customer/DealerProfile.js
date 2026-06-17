import React, { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import axios from 'axios';
import './Customer.css';

const getImageSrc = (img) => {
  if (!img) return null;
  return `$env:REACT_APP_API_URL/uploads/${img}`;
};

function DealerProfile() {
  const { dealerId } = useParams();
  const navigate = useNavigate();
  const [cars, setCars] = useState([]);
  const [dealer, setDealer] = useState(null);
  const [search, setSearch] = useState('');

  useEffect(() => {
    axios.get('$env:REACT_APP_API_URL/api/auth/dealers').then(res => {
      const found = res.data.find(d => d.id === dealerId);
      setDealer(found);
    });
    axios.get('$env:REACT_APP_API_URL/api/cars').then(res => {
      const dealerCars = res.data.filter(c => c.sellerId === dealerId && c.status === 'available');
      setCars(dealerCars);
    });
  }, [dealerId]);

  const filtered = cars.filter(c =>
    c.model?.toLowerCase().includes(search.toLowerCase()) ||
    c.brand?.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="page-container">
      <div className="page-header">
        <button className="back-btn" onClick={() => navigate('/customer/authorized-dealers')}>← Back</button>
        <h2>🏪 {dealer?.name} — {dealer?.brandName}</h2>
      </div>
      <div className="page-content">
        <div className="search-bar">
          <input placeholder="🔍  Search cars..." value={search} onChange={e => setSearch(e.target.value)} />
        </div>
        <div className="cars-grid">
          {filtered.map(car => (
            <div key={car.id} className="car-card"
              onClick={() => navigate(`/customer/car/${car.id}`, { state: { type: 'new' } })}>
              <div className="car-card-img">
                {car.images?.[0]
                  ? <img src={getImageSrc(car.images[0])} alt={car.model} />
                  : <div className="car-no-img">No Image</div>}
              </div>
              <div className="car-info">
                <h4>{car.brand} {car.model}</h4>
                <p className="car-price">PKR {Number(car.price).toLocaleString()}</p>
                <p className="car-detail">{car.year} • {car.color}</p>
                <p className="car-desc">{car.description}</p>
                <span className="car-click-hint">View Details →</span>
              </div>
            </div>
          ))}
          {filtered.length === 0 && (
            <div className="empty-state">
              <h3>No cars available</h3>
              <p>This dealer has not listed any cars yet</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export default DealerProfile;
