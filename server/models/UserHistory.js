const mongoose = require('mongoose');

const UserHistorySchema = new mongoose.Schema(
  {
    userId: {
      type: String,
      required: true,
      index: true,
      default: 'guest', // supports anonymous use until auth is added
    },
    careerRecommended: {
      type: [String],
      required: true,
    },
    skills: {
      type: [String],
      default: [],
    },
    interests: {
      type: String,
      default: '',
    },
    experience: {
      type: String,
      enum: ['beginner', 'intermediate', 'senior', ''],
      default: '',
    },
    matchPercentage: {
      type: Number,
      min: 0,
      max: 100,
      default: null,
    },
    date: {
      type: Date,
      default: Date.now,
    },
  },
  { timestamps: true }
);

module.exports = mongoose.model('UserHistory', UserHistorySchema);
