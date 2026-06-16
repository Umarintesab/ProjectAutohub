const express = require('express');
const cors = require('cors');
const path = require('path');
const https = require('https');
const http = require('http');

const app = express();

app.use(cors());
app.use(express.json());
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

// IMAGE PROXY
app.get('/proxy-image', (req, res) => {
  const imageUrl = req.query.url;
  if (!imageUrl) return res.status(400).send('No URL');

  let responseSent = false;

  const fetchImage = (url, redirectCount = 0) => {
    if (redirectCount > 5) {
      if (!responseSent) { responseSent = true; res.status(500).send('Too many redirects'); }
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
          if (!responseSent) { responseSent = true; res.status(500).send('No redirect location'); }
          return;
        }
        const fullRedirect = redirectUrl.startsWith('http') ? redirectUrl : `https://images.unsplash.com${redirectUrl}`;
        imgRes.resume();
        return fetchImage(fullRedirect, redirectCount + 1);
      }

      if (imgRes.statusCode !== 200) {
        if (!responseSent) { responseSent = true; res.status(imgRes.statusCode).send('Failed'); }
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
      if (!responseSent) { responseSent = true; res.status(500).send('Error'); }
    });

    request.on('timeout', () => {
      request.destroy();
      if (!responseSent) { responseSent = true; res.status(504).send('Timeout'); }
    });

    request.setTimeout(10000);
  };

  fetchImage(imageUrl);
});

const authRoutes = require('./routes/auth');
const carRoutes = require('./routes/cars');
const rentalRoutes = require('./routes/rentals');

app.use('/api/auth', authRoutes);
app.use('/api/cars', carRoutes);
app.use('/api/rentals', rentalRoutes);

app.listen(5000, () => {
  console.log('Server running on port 5000');
});