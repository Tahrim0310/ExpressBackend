const express = require('express');
const cors = require('cors');
require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 1010;

// Middleware
app.use(cors({
  origin: '*',
  methods: ['GET', 'POST', 'PUT', 'DELETE'],
  allowedHeaders: ['Content-Type', 'Authorization']
}));
app.use(express.json());
app.use(express.urlencoded({ extended : true}));



const authRoutes = require('./routes/auth');
const listingRoutes = require('./routes/listings');
const reviewRoutes = require('./routes/reviews');
const favoriteRoutes = require('./routes/favorites');
const usersRoute = require('./routes/users');
const profileRoutes = require('./routes/profiles');

// Test route
app.get('/', (req, res) => {
  res.json({
    success: true,
    message: 'Welcome to Roommate Finder API',
    version: '1.0.0',
    endpoints: {
      auth: {
        register: 'POST /api/auth/register',
        login: 'POST /api/auth/login'
      },
      listings: {
        getAll: 'GET /api/listings',
        getOne: 'GET /api/listings/:id',
        create: 'POST /api/listings'
      },
      reviews: {
        create: 'POST /api/reviews',
        getByListing: 'GET /api/reviews/listing/:listingId',
        update: 'PUT /api/reviews/:reviewId',
        delete: 'DELETE /api/reviews/:reviewId',
        myReviews: 'GET /api/reviews/my-reviews'
      },
      favorites: {
        add: 'POST /api/favorites',
        getAll: 'GET /api/favorites',
        remove: 'DELETE /api/favorites/:listingId',
        check: 'GET /api/favorites/check/:listingId',
        count: 'GET /api/favorites/count'
      }
    }
  });
});

app.use('/api/users', usersRoute);
app.use('/api/auth', authRoutes);
app.use('/api/listings', listingRoutes);
app.use('/api/reviews', reviewRoutes);
app.use('/api/favorites', favoriteRoutes);
app.use('/api/profiles', profileRoutes);

app.use((req, res) => {
  res.status(404).json({
    success: false,
    message: 'Route not found'
  });
})

app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({
    success: false,
    message: 'Something went wrong!',
    error: process.env.NODE_ENV === 'development' ? err.message : undefined
  });
});

// Start server
app.listen(PORT, () => {
  console.log(`Server is running on port :  http://localhost:${PORT}`);
});