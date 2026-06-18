const express = require('express');
const cors = require('cors');
const path = require('path');
const https = require('https');
const http = require('http');

const app = express();

// CORS - Allow your frontend
app.use(cors({
  origin: [
    'http://localhost:3000',
    'http://localhost:5000',
    'https://autohubbb.netlify.app',
    'https://projectautohub-production-2c65.up.railway.app'
  ],
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE'],
  allowedHeaders: ['Content-Type', 'Authorization']
}));

app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

// IMAGE PROXY
app.get('/proxy-image', (req, res) => {
  const imageUrl = req.query.url;
  if (!imageUrl) {
    return res.status(400).json({ error: 'No URL provided' });
  }

  let responseSent = false;

  const fetchImage = (url, redirectCount = 0) => {
    if (redirectCount > 5) {
      if (!responseSent) {
        responseSent = true;
        res.status(500).json({ error: 'Too many redirects' });
      }
      return;
    }

    const protocol = url.startsWith('https') ? https : http;
    
    const request = protocol.get(url, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 Chrome/91.0.4472.124 Safari/537.36',
        'Accept': 'image/webp,image/apng,image/*,*/*;q=0.8',
        'Referer': 'https://www.google.com/'
      }
    }, (imgRes) => {
      if (imgRes.statusCode === 301 || imgRes.statusCode === 302 || imgRes.statusCode === 307) {
        const redirectUrl = imgRes.headers.location;
        if (!redirectUrl) {
          if (!responseSent) {
            responseSent = true;
            res.status(500).json({ error: 'No redirect location' });
          }
          return;
        }
        const fullRedirect = redirectUrl.startsWith('http') ? redirectUrl : `https://images.unsplash.com${redirectUrl}`;
        imgRes.resume();
        return fetchImage(fullRedirect, redirectCount + 1);
      }

      if (imgRes.statusCode !== 200) {
        if (!responseSent) {
          responseSent = true;
          res.status(imgRes.statusCode).json({ error: 'Failed to fetch image' });
        }
        return;
      }

      if (!responseSent) {
        responseSent = true;
        res.setHeader('Content-Type', imgRes.headers['content-type'] || 'image/jpeg');
        res.setHeader('Access-Control-Allow-Origin', '*');
        res.setHeader('Cache-Control', 'public, max-age=86400');
        imgRes.pipe(res);
      }
    });

    request.on('error', (err) => {
      console.error('Proxy error:', err.message);
      if (!responseSent) {
        responseSent = true;
        res.status(500).json({ error: 'Proxy error' });
      }
    });

    request.on('timeout', () => {
      request.destroy();
      if (!responseSent) {
        responseSent = true;
        res.status(504).json({ error: 'Timeout' });
      }
    });

    request.setTimeout(10000);
  };

  fetchImage(imageUrl);
});

// Routes
const authRoutes = require('./routes/auth');
const carRoutes = require('./routes/cars');
const rentalRoutes = require('./routes/rentals');

app.use('/api/auth', authRoutes);
app.use('/api/cars', carRoutes);
app.use('/api/rentals', rentalRoutes);

// Health check endpoint
app.get('/health', (req, res) => {
  res.status(200).json({ 
    status: 'OK', 
    message: 'Server is running',
    timestamp: new Date().toISOString()
  });
});

// 404 handler
app.use((req, res) => {
  res.status(404).json({ error: 'Route not found' });
});

// Error handler
app.use((err, req, res, next) => {
  console.error('Error:', err.message);
  res.status(500).json({ error: 'Internal server error' });
});

// Dynamic port for Railway
const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`✅ Server running on port ${PORT}`);
  console.log(`📍 Environment: ${process.env.NODE_ENV || 'development'}`);
});

module.exports = app;