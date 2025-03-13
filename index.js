const express = require('express');
const cors = require('cors');
const stocksRoutes = require('./routes/stocks');

const app = express();
app.use(cors());
app.use(express.json());

// Add this root route
app.get('/', (req, res) => {
  res.send('Stock Website Backend API is running.');
});

app.use('/api/stocks', stocksRoutes);

const PORT = process.env.PORT || 5000;

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
