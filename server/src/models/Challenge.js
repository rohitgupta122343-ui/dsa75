import mongoose from 'mongoose';
// Singleton document describing the 75-day window.
export default mongoose.model('Challenge', new mongoose.Schema({
  key: { type: String, default: 'main', unique: true },
  startDate: { type: String, required: true, match: /^\d{4}-\d{2}-\d{2}$/ },
  timezone: { type: String, default: 'UTC' },
  totalDays: { type: Number, default: 75 },
}, { timestamps: true }));
