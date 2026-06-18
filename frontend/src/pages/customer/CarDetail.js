import React, { useEffect, useState } from 'react';
import { useNavigate, useParams, useLocation } from 'react-router-dom';
import axios from 'axios';
import './CarDetail.css';

const getImageSrc = (img) => {
  if (!img) return null;
  return `${API_URL}/uploads/${img}`;
};

function CarDetail() {
  const { carId } = useParams();
  const navigate = useNavigate();
  const location = useLocation();
  const [car, setCar] = useState(null);
  const [selectedImg, setSelectedImg] = useState(0);
  const [showBuyForm, setShowBuyForm] = useState(false);
  const [showRentForm, setShowRentForm] = useState(false);
  const [buyForm, setBuyForm] = useState({ buyerName: '', buyerPhone: '' });
  const [rentForm, setRentForm] = useState({ renterName: '', renterPhone: '', days: '' });
  const [requestSent, setRequestSent] = useState(false);
  const [transactionId, setTransactionId] = useState(null);
  const [checking, setChecking] = useState(false);
  const type = location.state?.type || 'new';

  useEffect(() => {
    fetchCar();
  }, [carId, type]);

  const fetchCar = async () => {
    if (type === 'rental') {
      const res = await axios.get('${API_URL}/api/rentals');
      const found = res.data.find(c => c.id === carId);
      setCar(found);
      if (found?.transactionId) setTransactionId(found.transactionId);
    } else {
      const res = await axios.get('${API_URL}/api/cars');
      const found = res.data.find(c => c.id === carId);
      setCar(found);
      if (found?.transactionId) setTransactionId(found.transactionId);
    }
  };

  const handleBuy = async () => {
    const user = JSON.parse(localStorage.getItem('user'));
    await axios.post(`${API_URL}/api/cars/buy/${car.id}`, {
      buyerId: user.id,
      buyerName: buyForm.buyerName,
      buyerPhone: buyForm.buyerPhone
    });
    setRequestSent(true);
    setShowBuyForm(false);
    fetchCar();
  };

  const handleRent = async () => {
    const user = JSON.parse(localStorage.getItem('user'));
    await axios.post(`${API_URL}/api/rentals/rent/${car.id}`, {
      renterId: user.id,
      renterName: rentForm.renterName,
      renterPhone: rentForm.renterPhone,
      days: rentForm.days
    });
    setRequestSent(true);
    setShowRentForm(false);
    fetchCar();
  };

  const checkTransaction = async () => {
    setChecking(true);
    try {
      if (type === 'rental') {
        const res = await axios.get(`${API_URL}/api/rentals/check-transaction/${carId}`);
        if (res.data.transactionId) setTransactionId(res.data.transactionId);
      } else {
        const res = await axios.get(`${API_URL}/api/cars/check-transaction/${carId}`);
        if (res.data.transactionId) setTransactionId(res.data.transactionId);
      }
    } catch (e) {}
    setChecking(false);
  };

  if (!car) return (
    <div className="detail-loading">
      <div className="detail-loading-spinner">🚗</div>
      <p>Loading car details...</p>
    </div>
  );

  const totalRentAmount = type === 'rental' && rentForm.days
    ? Number(car.rentPerDay) * Number(rentForm.days)
    : null;

  return (
    <div className="detail-container">
      {/* HEADER */}
      <div className="detail-header">
        <button className="back-btn" onClick={() => navigate(-1)}>← Back</button>
        <div className="detail-header-title">
          <h2>{car.brand} {car.model}</h2>
          <span className="detail-header-year">{car.year}</span>
        </div>
        <span className={`status-badge ${car.status}`}>{car.status}</span>
      </div>

      <div className="detail-body">
        {/* LEFT — images */}
        <div className="detail-left">
          <div className="detail-main-img">
            {car.images?.[selectedImg] ? (
              <img src={getImageSrc(car.images[selectedImg])} alt={car.model} />
            ) : (
              <div className="no-image">
                <span>🚗</span>
                <p>No Image Available</p>
              </div>
            )}
            {car.images?.length > 1 && (
              <div className="detail-img-counter">
                {selectedImg + 1} / {car.images.length}
              </div>
            )}
          </div>

          {car.images?.length > 1 && (
            <div className="detail-thumbnails">
              {car.images.map((img, i) => (
                <img key={i} src={getImageSrc(img)} alt="thumb"
                  className={selectedImg === i ? 'active' : ''}
                  onClick={() => setSelectedImg(i)} />
              ))}
            </div>
          )}

          {/* KEY HIGHLIGHTS */}
          <div className="detail-highlights">
            <h3>🔑 Key Highlights</h3>
            <div className="highlights-grid">
              <div className="highlight-item">
                <span className="highlight-icon">📅</span>
                <div>
                  <p>Year</p>
                  <strong>{car.year}</strong>
                </div>
              </div>
              <div className="highlight-item">
                <span className="highlight-icon">🎨</span>
                <div>
                  <p>Color</p>
                  <strong>{car.color}</strong>
                </div>
              </div>
              <div className="highlight-item">
                <span className="highlight-icon">🚗</span>
                <div>
                  <p>Brand</p>
                  <strong>{car.brand}</strong>
                </div>
              </div>
              <div className="highlight-item">
                <span className="highlight-icon">📋</span>
                <div>
                  <p>Type</p>
                  <strong>{type === 'rental' ? 'Rental' : type === 'used' ? 'Used Car' : 'New Car'}</strong>
                </div>
              </div>
            </div>
          </div>

          {/* DESCRIPTION */}
          {car.description && (
            <div className="detail-desc-box">
              <h3>📝 Description</h3>
              <p>{car.description}</p>
            </div>
          )}
        </div>

        {/* RIGHT — pricing & actions */}
        <div className="detail-right">
          <div className="detail-specs">

            {/* CAR NAME & PRICE */}
            <div className="detail-name-price">
              <h3>{car.brand} {car.model} {car.year}</h3>
              {type !== 'rental' && (
                <div className="detail-price">
                  PKR {Number(car.price).toLocaleString()}
                </div>
              )}
            </div>

            {/* RENTAL PRICING TABLE */}
            {type === 'rental' && (
              <div className="rental-pricing-section">
                <h4>💰 Rental Pricing</h4>
                <div className="rental-prices">
                  <div className="rental-price-item highlight">
                    <span>🚗 Without Driver & Petrol</span>
                    <strong>PKR {Number(car.rentPerDay).toLocaleString()}/day</strong>
                  </div>
                  {car.rentWithDriver && (
                    <div className="rental-price-item">
                      <span>🧑 With Driver</span>
                      <strong>PKR {Number(car.rentWithDriver).toLocaleString()}/day</strong>
                    </div>
                  )}
                  {car.rentWithPetrol && (
                    <div className="rental-price-item">
                      <span>⛽ With Petrol</span>
                      <strong>PKR {Number(car.rentWithPetrol).toLocaleString()}/day</strong>
                    </div>
                  )}
                  {car.rentWithDriverAndPetrol && (
                    <div className="rental-price-item">
                      <span>🧑⛽ With Driver + Petrol</span>
                      <strong>PKR {Number(car.rentWithDriverAndPetrol).toLocaleString()}/day</strong>
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* SPEC GRID */}
            <div className="spec-section">
              <h4>📊 Specifications</h4>
              <div className="spec-grid">
                <div className="spec-item">
                  <span>Brand</span>
                  <strong>{car.brand}</strong>
                </div>
                <div className="spec-item">
                  <span>Model</span>
                  <strong>{car.model}</strong>
                </div>
                <div className="spec-item">
                  <span>Year</span>
                  <strong>{car.year}</strong>
                </div>
                <div className="spec-item">
                  <span>Color</span>
                  <strong>{car.color}</strong>
                </div>
                <div className="spec-item">
                  <span>Type</span>
                  <strong>{type === 'rental' ? 'Rental' : type === 'used' ? 'Used' : 'New'}</strong>
                </div>
                <div className="spec-item">
                  <span>Status</span>
                  <strong className={car.status}>{car.status}</strong>
                </div>
              </div>
            </div>

            {/* TRANSACTION CONFIRMED */}
            {transactionId && (
              <div className="transaction-confirmed">
                <div className="transaction-confirmed-icon">✅</div>
                <h4>Booking Confirmed!</h4>
                <p>Your {type === 'rental' ? 'rental' : 'purchase'} has been confirmed.</p>
                <div className="transaction-id-box">
                  <span>Transaction ID</span>
                  <strong>{transactionId}</strong>
                </div>
                <p className="transaction-note">
                  💳 Pay this amount at any bank or online banking using the Transaction ID above.
                </p>
              </div>
            )}

            {/* REQUEST SENT — WAITING */}
            {(requestSent || car.status === 'pending') && !transactionId && (
              <div className="request-pending-box">
                <div className="pending-icon">⏳</div>
                <h4>Request Sent!</h4>
                <p>Waiting for {type === 'rental' ? 'agency' : 'dealer'} to confirm.</p>
                <p>Once confirmed, your Transaction ID will appear here.</p>
                <button className="check-status-btn" onClick={checkTransaction} disabled={checking}>
                  {checking ? '🔄 Checking...' : '🔄 Check Status'}
                </button>
              </div>
            )}

            {/* BUY BUTTON */}
            {!requestSent && !transactionId && type !== 'rental' && car.status === 'available' && (
              <div className="action-section">
                <button className="btn-action" onClick={() => setShowBuyForm(!showBuyForm)}>
                  {showBuyForm ? '✕ Cancel' : '🛒 Buy Now'}
                </button>
                {showBuyForm && (
                  <div className="action-form">
                    <h4>Fill Your Details</h4>
                    <input placeholder="Your Full Name"
                      onChange={e => setBuyForm({...buyForm, buyerName: e.target.value})} />
                    <input placeholder="Your Phone Number"
                      onChange={e => setBuyForm({...buyForm, buyerPhone: e.target.value})} />
                    <div className="action-summary">
                      <span>Total Amount</span>
                      <strong>PKR {Number(car.price).toLocaleString()}</strong>
                    </div>
                    <button className="btn-action" onClick={handleBuy}>
                      Send Purchase Request
                    </button>
                  </div>
                )}
              </div>
            )}

            {/* RENT BUTTON */}
            {!requestSent && !transactionId && type === 'rental' && car.status === 'available' && (
              <div className="action-section">
                <button className="btn-action" onClick={() => setShowRentForm(!showRentForm)}>
                  {showRentForm ? '✕ Cancel' : '🚗 Rent Now'}
                </button>
                {showRentForm && (
                  <div className="action-form">
                    <h4>Fill Your Details</h4>
                    <input placeholder="Your Full Name"
                      onChange={e => setRentForm({...rentForm, renterName: e.target.value})} />
                    <input placeholder="Your Phone Number"
                      onChange={e => setRentForm({...rentForm, renterPhone: e.target.value})} />
                    <input placeholder="Number of Days" type="number" min="1"
                      onChange={e => setRentForm({...rentForm, days: e.target.value})} />
                    {rentForm.days && (
                      <div className="action-summary">
                        <span>Total Amount ({rentForm.days} days)</span>
                        <strong>PKR {(Number(car.rentPerDay) * Number(rentForm.days)).toLocaleString()}</strong>
                      </div>
                    )}
                    <button className="btn-action" onClick={handleRent}>
                      Send Rental Request
                    </button>
                  </div>
                )}
              </div>
            )}

            {/* UNAVAILABLE */}
            {type === 'rental' && car.status === 'rented' && !transactionId && (
              <div className="unavailable-badge">
                🔴 This car is currently rented out
              </div>
            )}

            {type !== 'rental' && car.status === 'sold' && !transactionId && (
              <div className="unavailable-badge">
                🔴 This car has already been sold
              </div>
            )}

          </div>

          {/* CONTACT INFO BOX */}
          <div className="detail-contact-box">
            <h4>📞 Need Help?</h4>
            <p>Contact AutoHub support for any queries regarding this listing.</p>
            <div className="contact-tags">
              <span>✅ Verified Listing</span>
              <span>🔒 Secure Transaction</span>
              <span>📋 Original Documents</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default CarDetail;
