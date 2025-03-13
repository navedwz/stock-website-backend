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

// ✅ Function to fetch real historical stock data from DSE
const fetchHistoricalData = async (tradingCode) => {
  try {
    console.log(`🔄 Fetching historical data for ${tradingCode}...`);
    const url = `https://dsebd.org/displayCompany.php?name=${tradingCode}`;
    const { data } = await axios.get(url);
    const $ = cheerio.load(data);

    let historicalData = [];

    // ✅ Ensure we correctly parse and clean data
    $('table.table-bordered tbody tr').each((index, element) => {
      const tds = $(element).find('td');
      if (tds.length >= 6) {
        let dateRaw = $(tds[0]).text().trim();
        let priceRaw = $(tds[1]).text().trim();

        // ✅ Convert date to proper format (YYYY-MM-DD)
        let dateParts = dateRaw.split('-');
        let formattedDate = `20${dateParts[2]}-${dateParts[1]}-${dateParts[0]}`; // Convert DD-MM-YY to YYYY-MM-DD

        // ✅ Ensure price is a number
        let price = parseFloat(priceRaw.replace(/,/g, ''));

        // ✅ Push only valid data
        if (!isNaN(price)) {
          historicalData.push({ date: formattedDate, price });
        }
      }
    });

    // ✅ Reverse array to ensure chronological order
    historicalData.reverse();

    return historicalData;
  } catch (error) {
    console.error(`❌ Error fetching historical data for ${tradingCode}:`, error);
    return [];
  }
};


// ✅ Initial Data Fetching at Startup
fetchStocksData();

// ✅ Route to Get Live Stock Data
app.get('/api/stocks', async (req, res) => {
  const currentTime = Date.now();

  if (cachedStocks.length === 0 || (currentTime - lastUpdatedStocks > STOCKS_CACHE_DURATION)) {
    await fetchStocksData();
  }

  if (cachedStocks.length === 0) {
    return res.status(500).json({ error: '❌ No stock data available' });
  }

  res.json(cachedStocks);
});

// ✅ Route to Get Real Historical Data
app.get('/api/stocks/history/:trading_code', async (req, res) => {
  const { trading_code } = req.params;

  const currentTime = Date.now();
  if (!cachedHistoricalData[trading_code] || (currentTime - lastUpdatedHistory > HISTORY_CACHE_DURATION)) {
    try {
      const data = await fetchHistoricalData(trading_code);
      cachedHistoricalData[trading_code] = data;
      lastUpdatedHistory = currentTime;
      console.log(`✅ Real historical data fetched for ${trading_code}`);
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
