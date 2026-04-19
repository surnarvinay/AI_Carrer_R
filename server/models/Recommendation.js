const mongoose = require('mongoose');

const RecommendationSchema = new mongoose.Schema({
  skills: [String],
  interests: String,
  experience: String,
  careers: [String],
  createdAt: { type: Date, default: Date.now }
});

module.exports = mongoose.model('Recommendation', RecommendationSchema);
