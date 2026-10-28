import mongoose from 'mongoose';
// One row per (user, question), written on the FIRST Accepted verdict only.
// The unique index makes duplicate accepts impossible to double count; solved counts and streaks derive from this.
const schema = new mongoose.Schema({
  user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  question: { type: mongoose.Schema.Types.ObjectId, ref: 'Question', required: true },
  submission: { type: mongoose.Schema.Types.ObjectId, ref: 'Submission' },
  dayKey: { type: String, required: true },
  solvedAt: { type: Date, required: true },
}, { timestamps: true });
schema.index({ user: 1, question: 1 }, { unique: true });
schema.index({ user: 1, dayKey: 1 });
export default mongoose.model('DailyProgress', schema);
