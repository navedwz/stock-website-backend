const express = require('express');
const router = express.Router();
const axios = require('axios');
const cheerio = require('cheerio');

router.get('/', async (req, res) => {
  try {
    const { data } = await axios.get('https://dsebd.org/latest_share_price_scroll_l.php');
    const $ = cheerio.load(data);

    const stocks = [];

    // Scrape real-time data clearly from official DSE site
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

    res.json(stocks);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Error fetching DSE data' });
  }
});

module.exports = router;
