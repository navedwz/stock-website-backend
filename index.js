const express = require('express');
const cors = require('cors');
const axios = require('axios');
const cheerio = require('cheerio');

const app = express();
app.use(cors());
app.use(express.json());

// Caching for stock data
let cachedStocks = [];
let lastUpdatedStocks = 0;
const STOCKS_CACHE_DURATION = 5 * 60 * 1000; // 5 minutes

// Caching for historical data
let cachedHistoricalData = {};
let lastUpdatedHistory = 0;
const HISTORY_CACHE_DURATION = 10 * 60 * 1000; // 10 minutes

// ✅ Function to fetch live stock data from DSE
const fetchStocksData = async () => {
  try {
    console.log('🔄 Fetching fresh stock data...');
    const { data } = await axios.get('https://dsebd.org/latest_share_price_scroll_l.php');
    const $ = cheerio.load(data);
    const stocks = [];

    $('table.table.table-bordered.background-white.shares-table tbody tr').each((index, element) => {
      const tds = $(element).find('td');

      if (tds.length > 6) {
        const stock = {
          trading_code: $(tds[1]).text().trim(),
          ltp: $(tds[2]).text().trim(),
          high: $(tds[3]).text().trim(),
          low: $(tds[4]).text().trim(),
          closep: $(tds[5]).text().trim(),
          ycp: $(tds[6]).text().trim(),
          change: $(tds[7]).text().trim(),
          trade: $(tds[8]).text().trim(),
          volume: $(tds[9]).text().trim(),
          value: $(tds[10]).text().trim()
        };
        stocks.push(stock);
      }
    });

    cachedStocks = stocks;
    lastUpdatedStocks = Date.now();
    console.log(`✅ Stock data fetched successfully! ${stocks.length} stocks updated.`);
  } catch (error) {
    console.error('❌ Error fetching stock data:', error);
  }
};

// ✅ Function to fetch historical stock data
const fetchHistoricalData = async (tradingCode) => {
  // **Simulating historical data (Replace with real API later)**
  let fakeData = [];
  for (let i = 7; i >= 0; i--) {
    fakeData.push({
      date: new Date(Date.now() - i * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
      price: (Math.random() * 100 + 100).toFixed(2) // Fake price
    });
  }
  return fakeData;
};

// ✅ Initial Data Fetching at Startup
fetchStocksData();

// ✅ Route to Get Live Stock Data
app.get('/api/stocks', async (req, res) => {
  const currentTime = Date.now();

  // If cache expired or empty, refresh data
  if (cachedStocks.length === 0 || (currentTime - lastUpdatedStocks > STOCKS_CACHE_DURATION)) {
    await fetchStocksData();
  }

  if (cachedStocks.length === 0) {
    return res.status(500).json({ error: '❌ No stock data available' });
  }

  res.json(cachedStocks);
});

// ✅ Route to Get Historical Data for a Specific Stock
app.get('/api/stocks/history/:trading_code', async (req, res) => {
  const { trading_code } = req.params;

  const currentTime = Date.now();
  if (!cachedHistoricalData[trading_code] || (currentTime - lastUpdatedHistory > HISTORY_CACHE_DURATION)) {
    try {
      const data = await fetchHistoricalData(trading_code);
      cachedHistoricalData[trading_code] = data;
      lastUpdatedHistory = currentTime;
      console.log(`✅ Historical data generated for ${trading_code}`);
    } catch (error) {
      console.error(`❌ Error fetching historical data for ${trading_code}:`, error);
      return res.status(500).json({ error: 'Error fetching historical data' });
    }
  }

  res.json(cachedHistoricalData[trading_code]);
});

// ✅ Fix the Root Route (Health Check)
app.get('/', (req, res) => {
  res.send('✅ Stock API is Running!');
});

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`✅ Backend running on port ${PORT}`);
});
