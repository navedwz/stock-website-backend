const express = require('express');
const router = express.Router();
const axios = require('axios');
const cheerio = require('cheerio'); // Required for web scraping

router.get('/', async (req, res) => {
  try {
    const { data } = await axios.get('https://dsebd.org/latest_share_price_scroll_l.php');

    const $ = cheerio.load(data);
    const stocks = [];

    $('table.table.table-bordered.background-white.shares-table tbody tr').each((index, element) => {
      const row = $(element).find('td');

      const stock = {
        trading_code: $(row).find('td').eq(1).text().trim(),
        ltp: $(row).find('td').eq(2).text().trim(),
        high: $(row).find('td').eq(3).text().trim(),
        low: $(row).find('td').eq(4).text().trim(),
        closep: $(row).find('td').eq(4).text().trim(),
        ycp: $(row).find('td').eq(4).text().trim(),
        change: $(row).find('td').eq(5).text().trim(),
        trade: $(row).find('td').eq(4).text().trim(),
        volume: $(row).find('td').eq(5).text().trim(),
        value: $(row).find('td').eq(6).text().trim(),
      };

      stocks.push(stock);
    });

    res.json(stocks);
  } catch (error) {
    res.status(500).json({ message: "Error fetching data from DSE." });
  }
});

module.exports = router;
