const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const userSchema = new mongoose.Schema({
  // Basic Information
  name: {
    type: String,
    required: [true, 'Name is required'],
    trim: true
  },
  email: {
    type: String,
    required: [true, 'Email is required'],
    unique: true,
    lowercase: true
  },
  password: {
    type: String,
    required: [true, 'Password is required'],
    minlength: 6,
    select: false
  },
  phone: {
    type: String,
    trim: true
  },
  profilePicture: {
    type: String,
    default: '/uploads/default-avatar.png'
  },
  
  // Personal Details
  gender: {
    type: String,
    enum: ['Male', 'Female', 'Other', 'Prefer not to say'],
    required: true
  },
  age: {
    type: Number,
    min: 18
  },
  profession: {
    type: String,
    required: true,
    trim: true
  },
  bio: {
    type: String,
    maxlength: 500
  },
  
  // Budget & Location Preferences
  budget: {
    min: {
      type: Number,
      required: true
    },
    max: {
      type: Number,
      required: true
    },
    currency: {
      type: String,
      default: 'BDT'
    }
  },
  preferredLocations: [{
    area: String,
    city: String,
    coordinates: {
      lat: Number,
      lng: Number
    }
  }],
  
  // Habits & Lifestyle
  habits: {
    smoking: {
      type: String,
      enum: ['Yes', 'No', 'Occasionally'],
      default: 'No'
    },
    drinking: {
      type: String,
      enum: ['Yes', 'No', 'Socially'],
      default: 'No'
    },
    pets: {
      type: String,
      enum: ['Have pets', 'No pets', 'Pet-friendly'],
      default: 'No pets'
    },
    cleanliness: {
      type: String,
      enum: ['Very clean', 'Moderate', 'Relaxed'],
      default: 'Moderate'
    },
    foodPreference: {
      type: String,
      enum: ['Vegetarian', 'Non-vegetarian', 'Vegan', 'No preference']
    },
    nightOwl: {
      type: Boolean,
      default: false
    },
    guests: {
      type: String,
      enum: ['Frequently', 'Sometimes', 'Rarely', 'Never'],
      default: 'Sometimes'
    }
  },
  
  // Additional Preferences
  lookingFor: {
    type: String,
    enum: ['Room', 'Roommate', 'Both'],
    default: 'Both'
  },
  moveInDate: {
    type: Date
  },
  languages: [String],
  interests: [String],
  occupation: {
    type: String,
    enum: ['Student', 'Working Professional', 'Freelancer', 'Business', 'Other']
  },
  
  // Account Status
  isProfileComplete: {
    type: Boolean,
    default: false
  },
  isVerified: {
    type: Boolean,
    default: false
  },
  isActive: {
    type: Boolean,
    default: true
  },
  
  // Timestamps
  createdAt: {
    type: Date,
    default: Date.now
  },
  updatedAt: {
    type: Date,
    default: Date.now
  }
}, {
  timestamps: true
});

// Hash password before saving
userSchema.pre('save', async function(next) {
  if (!this.isModified('password')) return next();
  
  try {
    const salt = await bcrypt.genSalt(10);
    this.password = await bcrypt.hash(this.password, salt);
    next();
  } catch (error) {
    next(error);
  }
});

// Compare password method
userSchema.methods.comparePassword = async function(candidatePassword) {
  return await bcrypt.compare(candidatePassword, this.password);
};

// Check if profile is complete
userSchema.methods.checkProfileCompletion = function() {
  const requiredFields = [
    this.name,
    this.email,
    this.gender,
    this.profession,
    this.budget.min,
    this.budget.max,
    this.preferredLocations.length > 0
  ];
  
  this.isProfileComplete = requiredFields.every(field => field);
  return this.isProfileComplete;
};

module.exports = mongoose.model('User', userSchema);


