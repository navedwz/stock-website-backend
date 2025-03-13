const express = require('express');
const cors = require('cors');
const axios = require('axios');
const cheerio = require('cheerio');

const app = express();
app.use(cors());
app.use(express.json());

// Caching variables for stock data
let cachedStocks = [];
let lastUpdated = 0;
const CACHE_DURATION = 5 * 60 * 1000; // 5 minutes caching

// ✅ Function to fetch live stock data from DSE website
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
    lastUpdated = Date.now();
    console.log(`✅ Stock data fetched successfully! ${stocks.length} stocks updated.`);
  } catch (error) {
    console.error('❌ Error fetching stock data:', error);
  }
};

// ✅ Fetch initial data on startup
fetchStocksData();

// ✅ Ensure API properly serves stock data
app.get('/api/stocks', async (req, res) => {
  const currentTime = Date.now();

  if (cachedStocks.length === 0 || (currentTime - lastUpdated > CACHE_DURATION)) {
    await fetchStocksData();
  }

  if (cachedStocks.length === 0) {
    return res.status(500).json({ error: '❌ No stock data available' });
  }

  res.json(cachedStocks);
});

// ✅ Fix the root route (Health Check)
app.get('/', (req, res) => {
  res.send('✅ Stock API is Running!');
});

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`✅ Backend running on port ${PORT}`);
});
