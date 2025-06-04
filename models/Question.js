import mongoose from 'mongoose';

const questionSchema = new mongoose.Schema({
  text: {
    type: String,
    required: true,
    trim: true
  },  options: {
    A: {
      type: String,
      required: true,
      trim: true
    },
    B: {
      type: String,
      required: true,
      trim: true
    }
  },
  category: {
    type: String,
    enum: ['general', 'lifestyle', 'food', 'entertainment', 'hypothetical', 'preferences'],
    default: 'general'
  },
  difficulty: {
    type: String,
    enum: ['easy', 'medium', 'hard'],
    default: 'medium'
  },
  tags: [{
    type: String,
    trim: true
  }],
  isActive: {
    type: Boolean,
    default: true
  },
  usageCount: {
    type: Number,
    default: 0
  },
  createdBy: {
    type: String,
    default: 'admin'
  },
  createdAt: {
    type: Date,
    default: Date.now
  },
  updatedAt: {
    type: Date,
    default: Date.now
  }
});

// Update the updatedAt field before saving
questionSchema.pre('save', function() {
  this.updatedAt = new Date();
});

// Get random questions excluding used ones
questionSchema.statics.getRandomQuestions = async function(count = 1, excludeIds = [], category = null) {
  const filter = {
    isActive: true,
    _id: { $nin: excludeIds }
  };
  
  if (category) {
    filter.category = category;
  }
  
  const questions = await this.aggregate([
    { $match: filter },
    { $sample: { size: count * 2 } }, // Get more than needed to ensure we have enough
    { $limit: count }
  ]);
  
  return questions;
};

// Increment usage count
questionSchema.methods.incrementUsage = function() {
  this.usageCount += 1;
  return this.save();
};

export default mongoose.model('Question', questionSchema);
