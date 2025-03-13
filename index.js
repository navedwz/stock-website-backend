const express = require('express');
const cors = require('cors');
const axios = require('axios');
const cheerio = require('cheerio');

const app = express();
app.use(cors());
app.use(express.json());

// Caching for historical data
let cachedHistoricalData = {};
let lastUpdatedHistory = 0;
const HISTORY_CACHE_DURATION = 10 * 60 * 1000; // 10 minutes

// ✅ Function to fetch real historical stock data from DSE
const fetchHistoricalData = async (tradingCode) => {
  try {
    console.log(`🔄 Fetching historical data for ${tradingCode}...`);
    const url = `https://dsebd.org/displayCompany.php?name=${tradingCode}`;
    const { data } = await axios.get(url);
    const $ = cheerio.load(data);

    let historicalData = [];

    $('table.table-bordered tbody tr').each((index, element) => {
      const tds = $(element).find('td');
      if (tds.length >= 6) {
        let dateRaw = $(tds[0]).text().trim();
        let priceRaw = $(tds[1]).text().trim();

        // Convert date to proper format (YYYY-MM-DD)
        let dateParts = dateRaw.split('-');
        let formattedDate = `20${dateParts[2]}-${dateParts[1]}-${dateParts[0]}`;

        // Ensure price is a number
        let price = parseFloat(priceRaw.replace(/,/g, ''));

        // Push only valid data
        if (!isNaN(price)) {
          historicalData.push({ date: formattedDate, price });
        }
      }
    });

    // Reverse array to ensure chronological order
    historicalData.reverse();
    return historicalData;
  } catch (error) {
    console.error(`❌ Error fetching historical data for ${tradingCode}:`, error);
    return [];
  }
};

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

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`✅ Backend running on port ${PORT}`);
});
