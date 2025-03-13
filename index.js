const express = require('express');
const cors = require('cors');
const stocksRoutes = require('./routes/stocks');

const app = express();
app.use(cors());
app.use(express.json());

app.use('/api/stocks', stocksRoutes);

const PORT = process.env.PORT || 5000;

app.listen(PORT, () => {
  console.log(`Backend running on port ${PORT}`);
});
