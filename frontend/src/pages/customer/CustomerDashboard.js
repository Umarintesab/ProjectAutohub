import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import './Customer.css';

const getImageSrc = (img) => {
  if (!img) return null;
  return `http://localhost:5000/uploads/${img}`;
};

function CustomerDashboard() {
  const navigate = useNavigate();
  const [user, setUser] = useState(null);
  const [featuredCars, setFeaturedCars] = useState([]);
  const [featuredRentals, setFeaturedRentals] = useState([]);
  const [myBookings, setMyBookings] = useState([]);
  const [showBookings, setShowBookings] = useState(false);

  useEffect(() => {
    const stored = localStorage.getItem('user');
    if (!stored) { navigate('/login'); return; }
    const u = JSON.parse(stored);
    setUser(u);
    loadData(u.id);
  }, [navigate]);

  const loadData = async (userId) => {
    const carsRes = await axios.get('http://localhost:5000/api/cars');
    const rentalsRes = await axios.get('http://localhost:5000/api/rentals');

    const allCars = carsRes.data;
    const allRentals = rentalsRes.data;

    setFeaturedCars(allCars.filter(c => c.status === 'available').slice(0, 4));
    setFeaturedRentals(allRentals.filter(c => c.status === 'available').slice(0, 4));

    // My bookings — cars pending or sold with my buyerId
    const myCarBookings = allCars
      .filter(c => c.buyerId === userId && (c.status === 'pending' || c.status === 'sold'))
      .map(c => ({
        id: c.id,
        brand: c.brand,
        model: c.model,
        price: c.price,
        image: c.images?.[0],
        status: c.status,
        transactionId: c.transactionId || null,
        type: 'purchase'
      }));

    // My rental bookings
    const myRentalBookings = allRentals
      .filter(r => r.renterId === userId && (r.status === 'pending' || r.status === 'rented'))
      .map(r => ({
        id: r.id,
        brand: r.brand,
        model: r.model,
        price: r.rentPerDay,
        days: r.days,
        image: r.images?.[0],
        status: r.status,
        transactionId: r.transactionId || null,
        type: 'rental'
      }));

    setMyBookings([...myCarBookings, ...myRentalBookings]);
  };

  const handleLogout = () => { localStorage.removeItem('user'); navigate('/'); };

  return (
    <div className="dashboard-container">
      <nav className="dashboard-nav">
        <div className="nav-brand">
          <div className="nav-brand-icon">🚗</div>
          <h2>AUTOHUB</h2>
        </div>
        <div className="nav-links">
          <span onClick={() => navigate('/customer/authorized-dealers')}>New Cars</span>
          <span onClick={() => navigate('/customer/used-cars')}>Used Cars</span>
          <span onClick={() => navigate('/customer/rental-agencies')}>Rent a Car</span>
          <span onClick={() => setShowBookings(!showBookings)}
            style={{position:'relative'}}>
            📋 My Bookings
            {myBookings.length > 0 && (
              <span style={{
                position:'absolute', top:'-6px', right:'-6px',
                background:'#c62828', color:'white',
                borderRadius:'50%', width:'18px', height:'18px',
                fontSize:'10px', display:'flex', alignItems:'center',
                justifyContent:'center', fontWeight:'700'
              }}>{myBookings.length}</span>
            )}
          </span>
          <button onClick={handleLogout}>Logout</button>
        </div>
      </nav>

      {/* MY BOOKINGS PANEL */}
      {showBookings && (
        <div className="bookings-panel">
          <div className="bookings-panel-header">
            <h3>📋 My Bookings</h3>
            <button onClick={() => setShowBookings(false)}>✕</button>
          </div>
          {myBookings.length === 0 ? (
            <div className="bookings-empty">
              <p>No active bookings yet</p>
            </div>
          ) : (
            <div className="bookings-list">
              {myBookings.map(booking => (
                <div key={booking.id} className="booking-item">
                  <div className="booking-img">
                    {booking.image
                      ? <img src={getImageSrc(booking.image)} alt={booking.model} />
                      : <div className="booking-no-img">🚗</div>}
                  </div>
                  <div className="booking-info">
                    <h4>{booking.brand} {booking.model}</h4>
                    <p>{booking.type === 'rental'
                      ? `PKR ${Number(booking.price).toLocaleString()}/day × ${booking.days} days`
                      : `PKR ${Number(booking.price).toLocaleString()}`}
                    </p>
                    {booking.transactionId ? (
                      <div className="booking-confirmed">
                        <span>✅ Confirmed!</span>
                        <div className="booking-txn-id">
                          <small>Transaction ID</small>
                          <strong>{booking.transactionId}</strong>
                        </div>
                        <p className="booking-pay-note">
                          Pay using this ID at any bank or online banking
                        </p>
                      </div>
                    ) : (
                      <div className="booking-pending">
                        <span>⏳ Waiting for confirmation</span>
                        <button className="booking-refresh-btn"
                          onClick={() => loadData(user.id)}>
                          🔄 Refresh
                        </button>
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      <div className="dashboard-hero">
        <h1>Welcome, <span>{user?.name}</span> 👋</h1>
        <p>What are you looking for today?</p>
        <div className="hero-cards">
          <div className="hero-card" onClick={() => navigate('/customer/authorized-dealers')}>
            <h3>🏪 Buy New Car</h3>
            <p>Browse authorized dealers</p>
          </div>
          <div className="hero-card" onClick={() => navigate('/customer/used-cars')}>
            <h3>🔄 Buy Used Car</h3>
            <p>Find second-hand cars</p>
          </div>
          <div className="hero-card" onClick={() => navigate('/customer/rental-agencies')}>
            <h3>🚙 Rent a Car</h3>
            <p>Browse rental agencies</p>
          </div>
          {myBookings.length > 0 && (
            <div className="hero-card" onClick={() => setShowBookings(true)}
              style={{borderColor:'#66BB6A'}}>
              <h3>📋 My Bookings</h3>
              <p>{myBookings.length} active booking(s)</p>
            </div>
          )}
        </div>
      </div>

      {featuredCars.length > 0 && (
        <div className="featured-section">
          <div className="section-header">
            <h2>Featured <span>New Cars</span></h2>
            <a onClick={() => navigate('/customer/authorized-dealers')}>View All →</a>
          </div>
          <div className="cars-grid">
            {featuredCars.map(car => (
              <div key={car.id} className="car-card"
                onClick={() => navigate(`/customer/car/${car.id}`, { state: { type: car.type || 'new' } })}>
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
          </div>
        </div>
      )}

      {featuredRentals.length > 0 && (
        <div className="featured-section">
          <div className="section-header">
            <h2>Featured <span>Rental Cars</span></h2>
            <a onClick={() => navigate('/customer/rental-agencies')}>View All →</a>
          </div>
          <div className="cars-grid">
            {featuredRentals.map(car => (
              <div key={car.id} className="car-card"
                onClick={() => navigate(`/customer/car/${car.id}`, { state: { type: 'rental' } })}>
                <div className="car-card-img">
                  {car.images?.[0]
                    ? <img src={getImageSrc(car.images[0])} alt={car.model} />
                    : <div className="car-no-img">No Image</div>}
                </div>
                <div className="car-info">
                  <h4>{car.brand} {car.model}</h4>
                  <p className="car-price">PKR {Number(car.rentPerDay).toLocaleString()}/day</p>
                  <p className="car-detail">{car.year} • {car.color}</p>
                  <p className="car-desc">{car.description}</p>
                  <span className="car-click-hint">View Details →</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

export default CustomerDashboard;