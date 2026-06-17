import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import './Dealer.css';

const getImageSrc = (img) => {
  if (!img) return null;
  return `$env:REACT_APP_API_URL/uploads/${img}`;
};

function DealerDashboard() {
  const navigate = useNavigate();
  const [user, setUser] = useState(null);
  const [cars, setCars] = useState([]);
  const [transactions, setTransactions] = useState([]);
  const [showAddForm, setShowAddForm] = useState(false);
  const [showInventory, setShowInventory] = useState(false);
  const [formData, setFormData] = useState({
    model: '', year: '', color: '', price: '', description: ''
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

  const loadCars = (sellerId) => {
    axios.get(`$env:REACT_APP_API_URL/api/cars/seller/${sellerId}`).then(res => {
      setCars(res.data);
      const pending = res.data.find(c => c.status === 'pending');
      if (pending) setNotification(pending);
    });
  };

  const loadTransactions = (sellerId) => {
    axios.get(`$env:REACT_APP_API_URL/api/cars/transactions/${sellerId}`).then(res => {
      setTransactions(res.data);
    });
  };

  const handleAddCar = async () => {
    const data = new FormData();
    data.append('brand', user.brandName);
    data.append('sellerId', user.id);
    data.append('type', 'new');
    Object.keys(formData).forEach(k => data.append(k, formData[k]));
    images.forEach(img => data.append('images', img));
    await axios.post('$env:REACT_APP_API_URL/api/cars/add', data);
    setShowAddForm(false);
    setFormData({ model: '', year: '', color: '', price: '', description: '' });
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
    loadTransactions(user.id);
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

  return (
    <div className="dealer-container">
      {/* NAVBAR */}
      <nav className="dealer-nav">
        <div className="dealer-nav-brand">
          <div className="dealer-nav-icon">🚗</div>
          <h2>AUTOHUB</h2>
        </div>
        <div className="dealer-nav-right">
          <span className="dealer-nav-name">👤 {user?.name}</span>
          <span className="dealer-nav-badge">{user?.brandName} Dealer</span>
          <button className="dealer-logout-btn" onClick={handleLogout}>Logout</button>
        </div>
      </nav>

      {/* NOTIFICATION */}
      {notification && (
        <div className="dealer-notification">
          <div className="dealer-notification-left">
            <span className="notif-icon">🔔</span>
            <div>
              <h4>New Purchase Request!</h4>
              <p>Someone wants to buy your <strong>{notification.brand} {notification.model}</strong></p>
              <p style={{fontSize:'12px', color:'#888', marginTop:'2px'}}>
                Buyer: {notification.buyerName} | {notification.buyerPhone}
              </p>
            </div>
          </div>
          <div className="dealer-notification-actions">
            <button className="btn-confirm-sale" onClick={() => handleConfirmSale(notification.id)}>
              ✅ Confirm Sale
            </button>
            <button className="btn-dismiss" onClick={() => setNotification(null)}>Dismiss</button>
          </div>
        </div>
      )}

      {/* HERO */}
      <div className="dealer-hero">
        <div className="dealer-hero-left">
          <h1>Welcome, <span>{user?.name}</span></h1>
          <p>{user?.brandName} Authorized Dealer Dashboard</p>
          <div className="dealer-stats-row">
            <div className="dealer-stat-box">
              <h3>{counts.all}</h3>
              <p>Total Cars</p>
            </div>
            <div className="dealer-stat-box">
              <h3>{counts.available}</h3>
              <p>Available</p>
            </div>
            <div className="dealer-stat-box">
              <h3>{counts.pending}</h3>
              <p>Pending</p>
            </div>
            <div className="dealer-stat-box">
              <h3>{counts.sold}</h3>
              <p>Sold</p>
            </div>
            <div className="dealer-stat-box">
              <h3>{transactions.length}</h3>
              <p>Transactions</p>
            </div>
          </div>
        </div>
        <div style={{display:'flex', gap:'12px', flexDirection:'column', alignItems:'flex-end'}}>
          <button className="dealer-add-btn" onClick={() => { setShowAddForm(!showAddForm); setShowInventory(false); }}>
            {showAddForm ? '✕ Cancel' : '+ Add New Car'}
          </button>
          <button className="dealer-inventory-btn" onClick={() => { setShowInventory(!showInventory); setShowAddForm(false); }}>
            {showInventory ? '✕ Close Sheet' : '📊 Inventory Sheet'}
          </button>
        </div>
      </div>

      <div className="dealer-content">

        {/* ADD FORM */}
        {showAddForm && (
          <div className="dealer-add-form">
            <h3>🚗 Add New {user?.brandName} Car</h3>
            <div className="dealer-form-grid">
              <input placeholder="Model (e.g. Corolla)"
                value={formData.model}
                onChange={e => setFormData({...formData, model: e.target.value})} />
              <input placeholder="Year (e.g. 2025)"
                value={formData.year}
                onChange={e => setFormData({...formData, year: e.target.value})} />
              <input placeholder="Color"
                value={formData.color}
                onChange={e => setFormData({...formData, color: e.target.value})} />
              <input placeholder="Price (PKR)"
                value={formData.price}
                onChange={e => setFormData({...formData, price: e.target.value})} />
            </div>
            <textarea placeholder="Description..."
              value={formData.description}
              onChange={e => setFormData({...formData, description: e.target.value})} />
            <div className="dealer-upload-area">
              <label>📷 Upload Car Images (max 2)</label>
              <input type="file" multiple accept="image/*"
                onChange={e => setImages(Array.from(e.target.files).slice(0, 2))} />
              {images.length > 0 && <p className="upload-count">✅ {images.length} image(s) selected</p>}
            </div>
            <button className="dealer-submit-btn" onClick={handleAddCar}>Add Car</button>
          </div>
        )}

        {/* INVENTORY SHEET */}
        {showInventory && (
          <div className="inventory-sheet">
            <h3>📊 Inventory & Transaction Sheet</h3>
            <div className="inventory-summary">
              <div className="inv-summary-card">
                <h4>Total Cars Listed</h4>
                <span>{counts.all}</span>
              </div>
              <div className="inv-summary-card">
                <h4>Cars Sold</h4>
                <span>{counts.sold}</span>
              </div>
              <div className="inv-summary-card">
                <h4>Pending Orders</h4>
                <span>{counts.pending}</span>
              </div>
              <div className="inv-summary-card green">
                <h4>Total Revenue</h4>
                <span>PKR {transactions.reduce((sum, t) => sum + Number(t.price || 0), 0).toLocaleString()}</span>
              </div>
            </div>
            <div className="inventory-table-wrap">
              <table className="inventory-table">
                <thead>
                  <tr>
                    <th>#</th>
                    <th>Transaction ID</th>
                    <th>Car</th>
                    <th>Credit (PKR)</th>
                    <th>Buyer Name</th>
                    <th>Buyer Phone</th>
                    <th>Date</th>
                    <th>Status</th>
                  </tr>
                </thead>
                <tbody>
                  {transactions.length === 0 ? (
                    <tr>
                      <td colSpan="8" style={{textAlign:'center', color:'#888', padding:'24px'}}>
                        No transactions yet. Confirm a sale to see records here.
                      </td>
                    </tr>
                  ) : transactions.map((t, i) => (
                    <tr key={t.id}>
                      <td>{i + 1}</td>
                      <td><span className="txn-id">{t.id}</span></td>
                      <td><strong>{t.brand} {t.model}</strong></td>
                      <td className="txn-credit">+ {Number(t.price).toLocaleString()}</td>
                      <td>{t.buyerName}</td>
                      <td>{t.buyerPhone}</td>
                      <td>{new Date(t.confirmedAt).toLocaleDateString()}</td>
                      <td><span className="txn-type-badge">✅ Sold</span></td>
                    </tr>
                  ))}
                </tbody>
                {transactions.length > 0 && (
                  <tfoot>
                    <tr>
                      <td colSpan="3"><strong>Total Revenue</strong></td>
                      <td className="txn-total">
                        PKR {transactions.reduce((sum, t) => sum + Number(t.price || 0), 0).toLocaleString()}
                      </td>
                      <td colSpan="4"></td>
                    </tr>
                  </tfoot>
                )}
              </table>
            </div>
          </div>
        )}

        {/* TABS */}
        <div className="dealer-tabs">
          {['all','available','pending','sold'].map(tab => (
            <button key={tab}
              className={`dealer-tab ${activeTab === tab ? 'active' : ''}`}
              onClick={() => setActiveTab(tab)}>
              {tab.charAt(0).toUpperCase() + tab.slice(1)} ({counts[tab]})
            </button>
          ))}
        </div>

        {/* CARS GRID */}
        <div className="dealer-cars-grid">
          {filteredCars.map(car => (
            <div key={car.id} className="dealer-car-card">
              <div className="dealer-car-img">
                {car.images?.[0]
                  ? <img src={getImageSrc(car.images[0])} alt={car.model} />
                  : <div className="dealer-no-img">No Image</div>}
                <span className={`dealer-status-tag ${car.status}`}>{car.status}</span>
              </div>
              <div className="dealer-car-info">
                <h4>{car.brand} {car.model}</h4>
                <p className="dealer-car-price">PKR {car.price ? Number(car.price).toLocaleString() : '0'}</p>
                <p className="dealer-car-detail">{car.year} • {car.color}</p>
                <p className="dealer-car-desc">{car.description}</p>
                {car.status === 'pending' && (
                  <div className="dealer-buyer-info">
                    <p>👤 {car.buyerName}</p>
                    <p>📞 {car.buyerPhone}</p>
                    <button className="btn-confirm-sale" style={{marginTop:'8px', width:'100%'}}
                      onClick={() => handleConfirmSale(car.id)}>
                      ✅ Confirm Sale
                    </button>
                  </div>
                )}
                {car.status === 'sold' && car.transactionId && (
                  <div className="dealer-txn-info">
                    <p>🧾 TXN: {car.transactionId}</p>
                  </div>
                )}
                <button className="dealer-delete-btn" onClick={() => handleDelete(car.id)}>🗑 Delete</button>
              </div>
            </div>
          ))}
          {filteredCars.length === 0 && (
            <div className="dealer-empty">
              <h3>No cars found</h3>
              <p>Click "Add New Car" to list your first car</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export default DealerDashboard;
