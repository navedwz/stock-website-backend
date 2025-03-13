const express = require('express');
const cors = require('cors');
const axios = require('axios');
const cheerio = require('cheerio');
const stocksRoutes = require('./routes/stocks');

const app = express();
app.use(cors());
app.use(express.json());

// Caching variables clearly defined
let cachedStocks = [];
let lastUpdated = 0;
const CACHE_DURATION = 5 * 60 * 1000; // 5 minutes clearly defined

// Function clearly to fetch fresh data
const fetchStocksData = async () => {
  const { data } = await axios.get('https://dsebd.org/latest_share_price_scroll_l.php');
  const $ = cheerio.load(data);
  const stocks = [];

  $('table.table.table-bordered.background-white.shares-table tbody tr').each((index, element) => {
    const tds = $(element).find('td');
    const stock = {
      trading_code: $(tds[1]).text().trim(),
      ltp: $(tds[2]).text().trim(),
      high: $(tds[2]).text().trim(),
      low: $(tds[3]).text().trim(),
      closep: $(tds[4]).text().trim(),
      ycp: $(tds[5]).text().trim(),
      change: $(tds[6]).text().trim(),
      trade: $(tds[7]).text().trim(),
      volume: $(tds[8]).text().trim(),
      value: $(tds[9]).text().trim()
    };
    stocks.push(stock);
  });

  cachedStocks = stocks; // Clearly updating cache
  lastUpdated = Date.now();
};

// Initial data fetching at startup clearly
fetchStocksData();

// Clearly defined API route using cache
app.use('/api/stocks', async (req, res) => {
  const currentTime = Date.now();

  // Clearly checking if cache is outdated
  if (currentTime - lastUpdated > CACHE_DURATION || cachedStocks.length === 0) {
    try {
      await fetchStocksData();
      console.log('✅ Clearly fetched fresh data from DSE.');
    } catch (error) {
      console.error('❌ Error clearly fetching data:', error);
      return res.status(500).json({ error: 'Error fetching data from DSE.' });
    }
  } else {
    console.log('✅ Clearly serving cached data.');
  }

  res.json(cachedStocks); // Serving data clearly from cache
});

const PORT = process.env.PORT || 5000;

app.listen(PORT, () => {
  console.log(`✅ Backend running clearly on port ${PORT}`);
});
