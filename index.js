const express = require('express');
const cors = require('cors');
const axios = require('axios');
const cheerio = require('cheerio');

const app = express();
app.use(cors());
app.use(express.json());

// Caching variables for historical data
let cachedHistoricalData = {};
let lastUpdatedHistory = 0;
const HISTORY_CACHE_DURATION = 10 * 60 * 1000; // 10 minutes caching

// Function to fetch historical data (simulated for now)
const fetchHistoricalData = async (tradingCode) => {
  // ** Simulating historical data for now (Replace this with actual API) **
  let fakeData = [];
  for (let i = 7; i >= 0; i--) {
    fakeData.push({
      date: new Date(Date.now() - i * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
      price: (Math.random() * 100 + 100).toFixed(2), // Simulated price
    });
  }
  return fakeData;
};

// API to get historical data for a specific stock
app.get('/api/stocks/history/:trading_code', async (req, res) => {
  const { trading_code } = req.params;

  const currentTime = Date.now();
  if (!cachedHistoricalData[trading_code] || currentTime - lastUpdatedHistory > HISTORY_CACHE_DURATION) {
    try {
      const data = await fetchHistoricalData(trading_code);
      cachedHistoricalData[trading_code] = data;
      lastUpdatedHistory = currentTime;
      console.log(`✅ Fetched historical data for ${trading_code}`);
    } catch (error) {
      console.error('❌ Error fetching historical data:', error);
      return res.status(500).json({ error: 'Error fetching historical data' });
    }
  } else {
    console.log(`✅ Serving cached historical data for ${trading_code}`);
  }

  res.json(cachedHistoricalData[trading_code]);
});

// Existing API for live stock data (Unchanged)
app.get('/api/stocks', async (req, res) => {
  res.json(cachedStocks);
});

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`✅ Backend running on port ${PORT}`);
});
