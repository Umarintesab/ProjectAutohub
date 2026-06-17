import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import './Rental.css';

const getImageSrc = (img) => {
  if (!img) return null;
  return `projectautohub-production-2c65.up.railway.app/uploads/${img}`;
};

function RentalDashboard() {
  const navigate = useNavigate();
  const [user, setUser] = useState(null);
  const [cars, setCars] = useState([]);
  const [transactions, setTransactions] = useState([]);
  const [showAddForm, setShowAddForm] = useState(false);
  const [showInventory, setShowInventory] = useState(false);
  const [formData, setFormData] = useState({
    brand: '', model: '', year: '', color: '',
    rentPerDay: '', rentWithDriver: '',
    rentWithPetrol: '', rentWithDriverAndPetrol: '', description: ''
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
    loadTransactions(u.id);
  }, [navigate]);

  const loadCars = (agencyId) => {
    axios.get(`projectautohub-production-2c65.up.railway.app/api/rentals/agency/${agencyId}`).then(res => {
      setCars(res.data);
      const pending = res.data.find(c => c.status === 'pending');
      if (pending) setNotification(pending);
    });
  };

  const loadTransactions = (agencyId) => {
    axios.get(`projectautohub-production-2c65.up.railway.app/api/rentals/transactions/${agencyId}`).then(res => {
      setTransactions(res.data);
    });
  };

  const handleAddCar = async () => {
    const data = new FormData();
    data.append('agencyId', user.id);
    Object.keys(formData).forEach(k => data.append(k, formData[k]));
    images.forEach(img => data.append('images', img));
    await axios.post('projectautohub-production-2c65.up.railway.app/api/rentals/add', data);
    setShowAddForm(false);
    setFormData({
      brand: '', model: '', year: '', color: '',
      rentPerDay: '', rentWithDriver: '',
      rentWithPetrol: '', rentWithDriverAndPetrol: '', description: ''
    });
    setImages([]);
    loadCars(user.id);
  };

  const handleDelete = async (id) => {
    await axios.delete(`projectautohub-production-2c65.up.railway.app/api/rentals/${id}`);
    loadCars(user.id);
  };

  const handleConfirmRental = async (id) => {
    await axios.post(`projectautohub-production-2c65.up.railway.app/api/rentals/confirm/${id}`);
    setNotification(null);
    loadCars(user.id);
    loadTransactions(user.id);
  };

  const handleMarkAvailable = async (id) => {
    await axios.post(`projectautohub-production-2c65.up.railway.app/api/rentals/return/${id}`);
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
    rented: cars.filter(c => c.status === 'rented').length,
  };

  const totalRevenue = transactions.reduce((sum, t) => sum + Number(t.totalAmount || 0), 0);

  return (
    <div className="rental-dash-container">
      {/* NAVBAR */}
      <nav className="rental-dash-nav">
        <div className="rental-dash-nav-brand">
          <div className="rental-dash-nav-icon">🚙</div>
          <h2>AUTOHUB</h2>
        </div>
        <div className="rental-dash-nav-right">
          <span className="rental-dash-nav-name">👤 {user?.name}</span>
          <span className="rental-dash-nav-badge">{user?.agencyName}</span>
          <button className="rental-dash-logout-btn" onClick={handleLogout}>Logout</button>
        </div>
      </nav>

      {/* NOTIFICATION */}
      {notification && (
        <div className="rental-dash-notification">
          <div className="rental-dash-notif-left">
            <span className="notif-icon">🔔</span>
            <div>
              <h4>New Rental Request!</h4>
              <p>
                <strong>{notification.brand} {notification.model}</strong> —
                PKR {Number(notification.rentPerDay).toLocaleString()}/day × {notification.days} days
              </p>
              <p style={{fontSize:'12px', color:'#888', marginTop:'2px'}}>
                Renter: {notification.renterName} | 📞 {notification.renterPhone}
              </p>
            </div>
          </div>
          <div className="rental-dash-notif-actions">
            <button className="rental-confirm-btn"
              onClick={() => handleConfirmRental(notification.id)}>
              ✅ Confirm Rental
            </button>
            <button className="rental-dismiss-btn" onClick={() => setNotification(null)}>
              Dismiss
            </button>
          </div>
        </div>
      )}

      {/* HERO */}
      <div className="rental-dash-hero">
        <div className="rental-dash-hero-left">
          <h1>Welcome, <span>{user?.agencyName}</span></h1>
          <p>Manage your rental fleet from here</p>
          <div className="rental-dash-stats-row">
            <div className="rental-dash-stat-box">
              <h3>{counts.all}</h3>
              <p>Total Fleet</p>
            </div>
            <div className="rental-dash-stat-box">
              <h3>{counts.available}</h3>
              <p>Available</p>
            </div>
            <div className="rental-dash-stat-box">
              <h3>{counts.pending}</h3>
              <p>Pending</p>
            </div>
            <div className="rental-dash-stat-box">
              <h3>{counts.rented}</h3>
              <p>Rented</p>
            </div>
            <div className="rental-dash-stat-box green">
              <h3>{transactions.length}</h3>
              <p>Bookings</p>
            </div>
          </div>
        </div>
        <div style={{display:'flex', gap:'12px', flexDirection:'column', alignItems:'flex-end'}}>
          <button className="rental-dash-add-btn"
            onClick={() => { setShowAddForm(!showAddForm); setShowInventory(false); }}>
            {showAddForm ? '✕ Cancel' : '+ Add Rental Car'}
          </button>
          <button className="rental-dash-inventory-btn"
            onClick={() => { setShowInventory(!showInventory); setShowAddForm(false); }}>
            {showInventory ? '✕ Close Sheet' : '📊 Booking Sheet'}
          </button>
        </div>
      </div>

      <div className="rental-dash-content">

        {/* ADD FORM */}
        {showAddForm && (
          <div className="rental-dash-add-form">
            <h3>🚙 Add Rental Car</h3>
            <div className="rental-dash-form-grid">
              <input placeholder="Brand (e.g. Toyota)"
                value={formData.brand}
                onChange={e => setFormData({...formData, brand: e.target.value})} />
              <input placeholder="Model (e.g. Corolla)"
                value={formData.model}
                onChange={e => setFormData({...formData, model: e.target.value})} />
              <input placeholder="Year"
                value={formData.year}
                onChange={e => setFormData({...formData, year: e.target.value})} />
              <input placeholder="Color"
                value={formData.color}
                onChange={e => setFormData({...formData, color: e.target.value})} />
              <input placeholder="Rent Per Day (PKR) — without driver & petrol"
                value={formData.rentPerDay}
                onChange={e => setFormData({...formData, rentPerDay: e.target.value})} />
              <input placeholder="With Driver (PKR/day)"
                value={formData.rentWithDriver}
                onChange={e => setFormData({...formData, rentWithDriver: e.target.value})} />
              <input placeholder="With Petrol (PKR/day)"
                value={formData.rentWithPetrol}
                onChange={e => setFormData({...formData, rentWithPetrol: e.target.value})} />
              <input placeholder="With Driver + Petrol (PKR/day)"
                value={formData.rentWithDriverAndPetrol}
                onChange={e => setFormData({...formData, rentWithDriverAndPetrol: e.target.value})} />
            </div>
            <textarea placeholder="Description, rules, requirements (CNIC, license, deposit, etc.)"
              value={formData.description}
              onChange={e => setFormData({...formData, description: e.target.value})} />
            <div className="rental-dash-upload-area">
              <label>📷 Upload Car Images (max 2)</label>
              <input type="file" multiple accept="image/*"
                onChange={e => setImages(Array.from(e.target.files).slice(0, 2))} />
              {images.length > 0 && (
                <p className="upload-count">✅ {images.length} image(s) selected</p>
              )}
            </div>
            <button className="rental-dash-submit-btn" onClick={handleAddCar}>
              Add to Fleet
            </button>
          </div>
        )}

        {/* INVENTORY / BOOKING SHEET */}
        {showInventory && (
          <div className="rental-inventory-sheet">
            <h3>📊 Booking & Revenue Sheet</h3>
            <div className="rental-inventory-summary">
              <div className="rental-inv-card">
                <h4>Total Fleet</h4>
                <span>{counts.all}</span>
              </div>
              <div className="rental-inv-card">
                <h4>Currently Rented</h4>
                <span>{counts.rented}</span>
              </div>
              <div className="rental-inv-card">
                <h4>Total Bookings</h4>
                <span>{transactions.length}</span>
              </div>
              <div className="rental-inv-card green">
                <h4>Total Revenue</h4>
                <span>PKR {totalRevenue.toLocaleString()}</span>
              </div>
            </div>
            <div className="rental-inventory-table-wrap">
              <table className="rental-inventory-table">
                <thead>
                  <tr>
                    <th>#</th>
                    <th>Transaction ID</th>
                    <th>Car</th>
                    <th>Rate/Day</th>
                    <th>Days</th>
                    <th>Total (PKR)</th>
                    <th>Renter</th>
                    <th>Phone</th>
                    <th>Date</th>
                  </tr>
                </thead>
                <tbody>
                  {transactions.length === 0 ? (
                    <tr>
                      <td colSpan="9" style={{textAlign:'center', color:'#888', padding:'24px'}}>
                        No bookings yet. Confirm a rental to see records here.
                      </td>
                    </tr>
                  ) : transactions.map((t, i) => (
                    <tr key={t.id}>
                      <td>{i + 1}</td>
                      <td><span className="rental-txn-id">{t.id}</span></td>
                      <td><strong>{t.brand} {t.model}</strong></td>
                      <td>PKR {Number(t.rentPerDay).toLocaleString()}</td>
                      <td>{t.days} days</td>
                      <td className="rental-txn-credit">
                        + PKR {Number(t.totalAmount).toLocaleString()}
                      </td>
                      <td>{t.renterName}</td>
                      <td>{t.renterPhone}</td>
                      <td>{new Date(t.confirmedAt).toLocaleDateString()}</td>
                    </tr>
                  ))}
                </tbody>
                {transactions.length > 0 && (
                  <tfoot>
                    <tr>
                      <td colSpan="5"><strong>Total Revenue</strong></td>
                      <td className="rental-txn-total">
                        PKR {totalRevenue.toLocaleString()}
                      </td>
                      <td colSpan="3"></td>
                    </tr>
                  </tfoot>
                )}
              </table>
            </div>
          </div>
        )}

        {/* TABS */}
        <div className="rental-dash-tabs">
          {['all','available','pending','rented'].map(tab => (
            <button key={tab}
              className={`rental-dash-tab ${activeTab === tab ? 'active' : ''}`}
              onClick={() => setActiveTab(tab)}>
              {tab.charAt(0).toUpperCase() + tab.slice(1)} ({counts[tab]})
            </button>
          ))}
        </div>

        {/* CARS GRID */}
        <div className="rental-dash-cars-grid">
          {filteredCars.map(car => (
            <div key={car.id} className="rental-dash-car-card">
              <div className="rental-dash-car-img">
                {car.images?.[0]
                  ? <img src={getImageSrc(car.images[0])} alt={car.model} />
                  : <div className="rental-dash-no-img">No Image</div>}
                <span className={`rental-dash-status-tag ${car.status}`}>{car.status}</span>
              </div>
              <div className="rental-dash-car-info">
                <h4>{car.brand} {car.model}</h4>
                <p className="rental-dash-car-price">
                  PKR {Number(car.rentPerDay).toLocaleString()}/day
                </p>
                <p className="rental-dash-car-detail">{car.year} • {car.color}</p>

                <div className="rental-price-tags">
                  {car.rentWithDriver && (
                    <span>🧑 PKR {Number(car.rentWithDriver).toLocaleString()}/day</span>
                  )}
                  {car.rentWithPetrol && (
                    <span>⛽ PKR {Number(car.rentWithPetrol).toLocaleString()}/day</span>
                  )}
                  {car.rentWithDriverAndPetrol && (
                    <span>🧑⛽ PKR {Number(car.rentWithDriverAndPetrol).toLocaleString()}/day</span>
                  )}
                </div>

                <p className="rental-dash-car-desc">{car.description}</p>

                {/* PENDING */}
                {car.status === 'pending' && (
                  <div className="rental-renter-box">
                    <h4>🔔 Rental Request Received</h4>
                    <p>👤 <strong>{car.renterName}</strong></p>
                    <p>📞 {car.renterPhone}</p>
                    <p>📅 {car.days} day(s)</p>
                    <p>💰 Total: PKR {(Number(car.rentPerDay) * Number(car.days)).toLocaleString()}</p>
                    <button className="rental-confirm-btn"
                      onClick={() => handleConfirmRental(car.id)}>
                      ✅ Confirm Rental & Generate Transaction ID
                    </button>
                  </div>
                )}

                {/* RENTED */}
                {car.status === 'rented' && car.transactionId && (
                  <div className="rental-rented-box">
                    <h4>✅ Currently Rented</h4>
                    <p>Renter: {car.renterName} | {car.days} days</p>
                    <p>TXN: <strong>{car.transactionId}</strong></p>
                    <button className="rental-return-btn"
                      onClick={() => handleMarkAvailable(car.id)}>
                      🔄 Mark as Available
                    </button>
                  </div>
                )}

                <button className="rental-dash-delete-btn"
                  onClick={() => handleDelete(car.id)}>
                  🗑 Remove
                </button>
              </div>
            </div>
          ))}

          {filteredCars.length === 0 && (
            <div className="rental-dash-empty">
              <div style={{fontSize:'48px', marginBottom:'16px'}}>🚙</div>
              <h3>No cars in fleet</h3>
              <p>Click "Add Rental Car" to add your first car</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export default RentalDashboard;
