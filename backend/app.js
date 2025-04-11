const express = require('express');
const app = express();
const cookieParser = require('cookie-parser')
const cors = require('cors')
const authRoutes = require('./routes/authRoutes');
const categoryRoutes = require('./routes/categoryRoutes');
const productRoutes = require('./routes/productRoutes');
const cartRoutes = require('./routes/cartRoutes');
const orderRoutes = require('./routes/orderRoutes');
const reviewRoutes = require('./routes/reviewRoutes');

// In app.js
app.use(cors());
app.get('/api/v1/test', (req, res) => {
  res.status(200).json({ status: 'Backend is working!' });
});
app.use(express.json({limit:'50mb'}));
app.use(express.urlencoded({limit: "50mb", extended: true }));
app.use(cookieParser());

app.use('/api/v1', authRoutes);
app.use('/api/v1', categoryRoutes);
app.use('/api/v1', productRoutes);
app.use('/api/v1', cartRoutes);
app.use('/api/v1', orderRoutes);
app.use('/api/v1', reviewRoutes);

module.exports = app