const User = require('../models/User');

// @desc    Get user profile
// @route   GET /api/profile/:userId
// @access  Public
exports.getProfile = async (req, res) => {
  try {
    const user = await User.findById(req.params.userId).select('-password');
    
    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }
    
    res.status(200).json({
      success: true,
      data: user
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Server error',
      error: error.message
    });
  }
};

// @desc    Create user profile
// @route   POST /api/profile
// @access  Public
exports.createProfile = async (req, res) => {
  try {
    const { email } = req.body;
    
    // Check if user already exists
    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return res.status(400).json({
        success: false,
        message: 'User with this email already exists'
      });
    }
    
    // Create new user
    const user = await User.create(req.body);
    
    // Check profile completion
    user.checkProfileCompletion();
    await user.save();
    
    // Remove password from response
    user.password = undefined;
    
    res.status(201).json({
      success: true,
      message: 'Profile created successfully',
      data: user
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Failed to create profile',
      error: error.message
    });
  }
};

// @desc    Update user profile
// @route   PUT /api/profile/:userId
// @access  Private
exports.updateProfile = async (req, res) => {
  try {
    const { userId } = req.params;
    
    // Don't allow password update through this route
    delete req.body.password;
    
    const user = await User.findByIdAndUpdate(
      userId,
      { ...req.body, updatedAt: Date.now() },
      { new: true, runValidators: true }
    ).select('-password');
    
    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }
    
    // Check profile completion
    user.checkProfileCompletion();
    await user.save();
    
    res.status(200).json({
      success: true,
      message: 'Profile updated successfully',
      data: user
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Failed to update profile',
      error: error.message
    });
  }
};

// @desc    Delete user profile
// @route   DELETE /api/profile/:userId
// @access  Private
exports.deleteProfile = async (req, res) => {
  try {
    const user = await User.findByIdAndDelete(req.params.userId);
    
    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }
    
    res.status(200).json({
      success: true,
      message: 'Profile deleted successfully'
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Failed to delete profile',
      error: error.message
    });
  }
};

// @desc    Get all profiles (with filters)
// @route   GET /api/profiles
// @access  Public
exports.getAllProfiles = async (req, res) => {
  try {
    const { 
      gender, 
      minBudget, 
      maxBudget, 
      location, 
      profession,
      page = 1,
      limit = 10 
    } = req.query;
    
    // Build query
    let query = { isActive: true };
    
    if (gender) query.gender = gender;
    if (profession) query.profession = new RegExp(profession, 'i');
    if (location) query['preferredLocations.area'] = new RegExp(location, 'i');
    
    if (minBudget || maxBudget) {
      query['budget.max'] = {};
      if (minBudget) query['budget.max'].$gte = Number(minBudget);
      if (maxBudget) query['budget.max'].$lte = Number(maxBudget);
    }
    
    // Execute query with pagination
    const users = await User.find(query)
      .select('-password')
      .limit(limit * 1)
      .skip((page - 1) * limit)
      .sort({ createdAt: -1 });
    
    const count = await User.countDocuments(query);
    
    res.status(200).json({
      success: true,
      data: users,
      totalPages: Math.ceil(count / limit),
      currentPage: page,
      total: count
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Server error',
      error: error.message
    });
  }
};

