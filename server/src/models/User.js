import mongoose from 'mongoose';
const schema = new mongoose.Schema({
  username: { type: String, required: true, unique: true, trim: true, minlength: 3, maxlength: 30 },
  email: { type: String, required: true, unique: true, lowercase: true, trim: true },
  passwordHash: { type: String, required: true, select: false },
  role: { type: String, enum: ['admin', 'user'], default: 'user', index: true },
  theme: { type: String, enum: ['dark', 'light'], default: 'dark' },
  preferredLanguage: { type: String, enum: ['javascript', 'python', 'c', 'cpp'], default: 'python' },
}, { timestamps: true });
schema.set('toJSON', { transform: (_d, r) => { delete r.passwordHash; delete r.__v; return r; } });
export default mongoose.model('User', schema);
