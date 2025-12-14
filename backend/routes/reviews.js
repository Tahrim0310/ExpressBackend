const express = require('express');
const router = express.Router();
const prisma = require('../utils/prisma');
const auth = require('../middleware/auth');

router.get('/test', (req, res) => {
  res.json({ message: 'Reviews route is working!' });
});

// =============================================
// API 1: CREATE A REVIEW
// =============================================
// Endpoint: POST /api/reviews
// Headers: Authorization: Bearer <token>
// Body: { "listingId": "string", "rating": 1-5, "comment": "string" }

router.post('/', auth, async (req, res) => {
  try {
    const { listingId, rating, comment } = req.body;
    const userId = req.userId;

    // Validation
    if (!listingId || !rating || !comment) {
      return res.status(400).json({
        success: false,
        message: 'Please provide listingId, rating, and comment'
      });
    }

    if (rating < 1 || rating > 5) {
      return res.status(400).json({
        success: false,
        message: 'Rating must be between 1 and 5'
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

    // Check if user already reviewed this listing
    const existingReview = await prisma.review.findFirst({
      where: {
        userId: userId,
        listingId: listingId
      }
    });

    if (existingReview) {
      return res.status(400).json({
        success: false,
        message: 'You have already reviewed this listing'
      });
    }

    // Create review
    const review = await prisma.review.create({
      data: {
        rating: parseInt(rating),
        comment,
        listingId,
        userId
      },
      include: {
        user: {
          select: {
            id: true,
            name: true,
            email: true,
            avatar: true
          }
        }
      }
    });

    res.status(201).json({
      success: true,
      message: 'Review created successfully',
      data: review
    });

  } catch (error) {
    console.error('Error creating review:', error);
    res.status(500).json({
      success: false,
      message: 'Server error',
      error: error.message
    });
  }
});

// =============================================
// API 2: GET ALL REVIEWS FOR A LISTING
// =============================================
// Endpoint: GET /api/reviews/listing/:listingId
// Headers: None required

router.get('/listing/:listingId', async (req, res) => {
  try {
    const { listingId } = req.params;

    const reviews = await prisma.review.findMany({
      where: { listingId },
      include: {
        user: {
          select: {
            id: true,
            name: true,
            email: true,
            avatar: true
          }
        }
      },
      orderBy: {
        createdAt: 'desc'
      }
    });

    // Calculate average rating
    const averageRating = reviews.length > 0
      ? reviews.reduce((sum, review) => sum + review.rating, 0) / reviews.length
      : 0;

    res.json({
      success: true,
      data: {
        reviews,
        totalReviews: reviews.length,
        averageRating: averageRating.toFixed(1)
      }
    });

  } catch (error) {
    console.error('Error fetching reviews:', error);
    res.status(500).json({
      success: false,
      message: 'Server error',
      error: error.message
    });
  }
});

// =============================================
// API 3: UPDATE A REVIEW
// =============================================
// Endpoint: PUT /api/reviews/:reviewId
// Headers: Authorization: Bearer <token>
// Body: { "rating": 1-5, "comment": "string" }

router.put('/:reviewId', auth, async (req, res) => {
  try {
    const { reviewId } = req.params;
    const { rating, comment } = req.body;
    const userId = req.userId;

    // Check if review exists and belongs to user
    const review = await prisma.review.findUnique({
      where: { id: reviewId }
    });

    if (!review) {
      return res.status(404).json({
        success: false,
        message: 'Review not found'
      });
    }

    if (review.userId !== userId) {
      return res.status(403).json({
        success: false,
        message: 'You can only update your own reviews'
      });
    }

    // Update review
    const updatedReview = await prisma.review.update({
      where: { id: reviewId },
      data: {
        ...(rating && { rating: parseInt(rating) }),
        ...(comment && { comment })
      },
      include: {
        user: {
          select: {
            id: true,
            name: true,
            email: true,
            avatar: true
          }
        }
      }
    });

    res.json({
      success: true,
      message: 'Review updated successfully',
      data: updatedReview
    });

  } catch (error) {
    console.error('Error updating review:', error);
    res.status(500).json({
      success: false,
      message: 'Server error',
      error: error.message
    });
  }
});

// =============================================
// API 4: DELETE A REVIEW
// =============================================
// Endpoint: DELETE /api/reviews/:reviewId
// Headers: Authorization: Bearer <token>

router.delete('/:reviewId', auth, async (req, res) => {
  try {
    const { reviewId } = req.params;
    const userId = req.userId;

    // Check if review exists and belongs to user
    const review = await prisma.review.findUnique({
      where: { id: reviewId }
    });

    if (!review) {
      return res.status(404).json({
        success: false,
        message: 'Review not found'
      });
    }

    if (review.userId !== userId) {
      return res.status(403).json({
        success: false,
        message: 'You can only delete your own reviews'
      });
    }

    // Delete review
    await prisma.review.delete({
      where: { id: reviewId }
    });

    res.json({
      success: true,
      message: 'Review deleted successfully'
    });

  } catch (error) {
    console.error('Error deleting review:', error);
    res.status(500).json({
      success: false,
      message: 'Server error',
      error: error.message
    });
  }
});

// =============================================
// API 5: GET USER'S OWN REVIEWS
// =============================================
// Endpoint: GET /api/reviews/my-reviews
// Headers: Authorization: Bearer <token>

router.get('/my-reviews', auth, async (req, res) => {
  try {
    const userId = req.userId;

    const reviews = await prisma.review.findMany({
      where: { userId },
      include: {
        listing: {
          select: {
            id: true,
            title: true,
            location: true,
            images: true
          }
        }
      },
      orderBy: {
        createdAt: 'desc'
      }
    });

    res.json({
      success: true,
      data: reviews
    });

  } catch (error) {
    console.error('Error fetching user reviews:', error);
    res.status(500).json({
      success: false,
      message: 'Server error',
      error: error.message
    });
  }
});

module.exports = router;
