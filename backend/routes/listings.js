const express = require('express');
const router = express.Router();
const prisma = require('../utils/prisma');
const auth = require('../middleware/auth');

// =============================================
// API: CREATE LISTING
// =============================================
// Endpoint: POST /api/listings
// Headers: Authorization: Bearer <token>

router.post('/', auth, async (req, res) => {
  try {
    const { title, description, location, rent, type, images, amenities } = req.body;
    const userId = req.userId;

    const listing = await prisma.listing.create({
      data: {
        title,
        description,
        location,
        rent: parseFloat(rent),
        type,
        images: images || [],
        amenities: amenities || [],
        userId
      }
    });

    res.status(201).json({
      success: true,
      message: 'Listing created successfully',
      data: listing
    });

  } catch (error) {
    console.error('Error creating listing:', error);
    res.status(500).json({
      success: false,
      message: 'Server error',
      error: error.message
    });
  }
});

// =============================================
// API: GET ALL LISTINGS
// =============================================
// Endpoint: GET /api/listings

router.get('/', async (req, res) => {
  try {
    const listings = await prisma.listing.findMany({
      include: {
        user: {
          select: {
            id: true,
            name: true,
            email: true
          }
        },
        reviews: {
          select: {
            rating: true
          }
        }
      },
      orderBy: {
        createdAt: 'desc'
      }
    });

    // Calculate average rating for each listing
    const listingsWithRating = listings.map(listing => {
      const reviews = listing.reviews;
      const averageRating = reviews.length > 0
        ? reviews.reduce((sum, review) => sum + review.rating, 0) / reviews.length
        : 0;

      return {
        ...listing,
        averageRating: averageRating.toFixed(1),
        totalReviews: reviews.length,
        reviews: undefined
      };
    });

    res.json({
      success: true,
      data: listingsWithRating
    });

  } catch (error) {
    console.error('Error fetching listings:', error);
    res.status(500).json({
      success: false,
      message: 'Server error',
      error: error.message
    });
  }
});

// =============================================
// API: GET SINGLE LISTING
// =============================================
// Endpoint: GET /api/listings/:id

router.get('/:id', async (req, res) => {
  try {
    const { id } = req.params;

    const listing = await prisma.listing.findUnique({
      where: { id },
      include: {
        user: {
          select: {
            id: true,
            name: true,
            email: true,
            avatar: true
          }
        },
        reviews: {
          include: {
            user: {
              select: {
                id: true,
                name: true,
                avatar: true
              }
            }
          },
          orderBy: {
            createdAt: 'desc'
          }
        }
      }
    });

    if (!listing) {
      return res.status(404).json({
        success: false,
        message: 'Listing not found'
      });
    }

    // Calculate average rating
    const averageRating = listing.reviews.length > 0
      ? listing.reviews.reduce((sum, review) => sum + review.rating, 0) / listing.reviews.length
      : 0;

    res.json({
      success: true,
      data: {
        ...listing,
        averageRating: averageRating.toFixed(1),
        totalReviews: listing.reviews.length
      }
    });

  } catch (error) {
    console.error('Error fetching listing:', error);
    res.status(500).json({
      success: false,
      message: 'Server error',
      error: error.message
    });
  }
});

module.exports = router;
