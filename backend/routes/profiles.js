const express = require('express');
const router = express.Router();
const prisma = require('../utils/prisma');

// =============================================
// GET ALL PROFILES (with filters)
// =============================================
router.get('/', async (req, res) => {
  try {
    const { 
      gender, 
      minBudget, 
      maxBudget, 
      location, 
      profession,
      lookingFor,
      page = 1,
      limit = 12
    } = req.query;
    
    // Build where clause
    const where = { isActive: true };
    
    if (gender) where.gender = gender;
    if (profession) where.profession = { contains: profession, mode: 'insensitive' };
    if (lookingFor) where.lookingFor = lookingFor;
    
    // Budget filter
    if (minBudget) where.budgetMax = { gte: parseInt(minBudget) };
    if (maxBudget) where.budgetMin = { lte: parseInt(maxBudget) };
    
    const skip = (parseInt(page) - 1) * parseInt(limit);
    
    const [users, total] = await Promise.all([
      prisma.user.findMany({
        where,
        select: {
          id: true,
          name: true,
          email: true,
          profilePicture: true,
          gender: true,
          age: true,
          profession: true,
          occupation: true,
          bio: true,
          budgetMin: true,
          budgetMax: true,
          currency: true,
          lookingFor: true,
          isProfileComplete: true,
          isVerified: true,
          createdAt: true,
          profileDetails: true
        },
        skip,
        take: parseInt(limit),
        orderBy: { createdAt: 'desc' }
      }),
      prisma.user.count({ where })
    ]);
    
    res.json({
      success: true,
      count: users.length,
      total,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        pages: Math.ceil(total / parseInt(limit))
      },
      data: users
    });
    
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Failed to fetch profiles',
      error: error.message
    });
  }
});

// =============================================
// GET SINGLE PROFILE
// =============================================
router.get('/:id', async (req, res) => {
  try {
    const user = await prisma.user.findUnique({
      where: { id: req.params.id },
      select: {
        id: true,
        name: true,
        email: true,
        phone: true,
        profilePicture: true,
        gender: true,
        age: true,
        profession: true,
        occupation: true,
        bio: true,
        budgetMin: true,
        budgetMax: true,
        currency: true,
        lookingFor: true,
        isProfileComplete: true,
        isVerified: true,
        createdAt: true,
        profileDetails: true
      }
    });
    
    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'Profile not found'
      });
    }
    
    res.json({
      success: true,
      data: user
    });
    
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Failed to fetch profile',
      error: error.message
    });
  }
});

// =============================================
// UPDATE PROFILE
// =============================================
router.put('/:id', async (req, res) => {
  try {
    const {
      name,
      phone,
      profilePicture,
      gender,
      age,
      profession,
      occupation,
      bio,
      budgetMin,
      budgetMax,
      lookingFor,
      habits,
      preferredLocations,
      languages,
      interests,
      moveInDate
    } = req.body;
    
    // Update basic user info
    const updateData = {};
    if (name) updateData.name = name;
    if (phone) updateData.phone = phone;
    if (profilePicture) updateData.profilePicture = profilePicture;
    if (gender) updateData.gender = gender;
    if (age) updateData.age = parseInt(age);
    if (profession) updateData.profession = profession;
    if (occupation) updateData.occupation = occupation;
    if (bio) updateData.bio = bio;
    if (budgetMin) updateData.budgetMin = parseInt(budgetMin);
    if (budgetMax) updateData.budgetMax = parseInt(budgetMax);
    if (lookingFor) updateData.lookingFor = lookingFor;
    
    const user = await prisma.user.update({
      where: { id: req.params.id },
      data: updateData,
      select: {
        id: true,
        name: true,
        email: true,
        phone: true,
        profilePicture: true,
        gender: true,
        age: true,
        profession: true,
        occupation: true,
        bio: true,
        budgetMin: true,
        budgetMax: true,
        currency: true,
        lookingFor: true,
        isProfileComplete: true,
        isVerified: true
      }
    });
    
    // Update or create profile details
    if (habits || preferredLocations || languages || interests || moveInDate) {
      await prisma.profileDetails.upsert({
        where: { userId: req.params.id },
        update: {
          habits: habits || undefined,
          preferredLocations: preferredLocations || undefined,
          languages: languages || undefined,
          interests: interests || undefined,
          moveInDate: moveInDate ? new Date(moveInDate) : undefined
        },
        create: {
          userId: req.params.id,
          habits,
          preferredLocations,
          languages,
          interests,
          moveInDate: moveInDate ? new Date(moveInDate) : undefined
        }
      });
    }
    
    res.json({
      success: true,
      message: 'Profile updated successfully',
      data: user
    });
    
  } catch (error) {
    res.status(400).json({
      success: false,
      message: 'Failed to update profile',
      error: error.message
    });
  }
});

// =============================================
// COMPLETE PROFILE
// =============================================
router.post('/:id/complete', async (req, res) => {
  try {
    const {
      gender,
      age,
      profession,
      occupation,
      budgetMin,
      budgetMax,
      bio,
      lookingFor,
      habits,
      preferredLocations,
      languages,
      interests
    } = req.body;
    
    // Update user
    const user = await prisma.user.update({
      where: { id: req.params.id },
      data: {
        gender,
        age: parseInt(age),
        profession,
        occupation,
        budgetMin: parseInt(budgetMin),
        budgetMax: parseInt(budgetMax),
        bio,
        lookingFor,
        isProfileComplete: true
      }
    });
    
    // Create profile details
    await prisma.profileDetails.upsert({
      where: { userId: req.params.id },
      update: {
        habits,
        preferredLocations,
        languages,
        interests
      },
      create: {
        userId: req.params.id,
        habits,
        preferredLocations,
        languages,
        interests
      }
    });
    
    res.json({
      success: true,
      message: 'Profile completed successfully',
      data: user
    });
    
  } catch (error) {
    res.status(400).json({
      success: false,
      message: 'Failed to complete profile',
      error: error.message
    });
  }
});

module.exports = router;
