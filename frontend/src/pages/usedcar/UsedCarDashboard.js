import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import './UsedCar.css';

const getImageSrc = (img) => {
  if (!img) return null;
  return `$env:REACT_APP_API_URL/uploads/${img}`;
};

function UsedCarDashboard() {
  const navigate = useNavigate();
  const [user, setUser] = useState(null);
  const [cars, setCars] = useState([]);
  const [showAddForm, setShowAddForm] = useState(false);
  const [formData, setFormData] = useState({
    brand: '', model: '', year: '', color: '', price: '', description: ''
  });
  const [images, setImages] = useState([]);
  const [notification, setNotification] = useState(null);
  const [activeTab, setActiveTab] = useState('all');

  useEffect(() => {
    const stored = localStorage.getItem('user');
    if (!stored) { navigate('/login'); return; }
    const u = JSON.parse(stored);
    setUser(u);
    loadCars(u.id);
  }, [navigate]);

  const loadCars = (sellerId) => {
    axios.get(`$env:REACT_APP_API_URL/api/cars/seller/${sellerId}`).then(res => {
      setCars(res.data);
      const pending = res.data.find(c => c.status === 'pending');
      if (pending) setNotification(pending);
    });
  };

  const handleAddCar = async () => {
    if (images.length < 4) {
      alert('Please upload at least 4 images (Front, Back, Left, Right)');
      return;
    }
    const data = new FormData();
    data.append('sellerId', user.id);
    data.append('type', 'used');
    Object.keys(formData).forEach(k => data.append(k, formData[k]));
    images.forEach(img => data.append('images', img));
    await axios.post('$env:REACT_APP_API_URL/api/cars/add', data);
    setShowAddForm(false);
    setFormData({ brand: '', model: '', year: '', color: '', price: '', description: '' });
    setImages([]);
    loadCars(user.id);
  };

  const handleDelete = async (id) => {
    await axios.delete(`$env:REACT_APP_API_URL/api/cars/${id}`);
    loadCars(user.id);
  };

  const handleConfirmSale = async (id) => {
    await axios.post(`$env:REACT_APP_API_URL/api/cars/confirm/${id}`);
    setNotification(null);
    loadCars(user.id);
  };

  const handleLogout = () => {
    localStorage.removeItem('user');
    navigate('/');
  };

  const filteredCars = activeTab === 'all' ? cars : cars.filter(c => c.status === activeTab);

  const counts = {
    all: cars.length,
    available: cars.filter(c => c.status === 'available').length,
    pending: cars.filter(c => c.status === 'pending').length,
    sold: cars.filter(c => c.status === 'sold').length,
  };

  const totalEarned = cars
    .filter(c => c.status === 'sold')
    .reduce((sum, c) => sum + Number(c.price || 0), 0);

  return (
    <div className="usedcar-container">
      {/* NAVBAR */}
      <nav className="usedcar-nav">
        <div className="usedcar-nav-brand">
          <div className="usedcar-nav-icon">🔄</div>
          <h2>AUTOHUB</h2>
        </div>
        <div className="usedcar-nav-right">
          <span className="usedcar-nav-name">👤 {user?.name}</span>
          <span className="usedcar-nav-badge">Used Car Seller</span>
          <button className="usedcar-logout-btn" onClick={handleLogout}>Logout</button>
        </div>
      </nav>

      {/* NOTIFICATION */}
      {notification && (
        <div className="usedcar-notification">
          <div className="usedcar-notif-left">
            <span className="notif-icon">🔔</span>
            <div>
              <h4>Someone wants to buy your car!</h4>
              <p><strong>{notification.brand} {notification.model}</strong> — PKR {Number(notification.price).toLocaleString()}</p>
              <p style={{fontSize:'12px', color:'#888', marginTop:'2px'}}>
                Buyer: {notification.buyerName} | 📞 {notification.buyerPhone}
              </p>
            </div>
          </div>
          <div className="usedcar-notif-actions">
            <button className="usedcar-confirm-btn" onClick={() => handleConfirmSale(notification.id)}>
              ✅ Confirm Sale
            </button>
            <button className="usedcar-dismiss-btn" onClick={() => setNotification(null)}>Dismiss</button>
          </div>
        </div>
      )}

      {/* HERO */}
      <div className="usedcar-hero">
        <div className="usedcar-hero-left">
          <h1>Welcome, <span>{user?.name}</span></h1>
          <p>Manage your used car listings from here</p>
          <div className="usedcar-stats-row">
            <div className="usedcar-stat-box">
              <h3>{counts.all}</h3>
              <p>Total Listed</p>
            </div>
            <div className="usedcar-stat-box">
              <h3>{counts.available}</h3>
              <p>Available</p>
            </div>
            <div className="usedcar-stat-box">
              <h3>{counts.pending}</h3>
              <p>Pending</p>
            </div>
            <div className="usedcar-stat-box">
              <h3>{counts.sold}</h3>
              <p>Sold</p>
            </div>
            <div className="usedcar-stat-box green">
              <h3>PKR {totalEarned > 0 ? (totalEarned/1000000).toFixed(1)+'M' : '0'}</h3>
              <p>Earned</p>
            </div>
          </div>
        </div>
        <button className="usedcar-add-btn" onClick={() => setShowAddForm(!showAddForm)}>
          {showAddForm ? '✕ Cancel' : '+ List My Car'}
        </button>
      </div>

      <div className="usedcar-content">

        {/* ADD FORM */}
        {showAddForm && (
          <div className="usedcar-add-form">
            <h3>🚗 List Your Used Car</h3>
            <p className="usedcar-form-note">Fill in all details honestly. Buyers will contact you directly.</p>
            <div className="usedcar-form-grid">
              <input placeholder="Brand (e.g. Toyota)"
                value={formData.brand}
                onChange={e => setFormData({...formData, brand: e.target.value})} />
              <input placeholder="Model (e.g. Corolla)"
                value={formData.model}
                onChange={e => setFormData({...formData, model: e.target.value})} />
              <input placeholder="Year (e.g. 2019)"
                value={formData.year}
                onChange={e => setFormData({...formData, year: e.target.value})} />
              <input placeholder="Color"
                value={formData.color}
                onChange={e => setFormData({...formData, color: e.target.value})} />
              <input placeholder="Price (PKR)"
                value={formData.price}
                onChange={e => setFormData({...formData, price: e.target.value})} />
            </div>
            <textarea placeholder="Describe your car honestly — condition, mileage, any repairs done, original parts, etc."
              value={formData.description}
              onChange={e => setFormData({...formData, description: e.target.value})} />
            <div className="usedcar-upload-area">
              <label>📷 Upload 4 Images (Front, Back, Left Side, Right Side) — All 4 Required</label>
              <input type="file" multiple accept="image/*"
                onChange={e => setImages(Array.from(e.target.files).slice(0, 4))} />
              {images.length > 0 && (
                <p className="upload-count">✅ {images.length}/4 image(s) selected
                  {images.length < 4 && <span style={{color:'#e65100'}}> — Need {4 - images.length} more</span>}
                </p>
              )}
            </div>
            <button className="usedcar-submit-btn" onClick={handleAddCar}>
              List Car for Sale
            </button>
          </div>
        )}

        {/* TABS */}
        <div className="usedcar-tabs">
          {['all','available','pending','sold'].map(tab => (
            <button key={tab}
              className={`usedcar-tab ${activeTab === tab ? 'active' : ''}`}
              onClick={() => setActiveTab(tab)}>
              {tab.charAt(0).toUpperCase() + tab.slice(1)} ({counts[tab]})
            </button>
          ))}
        </div>

        {/* CARS */}
        <div className="usedcar-cars-list">
          {filteredCars.map(car => (
            <div key={car.id} className="usedcar-car-card">
              {/* IMAGES ROW */}
              <div className="usedcar-car-images">
                {car.images?.slice(0,4).map((img, i) => (
                  <div key={i} className="usedcar-car-img">
                    <img src={getImageSrc(img)} alt={`view-${i}`} />
                    <span className="usedcar-img-label">
                      {['Front','Back','Left','Right'][i] || `View ${i+1}`}
                    </span>
                  </div>
                ))}
                {(!car.images || car.images.length === 0) && (
                  <div className="usedcar-no-img">No Images</div>
                )}
              </div>

              {/* INFO */}
              <div className="usedcar-car-details">
                <div className="usedcar-car-top">
                  <div>
                    <h3>{car.brand} {car.model}</h3>
                    <p className="usedcar-car-meta">{car.year} • {car.color}</p>
                  </div>
                  <div style={{textAlign:'right'}}>
                    <p className="usedcar-car-price">PKR {car.price ? Number(car.price).toLocaleString() : '0'}</p>
                    <span className={`usedcar-status ${car.status}`}>{car.status}</span>
                  </div>
                </div>

                <p className="usedcar-car-desc">{car.description}</p>

                {/* PENDING — buyer info */}
                {car.status === 'pending' && (
                  <div className="usedcar-buyer-box">
                    <h4>🔔 Purchase Request Received</h4>
                    <p>👤 <strong>{car.buyerName}</strong></p>
                    <p>📞 {car.buyerPhone}</p>
                    <button className="usedcar-confirm-btn"
                      onClick={() => handleConfirmSale(car.id)}>
                      ✅ Confirm Sale & Generate Transaction ID
                    </button>
                  </div>
                )}

                {/* SOLD — show transaction */}
                {car.status === 'sold' && car.transactionId && (
                  <div className="usedcar-sold-box">
                    <h4>✅ Car Sold!</h4>
                    <p>Transaction ID: <strong>{car.transactionId}</strong></p>
                    <p>Buyer: {car.buyerName} | {car.buyerPhone}</p>
                  </div>
                )}

                <div className="usedcar-card-actions">
                  <button className="usedcar-delete-btn" onClick={() => handleDelete(car.id)}>
                    🗑 Remove Listing
                  </button>
                </div>
              </div>
            </div>
          ))}

          {filteredCars.length === 0 && (
            <div className="usedcar-empty">
              <div className="usedcar-empty-icon">🚗</div>
              <h3>No cars listed yet</h3>
              <p>Click "List My Car" to add your first listing</p>
              <button className="usedcar-add-btn" onClick={() => setShowAddForm(true)}>
                + List My Car
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export default UsedCarDashboard;
