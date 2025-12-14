const express = require('express');
const router = express.Router();
const prisma = require('../utils/prisma');
const auth = require('../middleware/auth');

// =============================================
// API 1: ADD TO FAVORITES
// =============================================
// Endpoint: POST /api/favorites
// Headers: Authorization: Bearer <token>
// Body: { "listingId": "string" }

router.post('/', auth, async (req, res) => {
  try {
    const { listingId } = req.body;
    const userId = req.userId;

    // Validation
    if (!listingId) {
      return res.status(400).json({
        success: false,
        message: 'Please provide listingId'
      });
    }

    // Check if listing exists
    const listing = await prisma.listing.findUnique({
      where: { id: listingId }
    });

    if (!listing) {
      return res.status(404).json({
        success: false,
        message: 'Listing not found'
      });
    }

    // Check if already in favorites
    const existingFavorite = await prisma.favorite.findFirst({
      where: {
        userId: userId,
        listingId: listingId
      }
    });

    if (existingFavorite) {
      return res.status(400).json({
        success: false,
        message: 'Listing already in favorites'
      });
    }

    // Add to favorites
    const favorite = await prisma.favorite.create({
      data: {
        userId,
        listingId
      },
      include: {
        listing: {
          include: {
            user: {
              select: {
                id: true,
                name: true,
                email: true
              }
            }
          }
        }
      }
    });

    res.status(201).json({
      success: true,
      message: 'Added to favorites successfully',
      data: favorite
    });

  } catch (error) {
    console.error('Error adding to favorites:', error);
    res.status(500).json({
      success: false,
      message: 'Server error',
      error: error.message
    });
  }
});

// =============================================
// API 2: GET ALL FAVORITES
// =============================================
// Endpoint: GET /api/favorites
// Headers: Authorization: Bearer <token>

router.get('/', auth, async (req, res) => {
  try {
    const userId = req.userId;

    const favorites = await prisma.favorite.findMany({
      where: { userId },
      include: {
        listing: {
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
              select: {
                rating: true
              }
            }
          }
        }
      },
      orderBy: {
        createdAt: 'desc'
      }
    });

    // Calculate average rating for each listing
    const favoritesWithRating = favorites.map(fav => {
      const reviews = fav.listing.reviews;
      const averageRating = reviews.length > 0
        ? reviews.reduce((sum, review) => sum + review.rating, 0) / reviews.length
        : 0;

      return {
        ...fav,
        listing: {
          ...fav.listing,
          averageRating: averageRating.toFixed(1),
          totalReviews: reviews.length,
          reviews: undefined // Remove reviews array from response
        }
      };
    });

    res.json({
      success: true,
      data: favoritesWithRating,
      total: favoritesWithRating.length
    });

  } catch (error) {
    console.error('Error fetching favorites:', error);
    res.status(500).json({
      success: false,
      message: 'Server error',
      error: error.message
    });
  }
});

// =============================================
// API 3: REMOVE FROM FAVORITES
// =============================================
// Endpoint: DELETE /api/favorites/:listingId
// Headers: Authorization: Bearer <token>

router.delete('/:listingId', auth, async (req, res) => {
  try {
    const { listingId } = req.params;
    const userId = req.userId;

    // Find and delete favorite
    const favorite = await prisma.favorite.findFirst({
      where: {
        userId: userId,
        listingId: listingId
      }
    });

    if (!favorite) {
      return res.status(404).json({
        success: false,
        message: 'Favorite not found'
      });
    }

    await prisma.favorite.delete({
      where: { id: favorite.id }
    });

    res.json({
      success: true,
      message: 'Removed from favorites successfully'
    });

  } catch (error) {
    console.error('Error removing from favorites:', error);
    res.status(500).json({
      success: false,
      message: 'Server error',
      error: error.message
    });
  }
});

// =============================================
// API 4: CHECK IF LISTING IS FAVORITED
// =============================================
// Endpoint: GET /api/favorites/check/:listingId
// Headers: Authorization: Bearer <token>

router.get('/check/:listingId', auth, async (req, res) => {
  try {
    const { listingId } = req.params;
    const userId = req.userId;

    const favorite = await prisma.favorite.findFirst({
      where: {
        userId: userId,
        listingId: listingId
      }
    });

    res.json({
      success: true,
      isFavorited: !!favorite
    });

  } catch (error) {
    console.error('Error checking favorite:', error);
    res.status(500).json({
      success: false,
      message: 'Server error',
      error: error.message
    });
  }
});

// =============================================
// API 5: GET FAVORITES COUNT
// =============================================
// Endpoint: GET /api/favorites/count
// Headers: Authorization: Bearer <token>

router.get('/count', auth, async (req, res) => {
  try {
    const userId = req.userId;

    const count = await prisma.favorite.count({
      where: { userId }
    });

    res.json({
      success: true,
      count: count
    });

  } catch (error) {
    console.error('Error counting favorites:', error);
    res.status(500).json({
      success: false,
      message: 'Server error',
      error: error.message
    });
  }
});

module.exports = router;

